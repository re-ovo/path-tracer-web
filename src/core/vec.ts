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

    normalize(): Vec3 {
        return this.div(this.length())
    }

    static lerp(a: Vec3, b: Vec3, t: number): Vec3 {
        return a.add(b.sub(a).mul(t))
    }
}
