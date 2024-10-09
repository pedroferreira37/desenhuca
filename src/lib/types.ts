import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Options } from 'roughjs/bin/core';
import type { ShapeKind } from './consts';

export type Box = {
	x: number;
	y: number;
	width: number;
	height: number;
};

export interface DesenhucaShape {
	x: number;
	y: number;
	customize(options: RoughOptions): void;
	move(x: number, y: number, offset: Point): void;
	resize(x: number, y: number): void;
	resize_proportionally(
		side: HoverDirection,
		box_coordinates: Box,
		prev_width: number,
		prev_height: number
	): void;
	draw(rough: RoughCanvas): void;
	intersects(x: number, y: number): boolean;
	contains(x: number, y: number): boolean;
	dimensions(): Point[];
	highlight(rough: RoughCanvas): void;
}

type Rectangle = DesenhucaShape & {
	type: 'rectangle';
	width: number;
	height: number;
};

type Ellipse = DesenhucaShape & {
	type: 'ellipse';
	width: number;
	height: number;
};

export type Shape = Rectangle | Ellipse;

export interface Point {
	x: number;
	y: number;
}

export type CursorGlyph =
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
export type HoverDirection =
	| 'left'
	| 'right'
	| 'top'
	| 'bottom'
	| 'south_west'
	| 'south_east'
	| 'nor_west'
	| 'nor_east'
	| 'none';

export type Tools = 'pointer' | 'free-hand-draw' | 'erase' | 'pan' | ShapeType;
