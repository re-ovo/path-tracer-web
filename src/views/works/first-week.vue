<template>
  <canvas ref="canvasRef" class="w-full h-full"/>
</template>

<script setup lang="ts">
import {onMounted, useTemplateRef} from "vue";
import {Ray} from "@/core/ray";
import {Vec3} from "@/core/vec";
import {drawPixel} from "@/core/color";

const canvasRef = useTemplateRef<HTMLCanvasElement | null>('canvasRef')

onMounted(() => {
  const canvas = canvasRef.value
  if (canvas) {
    canvas.width = canvas.clientWidth
    canvas.height = canvas.clientHeight

    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('No context')
    draw(ctx, canvas.width, canvas.height)
  }
})

const MAX_LIGHT_BOUNCES = 3

const draw = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
  for (let i = 0; i < width; i++) {
    for (let j = 0; j < height; j++) {
      const u = i / width
      const v = j / height

      const ray = new Ray(new Vec3(0, 0, 0), new Vec3(u, v, 1).normalize())
      const color = rayTrace(ray, 0)
      drawPixel(ctx, i, j, color)
    }
  }
}

const rayTrace = (ray: Ray, depth: number): Vec3 => {
  if (depth > MAX_LIGHT_BOUNCES) return new Vec3(0, 0, 0)

  const t = 0.5 * (ray.getDirection().y + 1)
  return Vec3.lerp(new Vec3(1, 1, 1), new Vec3(0.5, 0.7, 1.0), t)
}
</script>
