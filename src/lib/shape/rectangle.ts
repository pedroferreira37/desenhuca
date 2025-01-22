import { BoundingBox } from '$lib/collision/bounding-box';
import { Vector } from '$lib/math/vector';
import type { DrawOptions, Shape } from '$lib/types';
import { rotate } from '$lib/util/util';
import type { RoughCanvas } from 'roughjs/bin/canvas';

function uuid() {
	return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
		const random = (Math.random() * 16) | 0; // Generate a random number between 0 and 15
		const value = char === 'x' ? random : (random & 0x3) | 0x8; // Set the high bits of `y` to `10`
		return value.toString(16); // Convert to hexadecimal
	});
}

// Example usage:
export class Rectangle implements Shape {
	private _type: 'rectangle' = 'rectangle';

	public offset: Vector = new Vector(0, 0);

	private _history: Vector[] = [];

	constructor(
		private x: number,
		private y: number,
		private width: number,
		private height: number,
		private rotation: number = 0,
		public options: DrawOptions
	) {}

	move(x: number, y: number): void {
		this.x = x;
		this.y = y;
	}

	get history(): Vector[] {
		return this._history;
	}

	save() {
		const [nw, , sw] = this.vertices;
		this._history = [nw, sw];
	}

	update_offset(x: number, y: number) {
		this.offset.set(x - this.x, y - this.y);
	}

	normalize() {
		const min = new Vector(
			Math.min(this.x, this.x + this.width),
			Math.min(this.y, this.y + this.height)
		);
		const max = new Vector(
			Math.max(this.x, this.x + this.width),
			Math.max(this.y, this.y + this.height)
		);

		this.x = min.x;
		this.y = min.y;

		const size = max.substract(min);

		this.width = size.x;
		this.height = size.y;
	}

	resize(width: number, height: number): void {
		this.width = width;
		this.height = height;
	}

	rotate(angle: number) {
		this.rotation += angle;
	}

	draw(c: CanvasRenderingContext2D, r: RoughCanvas): void {
		c.lineWidth = 8;

		if (this.rotation !== 0) {
			c.save();

			c.translate(this.x + this.width / 2, this.y + this.height / 2);

			c.rotate(this.rotation);

			r.rectangle(-this.width / 2, -this.height / 2, this.width, this.height, this.options);

			c.restore();
			return;
		}

		r.rectangle(this.x, this.y, this.width, this.height, this.options);
	}

	intersects(other: Vector): boolean {
		const vpos = rotate([other], this.cx, this.cy, -this.rotation)[0];
		/*
		 * !(
		 
			x < this.x ||
			x > this.x + this.width ||
			y < this.y ||
			y > this.y + this.height 

			)
		 *
		 */

		return (
			vpos.x >= this.x - 10 &&
			vpos.x <= this.x + this.width + 10 &&
			vpos.y >= this.y - 10 &&
			vpos.y <= this.y + this.height + 10 &&
			(vpos.y < this.y ||
				vpos.y > this.y + this.height ||
				vpos.x < this.x ||
				vpos.x > this.x + this.width)
		);
	}

	contains(x: number, y: number): boolean {
		return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
	}

	get cx(): number {
		return this.x + this.width / 2;
	}

	get cy(): number {
		return this.y + this.height / 2;
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

	get vertices(): Vector[] {
		const cx = this.x + this.width / 2;
		const cy = this.y + this.height / 2;

		return [
			new Vector(this.x, this.y),
			new Vector(this.x, this.y + this.height),
			new Vector(this.x + this.width, this.y + this.height),
			new Vector(this.x + this.width, this.y)
		];
	}

	get AABB() {
		return new BoundingBox(this.x - 4, this.y - 4, this.width + 8, this.height + 8, this.rotation);
	}
}
