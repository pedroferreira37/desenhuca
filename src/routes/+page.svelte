<script lang="ts">
	import Canvas from '$lib/components/Canvas.svelte';
	import Lasso from '$lib/components/Lasso.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import { Vector } from '$lib/math/vector';
	import type { Tool, Cursor, PointerMode } from '$lib/types';
	import { KeyShortcuts } from '$lib/util/util';

	let tool = $state<Tool>('pointer');
	let pointer_mode = $state<PointerMode>('idle');

	let cursor = $state<Cursor | 'default'>('default');

	let drawing = $state<boolean>(false);
	let selecting = $state<boolean>(false);

	let prev_mouse = $state({ x: 0, y: 0 });
	let mouse = $state({ x: 0, y: 0 });

	function is_ptr_evs_blocked(pointerMode: PointerMode) {
		return pointerMode === 'move' || pointerMode === 'resize' || pointerMode === 'select';
	}
</script>

<main class="absolute top-0 left-0 w-full h-full">
	<div
		class:pointer-events-none={drawing || selecting || is_ptr_evs_blocked(pointer_mode)}
		class="relative flex justify-center w-full h-full overflow-hidden"
	>
		<div class="absolute z-10 shadow-sm max-w-full bottom-4">
			<Toolbar
				selected={tool}
				pointer={() => {
					tool = 'pointer';
					cursor = 'default';
				}}
				rectangle={() => {
					tool = 'rectangle';
					cursor = 'crosshair';
				}}
				ellipse={() => {
					tool = 'ellipse';
					cursor = 'crosshair';
				}}
				line={() => {
					tool = 'segment';
					cursor = 'crosshair';
				}}
			/>
		</div>
		<!-- <div class="grid">
			<Zoom />
		</div> -->
	</div>
	<div class="w-full h-full absolute top-0 left-0">
		{#if tool === 'pointer' && pointer_mode === 'select'}
			<Lasso
				x={prev_mouse.x}
				y={prev_mouse.y}
				width={mouse.x - prev_mouse.x}
				height={mouse.y - prev_mouse.y}
				completed={() => (selecting = false)}
			/>
		{/if}

		<Canvas
			{tool}
			pointerMode={pointer_mode}
			{selecting}
			{drawing}
			bind:cursor
			draw={() => (drawing = true)}
			drag={() => {
				pointer_mode = 'move';
				selecting = false;
			}}
			rotate={() => {
				pointer_mode = 'rotate';
			}}
			select={() => {
				pointer_mode = 'select';
			}}
			resize={() => {
				pointer_mode = 'resize';
				selecting = false;
			}}
			defer={() => {
				tool = 'pointer';
				pointer_mode = 'idle';
				selecting = false;
				drawing = false;
			}}
		/>
	</div>
</main>

<svelte:window
	onpointerdown={(event: PointerEvent) => {
		prev_mouse = { x: event.offsetX, y: event.offsetY };
	}}
	onpointermove={(event: PointerEvent) => {
		mouse = { x: event.offsetX, y: event.offsetY };
	}}
	onmouseup={() => {
		selecting = false;
	}}
	onkeydown={(event) => {
		tool = KeyShortcuts.get(event.key) || 'pointer';

		if (tool === 'rectangle' || tool === 'ellipse' || tool === 'segment') {
			cursor = 'crosshair';
		}
	}}
/>
