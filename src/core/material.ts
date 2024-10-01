import {Ray} from "@/core/ray";
import type {HitRecord} from "@/core/object";
import {Vec3} from "@/core/vec";
import {randomUnitVector, reflect, refract} from "@/core/vec";

export interface Material {
    scatter(ray: Ray, hitRecord: HitRecord): ScatterResult
}

export interface ScatterResult {
    attenuation: Vec3;
    scattered: Ray | null;
}

export class Lambertian implements Material {
    private readonly albedo: Vec3;

    constructor(albedo: Vec3) {
        this.albedo = albedo;
    }

    scatter(ray: Ray, hitRecord: HitRecord): ScatterResult {
        const scattered = hitRecord.normal
            .add(randomUnitVector())
            .ensureNotZero(hitRecord.normal)

        return {
            attenuation: this.albedo,
            scattered: new Ray(hitRecord.p, scattered),
        };
    }
}

export class Metal implements Material {
    private readonly albedo: Vec3;
    private readonly fuzz: number;

    constructor(albedo: Vec3, fuzz: number) {
        this.albedo = albedo;
        this.fuzz = fuzz;
    }

    scatter(ray: Ray, hitRecord: HitRecord): ScatterResult {
        const reflected = reflect(ray.getDirection().normalize(), hitRecord.normal)
        const fuzzVector = randomUnitVector().mul(this.fuzz);

        return {
            attenuation: this.albedo,
            scattered: new Ray(hitRecord.p, reflected.normalize().add(fuzzVector)),
        }
    }
}

export class Dielectric implements Material {
    private readonly refIdx: number;

    constructor(refIdx: number) {
        this.refIdx = refIdx;
    }

    scatter(ray: Ray, hitRecord: HitRecord): ScatterResult {
        const attenuation = new Vec3(1, 1, 1);
        const refractionRatio = hitRecord.frontFace ? 1.0 / this.refIdx : this.refIdx;

        const unitDirection = ray.getDirection().normalize();
        const cosTheta = Math.min(unitDirection.mul(-1).dot(hitRecord.normal), 1);
        const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);

        const cannotRefract = refractionRatio * sinTheta > 1;
        let direction: Vec3;
        if (cannotRefract || Dielectric.reflectance(cosTheta, refractionRatio) > Math.random()) {
            direction = reflect(unitDirection, hitRecord.normal);
        } else {
            direction = refract(unitDirection, hitRecord.normal, refractionRatio);
        }
        return {
            attenuation,
            scattered: new Ray(hitRecord.p, direction),
        };
    }

    private static reflectance(cosine: number, refIdx: number): number {
        // Use Schlick's approximation for reflectance.
        let r0 = (1 - refIdx) / (1 + refIdx);
        r0 = r0 * r0;
        return r0 + (1 - r0) * Math.pow((1 - cosine), 5);
    }
}
