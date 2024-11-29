export class Vector {
	public x: number;
	public y: number;

	constructor(x: number = 0, y: number = 0) {
		this.x = x;
		this.y = y;
	}

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

	scale(sx: number, sy: number) {
		return new Vector(this.x * sx, this.y * sy);
	}

	min(v: Vector) {
		return new Vector(Math.min(this.x, v.x), Math.min(this.y, v.y));
	}

	max(v: Vector) {
		return new Vector(Math.max(this.x, v.x), Math.max(this.y, v.y));
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
