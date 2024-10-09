<script lang="ts">
	import { create_shape } from '$lib/shape.svelte';
	import { AABB, QuadTree } from '$lib/qtree';
	import type {
		Shape,
		RoughOptions,
		Tools,
		CursorGlyph,
		EdgeSide,
		HoverDirection
	} from '$lib/types';
	import roughCanvas from 'roughjs';
	import { RoughCanvas } from 'roughjs/bin/canvas';
	import type { RoughGenerator } from 'roughjs/bin/generator';
	import { BoundingBox } from '$lib/selection-box.svelte';
	import { EDGES_GLYPH } from '$lib/consts';

	type Props = {
		tool: Tools;
		behavior: 'select' | 'drag' | 'resize' | 'default';
		cursor_glyph: CursorGlyph;
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

	let direction: HoverDirection = $state('none');

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
					direction = box.detect_hover_direction(x, y);
					resize();
				} else {
					cursor_glyph = qtree.has(x, y) ? 'move' : 'default';

					refresh();
					select();
					box.clean();

					const found: Shape[] = [];

					qtree.query_by_point(x, y, found);

					const [target] = found;

					if (target) {
						box.add(target);
						box.draw(rough);
					} else {
						cursor_glyph = 'default';
						behavior = 'select';
					}
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
				switch (behavior) {
					case 'select':
						const range = new AABB(mouse.x, mouse.y, x - mouse.x, y - mouse.y);
						qtree.query_by_range(range, found);
						found.forEach((target) => box.add(target));
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
						if (box.contains(x, y)) {
							cursor_glyph = 'move';
						} else {
							const direction = box.detect_hover_direction(x, y);
							cursor_glyph = EDGES_GLYPH[direction];
						}
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

		cursor_glyph = 'default';
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

		qtree = new QuadTree(new AABB(0, 0, canvas.width, canvas.height), 4);

		qtree.visualize(context);
	});
</script>

<canvas
	bind:this={canvas}
	width={window.innerWidth}
	height={window.innerHeight}
	class:cursor-crosshair={cursor_glyph === 'crosshair'}
	class:cursor-move={cursor_glyph === 'move'}
	class:cursor-ew-resize={cursor_glyph === 'ew-resize'}
	class:cursor-nwse-resize={cursor_glyph === 'nwse-resize'}
	class:cursor-nesw-resize={cursor_glyph === 'nesw-resize'}
	class:cursor-ns-resize={cursor_glyph === 'ns-resize'}
	class:cursor-default={cursor_glyph === 'default'}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
>
</canvas>
