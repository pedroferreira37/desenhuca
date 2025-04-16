import { Vector } from '$lib/math/vector';
import type { BoundingBox, Handle } from '$lib/types';
import { is_distance_close, project_point_on_segment } from '$lib/util/util';

export class LineBoundingBox implements BoundingBox {
	constructor(
		public x: number = 0,
		public y: number = 0,
		public x1: number = 0,
		public y1: number = 0,
		public angle: number = 0
	) {}

	get width(): number {
		return this.x1 - this.x;
	}

	get height(): number {
		return this.y1 - this.y;
	}

	clear() {
		this.x = 0;
		this.y = 0;
		this.x1 = 0;
		this.y1 = 0;
		this.angle = 0;
	}

	rotate(angle: number) {
		this.angle = angle;
	}

	intersects(v: Vector) {
		const center = this.center;

		const p = v.rotate(center.x, center.y, -this.angle);

		return (
			is_distance_close(p, Vector.from(this.x, this.y), 20) ||
			is_distance_close(p, Vector.from(this.x1, this.y1), 20)
		);
	}

	contains(v: Vector): boolean {
		const center = this.center;

		const p = v.rotate(center.x, center.y, -this.angle);

		if (
			is_distance_close(p, Vector.from(this.x, this.y), 20) ||
			is_distance_close(p, Vector.from(this.x1, this.y1), 20)
		) {
			return false;
		}

		const projected = project_point_on_segment(
			p,
			Vector.from(this.x, this.y),
			Vector.from(this.x1, this.y1)
		);

		return is_distance_close(p, projected, 20);
	}

	intersects_rotate_handle(v: Vector) {
		const pivot = Vector.from(this.center.x, this.y - 40);

		const unrotated = v.rotate(this.center.x, this.center.y, -this.angle);

		return is_distance_close(pivot, unrotated, 20);
	}

	get_handle_under_cursor(v: Vector): any {
		const center = this.center;

		const unrotated = v.rotate(center.x, center.y, -this.angle);

		const vertices = this.vertices;

		const threshold = 20;

		if (is_distance_close(unrotated, Vector.from(this.x, this.y), threshold)) return 'start';
		if (is_distance_close(unrotated, Vector.from(this.x1, this.y1), threshold)) return 'end';
	}

	draw(c: CanvasRenderingContext2D) {
		const size = 14;

		const gap = 12;

		c.strokeStyle = '#0b99ff';
		c.fillStyle = 'white';
		c.lineWidth = 4;

		if (this.angle !== 0) {
			c.save();
			c.translate(this.center.x, this.center.y);
			c.rotate(this.angle);

			c.beginPath();
			c.arc(-this.width / 2, -this.height / 2, 8, 0, 2 * Math.PI);
			c.stroke();
			c.fill();
			c.closePath();

			c.fillStyle = 'white';
			c.beginPath();
			c.arc(this.width / 2, this.height / 2, 8, 0, 2 * Math.PI);
			c.stroke();
			c.fill();
			c.closePath();

			c.restore();
			return;
		}

		c.beginPath();
		c.arc(this.x, this.y, 8, 0, 2 * Math.PI);
		c.stroke();
		c.fill();
		c.closePath();

		c.fillStyle = 'white';
		c.beginPath();
		c.arc(this.x1, this.y1, 8, 0, 2 * Math.PI);
		c.stroke();
		c.fill();
		c.closePath();
	}

	get vertices(): Vector[] {
		return [Vector.from(this.x, this.y), Vector.from(this.x1, this.y1)];
	}

	get center(): Vector {
		return Vector.from((this.x + this.x1) / 2, (this.y + this.y1) / 2);
	}
}
