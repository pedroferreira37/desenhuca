import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Options } from 'roughjs/bin/core';
import type { ShapeKind } from './consts';

export interface DesenhucaShape {
	x: number;
	y: number;
	customize(options: DesenhucaShapeOptions): void;
	move(x: number, y: number, offset_x: number, offset_y: number): void;
	resize(x: number, y: number): void;
	draw(rough: RoughCanvas): void;
	intersects(point: Point): boolean;
	contains(point: Point): boolean;
	dimensions(): Point[];
	highlight(rough: RoughCanvas): void;
}

export interface Point {
	x: number;
	y: number;
}

export type DesenhucaShapeOptions = Partial<Options>;

export type DesenhucaShapeType = (typeof ShapeKind)[keyof typeof ShapeKind];
export type DesenhucaMode = 'select' | 'free-hand-draw' | 'erase' | 'pan' | DesenhucaShapeType;
