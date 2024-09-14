import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Options } from 'roughjs/bin/core';
import type { ShapeKind } from './consts';

export interface DesenhucaShape {
	customize(options: DesenhucaShapeOptions): void;
	move(x: number, y: number): void;
	resize(x: number, y: number): void;
	draw(rough: RoughCanvas): void;
	intersects(point: Point): boolean;
	contains(point: Point): boolean;
	coords(): Point[];
	highlight(rough: RoughCanvas): void;
}

export interface Point {
	x: number;
	y: number;
}

export type DesenhucaShapeOptions = Partial<Options>;

export type DesenhucaShapeType = (typeof ShapeKind)[keyof typeof ShapeKind];
export type DesenhucaMode = 'select' | 'free-hand-draw' | 'erase' | 'pan' | DesenhucaShapeType;
