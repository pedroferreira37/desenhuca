import { Vector } from '$lib/math/vector';
import type { Direction, DrawOptions, Shape } from '$lib/types';
import type { RoughCanvas } from 'roughjs/bin/canvas';

export class Ellipse implements Shape {
	public type: 'ellipse' = 'ellipse';

	public offset: Vector = Vector.zero();

	public angle: number = 0;

	public reference: Vector[] = [];

	constructor(
		private x: number = 0,
		private y: number = 0,
		private width: number,
		private height: number,
		private options: DrawOptions
	) {}

	set_offset(v: Vector): void {
		const offset = v.clone().substract(Vector.from(this.x, this.y));
		this.offset.set(offset.x, offset.y);
	}

	move(v: Vector): void {
		this.x = v.x;
		this.y = v.y;
	}

	rotate(angle: number) {
		this.angle += angle;
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

	resize(width: number, height: number): void {
		this.width = width;
		this.height = height;
	}

	adjust(direction: Direction, mouse: Vector) {
		const c = mouse.clone();

		switch (direction) {
			case 'south-west': {
				const top_right = Vector.from(this.x + this.width, this.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = top_right.clone().sum(c).divide(2);

				const adjusted_top_right = top_right.rotate(center.x, center.y, -this.angle);

				const bottom_left = c.rotate(center.x, center.y, -this.angle);

				this.x = bottom_left.x;
				this.y = adjusted_top_right.y;
				this.width = adjusted_top_right.x - bottom_left.x;
				this.height = bottom_left.y - adjusted_top_right.y;

				break;
			}

			case 'south-east': {
				const top_left = Vector.from(this.x, this.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = top_left.clone().sum(mouse).divide(2);

				const adjusted_top_left = top_left.rotate(center.x, center.y, -this.angle);
				const bottom_right = c.rotate(center.x, center.y, -this.angle);

				this.x = adjusted_top_left.x;
				this.y = adjusted_top_left.y;
				this.width = bottom_right.x - adjusted_top_left.x;
				this.height = bottom_right.y - adjusted_top_left.y;

				break;
			}

			case 'nor-east': {
				const bottom_left = Vector.from(this.x, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = bottom_left.clone().sum(mouse).divide(2);

				const adjusted_bottom_left = bottom_left.rotate(center.x, center.y, -this.angle);

				const top_right = c.rotate(center.x, center.y, -this.angle);

				this.x = adjusted_bottom_left.x;
				this.y = top_right.y;
				this.width = top_right.x - adjusted_bottom_left.x;
				this.height = adjusted_bottom_left.y - top_right.y;

				break;
			}

			case 'nor-west': {
				const bottom_right = Vector.from(this.x + this.width, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = bottom_right.clone().sum(mouse).divide(2);

				const adjusted_bottom_right = bottom_right.rotate(center.x, center.y, -this.angle);
				const top_right = c.rotate(center.x, center.y, -this.angle);

				this.x = top_right.x;
				this.y = top_right.y;
				this.width = adjusted_bottom_right.x - top_right.x;
				this.height = adjusted_bottom_right.y - top_right.y;

				break;
			}

			case 'east': {
				const top_left = Vector.from(this.x, this.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const cursor = Vector.from(c.x, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = top_left.clone().sum(cursor).divide(2);

				const adjusted_top_left = top_left.rotate(center.x, center.y, -this.angle);
				const bottom_right = cursor.rotate(center.x, center.y, -this.angle);

				this.x = adjusted_top_left.x;
				this.y = adjusted_top_left.y;
				this.width = bottom_right.x - top_left.x;
				this.height = bottom_right.y - top_left.y;
				break;
			}

			case 'south': {
				const top_left = Vector.from(this.x, this.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const cursor = Vector.from(this.x + this.width, mouse.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = top_left.clone().sum(cursor).divide(2);

				const adjusted_top_left = top_left.rotate(center.x, center.y, -this.angle);
				const bottom_right = cursor.rotate(center.x, center.y, -this.angle);

				this.x = adjusted_top_left.x;
				this.y = adjusted_top_left.y;
				this.width = bottom_right.x - adjusted_top_left.x;
				this.height = bottom_right.y - adjusted_top_left.y;
				break;
			}

			case 'north': {
				const bottom_right = Vector.from(this.x, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const cursor = Vector.from(this.x + this.width, mouse.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = bottom_right.clone().sum(cursor).divide(2);

				const adjusted_bottom_right = bottom_right.rotate(center.x, center.y, -this.angle);
				const top_right = cursor.rotate(center.x, center.y, -this.angle);

				this.x = adjusted_bottom_right.x;
				this.y = top_right.y;
				this.width = top_right.x - adjusted_bottom_right.x;
				this.height = adjusted_bottom_right.y - top_right.y;

				break;
			}

			case 'west': {
				const top_right = Vector.from(this.x + this.width, this.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const cursor = Vector.from(mouse.x, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = top_right.clone().sum(cursor).divide(2);

				const adjusted_top_right = top_right.rotate(center.x, center.y, -this.angle);
				const bottom_left = cursor.rotate(center.x, center.y, -this.angle);

				this.x = bottom_left.x;
				this.y = adjusted_top_right.y;
				this.width = adjusted_top_right.x - bottom_left.x;
				this.height = bottom_left.y - top_right.y;

				break;
			}
		}
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

	draw(c: CanvasRenderingContext2D, r: RoughCanvas): void {
		if (this.rotated) {
			c.save();
			c.translate(this.center.x, this.center.y);
			c.rotate(this.angle);
			r.ellipse(0, 0, this.width, this.height, this.options);
			c.restore();
			return;
		}

		c.save();
		r.ellipse(this.center.x, this.center.y, this.width, this.height, this.options);
		c.restore();
	}

	get vertices(): Vector[] {
		return [
			Vector.from(this.x, this.y),
			Vector.from(this.x, this.y + this.height),
			Vector.from(this.x + this.width, this.y + this.height),
			Vector.from(this.x + this.width, this.y)
		];
	}

	get center() {
		return Vector.from(this.x + this.width / 2, this.y + this.height / 2);
	}

	get rotated() {
		return this.angle !== 0;
	}
}
