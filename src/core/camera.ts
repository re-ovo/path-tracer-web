import {type Hittable} from "@/core/object";
import {randomInUnitDisk, Vec3} from "@/core/vec";
import {Ray} from "@/core/ray";
import {type Color, drawPixel} from "@/core/color";
import {Interval} from "@/core/interval";

const up = new Vec3(0, 1, 0)

export class Camera {
    private readonly cameraOrigin: Vec3;
    private readonly lookAt: Vec3;
    private readonly options: RenderOptions;
    private readonly height: number;
    private readonly width: number;

    private readonly pixelHorizontal: Vec3;
    private readonly pixelVertical: Vec3;
    private readonly pixel00Loc: Vec3;

    private readonly defocusDiskU: Vec3;
    private readonly defocusDiskV: Vec3;

    readonly w: Vec3
    readonly u: Vec3
    readonly v: Vec3

    constructor(
        width: number,
        height: number,
        cameraOrigin: Vec3,
        cameraLookAt: Vec3,
        options: RenderOptions,
    ) {
        this.width = width
        this.height = height
        this.cameraOrigin = cameraOrigin
        this.lookAt = cameraLookAt
        this.options = options

        const aspectRatio = width / height

        // 计算viewport
        // tan(vfov / 2) = 对边 / 邻边 = 1/2h / focalLength
        // h = 2*tan(vfov / 2)*focalLength
        const degreeToRadian = (degree: number) => degree * Math.PI / 180

        const viewportHeight = 2.0 * options.focusDist * Math.tan(degreeToRadian(options.vFov) / 2)
        const viewportWidth = aspectRatio * viewportHeight

        const w = cameraLookAt.sub(cameraOrigin).normalize()
        const u = w.cross(up).negative().normalize()
        const v = w.cross(u).normalize()
        this.w = w
        this.u = u
        this.v = v

        console.log(w, u, v)

        const viewport_horizontal = u.mul(viewportWidth)
        const viewport_vertical = v.mul(-viewportHeight)

        const viewportUpperLeft = cameraOrigin
            .add(w.mul(options.focusDist))
            .sub(viewport_horizontal.div(2))
            .sub(viewport_vertical.div(2))
        console.log('view_port_upper_left', viewportUpperLeft)

        this.pixelHorizontal = viewport_horizontal.div(width)
        this.pixelVertical = viewport_vertical.div(height)
        this.pixel00Loc = viewportUpperLeft
            .add(this.pixelHorizontal.mul(0.5))
            .add(this.pixelVertical.mul(0.5))

        // 计算散焦参数
        const defocusRadius = options.focusDist * Math.tan(degreeToRadian(options.defocusAngle / 2))
        this.defocusDiskU = u.mul(defocusRadius)
        this.defocusDiskV = v.mul(defocusRadius)
    }

    private generateRay(i: number, j: number) {
        const pixelCenter = this.pixel00Loc
            .add(this.pixelHorizontal.mul(i))
            .add(this.pixelVertical.mul(j));
        const rayDir = pixelCenter
            .add(this.pixelHorizontal.mul(Math.random() - 0.5))
            .add(this.pixelVertical.mul(Math.random() - 0.5))
            .sub(this.cameraOrigin)
            .normalize();
        const rayOrigin = this.options.defocusAngle <= 0 ? this.cameraOrigin : this.generateOrigin()
        return new Ray(rayOrigin, rayDir);
    }

    private generateOrigin() {
        const p = randomInUnitDisk()
        return this.cameraOrigin.add(this.defocusDiskU.mul(p.x)).add(this.defocusDiskV.mul(p.y))
    }

    render(
        ctx: CanvasRenderingContext2D,
        world: Hittable,
    ): AbortController {
        const abortController = new AbortController();
        const renderBatch = async (start: number, step: number) => {
            let renderedPixel = 0
            for (let i = this.width - 1; i >= 0; i -= step) {
                if (abortController.signal.aborted) break;
                for (let j = start; j < this.height; j += step) {
                    if (abortController.signal.aborted) break;
                    let color = Vec3.ZERO
                    for (let k = 0; k < this.options.samplesPerPixel; k++) {
                        const ray = this.generateRay(i, j)
                        const c = this.rayTrace(ray, world, 0);
                        color = color.add(c);
                    }
                    drawPixel(ctx, i, j, color.div(this.options.samplesPerPixel));

                    if(++renderedPixel > 1024) {
                        renderedPixel = 0
                        await new Promise(resolve => setTimeout(resolve, 0));
                    }
                }
            }
        };

        const progressiveRender = async () => {
            const startTime = Date.now()

            let step = 1; // 初始步长
            while (step > 0) {
                await renderBatch(0, step);
                step = Math.floor(step / 2); // 每次将步长减半
            }
            abortController.abort('done')

            const endTime = Date.now()
            console.log(`render complete, ${endTime - startTime}ms`)
            console.table([{
                width: this.width,
                height: this.height,
                samplesPerPixel: this.options.samplesPerPixel,
                maxDepth: this.options.maxDepth
            }]);
        };

        progressiveRender().then(() => {
            // 右下角添加渲染信息
            ctx.font = "14px Arial";
            ctx.fillStyle = "white";
            ctx.textRendering = "optimizeLegibility";
            ctx.fillText(`${this.width}x${this.height}\n采样次数: ${this.options.samplesPerPixel}\n深度: ${this.options.maxDepth}`, 100, 100);
        });

        return abortController;
    }

    private rayTrace(ray: Ray, world: Hittable, depth: number): Color {
        if (depth > this.options.maxDepth) return new Vec3(0, 0, 0)

        const hitRecord = world.hit(ray, new Interval(0.0001, Infinity))
        if (hitRecord) {
            const scatterResult = hitRecord.material.scatter(ray, hitRecord)
            const emittedResult = hitRecord.material.emitted?.(hitRecord.u, hitRecord.v, hitRecord.p) || Vec3.ZERO

            const attenuation = scatterResult.attenuation
            const scattered = scatterResult.scattered
            if (scattered) {
                const light = this.rayTrace(scattered, world, depth + 1)
                return attenuation.mul(light).add(emittedResult)
            } else {
                return emittedResult
            }
        }

        // fake sky
        return Vec3.ZERO
    }
}


export interface RenderOptions {
    focusDist: number;
    defocusAngle: number;
    vFov: number;
    samplesPerPixel: number;
    maxDepth: number;
}
