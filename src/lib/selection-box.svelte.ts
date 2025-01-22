import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Shape, Direction, DrawOptions } from './types';
import { Vector } from './math/vector';

const VERTICE_SIZE = 14;
const BOX_MARGIN = 5;

const EDGE_OPTIONS = {
	setAnchorPosstroke: 'rgba(137, 196, 244, 1)',
	strokeWidth: 4,
	roughness: 0,
	fillStyle: 'solid',
	fill: 'white'
};

/* TODO:
 * We need to handle the bounding box directly
 * on the shape itself and for multiple elements
 * because when we rotate a shape, and select it again
 * the bouding box must stay rotated(for single element)
 * for multiple elements, it must not rotate(only the shapes must rotate)
 * */

type ResizeParams = {
	ptr: Direction;
	anchor: Vector;
};

export class BoundingBox {
	private items: Shape[] = [];

	private vertices: Vector[] = [];

	private x: number = 0;
	private y: number = 0;
	private width: number = 0;
	private height: number = 0;

	private options: DrawOptions = {
		stroke: 'rgba(137, 196, 244, 1)',
		strokeWidth: 4,
		seed: 1,
		roughness: 4
	};

	add(...args: Shape[]) {
		for (const arg of args) {
			if (!Array.isArray(args)) {
				this.items.push(arg);
			}
		}

		this.compute();
	}

	clear() {
		this.items = [];
		this.compute();
	}

	setOffset(mouse: Vector) {
		for (const item of this.items) {
			const [topLeft] = item.points;
			item.offset = mouse.substract(topLeft);
		}
	}

	setAnchorPos(x: number, y: number) {
		const ptrDirection = this.getPtrDirection(x, y);

		switch (ptrDirection) {
			case 'east':
				this.anchor.set(this.x, this.y);
				break;
			case 'west':
				this.anchor.set(this.x + this.width, this.x);
				break;
			case 'south':
				this.anchor.set(this.x, this.y);
				break;
			case 'north':
				this.anchor.set(this.x, this.y + this.width);
				break;
			case 'south-east':
				this.anchor.set(this.x, this.y);
				break;
			case 'south-west':
				this.anchor.set(this.x + this.width, this.y);
				break;
			case 'nor-west':
				this.anchor.set(this.x + this.width, this.y + this.width);
				break;
			case 'nor-east':
				this.anchor.set(this.x, this.y + this.width);
				break;
		}

		this.ptr_direction = ptrDirection;
	}

	save() {
		for (const item of this.items) {
			const points = item.vertices;
			this.snapshot.set(item, [points[0], points[3]]);
		}
	}

	contains(x: number, y: number): boolean {
		return (
			x > this.x + BOX_MARGIN &&
			x < this.x + this.width - BOX_MARGIN &&
			y > this.y + BOX_MARGIN &&
			y < this.y + this.height - BOX_MARGIN
		);
	}

	getPtrDirection(x: number, y: number): Direction | null {
		// if ((x > this.x - 5 && x < this.x - 5) || (y > this.y + 5 && y < this.y - 5)) return 'nor-east';

		// if (this._northeast.intersects(x, y)) return 'nor-east';
		// if (this._southwest.intersects(x, y)) return 'south-west';
		// if (this._southeast.intersects(x, y)) return 'south-east';
		// if (this._norwest.intersects(x, y)) return 'nor-west';

		if (
			x < this.x - BOX_MARGIN * 2 ||
			x > this.x + this.width + BOX_MARGIN * 2 ||
			y < this.y - BOX_MARGIN * 2 ||
			y > this.y + this.height + BOX_MARGIN * 2
		)
			return null;

		const leftDist = Math.abs(x - this.x);
		const rightDist = Math.abs(x - (this.x + this.width));
		const topDist = Math.abs(y - this.y);
		const bottomDist = Math.abs(y - (this.y + this.height));

		const minDist = Math.min(leftDist, rightDist, topDist, bottomDist);

		if (minDist === leftDist) return 'west';
		if (minDist === rightDist) return 'east';
		if (minDist === topDist) return 'north';
		if (minDist === bottomDist) return 'south';

		return null;
	}

	intersects(x: number, y: number): boolean {
		return !(
			x < this.x - BOX_MARGIN * 2 ||
			x > this.x + this.width + BOX_MARGIN * 2 ||
			y < this.y - BOX_MARGIN * 2 ||
			y > this.y + this.height + BOX_MARGIN * 2
		);
	}

	intersectsPivot(x: number, y: number): boolean {
		return !(
			x < (this.x + this.width) / 2 ||
			x > (this.x + this.width) / 2 ||
			y < this.y - 40 ||
			y > this.y + 40
		);
	}

	move(x: number, y: number) {
		for (const item of this.items) {
			const movt = new Vector(x, y).substract(item.offset);
			item.move(movt.x, movt.y);
		}

		this.compute();
	}

	resize(mouse_start: Vector, mouse: Vector) {
		const sx = (mouse.x - this.anchor.x) / (mouse_start.x - this.anchor.x);
		const sy = (mouse.y - this.anchor.y) / (mouse_start.y - this.anchor.y);

		this.items.forEach((item) => {
			const initial_points = this.snapshot.get(item);

			if (!initial_points) return;

			const [start, end] = initial_points;

			const x = (start.x - this.anchor.x) * sx + this.anchor.x;
			const y = (start.y - this.anchor.y) * sy + this.anchor.y;
			const width = (end.x - start.x) * sx;
			const height = (end.y - start.y) * sy;

			switch (this.ptr_direction) {
				case 'east':
				case 'west':
					item.move(x, start.y);
					item.resize(width, end.y - start.y);
					break;
				case 'north':
				case 'south':
					item.move(start.x, y);
					item.resize(end.x - start.x, height);
					break;
				case 'nor-east':
				case 'nor-west':
				case 'south-east':
				case 'south-west':
					item.move(x, y);
					item.resize(width, height);
					break;
			}

			if (sx < 0 || sy < 0) item.normalize();
		});

		this.compute();
	}

	rotate(x: number, y: number) {
		const rad = x * (Math.PI / 180);
		for (const item of this.items) {
			item.rotate(rad);
			item.normalize();
		}

		if (this.items.length > 1) this.compute();
	}

	private compute() {
		let start = new Vector(Infinity, Infinity);
		let end = new Vector(-Infinity, -Infinity);

		this.items.forEach((item) => {
			item.vertices.forEach((v) => {
				start = Vector.min(start, v);
				end = Vector.max(end, v);
			});

			// if (item.type === 'ellipse') {
			// 	const [v1, , , v2] = item.points;
			// 	start = Vector.min(start, v1);
			// 	end = Vector.max(end, v2);
			// }
		});

		this.x = start.x;
		this.y = start.y;

		const [width, height] = end.substract(start);

		this.width = width;
		this.height = height;

		this.vertices = [
			[this.x - 5, this.y - 5],
			[this.x - 5, this.y + this.height - 5],
			[this.x + this.width - 5, this.y + this.height - 5],
			[this.x + this.width - 5, this.y - 5]
		];
	}

	draw(rough: RoughCanvas, context: CanvasRenderingContext2D): void {
		if (this.items.length === 0) return;

		if (this.items.length > 1) this.options.strokeLineDash = [5, 5];
		else this.options.strokeLineDash = [0, 0];

		const [target] = this.items;

		if (this.items.length === 1 && target.rotation !== 0) {
			context.save();

			context.translate(this.x + this.width / 2, this.y + this.height / 2);

			context.rotate(target.rotation);

			rough.rectangle(-this.width / 2, -this.height / 2, this.width, this.height, this.options);

			const vertices = [
				[-this.width / 2, -this.height / 2],
				[-this.width / 2, this.height / 2],
				[this.width / 2, this.height / 2],
				[this.width / 2, -this.height / 2]
			];

			for (const [x, y] of vertices) {
				rough.rectangle(x, y, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS);
			}

			rough.ellipse(-this.width, -this.height / 2 - 40, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS);

			target.draw(rough);

			context.restore();

			return;
		}

		for (const target of this.items) {
			target.draw(rough);
		}

		rough.rectangle(this.x, this.y, this.width, this.height, this.options);

		for (const [x, y] of this.vertices) {
			rough.rectangle(x, y, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS);
		}

		rough.ellipse(this.x + this.width / 2, this.y - 40, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS);
	}

	empty() {
		return this.items.length === 0;
	}
}

class Vertice {
	constructor(
		private _x: number,
		private _y: number,
		private _width: number,
		private _height: number,
		private _options: DrawOptions,
		private _rotation: number = 0
	) {}

	move(x: number, y: number) {
		this._x = x;
		this._y = y;
	}

	draw(rough: RoughCanvas, ctx: CanvasRenderingContext2D) {
		if (this._rotation !== 0) {
			ctx.save();
			ctx.translate(this._x + this._width / 2, this._y + this._height / 2);

			ctx.rotate(this._rotation);

			rough.rectangle(
				-this._width / 2,
				-this._height / 2,
				this._width,
				this._height,
				this._options
			);

			ctx.restore();
			return;
		}

		rough.rectangle(this._x, this._y, this._width, this._height, this._options);
	}

	rotate(deg: number) {
		this._rotation = deg;
	}

	intersects(x: number, y: number): boolean {
		return (
			x >= this._x - 5 &&
			x <= this._x + this._width + 5 &&
			y >= this._y - 5 &&
			y <= this._y + this._height + 5 &&
			!(
				x >= this._x + 5 &&
				x <= this._x + this._width - 5 &&
				x >= this._y + 5 &&
				x <= this._y + this._height - 5
			)
		);
	}
}

class Pivot extends Vector {
	private _gap: number = 40;
	private _diameter: number = 16;
	private _options: DrawOptions = {
		...EDGE_OPTIONS,
		roughness: 0,
		strokeLineDash: [0, 0]
	};

	draw(rough: RoughCanvas, options: DrawOptions) {
		rough.circle(this.x, this.y - this._gap, this._diameter, this._options);
	}

	intersects(x: number, y: number): boolean {
		const r = this._diameter / 2;

		const dx = x - this.x;
		const dy = y - (this.y - this._gap);

		return dx ** 2 + dy ** 2 <= r ** 2;
	}
}
