import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Options } from 'roughjs/bin/core';
import type { ShapeKind } from './consts';

export interface ResizeOptions {
	direction: Compass;
	parent: number[];
	proportions: number[];
}

export interface Shape {
	coordinates: number[];
	offset: Point;
	customize(options: RoughOptions): void;
	move(x: number, y: number): void;
	resize(x: number, y: number, options?: ResizeOptions): void;
	draw(rough: RoughCanvas): void;
	intersects(x: number, y: number): boolean;
	contains(x: number, y: number): boolean;
}

export interface Point {
	x: number;
	y: number;
}

export type Cursor =
	| 'default'
	| 'crosshair'
	| 'move'
	| 'ew-resize'
	| 'nwse-resize'
	| 'nesw-resize'
	| 'ns-resize';

type Obligatory<T, K extends keyof T> = T & { [P in K]-?: T[K] };

export type RoughOptions = Obligatory<Options, 'strokeWidth'>;

export type ShapeType = (typeof ShapeKind)[keyof typeof ShapeKind];
export type Compass =
	| 'west'
	| 'east'
	| 'north'
	| 'south'
	| 'south-west'
	| 'south-east'
	| 'nor-west'
	| 'nor-east'
	| 'none';

export type Tools = 'pointer' | 'free-hand-draw' | 'erase' | 'pan' | ShapeType;
