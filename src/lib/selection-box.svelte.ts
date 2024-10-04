import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Shape, Point, RoughOptions, CursorStyle } from './types';

const EDGE_SIZE = 14;
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

	norwest: Edge = $state(new Edge(0, 0, EDGE_SIZE, EDGE_SIZE, EDGE_OPTIONS));
	northeast: Edge = $state(new Edge(0, 0, EDGE_SIZE, EDGE_SIZE, EDGE_OPTIONS));
	southwest: Edge = $state(new Edge(0, 0, EDGE_SIZE, EDGE_SIZE, EDGE_OPTIONS));
	southeast: Edge = $state(new Edge(0, 0, EDGE_SIZE, EDGE_SIZE, EDGE_OPTIONS));

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

	intersects(x: number, y: number): boolean {
		return !(
			x < this.x - BOX_MARGIN * 2 ||
			x > this.x + this.width + BOX_MARGIN * 2 ||
			y < this.y - BOX_MARGIN * 2 ||
			y > this.y + this.height + BOX_MARGIN * 2
		);
	}

	intersects_heights(x: number, y: number): boolean {
		return (
			!(x < this.x - BOX_MARGIN * 2 || x > this.x + this.width + BOX_MARGIN) &&
			!(
				y < this.y - BOX_MARGIN + EDGE_SIZE || y > this.y + this.height + BOX_MARGIN * 2 - EDGE_SIZE
			)
		);
	}

	intersects_base(x: number, y: number): boolean {
		return (
			!(y < this.y - BOX_MARGIN * 2 || y > this.y + this.height + BOX_MARGIN) &&
			!(x < this.x - BOX_MARGIN + EDGE_SIZE || x > this.x + this.width + BOX_MARGIN * 2 - EDGE_SIZE)
		);
	}

	intersects_main_diagonal(x: number, y: number): boolean {
		return this.norwest.intersects(x, y) || this.southeast.intersects(x, y);
	}

	intersects_secondary_diagonal(x: number, y: number): boolean {
		return this.northeast.intersects(x, y) || this.southwest.intersects(x, y);
	}

	move(x: number, y: number) {
		this.targets.forEach((target) => {
			const offset = this.offset.get(target);
			target.move(x, y, offset as Point);
		});

		this.compute();
	}

	resize(side: CursorStyle, x: number, y: number) {
		const prev_width = this.width;
		const prev_height = this.height;

		this.width = x - this.x;
		this.height = y - this.y;

		this.targets.forEach((target) => {
			target.resize_proportionally(
				side,
				{
					x: this.x,
					y: this.y,
					width: this.width,
					height: this.height
				},
				prev_width,
				prev_height
			);

			console.log(target.width);

			const rel_left = (target.x - this.x) / prev_width;
			const rel_right = (target.x + target.width - this.x) / prev_width;
			const rel_top = (target.y - this.y) / prev_height;
			const rel_bottom = (target.y + target.height - this.y) / prev_height;

			target.x = this.x + rel_left * this.width;
			target.width = rel_right * this.width - rel_left * this.width;
			target.y = this.y + rel_top * this.height;
			target.height = rel_bottom * this.height - rel_top * this.height;
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

		this.norwest.move(this.x - EDGE_SIZE / 2, this.y - EDGE_SIZE / 2);
		this.northeast.move(this.x + this.width - EDGE_SIZE / 2, this.y - EDGE_SIZE / 2);
		this.southwest.move(this.x - EDGE_SIZE / 2, this.y + this.height - EDGE_SIZE / 2);
		this.southeast.move(this.x + this.width - EDGE_SIZE / 2, this.y + this.height - EDGE_SIZE / 2);

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

class Edge {
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