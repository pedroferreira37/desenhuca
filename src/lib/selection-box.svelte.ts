import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Shape, ShapeOptions, Direction } from './types';
import { Vector } from './math/vector';
import { scale } from 'svelte/transition';

const VERTICE_SIZE = 14;
const BOX_MARGIN = 5;

const EDGE_OPTIONS = {
	stroke: 'rgba(137, 196, 244, 1)',
	strokeWidth: 4,
	roughness: 0,
	fillStyle: 'solid',
	fill: 'white'
};

export class BoundingBox {
	x: number = $state(0);
	y: number = $state(0);
	width: number = $state(0);
	height: number = $state(0);

	private items: Shape[] = $state([]);

	private dot: Vector = new Vector(0, 0);

	public side: Direction | null = $state(null);

	private snapshot: Map<Shape, Vector[]> = new Map();

	private norwest: Vertice = $state(new Vertice(0, 0, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS));
	private northeast: Vertice = $state(new Vertice(0, 0, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS));
	private southwest: Vertice = $state(new Vertice(0, 0, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS));
	private southeast: Vertice = $state(new Vertice(0, 0, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS));

	private options: ShapeOptions;

	constructor(options: ShapeOptions) {
		this.options = options;
	}

	keep(item: Shape) {
		this.items.push(item);
		this.compute_dimensions();
	}

	clear() {
		this.items = [];
		this.compute_dimensions();
	}

	update_items_offset(v: Vector) {
		for (let i = 0; i < this.items.length; i++) {
			const item = this.items[i];
			const [a] = item.points;
			item.offset = v.substract(a);
		}
	}

	capture_snapshot() {
		for (let i = 0; i < this.items.length; i++) {
			const item = this.items[i];
			this.snapshot.set(item, item.points);
		}
	}

	contains(v: Vector): boolean {
		return (
			v.x > this.x + BOX_MARGIN &&
			v.x < this.x + this.width - BOX_MARGIN &&
			v.y > this.y + BOX_MARGIN &&
			v.y < this.y + this.height - BOX_MARGIN
		);
	}

	find_pointer_side(v: Vector): Direction {
		if (this.northeast.intersects(v)) return 'nor-east';
		if (this.southwest.intersects(v)) return 'south-west';
		if (this.southeast.intersects(v)) return 'south-east';
		if (this.norwest.intersects(v)) return 'nor-west';

		if (
			v.x < this.x - BOX_MARGIN * 2 ||
			v.x > this.x + this.width + BOX_MARGIN * 2 ||
			v.y < this.y - BOX_MARGIN * 2 ||
			v.y > this.y + this.height + BOX_MARGIN * 2
		)
			return 'none';

		const left_dist = Math.abs(v.x - this.x);
		const right_dist = Math.abs(v.x - (this.x + this.width));
		const top_dist = Math.abs(v.y - this.y);
		const bottom_dist = Math.abs(v.y - (this.y + this.height));

		const min_dist = Math.min(left_dist, right_dist, top_dist, bottom_dist);

		if (min_dist === left_dist) return 'west';
		if (min_dist === right_dist) return 'east';
		if (min_dist === top_dist) return 'north';
		if (min_dist === bottom_dist) return 'south';

		return 'none';
	}

	intersects(v: Vector): boolean {
		return !(
			v.x < this.x - BOX_MARGIN * 2 ||
			v.x > this.x + this.width + BOX_MARGIN * 2 ||
			v.y < this.y - BOX_MARGIN * 2 ||
			v.y > this.y + this.height + BOX_MARGIN * 2
		);
	}

	move(v: Vector) {
		for (let i = 0; i < this.items.length; i++) {
			const item = this.items[i];
			const [dx, dy] = v.substract(item.offset);
			item.move(dx, dy);
		}

		this.compute_dimensions();
	}

	resize(prev_mouse: Vector, mouse: Vector, anchor: Vector) {
		const [sx, sy] = mouse.substract(anchor).divide(prev_mouse.substract(anchor));

		this.items.forEach((item) => {
			const old_vecs = this.snapshot.get(item);

			if (!old_vecs) return;

			const [a, , , d] = old_vecs;

			const [dx, dy] = a.substract(anchor).scale(sx, sy).sum(anchor);
			const [width, height] = d.substract(a).scale(sx, sy);

			switch (this.side) {
				case 'east':
				case 'west':
					item.move(dx, a.y);
					item.resize(width, d.substract(a).y);
					break;
				case 'north':
				case 'south':
					item.move(a.x, dy);
					item.resize(d.substract(a).x, height);
					break;
				case 'nor-east':
				case 'nor-west':
				case 'south-east':
				case 'south-west':
					item.move(dx, dy);
					item.resize(width, height);
					break;
			}

			if (sx < 0 || sy < 0) item.normalize();
		});

		this.compute_dimensions();
	}

	private compute_dimensions() {
		let min_vec = new Vector(Infinity, Infinity);
		let max_vec = new Vector(-Infinity, -Infinity);

		this.items.forEach((item) => {
			if (item.type === 'rectangle') {
				const [a, , , d] = item.points;

				min_vec = min_vec.min(a);
				max_vec = max_vec.max(d);
			}

			if (item.type === 'ellipse') {
				const [a, , , d] = item.points;

				min_vec = min_vec.min(a);
				max_vec = max_vec.max(d);
			}
		});

		this.x = min_vec.x;
		this.y = min_vec.y;
		this.width = max_vec.substract(min_vec).x;
		this.height = max_vec.substract(min_vec).y;

		this.norwest.move(this.x - VERTICE_SIZE / 2, this.y - VERTICE_SIZE / 2);
		this.northeast.move(this.x + this.width - VERTICE_SIZE / 2, this.y - VERTICE_SIZE / 2);
		this.southwest.move(this.x - VERTICE_SIZE / 2, this.y + this.height - VERTICE_SIZE / 2);
		this.southeast.move(
			this.x + this.width - VERTICE_SIZE / 2,
			this.y + this.height - VERTICE_SIZE / 2
		);

		if (this.items.length > 1) this.options.strokeLineDash = [5, 5];
		else this.options.strokeLineDash = [0, 0];
	}

	draw(rough: RoughCanvas): void {
		if (this.items.length === 0) return;

		if (this.items.length > 1) this.options.strokeLineDash = [5, 5];
		else this.options.strokeLineDash = [0, 0];

		rough.rectangle(this.x, this.y, this.width, this.height, this.options);

		this.norwest.draw(rough);
		this.northeast.draw(rough);
		this.southwest.draw(rough);
		this.southeast.draw(rough);
	}

	get points(): Vector[] {
		return [
			new Vector(this.x, this.y),
			new Vector(this.x + this.width, this.y),
			new Vector(this.x, this.y + this.height),
			new Vector(this.x + this.width, this.y + this.height)
		];
	}

	is_empty() {
		return this.items.length === 0;
	}
}

class Vertice {
	constructor(
		public x: number,
		public y: number,
		public width: number,
		public height: number,
		public options: ShapeOptions
	) {}

	move(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	draw(rough: RoughCanvas) {
		rough.rectangle(this.x, this.y, this.width, this.height, this.options);
	}

	intersects(v: Vector): boolean {
		return (
			v.x >= this.x - 5 &&
			v.x <= this.x + this.width + 5 &&
			v.y >= this.y - 5 &&
			v.y <= this.y + this.height + 5 &&
			!(
				v.x >= this.x + 5 &&
				v.x <= this.x + this.width - 5 &&
				v.x >= this.y + 5 &&
				v.x <= this.y + this.height - 5
			)
		);
	}
}
