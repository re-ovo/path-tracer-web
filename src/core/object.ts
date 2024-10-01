import {Ray} from "@/core/ray";
import {Vec3} from "@/core/vec";

export interface Hittable {
    hit(ray: Ray, tMin: number, tMax: number): HitRecord | null;
}

export class HitRecord {
    t: number;
    p: Vec3;
    normal: Vec3;

    constructor(t: number, p: Vec3) {
        this.t = t;
        this.p = p;
        this.normal = new Vec3(0, 0, 0)
    }

    setNormal(ray: Vec3, outsideNormal: Vec3) {
        if (ray.dot(outsideNormal) > 0) {
            // 点积大于0，说明法线和外侧法线方向相同，则法线为相反方向
            this.normal = outsideNormal.mul(-1)
        } else {
            this.normal = outsideNormal;
        }
    }
}

export class HitList implements Hittable {
    private readonly list: Hittable[];

    constructor(list: Hittable[]) {
        this.list = list;
    }

    hit(ray: Ray, tMin: number, tMax: number): HitRecord | null {
        let closest = tMax;
        let record: HitRecord | null = null;

        for (const hittable of this.list) {
            const hitRecord = hittable.hit(ray, tMin, closest);
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

    constructor(center: Vec3, radius: number) {
        this.center = center;
        this.radius = radius;
    }

    hit(ray: Ray, tMin: number, tMax: number): HitRecord | null {
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
        if (root < tMin || tMax < root) {
            root = (h + Math.sqrt(discriminant)) / a; // 求另外一根

            // 任然不在范围内
            if (root < tMin || tMax < root) {
                return null;
            }
        }

        const N = ray.at(root).sub(this.center).normalize();
        const record = new HitRecord(root, ray.at(root));
        record.setNormal(ray.getDirection(), N);
        return record;
    }
}
