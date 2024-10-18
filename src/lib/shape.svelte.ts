import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Shape, RoughOptions, ShapeType, ResizeOptions } from './types';
import type { Point } from './types';
import { ShapeKind } from './consts';

export class Rectangle implements Shape {
	type = 'rectangle';
	x: number = $state(0);
	y: number = $state(0);
	width: number = $state(0);
	height: number = $state(0);
	options: RoughOptions = $state({ strokeWidth: 4 });
	offset: Point = $state({ x: 0, y: 0 });

	constructor(x: number, y: number, width: number, height: number, options: RoughOptions) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
		this.options = options;
	}

	move(x: number, y: number): void {
		this.x = x - this.offset.x;
		this.y = y - this.offset.y;
	}

	normalize() {
		const min_x = Math.min(this.x, this.x + this.width);
		const max_x = Math.max(this.x, this.x + this.width);
		const min_y = Math.min(this.y, this.y + this.height);
		const max_y = Math.max(this.y, this.y + this.height);

		this.x = min_x;
		this.width = max_x - min_x;
		this.y = min_y;
		this.height = max_y - min_y;
	}

	resize(x: number, y: number, options: ResizeOptions) {
		if (!options) {
			this.width = x - this.x;
			this.height = y - this.y;
			return;
		}

		const [parent_x, parent_y, parent_width, parent_height] = options.parent;
		const [top_ratio, right_ratio, bottom_ratio, left_ratio] = options.proportions;

		switch (options.direction) {
			case 'east':
			case 'west':
				this.x = parent_x + left_ratio * parent_width;
				this.width = right_ratio * parent_width - left_ratio * parent_width;
				break;
			case 'north':
			case 'south':
				this.y = parent_y + top_ratio * parent_height;
				this.height = bottom_ratio * parent_height - top_ratio * parent_height;
				break;
			case 'nor-west':
			case 'south-east':
			case 'nor-east':
			case 'south-west':
				this.y = parent_y + top_ratio * parent_height;
				this.x = parent_x + left_ratio * parent_width;
				this.height = bottom_ratio * parent_height - top_ratio * parent_height;
				this.width = right_ratio * parent_width - left_ratio * parent_width;
				break;
		}
	}

	draw(rough: RoughCanvas): void {
		rough.rectangle(this.x, this.y, this.width, this.height, this.options);
	}

	customize(options: RoughOptions): void {
		this.options = { ...this.options, ...options };
	}

	intersects(x: number, y: number): boolean {
		const intersects =
			(x >= this.x - 10 && x <= this.x + 10 && y >= this.y && y <= this.y + this.height) ||
			(x >= this.x + this.width - 10 &&
				x <= this.x + this.width + 10 &&
				y >= this.y &&
				y <= this.y + this.height) ||
			(y >= this.y - 10 && y <= this.y + 10 && x >= this.x && x <= this.x + this.width) ||
			(y >= this.y + this.height - 10 &&
				y <= this.y + this.height + 10 &&
				x >= this.x &&
				x <= this.x + this.width);

		if (this.options.fillStyle === 'solid') return this.contains(x, y) || intersects;

		return intersects;
	}

	contains(x: number, y: number): boolean {
		return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
	}

	get coordinates(): number[] {
		return [this.y, this.x + this.width, this.y + this.height, this.x];
	}
}

export function create_shape(
	type: ShapeType,
	x: number,
	y: number,
	width: number,
	height: number,
	options: RoughOptions
): Shape {
	switch (type) {
		case ShapeKind.Rectangle:
			return new Rectangle(x, y, width, height, options);
		default:
			throw new Error('invalid mode');
	}
}
