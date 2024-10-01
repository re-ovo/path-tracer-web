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

export class CookTorrance implements Material {
    private readonly albedo: Vec3;
    private readonly roughness: number;
    private readonly metallic: number;

    constructor(albedo: Vec3, roughness: number, metallic: number) {
        this.albedo = albedo;
        this.roughness = roughness;
        this.metallic = metallic;
    }

    scatter(ray: Ray, hitRecord: HitRecord): ScatterResult {
        const viewDir = ray.getDirection().negative().normalize();
        const lightDir = randomUnitVector().normalize();
        const halfDir = viewDir.add(lightDir).normalize();

        const NdotL = Math.max(hitRecord.normal.dot(lightDir), 0);
        const NdotV = Math.max(hitRecord.normal.dot(viewDir), 0);
        const NdotH = Math.max(hitRecord.normal.dot(halfDir), 0);
        const VdotH = Math.max(viewDir.dot(halfDir), 0);

        const F = this.fresnelSchlick(VdotH);
        const G = this.geometrySmith(NdotV, NdotL);
        const D = this.normalDistributionFunction(NdotH);

        const numerator = F.mul(G).mul(D);
        const denominator = 4 * NdotV * NdotL + 1e-7; // Avoid division by zero

        const specular = numerator.div(denominator);
        const kS = F;
        const kD = new Vec3(1, 1, 1).sub(kS).mul(1 - this.metallic);

        const diffuse = kD.mul(this.albedo).div(Math.PI);

        const color = diffuse.add(specular).mul(NdotL);

        return {
            attenuation: color,
            scattered: new Ray(hitRecord.p, lightDir),
        };
    }

    fresnelSchlick(cosTheta: number): Vec3 {
        const F0 = Vec3.lerp(new Vec3(0.04, 0.04, 0.04), this.albedo, this.metallic);
        return F0.add(new Vec3(1, 1, 1).sub(F0).mul(Math.pow(1 - cosTheta, 5)));
    }

    geometrySmith(NdotV: number, NdotL: number): number {
        const r = this.roughness + 1;
        const k = (r * r) / 8;
        const G1 = NdotV / (NdotV * (1 - k) + k);
        const G2 = NdotL / (NdotL * (1 - k) + k);
        return G1 * G2;
    }

    normalDistributionFunction(NdotH: number): number {
        const alpha = this.roughness * this.roughness;
        const alpha2 = alpha * alpha;
        const denom = (NdotH * NdotH * (alpha2 - 1) + 1);
        return alpha2 / (Math.PI * denom * denom);
    }
}
