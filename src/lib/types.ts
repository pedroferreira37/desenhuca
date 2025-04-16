import type { Options } from 'roughjs/bin/core';
import { Vector } from './math/vector';
import type { RoughCanvas } from 'roughjs/bin/canvas';

export type ShapeType = 'rectangle' | 'ellipse' | 'segment';

export interface Shape {
	id: string;
	type: ShapeType;
	vertices: Vector[];
	history: ResizeReference | null;
	offset: Vector;
	angle: number;
	center: Vector;
	AABB: BoundingBox;
	anchor: Vector;
	save(entry: ResizeReference): void;
	move(v: Vector): void;
	intersects(v: Vector): boolean;
	contains(v: Vector): boolean;
	resize(x: number, y: number, x1?: number, y1?: number): void;
	resize_as_group_context(handle: Handle, factor: Vector, keep_aspect_ratio: boolean): void;
	adjust(handle: Handle, mouse: Vector): void;
	rotate(angle: number): void;
	customize(options: Options): void;
	draw(context: CanvasRenderingContext2D, rough: RoughCanvas): void;
	normalize(): void;
}

export interface ResizeReference {
	center: Vector;
	vertices: Vector[];
	displacement: Vector;
	angle: number;
}

export interface BoundingBox {
	x: number;
	y: number;
	width: number;
	height: number;
	angle: number;
	center: Vector;
	vertices: Vector[];
	clear(): void;
	intersects(v: Vector): boolean;
	contains(v: Vector): boolean;
	intersects_rotate_handle(v: Vector): boolean;
	draw(context: CanvasRenderingContext2D): void;
	get_handle_under_cursor(v: Vector): any;
}

export type Cursor =
	| 'custom'
	| 'crosshair'
	| 'move'
	| 'ew'
	| 'nwse'
	| 'nesw'
	| 'ns'
	| 'grab'
	| 'pointer';

export type Handle =
	| 'west'
	| 'east'
	| 'north'
	| 'south'
	| 'south-west'
	| 'south-east'
	| 'nor-west'
	| 'nor-east'
	| 'start'
	| 'end';

export type Tool = 'pointer' | 'pencil' | 'eraser' | 'rectangle' | 'ellipse' | 'segment';
export type PointerMode = 'select' | 'move' | 'resize' | 'rotate' | 'idle';

export type DrawOptions = Partial<Options>;
