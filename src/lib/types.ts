import type { RoughCanvas } from 'roughjs/bin/canvas';
import type { Options } from 'roughjs/bin/core';
import type { ShapeKind } from './consts';

export interface DesenhucaShape {
	x: number;
	y: number;
	customize(options: RoughOptions): void;
	move(x: number, y: number, offset: Point): void;
	resize(x: number, y: number): void;
	draw(rough: RoughCanvas): void;
	intersects(x: number, y: number): boolean;
	contains(x: number, y: number): boolean;
	dimensions(): Point[];
	highlight(rough: RoughCanvas): void;
}

export interface Point {
	x: number;
	y: number;
}

type Obligatory<T, K extends keyof T> = T & { [P in K]-?: T[K] };

export type RoughOptions = Obligatory<Options, 'strokeWidth'>;

export type DesenhucaShapeType = (typeof ShapeKind)[keyof typeof ShapeKind];
export type DesenhucaMode = 'select' | 'free-hand-draw' | 'erase' | 'pan' | DesenhucaShapeType;
