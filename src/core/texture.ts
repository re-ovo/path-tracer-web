import type { Color } from '@/core/color';
import { Vec3 } from '@/core/vec';

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
      const ctx = document.createElement('canvas').getContext('2d');
      ctx!.canvas.width = img.width;
      ctx!.canvas.height = img.height;
      ctx!.drawImage(img, 0, 0);
      this.data = ctx!.getImageData(0, 0, img.width, img.height);
    };
    img.src = path;
  }

  getPixelAt(x: number, y: number): Color {
    const index = (y * this.data!.width + x) * 4;
    return new Vec3(
      this.data!.data[index] / 255,
      this.data!.data[index + 1] / 255,
      this.data!.data[index + 2] / 255,
    );
  }

  uvRepeat(value: number): number {
    // repeat uv at 0 to 1
    return value - Math.floor(value);
  }

  value(u: number, v: number, p: Vec3): Color {
    if (this.data === null) return new Vec3(1, 0, 0);

    const uClamped = this.uvRepeat(u);
    const vClamped = this.uvRepeat(v * -1); // flip v

    const i = Math.floor(uClamped * this.data.width);
    const j = Math.floor(vClamped * this.data.height);

    return this.getPixelAt(i, j);
  }
}
