import type {Vec3} from "@/core/vec";
import type {Color} from "@/core/color";

export type PixelShader = (
    normal: Vec3,
) => Color
