import { Vector } from '../math/vector';
import type { Shape } from '../types';
import { AABB } from './aabb';

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
		const [a, b] = shape.vertices;

		if (!this.boundary.contains(a.x, a.y) && !this.boundary.contains(b.x, b.y)) return false;

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

	has(pos: Vector): boolean {
		for (const shape of this.shapes) {
			if (shape.intersects(pos)) return true;
		}

		if (this.divided) {
			return (
				this.northwest!.has(pos) ||
				this.northeast!.has(pos) ||
				this.southwest!.has(pos) ||
				this.southeast!.has(pos)
			);
		}

		return false;
	}

	queryInRange(range: AABB, found: Shape[]) {
		if (!this.boundary.intersects(range)) return found;

		for (const shape of this.shapes) {
			const vertices = shape.vertices.map((v) =>
				v.rotate(shape.center.x, shape.center.y, -shape.angle)
			);

			if (vertices.every((v) => range.contains(v.x, v.y))) found.push(shape);
		}

		if (this.divided) {
			this.northwest!.queryInRange(range, found);
			this.northeast!.queryInRange(range, found);
			this.southwest!.queryInRange(range, found);
			this.southeast!.queryInRange(range, found);
		}

		return found;
	}

	queryAt(pos: Vector, found: Shape[]) {
		if (!this.boundary.contains(pos.x, pos.y)) return found;
		for (const shape of this.shapes) {
			if (shape.intersects(pos)) found.push(shape);
		}

		if (this.divided) {
			this.northwest!.queryAt(pos, found);
			this.northeast!.queryAt(pos, found);
			this.southwest!.queryAt(pos, found);
			this.southeast!.queryAt(pos, found);
		}

		return found;
	}
}
