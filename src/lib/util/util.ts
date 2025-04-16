import { RectangularBoundingBox } from '$lib/collision/rectangular-bounding-box';
import type { BoundingBox, Handle, Shape, ShapeType, Tool } from '$lib/types';
import { Vector } from '../math/vector';

const shortcuts: Tool[] = ['pointer', 'pencil', 'rectangle', 'ellipse', 'segment', 'eraser'];

// TODO: will change this to be more cleaner and less math.
export function project_point_on_segment(p: Vector, a: Vector, b: Vector): Vector {
	if (a.x === b.x && a.y === b.y) return a;

	const ab = [b.x - a.x, b.y - a.y];
	const ap = [p.x - a.x, p.y - a.y];

	const t = (ap[0] * ab[0] + ap[1] * ab[1]) / (ab[0] * ab[0] + ab[1] * ab[1]);

	const clamped = Math.max(0, Math.min(1, t));

	return Vector.from(a.x + clamped * ab[0], a.y + clamped * ab[1]);
}

export function is_distance_close(a: Vector, b: Vector, threshold: number) {
	const dx = a.x - b.x;
	const dy = a.y - b.y;

	return dx * dx + dy * dy < threshold * threshold;
}

export function get_scaled_points_based_on_group_resize_ctx(
	type: ShapeType,
	handle: Handle,
	nw: Vector,
	se: Vector,
	anchor: Vector,
	ratio: Vector,
	keep_aspect_ratio: boolean = false
): number[] {
	const x = (nw.x - anchor.x) * ratio.x + anchor.x;
	const y = (nw.y - anchor.y) * ratio.y + anchor.y;
	const width = (se.x - nw.x) * ratio.x;
	const height = (se.y - nw.y) * ratio.y;

	if (keep_aspect_ratio) {
		return [x, y, width, height];
	}

	switch (handle) {
		case 'east':
		case 'west':
			if (type === 'segment') {
				return [
					(nw.x - anchor.x) * ratio.x + anchor.x,
					nw.y,
					(se.x - anchor.x) * ratio.x + anchor.x,
					se.y
				];
			}

			return [x, nw.y, width, se.y - nw.y];

		case 'north':
		case 'south':
			if (type === 'segment') {
				return [
					nw.x,
					(nw.y - anchor.y) * ratio.y + anchor.y,
					se.x,
					(se.y - nw.y) * ratio.y + anchor.y
				];
			}

			return [nw.x, y, se.x - nw.x, height];

		case 'nor-west':
		case 'nor-east':
		case 'south-west':
		case 'south-east':
			if (type === 'segment') {
				const x = (nw.x - anchor.x) * ratio.x + anchor.x;
				const y = (nw.y - anchor.y) * ratio.y + anchor.y;
				const x1 = (se.x - anchor.x) * ratio.x + anchor.x;
				const y1 = (se.y - anchor.y) * ratio.y + anchor.y;

				return [x, y, x1, y1];
			}

			return [x, y, width, height];
		default:
			return [x, y, width, height];
	}
}

export function get_scale_factor(
	handle: Handle,
	current: Vector,
	previous: Vector,
	anchor: Vector,
	keep_aspect_ratio: boolean = false
) {
	const cur_offset = current.substract(anchor);
	const prev_offset = previous.substract(anchor);

	const factor = Vector.from(cur_offset.x / prev_offset.x, cur_offset.y / prev_offset.y);

	if (!keep_aspect_ratio) return factor;

	let scale = Math.max(factor.x, factor.y);

	if (handle === 'west' || handle === 'east') {
		scale = factor.x;
	}

	if (handle === 'north' || handle === 'south') {
		scale = factor.y;
	}

	return Vector.from(scale, scale);
}

export function retrieve_tool_by_shortcut(key: string): Tool | null {
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

export function circle(
	c: CanvasRenderingContext2D,
	x: number,
	y: number,
	cx: number,
	cy: number,
	radius: number,
	angle: number
) {
	if (angle !== 0) {
		c.save();
		c.translate(cx, cy);
		c.rotate(angle);

		c.strokeStyle = '#0b99ff';

		c.beginPath();
		c.arc(x, y, radius, 0, 2 * Math.PI);
		c.stroke();
		c.closePath();

		c.fillStyle = 'white';
		c.beginPath();
		c.arc(x, y, radius, 0, 2 * Math.PI);
		c.fill();
		c.closePath();

		c.restore();
		return;
	}

	c.beginPath();
	c.arc(x, y, radius, 0, 2 * Math.PI);
	c.stroke();
	c.closePath();

	c.fillStyle = 'white';
	c.beginPath();
	c.arc(x, y, radius, 0, 2 * Math.PI);
	c.fill();
	c.closePath();
}
