import type { Vector } from './math/vector';
import type { Shape } from './types';

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

	contains(v: Vector): boolean {
		return (
			v.x >= this.x && v.x <= this.x + this.width && v.y >= this.y && v.y <= this.y + this.height
		);
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
		const [a, b] = shape.points;

		if (!this.boundary.contains(b) && !this.boundary.contains(b)) return false;

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

	private divide() {
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

	has(v: Vector): boolean {
		for (const shape of this.shapes) {
			if (shape.intersects(v)) return true;
		}

		if (this.divided) {
			return (
				this.northwest!.has(v) ||
				this.northeast!.has(v) ||
				this.southwest!.has(v) ||
				this.southeast!.has(v)
			);
		}

		return false;
	}

	query_at(v: Vector, found: Shape[] = []) {
		if (!this.boundary.contains(v)) return found;

		for (const shape of this.shapes) {
			if (shape.intersects(v)) found.push(shape);
		}

		if (this.divided) {
			this.northwest!.query_at(v, found);
			this.northeast!.query_at(v, found);
			this.southwest!.query_at(v, found);
			this.southeast!.query_at(v, found);
		}

		return found;
	}

	query_in_range(range: AABB, found: Shape[] = []): Shape[] {
		if (!this.boundary.intersects(range)) return found;

		for (const shape of this.shapes) {
			const [a, b] = shape.points;

			if (range.contains(a) && range.contains(b)) found.push(shape);
		}

		if (this.divided) {
			this.northwest!.query_in_range(range, found);
			this.northeast!.query_in_range(range, found);
			this.southwest!.query_in_range(range, found);
			this.southeast!.query_in_range(range, found);
		}

		return found;
	}
}
