import { it, expect } from 'vitest';
import create from '$lib/shape-factory';
import { BoundingBox } from '$lib/collision/bounding-box';
import type { Shape } from '$lib/types';

it('check if bouding box is computing correctly for different shapes', () => {
	const bb = new BoundingBox();
	const expected = new BoundingBox(0, 0, 63, 95);

	const options = {};

	const shapes: Shape[] = [
		create('rectangle', 0, 0, 20, 20, options),
		create('rectangle', 5, 5, 20, 90, options),
		create('rectangle', 3, 3, 60, 20, options),
		create('rectangle', 9, 0, 50, 20, options)
	];

	bb.update(shapes);

	expect(bb.x).toBe(expected.x);
	expect(bb.y).toBe(expected.y);
	expect(bb.width).toBe(expected.width);
	expect(bb.height).toBe(expected.height);
});

it('check if bounding box is computing correctly for an empty list', () => {
	const bb = new BoundingBox();

	bb.update([]);

	expect(bb.x).toBe(0);
	expect(bb.y).toBe(0);
	expect(bb.width).toBe(0);
	expect(bb.height).toBe(0);
});

it('check if bounding box is reseting', () => {
	const bb = new BoundingBox();
	const expected = new BoundingBox(0, 0, 63, 95);

	const options = {};

	const shapes: Shape[] = [
		create('rectangle', 0, 0, 20, 20, options),
		create('rectangle', 5, 5, 20, 90, options),
		create('rectangle', 3, 3, 60, 20, options),
		create('rectangle', 9, 0, 50, 20, options)
	];

	bb.update(shapes);

	expect(bb.x).toBe(expected.x);
	expect(bb.y).toBe(expected.y);
	expect(bb.width).toBe(expected.width);
	expect(bb.height).toBe(expected.height);

	bb.update([]);

	expect(bb.x).toBe(0);
	expect(bb.y).toBe(0);
	expect(bb.width).toBe(0);
	expect(bb.height).toBe(0);
});
