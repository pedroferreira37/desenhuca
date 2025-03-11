import { Vector } from '$lib/math/vector';
import type { Direction, DrawOptions, Shape } from '$lib/types';
import type { RoughCanvas } from 'roughjs/bin/canvas';

const PADDING = 16;

export class Rectangle implements Shape {
	public id: string = crypto.randomUUID();

	public type: 'rectangle' = 'rectangle';

	public offset: Vector = Vector.zero();

	public angle: number = 0;

	public reference: Vector[] = [];

	constructor(
		private x: number = 0,
		private y: number = 0,
		private width: number,
		private height: number,
		public options: DrawOptions
	) {}

	move(v: Vector) {
		this.x = v.x;
		this.y = v.y;
	}

	set_offset(v: Vector) {
		const offset = v.clone().substract(Vector.from(this.x, this.y));
		this.offset.set(offset.x, offset.y);
	}

	normalize() {
		const min = Vector.from(
			Math.min(this.x, this.x + this.width),
			Math.min(this.y, this.y + this.height)
		);

		const max = Vector.from(
			Math.max(this.x, this.x + this.width),
			Math.max(this.y, this.y + this.height)
		);

		this.x = min.x;
		this.y = min.y;

		const size = max.substract(min);

		this.width = size.x;
		this.height = size.y;
	}

	resize(width: number, height: number) {
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

	rotate(angle: number) {
		this.angle += angle;
	}

	get rotated(): boolean {
		return this.angle !== 0;
	}

	draw(c: CanvasRenderingContext2D, r: RoughCanvas) {
		if (this.rotated) {
			c.save();
			c.translate(this.center.x, this.center.y);
			c.rotate(this.angle);
			r.rectangle(-this.width / 2, -this.height / 2, this.width, this.height, this.options);
			c.restore();
			return;
		}

		r.rectangle(this.x, this.y, this.width, this.height, this.options);
	}

	intersects(v: Vector): boolean {
		const p = v.clone().rotate(this.center.x, this.center.y, -this.angle);

		return (
			p.x >= this.x - PADDING &&
			p.x <= this.x + this.width + PADDING &&
			p.y >= this.y - PADDING &&
			p.y <= this.y + this.height + PADDING &&
			(p.y < this.y + PADDING ||
				p.y > this.y + this.height - PADDING ||
				p.x < this.x + PADDING ||
				p.x > this.x + this.width - PADDING)
		);
	}

	contains(v: Vector): boolean {
		const p = v.clone().rotate(this.center.x, this.center.y, -this.angle);

		return (
			p.x >= this.x && p.x <= this.x + this.width && p.y >= this.y && p.y <= this.y + this.height
		);
	}

	get center(): Vector {
		return Vector.from(this.x + this.width / 2, this.y + this.height / 2);
	}

	get vertices(): Vector[] {
		return [
			Vector.from(this.x, this.y),
			Vector.from(this.x, this.y + this.height),
			Vector.from(this.x + this.width, this.y + this.height),
			Vector.from(this.x + this.width, this.y)
		];
	}
}
