import { it, expect, describe } from 'vitest';
import { isDistanceClose, projectPointOnSegment } from '$lib/util/util';
import { Vector } from '$lib/math/vector';

it('projects a point on a segment when point is directly on the segment', () => {
	const a = Vector.from(1, 1);
	const b = Vector.from(3, 3);
	const p = Vector.from(2, 2);

	const v = projectPointOnSegment(p, a, b);

	expect(v.x).toBeCloseTo(2);
	expect(v.y).toBeCloseTo(2);
});

it('projects a point on a segment when point is off the segment', () => {
	const a = Vector.from(1, 1);
	const b = Vector.from(3, 3);
	const p = Vector.from(3, 1);

	const v = projectPointOnSegment(p, a, b);

	expect(v.x).toBeCloseTo(2);
	expect(v.y).toBeCloseTo(2);
});

it('returns endpoint a when projection is beyond a', () => {
	const a = Vector.from(1, 1);
	const b = Vector.from(3, 3);
	const p = Vector.from(0, 0);

	const v = projectPointOnSegment(p, a, b);

	expect(v.x).toBeCloseTo(1);
	expect(v.y).toBeCloseTo(1);
});

it('returns endpoint b when projection is beyond b', () => {
	const a = Vector.from(1, 1);
	const b = Vector.from(3, 3);
	const p = Vector.from(5, 5);

	const v = projectPointOnSegment(p, a, b);

	expect(v.x).toBeCloseTo(3);
	expect(v.y).toBeCloseTo(3);
});

it('handles horizontal segments correctly', () => {
	const a = Vector.from(0, 1);
	const b = Vector.from(5, 1);
	const p = Vector.from(2, 3);

	const v = projectPointOnSegment(p, a, b);

	expect(v.x).toBeCloseTo(2);
	expect(v.y).toBeCloseTo(1);
});

it('handles vertical segments correctly', () => {
	const a = Vector.from(1, 0);
	const b = Vector.from(1, 5);
	const p = Vector.from(3, 2);

	const v = projectPointOnSegment(p, a, b);

	expect(v.x).toBeCloseTo(1);
	expect(v.y).toBeCloseTo(2);
});

it('handles zero-length segments by returning start point', () => {
	const a = Vector.from(1, 1);
	const b = Vector.from(1, 1);
	const p = Vector.from(3, 3);

	const v = projectPointOnSegment(p, a, b);

	expect(v.x).toBeCloseTo(1);
	expect(v.y).toBeCloseTo(1);
});

it('returns true when points are within the specified distance', () => {
	const a = Vector.from(1, 1);
	const b = Vector.from(3, 3);

	const isClose = isDistanceClose(a, b, 5);

	expect(isClose).toBe(true);
});

it('returns false when points exceed the specified distance', () => {
	const a = Vector.from(1, 1);
	const b = Vector.from(5, 5);

	const isClose = isDistanceClose(a, b, 5);

	expect(isClose).toBe(false);
});

it('returns true when points are exactly at the specified distance', () => {
	const a = Vector.from(0, 0);
	const b = Vector.from(3, 4);

	const isClose = isDistanceClose(a, b, 5);

	expect(isClose).toBe(true);
});

it('returns true when points are the same (distance is zero)', () => {
	const a = Vector.from(2, 2);
	const b = Vector.from(2, 2);

	const isClose = isDistanceClose(a, b, 5);

	expect(isClose).toBe(true);
});

it('handles negative distance by treating it as absolute value', () => {
	const a = Vector.from(1, 1);
	const b = Vector.from(3, 3);

	const isClose = isDistanceClose(a, b, -5);

	expect(isClose).toBe(true);
});

it('handles zero distance threshold correctly', () => {
	const a = Vector.from(1, 1);
	const b = Vector.from(1, 1);

	const isClose = isDistanceClose(a, b, 0);
	expect(isClose).toBe(true);

	const isNotClose = isDistanceClose(a, Vector.from(1, 1.001), 0);
	expect(isNotClose).toBe(false);
});
