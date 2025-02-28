import { Gizmo } from '$lib/collision/bounding-box';
import { Vector } from '../math/vector';
import type { Tool, Direction, Shape } from '../types';

export const KeyShortcuts: Map<string, Tool> = new Map([
	['1', 'pointer'],
	['2', 'pencil'],
	['3', 'rectangle'],
	['4', 'ellipse'],
	['5', 'segment'],
	['6', 'eraser']
]);

export function project_point_on_segment(p: Vector, a: Vector, b: Vector): Vector {
	const ab = [b.x - a.x, b.y - a.y];
	const ap = [p.x - a.x, p.y - a.y];

	const t = (ap[0] * ab[0] + ap[1] * ab[1]) / (ab[0] * ab[0] + ab[1] * ab[1]);

	const clamped = Math.max(0, Math.min(1, t));

	return new Vector(a.x + clamped * ab[0], a.y + clamped * ab[1]);
}
