import { LineBoundingBox } from '$lib/collision/line-bounding-box';
import { Vector } from '$lib/math/vector';
import type { BoundingBox, Direction, DrawOptions, Shape } from '$lib/types';
import { is_distance_close, project_point_on_segment, uuid } from '$lib/util/util';
import type { RoughCanvas } from 'roughjs/bin/canvas';

const PADDING = 16;

export class Segment implements Shape {
	public id: string = uuid();
	public type: 'segment' = 'segment';
	public offset: Vector = Vector.zero();
	public angle: number = 0;
	public reference: Vector[] = [];

	constructor(
		private x: number = 0,
		private y: number = 0,
		private x1: number,
		private y1: number,
		public options: DrawOptions
	) {}

	move(v: Vector) {
		const dx = v.x - this.x;
		const dy = v.y - this.y;

		this.x += dx;
		this.y += dy;
		this.x1 += dx;
		this.y1 += dy;
	}

	rotate(angle: number) {
		this.angle = angle;
	}

	intersects(v: Vector): boolean {
		const p = v.rotate(this.center.x, this.center.y, -this.angle);

		return (
			is_distance_close(p, Vector.from(this.x, this.y), 20) ||
			is_distance_close(p, Vector.from(this.x1, this.y1), 20)
		);
	}

	length() {
		return Math.sqrt(Math.pow(this.x1 - this.x, 2) + Math.pow(this.y1 - this.y, 2));
	}

	contains(v: Vector): boolean {
		const p = v.rotate(this.center.x, this.center.y, -this.angle);

		const b = project_point_on_segment(
			p,
			Vector.from(this.x, this.y),
			Vector.from(this.x1, this.y1)
		);

		return is_distance_close(p, b, 16);
	}

	// TODO: Rethink the resize function as a common denominator for all shapes.
	// Since the resize of a rect angle and ellipse is different resizes, are different from the semgent.

	resize(x1: number, y1: number) {
		this.x1 = x1;
		this.y1 = y1;
	}

	adjust(direction: Direction, mouse: Vector) {
		const c = mouse;
		// Why I did this?

		const [nw, sw, se, ne] = this.vertices;

		switch (direction) {
			case 'start': {
				const end = Vector.from(this.x1, this.y1).rotate(this.center.x, this.center.y, this.angle);

				const center = end.sum(mouse).divide(2);

				const adjusted_end = end.rotate(center.x, center.y, -this.angle);
				const start = mouse.rotate(center.x, center.y, -this.angle);

				this.x = start.x;
				this.y = start.y;
				this.x1 = adjusted_end.x;
				this.y1 = adjusted_end.y;

				break;
			}
			case 'end':
				const start = Vector.from(this.x, this.y).rotate(this.center.x, this.center.y, this.angle);

				const center = start.sum(mouse).divide(2);

				const adjusted_start = start.rotate(center.x, center.y, -this.angle);
				const end = mouse.rotate(center.x, center.y, -this.angle);

				this.x = adjusted_start.x;
				this.y = adjusted_start.y;
				this.x1 = end.x;
				this.y1 = end.y;

				break;
		}

		return;

		switch (direction) {
			case 'south-west': {
				const ne = Vector.from(this.x + this.x1, this.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = ne.sum(c).divide(2);

				const adjustedNw = ne.rotate(center.x, center.y, -this.angle);

				const sw = c.rotate(center.x, center.y, -this.angle);

				this.x = sw.x;
				this.y = adjustedNw.y;
				this.x1 = adjustedNw.x - sw.x;
				this.y1 = sw.y - adjustedNw.y;

				break;
			}

			case 'south-east': {
				const nw = Vector.from(this.x, this.y).rotate(this.center.x, this.center.y, this.angle);

				const center = nw.sum(mouse).divide(2);

				const adjustedNw = nw.rotate(center.x, center.y, -this.angle);
				const se = c.rotate(center.x, center.y, -this.angle);

				this.x = adjustedNw.x;
				this.y = adjustedNw.y;
				this.x1 = se.x - adjustedNw.x;
				this.y1 = se.y - adjustedNw.y;

				break;
			}

			case 'nor-east': {
				const sw = Vector.from(this.x, this.y + this.y1).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = sw.sum(mouse).divide(2);

				const adjustedSw = sw.rotate(center.x, center.y, -this.angle);

				const nw = c.rotate(center.x, center.y, -this.angle);

				this.x = adjustedSw.x;
				this.y = nw.y;
				this.x1 = nw.x - adjustedSw.x;
				this.y1 = adjustedSw.y - nw.y;

				break;
			}

			case 'nor-west': {
				const se = Vector.from(this.x + this.x1, this.y + this.y1).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = se.sum(mouse).divide(2);

				const adjustedSe = se.rotate(center.x, center.y, -this.angle);
				const nw = c.rotate(center.x, center.y, -this.angle);

				this.x = nw.x;
				this.y = nw.y;
				this.x1 = adjustedSe.x - nw.x;
				this.y1 = adjustedSe.y - nw.y;

				break;
			}

			case 'east': {
				const nw = Vector.from(this.x, this.y).rotate(this.center.x, this.center.y, this.angle);

				const cursor = Vector.from(c.x, this.y + this.y1).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = nw.sum(cursor).divide(2);

				const adjustedNw = nw.rotate(center.x, center.y, -this.angle);
				const se = cursor.rotate(center.x, center.y, -this.angle);

				this.x = adjustedNw.x;
				this.y = adjustedNw.y;
				this.x1 = se.x - adjustedNw.x;
				this.y1 = se.y - adjustedNw.y;
				break;
			}

			case 'south': {
				const nw = Vector.from(this.x, this.y).rotate(this.center.x, this.center.y, this.angle);

				const cursor = Vector.from(this.x + this.x1, mouse.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = nw.sum(cursor).divide(2);

				const adjustedNw = nw.rotate(center.x, center.y, -this.angle);
				const se = cursor.rotate(center.x, center.y, -this.angle);

				this.x = adjustedNw.x;
				this.y = adjustedNw.y;
				this.x1 = se.x - adjustedNw.x;
				this.y1 = se.y - adjustedNw.y;
				break;
			}

			case 'north': {
				const ne = Vector.from(this.x, this.y + this.y1).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const cursor = Vector.from(this.x + this.x1, mouse.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = ne.sum(cursor).divide(2);

				const adjustedSw = ne.rotate(center.x, center.y, -this.angle);
				const nw = cursor.rotate(center.x, center.y, -this.angle);

				this.x = adjustedSw.x;
				this.y = nw.y;
				this.x1 = nw.x - adjustedSw.x;
				this.y1 = adjustedSw.y - nw.y;

				break;
			}

			case 'west': {
				const ne = Vector.from(this.x + this.x1, this.y).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const cursor = Vector.from(mouse.x, this.y + this.y1).rotate(
					this.center.x,
					this.center.y,
					this.angle
				);

				const center = ne.sum(cursor).divide(2);

				const adjustedNe = ne.rotate(center.x, center.y, -this.angle);
				const sw = cursor.rotate(center.x, center.y, -this.angle);

				this.x = sw.x;
				this.y = adjustedNe.y;
				this.x1 = adjustedNe.x - sw.x;
				this.y1 = sw.y - adjustedNe.y;

				break;
			}
		}
	}

	normalize() {}

	get width(): number {
		return this.x1 - this.x;
	}

	get height(): number {
		return this.y1 - this.y;
	}

	draw(c: CanvasRenderingContext2D, r: RoughCanvas) {
		if (this.angle !== 0) {
			c.save();
			c.translate(this.center.x, this.center.y);
			c.rotate(this.angle);
			r.line(-this.width / 2, -this.height / 2, this.width / 2, this.height / 2, this.options);
			c.restore();
			return;
		}

		c.save();
		r.line(this.x, this.y, this.x1, this.y1, this.options);
		c.restore();
	}

	get AABB(): BoundingBox {
		return new LineBoundingBox(this.x, this.y, this.x1, this.y1, this.angle);
	}

	get vertices(): Vector[] {
		return [Vector.from(this.x, this.y), Vector.from(this.x1, this.y1)];
	}

	get center(): Vector {
		return Vector.from((this.x + this.x1) / 2, (this.y + this.y1) / 2);
	}

	get rotated(): boolean {
		return this.angle !== 0;
	}
}
