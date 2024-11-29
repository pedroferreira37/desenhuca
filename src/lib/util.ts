import type { Vector } from './math/vector';
import type { BoundingBox } from './selection-box.svelte';
import type { Tool, Direction } from './types';

export const KeyShortcuts: Map<string, Tool> = new Map([
	['1', 'pointer'],
	['2', 'pencil'],
	['3', 'rectangle'],
	['4', 'ellipse'],
	['5', 'segment'],
	['6', 'eraser']
]);

export function update_anchor_pos(pointer: Vector, anchor: Vector, box: BoundingBox) {
	box.side = box.find_pointer_side(pointer);

	const [a, , , d] = box.points;

	switch (box.side) {
		case 'east':
			anchor.set(a.x, a.y);
			break;
		case 'west':
			anchor.set(d.x, a.x);
			break;
		case 'south':
			anchor.set(a.x, a.y);
			break;
		case 'north':
			anchor.set(a.x, d.y);
			break;
		case 'south-east':
			anchor.set(a.x, box.y);
			break;
		case 'south-west':
			anchor.set(d.x, a.y);
			break;
		case 'nor-west':
			anchor.set(d.x, d.y);
			break;
		case 'nor-east':
			anchor.set(a.x, d.y);
			break;
	}
}

export function match(value: string, pattern: string): boolean {
	return value === pattern;
}
