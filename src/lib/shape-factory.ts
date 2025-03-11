import type { DrawOptions, Shape, ShapeType } from './types';
import { Ellipse } from './shape/ellipse';
import { Rectangle } from './shape/rectangle';

export default function create(
	type: ShapeType,
	x: number,
	y: number,
	width: number,
	height: number,
	options: DrawOptions
): Shape {
	switch (type) {
		case 'rectangle':
			return new Rectangle(x, y, width, height, options);
		case 'ellipse':
			return new Ellipse(x, y, width, height, options);
		default:
			throw new Error('invalid mode');
	}
}
