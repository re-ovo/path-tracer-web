import {Ray} from "@/core/ray";
import {Vec3} from "@/core/vec";
import {Interval} from "@/core/interval";
import {type Material} from "@/core/material";

export interface Hittable {
    hit(ray: Ray, interval: Interval): HitRecord | null;
}

export class HitRecord {
    t: number;
    p: Vec3;
    normal: Vec3;
    frontFace: boolean;
    material: Material;

    constructor(t: number, p: Vec3, material: Material) {
        this.t = t;
        this.p = p;
        this.normal = new Vec3(1, 0, 0);
        this.frontFace = false
        this.material = material;
    }

    setNormal(ray: Vec3, outsideNormal: Vec3) {
        if (ray.dot(outsideNormal) > 0) {
            // 点积大于0，说明法线和外侧法线方向相同，则法线为相反方向
            this.normal = outsideNormal.mul(-1)
            this.frontFace = false
        } else {
            this.normal = outsideNormal;
            this.frontFace = true
        }
    }
}

export class HitList implements Hittable {
    private readonly list: Hittable[];

    constructor(list: Hittable[]) {
        this.list = list;
    }

    add(hittable: Hittable) {
        this.list.push(hittable);
    }

    hit(ray: Ray, interval: Interval): HitRecord | null {
        let closest = interval.max;
        let record: HitRecord | null = null;

        for (const hittable of this.list) {
            const hitRecord = hittable.hit(ray, new Interval(interval.min, closest));
            if (hitRecord !== null) {
                closest = hitRecord.t;
                record = hitRecord;
            }
        }

        return record;
    }
}

export class Sphere implements Hittable {
    center: Vec3;
    radius: number;
    material: Material;

    constructor(center: Vec3, radius: number, material: Material) {
        this.center = center;
        this.radius = radius;
        this.material = material;
    }

    hit(ray: Ray, interval: Interval): HitRecord | null {
        const oc = this.center.sub(ray.getOrigin());
        const a = ray.getDirection().lengthSquared();
        const h = oc.dot(ray.getDirection());
        const c = oc.lengthSquared() - this.radius * this.radius;
        const discriminant = h * h - a * c;

        if (discriminant < 0) {
            // No hit
            return null;
        }

        let root = (h - Math.sqrt(discriminant)) / a;
        if (!interval.surrounds(root)) {
            root = (h + Math.sqrt(discriminant)) / a; // 求另外一根

            // 任然不在范围内
            if (!interval.surrounds(root)) {
                return null;
            }
        }

        const N = ray.at(root).sub(this.center).normalize();
        const record = new HitRecord(root, ray.at(root), this.material);
        record.setNormal(ray.getDirection(), N);
        return record;
    }
}
