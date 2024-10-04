import type {Vec3} from "@/core/vec";

export type Color = Vec3

const gammaCorrected = (value: number) => {
    if (value <= 0) return 0
    return Math.pow(value, 1 / 2.2)
}

/**
 * Draws a pixel on the canvas
 *
 * @param ctx the canvas context
 * @param x the x coordinate
 * @param y the y coordinate
 * @param color the color vector of the pixel(RGB in range [0, 1])
 * @param gamma whether to apply gamma correction
 */
export const drawPixel = (ctx: CanvasRenderingContext2D, x: number, y: number, color: Vec3, gamma: boolean = true) => {
    if(color.x != color.x) color.x = 0
    if(color.y != color.y) color.y = 0
    if(color.z != color.z) color.z = 0

    if (gamma) {
        color.x = gammaCorrected(color.x)
        color.y = gammaCorrected(color.y)
        color.z = gammaCorrected(color.z)
    }

    color.x = Math.min(color.x, 1)
    color.y = Math.min(color.y, 1)
    color.z = Math.min(color.z, 1)

    ctx.fillStyle = `rgb(${color.x * 255}, ${color.y * 255}, ${color.z * 255})`
    ctx.fillRect(x, y, 1, 1)
}
