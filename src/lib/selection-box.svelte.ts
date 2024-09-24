import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { DesenhucaShape, Point, RoughOptions } from './types';

export class BoundingBox {
	targets: Set<DesenhucaShape> = $state(new Set());
	options: RoughOptions = $state({
		stroke: 'rgba(137, 196, 244, 1)',
		strokeWidth: 4,
		roughness: 0
	});

	add(found: DesenhucaShape | DesenhucaShape[]) {
		if (!Array.isArray(found)) this.targets.add(found);
		else {
			if (!found.length) return;

			for (const target of found) {
				this.targets.add(target);
			}
		}
	}

	clean() {
		this.targets.clear();
	}

	intersects_path(x: number, y: number): boolean {
		if (this.targets.size === 0) return false;

		const rect = this.get_rect();

		return (
			(!(x > rect.x + rect.width + 5) && x > rect.x + rect.width - 5) ||
			(!(x < rect.x - 5) && x < rect.x + 5) ||
			(!(y > rect.y + rect.height + 5) && y > rect.y + rect.height - 5) ||
			(!(y < rect.y - 5) && y < rect.y + 5)
		);

		/* 	return !(x < rect.x || x > rect.x + rect.width || y < rect.y || y > rect.y + rect.height); */
	}

	intersects_northeast_edge(x: number, y: number): boolean {
		const rect = this.get_rect();

		const edge = rect.edges[0];

		return edge.intersects(x, y);
	}

	intersects_northwest(x: number, y: number): boolean {
		const rect = this.get_rect();

		return !(x < rect.x || x > rect.x + rect.width || y < rect.y || y > rect.y + rect.height);
	}

	move(x: number, y: number, offset: Point) {
		console.log(offset);
		this.targets.forEach((target) => {
			target.move(x, y, offset);
		});
	}

	resize(x: number, y: number) {
		this.targets.forEach((target) => {
			target.resize(x, y);
		});
	}

	get_rect() {
		const targets = [...this.targets.values()];

		const x = Math.min(...targets.map((target) => target.x));
		const y = Math.min(...targets.map((target) => target.y));

		const max_x = Math.max(...targets.map((target) => target.x + target.width));
		const max_y = Math.max(...targets.map((target) => target.y + target.height));

		const width = max_x - x;
		const height = max_y - y;

		const edges_size = 14;

		const edges_opt: RoughOptions = {
			...this.options,
			fillStyle: 'solid',
			fill: 'white'
		};

		const edges = [
			new Edge(x - edges_size / 2, y - edges_size / 2, edges_size, edges_size, edges_opt),
			new Edge(x + width - edges_size / 2, y - edges_size / 2, edges_size, edges_size, edges_opt),
			new Edge(x - edges_size / 2, y + height - edges_size / 2, edges_size, edges_size, edges_opt),
			new Edge(
				x + width - edges_size / 2,
				y + height - edges_size / 2,
				edges_size,
				edges_size,
				edges_opt
			)
		];

		return {
			x,
			y,
			width,
			height,
			edges
		};
	}

	contains(x: number, y: number): boolean {
		const rect = this.get_rect();

		return x >= rect.x && x <= rect.x + rect.width && y >= rect.y && y <= rect.y + rect.height;
	}

	draw(rough: RoughCanvas): void {
		if (this.targets.size === 0) return;

		const rect = this.get_rect();

		rough.rectangle(rect.x, rect.y, rect.width, rect.height, this.options);

		for (const edges of rect.edges) {
			edges.draw(rough);
		}
	}

	empty() {
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

	draw(rough: RoughCanvas) {
		rough.rectangle(this.x, this.y, this.width, this.height, this.options);
	}

	intersects(x: number, y: number): boolean {
		return !(x < this.x || x > this.x + this.width || y > this.y || y > this.y + this.height);
	}
}
