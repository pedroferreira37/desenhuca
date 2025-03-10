import { Vector } from '$lib/math/vector';
import type { Shape } from '$lib/types';

const SIZE = 12;

export class BoundingBox {
	constructor(
		public x: number = 0,
		public y: number = 0,
		public width: number = 0,
		public height: number = 0,
		public angle: number = 0
	) {}

	reset() {
		this.x = 0;
		this.y = 0;
		this.width = 0;
		this.height = 0;
	}

	update(shapes: Shape[]) {
		if (!shapes.length) {
			this.reset();
			return;
		}

		const min = Vector.from(Infinity, Infinity);
		const max = Vector.from(-Infinity, -Infinity);

		for (const shape of shapes) {
			const rotate = shapes.length > 1;

			const [nw, sw, se, ne] = rotate
				? shape.vertices.map((v) => v.clone().rotate(shape.center.x, shape.center.y, -shape.angle))
				: shape.vertices;

			min.set(Math.min(min.x, nw.x, sw.x, se.x, ne.x), Math.min(min.y, nw.y, sw.y, se.y, ne.y));
			max.set(Math.max(max.x, nw.x, sw.x, se.x, ne.x), Math.max(max.y, nw.y, sw.y, se.y, ne.y));
		}

		this.x = min.x;
		this.y = min.y;

		const size = max.substract(min);

		this.center.set((min.x + size.x) / 2, (min.y + size.y) / 2);

		this.width = size.x;
		this.height = size.y;
	}

	get center(): Vector {
		return Vector.from(this.x + this.width / 2, this.y + this.height / 2);
	}

	get rotated() {
		return this.angle !== 0;
	}

	get vertices(): Vector[] {
		return [
			Vector.from(this.x, this.y),
			Vector.from(this.x, this.y + this.height),
			Vector.from(this.x + this.width, this.y + this.height),
			Vector.from(this.x + this.width, this.y)
		];
	}

	draw(c: CanvasRenderingContext2D, angle: number = 0, dashed: boolean = false) {
		const center = this.center;

		const offset = SIZE / 2;

		const rotated = angle !== 0;

		if (rotated) {
			c.save();

			c.lineWidth = 4;
			c.strokeStyle = '#0b99ff';
			c.fillStyle = 'white';

			const [nw, sw, se, ne] = [
				Vector.from(-this.width / 2, -this.height / 2),
				Vector.from(-this.width / 2, this.height / 2),
				Vector.from(this.width / 2, this.height / 2),
				Vector.from(this.width / 2, -this.height / 2)
			];

			const pivot = Vector.from(0, -this.height / 2 - 40);

			c.translate(center.x, center.y);

			c.rotate(angle);

			c.strokeRect(nw.x - offset, nw.y - offset, this.width + offset * 2, this.height + offset * 2);

			c.setLineDash([0, 0]);

			c.strokeRect(nw.x - SIZE, nw.y - SIZE, SIZE, SIZE);
			c.strokeRect(sw.x - SIZE, sw.y, SIZE, SIZE);
			c.strokeRect(se.x, se.y, SIZE, SIZE);
			c.strokeRect(ne.x, ne.y - SIZE, SIZE, SIZE);

			c.fillRect(nw.x - SIZE, nw.y - SIZE, SIZE, SIZE);
			c.fillRect(sw.x - SIZE, sw.y, SIZE, SIZE);
			c.fillRect(se.x, se.y, SIZE, SIZE);
			c.fillRect(ne.x, ne.y - SIZE, SIZE, SIZE);

			c.beginPath();
			c.arc(pivot.x, pivot.y, 8, 0, 2 * Math.PI);
			c.fill();
			c.closePath();

			c.beginPath();
			c.arc(pivot.x, pivot.y, 8, 0, 2 * Math.PI);
			c.stroke();
			c.closePath();

			c.restore();

			return;
		}

		const [nw, sw, se, ne] = this.vertices;

		const pivot = Vector.from(center.x, this.y - 40);

		c.save();

		c.lineWidth = 4;
		c.strokeStyle = '#0b99ff';

		if (dashed) c.setLineDash([10, 10]);

		c.strokeRect(
			this.x - offset,
			this.y - offset,
			this.width + offset * 2,
			this.height + offset * 2
		);

		c.fillStyle = 'white';

		c.setLineDash([0, 0]);

		c.beginPath();
		c.arc(pivot.x, pivot.y, 8, 0, 2 * Math.PI);
		c.fill();
		c.closePath();
		c.beginPath();
		c.arc(pivot.x, pivot.y, 8, 0, 2 * Math.PI);
		c.stroke();
		c.closePath();

		c.strokeRect(nw.x - SIZE, nw.y - SIZE, SIZE, SIZE);
		c.strokeRect(sw.x - SIZE, sw.y, SIZE, SIZE);
		c.strokeRect(se.x, se.y, SIZE, SIZE);
		c.strokeRect(ne.x, ne.y - SIZE, SIZE, SIZE);

		c.fillRect(nw.x - SIZE, nw.y - SIZE, SIZE, SIZE);
		c.fillRect(sw.x - SIZE, sw.y, SIZE, SIZE);
		c.fillRect(se.x, se.y, SIZE, SIZE);
		c.fillRect(ne.x, ne.y - SIZE, SIZE, SIZE);

		c.restore();
	}
}
