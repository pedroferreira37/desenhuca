import { RectangularBoundingBox } from '$lib/collision/rectangular-bounding-box';
import type { BoundingBox, Direction, Shape, Tool } from '$lib/types';
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

export function calculate_scaled_dimensions(nw: Vector, se: Vector, anchor: Vector, ratio: Vector) {
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

export function calculate_scale_factor(current: Vector, previous: Vector, anchor: Vector) {
	const currentOfsset = current.substract(anchor);
	const previousOffset = previous.substract(anchor);

	return Vector.from(currentOfsset.x / previousOffset.x, currentOfsset.y / previousOffset.y);
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

export function create_rectangular_bounding_box(entries: Shape[]): BoundingBox {
	let xmin = Infinity;
	let xmax = -Infinity;
	let ymin = Infinity;
	let ymax = -Infinity;

	entries.forEach((entry) => {
		const vertices =
			entry.angle !== 0
				? entry.vertices.map((vertex) => vertex.rotate(entry.center.x, entry.center.y, entry.angle))
				: entry.vertices;

		vertices.forEach((vertex) => {
			xmax = Math.max(xmax, vertex.x);
			xmin = Math.min(xmin, vertex.x);
			ymin = Math.min(ymin, vertex.y);
			ymax = Math.max(ymax, vertex.y);
		});
	});

	return new RectangularBoundingBox(xmin, ymin, xmax, ymax, 0);
}
