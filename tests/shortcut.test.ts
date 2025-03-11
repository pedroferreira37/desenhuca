import type { Tool } from '$lib/types';
import { get_tool_by_shortcut } from '$lib/util/util';
import { expect, it } from 'vitest';

it('check if the tool is according the key pressed', () => {
	const tests: [string, Tool | null][] = [
		['1', 'pointer'],
		['2', 'pencil'],
		['3', 'rectangle'],
		['4', 'ellipse'],
		['5', 'segment'],
		['6', 'eraser'],
		['10', null],
		['60', null],
		['', null],
		['r', null]
	];

	for (const [key, expected] of tests) {
		const tool = get_tool_by_shortcut(key);
		expect(tool).toBe(expected);
	}
});
