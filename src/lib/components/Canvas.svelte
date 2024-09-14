<script lang="ts">
	import { create_shape } from '$lib/main.svelte';
	import { AABB, QuadTree } from '$lib/qudtree';
	import type { DesenhucaMode, DesenhucaShape } from '$lib/types';
	import roughCanvas from 'roughjs';
	import { RoughCanvas } from 'roughjs/bin/canvas';
	import type { RoughGenerator } from 'roughjs/bin/generator';

	type Props = {
		mode: DesenhucaMode;
		drawing: boolean;
		selecting: boolean;
		dragging: boolean;
		draw: () => void;
		select: () => void;
		drag: () => void;
		defer: () => void;
	};

	let { mode, drawing, selecting, dragging, draw, select, drag, defer }: Props = $props();

	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let rough: RoughCanvas;
	let gen: RoughGenerator;
	let boundary: AABB;
	let qtree: QuadTree;

	const dpr = window.devicePixelRatio;

	const shapes: DesenhucaShape[] = $state([]);

	let mouse = $state({ x: 0, y: 0 });

	let target: DesenhucaShape | null = $state(null);

	let intersecting: boolean = $state(false);

	const clean_canvas = () => context.clearRect(0, 0, canvas.width, canvas.height);

	const redraw = () => {
		for (let i = 0; i < shapes.length; i++) {
			shapes[i].draw(rough);
		}
	};

	function onpointerdown(event: PointerEvent) {
		const x = event.offsetX * devicePixelRatio;
		const y = event.offsetY * devicePixelRatio;

		mouse = { x, y };

		switch (mode) {
			case 'select':
				if (!target && !intersecting) {
					clean_canvas();
					redraw();
				}

				if (intersecting) {
					drag();
					return;
				}

				select();

				break;
			case 'rectangle':
			case 'ellipse':
			case 'line':
				draw();

				const shape = create_shape(mode, x, y, 0, 0, {
					seed: 10,
					roughness: 4,
					strokeWidth: 4
				});

				shapes.push(shape);
				break;
		}
	}

	function onpointermove(event: PointerEvent) {
		const x = event.offsetX * devicePixelRatio;
		const y = event.offsetY * devicePixelRatio;

		const found: DesenhucaShape[] = [];

		switch (mode) {
			case 'select':
				if (selecting) {
					const range = new AABB(mouse.x, mouse.y, x - mouse.x, y - mouse.y);

					qtree.query_by_range(range, found);

					if (!found.length) return;

					target = found[0];
					target.highlight(rough);

					return;
				}

				if (dragging && target) {
					clean_canvas();
					redraw();

					target.move(x, y);
					target.draw(rough);
					target.highlight(rough);

					return;
				}

				qtree.query_by_point({ x, y }, found);
				target = found[0];

				if (target) {
					intersecting = true;
					return;
				}

				intersecting = false;
				break;
			case 'rectangle':
			case 'ellipse':
			case 'line':
				if (!drawing) return;

				const shape = shapes.at(-1);

				if (shape) {
					clean_canvas();
					redraw();

					shape.resize(x, y);
					shape.draw(rough);
					shapes.push(shape);
				}

				break;
		}
	}

	function onpointerup(event: PointerEvent) {
		defer();

		const shape = shapes.at(-1);

		if (shape) {
			qtree.insert(shape);
		}
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
	});
</script>

<canvas
	bind:this={canvas}
	width={window.innerWidth}
	height={window.innerHeight}
	class:cursor-crosshair={drawing &&
		(mode === 'free-hand-draw' || mode === 'rectangle' || mode === 'ellipse' || mode === 'line')}
	class:cursor-move={intersecting}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
>
</canvas>
