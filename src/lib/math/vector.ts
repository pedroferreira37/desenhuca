export class Vector {
	static from(x: number, y: number) {
		return new Vector(x, y);
	}

	static zero() {
		return new Vector(0, 0);
	}

	private constructor(
		public x: number = 0,
		public y: number = 0
	) {}

	clone() {
		return new Vector(this.x, this.y);
	}

	set(x: number, y: number) {
		this.x = x;
		this.y = y;
		return this;
	}

	substract(v: Vector) {
		this.x -= v.x;
		this.y -= v.y;
		return this;
	}

	sum(v: Vector) {
		this.x += v.x;
		this.y += v.y;
		return this;
	}

	divide(scalar: number) {
		if (scalar !== 0) {
			this.x /= scalar;
			this.y /= scalar;
		}

		return this;
	}

	scale(scalar: number) {
		this.x *= scalar;
		this.y *= scalar;
		return this;
	}

	dot(v: Vector) {
		return this.x * v.x + this.y * v.y;
	}

	rotate(cx: number, cy: number, angle: number) {
		const cos = Math.cos(angle);
		const sin = Math.sin(angle);

		const point = this.clone();

		this.x = (point.x - cx) * cos - (point.y - cy) * sin + cx;
		this.y = (point.x - cx) * sin + (point.y - cy) * cos + cy;

		return this;
	}
}
