import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Shape, Point, RoughOptions, Compass } from './types';

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

	childrens: Set<Shape> = $state(new Set());

	norwest: Vertice = $state(new Vertice(0, 0, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS));
	northeast: Vertice = $state(new Vertice(0, 0, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS));
	southwest: Vertice = $state(new Vertice(0, 0, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS));
	southeast: Vertice = $state(new Vertice(0, 0, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS));

	options: RoughOptions;

	constructor(options: RoughOptions) {
		this.options = options;
	}

	add(child: Shape) {
		this.childrens.add(child);
		this.compute();
	}

	mousedown(x: number, y: number) {
		this.childrens.forEach((child) => {
			const [top, , , left] = child.coordinates;
			child.offset = { x: x - left, y: y - top };
		});
	}

	clean() {
		this.childrens.clear();
		this.compute();
	}

	contains(x: number, y: number): boolean {
		return (
			x > this.x + BOX_MARGIN &&
			x < this.x + this.width - BOX_MARGIN &&
			y > this.y + BOX_MARGIN &&
			y < this.y + this.height - BOX_MARGIN
		);
	}

	get_mouse_direction(x: number, y: number): Compass {
		if (this.northeast.intersects(x, y)) return 'nor-east';
		if (this.southwest.intersects(x, y)) return 'south-west';
		if (this.southeast.intersects(x, y)) return 'south-east';
		if (this.norwest.intersects(x, y)) return 'nor-west';

		if (
			x < this.x - BOX_MARGIN * 2 ||
			x > this.x + this.width + BOX_MARGIN * 2 ||
			y < this.y - BOX_MARGIN * 2 ||
			y > this.y + this.height + BOX_MARGIN * 2
		)
			return 'none';

		const left_dist = Math.abs(x - this.x);
		const right_dist = Math.abs(x - (this.x + this.width));
		const top_dist = Math.abs(y - this.y);
		const bottom_dist = Math.abs(y - (this.y + this.height));

		const min_dist = Math.min(left_dist, right_dist, top_dist, bottom_dist);

		if (min_dist === left_dist) return 'west';
		if (min_dist === right_dist) return 'east';
		if (min_dist === top_dist) return 'north';
		if (min_dist === bottom_dist) return 'south';

		return 'none';
	}

	intersects(x: number, y: number): boolean {
		return !(
			x < this.x - BOX_MARGIN * 2 ||
			x > this.x + this.width + BOX_MARGIN * 2 ||
			y < this.y - BOX_MARGIN * 2 ||
			y > this.y + this.height + BOX_MARGIN * 2
		);
	}

	move(x: number, y: number) {
		this.childrens.forEach((child) => {
			child.move(x, y);
		});

		this.compute();
	}

	resize(direction: Compass, x: number, y: number) {
		const initial_x = this.x;
		const initial_y = this.y;
		const initial_width = this.width;
		const initial_height = this.height;

		switch (direction) {
			case 'east':
				this.width = x - this.x;
				break;
			case 'west':
				const rightDist = this.x + this.width;
				this.x = x;
				this.width = rightDist - x;
				break;
			case 'north':
				const bottomDist = this.y + this.height;
				this.y = y;
				this.height = bottomDist - y;
				break;
			case 'south':
				this.height = y - this.y;
				break;
			case 'south-east':
				this.width = x - this.x;
				this.height = y - this.y;
				break;
			case 'nor-west':
				const east = this.x + this.width;
				const south = this.y + this.height;
				this.x = x;
				this.width = east - x;
				this.y = y;
				this.height = south - y;
				break;
			case 'south-west':
				const northeast = this.x + this.width;
				const north = this.y;
				this.height = y - north;
				this.width = northeast - x;
				this.x = x;
				break;
			case 'nor-east':
				const ne = this.y + this.height;
				this.width = x - this.x;
				this.height = ne - y;
				this.y = y;
				break;
		}

		this.childrens.forEach((child) => {
			const [top, right, bottom, left] = child.coordinates;

			child.resize(x, y, {
				direction,
				parent: [this.x, this.y, this.width, this.height],
				proportions: [
					(top - initial_y) / initial_height,
					(right - initial_x) / initial_width,
					(bottom - initial_y) / initial_height,
					(left - initial_x) / initial_width
				]
			});
		});

		this.compute();
	}

	private compute() {
		const coordinates = [...this.childrens.values()].map((child) => child.coordinates);
		/* 
		[
			[1, 2, 3, 4],
			[1, 2, 3, 4]
		]
	*/

		const x = Math.min(...coordinates.map(([, , , left]) => left));
		const y = Math.min(...coordinates.map(([top]) => top));

		const maxWidth = Math.max(...coordinates.map(([, right]) => right));
		const maxHeight = Math.max(...coordinates.map(([, , bottom]) => bottom));

		const width = maxWidth - x;
		const height = maxHeight - y;

		this.x = x - BOX_MARGIN;
		this.y = y - BOX_MARGIN;
		this.width = width + BOX_MARGIN * 2;
		this.height = height + BOX_MARGIN * 2;

		this.norwest.move(this.x - VERTICE_SIZE / 2, this.y - VERTICE_SIZE / 2);
		this.northeast.move(this.x + this.width - VERTICE_SIZE / 2, this.y - VERTICE_SIZE / 2);
		this.southwest.move(this.x - VERTICE_SIZE / 2, this.y + this.height - VERTICE_SIZE / 2);
		this.southeast.move(
			this.x + this.width - VERTICE_SIZE / 2,
			this.y + this.height - VERTICE_SIZE / 2
		);

		if (this.childrens.size > 1) this.options.strokeLineDash = [5, 5];
		else this.options.strokeLineDash = [0, 0];
	}

	draw(rough: RoughCanvas): void {
		if (this.childrens.size === 0) return;

		if (this.childrens.size > 1) this.options.strokeLineDash = [5, 5];
		else this.options.strokeLineDash = [0, 0];

		rough.rectangle(this.x, this.y, this.width, this.height, this.options);

		this.norwest.draw(rough);
		this.northeast.draw(rough);
		this.southwest.draw(rough);
		this.southeast.draw(rough);
	}

	is_empty() {
		return this.childrens.size === 0;
	}
}

class Vertice {
	constructor(
		public x: number,
		public y: number,
		public width: number,
		public height: number,
		public options: RoughOptions
	) {}

	move(x: number, y: number) {
		this.x = x;
		this.y = y;
	}

	draw(rough: RoughCanvas) {
		rough.rectangle(this.x, this.y, this.width, this.height, this.options);
	}

	intersects(x: number, y: number): boolean {
		return (
			x >= this.x - 5 &&
			x <= this.x + this.width + 5 &&
			y >= this.y - 5 &&
			y <= this.y + this.height + 5 &&
			!(
				x >= this.x + 5 &&
				x <= this.x + this.width - 5 &&
				y >= this.y + 5 &&
				y <= this.y + this.height - 5
			)
		);
	}
}
