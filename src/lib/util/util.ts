import type { Direction, Tool } from '$lib/types';
import { Vector } from '../math/vector';

const shortcuts: Tool[] = ['pointer', 'pencil', 'rectangle', 'ellipse', 'segment', 'eraser'];

// TODO: will change this to be more cleaner and less math.
export function projectPointOnSegment(p: Vector, a: Vector, b: Vector): Vector {
	if (a.x === b.x && a.y === b.y) return a;

	const ab = [b.x - a.x, b.y - a.y];
	const ap = [p.x - a.x, p.y - a.y];

	const t = (ap[0] * ab[0] + ap[1] * ab[1]) / (ab[0] * ab[0] + ab[1] * ab[1]);

	const clamped = Math.max(0, Math.min(1, t));

	return Vector.from(a.x + clamped * ab[0], a.y + clamped * ab[1]);
}

export function isDistanceClose(a: Vector, b: Vector, threeshold: number) {
	const dx = a.x - b.x;
	const dy = a.y - b.y;

	const distance = Math.hypot(dx, dy);

	return distance <= Math.abs(threeshold);
}

export function calculateScaledDimensions(nw: Vector, se: Vector, anchor: Vector, ratio: Vector) {
	const x = (nw.x - anchor.x) * ratio.x + anchor.x;
	const y = (nw.y - anchor.y) * ratio.y + anchor.y;
	const width = (se.x - nw.x) * ratio.x;
	const height = (se.y - nw.y) * ratio.y;

	return {
		x,
		y,
		width,
		height
	};
}

export function calculateScaleFactor(current: Vector, previous: Vector, anchor: Vector) {
	const currentOfsset = current.substract(anchor);
	const previousOffset = previous.substract(anchor);

	return Vector.from(currentOfsset.x / previousOffset.x, currentOfsset.y / previousOffset.y);
}

export function retrieveToolByShortcut(key: string): Tool | null {
	if (!/^\d$/.test(key)) return null;

	return shortcuts[+key - 1] ?? 'pointer';
}

export function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
		var r = (Math.random() * 16) | 0,
			v = c == 'x' ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}
