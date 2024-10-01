import {type Hittable} from "@/core/object";
import {Vec3} from "@/core/vec";
import {Ray} from "@/core/ray";
import {type Color, drawPixel} from "@/core/color";
import {Interval} from "@/core/interval";

export class Camera {
    private readonly cameraOrigin: Vec3;
    private readonly options: RenderOptions;
    private readonly height: number;
    private readonly width: number;
    private readonly pixelHorizontal: Vec3;
    private readonly pixelVertical: Vec3;
    private readonly pixel00Loc: Vec3;

    constructor(width: number, height: number, cameraOrigin: Vec3, options: RenderOptions) {
        this.width = width
        this.height = height
        this.cameraOrigin = cameraOrigin
        this.options = options

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

        this.pixelHorizontal = viewport_horizontal.div(width)
        this.pixelVertical = viewport_vertical.div(height)
        this.pixel00Loc = viewportUpperLeft
            .add(this.pixelHorizontal.mul(0.5))
            .add(this.pixelVertical.mul(0.5))
    }


    render(
        ctx: CanvasRenderingContext2D,
        world: Hittable,
    ): AbortController {
        const abortController = new AbortController();
        const batchSize = 32

        const renderBatch = async (start: number, step: number) => {
            for (let i = start; i < this.width; i += step) {
                if (abortController.signal.aborted) break;
                for (let j = start; j < this.height; j += step) {
                    if (abortController.signal.aborted) break;
                    const pixelCenter = this.pixel00Loc
                        .add(this.pixelHorizontal.mul(i))
                        .add(this.pixelVertical.mul(j));

                    let color = new Vec3(0, 0, 0);
                    for (let k = 0; k < this.options.samplesPerPixel; k++) {
                        const rayDir = pixelCenter
                            .add(this.pixelHorizontal.mul(Math.random() - 0.5))
                            .add(this.pixelVertical.mul(Math.random() - 0.5))
                            .sub(this.cameraOrigin)
                            .normalize();
                        const ray = new Ray(this.cameraOrigin, rayDir);
                        const c = this.rayTrace(ray, world, 0);
                        color = color.add(c);
                    }
                    drawPixel(ctx, i, j, color.div(this.options.samplesPerPixel));
                }

                if (i % batchSize === 0) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
        };

        const progressiveRender = async () => {
            let step = 3; // 初始步长
            while (step > 0) {
                await renderBatch(0, step);
                step = Math.floor(step / 2); // 每次将步长减半
            }
            console.log('render complete');
            console.table([{
                width: this.width,
                height: this.height,
                samplesPerPixel: this.options.samplesPerPixel,
                maxDepth: this.options.maxDepth
            }]);
        };

        progressiveRender().then(() => {});

        return abortController;
    }
    private rayTrace(ray: Ray, world: Hittable, depth: number): Color {
        if (depth > this.options.maxDepth) return new Vec3(0, 0, 0)

        const hitRecord = world.hit(ray, new Interval(0.01, Infinity))
        if (hitRecord) {
            const scatterResult = hitRecord.material.scatter(ray, hitRecord)
            if (scatterResult) {
                const attenuation = scatterResult.attenuation
                const scattered = scatterResult.scattered
                if (scattered) {
                    const light = this.rayTrace(scattered, world, depth + 1)
                    return attenuation.mul(light)
                } else {
                    return new Vec3(0, 0, 0)
                }
            }
        }

        // fake sky
        const a = 0.5 * (ray.getDirection().y + 1.0)
        return new Vec3(1.0, 1.0, 1.0).mul(1.0 - a).add(new Vec3(0.5, 0.7, 1.0).mul(a));
    }
}


export interface RenderOptions {
    samplesPerPixel: number;
    maxDepth: number;
}
