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
				const ne = Vector.from(this.x + this.width, this.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = ne.clone().sum(c).divide(2);

				const new_ne = ne.rotate(center.x, center.y, -this.angle);

				const sw = c.rotate(center.x, center.y, -this.angle);

				this.x = sw.x;
				this.y = new_ne.y;
				this.width = new_ne.x - sw.x;
				this.height = sw.y - new_ne.y;

				break;
			}

			case 'south-east': {
				const nw = Vector.from(this.x, this.y).rotate(this.center.x, this.center.y, this.angle);

				const center = nw.clone().sum(mouse).divide(2);

				const new_ne = nw.rotate(center.x, center.y, -this.angle);
				const se = c.rotate(center.x, center.y, -this.angle);

				this.x = new_ne.x;
				this.y = new_ne.y;
				this.width = se.x - new_ne.x;
				this.height = se.y - new_ne.y;

				break;
			}

			case 'nor-east': {
				const sw = Vector.from(this.x, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = sw.clone().sum(mouse).divide(2);

				const new_sw = sw.rotate(center.x, center.y, -this.angle);

				const ne = c.rotate(center.x, center.y, -this.angle);

				this.x = new_sw.x;
				this.y = ne.y;
				this.width = ne.x - new_sw.x;
				this.height = new_sw.y - ne.y;

				break;
			}

			case 'nor-west': {
				const se = Vector.from(this.x + this.width, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = se.clone().sum(mouse).divide(2);

				const new_se = se.rotate(center.x, center.y, -this.angle);
				const ne = c.rotate(center.x, center.y, -this.angle);

				this.x = ne.x;
				this.y = ne.y;
				this.width = new_se.x - ne.x;
				this.height = new_se.y - ne.y;

				break;
			}

			case 'east': {
				const nw = Vector.from(this.x, this.y).rotate(this.center.x, this.center.y, this.angle);

				const new_c = Vector.from(c.x, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = nw.clone().sum(new_c).divide(2);

				const new_nw = nw.rotate(center.x, center.y, -this.angle);
				const se = new_c.rotate(center.x, center.y, -this.angle);

				this.x = new_nw.x;
				this.y = new_nw.y;
				this.width = se.x - nw.x;
				this.height = se.y - nw.y;
				break;
			}

			case 'south': {
				const nw = Vector.from(this.x, this.y).rotate(this.center.x, this.center.y, this.angle);

				const new_c = Vector.from(this.x + this.width, mouse.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = nw.clone().sum(new_c).divide(2);

				const new_nw = nw.rotate(center.x, center.y, -this.angle);
				const se = new_c.rotate(center.x, center.y, -this.angle);

				this.x = new_nw.x;
				this.y = se.y;
				this.width = se.x - new_nw.x;
				this.height = nw.y - se.y;
				break;
			}

			case 'north': {
				const sw = Vector.from(this.x, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const new_c = Vector.from(this.x + this.width, mouse.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = sw.clone().sum(new_c).divide(2);

				const new_sw = sw.rotate(center.x, center.y, -this.angle);
				const se = new_c.rotate(center.x, center.y, -this.angle);

				this.x = new_sw.x;
				this.y = se.y;
				this.width = se.x - new_sw.x;
				this.height = new_sw.y - se.y;

				break;
			}

			case 'west': {
				const ne = Vector.from(this.x + this.width, this.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const new_c = Vector.from(mouse.x, this.y + this.height).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = ne.clone().sum(new_c).divide(2);

				const new_ne = ne.rotate(center.x, center.y, -this.angle);
				const sw = new_c.rotate(center.x, center.y, -this.angle);

				this.x = new_ne.x;
				this.y = new_ne.y;
				this.width = sw.x - ne.x;
				this.height = sw.y - ne.y;

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
