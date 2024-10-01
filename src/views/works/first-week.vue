<template>
  <canvas ref="canvasRef" class="w-full h-full"/>
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
  </div>
</template>

<script setup lang="ts">
import {useTemplateRef} from "vue";
import {Ray} from "@/core/ray";
import {Vec3} from "@/core/vec";
import {type Color, drawPixel} from "@/core/color";
import {useFps, useResizeObserver} from "@vueuse/core";
import {HitList, Sphere} from "@/core/object";

const canvasRef = useTemplateRef<HTMLCanvasElement | null>('canvasRef')
const fps = useFps()

useResizeObserver(() => document.querySelector('body'), () => render())

const MAX_LIGHT_BOUNCES = 3
const cameraOrigin = new Vec3(0, 0, 0)
const cameraFov = 90

const render = () => {
  const canvas = canvasRef.value
  if (canvas) {
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No context')
    draw(ctx, canvas.width, canvas.height)
  }
}

const draw = async (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  const aspectRatio = width / height

  // 计算viewport
  const viewportHeight = 2.0
  const viewportWidth = aspectRatio * viewportHeight

  const focalLength = 1

  const viewport_horizontal = new Vec3(viewportWidth, 0, 0)
  const viewport_vertical = new Vec3(0, -viewportHeight, 0)

  const viewportUpperLeft = cameraOrigin
      .add(new Vec3(0, 0, focalLength))
      .sub(viewport_horizontal.div(2))
      .sub(viewport_vertical.div(2))
  console.log('view_port_upper_left', viewportUpperLeft)

  const pixelHorizontal = viewport_horizontal.div(width)
  const pixelVertical = viewport_vertical.div(height)
  const pixel00Loc = viewportUpperLeft
      .add(pixelHorizontal.mul(0.5))
      .add(pixelVertical.mul(0.5))
  console.log('pixel00Loc', pixel00Loc)

  const samplesPerPixel = 1

  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const pixelCenter = pixel00Loc
          .add(pixelHorizontal.mul(i))
          .add(pixelVertical.mul(j))

      let color = new Vec3(0, 0, 0)
      for (let k = 0; k < samplesPerPixel; k++) {
        const rayDir = pixelCenter
            .add(pixelHorizontal.mul(Math.random() - 0.5))
            .add(pixelVertical.mul(Math.random() - 0.5))
            .sub(cameraOrigin)
            .normalize()
        const ray = new Ray(cameraOrigin, rayDir)
        const c = rayTrace(ray, 0)
        color = color.add(c)
      }
      drawPixel(ctx, i, j, color.div(samplesPerPixel))
    }

    // 让出线程
    if (i % 100 === 0) await new Promise(resolve => setTimeout(resolve, 0))
  }
}


const hittables = new HitList([
    new Sphere(new Vec3(0, 0, 2), 0.5),
    new Sphere(new Vec3(0, -100.5, 2), 100),
])

const rayTrace = (ray: Ray, depth: number): Color => {
  if (depth > MAX_LIGHT_BOUNCES) return new Vec3(0, 0, 0)

  const hitRecord = hittables.hit(ray, 0.001, Number.MAX_VALUE)
  if (hitRecord) {
    return hitRecord.normal.add(new Vec3(1, 1, 1)).mul(0.5)
  }

  const a = 0.5 * (ray.getDirection().y + 1.0)
  return new Vec3(1.0, 1.0, 1.0).mul(1.0 - a).add(new Vec3(0.5, 0.7, 1.0).mul(a));
}
</script>
