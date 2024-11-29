import type { RoughCanvas } from 'roughjs/bin/canvas';
import { type Shape, type Direction, type ShapeType, type ShapeOptions } from './types';

import type { Options } from 'roughjs/bin/core';
import { Vector } from './math/vector';

export class Rectangle implements Shape {
	type: ShapeType = 'rectangle';
	x: number = $state(0);
	y: number = $state(0);
	width: number = $state(0);
	height: number = $state(0);

	center: Vector = $state(new Vector(0, 0));

	offset: Vector = $state(new Vector(0, 0));

	options: ShapeOptions = $state({ strokeWidth: 4 });

	constructor(x: number, y: number, width: number, height: number, options: ShapeOptions) {
		this.y = y;
		this.x = x;
		this.width = width;
		this.height = height;
		this.options = options;
	}

	move(x: number, y: number): void {
		this.x = x;
		this.y = y;
	}

	normalize() {
		const min_x = Math.min(this.x, this.x + this.width);
		const max_x = Math.max(this.x, this.x + this.width);
		const min_y = Math.min(this.y, this.y + this.height);
		const max_y = Math.max(this.y, this.y + this.height);

		this.x = min_x;
		this.width = max_x - min_x;
		this.y = min_y;
		this.height = max_y - min_y;
	}

	resize(width: number, height: number): void {
		this.width = width;
		this.height = height;

		const cx = (this.x + this.width) / 2;
		const cy = (this.y + this.height) / 2;

		this.center.set(cx, cy);
	}

	draw(rough: RoughCanvas): void {
		rough.rectangle(this.x, this.y, this.width, this.height, this.options);
	}

	customize(options: ShapeOptions): void {
		this.options = { ...this.options, ...options };
	}

	intersects(v: Vector): boolean {
		const intersects =
			(v.x >= this.x - 10 && v.x <= this.x + 10 && v.y >= this.y && v.y <= this.y + this.height) ||
			(v.x >= this.x + this.width - 10 &&
				v.x <= this.x + this.width + 10 &&
				v.y >= this.y &&
				v.y <= this.y + this.height) ||
			(v.y >= this.y - 10 && v.y <= this.y + 10 && v.x >= this.x && v.x <= this.x + this.width) ||
			(v.y >= this.y + this.height - 10 &&
				v.y <= this.y + this.height + 10 &&
				v.x >= this.x &&
				v.x <= this.x + this.width);

		if (this.options.fillStyle === 'solid') return this.contains(v) || intersects;

		return intersects;
	}

	contains(p: Vector): boolean {
		return (
			p.x >= this.x && p.x <= this.x + this.width && p.y >= this.y && p.y <= this.y + this.height
		);
	}

	/**
	 * Gets the points of the shape relative to its center.
	 * The points are ordered as follows:
	 * - Top-left
	 * - Top-right
	 * - Bottom-left
	 * - Bottom-right
	 *
	 * @returns {Vector[]} An array of `Vector` objects representing the four corners of the rectangle.
	 */
	get points(): Vector[] {
		return [
			new Vector(this.x, this.y),
			new Vector(this.x + this.width, this.y),
			new Vector(this.x, this.y + this.height),
			new Vector(this.x + this.width, this.y + this.height)
		];
	}
}

class Ellipse implements Shape {
	type: ShapeType = 'ellipse';
	private x: number = $state(0);
	private y: number = $state(0);
	private width: number = $state(0);
	private height: number = $state(0);
	private options: ShapeOptions = $state({ strokeWidth: 4 });

	public offset: Vector = $state(new Vector(0, 0));

	public center: Vector = $state(new Vector(0, 0));

	constructor(x: number, y: number, width: number, height: number, options: ShapeOptions) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.options = options;
	}

	resize(width: number, height: number): void {
		this.width = width;
		this.height = height;

		const [cx, cy] = new Vector(this.width, this.height).divide(2).sum(new Vector(this.x, this.y));

		this.center.set(cx, cy);
	}

	move(x: number, y: number): void {
		this.x = x;
		this.y = y;

		const [cx, cy] = new Vector(this.width, this.height).divide(2).sum(new Vector(this.x, this.y));

		this.center.set(cx, cy);
	}

	intersects(v: Vector): boolean {
		const cx = this.x + this.width / 2;
		const cy = this.y + this.height / 2;

		const rx = this.width / 2;
		const ry = this.height / 2;

		const normalized_x = ((v.x - cx) * (v.x - cx)) / rx ** 2;
		const normalized_y = ((v.y - cy) * (v.y - cy)) / ry ** 2;

		return normalized_x + normalized_y <= 1;
	}

	contains(v: Vector): boolean {
		const cx = this.x + this.width / 2;
		const cy = this.y + this.height / 2;

		const rx = this.width / 2;
		const ry = this.height / 2;

		return (v.x - cx) ** 2 + (v.y - cy) ** 2 <= (rx + ry) ** 2;
	}

	normalize() {
		const min_x = Math.min(this.x, this.x + this.width);
		const max_x = Math.max(this.x, this.x + this.width);
		const min_y = Math.min(this.y, this.y + this.height);
		const max_y = Math.max(this.y, this.y + this.height);

		this.x = min_x;
		this.width = max_x - min_x;
		this.y = min_y;
		this.height = max_y - min_y;
	}

	/**
	 * Gets the points of the shape relative to its center.
	 * The points are ordered as follows:
	 * - Top-left
	 * - Top-right
	 * - Bottom-left
	 * - Bottom-right
	 *
	 * @returns {Vector[]} An array of `Vector` objects representing the four corners of the rectangle.
	 */

	get points(): Vector[] {
		const cx = this.x + this.width / 2;
		const cy = this.y + this.height / 2;

		const rx = this.width / 2;
		const ry = this.height / 2;

		return [
			new Vector(cx - rx, cy - ry),
			new Vector(cx + rx, cy - ry),
			new Vector(cx - rx, cy + ry),
			new Vector(cx + rx, cy + ry)
		];
	}

	draw(rough: RoughCanvas): void {
		rough.ellipse(this.center.x, this.center.y, this.width, this.height, this.options);
	}

	customize(options: Options): void {
		this.options = { ...this.options, ...options };
	}
}

export function create_shape(
	type: ShapeType,
	x: number,
	y: number,
	width: number,
	height: number,
	options: Options
) {
	switch (type) {
		case 'rectangle':
			return new Rectangle(x, y, width, height, options);
		case 'ellipse':
			return new Ellipse(x, y, width, height, options);
		default:
			throw new Error('invalid mode');
	}
}
