<script lang="ts">
	import { QuadTree } from '$lib/collision/qtree';
	import { AABB } from '$lib/collision/aabb';
	import type { Shape, Tool, Cursor, PointerMode, Direction } from '$lib/types';
	import roughCanvas from 'roughjs';
	import { RoughCanvas } from 'roughjs/bin/canvas';
	import type { Options } from 'roughjs/bin/core';
	import { create_shape } from '$lib/shape';
	import { Vector } from '$lib/math/vector';
	import { BoundingBox } from '$lib/collision/bounding-box';
	import { compute_bounding_box, get_ptr_direction, update_anchor_pos } from '$lib/util/util';

	const CURSOR_STYLE_VARIANTS: Record<Direction, Cursor> = {
		west: 'ew-resize',
		east: 'ew-resize',
		north: 'ns-resize',
		south: 'ns-resize',
		'south-west': 'nesw-resize',
		'south-east': 'nwse-resize',
		'nor-west': 'nwse-resize',
		'nor-east': 'nesw-resize',
		none: 'default'
	};

	type Props = {
		tool: Tool;
		pointerMode: PointerMode;
		cursor: Cursor;
		drawing: boolean;
		selecting: boolean;
		draw: () => void;
		select: () => void;
		drag: () => void;
		defer: () => void;
		resize: () => void;
		rotate: () => void;
	};

	let {
		tool,
		pointerMode,
		cursor = $bindable(),
		resize,
		rotate,
		draw,
		select,
		drag,
		defer
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let rough: RoughCanvas;
	let qtree: QuadTree;

	const dpr = window.devicePixelRatio;

	let mouse = $state<Vector>(new Vector(0, 0));

	let shapes = $state<Shape[]>([]);
	let shape = $state<Shape | null>(null);
	let results = $state<Shape[]>([]);
	let bb: BoundingBox | null = null;

	let anchor: Vector = new Vector(0, 0);

	let ptr_direction: Direction | null = null;

	let default_options = $state<Options>({
		stroke: 'white',
		seed: 2,
		roughness: 4,
		strokeWidth: 4
	});

	function clean() {
		context.clearRect(0, 0, canvas.width, canvas.height);
	}

	function redraw() {
		shapes.forEach((shape) => shape.draw(context, rough));
	}

	function onpointerdown(event: PointerEvent) {
		mouse = new Vector(
			Math.floor(event.offsetX * devicePixelRatio),
			Math.floor(event.offsetY * devicePixelRatio)
		);

		switch (tool) {
			case 'pointer':
				if (bb) {
					if (bb.intersects_pivot(mouse)) {
						rotate();
						return;
					}

					if (bb.contains(mouse)) {
						for (const s of results) {
							s.update_offset(mouse.x, mouse.y);
						}

						drag();
						return;
					}

					if (bb.intersects(mouse)) {
						for (const s of results) {
							s.save();
						}

						update_anchor_pos(mouse, anchor, bb);

						ptr_direction = get_ptr_direction(mouse, bb);

						resize();
						return;
					}
				}

				clean();

				redraw();

				select();

				results = [];
				bb = null;

				qtree.query(
					{
						at: new Vector(mouse.x, mouse.y),
						range: null
					},
					results
				);

				const [target] = results;
				if (target) {
					bb = target.AABB;
					bb.draw(context);
				}

				cursor = 'default';
				pointerMode = 'select';
				break;
			case 'rectangle':
			case 'ellipse':
			case 'segment':
				bb = null;

				results = [];

				draw();

				shape = create_shape(tool, mouse.x, mouse.y, 0, 0, default_options);

				break;
		}
	}

	function onpointermove(event: PointerEvent) {
		requestAnimationFrame(() => {
			const pos = new Vector(
				Math.floor(event.offsetX * devicePixelRatio),
				Math.floor(event.offsetY * devicePixelRatio)
			);

			switch (tool) {
				case 'pointer':
					switch (pointerMode) {
						case 'select':
							results = [];

							clean();

							redraw();

							const size = pos.substract(mouse);

							const range = new AABB(mouse.x, mouse.y, size.x, size.y);

							range.normalize();

							qtree.query(
								{
									at: null,
									range
								},
								results
							);

							bb = compute_bounding_box(results);
							bb.draw(context, results.length > 1);
							break;
						case 'rotate':
							if (!bb) return;

							clean();

							const cx = bb.x + bb.width / 2;
							const cy = bb.y + bb.height / 2;

							const prev = Math.atan2(mouse.y - cy, mouse.x - cx);
							const cur = Math.atan2(pos.y - cy, pos.x - cx);
							const angle = cur - prev;

							mouse.set(pos.x, pos.y);

							results.forEach((s) => {
								s.rotate(angle);
							});

							redraw();

							bb = compute_bounding_box(results);
							bb?.draw(context, results.length > 1);

							break;
						case 'resize':
							clean();

							const scalar = pos.substract(anchor).divide(mouse.substract(anchor));

							for (const s of results) {
								const [nw, se] = s.history;

								const origin = nw.substract(anchor).multiply(scalar).sum(anchor);
								const size = se.substract(nw).multiply(scalar);

								switch (ptr_direction) {
									case 'east':
									case 'west':
										s.move(origin.x, nw.y);
										s.resize(size.x, se.substract(nw).y);
										s.draw(context, rough);
										break;
								}

								if (scalar.x < 0 || scalar.y < 0) s.normalize();
							}

							redraw();

							bb = compute_bounding_box(results);
							bb?.draw(context, results.length > 1);
							break;
						case 'move':
							clean();

							results.forEach((s) => {
								const dx = pos.x - s.offset.x;
								const dy = pos.y - s.offset.y;

								s.move(dx, dy);
							});

							redraw();

							bb = compute_bounding_box(results);
							bb?.draw(context, results.length > 1);

							break;
						default:
							if (!bb) {
								cursor = qtree.has(pos) ? 'move' : 'default';
								return;
							}

							if (bb?.intersects_pivot(pos)) {
								cursor = 'grab';
								return;
							}

							if (bb.contains(pos)) {
								cursor = 'move';
								return;
							}

							const ptr_dir = get_ptr_direction(pos, bb) || 'none';

							cursor = CURSOR_STYLE_VARIANTS[ptr_dir];
							break;
					}
				case 'rectangle':
				case 'ellipse':
				case 'segment':
					if (shape) {
						clean();
						redraw();
						const [nw] = shape.vertices;
						const size = pos.substract(nw);
						shape.resize(size.x, size.y);
						shape.draw(context, rough);
					}
					break;
			}
		});
	}

	function onpointerup() {
		defer();

		if (shape) {
			clean();
			redraw();

			shape.normalize();
			shape.draw(context, rough);

			bb = shape.AABB;
			bb.draw(context);

			shapes.push(shape);

			qtree.insert(shape);

			results = [shape];
		}

		cursor = 'default';

		shape = null;
	}

	function config() {
		context = canvas.getContext('2d') as CanvasRenderingContext2D;
		rough = roughCanvas.canvas(canvas);

		const rect = canvas.getBoundingClientRect();

		context.scale(dpr, dpr);

		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;

		canvas.style.width = `${rect.width}px`;
		canvas.style.height = `${rect.height}px`;

		const boundary = new AABB(0, 0, canvas.width, canvas.height);
		qtree = new QuadTree(boundary, 4);
	}

	$effect(config);
</script>

<!-- /* I dont know how to make this better on svelte If I put cursor in here It'll break my cursor */ -->
<canvas
	bind:this={canvas}
	width={window.innerWidth}
	class="bg-[#1e1e1e]"
	height={window.innerHeight}
	class:cursor-move={cursor === 'move'}
	class:cursor-crosshair={cursor === 'crosshair'}
	class:cursor-default={cursor === 'default'}
	class:cursor-nwse-resize={cursor === 'nwse-resize'}
	class:cursor-nesw-resize={cursor === 'nesw-resize'}
	class:cursor-ew-resize={cursor === 'ew-resize'}
	class:cursor-ns-resize={cursor === 'ns-resize'}
	class:cursor-grab={cursor === 'grab'}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
>
</canvas>
