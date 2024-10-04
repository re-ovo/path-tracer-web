import {HitRecord, Ray} from "@/core/ray";
import {Vec3} from "@/core/vec";
import {randomUnitVector, reflect, refract} from "@/core/vec";
import {SolidColor, type Texture} from "@/core/texture";
import type {Color} from "@/core/color";

export interface Material {
    scatter(ray: Ray, hitRecord: HitRecord): ScatterResult

    emitted?(u: number, v: number, p: Vec3): Color;
}

export interface ScatterResult {
    attenuation: Vec3;
    scattered: Ray | null;
}

export class Lambertian implements Material {
    private readonly texture: Texture;

    constructor(src: Texture | Color) {
        this.texture = src instanceof Vec3 ? new SolidColor(src) : src;
    }

    scatter(ray: Ray, hitRecord: HitRecord): ScatterResult {
        const scattered = hitRecord.normal
            .add(randomUnitVector())
            .ensureNotZero(hitRecord.normal)

        return {
            attenuation: this.texture.value(hitRecord.u, hitRecord.v, hitRecord.p),
            scattered: new Ray(hitRecord.p, scattered),
        };
    }
}

export class DiffuseLight implements Material {
    private readonly emit: Color;

    constructor(src: Color) {
        this.emit = src;
    }

    scatter(ray: Ray, hitRecord: HitRecord): ScatterResult {
        return {
            attenuation: this.emit,
            scattered: null,
        }
    }

    emitted(u: number, v: number, p: Vec3): Color {
        return this.emit;
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
    private readonly roughness: number; // 0 = smooth, 1 = rough
    private readonly metallic: number; // 1 = pure metal, 0 = pure diffuse

    constructor(albedo: Vec3, roughness: number, metallic: number) {
        this.albedo = albedo;
        this.roughness = roughness;
        this.metallic = metallic;
    }

    scatter(ray: Ray, hitRecord: HitRecord): ScatterResult {
        const viewDir = ray.getDirection().normalize();
        const normal = hitRecord.normal;

        // Calculate the halfway vector
        const halfVector = viewDir.negative().add(randomUnitVector()).normalize();

        // Reflect the view direction around the normal
        const reflected = reflect(viewDir, normal);

        // Calculate the Fresnel factor
        const fresnel = this.fresnelSchlick(viewDir.dot(halfVector));

        // Calculate the geometric attenuation
        const geometric = this.geometricAttenuation(viewDir, normal, halfVector);

        // Calculate the distribution function
        const distribution = this.distributionGGX(normal, halfVector);

        // Cook-Torrance BRDF
        const specular = fresnel.mul(geometric).mul(distribution).div(
            4 * Math.max(viewDir.dot(normal), 0.001) * Math.max(hitRecord.normal.dot(halfVector), 0.001)
        );

        // Combine diffuse and specular
        const oneMinusFresnel = Vec3.ONE.sub(fresnel);
        const diffuse = this.albedo.mul(1 - this.metallic).mul(oneMinusFresnel);
        const attenuation = diffuse.add(specular);

        const scattered = reflected.add(randomUnitVector().mul(this.roughness)).normalize();

        return {
            attenuation: attenuation,
            scattered: new Ray(hitRecord.p, scattered),
        };
    }

    fresnelSchlick(cosTheta: number): Vec3 {
        const F0 = Vec3.lerp(new Vec3(0.04, 0.04, 0.04), this.albedo, this.metallic);
        return F0.add(new Vec3(1, 1, 1).sub(F0).mul(Math.pow(1 - cosTheta, 5)));
    }

    geometricAttenuation(viewDir: Vec3, normal: Vec3, halfVector: Vec3): number {
        const NdotV = Math.max(normal.dot(viewDir), 0.0);
        const NdotL = Math.max(normal.dot(halfVector), 0.0);
        const k = Math.pow(this.roughness + 1, 2) / 8;

        const ggx1 = NdotV / (NdotV * (1 - k) + k);
        const ggx2 = NdotL / (NdotL * (1 - k) + k);

        return ggx1 * ggx2;
    }

    distributionGGX(normal: Vec3, halfVector: Vec3): number {
        const a = this.roughness * this.roughness;
        const a2 = a * a;
        const NdotH = Math.max(normal.dot(halfVector), 0.0);
        const NdotH2 = NdotH * NdotH;

        const num = a2;
        const denom = (NdotH2 * (a2 - 1) + 1);
        return num / (Math.PI * denom * denom);
    }
}
