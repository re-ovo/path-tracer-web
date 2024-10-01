<template>
  <canvas ref="canvasRef" class="w-full h-full bg-black"/>
  <div class="absolute top-0 left-0 m-8 backdrop-blur-lg text-white bg-white/20 p-4 rounded-sm flex flex-col gap-2">
    <div class="color-green-5 text-sm">
      FPS: {{ fps }}
    </div>

    <button
        @click="render"
        class="bg-blue-600 border-none text-white rounded-md cursor-pointer hover:bg-blue-700 active:bg-blue-800 px-2 py-1"
    >
      <span class="text-md font-medium">Render</span>
    </button>

    <button
        @click="cancel"
        class="bg-red-600 border-none text-white rounded-md cursor-pointer hover:bg-red-700 active:bg-red-800 px-2 py-1"
        v-if="isRendering"
    >
      <span class="text-md font-medium">Cancel</span>
    </button>

    <div class="flex flex-col gap-2">
      <label for="samplesPerPixel">Samples per pixel:</label>
      <input type="number" v-model="samplesPerPixel"/>
      <label for="maxDepth">Max depth:</label>
      <input type="number" v-model="maxDepth"/>
    </div>
  </div>
</template>

<script setup lang="ts">
import {computed, type Ref, ref, useTemplateRef} from "vue";
import {Vec3} from "@/core/vec";
import {useEventListener, useFps, useResizeObserver} from "@vueuse/core";
import {HitList, Sphere} from "@/core/object";
import {Camera} from "@/core/camera";
import {Dielectric, Lambertian, Metal} from "@/core/material";

const fps = useFps()

const canvasRef = useTemplateRef<HTMLCanvasElement | null>('canvasRef')
let camera: Camera | null = null

const hittables = new HitList([
  new Sphere(
      new Vec3(0.5, 0, 2.5),
      0.5,
      new Lambertian(new Vec3(0.8, 0.6, 0.2)),
  ),
  new Sphere(
      new Vec3(-0.5, 0, 2),
      0.5,
      new Lambertian(new Vec3(0.1, 0.2, 0.5)),
  ),
  new Sphere(
      new Vec3(0, 0, 1.5),
      0.5,
      new Dielectric(1.51),
  ),
  new Sphere(
      new Vec3(0, -100.5, 2),
      100,
      new Lambertian(new Vec3(0.8, 0.8, 0.8)),
  ),
])

const cameraPosition = new Vec3(0, 0, 0)

const samplesPerPixel = ref(6)
const maxDepth = ref(6)

let currentRendering: Ref<AbortController | null> = ref(null)

const render = () => {
  const canvas = canvasRef.value
  if (canvas) {
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No context')
    camera = new Camera(
        canvas.width,
        canvas.height,
        cameraPosition,
        {
          samplesPerPixel: samplesPerPixel.value,
          maxDepth: maxDepth.value
        },
    )
    currentRendering.value?.abort()
    currentRendering.value = camera.render(ctx, hittables)
  }
}
const cancel = () => {
  currentRendering.value?.abort()
  currentRendering.value = null
}
const isRendering = computed(() => {
  if (currentRendering.value) return !currentRendering.value.signal.aborted
  return false
})

useEventListener('keypress', ev => {
  switch (ev.key) {
    case 'r':
      render()
      break

    case 'w':
      cameraPosition.z += 0.1
      render()
      break

    case 's':
      cameraPosition.z -= 0.1
      render()
      break

    case 'a':
      cameraPosition.x -= 0.1
      render()
      break

    case 'd':
      cameraPosition.x += 0.1
      render()
      break

    case 'q':
      cameraPosition.y += 0.1
      render()
      break

    case 'e':
      cameraPosition.y -= 0.1
      render()
      break
  }
})
</script>
