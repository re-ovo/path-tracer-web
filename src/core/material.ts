import { HitRecord, Ray } from '@/core/ray';
import { randomUnitVector, reflect, refract, Vec3 } from '@/core/vec';
import { SolidColor, type Texture } from '@/core/texture';
import type { Color } from '@/core/color';

export interface Material {
  scatter(ray: Ray, hitRecord: HitRecord): ScatterResult;

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
      .ensureNotZero(hitRecord.normal);

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
    };
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
    const reflected = reflect(ray.getDirection().normalize(), hitRecord.normal);
    const fuzzVector = randomUnitVector().mul(this.fuzz);

    return {
      attenuation: this.albedo,
      scattered: new Ray(hitRecord.p, reflected.normalize().add(fuzzVector)),
    };
  }
}

export class Dielectric implements Material {
  private readonly refIdx: number;

  constructor(refIdx: number) {
    this.refIdx = refIdx;
  }

  scatter(ray: Ray, hitRecord: HitRecord): ScatterResult {
    const attenuation = new Vec3(1, 1, 1);
    const refractionRatio = hitRecord.frontFace
      ? 1.0 / this.refIdx
      : this.refIdx;

    const unitDirection = ray.getDirection().normalize();
    const cosTheta = Math.min(unitDirection.mul(-1).dot(hitRecord.normal), 1);
    const sinTheta = Math.sqrt(1.0 - cosTheta * cosTheta);

    const cannotRefract = refractionRatio * sinTheta > 1;
    let direction: Vec3;
    if (
      cannotRefract ||
      Dielectric.reflectance(cosTheta, refractionRatio) > Math.random()
    ) {
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
    return r0 + (1 - r0) * Math.pow(1 - cosine, 5);
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
    const viewDir = ray.getDirection().normalize().negative();
    const normal = hitRecord.normal.normalize();

    // Generate a random microfacet normal using the roughness
    const halfVector = this.sampleMicrofacetNormal(normal);

    // Calculate the reflection direction
    const reflectDir = reflect(viewDir, halfVector);

    // Calculate Fresnel term using Schlick's approximation
    const F0 = this.metallic === 1 ? this.albedo : new Vec3(0.04, 0.04, 0.04);
    const F = this.fresnelSchlick(viewDir.dot(halfVector), F0);

    // Calculate the geometry attenuation
    const G = this.geometrySmith(normal, viewDir, reflectDir);

    // Calculate the normal distribution function
    const D = this.normalDistribution(halfVector, normal);

    // Cook-Torrance BRDF
    const NdotV = Math.max(viewDir.dot(normal), 0.0);
    const NdotL = Math.max(reflectDir.dot(normal), 0.0);
    const denominator = 4 * NdotV * NdotL + 1e-5; // Add a small epsilon to prevent division by zero
    const specular = F.mul(G).mul(D).div(denominator);

    // Mix between diffuse and specular
    const kS = F;
    const kD = new Vec3(1.0, 1.0, 1.0).sub(kS).mul(1.0 - this.metallic);
    const diffuse = this.albedo.div(Math.PI);

    // Final color
    const color = diffuse.mul(kD).add(specular);

    if (color.isNaN()) {
      console.log(diffuse, specular);
    }

    return {
      attenuation: color,
      scattered: new Ray(hitRecord.p, reflectDir),
    };
  }

  private fresnelSchlick(cosTheta: number, F0: Vec3): Vec3 {
    return F0.add(
      new Vec3(1.0, 1.0, 1.0).sub(F0).mul(Math.pow(1.0 - cosTheta, 5.0)),
    );
  }

  private geometrySmith(normal: Vec3, viewDir: Vec3, reflectDir: Vec3): number {
    const NdotV = Math.max(normal.dot(viewDir), 0.0);
    const NdotL = Math.max(normal.dot(reflectDir), 0.0);
    const k = ((this.roughness + 1.0) * (this.roughness + 1.0)) / 8.0;

    const G1V = NdotV / (NdotV * (1.0 - k) + k);
    const G1L = NdotL / (NdotL * (1.0 - k) + k);

    return G1V * G1L;
  }

  private normalDistribution(halfVector: Vec3, normal: Vec3): number {
    const alpha = this.roughness * this.roughness;
    const alpha2 = alpha * alpha;
    const NdotH = Math.max(normal.dot(halfVector), 0.0);
    const NdotH2 = NdotH * NdotH;

    const nom = alpha2;
    const denom = NdotH2 * (alpha2 - 1.0) + 1.0;
    return nom / (Math.PI * denom * denom);
  }

  private sampleMicrofacetNormal(normal: Vec3): Vec3 {
    // Sample a microfacet normal based on roughness
    // This is a placeholder function. In practice, you would use a sampling technique
    // like GGX importance sampling.
    return normal.add(randomUnitVector().mul(this.roughness)).normalize();
  }
}
