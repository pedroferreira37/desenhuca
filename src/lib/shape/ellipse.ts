import { Vector } from '$lib/math/vector';
import type { DrawOptions, Shape } from '$lib/types';
import type { RoughCanvas } from 'roughjs/bin/canvas';

export class Ellipse implements Shape {
	type: 'ellipse' = 'ellipse';

	public offset: Vector = new Vector(0, 0);

	public center: Vector = new Vector(0, 0);

	constructor(
		public x: number,
		public y: number,
		public width: number,
		public height: number,
		public options: DrawOptions = { strokeWidth: 4 }
	) {}

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

	intersects(x: number, y: number): boolean {
		const cx = this.x + this.width / 2;
		const cy = this.y + this.height / 2;

		const rx = this.width / 2;
		const ry = this.height / 2;

		const normalized_x = ((x - cx) * (x - cx)) / rx ** 2;
		const normalized_y = ((y - cy) * (y - cy)) / ry ** 2;

		return normalized_x + normalized_y <= 1;
	}

	contains(x: number, y: number): boolean {
		const cx = this.x + this.width / 2;
		const cy = this.y + this.height / 2;

		const rx = this.width / 2;
		const ry = this.height / 2;

		return (x - cx) ** 2 + (y - cy) ** 2 <= (rx + ry) ** 2;
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
	 * The points are ordered as follows
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
		rough.ellipse;
	}

	customize(options: Options): void {
		this.options = { ...this.options, ...options };
	}
}
