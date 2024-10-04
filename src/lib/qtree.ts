import type { Shape, Point } from './types';

export class AABB {
	x: number;
	y: number;
	width: number;
	height: number;

	constructor(x: number, y: number, width: number, height: number) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	contains(x: number, y: number): boolean {
		return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
	}

	intersects(range: AABB): boolean {
		return !(
			range.x - range.width > this.x + this.width ||
			range.x + range.width < this.x - this.width ||
			range.y - range.height > this.y + this.height ||
			range.y + range.height < this.y - this.height
		);
	}
}

export class QuadTree {
	private readonly boundary: AABB;
	private readonly capacity: number;
	private shapes: Shape[] = [];
	private divided = false;

	private northeast?: QuadTree;
	private southeast?: QuadTree;
	private northwest?: QuadTree;
	private southwest?: QuadTree;

	constructor(boundary: AABB, capacity: number) {
		this.boundary = boundary;
		this.capacity = capacity;
	}

	insert(shape: Shape): boolean {
		const points = shape.dimensions();

		if (!points.every((p) => this.boundary.contains(p.x, p.y))) {
			return false;
		}

		if (this.shapes.length < this.capacity) {
			this.shapes.push(shape);
			return true;
		} else {
			if (!this.divided) {
				this.divide();
			}

			if (this.northeast!.insert(shape)) return true;
			if (this.northwest!.insert(shape)) return true;
			if (this.southeast!.insert(shape)) return true;
			if (this.southwest!.insert(shape)) return true;
		}

		return false;
	}

	divide() {
		const { x, y, width, height } = this.boundary;
		const mw = width / 2;
		const mh = height / 2;

		const northeast = new AABB(x + mw, y, mw, mh);
		const northwest = new AABB(x, y, mw, mh);
		const southeast = new AABB(x + mw, y + mh, mw, mh);
		const southwest = new AABB(x, y + mh, mw, mh);

		this.northeast = new QuadTree(northeast, this.capacity);
		this.northwest = new QuadTree(northwest, this.capacity);
		this.southeast = new QuadTree(southeast, this.capacity);
		this.southwest = new QuadTree(southwest, this.capacity);

		this.divided = true;
	}

	query_by_point(x: number, y: number, found: Shape[] = []) {
		if (!this.boundary.contains(x, y)) return found;

		for (const shape of this.shapes) {
			if (shape.intersects(x, y)) found.push(shape);
		}

		if (this.divided) {
			this.northwest!.query_by_point(x, y, found);
			this.northeast!.query_by_point(x, y, found);
			this.southwest!.query_by_point(x, y, found);
			this.southeast!.query_by_point(x, y, found);
		}

		return found;
	}

	has(x: number, y: number): boolean {
		for (const shape of this.shapes) {
			if (shape.intersects(x, y)) return true;
		}

		if (this.divided) {
			return (
				this.northwest!.has(x, y) ||
				this.northeast!.has(x, y) ||
				this.southwest!.has(x, y) ||
				this.southeast!.has(x, y)
			);
		}

		return false;
	}

	query_by_range(range: AABB, found: Shape[] = []): Shape[] {
		if (!this.boundary.intersects(range)) return found;

		for (const shape of this.shapes) {
			const points = shape.dimensions();

			if (points.every((p) => range.contains(p.x, p.y))) found.push(shape);
		}

		if (this.divided) {
			this.northwest!.query_by_range(range, found);
			this.northeast!.query_by_range(range, found);
			this.southwest!.query_by_range(range, found);
			this.southeast!.query_by_range(range, found);
		}

		return found;
	}

	visualize(ctx: CanvasRenderingContext2D) {
		ctx.rect(this.boundary.x, this.boundary.y, this.boundary.width, this.boundary.height);
		ctx.stroke();
		if (this.divided) {
			this.northwest!.visualize(ctx);
			this.northeast!.visualize(ctx);
			this.southwest!.visualize(ctx);
			this.southeast!.visualize(ctx);
		}
	}
}
