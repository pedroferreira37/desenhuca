import type { Direction, DrawOptions, GizmoHistoryEntry, Shape } from '$lib/types';
import { Vector } from '$lib/math/vector';
import { BoundingBox } from './bounding-box';
import {
	calculateScaleFactor,
	calculateScaledDimensions,
	isDistanceClose,
	projectPointOnSegment
} from '$lib/util/util';

const OFFSET = 12;

const CORNERS: Direction[] = ['nor-west', 'south-west', 'south-east', 'nor-east'];
const EDGES: Direction[] = ['north', 'south', 'west', 'east'];

export class Gizmo {
	targets: Shape[] = [];

	boundary: BoundingBox = new BoundingBox();

	angle: number = 0;

	anchor: Vector = Vector.zero();

	history: Map<string, GizmoHistoryEntry> = new Map();

	save() {
		this.targets.forEach((target) => {
			this.history.set(target.id, {
				center: this.center,
				vertices: target.vertices,
				displacement: target.center.substract(this.center),
				angle: target.angle
			});
		});
	}

	add(found: Shape[]) {
		this.targets = found;
		this.boundary.update(found);

		if (found.length > 1) {
			this.angle = 0;
			return;
		}

		const [target] = this.targets;
		this.angle = target.angle;
	}

	get center(): Vector {
		return this.boundary.center;
	}

	clear() {
		this.history.clear();
		this.targets = [];
		this.boundary.reset();
	}

	contains(v: Vector): boolean {
		const boundary = this.boundary;
		const center = boundary.center;

		const p = v.rotate(center.x, center.y, -this.angle);

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

		const p = v.rotate(center.x, center.y, -this.angle);

		return !(
			p.x < boundary.x - OFFSET * 2 ||
			p.x > boundary.x + boundary.width + OFFSET * 2 ||
			p.y < boundary.y - OFFSET * 2 ||
			p.y > boundary.y + boundary.height + OFFSET * 2
		);
	}

	offset(v: Vector) {
		this.targets.forEach((target) => {
			const nw = target.vertices[0];
			target.offset.set(v.x - nw.x, v.y - nw.y);
		});
	}

	rotate(angle: number) {
		if (this.targets.length > 1) {
			this.targets.forEach((target) => {
				const history = this.history.get(target.id);

				if (!history) return;

				const displacement = history.displacement;
				const center = history.center;
				const vertices = history.vertices;

				const width = Math.abs(vertices[0].x - vertices[2].x);
				const height = Math.abs(vertices[0].y - vertices[2].y);

				const cos = Math.cos(angle);
				const sin = Math.sin(angle);

				const pos = Vector.from(
					center.x + cos * displacement.x - sin * displacement.y - width / 2,
					center.y + sin * displacement.x + cos * displacement.y - height / 2
				);

				target.move(pos);

				target.angle = history.angle + angle;
			});
		} else {
			const [target] = this.targets;

			const history = this.history.get(target.id);

			if (!history) return;

			target.rotate(history.angle + angle);
			this.angle = target.angle;
		}

		this.boundary.update(this.targets);
	}

	adjust(direction: Direction, previous: Vector, current: Vector) {
		const keepAspectRatio = this.targets.some((target) => target.angle !== 0);

		// TODO: we should refactor this to make a little better. Later we do it.

		if (this.targets.length > 1) {
			this.targets.forEach((target) => {
				const history = this.history.get(target.id);

				if (!history) return;

				const [nw, _, se] = history.vertices;

				const factor = calculateScaleFactor(current, previous, this.anchor);

				let scale = Math.max(factor.x, factor.y);

				let x: number;
				let y: number;
				let width: number;
				let height: number;

				if (keepAspectRatio) {
					if (direction === 'east' || direction === 'west') {
						scale = factor.x;
					}

					if (direction === 'north' || direction === 'south') {
						scale = factor.y;
					}

					const dimensions = calculateScaledDimensions(
						nw,
						se,
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

					const pos = Vector.from(x, y);

					target.move(pos);
					target.resize(width, height);

					return;
				}

				const dimensions = calculateScaledDimensions(nw, se, this.anchor, factor);

				x = dimensions.x;
				y = dimensions.y;
				width = dimensions.width;
				height = dimensions.height;

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
			target.adjust(direction, current);
		}

		this.boundary.update(this.targets);
	}

	move(mouse: Vector) {
		this.targets.forEach((target) => {
			target.move(mouse.substract(target.offset));
		});

		this.boundary.update(this.targets);
	}

	intersectsRotationPivot(v: Vector) {
		const pivot = Vector.from(this.boundary.center.x, this.boundary.y - 40);

		const unrotated = v.rotate(this.boundary.center.x, this.boundary.center.y, -this.angle);

		return isDistanceClose(pivot, unrotated, 20);
	}

	normalize() {
		this.targets.forEach((target) => target.normalize());
	}

	setAnchor(v: Vector) {
		const boundary = this.boundary;

		const side = this.getHandleUnderCursor(v);

		const keepAspectRatio = this.targets.some((target) => target.angle !== 0);

		if (!keepAspectRatio) {
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

	getHandleUnderCursor(v: Vector): Direction | null {
		const center = this.boundary.center;

		const unrotated = v.rotate(center.x, center.y, -this.angle);

		const vertices = this.boundary.vertices;

		const threeshold = 20;

		for (let i = 0; i < vertices.length; i++) {
			const vertice = vertices[i];

			if (isDistanceClose(vertice, unrotated, threeshold)) {
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

			const p = projectPointOnSegment(unrotated, a, b);

			if (isDistanceClose(p, unrotated, threeshold)) {
				return EDGES[i];
			}
		}

		return null;
	}

	draw(c: CanvasRenderingContext2D) {
		c.save();
		this.boundary.draw(c, this.angle);
		c.restore();
	}

	get empty(): boolean {
		return !this.targets.length;
	}
}
