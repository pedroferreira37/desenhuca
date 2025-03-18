export class AABB {
	x: number;
	y: number;
	width: number;
	height: number;

	constructor(x: number, y: number, width: number, height: number) {
		this.x = x;
		this.y = y;
		this.width = width;
		this.height = height;

		this.normalize();
	}

	contains(x: number, y: number): boolean {
		return x >= this.x && x <= this.x + this.width && y >= this.y && y <= this.y + this.height;
	}

	intersects(range: AABB): boolean {
		return !(
			range.x - range.width > this.x + this.width ||
			range.x + range.width < this.x - this.width ||
			range.y - range.height > this.y + this.height ||
			range.y + range.height < this.y - this.height
		);
	}

	normalize() {
		const xmin = Math.min(this.x, this.x + this.width);
		const xmax = Math.max(this.x, this.x + this.width);
		const ymin = Math.min(this.y, this.y + this.height);
		const ymax = Math.max(this.y, this.y + this.height);

		this.x = xmin;
		this.width = xmax - xmin;
		this.y = ymin;
		this.height = ymax - ymin;
	}
}
