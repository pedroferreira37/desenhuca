<script lang="ts">
	import { AABB, QuadTree } from '$lib/qtree';
	import type { Shape, Tool, Cursor, PointerMode, Direction } from '$lib/types';
	import roughCanvas from 'roughjs';
	import { RoughCanvas } from 'roughjs/bin/canvas';
	import { BoundingBox } from '$lib/selection-box.svelte';
	import { update_anchor_pos } from '$lib/util';
	import type { Options } from 'roughjs/bin/core';
	import { create_shape } from '$lib/shape.svelte';
	import { Vector } from '$lib/math/vector';

	const CursorStylesVariants: Record<Direction, Cursor> = {
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
		pointer_mode: PointerMode;
		cursor: Cursor;
		drawing: boolean;
		selecting: boolean;
		draw: () => void;
		select: () => void;
		drag: () => void;
		defer: () => void;
		resize: () => void;
	};

	let {
		tool,
		pointer_mode,
		cursor = $bindable(),
		resize,
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

	let shapes = $state<Shape[]>([]);
	let shape = $state<Shape | null>(null);
	let found = $state<Shape[]>([]);

	let orig_pointer = $state<Vector>(new Vector(0, 0));

	let anchor = $state<Vector>(new Vector(0, 0));

	let base_options = $state<Options>({
		seed: 5,
		roughness: 3,
		strokeWidth: 5
	});

	const box = new BoundingBox({
		stroke: 'rgba(137, 196, 244, 1)',
		strokeWidth: 4,
		seed: 1,
		roughness: 4
	});

	function refresh() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		shapes.forEach((shape) => shape.draw(rough));
	}

	function onpointerdown(event: PointerEvent) {
		orig_pointer = new Vector(event.offsetX * devicePixelRatio, event.offsetY * devicePixelRatio);

		found = [];

		switch (tool) {
			case 'pointer':
				if (!box.is_empty()) {
					if (box.contains(orig_pointer)) {
						box.update_items_offset(orig_pointer);
						drag();
						return;
					}

					if (box.intersects(orig_pointer)) {
						box.capture_snapshot();
						update_anchor_pos(orig_pointer, anchor, box);
						resize();
						return;
					}
				}

				refresh();
				select();

				box.clear();

				qtree.query_at(orig_pointer, found);

				const [target] = found;

				if (target) {
					box.keep(target);
					box.draw(rough);
					return;
				}

				cursor = 'default';
				pointer_mode = 'select';
				break;
			case 'rectangle':
			case 'ellipse':
			case 'segment':
				draw();
				box.clear();
				shape = create_shape(tool, orig_pointer.x, orig_pointer.y, 0, 0, base_options);

				break;
		}
	}

	function onpointermove(event: PointerEvent) {
		requestAnimationFrame(() => {
			const pointer = new Vector(
				event.offsetX * devicePixelRatio,
				event.offsetY * devicePixelRatio
			);

			const query_result: Shape[] = [];

			switch (tool) {
				case 'pointer':
					switch (pointer_mode) {
						case 'select':
							refresh();
							box.clear();
							const [dx, dy] = pointer.substract(orig_pointer);
							const range = new AABB(orig_pointer.x, orig_pointer.y, dx, dy);
							qtree.query_in_range(range, query_result);
							query_result.forEach((result) => box.keep(result));
							box.draw(rough);
							break;
						case 'resize':
							refresh();
							box.resize(orig_pointer, pointer, anchor);
							box.draw(rough);
							break;
						case 'move':
							refresh();
							box.move(pointer);
							box.draw(rough);
							break;
						default:
							if (box.is_empty()) {
								cursor = qtree.has(pointer) ? 'move' : 'default';
								return;
							}

							if (box.contains(pointer)) {
								cursor = 'move';
							} else {
								cursor = CursorStylesVariants[box.find_pointer_side(pointer)];
							}
							break;
					}
				case 'rectangle':
				case 'ellipse':
				case 'segment':
					if (shape) {
						refresh();
						const [a] = shape.points;
						const [dx, dy] = pointer.substract(a);
						shape.resize(dx, dy);
						shape.draw(rough);
						shapes.push(shape);
					}
					break;
			}
		});
	}

	function onpointerup() {
		defer();

		if (shape) {
			refresh();
			shape.draw(rough);
			shape.normalize();
			shapes.push(shape);
			qtree.insert(shape);
			box.keep(shape);
			box.draw(rough);
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
	height={window.innerHeight}
	class:cursor-move={cursor === 'move'}
	class:cursor-crosshair={cursor === 'crosshair'}
	class:cursor-default={cursor === 'default'}
	class:cursor-nwse-resize={cursor === 'nwse-resize'}
	class:cursor-nesw-resize={cursor === 'nesw-resize'}
	class:cursor-ew-resize={cursor === 'ew-resize'}
	class:cursor-ns-resize={cursor === 'ns-resize'}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
>
</canvas>
