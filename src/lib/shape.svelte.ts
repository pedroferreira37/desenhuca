import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { CursorStyle, DesenhucaShape, RoughOptions, ShapeType } from './types';
import type { Point } from './types';
import { ShapeKind } from './consts';
import type { RoughGenerator } from 'roughjs/bin/generator';

export class Rectangle implements DesenhucaShape {
	type = 'rectangle';
	x: number = $state(0);
	y: number = $state(0);
	width: number = $state(0);
	height: number = $state(0);
	options: RoughOptions = $state({ strokeWidth: 4 });
	selected: boolean = $state(false);

	constructor(x: number, y: number, width: number, height: number, options: RoughOptions) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.options = options;
	}

	move(x: number, y: number, offset: Point): void {
		this.x = x - offset.x;
		this.y = y - offset.y;
	}

	resize(x: number, y: number) {
		this.width = x - this.x;
		this.height = y - this.y;
	}

	resize_proportionally(
		side: string,
		box_coordinates: number[],
		prev_width: number,
		prev_height: number
	): void {
		const [x, y, width, height] = box_coordinates;

		const rel_left = (this.x - x) / prev_width;
		const rel_right = (this.x + this.width - x) / prev_width;
		const rel_top = (this.y - y) / prev_height;
		const rel_bottom = (this.y + this.height - y) / prev_height;
		/* 
 Note:
                 * To maintain the correct resize for all directions, we 
                 * have to maintain a fix point, and grow another point. 
                 * Either the width or the x
                 *
                 * */

		/* 
 Note:
                 * I'll commit this since is wip, and my project and I need to remember
                 * I'm high and my girl wanna go out saying that everytime I stuck
                 * in this thing called programming
                 * brb
                 * This is wrong btw
                 *
                 * */

		const base_x = this.x + this.width;
		switch (side) {
			case 'left':
				this.x = x + rel_left * width;
				this.width = rel_right * width - rel_left * width;
				break;
			case 'right':
				this.x = x + rel_left * width;
				this.width = base_x * width;
				break;
			case 'ns-resize':
				// do nothing for a moment
				break;
		}
		// this.width = x - this.x;
		// this.height = y - this.y;
	}

	draw(rough: RoughCanvas): void {
		this.selected = false;
		rough.rectangle(this.x, this.y, this.width, this.height, this.options);
	}

	customize(options: RoughOptions): void {
		this.options = { ...this.options, ...options };
	}

	intersects(x: number, y: number): boolean {
		const intersects = () => {
			return (
				(x >= this.x - 5 && x <= this.x + 5 && y >= this.y && y <= this.y + this.height) ||
				(x >= this.x + this.width - 5 &&
					x <= this.x + this.width + 5 &&
					y >= this.y &&
					y <= this.y + this.height) ||
				(y >= this.y - 5 && y <= this.y + 5 && x >= this.x && x <= this.x + this.width) ||
				(y >= this.y + this.height - 5 &&
					y <= this.y + this.height + 5 &&
					x >= this.x &&
					x <= this.x + this.width)
			);
		};

		if (this.options.fillStyle === 'solid') return this.contains(x, y) || intersects();

		return intersects();
	}

	contains(x: number, y: number): boolean {
		return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
	}

	dimensions(): Point[] {
		return [
			{ x: this.x, y: this.y },
			{ x: this.x + this.width, y: this.y + this.height }
		];
	}

	highlight(rough: RoughCanvas): void {
		const base_opt: RoughOptions = {
			stroke: 'rgba(137, 196, 244, 1)',
			strokeWidth: 4,
			roughness: 0
		};

		const edges_opt: RoughOptions = {
			...base_opt,
			fillStyle: 'solid',
			fill: 'white'
		};

		rough.rectangle(this.x, this.y, this.width, this.height, base_opt);

		const edges_size = 14;

		/* top-left */
		rough.rectangle(
			this.x - edges_size / 2,
			this.y - edges_size / 2,
			edges_size,
			edges_size,
			edges_opt
		);

		/* top-right */
		rough.rectangle(
			this.x + this.width - edges_size / 2,
			this.y - edges_size / 2,
			edges_size,
			edges_size,
			edges_opt
		);

		/* bottom-left */
		rough.rectangle(
			this.x - edges_size / 2,
			this.y + this.height - edges_size / 2,
			edges_size,
			edges_size,
			edges_opt
		);

		/* bottom-right */
		rough.rectangle(
			this.x + this.width - edges_size / 2,
			this.y + this.height - edges_size / 2,
			edges_size,
			edges_size,
			edges_opt
		);
	}
}

export const create_shape = (
	type: ShapeType,
	x: number,
	y: number,
	width: number,
	height: number,
	options: RoughOptions
): DesenhucaShape => {
	switch (type) {
		case ShapeKind.Rectangle:
			return new Rectangle(x, y, width, height, options);
		default:
			throw new Error('invalid mode');
	}
};
