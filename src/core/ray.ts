import { Vec3 } from '@/core/vec';
import type { Material } from '@/core/material';

export class Ray {
  private readonly origin: Vec3;
  private readonly direction: Vec3;

  constructor(origin: Vec3, direction: Vec3) {
    this.origin = origin;
    this.direction = direction;
  }

  getOrigin(): Vec3 {
    return this.origin;
  }

  getDirection(): Vec3 {
    return this.direction;
  }

  at(t: number): Vec3 {
    return this.origin.add(this.direction.mul(t));
  }

  clone(): Ray {
    return new Ray(this.origin.clone(), this.direction.clone());
  }
}

export class HitRecord {
  t: number;
  p: Vec3;

  normal: Vec3;
  frontFace: boolean;

  material: Material;
  u: number;
  v: number;

  constructor(t: number, p: Vec3, material: Material, u: number, v: number) {
    this.t = t;
    this.p = p;
    this.normal = new Vec3(1, 0, 0);
    this.frontFace = false;
    this.material = material;
    this.u = u;
    this.v = v;
  }

  setNormal(ray: Vec3, outsideNormal: Vec3) {
    if (ray.dot(outsideNormal) > 0) {
      // 点积大于0，说明法线和外侧法线方向相同，则法线为相反方向
      this.normal = outsideNormal.mul(-1);
      this.frontFace = false;
    } else {
      this.normal = outsideNormal;
      this.frontFace = true;
    }
  }
}
