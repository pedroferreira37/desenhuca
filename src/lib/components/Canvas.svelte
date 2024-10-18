<script lang="ts">
	import { create_shape } from '$lib/shape.svelte';
	import { AABB, QuadTree } from '$lib/qtree';
	import type { Shape, RoughOptions, Tools, Cursor, Compass, Point } from '$lib/types';
	import roughCanvas from 'roughjs';
	import { RoughCanvas } from 'roughjs/bin/canvas';
	import type { RoughGenerator } from 'roughjs/bin/generator';
	import { BoundingBox } from '$lib/selection-box.svelte';
	import { CURSOR_RESIZE_STYLES } from '$lib/consts';

	type Props = {
		tool: Tools;
		behavior: 'select' | 'drag' | 'resize' | 'default';
		cursor_glyph: Cursor;
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
		cursor_glyph = $bindable(),
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

	let shapes: Shape[] = $state([]);
	let shape: Shape | null = $state(null);
	let found: Shape[] = $state([]);
	let mouse: Point = $state({ x: 0, y: 0 });
	let direction: Compass = $state('none');

	let options: RoughOptions = $state({
		seed: 1,
		roughness: 4,
		strokeWidth: 4
	});

	const box = new BoundingBox({
		stroke: 'rgba(137, 196, 244, 1)',
		strokeWidth: 4,
		roughness: 1
	});

	function refresh() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		shapes.forEach((shape) => shape.draw(rough));
	}

	function onpointerdown(event: PointerEvent) {
		const x = event.offsetX * devicePixelRatio;
		const y = event.offsetY * devicePixelRatio;

		mouse = { x, y };

		found = [];

		switch (tool) {
			case 'pointer':
				if (box.contains(x, y)) {
					box.mousedown(x, y);
					drag();
					return;
				}

				if (box.intersects(x, y)) {
					direction = box.get_mouse_direction(x, y);
					resize();
					return;
				}

				refresh();
				select();

				box.clean();

				qtree.query_at(x, y, found);

				const [target] = found;

				if (target) {
					box.add(target);
					box.draw(rough);
					box.mousedown(x, y);
					drag();
					return;
				}

				cursor_glyph = 'default';
				behavior = 'select';
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
		requestAnimationFrame(() => {
			const x = event.offsetX * devicePixelRatio;
			const y = event.offsetY * devicePixelRatio;

			switch (tool) {
				case 'pointer':
					switch (behavior) {
						case 'select':
							refresh();
							box.clean();
							const range = new AABB(mouse.x, mouse.y, x - mouse.x, y - mouse.y);
							qtree.query_in_range(range, found);
							found.forEach((target) => box.add(target));
							box.draw(rough);
							break;
						case 'resize':
							refresh();
							box.resize(direction, x, y);
							box.draw(rough);
							break;
						case 'drag':
							refresh();
							box.move(x, y);
							box.draw(rough);
							break;
						default:
							if (box.is_empty()) {
								cursor_glyph = qtree.has(x, y) ? 'move' : 'default';
								return;
							}

							if (box.contains(x, y)) {
								cursor_glyph = 'move';
							} else {
								const direction = box.get_mouse_direction(x, y);
								cursor_glyph = CURSOR_RESIZE_STYLES[direction];
							}
							break;
					}
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
		});
	}

	function onpointerup() {
		defer();

		if (shape) {
			refresh();
			shape.normalize();
			shapes.push(shape);
			qtree.insert(shape);
			box.add(shape);
			box.draw(rough);
		}

		cursor_glyph = 'default';

		shape = null;
	}

	function config(canvas: HTMLCanvasElement) {
		const rect = canvas.getBoundingClientRect();

		context.scale(dpr, dpr);

		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;

		canvas.style.width = `${rect.width}px`;
		canvas.style.height = `${rect.height}px`;
	}

	$effect(() => {
		context = canvas.getContext('2d') as CanvasRenderingContext2D;
		rough = roughCanvas.canvas(canvas);

		config(canvas);

		const boundary = new AABB(0, 0, canvas.width, canvas.height);
		qtree = new QuadTree(boundary, 4);
	});
</script>

<canvas
	bind:this={canvas}
	width={window.innerWidth}
	height={window.innerHeight}
	class:cursor-move={cursor_glyph === 'move'}
	class:cursor-crosshair={cursor_glyph === 'crosshair'}
	class:cursor-default={cursor_glyph === 'default'}
	class:cursor-nwse-resize={cursor_glyph === 'nwse-resize'}
	class:cursor-nesw-resize={cursor_glyph === 'nesw-resize'}
	class:cursor-ew-resize={cursor_glyph === 'ew-resize'}
	class:cursor-ns-resize={cursor_glyph === 'ns-resize'}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
>
</canvas>
