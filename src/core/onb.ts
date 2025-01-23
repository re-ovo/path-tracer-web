import { Vec3 } from './vec';

export class ONB {
  private readonly u: Vec3;
  private readonly v: Vec3;
  private readonly w: Vec3;

  constructor(normal: Vec3) {
    this.w = normal.normalize();

    // Find a vector not parallel to w
    let a = Math.abs(this.w.x) > 0.9 ? new Vec3(0, 1, 0) : new Vec3(1, 0, 0);

    // Create v perpendicular to w using cross product
    this.v = this.w.cross(a).normalize();

    // Create u perpendicular to both v and w
    this.u = this.w.cross(this.v);
  }

  /**
   * 将向量v从世界坐标系转换到局部坐标系
   * @param v 世界坐标系下的向量
   * @returns 局部坐标系下的向量
   */
  transform(v: Vec3): Vec3 {
    return v.mul(this.u).add(v.mul(this.v)).add(v.mul(this.w));
  }
}
