import { Vector } from '$lib/math/vector';
import type { Direction, DrawOptions, Shape } from '$lib/types';
import { project_point_on_segment } from '$lib/util/util';

const SIZE = 12;
const OFFSET = 12;
const THREESHOLD = 20;

const CORNERS: Direction[] = ['nor-west', 'south-west', 'south-east', 'nor-east'];
const EDGES: Direction[] = ['north', 'south', 'west', 'east'];

class BoundingBox {
	public x: number = 0;
	public y: number = 0;
	public width: number = 0;
	public height: number = 0;
	public angle: number = 0;

	update(contents: Shape[]) {
		const min = Vector.from(Infinity, Infinity);
		const max = Vector.from(-Infinity, -Infinity);

		for (const content of contents) {
			const should_calculate_as_rotated_points = contents.length > 1;

			const [nw, sw, se, ne] = should_calculate_as_rotated_points
				? content.vertices.map((v) =>
						v.clone().rotate(content.center.x, content.center.y, -content.angle)
					)
				: content.vertices;

			min.set(Math.min(min.x, nw.x, sw.x, se.x, ne.x), Math.min(min.y, nw.y, sw.y, se.y, ne.y));
			max.set(Math.max(max.x, nw.x, sw.x, se.x, ne.x), Math.max(max.y, nw.y, sw.y, se.y, ne.y));
		}

		this.x = min.x;
		this.y = min.y;

		const size = max.substract(min);

		this.center.set((min.x + size.x) / 2, (min.y + size.y) / 2);

		this.width = size.x;
		this.height = size.y;
	}

	get center(): Vector {
		return Vector.from(this.x + this.width / 2, this.y + this.height / 2);
	}

	get rotated() {
		return this.angle !== 0;
	}

	get vertices(): Vector[] {
		return [
			Vector.from(this.x, this.y),
			Vector.from(this.x, this.y + this.height),
			Vector.from(this.x + this.width, this.y + this.height),
			Vector.from(this.x + this.width, this.y)
		];
	}

	draw(c: CanvasRenderingContext2D, angle: number = 0, dashed: boolean = false) {
		c.lineWidth = 4;
		const center = this.center;

		const offset = SIZE / 2;

		const rotated = angle !== 0;

		if (rotated) {
			c.save();

			c.strokeStyle = '#0b99ff';
			c.fillStyle = 'white';

			const [nw, sw, se, ne] = [
				Vector.from(-this.width / 2, -this.height / 2),
				Vector.from(-this.width / 2, this.height / 2),
				Vector.from(this.width / 2, this.height / 2),
				Vector.from(this.width / 2, -this.height / 2)
			];

			const pivot = Vector.from(0, -this.height / 2 - 40);

			c.translate(center.x, center.y);

			c.rotate(angle);

			c.strokeRect(nw.x - offset, nw.y - offset, this.width + offset * 2, this.height + offset * 2);

			c.setLineDash([0, 0]);

			c.strokeRect(nw.x - SIZE, nw.y - SIZE, SIZE, SIZE);
			c.strokeRect(sw.x - SIZE, sw.y, SIZE, SIZE);
			c.strokeRect(se.x, se.y, SIZE, SIZE);
			c.strokeRect(ne.x, ne.y - SIZE, SIZE, SIZE);

			c.fillRect(nw.x - SIZE, nw.y - SIZE, SIZE, SIZE);
			c.fillRect(sw.x - SIZE, sw.y, SIZE, SIZE);
			c.fillRect(se.x, se.y, SIZE, SIZE);
			c.fillRect(ne.x, ne.y - SIZE, SIZE, SIZE);

			c.beginPath();
			c.arc(pivot.x, pivot.y, 8, 0, 2 * Math.PI);
			c.fill();
			c.closePath();

			c.beginPath();
			c.arc(pivot.x, pivot.y, 8, 0, 2 * Math.PI);
			c.stroke();
			c.closePath();

			c.restore();

			return;
		}

		const [nw, sw, se, ne] = this.vertices;

		const pivot = Vector.from(center.x, this.y - 40);

		c.save();
		c.strokeStyle = '#0b99ff';

		if (dashed) c.setLineDash([10, 10]);

		c.strokeRect(
			this.x - offset,
			this.y - offset,
			this.width + offset * 2,
			this.height + offset * 2
		);

		c.fillStyle = 'white';

		c.setLineDash([0, 0]);

		c.beginPath();
		c.arc(pivot.x, pivot.y, 8, 0, 2 * Math.PI);
		c.fill();
		c.closePath();
		c.beginPath();
		c.arc(pivot.x, pivot.y, 8, 0, 2 * Math.PI);
		c.stroke();
		c.closePath();

		c.strokeRect(nw.x - SIZE, nw.y - SIZE, SIZE, SIZE);
		c.strokeRect(sw.x - SIZE, sw.y, SIZE, SIZE);
		c.strokeRect(se.x, se.y, SIZE, SIZE);
		c.strokeRect(ne.x, ne.y - SIZE, SIZE, SIZE);

		c.fillRect(nw.x - SIZE, nw.y - SIZE, SIZE, SIZE);
		c.fillRect(sw.x - SIZE, sw.y, SIZE, SIZE);
		c.fillRect(se.x, se.y, SIZE, SIZE);
		c.fillRect(ne.x, ne.y - SIZE, SIZE, SIZE);

		c.restore();
	}
}

export class Gizmo {
	targets: Shape[] = [];

	boundary: BoundingBox = new BoundingBox();

	angle: number = 0;

	anchor: Vector = Vector.zero();

	attach(found: Shape[]) {
		this.targets = found;
		this.boundary.update(found);

		if (found.length > 1) {
			this.angle = 0;
		} else {
			const [target] = this.targets;
			this.angle = target.angle;
		}

		return this;
	}

	get center(): Vector {
		return this.boundary.center;
	}

	clear() {
		this.targets = [];
		this.boundary.update([]);
	}

	contains(v: Vector): boolean {
		const boundary = this.boundary;
		const center = boundary.center;

		const p = v.clone().rotate(center.x, center.y, -this.angle);

		return (
			p.x >= boundary.x + OFFSET &&
			p.x <= boundary.x + boundary.width - OFFSET &&
			p.y >= boundary.y + OFFSET &&
			p.y <= boundary.y + boundary.height - OFFSET
		);
	}

	intersects(v: Vector) {
		const boundary = this.boundary;
		const center = boundary.center;

		const p = v.clone().rotate(center.x, center.y, -this.angle);

		return !(
			p.x < boundary.x - OFFSET * 2 ||
			p.x > boundary.x + boundary.width + OFFSET * 2 ||
			p.y < boundary.y - OFFSET * 2 ||
			p.y > boundary.y + boundary.height + OFFSET * 2
		);
	}

	offset(v: Vector) {
		this.targets.forEach((target) => target.set_offset(v));
	}

	rotate(angle: number) {
		if (this.targets.length > 1) {
			this.targets.forEach((target) => {
				target.rotate(angle);
			});
		} else {
			const [target] = this.targets;
			target.rotate(angle);
			this.angle = target.angle;
		}

		this.boundary.update(this.targets);

		return this;
	}

	adjust(direction: Direction, last: Vector, mouse: Vector) {
		const should_maintain_aspect_ration = this.targets.some((target) => target.angle !== 0);

		if (this.targets.length > 1) {
			this.targets.forEach((target) => {
				const [nw, se] = target.reference;

				const factor_x = (mouse.x - this.anchor.x) / (last.x - this.anchor.x);
				const factor_y = (mouse.y - this.anchor.y) / (last.y - this.anchor.y);

				let scale = Math.max(factor_x, factor_y);

				let x: number;
				let y: number;
				let width: number;
				let height: number;

				if (should_maintain_aspect_ration) {
					if (direction === 'east' || direction === 'west') {
						scale = factor_x;
					}

					if (direction === 'north' || direction === 'south') {
						scale = factor_y;
					}

					x = (nw.x - this.anchor.x) * scale + this.anchor.x;
					y = (nw.y - this.anchor.y) * scale + this.anchor.y;
					width = (se.x - nw.x) * scale;
					height = (se.y - nw.y) * scale;

					target.move(Vector.from(x, y));
					target.resize(width, height);

					return;
				}

				x = (nw.x - this.anchor.x) * factor_x + this.anchor.x;
				y = (nw.y - this.anchor.y) * factor_y + this.anchor.y;
				width = (se.x - nw.x) * factor_x;
				height = (se.y - nw.y) * factor_y;

				switch (direction) {
					case 'east':
					case 'west':
						target.move(Vector.from(x, nw.y));
						target.resize(width, se.y - nw.y);
						break;

					case 'north':
					case 'south':
						target.move(Vector.from(nw.x, y));
						target.resize(se.x - nw.x, height);
						break;

					case 'nor-west':
					case 'nor-east':
					case 'south-west':
					case 'south-east':
						target.move(Vector.from(x, y));
						target.resize(width, height);

						break;
				}

				target.normalize();
			});
		} else {
			const [target] = this.targets;
			target.adjust(direction, mouse.clone());
		}

		this.boundary.update(this.targets);

		return this;
	}

	move(v: Vector) {
		this.targets.forEach((target) => {
			target.move(v.clone().substract(target.offset));
		});

		this.boundary.update(this.targets);

		return this;
	}

	prepare_to_resize(v: Vector) {
		this.set_anchor(v);

		this.targets.forEach((target) => {
			const [nw, , se] = target.vertices;
			target.reference = [nw, se];
		});
	}

	intersectaion_rotation_pivot(v: Vector) {
		const center = this.boundary.center;

		const pivot = Vector.from(center.x, this.boundary.y - 40);

		const rotated = v.clone().rotate(center.x, center.y, -this.angle);

		const dx = pivot.x - rotated.x;
		const dy = pivot.y - rotated.y;

		const distance = Math.hypot(dx, dy);

		return distance < 16;
	}

	private set_anchor(v: Vector) {
		const boundary = this.boundary;

		const side = this.find_handle_under_cursor(v);

		const should_maintain_aspect_ration = this.targets.some((target) => target.angle !== 0);

		if (!should_maintain_aspect_ration) {
			switch (side) {
				case 'east':
					this.anchor.set(boundary.x, boundary.y);
					break;
				case 'west':
					this.anchor.set(boundary.x + boundary.width, boundary.y);
					break;
				case 'south':
					this.anchor.set(boundary.x, boundary.y);
					break;
				case 'north':
					this.anchor.set(boundary.x, boundary.y + boundary.height);
					break;
				case 'south-east':
					this.anchor.set(boundary.x, boundary.y);
					break;
				case 'south-west':
					this.anchor.set(boundary.x + boundary.width, boundary.y);
					break;
				case 'nor-west':
					this.anchor.set(boundary.x + boundary.width, boundary.y + boundary.height);
					break;
				case 'nor-east':
					this.anchor.set(boundary.x, boundary.y + boundary.height);
					break;
			}

			return;
		}

		switch (side) {
			case 'south-west':
				this.anchor.set(boundary.x + boundary.width, boundary.y);
				break;
			case 'nor-west':
				this.anchor.set(boundary.x + boundary.width, boundary.y + boundary.height);
				break;
			case 'nor-east':
				this.anchor.set(boundary.x, boundary.y + boundary.height);
				break;
			case 'south-east':
				this.anchor.set(boundary.x, boundary.y);
				break;
			case 'east':
				this.anchor.set(boundary.x, boundary.y + boundary.height / 2);
				break;
			case 'west':
				this.anchor.set(boundary.x + boundary.width, boundary.y + boundary.height / 2);
				break;
			case 'north':
				this.anchor.set(boundary.x + boundary.width / 2, boundary.y + boundary.height);
				break;
			case 'south':
				this.anchor.set(boundary.x + boundary.width / 2, boundary.y);
				break;
		}
	}

	find_handle_under_cursor(v: Vector): Direction | null {
		const center = this.boundary.center;

		const rotated = v.clone().rotate(center.x, center.y, -this.angle);

		const vertices = this.boundary.vertices;

		for (let i = 0; i < vertices.length; i++) {
			const vertice = vertices[i];

			const dx = vertice.x - rotated.x;
			const dy = vertice.y - rotated.y;

			const distance = Math.hypot(dx, dy);

			if (distance <= THREESHOLD) {
				return CORNERS[i];
			}
		}

		const [nw, sw, se, ne] = vertices;

		const segments: Vector[][] = [
			[nw, ne],
			[sw, se],
			[nw, sw],
			[ne, se]
		];

		for (let i = 0; i < segments.length; i++) {
			const [a, b] = segments[i];

			const p = project_point_on_segment(rotated, a, b);

			const dx = p.x - rotated.x;
			const dy = p.y - rotated.y;

			const distance = Math.hypot(dx, dy);

			if (distance <= THREESHOLD) {
				return EDGES[i];
			}
		}

		return null;
	}

	draw(c: CanvasRenderingContext2D) {
		this.boundary.draw(c, this.angle, this.targets.length > 1);
		return this;
	}

	get empty(): boolean {
		return !this.targets.length;
	}
}
