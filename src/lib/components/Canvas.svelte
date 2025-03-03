<script lang="ts">
	import { Vector } from '$lib/math/vector';
	import { QuadTree } from '$lib/collision/qtree';
	import { Gizmo } from '$lib/collision/bounding-box';
	import { AABB } from '$lib/collision/aabb';
	import type { Shape, Tool, Cursor, PointerMode, Direction } from '$lib/types';
	import roughCanvas from 'roughjs';
	import { RoughCanvas } from 'roughjs/bin/canvas';
	import type { Options } from 'roughjs/bin/core';
	import { create_shape } from '$lib/shape';
	import { Rectangle } from '$lib/shape/rectangle';

	const directions: Record<Direction, Cursor> = {
		west: 'ew',
		east: 'ew',
		north: 'ns',
		south: 'ns',
		'south-west': 'nesw',
		'south-east': 'nwse',
		'nor-west': 'nwse',
		'nor-east': 'nesw'
	};

	const cursors: Record<Cursor, string> = {
		grab: 'cursor-grab',
		move: 'cursor-move',
		crosshair: 'cursor-crosshair',
		ew: 'cursor-ew-resize',
		ns: 'cursor-ns-resize',
		nesw: 'cursor-nesw-resize',
		nwse: 'cursor-nwse-resize',
		custom: 'cursor-custom'
	} as const;

	type Props = {
		tool: Tool;
		mode: PointerMode;
		cursor: Cursor;
		drawing: boolean;
		selecting: boolean;
		draw: () => void;
		select: () => void;
		drag: () => void;
		reset: () => void;
		resize: () => void;
		rotate: () => void;
	};

	let {
		tool,
		mode,
		cursor = $bindable(),
		resize,
		rotate,
		draw,
		select,
		drag,
		reset
	}: Props = $props();

	let canvas: HTMLCanvasElement;
	let context: CanvasRenderingContext2D;
	let rough: RoughCanvas;
	let qtree: QuadTree;

	const dpr = window.devicePixelRatio;

	let last = Vector.zero();
	let mouse = Vector.zero();

	let shapes = $state<Shape[]>([]);
	let shape = $state<Shape | null>(null);

	let gizmo: Gizmo = new Gizmo();

	let ptr_direction: Direction | null = null;

	let default_options = $state<Options>({
		seed: 2,
		roughness: 4,
		strokeWidth: 4
	});

	function clear() {
		context.clearRect(0, 0, canvas.width, canvas.height);
	}

	function redraw() {
		shapes.forEach((shape) => shape.draw(context, rough));
	}

	function onpointerdown(event: PointerEvent) {
		last.set(event.offsetX, event.offsetY).scale(dpr);

		switch (tool) {
			case 'pointer':
				select();

				if (gizmo.empty) {
					const found: Shape[] = [];

					qtree.query_at(last, found);

					if (found.length) {
						gizmo.attach(found).draw(context);
					}

					cursor = 'custom';
					mode = 'select';

					return;
				}

				if (gizmo.contains(last)) {
					gizmo.offset(last);
					drag();
					return;
				}

				if (gizmo.intersects(last)) {
					gizmo.prepare_to_resize(last.clone());
					resize();
					return;
				}

				if (gizmo.intersectaion_rotation_pivot(last)) {
					rotate();
					return;
				}

				gizmo.clear();

				clear();
				redraw();

				break;
			case 'rectangle':
			case 'ellipse':
			case 'segment':
				gizmo.clear();

				draw();

				shape = create_shape(tool, last.x, last.y, 0, 0, default_options);

				break;
		}
	}

	function onpointermove(event: PointerEvent) {
		requestAnimationFrame(() => {
			mouse.set(event.offsetX, event.offsetY).scale(dpr);

			switch (tool) {
				case 'pointer':
					switch (mode) {
						case 'select':
							const found: Shape[] = [];

							clear();
							redraw();

							const size = mouse.clone().substract(last);

							const range = new AABB(last.x, last.y, size.x, size.y);

							qtree.query_in_range(range, found);

							if (!found.length) return;

							gizmo.attach(found).draw(context);

							break;
						case 'rotate':
							clear();

							const center = gizmo.center;

							const offset_from_origin = last.clone().substract(center);

							const offset_from_delta = mouse.clone().substract(center);

							const prev_angle = Math.atan2(offset_from_origin.x, offset_from_origin.y);
							const cur_angle = Math.atan2(offset_from_delta.x, offset_from_delta.y);

							const angle = prev_angle - cur_angle;

							last.set(mouse.x, mouse.y);

							gizmo.rotate(angle).draw(context);

							redraw();
							break;
						case 'resize':
							clear();

							if (!ptr_direction) return;

							gizmo.adjust(ptr_direction, last, mouse).draw(context);

							redraw();

							break;
						case 'move':
							clear();

							gizmo.move(mouse.clone()).draw(context);

							redraw();
							break;
						default:
							if (gizmo.empty) {
								cursor = qtree.has(mouse) ? 'move' : 'custom';
								return;
							}

							ptr_direction = gizmo.find_handle_under_cursor(mouse);

							if (ptr_direction) {
								cursor = directions[ptr_direction];
								return;
							}

							if (gizmo.intersectaion_rotation_pivot(mouse)) {
								cursor = 'grab';
								return;
							}

							if (gizmo.contains(mouse)) {
								cursor = 'move';
								return;
							}

							cursor = 'custom';
							break;
					}
				case 'rectangle':
				case 'ellipse':
				case 'segment':
					if (!shape) return;

					clear();
					redraw();

					const size = mouse.clone().substract(shape.vertices[0]);

					shape.resize(size.x, size.y).draw(context, rough);

					break;
			}
		});
	}

	function onpointerup() {
		reset();

		cursor = 'custom';

		if (!shape) return;

		clear();
		redraw();

		shape.normalize().draw(context, rough);

		shapes.push(shape);

		qtree.insert(shape);

		gizmo.attach([shape]).draw(context);

		shape = null;
	}

	function crispify() {
		const rect = canvas.getBoundingClientRect();

		context.scale(dpr, dpr);

		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;

		canvas.style.width = `${rect.width}px`;
		canvas.style.height = `${rect.height}px`;
	}

	function window_resize() {
		crispify();
		redraw();

		gizmo.draw(context);
	}

	function config() {
		context = canvas.getContext('2d') as CanvasRenderingContext2D;
		rough = roughCanvas.canvas(canvas);

		crispify();

		const boundary = new AABB(0, 0, canvas.width, canvas.height);
		qtree = new QuadTree(boundary, 4);

		window.addEventListener('resize', window_resize);
		document.addEventListener('visibilitychange', window_resize);

		return () => {
			window.removeEventListener('resize', window_resize);
			document.removeEventListener('visibilitychange', window_resize);
		};
	}

	$effect(config);
</script>

<!-- class="bg-[#1e1e1e]" -->
<!-- /* I dont know how to make this better on svelte If I put cursor in here It'll break my cursor */ -->
<canvas
	bind:this={canvas}
	width={window.innerWidth}
	height={window.innerHeight}
	class={`${cursors[cursor as keyof typeof cursors]} bg-stone-200`}
	{onpointerdown}
	{onpointermove}
	{onpointerup}
>
</canvas>

<style>
	:global(body) {
		cursor: none;
	}

	.cursor-custom {
		cursor: url('/cursor.svg'), auto;
	}
</style>
