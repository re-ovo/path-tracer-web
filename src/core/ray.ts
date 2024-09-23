import type {Vec3} from "@/core/vec";

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
