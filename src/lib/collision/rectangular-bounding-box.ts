import { Vector } from '$lib/math/vector';
import type { BoundingBox, Direction, Shape } from '$lib/types';
import {
	circle,
	is_distance_close,
	project_point_on_segment,
	retrieve_tool_by_shortcut
} from '$lib/util/util';
import type { RoughCanvas } from 'roughjs/bin/canvas';

const SIZE = 12;
const OFFSET = 12;

const CORNERS: Direction[] = ['nor-west', 'south-west', 'south-east', 'nor-east'];
const EDGES: Direction[] = ['north', 'south', 'west', 'east'];

export class RectangularBoundingBox implements BoundingBox {
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

	get_handle_under_cursor(v: Vector): Direction | 'start' | 'end' | null {
		const center = this.center;

		const unrotated = v.rotate(center.x, center.y, -this.angle);

		const vertices = this.vertices;

		const threshold = 20;

		for (let i = 0; i < vertices.length; i++) {
			const vertice = vertices[i];

			if (is_distance_close(vertice, unrotated, threshold)) {
				return CORNERS[i];
			}
		}

		const [nw, sw, se, ne] = vertices;

		const segments: Vector[][] = [
			[nw, ne],
			[sw, se],
			[nw, sw],
			[ne, se]
		];

		for (let i = 0; i < segments.length; i++) {
			const [a, b] = segments[i];

			const p = project_point_on_segment(unrotated, a, b);

			if (is_distance_close(p, unrotated, threshold)) {
				return EDGES[i];
			}
		}

		return null;
	}

	contains(v: Vector): boolean {
		const center = this.center;

		const p = v.rotate(center.x, center.y, -this.angle);

		return (
			p.x >= this.x + OFFSET &&
			p.x <= this.x + this.width - OFFSET &&
			p.y >= this.y + OFFSET &&
			p.y <= this.y + this.height - OFFSET
		);
	}

	intersects(v: Vector) {
		const center = this.center;

		const p = v.rotate(center.x, center.y, -this.angle);

		return !(
			p.x < this.x - OFFSET * 2 ||
			p.x > this.x + this.width + OFFSET * 2 ||
			p.y < this.y - OFFSET * 2 ||
			p.y > this.y + this.height + OFFSET * 2
		);
	}

	intersects_rotate_handle(v: Vector) {
		const pivot = Vector.from(this.center.x, this.y - 40);

		const unrotated = v.rotate(this.center.x, this.center.y, -this.angle);

		return is_distance_close(pivot, unrotated, 20);
	}

	get center(): Vector {
		return Vector.from(this.x + this.width / 2, this.y + this.height / 2);
	}

	get vertices(): Vector[] {
		return [
			Vector.from(this.x, this.y),
			Vector.from(this.x, this.y1),
			Vector.from(this.x1, this.y1),
			Vector.from(this.x1, this.y)
		];
	}

	draw(c: CanvasRenderingContext2D, outline: boolean = false) {
		const size = 14;

		const gap = 12;

		if (this.angle !== 0) {
			c.save();

			c.translate(this.center.x, this.center.y);
			c.rotate(this.angle);

			c.strokeStyle = '#0b99ff';
			c.lineWidth = 4;

			c.beginPath();

			c.rect(
				-this.width / 2 - gap,
				-this.height / 2 - gap,
				this.width + gap * 2,
				this.height + gap * 2
			);

			c.stroke();

			c.closePath();

			if (!outline) {
				c.beginPath();
				c.strokeStyle = '#0b99ff';
				c.fillStyle = 'white';
				c.lineWidth = 2;

				c.rect(-this.width / 2 - size / 2 - gap, -this.height / 2 - size / 2 - gap, size, size);
				c.rect(-this.width / 2 - size / 2 - gap, this.height / 2 - size / 2 + gap, size, size);
				c.rect(this.width / 2 - size / 2 + gap, this.height / 2 - size / 2 + gap, size, size);
				c.rect(this.width / 2 - size / 2 + gap, -this.height / 2 - size / 2 - gap, size, size);
				c.fill();
				c.stroke();

				c.closePath();
			}

			c.restore();

			if (outline) return;

			circle(c, 0, -this.height / 2 - 40, this.center.x, this.center.y, 8, this.angle);

			return;
		}

		c.save();

		c.strokeStyle = '#0b99ff';
		c.lineWidth = 4;

		c.beginPath();
		c.rect(this.x - gap, this.y - gap, this.width + gap * 2, this.height + gap * 2);
		c.stroke();
		c.restore();

		if (outline) return;

		c.strokeStyle = '#0b99ff';
		c.fillStyle = 'white';
		c.lineWidth = 2;

		c.beginPath();
		c.rect(this.x - size / 2 - gap, this.y - size / 2 - gap, size, size);
		c.rect(this.x - size / 2 - gap, this.y + this.height - size / 2 + gap, size, size);
		c.rect(this.x + this.width - size / 2 + gap, this.y + this.height - size / 2 + gap, size, size);
		c.rect(this.x + this.width - size / 2 + gap, this.y - size / 2 - gap, size, size);
		c.closePath();

		c.fill();
		c.stroke();

		c.restore();

		circle(c, this.center.x, this.y - 40, 0, 0, 8, this.angle);
	}
}
