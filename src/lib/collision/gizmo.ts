import type { BoundingBox, Handle, DrawOptions, Shape } from '$lib/types';
import { Vector } from '$lib/math/vector';

import { get_scale_factor, is_distance_close, project_point_on_segment } from '$lib/util/util';
import type { RoughCanvas } from 'roughjs/bin/canvas';
import { RectangularBoundingBox } from './rectangular-bounding-box';

export class Gizmo {
	targets: Shape[] = [];

	boundary: BoundingBox = new RectangularBoundingBox();

	angle: number = 0;

	anchor: Vector = Vector.zero();

	save() {
		this.targets.forEach((target) => {
			// Probably we will need to use save later, but we keep for now.
			target.save({
				center: this.center,
				displacement: target.center.substract(this.center),
				angle: target.angle,
				vertices:
					target.type === 'segment'
						? [target.vertices[0], target.vertices[1]]
						: [target.vertices[0], target.vertices[2]]
			});
		});
	}

	add(found: Shape[]) {
		this.targets = found;

		if (!this.targets.length) return;

		this.boundary = RectangularBoundingBox.create(this.targets);

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

			target.rotate(angle);

			this.boundary = target.AABB;

			return;
		}

		this.targets.forEach((target) => {
			const history = target.history;

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
			target.rotate(angle);
		});

		this.boundary = RectangularBoundingBox.create(this.targets);
	}

	get_handle_under_cursor(v: Vector): Handle | null {
		return this.boundary.get_handle_under_cursor(v);
	}

	adjust(handle: Handle, prev_mouse: Vector, mouse: Vector) {
		const keep_aspect_ratio = this.targets.some((target) => target.angle !== 0);

		if (this.targets.length > 1) {
			this.targets.forEach((target) => {
				const factor = get_scale_factor(
					handle,
					mouse,
					prev_mouse,
					target.anchor,
					keep_aspect_ratio
				);

				target.resize_as_group_context(handle, factor, keep_aspect_ratio);
				target.normalize();
			});

			this.boundary = RectangularBoundingBox.create(this.targets);

			return;
		}

		const [target] = this.targets;
		target.adjust(handle, mouse);
		this.boundary = target.AABB;
	}

	move(mouse: Vector) {
		if (this.targets.length > 1) {
			this.targets.forEach((target) => {
				target.move(mouse.substract(target.offset));
			});

			this.boundary = RectangularBoundingBox.create(this.targets);

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
		if (this.targets.length <= 1) return;

		const x = this.boundary.x;
		const y = this.boundary.y;
		const width = this.boundary.width;
		const height = this.boundary.height;

		const handle = this.boundary.get_handle_under_cursor(v);

		const keep_aspect_ratio = this.targets.some((target) => target.angle !== 0);

		const anchor = Vector.zero();

		if (!keep_aspect_ratio) {
			switch (handle) {
				case 'east':
					anchor.set(x, y);
					break;
				case 'west':
					anchor.set(x + width, y);
					break;
				case 'south':
					anchor.set(x, y);
					break;
				case 'north':
					anchor.set(x, y + height);
					break;
				case 'south-east':
					anchor.set(x, y);
					break;
				case 'south-west':
					anchor.set(x + width, y);
					break;
				case 'nor-west':
					anchor.set(x + width, y + height);
					break;
				case 'nor-east':
					anchor.set(x, y + height);
					break;
			}
		} else {
			switch (handle) {
				case 'south-west':
					anchor.set(x + width, y);
					break;
				case 'nor-west':
					anchor.set(x + width, y + height);
					break;
				case 'nor-east':
					anchor.set(x, y + height);
					break;
				case 'south-east':
					anchor.set(x, y);
					break;
				case 'east':
					anchor.set(x, y + height / 2);
					break;
				case 'west':
					anchor.set(x + width, y + height / 2);
					break;
				case 'north':
					anchor.set(x + width / 2, y + height);
					break;
				case 'south':
					anchor.set(x + width / 2, y);
					break;
			}
		}

		this.targets.forEach((target) => target.anchor.set(anchor.x, anchor.y));
	}

	draw(c: CanvasRenderingContext2D, r: RoughCanvas) {
		if (!this.targets.length) return;

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
