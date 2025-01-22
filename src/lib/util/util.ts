import { BoundingBox } from '$lib/collision/bounding-box';
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

export function rotate(vertices: Vector[], cx: number, cy: number, rad: number) {
	return vertices.map(
		(v) =>
			new Vector(
				cx + (v.x - cx) * Math.cos(rad) - (v.y - cy) * Math.sin(rad),
				cy + (v.x - cx) * Math.sin(rad) + (v.y - cy) * Math.cos(rad)
			)
	);
}

export function get_ptr_direction(pos: Vector, bb: BoundingBox | null): Direction | null {
	if (!bb) return null;

	const offset = 8;

	const vertices = bb.vertices;

	const [nw, sw, ne, se] = rotate(vertices, bb.cx, bb.cy, bb.rotation);

	if (
		!(
			pos.x <= nw.x - offset ||
			pos.x >= nw.x + offset ||
			pos.y <= nw.y - offset ||
			pos.y >= nw.y + offset
		)
	) {
		return 'nor-west';
	}

	if (
		!(
			pos.x <= sw.x - offset ||
			pos.x >= sw.x + offset ||
			pos.y <= sw.y - offset ||
			pos.y >= sw.y + offset
		)
	) {
		return 'south-west';
	}

	if (
		!(
			pos.x <= ne.x - offset * 2 ||
			pos.x >= ne.x + offset * 2 ||
			pos.y <= ne.y - offset * 2 ||
			pos.y >= ne.y + offset * 2
		)
	) {
		return 'south-east';
	}

	if (
		!(pos.x <= se.x || pos.x >= se.x + offset || pos.y <= se.y - offset || pos.y >= se.y + offset)
	) {
		return 'nor-east';
	}

	const vpos = rotate([pos], bb.cx, bb.cy, -bb.rotation)[0];

	if (
		vpos.x < bb.x - offset * 2 ||
		vpos.x > bb.x + bb.width + offset * 2 ||
		vpos.x < bb.y - offset * 2 ||
		vpos.y > bb.y + bb.height + offset * 2
	) {
		return null;
	}

	if (
		vpos.x >= bb.x - offset &&
		vpos.x <= bb.x + offset &&
		vpos.y >= bb.y - offset &&
		vpos.y <= bb.y + bb.height - offset
	) {
		if (bb.rotation >= 0.4 && bb.rotation <= 1) return 'nor-west';
		if (bb.rotation >= 1 && bb.rotation <= 1.6) return 'south';
		if (bb.rotation >= 1.6 && bb.rotation <= 2.9) return 'nor-east';

		return 'west';
	}

	if (
		vpos.x >= bb.x + bb.width - offset &&
		vpos.x <= bb.x + bb.width + offset &&
		vpos.x >= bb.y + offset &&
		vpos.y <= bb.y + bb.height - offset
	) {
		return 'east';
	}

	if (
		pos.x >= bb.x + offset &&
		pos.x <= bb.x + bb.width - offset &&
		pos.y >= bb.y - offset &&
		pos.y <= bb.y + offset
	) {
		return 'north';
	}

	if (
		vpos.x >= bb.x + offset &&
		vpos.x <= bb.x + bb.width - offset &&
		vpos.y >= bb.y + bb.height - offset &&
		vpos.y <= bb.y + bb.height + offset
	) {
		return 'south';
	}

	return null;
}

export function update_anchor_pos(pos: Vector, anchor: Vector, box: BoundingBox) {
	const ptr_dir = get_ptr_direction(pos, box);

	const [nw, , se] = box.vertices;

	switch (ptr_dir) {
		case 'east':
			anchor.set(nw.x, nw.y);
			break;
		case 'west':
			anchor.set(se.x, nw.x);
			break;
		case 'south':
			anchor.set(nw.x, nw.y);
			break;
		case 'north':
			anchor.set(nw.x, se.y);
			break;
		case 'south-east':
			anchor.set(nw.x, box.y);
			break;
		case 'south-west':
			anchor.set(se.x, nw.y);
			break;
		case 'nor-west':
			anchor.set(se.x, se.y);
			break;
		case 'nor-east':
			anchor.set(nw.x, se.y);
			break;
	}
}

export function compute_bounding_box(shapes: Shape[]): BoundingBox | null {
	if (!shapes.length) return null;

	let min_x = Infinity;
	let max_x = -Infinity;
	let min_y = Infinity;
	let max_y = -Infinity;
	const rotation = shapes.length > 1 ? 0 : shapes[0].rotation;

	for (let i = 0; i < shapes.length; i++) {
		const s = shapes[i];

		const [nw, sw, se, ne] =
			s.rotation !== 0 && shapes.length > 1
				? rotate(s.vertices, s.cx, s.cy, s.rotation)
				: s.vertices;

		min_x = Math.min(min_x, nw.x, sw.x, se.x, ne.x);
		max_x = Math.max(max_x, nw.x, sw.x, se.x, ne.x);
		min_y = Math.min(min_y, nw.y, sw.y, se.y, ne.y);
		max_y = Math.max(max_y, nw.y, sw.y, se.y, ne.y);
	}

	return new BoundingBox(min_x - 4, min_y - 4, max_x - min_x + 8, max_y - min_y + 8, rotation);
}
