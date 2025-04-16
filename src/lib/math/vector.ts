export class Vector {
	static from(x: number, y: number) {
		return new Vector(x, y);
	}

	static zero() {
		return Vector.from(0, 0);
	}

	private constructor(
		public x: number = 0,
		public y: number = 0
	) {}

	clone() {
		return Vector.from(this.x, this.y);
	}

	set(x: number, y: number) {
		this.x = x;
		this.y = y;
		return this;
	}

	substract(v: Vector) {
		return Vector.from(this.x - v.x, this.y - v.y);
	}

	sum(v: Vector): Vector {
		return Vector.from(this.x + v.x, this.y + v.y);
	}

	divide(scalar: number): Vector {
		return Vector.from(this.x / scalar, this.y / scalar);
	}

	multiply(v: Vector): Vector {
		return Vector.from(this.x * v.x, this.y * v.y);
	}

	scale(scalar: number) {
		this.x *= scalar;
		this.y *= scalar;
		return this;
	}

	rotate(cx: number, cy: number, angle: number): Vector {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		return Vector.from(
			cx + (this.x - cx) * cos - sin * (this.y - cy),
			cy + (this.x - cx) * sin + cos * (this.y - cy)
		);
	}
}
