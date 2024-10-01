import type {Vec3} from "@/core/vec";

export type Color = Vec3

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
    if (gamma) {
        const gammaCorrected = (value: number) => {
            if (value <= 0) return 0
            return Math.pow(value, 1 / 2.2)
        }
        color.x = gammaCorrected(color.x)
        color.y = gammaCorrected(color.y)
        color.z = gammaCorrected(color.z)
    }

    ctx.fillStyle = `rgb(${color.x * 255}, ${color.y * 255}, ${color.z * 255})`
    ctx.fillRect(x, y, 1, 1)
}
