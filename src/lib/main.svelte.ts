import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { DesenhucaShape, DesenhucaShapeType, DesenhucaShapeOptions } from './types';
import type { Point } from './types';
import { ShapeKind } from './consts';

export class Rectangle implements DesenhucaShape {
	type = 'rectangle';
	x: number = $state(0);
	y: number = $state(0);
	width: number = $state(0);
	height: number = $state(0);
	options: DesenhucaShapeOptions = $state({});

	constructor(x: number, y: number, width: number, height: number, options?: Options) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;
	}

	move(x: number, y: number, offset_x: number, offset_y: number): void {
		this.x = x - offset_x;
		this.y = y - offset_y;
	}

	resize(x: number, y: number): void {
		this.width = x - this.x;
		this.height = y - this.y;
	}

	draw(rough: RoughCanvas): void {
		rough.rectangle(this.x, this.y, this.width, this.height, this.options);
	}

	customize(options: DesenhucaShapeOptions): void {
		this.options = { ...this.options, ...options };
	}

	intersects(p: Point): boolean {
		return (
			(!(p.x > this.x + this.width + 5) && p.x > this.x + this.width - 5) ||
			(!(p.x < this.x - 5) && p.x < this.x + 5) ||
			(!(p.y > this.y + this.height + 5) && p.y > this.y + this.height - 5) ||
			(!(p.y < this.y - 5) && p.y < this.y + 5)
		);
	}

	contains(point: Point): boolean {
		return (
			point.x >= this.x &&
			point.x <= this.x + this.width &&
			point.y >= this.y &&
			point.y <= this.y + this.height
		);
	}

	dimensions(): Point[] {
		return [
			{ x: this.x, y: this.y },
			{ x: this.x + this.width, y: this.y + this.height }
		];
	}

	highlight(rough: RoughCanvas): void {
		const size = 10;

		const options = {
			stroke: 'rgba(137, 196, 244, 1)',
			strokeWidth: 2,
			roughness: 0
		};

		rough.rectangle(this.x - 10, this.y - 10, this.width + 10, this.height + 10, options);
		rough.rectangle(this.x - 15, this.y - 15, size, size, options);
		rough.rectangle(this.width + this.x + 5, this.y - 15, size, size, options);
		rough.rectangle(this.x - 15, this.height + this.y + 5, size, size, options);
		rough.rectangle(this.width + this.x + 5, this.height + this.y + 5, size, size, options);
	}
}

export const create_shape = (
	type: DesenhucaShapeType,
	x: number,
	y: number,
	width: number,
	height: number,
	options?: DesenhucaShapeOptions
): DesenhucaShape => {
	switch (type) {
		case ShapeKind.Rectangle:
			return new Rectangle(x, y, width, height, options);
		default:
			throw new Error('invalid mode');
	}
};
