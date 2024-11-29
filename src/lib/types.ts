import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Options } from 'roughjs/bin/core';
import { Vector } from './math/vector';

export type ShapeType = 'rectangle' | 'ellipse' | 'segment';

export interface Shape {
	type: ShapeType;
	points: Vector[];
	offset: Vector;
	center: Vector;
	customize(options: Options): void;
	move(x: number, y: number): void;
	resize(width: number, height: number): void;
	draw(rough: RoughCanvas): void;
	intersects(v: Vector): boolean;
	contains(v: Vector): boolean;
	normalize(): void;
}

export type Cursor =
	| 'default'
	| 'crosshair'
	| 'move'
	| 'ew-resize'
	| 'nwse-resize'
	| 'nesw-resize'
	| 'ns-resize';

export type Direction =
	| 'west'
	| 'east'
	| 'north'
	| 'south'
	| 'south-west'
	| 'south-east'
	| 'nor-west'
	| 'nor-east'
	| 'none';

export type Tool = 'pointer' | 'pencil' | 'eraser' | 'rectangle' | 'ellipse' | 'segment';
export type PointerMode = 'select' | 'move' | 'resize' | 'default';

export type ShapeOptions = Partial<Options>;
