import type {Color} from "@/core/color";
import {Vec3} from "@/core/vec";

export interface Texture {
    /**
     * Returns the color at the given u, v coordinates.
     *
     * @param u the u coordinate
     * @param v the v coordinate
     * @param p the point
     */
    value(u: number, v: number, p: Vec3): Color;
}

export class SolidColor implements Texture {
    private readonly color: Color;

    constructor(color: Color) {
        this.color = color;
    }

    value(u: number, v: number, p: Vec3): Color {
        return this.color;
    }
}

export class ImageTexture implements Texture {
    private data: ImageData | null = null;

    constructor(path: string) {
        const img = new Image();
        img.onload = () => {
            const ctx = document.createElement("canvas").getContext("2d");
            ctx!.drawImage(img, 0, 0);
            this.data = ctx!.getImageData(0, 0, img.width, img.height);
        }
        img.src = path;
    }

    value(u: number, v: number, p: Vec3): Color {
        if (this.data === null) return new Vec3(0, 0, 0);

        const uClamped = Math.min(Math.max(u, 0), 1);
        const vClamped = Math.min(Math.max(v, 0), 1);

        const i = Math.floor(uClamped * this.data.width);
        const j = Math.floor(vClamped * this.data.height);
        const index = (j * this.data.width + i) * 4;

        const pixel = this.data.data;
        return new Vec3(pixel[index] / 255, pixel[index + 1] / 255, pixel[index + 2] / 255);
    }
}
