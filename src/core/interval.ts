export class Interval {
  readonly min: number;
  readonly max: number;

  constructor(min: number, max: number) {
    this.min = min;
    this.max = max;
  }

  contains(v: number): boolean {
    return v >= this.min && v <= this.max;
  }

  surrounds(v: number): boolean {
    return v > this.min && v < this.max;
  }

  clamp(v: number): number {
    return Math.max(this.min, Math.min(v, this.max));
  }

  clone(): Interval {
    return new Interval(this.min, this.max);
  }
}

export function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

export function randomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
