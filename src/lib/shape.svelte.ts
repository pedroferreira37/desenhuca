import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Shape, Compass, RoughOptions, ShapeType, ResizeOptions } from './types';
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

	resize(x: number, y: number, options: ResizeOptions) {
		if (!options) {
			this.width = x - this.x;
			this.height = y - this.y;
			return;
		}

		const [parentX, parentY, parentWidth, parentHeight] = options.parent;
		const [proportionTop, proportionRight, proportionBottom, proportionLeft] = options.proportions;

		switch (options.direction) {
			case 'east':
			case 'west':
				this.x = parentX + proportionLeft * parentWidth;
				this.width = proportionRight * parentWidth - proportionLeft * parentWidth;
				break;
			case 'north':
			case 'south':
				this.y = parentY + proportionTop * parentHeight;
				this.height = proportionBottom * parentHeight - proportionTop * parentHeight;
				break;
			case 'nor-west':
			case 'south-east':
			case 'nor-east':
			case 'south-west':
				this.y = parentY + proportionTop * parentHeight;
				this.x = parentX + proportionLeft * parentWidth;
				this.height = proportionBottom * parentHeight - proportionTop * parentHeight;
				this.width = proportionRight * parentWidth - proportionLeft * parentWidth;
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

export function createShape(
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
