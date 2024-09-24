<script lang="ts">
	import { create_shape } from '$lib/shape.svelte';
	import { AABB, QuadTree } from '$lib/qtree';
	import type { DesenhucaMode, DesenhucaShape, RoughOptions } from '$lib/types';
	import roughCanvas from 'roughjs';
	import { RoughCanvas } from 'roughjs/bin/canvas';
	import type { RoughGenerator } from 'roughjs/bin/generator';
	import { BoundingBox } from '$lib/selection-box.svelte';

	type Props = {
		mode: DesenhucaMode;
		resizing: boolean;
		drawing: boolean;
		selecting: boolean;
		dragging: boolean;
		draw: () => void;
		select: () => void;
		drag: () => void;
		defer: () => void;
		resize: () => void;
	};

	let { mode, resizing, drawing, selecting, dragging, resize, draw, select, drag, defer }: Props =
		$props();

	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let rough: RoughCanvas;
	let gen: RoughGenerator;
	let boundary: AABB;
	let qtree: QuadTree;

	const dpr = window.devicePixelRatio;

	const shapes: DesenhucaShape[] = $state([]);
	let shape: DesenhucaShape | null = $state(null);

	let mouse = $state({ x: 0, y: 0 });
	let offset = $state({ x: 0, y: 0 });
	let options: RoughOptions = $state({
		seed: 10,
		roughness: 4,
		strokeWidth: 4
	});

	const box = new BoundingBox();

	let target: DesenhucaShape | null = $state(null);

	let is_cursor_move: boolean = $state(false);
	let is_cursor_ew_resize: boolean = $state(false);
	let is_cursor_nwse_resize: boolean = $state(false);

	function flush_and_redraw() {
		context.clearRect(0, 0, canvas.width, canvas.height);
		shapes.forEach((shape) => shape.draw(rough));
	}

	function onpointerdown(event: PointerEvent) {
		const x = event.offsetX * devicePixelRatio;
		const y = event.offsetY * devicePixelRatio;

		mouse = { x, y };

		if (mode)
			switch (mode) {
				case 'select':
					if (box.contains(x, y)) {
						const rect = box.get_rect();
						offset = { x: x - rect.x, y: y - rect.y };
						drag();
						return;
					}

					if (box.intersects_path(x, y)) {
						resize();
						box.resize(x, y);
						return;
					}

					if (!box.empty() || (!box.intersects_path(x, y) && !target)) {
						select();
						flush_and_redraw();
						box.clean();
						return;
					} else {
						box.add(target as DesenhucaShape);

						box.draw(rough);
						is_cursor_ew_resize = is_cursor_nwse_resize = is_cursor_move = false;
					}

					break;
				case 'rectangle':
				case 'ellipse':
				case 'line':
					draw();

					box.clean();

					shape = create_shape(mode, x, y, 0, 0, options);

					break;
			}
	}

	function onpointermove(event: PointerEvent) {
		const x = event.offsetX * devicePixelRatio;
		const y = event.offsetY * devicePixelRatio;

		const found: DesenhucaShape[] = [];

		switch (mode) {
			case 'select':
				if (resizing) {
					flush_and_redraw();
					box.resize(x, y);
					return;
				}

				if (selecting) {
					const range = new AABB(mouse.x, mouse.y, x - mouse.x, y - mouse.y);

					qtree.query_by_range(range, found);

					box.add(found);
				} else if (dragging) {
					flush_and_redraw();

					if (box.contains(x, y)) {
						box.move(x, y, offset);
					}

					// target.move(x, y, offset);
					// target.draw(rough);
					// target.highlight(rough);
				} else {
					target = qtree.query_by_point(x, y, found)[0];

					if (target && box.empty()) {
						is_cursor_move = true;
						is_cursor_nwse_resize = is_cursor_ew_resize = false;
					} else if (box.intersects_path(x, y)) {
						is_cursor_ew_resize = true;
						is_cursor_nwse_resize = is_cursor_move = false;
					} else if (box.contains(x, y)) {
						is_cursor_ew_resize = is_cursor_nwse_resize = false;
						is_cursor_move = true;
						console.log('and here');
					} else {
						is_cursor_move = is_cursor_ew_resize = is_cursor_nwse_resize = false;
					}
				}

				break;
			case 'rectangle':
			case 'ellipse':
			case 'line':
				if (!drawing) return;

				if (shape) {
					flush_and_redraw();

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
			is_cursor_ew_resize = is_cursor_nwse_resize = is_cursor_move = false;
		}

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
	});
</script>

<canvas
	bind:this={canvas}
	width={window.innerWidth}
	height={window.innerHeight}
	class:cursor-crosshair={drawing &&
		(mode === 'free-hand-draw' || mode === 'rectangle' || mode === 'ellipse' || mode === 'line')}
	class:cursor-move={is_cursor_move}
	class:cursor-ew-resize={is_cursor_ew_resize}
	class:cursor-nwse-resize={is_cursor_nwse_resize}
	class:cursor-default={!drawing &&
		!is_cursor_move &&
		!is_cursor_ew_resize &&
		!is_cursor_nwse_resize}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
>
</canvas>
