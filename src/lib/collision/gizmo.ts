import type { BoundingBox, Direction, DrawOptions, GizmoHistoryEntry, Shape } from '$lib/types';
import { Vector } from '$lib/math/vector';

import {
	calculate_scale_factor,
	calculate_scaled_dimensions,
	create_rectangular_bounding_box,
	is_distance_close,
	project_point_on_segment
} from '$lib/util/util';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import { RectangularBoundingBox } from './rectangular-bounding-box';
import create from '$lib/shape-factory';

const OFFSET = 12;

export class Gizmo {
	targets: Shape[] = [];

	boundary: BoundingBox = new RectangularBoundingBox();

	angle: number = 0;

	anchor: Vector = Vector.zero();

	history: Map<string, GizmoHistoryEntry> = new Map();

	save() {
		this.targets.forEach((target) => {
			this.history.set(target.id, {
				center: this.center,
				vertices: [
					target.vertices[0],
					// temporary fix for segment
					target.type === 'segment' ? target.vertices[1] : target.vertices[2]
				],
				displacement: target.center.substract(this.center),
				angle: target.angle
			});
		});
	}

	add(found: Shape[]) {
		this.targets = found;

		if (!this.targets.length) return;

		this.boundary = create_rectangular_bounding_box(this.targets);

		if (found.length > 1) {
			this.angle = 0;
			return;
		}

		const [target] = this.targets;
		this.angle = target.angle;
		this.boundary = target.AABB;
	}

	get center(): Vector {
		return this.boundary.center;
	}

	clear() {
		this.history.clear();
		this.targets.forEach((target) => (target.selected = false));
		this.targets = [];
		this.boundary.clear();
	}

	offset(v: Vector) {
		this.targets.forEach((target) => {
			const nw = target.vertices[0];
			const offset = v.substract(nw);
			target.offset.set(offset.x, offset.y);
		});
	}

	contains(v: Vector): boolean {
		return this.boundary.contains(v);
	}

	intersects(v: Vector): boolean {
		return this.boundary.intersects(v);
	}

	intersects_rotate_handle(v: Vector) {
		return this.boundary.intersects_rotate_handle(v);
	}

	rotate(angle: number) {
		if (!this.targets.length) return;

		if (this.targets.length === 1) {
			const [target] = this.targets;

			const history = this.history.get(target.id);

			if (!history) return;

			target.rotate(history.angle + angle);

			this.boundary = target.AABB;

			return;
		}

		this.targets.forEach((target) => {
			const history = this.history.get(target.id);

			if (!history) return;

			const displacement = history.displacement;
			const center = history.center;
			const vertices = history.vertices;

			const width = Math.abs(vertices[0].x - vertices[1].x);
			const height = Math.abs(vertices[0].y - vertices[1].y);

			const cos = Math.cos(angle);
			const sin = Math.sin(angle);

			const pos = Vector.from(
				center.x + cos * displacement.x - sin * displacement.y - width / 2,
				center.y + sin * displacement.x + cos * displacement.y - height / 2
			);

			target.move(pos);
			target.rotate(history.angle + angle);
		});

		this.boundary = create_rectangular_bounding_box(this.targets);
	}

	get_handle_under_cursor(v: Vector): Direction | null {
		return this.boundary.get_handle_under_cursor(v);
	}

	adjust(direction: Direction, prev_mouse: Vector, mouse: Vector) {
		const keep_aspect_ratio = this.targets.some((target) => target.angle !== 0);

		// TODO: we should refactor this to make a little better. Later we do it.

		if (this.targets.length > 1) {
			this.targets.forEach((target) => {
				const history = this.history.get(target.id);

				if (!history) return;

				const [nw, se] = history.vertices;

				const factor = calculate_scale_factor(mouse, prev_mouse, this.anchor);

				let scale = Math.max(factor.x, factor.y);

				if (keep_aspect_ratio) {
					if (direction === 'east' || direction === 'west') {
						scale = factor.x;
					}

					if (direction === 'north' || direction === 'south') {
						scale = factor.y;
					}

					const dimensions = calculate_scaled_dimensions(
						nw,
						se,
						this.anchor,
						Vector.from(scale, scale)
						/* We pass a new vector using the same scale for x and y
                          because there are rotated elements in the gizmo.
                        */
					);

					const x = dimensions.x;
					const y = dimensions.y;
					const width = dimensions.width;
					const height = dimensions.height;

					if (target.type === 'segment') {
						const x = (nw.x - this.anchor.x) * scale + this.anchor.x;
						const y = (nw.y - this.anchor.y) * scale + this.anchor.y;
						const x1 = (se.x - this.anchor.x) * scale + this.anchor.x;
						const y1 = (se.y - this.anchor.y) * scale + this.anchor.y;

						target.x = x;
						target.y = y;
						target.x1 = x1;
						target.y1 = y1;
						return;
					}

					const pos = Vector.from(x, y);

					target.move(pos);
					target.resize(width, height);

					return;
				}

				const dimensions = calculate_scaled_dimensions(nw, se, this.anchor, factor);

				const x = dimensions.x;
				const y = dimensions.y;
				const width = dimensions.width;
				const height = dimensions.height;

				switch (direction) {
					case 'east':
					case 'west':
						if (target.type === 'segment') {
							target.x = (nw.x - this.anchor.x) * factor.x + this.anchor.x;
							target.x1 = (se.x - this.anchor.x) * factor.x + this.anchor.x;
							return;
						}

						target.move(Vector.from(x, nw.y));
						target.resize(width, se.y - nw.y);
						break;

					case 'north':
					case 'south':
						if (target.type === 'segment') {
							target.y = (nw.y - this.anchor.y) * factor.y + this.anchor.y;
							target.y1 = (se.y - this.anchor.y) * factor.y + this.anchor.y;
							return;
						}

						target.move(Vector.from(nw.x, y));
						target.resize(se.x - nw.x, height);
						break;

					case 'nor-west':
					case 'nor-east':
					case 'south-west':
					case 'south-east':
						if (target.type === 'segment') {
							const x = (nw.x - this.anchor.x) * factor.x + this.anchor.x;
							const y = (nw.y - this.anchor.y) * factor.y + this.anchor.y;
							const x1 = (se.x - this.anchor.x) * factor.x + this.anchor.x;
							const y1 = (se.y - this.anchor.y) * factor.y + this.anchor.y;

							target.x = x;
							target.y = y;
							target.x1 = x1;
							target.y1 = y1;
							return;
						}

						target.move(Vector.from(x, y));
						target.resize(width, height);

						break;
				}

				target.normalize();
			});

			this.boundary = create_rectangular_bounding_box(this.targets);

			return;
		}

		const [target] = this.targets;
		target.adjust(direction, mouse);
		this.boundary = target.AABB;
	}

	move(mouse: Vector) {
		if (this.targets.length > 1) {
			this.targets.forEach((target) => {
				target.move(mouse.substract(target.offset));
			});

			this.boundary = create_rectangular_bounding_box(this.targets);

			return;
		}

		const [target] = this.targets;
		target.move(mouse.substract(target.offset));
		this.boundary = target.AABB;
	}

	normalize() {
		this.targets.forEach((target) => target.normalize());
	}

	set_anchor(v: Vector) {
		if (this.targets.length < 2) return;

		const [nw, , se] = this.boundary.vertices;

		const x = nw.x;
		const y = nw.y;
		const width = se.x - nw.x;
		const height = se.y - nw.y;

		const side = this.boundary.get_handle_under_cursor(v);

		const keep_aspect_ratio = this.targets.some((target) => target.angle !== 0);

		if (!keep_aspect_ratio) {
			switch (side) {
				case 'east':
					this.anchor.set(x, y);
					break;
				case 'west':
					this.anchor.set(x + width, y);
					break;
				case 'south':
					this.anchor.set(x, y);
					break;
				case 'north':
					this.anchor.set(x, y + height);
					break;
				case 'south-east':
					this.anchor.set(x, y);
					break;
				case 'south-west':
					this.anchor.set(x + width, y);
					break;
				case 'nor-west':
					this.anchor.set(x + width, y + height);
					break;
				case 'nor-east':
					this.anchor.set(x, y + height);
					break;
			}

			return;
		}

		switch (side) {
			case 'south-west':
				this.anchor.set(x + width, y);
				break;
			case 'nor-west':
				this.anchor.set(x + width, y + height);
				break;
			case 'nor-east':
				this.anchor.set(x, y + height);
				break;
			case 'south-east':
				this.anchor.set(x, y);
				break;
			case 'east':
				this.anchor.set(x, y + height / 2);
				break;
			case 'west':
				this.anchor.set(x + width, y + height / 2);
				break;
			case 'north':
				this.anchor.set(x + width / 2, y + height);
				break;
			case 'south':
				this.anchor.set(x + width / 2, y);
				break;
		}
	}

	draw(c: CanvasRenderingContext2D, r: RoughCanvas) {
		if (this.targets.length > 1) {
			this.boundary.draw(c);
			return;
		}

		const [target] = this.targets;
		target.draw(c, r);
		target.AABB.draw(c);
	}

	get empty(): boolean {
		return !this.targets.length;
	}
}
