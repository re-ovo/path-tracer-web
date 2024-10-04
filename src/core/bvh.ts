import {type Hittable} from "@/core/object";
import {AABB} from "@/core/aabb";
import {HitRecord, type Ray} from "@/core/ray";
import type {Interval} from "@/core/interval";

export class BVHNode implements Hittable {
    boundingBox: AABB;
    left: Hittable;
    right: Hittable;

    constructor(objects: Hittable[], start: number, end: number) {
        const objectSpans = end - start;

        this.boundingBox = AABB.mergeMany(objects.slice(start, end).map(obj => obj.boundingBox));

        const axis = this.boundingBox.longestAxis();
        const comparator = (a: Hittable, b: Hittable) =>
            a.boundingBox.min.axis(axis) - b.boundingBox.min.axis(axis);

        if (objectSpans === 1) {
            this.left = objects[start];
            this.right = objects[start];
        } else if (objectSpans === 2) {
            this.left = objects[start];
            this.right = objects[start + 1];
        } else {
            const subjects = objects.slice(start, end).sort(comparator);
            const mid = Math.floor(objectSpans / 2);
            this.left = new BVHNode(subjects, 0, mid);
            this.right = new BVHNode(subjects, mid, objectSpans);
        }
    }

    hit(ray: Ray, interval: Interval): HitRecord | null {
        if (!this.boundingBox.hit(ray, interval)) {
            return null;
        }

        const leftHit = this.left.hit(ray, interval);
        const rightHit = this.right.hit(ray, interval);

        if (leftHit && rightHit) {
            return leftHit.t < rightHit.t ? leftHit : rightHit;
        } else if (leftHit) {
            return leftHit;
        } else if (rightHit) {
            return rightHit;
        } else {
            return null;
        }
    }
}
