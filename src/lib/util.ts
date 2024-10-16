import type { Tools } from './types';

export function switchToolByKey(key: string): Tools {
	switch (key) {
		case '1':
			return 'pointer';
		case '2':
			return 'free-hand-draw';
		case '3':
			return 'rectangle';
		case '4':
			return 'ellipse';
		case '4':
			return 'line';
		case '6':
			return 'erase';
		default:
			return 'pointer';
	}
}
