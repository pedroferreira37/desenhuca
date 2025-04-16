import { it, expect } from 'vitest';
import { Vector } from '$lib/math/vector';
import create from '$lib/shape-factory';
import { calculateScaleFactor, calculateScaledDimensions } from '$lib/util/util';

it('scale factor is calculated correctly', () => {
	const expected = Vector.from(3, 3);

	const actual = calculateScaleFactor(
		Vector.from(50, 50),
		Vector.from(30, 30),
		Vector.from(20, 20)
	);

	expect(expected.x).toBe(actual.x);
	expect(expected.y).toBe(actual.y);
});

it('handles scaling only in x handle', () => {
	const expected = Vector.from(2, 1);

	const actual = calculateScaleFactor(
		Vector.from(40, 30),
		Vector.from(30, 30),
		Vector.from(20, 20)
	);

	expect(expected.x).toBe(actual.x);
	expect(expected.y).toBe(actual.y);
});

it('handles scaling only in y handle', () => {
	const expected = Vector.from(1, 2);

	const actual = calculateScaleFactor(
		Vector.from(30, 40),
		Vector.from(30, 30),
		Vector.from(20, 20)
	);

	expect(expected.x).toBe(actual.x);
	expect(expected.y).toBe(actual.y);
});

it('handles negative scale factors', () => {
	const expected = Vector.from(-1, -1);

	const actual = calculateScaleFactor(
		Vector.from(10, 10),
		Vector.from(30, 30),
		Vector.from(20, 20)
	);

	expect(expected.x).toBe(actual.x);
	expect(expected.y).toBe(actual.y);
});

it('handles zero scale factor', () => {
	const expected = Vector.from(0, 0);

	const actual = calculateScaleFactor(
		Vector.from(20, 20),
		Vector.from(30, 30),
		Vector.from(20, 20)
	);

	expect(expected.x).toBe(actual.x);
	expect(expected.y).toBe(actual.y);
});

it('scales dimensions correctly with factor (2, 2) and origin anchor', () => {
	const nw = Vector.from(10, 10);
	const se = Vector.from(30, 30);
	const anchor = Vector.from(0, 0);
	const factor = Vector.from(2, 2);

	const expected = {
		x: 20,
		y: 20,
		width: 40,
		height: 40
	};

	const actual = calculateScaledDimensions(nw, se, anchor, factor);

	expect(actual.x).toBe(expected.x);
	expect(actual.y).toBe(expected.y);
	expect(actual.width).toBe(expected.width);
	expect(actual.height).toBe(expected.height);
});

it('scales dimensions correctly with different x and y factors', () => {
	const nw = Vector.from(10, 10);
	const se = Vector.from(30, 30);
	const anchor = Vector.from(0, 0);
	const factor = Vector.from(2, 0.5);

	const expected = {
		x: 20,
		y: 5,
		width: 40,
		height: 10
	};

	const actual = calculateScaledDimensions(nw, se, anchor, factor);

	expect(actual.x).toBe(expected.x);
	expect(actual.y).toBe(expected.y);
	expect(actual.width).toBe(expected.width);
	expect(actual.height).toBe(expected.height);
});

it('handles negative scale factors', () => {
	const nw = Vector.from(10, 10);
	const se = Vector.from(30, 30);
	const anchor = Vector.from(0, 0);
	const factor = Vector.from(-1, -1);

	const expected = {
		x: -10,
		y: -10,
		width: -20,
		height: -20
	};

	const actual = calculateScaledDimensions(nw, se, anchor, factor);

	expect(actual.x).toBe(expected.x);
	expect(actual.y).toBe(expected.y);
	expect(actual.width).toBe(expected.width);
	expect(actual.height).toBe(expected.height);
});

it('scaled resizing is returning the correct dimensions', () => {
	const scale = Vector.from(2, 2);
	const anchor = Vector.from(0, 0);

	const tests = [
		[create('rectangle', 0, 0, 50, 50, {}), create('rectangle', 0, 0, 100, 100, {})],
		[create('ellipse', 0, 0, 50, 50, {}), create('ellipse', 0, 0, 100, 100, {})]
	];

	tests.forEach(([actual]) => {
		actual.reference = [actual.vertices[0], actual.vertices[1]];
	});

	for (const [shape] of tests) {
		shape.reference = [shape.vertices[0], shape.vertices[2]];
	}

	for (const [actual, expected] of tests) {
		const [nw, , se] = expected.vertices;
		const result = calculateScaledDimensions(
			Vector.from(actual.vertices[0].x, actual.vertices[0].y),
			Vector.from(actual.vertices[2].x, actual.vertices[2].y),
			anchor,
			scale
		);

		expect(result.x).toBe(nw.x);
		expect(result.y).toBe(nw.y);
		expect(result.width).toBe(se.x - nw.x);
		expect(result.height).toBe(se.y - nw.y);
	}
});
