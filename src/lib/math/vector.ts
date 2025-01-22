export class Vector {
	constructor(
		public x: number = 0,
		public y: number = 0
	) {}

	substract(v: Vector) {
		return new Vector(this.x - v.x, this.y - v.y);
	}

	divide(v: Vector | number) {
		if (typeof v === 'number') {
			return new Vector(this.x / v, this.y / v);
		}
		return new Vector(this.x / v.x, this.y / v.y);
	}

	sum(v: Vector) {
		return new Vector(this.x + v.x, this.y + v.y);
	}

	multiply(v: Vector) {
		return new Vector(this.x * v.x, this.y * v.y);
	}

	static min(...args: Vector[]) {
		let min_x = args[0].x;
		let min_y = args[0].y;

		for (let i = 1; i < args.length; i++) {
			const arg = args[i];
			min_x = Math.min(min_x, arg.x);
			min_y = Math.min(min_y, arg.y);
		}

		return new Vector(min_x, min_y);
	}

	static max(...args: Vector[]) {
		let max_x = args[0].x;
		let max_y = args[0].y;

		for (let i = 1; i < args.length; i++) {
			const arg = args[i];
			max_x = Math.max(max_x, arg.x);
			max_y = Math.max(max_y, arg.y);
		}

		return new Vector(max_x, max_y);
	}

	set(x: number, y: number) {
		this.x = x;
		this.y = y;
		return this;
	}

	[Symbol.iterator]() {
		return [this.x, this.y][Symbol.iterator]();
	}
}
