import { Vector } from '$lib/math/vector';
import type { Direction, DrawOptions, RotationOptions, Shape } from '$lib/types';
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

	move(v: Vector): void {
		this.x = v.x;
		this.y = v.y;
	}

	rotate(angle: number) {
		this.angle = angle;
	}

	intersects(v: Vector): boolean {
		const cx = this.x + this.width / 2;
		const cy = this.y + this.height / 2;

		const rx = this.width / 2;
		const ry = this.height / 2;

		const xnormalized = ((v.x - cx) * (v.x - cx)) / rx ** 2;
		const ynormalized = ((v.y - cy) * (v.y - cy)) / ry ** 2;

		return xnormalized + ynormalized <= 1;
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
		const c = mouse;

		const [nw, sw, se, ne] = this.vertices;

		switch (direction) {
			case 'south-west': {
				const ne = Vector.from(this.x + this.width, this.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = ne.sum(c).divide(2);

				const adjustedNw = ne.rotate(center.x, center.y, -this.angle);

				const sw = c.rotate(center.x, center.y, -this.angle);

				this.x = sw.x;
				this.y = adjustedNw.y;
				this.width = adjustedNw.x - sw.x;
				this.height = sw.y - adjustedNw.y;

				break;
			}

			case 'south-east': {
				const nw = Vector.from(this.x, this.y).rotate(this.center.x, this.center.y, this.angle);

				const center = nw.sum(mouse).divide(2);

				const adjustedNw = nw.rotate(center.x, center.y, -this.angle);
				const se = c.rotate(center.x, center.y, -this.angle);

				this.x = adjustedNw.x;
				this.y = adjustedNw.y;
				this.width = se.x - adjustedNw.x;
				this.height = se.y - adjustedNw.y;

				break;
			}

			case 'nor-east': {
				const sw = Vector.from(this.x, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = sw.sum(mouse).divide(2);

				const adjustedSw = sw.rotate(center.x, center.y, -this.angle);

				const nw = c.rotate(center.x, center.y, -this.angle);

				this.x = adjustedSw.x;
				this.y = nw.y;
				this.width = nw.x - adjustedSw.x;
				this.height = adjustedSw.y - nw.y;

				break;
			}

			case 'nor-west': {
				const se = Vector.from(this.x + this.width, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = se.sum(mouse).divide(2);

				const adjustedSe = se.rotate(center.x, center.y, -this.angle);
				const nw = c.rotate(center.x, center.y, -this.angle);

				this.x = nw.x;
				this.y = nw.y;
				this.width = adjustedSe.x - nw.x;
				this.height = adjustedSe.y - nw.y;

				break;
			}

			case 'east': {
				const nw = Vector.from(this.x, this.y).rotate(this.center.x, this.center.y, this.angle);

				const cursor = Vector.from(c.x, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = nw.sum(cursor).divide(2);

				const adjustedNw = nw.rotate(center.x, center.y, -this.angle);
				const se = cursor.rotate(center.x, center.y, -this.angle);

				this.x = adjustedNw.x;
				this.y = adjustedNw.y;
				this.width = se.x - adjustedNw.x;
				this.height = se.y - adjustedNw.y;
				break;
			}

			case 'south': {
				const nw = Vector.from(this.x, this.y).rotate(this.center.x, this.center.y, this.angle);

				const cursor = Vector.from(this.x + this.width, mouse.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = nw.sum(cursor).divide(2);

				const adjustedNw = nw.rotate(center.x, center.y, -this.angle);
				const se = cursor.rotate(center.x, center.y, -this.angle);

				this.x = adjustedNw.x;
				this.y = adjustedNw.y;
				this.width = se.x - adjustedNw.x;
				this.height = se.y - adjustedNw.y;
				break;
			}

			case 'north': {
				const ne = Vector.from(this.x, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const cursor = Vector.from(this.x + this.width, mouse.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = ne.sum(cursor).divide(2);

				const adjustedSw = ne.rotate(center.x, center.y, -this.angle);
				const nw = cursor.rotate(center.x, center.y, -this.angle);

				this.x = adjustedSw.x;
				this.y = nw.y;
				this.width = nw.x - adjustedSw.x;
				this.height = adjustedSw.y - nw.y;

				break;
			}

			case 'west': {
				const ne = Vector.from(this.x + this.width, this.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const cursor = Vector.from(mouse.x, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = ne.sum(cursor).divide(2);

				const adjustedNe = ne.rotate(center.x, center.y, -this.angle);
				const sw = cursor.rotate(center.x, center.y, -this.angle);

				this.x = sw.x;
				this.y = adjustedNe.y;
				this.width = adjustedNe.x - sw.x;
				this.height = sw.y - adjustedNe.y;

				break;
			}
		}
	}

	normalize() {
		const xmin = Math.min(this.x, this.x + this.width);
		const xmax = Math.max(this.x, this.x + this.width);
		const ymin = Math.min(this.y, this.y + this.height);
		const ymax = Math.max(this.y, this.y + this.height);

		this.x = xmin;
		this.width = xmax - xmin;
		this.y = ymin;
		this.height = ymax - ymin;
	}

	draw(c: CanvasRenderingContext2D, r: RoughCanvas) {
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
