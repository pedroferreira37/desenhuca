import type { Direction, Tool } from '$lib/types';
import { Vector } from '../math/vector';

const shortcuts: Tool[] = ['pointer', 'pencil', 'rectangle', 'ellipse', 'segment', 'eraser'];

export function project_point_on_segment(p: Vector, a: Vector, b: Vector): Vector {
	if (a.x === b.x && a.y === b.y) return a;

	const ab = [b.x - a.x, b.y - a.y];
	const ap = [p.x - a.x, p.y - a.y];

	const t = (ap[0] * ab[0] + ap[1] * ab[1]) / (ab[0] * ab[0] + ab[1] * ab[1]);

	const clamped = Math.max(0, Math.min(1, t));

	return Vector.from(a.x + clamped * ab[0], a.y + clamped * ab[1]);
}

export function is_within_distance(a: Vector, b: Vector, threeshold: number) {
	const dx = a.x - b.x;
	const dy = a.y - b.y;

	const distance = Math.hypot(dx, dy);

	return distance <= Math.abs(threeshold);
}

export function calculate_scaled_dimensions(
	top_left: Vector,
	bottom_right: Vector,
	anchor: Vector,
	factor: Vector
) {
	const x = (top_left.x - anchor.x) * factor.x + anchor.x;
	const y = (top_left.y - anchor.y) * factor.y + anchor.y;
	const width = (bottom_right.x - top_left.x) * factor.x;
	const height = (bottom_right.y - top_left.y) * factor.y;

	return {
		x,
		y,
		width,
		height
	};
}

export function calculate_scale_factor(current: Vector, previous: Vector, anchor: Vector) {
	const cur_offset = current.clone().substract(anchor);
	const prev_offset = previous.clone().substract(anchor);

	return Vector.from(cur_offset.x / prev_offset.x, cur_offset.y / prev_offset.y);
}

export function get_tool_by_shortcut(key: string): Tool | null {
	if (!/^\d$/.test(key)) return null;

	return shortcuts[+key - 1] ?? 'pointer';
}
