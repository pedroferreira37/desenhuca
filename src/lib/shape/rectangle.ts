import { Vector } from '$lib/math/vector';
import type { Direction, DrawOptions, Shape } from '$lib/types';
import { uuid } from '$lib/util/util';
import type { RoughCanvas } from 'roughjs/bin/canvas';

const PADDING = 16;

export class Rectangle implements Shape {
	public id: string = uuid();

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

	rotate(angle: number) {
		this.angle = angle;
	}

	intersects(v: Vector): boolean {
		const p = v.rotate(this.center.x, this.center.y, -this.angle);

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
		const p = v.rotate(this.center.x, this.center.y, -this.angle);

		return (
			p.x >= this.x && p.x <= this.x + this.width && p.y >= this.y && p.y <= this.y + this.height
		);
	}

	resize(width: number, height: number) {
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

	draw(c: CanvasRenderingContext2D, r: RoughCanvas) {
		if (this.rotated) {
			c.save();
			c.translate(this.center.x, this.center.y);
			c.rotate(this.angle);
			r.rectangle(-this.width / 2, -this.height / 2, this.width, this.height, this.options);
			c.restore();
			return;
		}

		c.save();
		r.rectangle(this.x, this.y, this.width, this.height, this.options);
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

	get center(): Vector {
		return Vector.from(this.x + this.width / 2, this.y + this.height / 2);
	}

	get rotated(): boolean {
		return this.angle !== 0;
	}
}
