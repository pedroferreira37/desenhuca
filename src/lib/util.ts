import type { Tools } from './types';

export function select_tool_by_key(key: string): Tools {
	switch (key) {
		case '1':
			return 'pointer';
		case '2':
			return 'free-hand-draw';
		case '3':
			return 'rectangle';
		case '4':
			return 'ellipse';
		case '5':
			return 'line';
		case '6':
			return 'erase';
		default:
			return 'pointer';
	}
}

export function match(value: string, pattern: string): boolean {
	return value === pattern;
}
