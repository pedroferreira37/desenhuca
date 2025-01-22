import type { Options } from 'roughjs/bin/core';
import { Vector } from './math/vector';
import type { AABB } from './collision/aabb';
import type { BoundingBox } from './collision/bounding-box';

export type ShapeType = 'rectangle' | 'ellipse' | 'segment';

export interface Shape {
	type: ShapeType;
	vertices: Vector[];
	rotation: number;
	offset: Vector;
	cx: number;
	cy: number;
	AABB: BoundingBox;
	customize(options: Options): void;
	move(x: number, y: number): void;
	resize(width: number, height: number): void;
	rotate(angle: number): void;
	draw(context: CanvasRenderingContext2D): void;
	intersects(pos: Vector): boolean;
	contains(x: number, y: number): boolean;
	normalize(): void;
}

export type SpacialSearchParmas =
	| {
			at: Vector;
			range: null;
	  }
	| {
			at: null;
			range: AABB;
	  };

export type Cursor =
	| 'default'
	| 'crosshair'
	| 'move'
	| 'ew-resize'
	| 'nwse-resize'
	| 'nesw-resize'
	| 'ns-resize'
	| 'grab';

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
export type PointerMode = 'select' | 'move' | 'resize' | 'rotate' | 'idle';

export type DrawOptions = Partial<Options>;
