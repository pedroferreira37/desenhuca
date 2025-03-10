import type { Direction, DrawOptions, Shape } from '$lib/types';
import { Vector } from '$lib/math/vector';
import { BoundingBox } from './bounding-box';
import {
	calculate_scale_factor,
	calculate_scaled_dimensions,
	is_within_distance,
	project_point_on_segment
} from '$lib/util/util';

const OFFSET = 12;

const CORNERS: Direction[] = ['nor-west', 'south-west', 'south-east', 'nor-east'];
const EDGES: Direction[] = ['north', 'south', 'west', 'east'];

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
	}

	adjust(direction: Direction, previous: Vector, current: Vector) {
		const should_maintain_aspect_ratio = this.targets.some((target) => target.angle !== 0);

		if (this.targets.length > 1) {
			this.targets.forEach((target) => {
				const [top_left, bottom_right] = target.reference;

				const factor = calculate_scale_factor(current, previous, this.anchor);

				let scale = Math.max(factor.x, factor.y);

				let x: number;
				let y: number;
				let width: number;
				let height: number;

				if (should_maintain_aspect_ratio) {
					if (direction === 'east' || direction === 'west') {
						scale = factor.x;
					}

					if (direction === 'north' || direction === 'south') {
						scale = factor.y;
					}

					const dimensions = calculate_scaled_dimensions(
						top_left,
						bottom_right,
						this.anchor,
						Vector.from(scale, scale)
						/* We pass a new vector using the same scale for x and y
                          because there are rotated elements in the gizmo.
                        */
					);

					x = dimensions.x;
					y = dimensions.y;
					width = dimensions.width;
					height = dimensions.height;

					target.move(Vector.from(x, y));
					target.resize(width, height);

					return;
				}

				const dimensions = calculate_scaled_dimensions(top_left, bottom_right, this.anchor, factor);

				x = dimensions.x;
				y = dimensions.y;
				width = dimensions.width;
				height = dimensions.height;

				switch (direction) {
					case 'east':
					case 'west':
						target.move(Vector.from(x, top_left.y));
						target.resize(width, bottom_right.y - top_left.y);
						break;

					case 'north':
					case 'south':
						target.move(Vector.from(top_left.x, y));
						target.resize(bottom_right.x - top_left.x, height);
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
			target.adjust(direction, current.clone());
		}

		this.boundary.update(this.targets);
	}

	move(v: Vector) {
		this.targets.forEach((target) => {
			target.move(v.clone().substract(target.offset));
		});

		this.boundary.update(this.targets);
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

		const unrotated = v.clone().rotate(center.x, center.y, -this.angle);

		return is_within_distance(pivot, unrotated, 20);
	}

	normalize() {
		this.targets.forEach((target) => target.normalize());
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

		const unrotated = v.clone().rotate(center.x, center.y, -this.angle);

		const vertices = this.boundary.vertices;

		const threeshold = 20;

		for (let i = 0; i < vertices.length; i++) {
			const vertice = vertices[i];

			if (is_within_distance(vertice, unrotated, threeshold)) {
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

			const p = project_point_on_segment(unrotated, a, b);

			if (is_within_distance(p, unrotated, threeshold)) {
				return EDGES[i];
			}
		}

		return null;
	}

	draw(c: CanvasRenderingContext2D) {
		this.boundary.draw(c, this.angle, this.targets.length > 1);
	}

	get empty(): boolean {
		return !this.targets.length;
	}
}
