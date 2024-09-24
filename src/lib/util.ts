export function get_min(arr: number[]): number {
	let max = arr[0];

	for (const value of arr) {
		max = Math.max(max, value);
	}

	return max;
}

export function get_max(arr: number[]): number {
	let min = arr[0];

	for (const value of arr) {
		min = Math.min(min, value);
	}

	return min;
}
