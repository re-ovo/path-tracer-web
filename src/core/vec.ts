import {randomFloat} from "@/core/interval";

export class Vec3 {
    private readonly data: number[]

    constructor(x: number, y: number, z: number) {
        this.data = [x, y, z]
    }

    get x() {
        return this.data[0]
    }

    get y() {
        return this.data[1]
    }

    get z() {
        return this.data[2]
    }

    set x(x: number) {
        this.data[0] = x
    }

    set y(y: number) {
        this.data[1] = y
    }

    set z(z: number) {
        this.data[2] = z
    }

    clone(): Vec3 {
        return new Vec3(this.x, this.y, this.z)
    }

    add(v: Vec3): Vec3 {
        return new Vec3(this.x + v.x, this.y + v.y, this.z + v.z)
    }

    sub(v: Vec3): Vec3 {
        return new Vec3(this.x - v.x, this.y - v.y, this.z - v.z)
    }

    mul(v: Vec3 | number): Vec3 {
        if (typeof v === 'number') {
            return new Vec3(
                this.x * v,
                this.y * v,
                this.z * v
            )
        } else {
            return new Vec3(
                this.x * v.x,
                this.y * v.y,
                this.z * v.z
            )
        }
    }

    div(v: Vec3 | number): Vec3 {
        if (typeof v === 'number') {
            return new Vec3(
                this.x / v,
                this.y / v,
                this.z / v
            )
        } else {
            return new Vec3(
                this.x / v.x,
                this.y / v.y,
                this.z / v.z
            )
        }
    }

    dot(v: Vec3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z
    }

    cross(v: Vec3): Vec3 {
        return new Vec3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x
        )
    }

    length(): number {
        return Math.sqrt(this.dot(this))
    }

    lengthSquared(): number {
        return this.dot(this)
    }

    normalize(): Vec3 {
        return this.div(this.length())
    }

    negative(): Vec3 {
        return this.mul(-1)
    }

    ensureNotZero(fallback: Vec3) {
        return this.lengthSquared() < 1e-8 ? fallback : this
    }

    static lerp(a: Vec3, b: Vec3, t: number): Vec3 {
        return a.add(b.sub(a).mul(t))
    }

    static ZERO = new Vec3(0, 0, 0)
    static ONE = new Vec3(1, 1, 1)
}

export function randomOnHemisphere(normal: Vec3): Vec3 {
    let onUnitSphere = randomUnitVector()
    if (onUnitSphere.dot(normal) > 0.0) {
        return onUnitSphere
    } else {
        return onUnitSphere.mul(-1)
    }
}

export function randomUnitVector(): Vec3 {
    while (true) {
        let p = new Vec3(randomFloat(-1, 1), randomFloat(-1, 1), randomFloat(-1, 1))
        let l = p.lengthSquared()
        if (l <= 1) {
            return p.div(Math.sqrt(l))
        }
    }
}

export function randomInUnitDisk(): Vec3 {
    while (true) {
        let p = new Vec3(randomFloat(-1, 1), randomFloat(-1, 1), 0)
        if (p.lengthSquared() < 1) {
            return p
        }
    }
}

export function reflect(v: Vec3, n: Vec3): Vec3 {
    return v.sub(n.mul(2 * v.dot(n)))
}

export function refract(uv: Vec3, n: Vec3, etaiOverEtat: number): Vec3 {
    const cosTheta = Math.min(uv.mul(-1).dot(n), 1.0);
    const rOutPerp = uv.add(n.mul(cosTheta)).mul(etaiOverEtat);
    const rOutParallel = n.mul(-Math.sqrt(Math.abs(1.0 - rOutPerp.lengthSquared())));
    return rOutPerp.add(rOutParallel);
}
