import {Vec3} from "@/core/vec";

/**
 * Draws a pixel on the canvas
 *
 * @param ctx the canvas context
 * @param x the x coordinate
 * @param y the y coordinate
 * @param color the color vector of the pixel(RGB in range [0, 1])
 */
export const drawPixel = (ctx: CanvasRenderingContext2D, x: number, y: number, color: Vec3) => {
    ctx.fillStyle = `rgb(${color.x * 255}, ${color.y * 255}, ${color.z * 255})`
    ctx.fillRect(x, y, 1, 1)
}
