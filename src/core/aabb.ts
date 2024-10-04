import {Vec3} from "@/core/vec";
import {Ray} from "@/core/ray";
import {Interval} from "@/core/interval";

export class AABB {
    readonly max: Vec3;
    readonly min: Vec3;

    constructor(min: Vec3, max: Vec3) {
        this.min = min;
        this.max = max;

        if (min.x > max.x || min.y > max.y || min.z > max.z) {
            throw new Error("Invalid AABB");
        }
    }

    hit(ray: Ray, range: Interval): boolean {
        let tx1 = (this.min.x - ray.getOrigin().x) / ray.getDirection().x;
        let tx2 = (this.max.x - ray.getOrigin().x) / ray.getDirection().x;
        if (tx1 > tx2) [tx1, tx2] = [tx2, tx1];
        let ty1 = (this.min.y - ray.getOrigin().y) / ray.getDirection().y;
        let ty2 = (this.max.y - ray.getOrigin().y) / ray.getDirection().y;
        if (ty1 > ty2) [ty1, ty2] = [ty2, ty1];
        let tz1 = (this.min.z - ray.getOrigin().z) / ray.getDirection().z;
        let tz2 = (this.max.z - ray.getOrigin().z) / ray.getDirection().z;
        if (tz1 > tz2) [tz1, tz2] = [tz2, tz1];

        let rangeMin = range.min;
        let rangeMax = range.max;

        rangeMin = Math.max(rangeMin, tx1, ty1, tz1);
        rangeMax = Math.min(rangeMax, tx2, ty2, tz2);

        return rangeMin < rangeMax;
    }

    longestAxis(): 0 | 1 | 2 {
        const x = this.max.x - this.min.x;
        const y = this.max.y - this.min.y;
        const z = this.max.z - this.min.z;
        if (x > y && x > z) return 0;
        if (y > z) return 1;
        return 2;
    }

    toString(): string {
        return `min: ${this.min.toString()}, max: ${this.max.toString()}`;
    }

    static merge(a: AABB, b: AABB): AABB {
        return new AABB(
            new Vec3(
                Math.min(a.min.x, b.min.x),
                Math.min(a.min.y, b.min.y),
                Math.min(a.min.z, b.min.z),
            ),
            new Vec3(
                Math.max(a.max.x, b.max.x),
                Math.max(a.max.y, b.max.y),
                Math.max(a.max.z, b.max.z),
            ),
        )
    }

    static mergeMany(boxes: AABB[]): AABB {
        if (boxes.length === 0) throw new Error("Cannot merge empty array");
        return boxes.reduce((acc, cur) => AABB.merge(acc, cur), boxes[0]);
    }
}
