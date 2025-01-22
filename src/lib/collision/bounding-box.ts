import { Vector } from '$lib/math/vector';
import type { DrawOptions, Shape } from '$lib/types';
import { rotate } from '$lib/util/util';
import type { RoughCanvas } from 'roughjs/bin/canvas';

const SIZE = 14;

const EDGE_WIDTH = 4;

export class BoundingBox {
	constructor(
		public x: number = 0,
		public y: number = 0,
		public width: number = 0,
		public height: number = 0,
		public rotation: number = 0
	) {}

	contains(other: Vector): boolean {
		const cx = this.cx;
		const cy = this.cy;

		const vpos = rotate([other], cx, cy, -this.rotation)[0];

		return (
			vpos.x >= this.x &&
			vpos.x <= this.x + this.width &&
			vpos.y >= this.y &&
			vpos.y <= this.y + this.height
		);
	}

	intersects(other: Vector) {
		const vpos = rotate([other], this.cx, this.cy, -this.rotation)[0];

		return !(
			vpos.x < this.x - EDGE_WIDTH ||
			vpos.x > this.x + this.width + EDGE_WIDTH ||
			vpos.y < this.y - EDGE_WIDTH ||
			vpos.y > this.y + this.height + EDGE_WIDTH
		);
	}

	intersects_pivot(other: Vector) {
		const cx = this.x + this.width / 2;
		const cy = this.y - 40;

		const vpos = (
			this.rotation !== 0
				? rotate([new Vector(cx, cy)], this.cx, this.cy, this.rotation)
				: [new Vector(cx, cy)]
		)[0];

		const dx = other.x - vpos.x;
		const dy = other.y - vpos.y;

		const distance = Math.sqrt(dx ** 2 + dy ** 2);

		return distance < 8;
	}

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

	get cx(): number {
		return this.x + this.width / 2;
	}

	get cy(): number {
		return this.y + this.height / 2;
	}

	draw(c: CanvasRenderingContext2D, dashed: boolean = false) {
		c.lineWidth = 4;
		const offset = c.lineWidth + 2;
		const dot = this.pivot;
		const [nw, sw, se, ne] = this.vertices;

		if (this.rotation !== 0) {
			c.save();

			const [nw, sw, se, ne] = [
				new Vector(-this.width / 2, -this.height / 2),
				new Vector(-this.width / 2, this.height / 2),
				new Vector(this.width / 2, this.height / 2),
				new Vector(this.width / 2, -this.height / 2)
			];

			c.lineWidth = 4;

			c.strokeStyle = '#0b99ff';

			c.translate(this.x + this.width / 2, this.y + this.height / 2);

			c.rotate(this.rotation);

			if (dashed) c.setLineDash([5, 5]);

			c.strokeRect(-this.width / 2, -this.height / 2, this.width, this.height);

			c.setLineDash([0, 0]);

			c.strokeRect(nw.x - offset, nw.y - offset, SIZE, SIZE);
			c.strokeRect(sw.x - offset, sw.y - offset, SIZE, SIZE);
			c.strokeRect(se.x - offset, se.y - offset, SIZE, SIZE);
			c.strokeRect(ne.x - offset, ne.y - offset, SIZE, SIZE);

			c.fillStyle = 'white';

			c.fillRect(nw.x - offset, nw.y - offset, SIZE, SIZE);
			c.fillRect(sw.x - offset, sw.y - offset, SIZE, SIZE);
			c.fillRect(se.x - offset, se.y - offset, SIZE, SIZE);
			c.fillRect(ne.x - offset, ne.y - offset, SIZE, SIZE);

			c.beginPath();
			c.arc(dot.x, dot.y, 8, 0, 2 * Math.PI);
			c.fill();
			c.closePath();

			c.strokeStyle = '#0b99ff';

			c.beginPath();
			c.arc(dot.x, dot.y, 8, 0, 2 * Math.PI);
			c.stroke();
			c.closePath();

			c.restore();
			return;
		}

		c.save();
		c.strokeStyle = '#0b99ff';

		if (dashed) c.setLineDash([5, 5]);

		c.strokeRect(this.x, this.y, this.width, this.height);

		c.fillStyle = 'white';

		c.setLineDash([0, 0]);

		c.beginPath();
		c.arc(dot.x, dot.y, 8, 0, 2 * Math.PI);
		c.fill();
		c.closePath();
		c.beginPath();
		c.arc(dot.x, dot.y, 8, 0, 2 * Math.PI);
		c.stroke();
		c.closePath();

		c.strokeRect(nw.x - offset, nw.y - offset, SIZE, SIZE);
		c.strokeRect(sw.x - offset, sw.y - offset, SIZE, SIZE);
		c.strokeRect(se.x - offset, se.y - offset, SIZE, SIZE);
		c.strokeRect(ne.x - offset, ne.y - offset, SIZE, SIZE);

		c.fillRect(nw.x - offset, nw.y - offset, SIZE, SIZE);
		c.fillRect(sw.x - offset, sw.y - offset, SIZE, SIZE);
		c.fillRect(se.x - offset, se.y - offset, SIZE, SIZE);
		c.fillRect(ne.x - offset, ne.y - offset, SIZE, SIZE);

		c.restore();
	}

	get pivot(): Vector {
		if (this.rotation !== 0) {
			return new Vector(0, Math.floor(-this.height / 2 - 40));
		}

		return new Vector(Math.floor(this.x + this.width / 2), Math.floor(this.y - 40));
	}
}
