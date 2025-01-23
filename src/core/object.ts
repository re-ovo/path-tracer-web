import { HitRecord, Ray } from '@/core/ray';
import { Vec3 } from '@/core/vec';
import { Interval } from '@/core/interval';
import { Lambertian, type Material } from '@/core/material';
import { AABB } from '@/core/aabb';

export interface Hittable {
  boundingBox: AABB;

  hit(ray: Ray, interval: Interval): HitRecord | null;
}

export class HitList implements Hittable {
  boundingBox: AABB;
  private readonly list: Hittable[];

  constructor(list: Hittable[]) {
    this.list = list;
    this.boundingBox = AABB.mergeMany(list.map((obj) => obj.boundingBox));
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
  boundingBox: AABB;
  center: Vec3;
  radius: number;
  material: Material;

  constructor(center: Vec3, radius: number, material: Material) {
    this.center = center;
    this.radius = radius;
    this.material = material;

    const rVec = new Vec3(radius, radius, radius);
    this.boundingBox = new AABB(center.sub(rVec), center.add(rVec));
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

    const [u, v] = this.getUV(N);
    const record = new HitRecord(root, ray.at(root), this.material, u, v);
    record.setNormal(ray.getDirection(), N);
    return record;
  }

  getUV(p: Vec3) {
    const theta = Math.acos(-p.y);
    const phi = Math.atan2(-p.z, p.x) + Math.PI;

    return [1 - phi / (2 * Math.PI), theta / Math.PI];
  }
}

export class Quad implements Hittable {
  boundingBox: AABB;
  p0: Vec3;
  u: Vec3;
  v: Vec3;
  normal: Vec3;
  D: number;
  material: Material;

  constructor(p0: Vec3, u: Vec3, v: Vec3, material: Material) {
    this.p0 = p0;
    this.u = u;
    this.v = v;
    this.material = material;
    this.normal = u.cross(v).normalize();
    this.D = this.normal.dot(p0);

    this.boundingBox = AABB.merge(
      new AABB(p0, p0.add(u).add(v)), // 对角线1
      new AABB(p0.add(u), p0.add(v)), // 对角线2
    );
  }

  hit(ray: Ray, interval: Interval): HitRecord | null {
    const denominator = this.normal.dot(ray.getDirection());

    // If the denominator is close to zero, the ray is parallel to the quad
    if (Math.abs(denominator) < 1e-6) {
      return null;
    }

    // Calculate the intersection point along the ray
    const t = (this.D - this.normal.dot(ray.getOrigin())) / denominator;

    // Check if the intersection point is within the valid range
    if (!interval.surrounds(t)) {
      return null;
    }

    // Calculate the intersection point on the plane
    const P = ray.at(t);

    // Calculate vectors from the point p0 to the intersection point P
    const AP = P.sub(this.p0);

    // Calculate dot products to check if the point is inside the quad
    const uu = this.u.dot(this.u);
    const uv = this.u.dot(this.v);
    const vv = this.v.dot(this.v);
    const wu = AP.dot(this.u);
    const wv = AP.dot(this.v);

    // Calculate barycentric coordinates
    const denom = uv * uv - uu * vv;
    const s = (uv * wv - vv * wu) / denom;
    const tParam = (uv * wu - uu * wv) / denom;

    // Check if the intersection point is inside the quad
    if (s < 0 || s > 1 || tParam < 0 || tParam > 1) {
      return null;
    }

    // Calculate UV coordinates for texture mapping
    const [u, v] = [s, tParam];

    // Create a hit record
    const record = new HitRecord(t, P, this.material, u, v);
    record.setNormal(ray.getDirection(), this.normal);

    return record;
  }

  static createCube(
    center: Vec3,
    width: number,
    height: number,
    depth: number,
    material: Material,
  ): Quad[] {
    const halfWidth = width / 2;
    const halfHeight = height / 2;
    const halfDepth = depth / 2;

    // Create quads for each face of the cube
    return [
      // Front face
      new Quad(
        center.add(new Vec3(-halfWidth, -halfHeight, -halfDepth)),
        new Vec3(width, 0, 0),
        new Vec3(0, height, 0),
        material,
      ),
      // Back face
      new Quad(
        center.add(new Vec3(-halfWidth, -halfHeight, halfDepth)),
        new Vec3(width, 0, 0),
        new Vec3(0, height, 0),
        material,
      ),
      // Top face
      new Quad(
        center.add(new Vec3(-halfWidth, halfHeight, -halfDepth)),
        new Vec3(width, 0, 0),
        new Vec3(0, 0, depth),
        material,
      ),
      // Bottom face
      new Quad(
        center.add(new Vec3(-halfWidth, -halfHeight, -halfDepth)),
        new Vec3(width, 0, 0),
        new Vec3(0, 0, depth),
        material,
      ),
      // Left face
      new Quad(
        center.add(new Vec3(-halfWidth, -halfHeight, -halfDepth)),
        new Vec3(0, height, 0),
        new Vec3(0, 0, depth),
        material,
      ),
      // Right face
      new Quad(
        center.add(new Vec3(halfWidth, -halfHeight, -halfDepth)),
        new Vec3(0, height, 0),
        new Vec3(0, 0, depth),
        material,
      ),
    ];
  }
}
