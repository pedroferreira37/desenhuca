import type { Options } from 'roughjs/bin/core';
import { Vector } from './math/vector';
import type { RoughCanvas } from 'roughjs/bin/canvas';

export type ShapeType = 'rectangle' | 'ellipse' | 'segment';

export interface Shape {
	type: ShapeType;
	vertices: Vector[];
	reference: Vector[];
	offset: Vector;
	angle: number;
	center: Vector;
	set_offset(v: Vector): void;
	move(v: Vector): void;
	intersects(v: Vector): boolean;
	contains(v: Vector): boolean;
	resize(width: number, height: number): void;
	adjust(direction: Direction, mouse: Vector): void;
	rotate(angle: number): void;
	customize(options: Options): void;
	draw(context: CanvasRenderingContext2D, rough: RoughCanvas): void;
	normalize(): void;
}

export type Cursor = 'custom' | 'crosshair' | 'move' | 'ew' | 'nwse' | 'nesw' | 'ns' | 'grab';

export type Direction =
	| 'west'
	| 'east'
	| 'north'
	| 'south'
	| 'south-west'
	| 'south-east'
	| 'nor-west'
	| 'nor-east';

export type Tool = 'pointer' | 'pencil' | 'eraser' | 'rectangle' | 'ellipse' | 'segment';
export type PointerMode = 'select' | 'move' | 'resize' | 'rotate' | 'idle';

export type DrawOptions = Partial<Options>;
