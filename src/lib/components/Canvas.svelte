<script lang="ts">
	import { Vector } from '$lib/math/vector';
	import { QuadTree } from '$lib/collision/qtree';
	import { Gizmo } from '$lib/collision/gizmo';
	import { AABB } from '$lib/collision/aabb';
	import type { Shape, Tool, Cursor, PointerMode, Direction } from '$lib/types';
	import roughCanvas from 'roughjs';
	import { RoughCanvas } from 'roughjs/bin/canvas';
	import type { Options } from 'roughjs/bin/core';
	import create from '$lib/shape-factory';

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
	let ctx: CanvasRenderingContext2D;
	let rough: RoughCanvas;
	let qtree: QuadTree;

	const dpr = window.devicePixelRatio;

	let last = Vector.zero();
	let mouse = Vector.zero();

	let shapes = $state<Shape[]>([]);
	let shape = $state<Shape | null>(null);

	let gizmo: Gizmo = new Gizmo();

	let ptr_direction: Direction | null = null;

	let base_options = $state<Options>({
		seed: 4,
		strokeWidth: 8,
		roughness: 1
	});

	function clear(c: CanvasRenderingContext2D) {
		c.clearRect(0, 0, canvas.width, canvas.height);
	}

	function redraw(c: CanvasRenderingContext2D, r: RoughCanvas) {
		shapes.forEach((shape) => shape.draw(c, r));
	}

	function render_scene(c: CanvasRenderingContext2D, r: RoughCanvas, gizmo: Gizmo) {
		clear(c);
		redraw(c, r);

		if (!gizmo.empty) {
			gizmo.draw(c, r);
		}
	}

	function onpointerdown(event: PointerEvent) {
		last.set(event.offsetX, event.offsetY).scale(dpr);

		switch (tool) {
			case 'pointer':
				if (gizmo.contains(last)) {
					gizmo.offset(last);
					drag();
					return;
				}

				if (gizmo.intersects(last)) {
					gizmo.set_anchor(last);
					gizmo.save();
					resize();
					return;
				}

				if (gizmo.intersects_rotate_handle(last)) {
					gizmo.save();
					rotate();
					return;
				}

				gizmo.clear();

				select();

				render_scene(ctx, rough, gizmo);

				const found: Shape[] = [];

				qtree.query_at(last, found);

				if (found.length) {
					gizmo.add(found);
					gizmo.draw(ctx, rough);
					gizmo.offset(last);
					drag();
					return;
				}

				cursor = 'custom';
				mode = 'select';

				break;

			case 'rectangle':
			case 'ellipse':
			case 'segment':
				gizmo.clear();

				draw();

				shape = create(tool, last.x, last.y, 0, 0, base_options);

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

							const size = mouse.substract(last);

							const range = new AABB(last.x, last.y, size.x, size.y);

							qtree.query_in_range(range, found);

							if (!found.length) return;

							gizmo.add(found);

							break;
						case 'rotate':
							const angle =
								Math.atan2(mouse.y - gizmo.center.y, mouse.x - gizmo.center.x) -
								Math.atan2(last.y - gizmo.center.y, last.x - gizmo.center.x);

							gizmo.rotate(angle);

							break;
						case 'resize':
							if (!ptr_direction) return;

							gizmo.adjust(ptr_direction, last, mouse);

							break;
						case 'move':
							gizmo.move(mouse);

							break;
						default:
							cursor = qtree.has(mouse) ? 'move' : 'custom';

							ptr_direction = gizmo.get_handle_under_cursor(mouse);

							if (ptr_direction) {
								cursor = directions[ptr_direction];
								return;
							}

							if (gizmo.intersects_rotate_handle(mouse)) {
								cursor = 'grab';
								return;
							}

							if (gizmo.contains(mouse)) {
								cursor = 'move';
								return;
							}

							break;
					}

				case 'segment':
					if (!shape) return;

					shape.resize(mouse.x, mouse.y);
					shape.draw(ctx, rough);

					break;
				case 'rectangle':
				case 'ellipse':
				case 'segment':
					if (!shape) return;

					const [nw] = shape.vertices;
					const size = mouse.substract(nw);

					shape.resize(size.x, size.y);
					shape.draw(ctx, rough);

					break;
			}
		});

		render_scene(ctx, rough, gizmo);
	}

	function onpointerup() {
		reset();

		cursor = 'custom';

		//gizmo.normalize();

		if (!shape) return;

		shape.normalize();
		shape.draw(ctx, rough);

		shapes.push(shape);

		qtree.insert(shape);

		gizmo.add([shape]);

		render_scene(ctx, rough, gizmo);

		shape = null;
	}

	function crispify() {
		const rect = canvas.getBoundingClientRect();

		ctx.scale(dpr, dpr);

		canvas.width = rect.width * dpr;
		canvas.height = rect.height * dpr;

		canvas.style.width = `${rect.width}px`;
		canvas.style.height = `${rect.height}px`;
	}

	function windowResize() {
		crispify();
		redraw(ctx, rough);

		gizmo.draw(ctx, rough);
	}

	function config() {
		ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
		rough = roughCanvas.canvas(canvas);

		crispify();

		const boundary = new AABB(0, 0, canvas.width, canvas.height);
		qtree = new QuadTree(boundary, 4);

		window.addEventListener('resize', windowResize);
		document.addEventListener('visibilitychange', windowResize);

		return () => {
			window.removeEventListener('resize', windowResize);
			document.removeEventListener('visibilitychange', windowResize);
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
