<template>
  <canvas ref="canvasRef" class="w-full h-full bg-black" />
  <div
    class="absolute top-8rem left-0 m-8 backdrop-blur-lg bg-white/20 p-4 rounded-sm flex flex-col gap-2"
  >
    <div class="color-green-5 text-sm">FPS: {{ fps }}</div>

    <NButton type="primary" @click="render">
      <span class="text-md font-medium">Render</span>
    </NButton>

    <NButton type="error" @click="cancel" v-if="isRendering">
      <span class="text-md font-medium">Cancel</span>
    </NButton>

    <div class="flex flex-col gap-2 max-w-[12rem] color-black">
      <p class="control-area">
        <label>BVH加速</label>
        <input type="checkbox" v-model="useBVH" />
        {{ useBVH }}
      </p>
      <p class="control-area">
        <label for="samplesPerPixel">Samples per pixel:</label>
        <NInputNumber v-model:value="cameraOptions.samplesPerPixel" />
        <label for="maxDepth">Max depth:</label>
        <NInputNumber v-model:value="cameraOptions.maxDepth" />
      </p>
      <p class="control-area">
        <label for="focusDist">Focus distance:</label>
        <NInputNumber v-model:value="cameraOptions.focusDist" />
        <label for="defocusAngle">Defocus angle:</label>
        <NInputNumber v-model:value="cameraOptions.defocusAngle" />
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { BVHNode } from '@/core/bvh';
import { Camera } from '@/core/camera';
import { Dielectric, DiffuseLight, Lambertian, Metal } from '@/core/material';
import { HitList, type Hittable, Quad, Sphere } from '@/core/object';
import { ImageTexture } from '@/core/texture';
import { Vec3 } from '@/core/vec';
import { useEventListener, useFps } from '@vueuse/core';
import { NButton, NInputNumber } from 'naive-ui';
import {
  computed,
  isProxy,
  onUnmounted,
  type Ref,
  ref,
  toRaw,
  toValue,
  unref,
  useTemplateRef,
} from 'vue';

const fps = useFps();

const canvasRef = useTemplateRef<HTMLCanvasElement | null>('canvasRef');
let camera: Camera | null = null;

let cameraPosition = new Vec3(0.5, 0.55, -0.6);
const cameraLookAt = new Vec3(0.5, 0.5, 0.5);

const cameraOptions = ref({
  samplesPerPixel: 32,
  maxDepth: 6,
  vFov: 75,
  defocusAngle: 0.0,
  focusDist: 1.0,
});

let currentRendering: Ref<AbortController | null> = ref(null);

const wallMaterial = new Lambertian(new Vec3(0.8, 0.8, 0.8));

const hittables: Hittable[] = [
  // ground
  new Quad(
    new Vec3(0, 0, 0),
    new Vec3(0, 0, 1),
    new Vec3(1, 0, 0),
    wallMaterial,
  ),
  // ceil
  new Quad(
    new Vec3(0, 1, 0),
    new Vec3(1, 0, 0),
    new Vec3(0, 0, 1),
    wallMaterial,
  ),
  // ceil light
  new Quad(
    new Vec3(0.3, 0.995, 0.3),
    new Vec3(0.4, 0, 0),
    new Vec3(0, 0, 0.4),
    new DiffuseLight(new Vec3(15, 15, 15)),
  ),
  // walls
  new Quad(
    new Vec3(0, 0, 0),
    new Vec3(0, 1, 0),
    new Vec3(0, 0, 1),
    new Lambertian(new Vec3(0.8, 0, 0)),
  ),
  new Quad(
    new Vec3(1, 0, 0),
    new Vec3(0, 1, 0),
    new Vec3(0, 0, 1),
    new Lambertian(new Vec3(0, 0.8, 0)),
  ),
  new Quad(
    new Vec3(0, 0, 1),
    new Vec3(0, 1, 0),
    new Vec3(1, 0, 0),
    wallMaterial,
  ),
  // objects
  new Sphere(
    new Vec3(0.8, 0.15, 0.3),
    0.15,
    new Lambertian(new ImageTexture('/2k_earth_daymap.jpg')),
  ),
  new Sphere(
    new Vec3(0.5, 0.5, 0.5),
    0.2,
    new Metal(new Vec3(0.5, 0.5, 0.5), 0.1),
  ),
  new Sphere(new Vec3(0.23, 0.2, 0.3), 0.2, new Dielectric(1.5)),
  ...Quad.createCube(
    new Vec3(0.5, 0.06, 0.5),
    0.12,
    0.12,
    0.12,
    new Metal(new Vec3(0.5, 0.5, 0.5), 0.1),
  ),
];

// 随机创建球体
const amount = 0;
for (let i = 0; i < amount; i++) {
  const center = new Vec3(
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
    Math.random() * 2 - 1,
  );
  const radius = Math.random() * 0.2 + 0.1;
  const chooseMaterial = Math.random();
  if (chooseMaterial < 0.5) {
    hittables.push(
      new Sphere(
        center,
        radius,
        new Lambertian(new Vec3(Math.random(), Math.random(), Math.random())),
      ),
    );
  } else if (chooseMaterial < 0.8) {
    hittables.push(
      new Sphere(
        center,
        radius,
        new Metal(new Vec3(Math.random(), Math.random(), Math.random()), 0.1),
      ),
    );
  } else {
    hittables.push(new Sphere(center, radius, new Dielectric(1.5)));
  }
}
const useBVH = ref<boolean>(true);
const world = computed(() => {
  return useBVH.value
    ? new BVHNode(hittables, 0, hittables.length)
    : new HitList(hittables);
});

const render = () => {
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.width = canvas.clientWidth;
    canvas.height = canvas.clientHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('No context');
    camera = new Camera(
      canvas.width,
      canvas.height,
      cameraPosition,
      cameraLookAt,
      cameraOptions.value,
    );
    currentRendering.value?.abort();
    currentRendering.value = camera.render(ctx, world.value);
    currentRendering.value.signal.onabort = () => {
      currentRendering.value = null;
    };
  }
};
const cancel = () => {
  currentRendering.value?.abort();
  currentRendering.value = null;
  camera = null;
};
onUnmounted(cancel);
const isRendering = computed(() => {
  if (currentRendering.value) return !currentRendering.value.signal.aborted;
  return false;
});

useEventListener('keypress', (ev) => {
  if (!camera) return;
  switch (ev.key) {
    case 'r':
      render();
      break;

    case 'w':
      cameraPosition = cameraPosition.add(camera.w.mul(0.2));
      render();
      break;

    case 's':
      cameraPosition = cameraPosition.add(camera.w.mul(-0.2));
      render();
      break;

    case 'a':
      cameraPosition = cameraPosition.add(camera.u.mul(-0.1));
      render();
      break;

    case 'd':
      cameraPosition = cameraPosition.add(camera.u.mul(0.1));
      render();
      break;

    case 'q':
      cameraPosition.y += 0.1;
      render();
      break;

    case 'e':
      cameraPosition.y -= 0.1;
      render();
      break;
  }
  ev.preventDefault();
  ev.stopPropagation();
  console.log(
    'cameraPos',
    cameraPosition.x,
    cameraPosition.y,
    cameraPosition.z,
  );
});
</script>

<style scoped>
p.control-area {
  border: 1px solid #202020;
  padding: 4px;
  border-radius: 4px;
  margin: 0;
}
</style>
