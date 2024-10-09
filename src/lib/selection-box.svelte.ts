import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Shape, Point, RoughOptions, HoverDirection } from './types';

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

	targets: Set<Shape> = $state(new Set());

	offset: Map<Shape, Point> = $state(new Map());

	norwest: Vertice = $state(new Vertice(0, 0, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS));
	northeast: Vertice = $state(new Vertice(0, 0, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS));
	southwest: Vertice = $state(new Vertice(0, 0, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS));
	southeast: Vertice = $state(new Vertice(0, 0, VERTICE_SIZE, VERTICE_SIZE, EDGE_OPTIONS));

	options: RoughOptions;

	constructor(options: RoughOptions) {
		this.options = options;
	}

	add(target: Shape | null) {
		if (!target) return;

		this.targets.add(target);
		this.compute();
	}

	update_offset(x: number, y: number) {
		this.targets.forEach((target) => {
			this.offset.set(target, {
				x: x - target.x,
				y: y - target.y
			});
		});
	}

	clean() {
		this.targets.clear();
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

	detect_hover_direction(x: number, y: number): HoverDirection {
		if (this.northeast.intersects(x, y)) return 'nor_east';
		if (this.southwest.intersects(x, y)) return 'south_west';
		if (this.southeast.intersects(x, y)) return 'south_east';
		if (this.norwest.intersects(x, y)) return 'nor_west';

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

		const min = Math.min(left_dist, right_dist, top_dist, bottom_dist);

		if (min === left_dist) return 'left';
		if (min === right_dist) return 'right';
		if (min === top_dist) return 'top';
		if (min === bottom_dist) return 'bottom';

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
		this.targets.forEach((target) => {
			const offset = this.offset.get(target);
			target.move(x, y, offset as Point);
		});

		this.compute();
	}

	resize(direction: HoverDirection, x: number, y: number) {
		const prev_width = this.width;
		const prev_height = this.height;

		this.width = x - this.x;
		this.height = y - this.y;

		this.targets.forEach((target) => {
			target.resize_proportionally(
				direction,
				{
					x: this.x,
					y: this.y,
					height: this.height,
					width: this.width
				},
				prev_width,
				prev_height
			);
		});

		this.compute();
	}

	private compute() {
		const targets = [...this.targets.values()];

		const x = Math.min(...targets.map((target) => target.x));
		const y = Math.min(...targets.map((target) => target.y));

		const max_x = Math.max(...targets.map((target) => target.x + target.width));
		const max_y = Math.max(...targets.map((target) => target.y + target.height));

		const width = max_x - x;
		const height = max_y - y;

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

		if (this.targets.size > 1) this.options.strokeLineDash = [5, 5];
		else this.options.strokeLineDash = [0, 0];
	}

	draw(rough: RoughCanvas): void {
		if (this.targets.size === 0) return;

		rough.rectangle(this.x, this.y, this.width, this.height, this.options);

		this.norwest.draw(rough);
		this.northeast.draw(rough);
		this.southwest.draw(rough);
		this.southeast.draw(rough);
	}

	is_empty() {
		return this.targets.size === 0;
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
