import { it, expect, describe, test } from 'vitest';
import { Vector } from '$lib/math/vector';

describe('Vector operations', () => {
	const a = new Vector(1, 2);
	const b = new Vector(3, 4);

	test('should sum two vectors', () => {
		const result = a.sum(b);
		expect(result.x).toBe(4);
		expect(result.y).toBe(6);
	});

	test('should subtract two vectors', () => {
		const result = b.substract(a);
		expect(result.x).toBe(2);
		expect(result.y).toBe(2);
	});

	test('should rotate a vector around origin', () => {
		const point = new Vector(1, 0);
		const result = Vector.rotate(point, 0, 0, Math.PI / 2);

		expect(result.x).toBeCloseTo(0);
		expect(result.y).toBeCloseTo(1);
	});

	test('should stay the same when rotated by 0 degrees', () => {
		const point = new Vector(1, 1);

		const result = Vector.rotate(point, 0, 0, 0);

		expect(result.x).toBe(1);
		expect(result.y).toBe(1);
	});
});
