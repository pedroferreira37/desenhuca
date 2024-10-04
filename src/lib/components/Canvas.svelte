<script lang="ts">
	import { create_shape } from '$lib/shape.svelte';
	import { AABB, QuadTree } from '$lib/qtree';
	import type { Shape, RoughOptions, Tools, CursorStyle } from '$lib/types';
	import roughCanvas from 'roughjs';
	import { RoughCanvas } from 'roughjs/bin/canvas';
	import type { RoughGenerator } from 'roughjs/bin/generator';
	import { BoundingBox } from '$lib/selection-box.svelte';

	type Props = {
		tool: Tools;
		behavior: 'drag' | 'resize' | 'none';
		cursor_style: CursorStyle;
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
		cursor_style = $bindable(),
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
				} else if (box.intersects(x, y)) {
					resize();
				} else {
					box.clean();
					refresh();
					select();

					const found: Shape[] = [];

					qtree.query_by_point(x, y, found);

					const [target] = found;

					if (target) {
						box.add(target);
						box.draw(rough);
					}

					cursor_style = 'default';
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

	function onpointermove(event: PointerEvent) {
		const x = event.offsetX * devicePixelRatio;
		const y = event.offsetY * devicePixelRatio;

		const found: Shape[] = [];

		switch (tool) {
			case 'pointer':
				if (!box.is_empty()) {
					if (box.contains(x, y)) {
						cursor_style = 'move';
					} else if (box.intersects_heights(x, y)) {
						cursor_style = 'ew-resize';
					} else if (box.intersects_base(x, y)) {
						cursor_style = 'ns-resize';
					} else if (box.intersects_main_diagonal(x, y)) {
						cursor_style = 'nwse-resize';
					} else if (box.intersects_secondary_diagonal(x, y)) {
						cursor_style = 'nesw-resize';
					} else {
						cursor_style = 'default';
					}
				} else {
					if (qtree.has(x, y)) {
						cursor_style = 'move';
					} else {
						cursor_style = 'default';
					}
				}

				if (selecting) {
					cursor_style = 'default';
					const range = new AABB(mouse.x, mouse.y, x - mouse.x, y - mouse.y);
					qtree.query_by_range(range, found);
					found.forEach((target) => box.add(target));
				} else {
					switch (behavior) {
						case 'resize':
							refresh();
							box.update_offset(x, y);
							box.resize(cursor_style, x, y);
							box.draw(rough);
							break;
						case 'drag':
							refresh();
							box.move(x, y);
							box.draw(rough);
							break;
					}
				}
				break;

			case 'rectangle':
			case 'ellipse':
			case 'line':
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

		cursor_style = 'default';
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
	class:cursor-crosshair={cursor_style === 'crosshair'}
	class:cursor-move={cursor_style === 'move'}
	class:cursor-ew-resize={cursor_style === 'ew-resize'}
	class:cursor-nwse-resize={cursor_style === 'nwse-resize'}
	class:cursor-nesw-resize={cursor_style === 'nesw-resize'}
	class:cursor-ns-resize={cursor_style === 'ns-resize'}
	class:cursor-default={cursor_style === 'default'}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
>
</canvas>
