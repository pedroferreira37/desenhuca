import type { RoughCanvas } from 'roughjs/bin/canvas';
import { type DrawOptions, type Shape, type ShapeType } from './types';

import type { Options } from 'roughjs/bin/core';
import { Vector } from './math/vector';
import { Ellipse } from './shape/ellipse';
import { Rectangle } from './shape/rectangle';

export function create_shape(
	type: ShapeType,
	x: number,
	y: number,
	width: number,
	height: number,
	options: Options
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
