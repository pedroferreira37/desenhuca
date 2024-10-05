<script lang="ts">
	import { create_shape } from '$lib/shape.svelte';
	import { AABB, QuadTree } from '$lib/qtree';
	import type { Shape, RoughOptions, Tools, CursorStyle } from '$lib/types';
	import roughCanvas from 'roughjs';
	import { RoughCanvas } from 'roughjs/bin/canvas';
	import type { RoughGenerator } from 'roughjs/bin/generator';
	import { BoundingBox } from '$lib/selection-box.svelte';
	import { INTERSECTION_SIDE } from '$lib/consts';

	type Props = {
		tool: Tools;
		behavior: 'select' | 'drag' | 'resize' | 'default';
		cursor_type: CursorStyle;
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
		behavior,
		cursor_type = $bindable(),
		selecting,
		drawing,
		resize,
		draw,
		select,
		drag,
		defer
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let rough: RoughCanvas;
	let gen: RoughGenerator;
	let boundary: AABB;
	let qtree: QuadTree;

	const dpr = window.devicePixelRatio;

	const shapes: Shape[] = $state([]);
	let shape: Shape | null = $state(null);

	let mouse = $state({ x: 0, y: 0 });

	let options: RoughOptions = $state({
		seed: 10,
		roughness: 4,
		strokeWidth: 4
	});

	const box = new BoundingBox({
		stroke: 'rgba(137, 196, 244, 1)',
		strokeWidth: 4,
		roughness: 0
	});

	let target: Shape | null = $state(null);

	let intersection_side = $state('');

	function refresh() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		shapes.forEach((shape) => shape.draw(rough));
	}

	function onpointerdown(event: PointerEvent) {
		const x = event.offsetX * devicePixelRatio;
		const y = event.offsetY * devicePixelRatio;

		mouse = { x, y };

		switch (tool) {
			case 'pointer':
				if (box.contains(x, y)) {
					box.update_offset(x, y);
					drag();
					return;
				}

				const [box_intersects, side] = box.intersects(x, y);

				/*
                Have to check side, because either I have skill issue of typescript
                is a hell. I don't wanna pick, if you reach untill here, you chose
                */

				if (box_intersects && side) {
					intersection_side = side;
					cursor_type = INTERSECTION_SIDE[side];
				} else {
					cursor_type = qtree.has(x, y) ? 'move' : 'default';
				}

				resize();
				return;

				box.clean();
				refresh();
				select();

				const found: Shape[] = [];

				qtree.query_by_point(x, y, found);

				const [target] = found;

				if (target) {
					box.add(target);
					box.draw(rough);
				} else {
					cursor_type = 'default';
					behavior = 'select';
				}

				break;
			case 'rectangle':
			case 'ellipse':
			case 'line':
				draw();

				box.clean();

				shape = create_shape(tool, x, y, 0, 0, options);

				break;
		}
	}

	function get_cursor_type(box: BoundingBox, qtree: QuadTree, x: number, y: number): CursorStyle {
		if (box.is_empty()) return qtree.has(x, y) ? 'move' : 'default';

		if (box.contains(x, y)) return 'move';
		if (box.intersects_heights(x, y)) return 'ew-resize';
		if (box.intersects_base(x, y)) return 'ns-resize';
		if (box.intersects_main_diagonal(x, y)) return 'nwse-resize';
		if (box.intersects_main_diagonal(x, y)) return 'nesw-resize';

		return 'default';
	}

	function onpointermove(event: PointerEvent) {
		const x = event.offsetX * devicePixelRatio;
		const y = event.offsetY * devicePixelRatio;

		const found: Shape[] = [];

		switch (tool) {
			case 'pointer':
				switch (behavior) {
					case 'select':
						const range = new AABB(mouse.x, mouse.y, x - mouse.x, y - mouse.y);
						qtree.query_by_range(range, found);
						found.forEach((target) => box.add(target));
						break;

					case 'resize':
						refresh();
						box.resize(intersection_side, x, y);
						box.draw(rough);
						break;

					case 'drag':
						refresh();
						box.move(x, y);
						box.draw(rough);
						break;

					default: // Corrected semicolon to colon here
						const [intersects, side] = box.intersects(x, y);

						cursor_type = intersects ? INTERSECTION_SIDE[side] : 'default';

						break;
				}

			case 'rectangle':
			case 'ellipse':
			case 'line':
				if (!shape) break;

				if (shape) {
					refresh();

					shape.resize(x, y);
					shape.draw(rough);
					shapes.push(shape);
				}

				break;
		}
	}

	function onpointerup(event: PointerEvent) {
		defer();

		if (shape) {
			qtree.insert(shape);
			box.add(shape);
		}

		cursor_type = 'default';
		box.draw(rough);

		shape = null;
		target = null;
	}

	$effect(() => {
		context = canvas.getContext('2d') as CanvasRenderingContext2D;
		rough = roughCanvas.canvas(canvas);
		gen = rough.generator;

		const rect = canvas.getBoundingClientRect();

		context.scale(dpr, dpr);

		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;

		canvas.style.width = `${rect.width}px`;
		canvas.style.height = `${rect.height}px`;

		boundary = new AABB(0, 0, canvas.width, canvas.height);

		qtree = new QuadTree(boundary, 4);

		qtree.visualize(context);
	});
</script>

<canvas
	bind:this={canvas}
	width={window.innerWidth}
	height={window.innerHeight}
	class:cursor-crosshair={cursor_type === 'crosshair'}
	class:cursor-move={cursor_type === 'move'}
	class:cursor-ew-resize={cursor_type === 'ew-resize'}
	class:cursor-nwse-resize={cursor_type === 'nwse-resize'}
	class:cursor-nesw-resize={cursor_type === 'nesw-resize'}
	class:cursor-ns-resize={cursor_type === 'ns-resize'}
	class:cursor-default={cursor_type === 'default'}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
>
</canvas>
