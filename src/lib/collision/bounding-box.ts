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

		let xmin = Infinity;
		let ymin = Infinity;
		let xmax = -Infinity;
		let ymax = -Infinity;

		for (const shape of shapes) {
			const rotate = shapes.length > 1;

			shape.vertices.forEach((v) => {
				const p = rotate ? v.rotate(shape.center.x, shape.center.y, shape.angle) : v;

				xmin = Math.min(xmin, p.x);
				ymin = Math.min(ymin, p.y);
				xmax = Math.max(xmax, p.x);
				ymax = Math.max(ymax, p.y);
			});
		}

		this.x = xmin;
		this.y = ymin;
		this.width = xmax - xmin;
		this.height = ymax - ymin;
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

	draw(c: CanvasRenderingContext2D, angle: number = 0) {
		const center = this.center;

		const offset = 8 / 2;

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
