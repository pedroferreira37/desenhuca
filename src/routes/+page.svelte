<script lang="ts">
	import Canvas from '$lib/components/Canvas.svelte';
	import Lasso from '$lib/components/Lasso.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import { Vector } from '$lib/math/vector';
	import type { Tool, Cursor, PointerMode as Mode } from '$lib/types';
	import { retrieve_tool_by_shortcut } from '$lib/util/util';

	let tool = $state<Tool>('pointer');
	let mode = $state<Mode>('idle');
	let cursor = $state<Cursor>('custom');
	let drawing = $state<boolean>(false);
	let selecting = $state<boolean>(false);

	let last = $state({ x: 0, y: 0 });
	let mouse = $state({ x: 0, y: 0 });

	let width = $derived(mouse.x - last.x);
	let height = $derived(mouse.y - last.y);

	function blockPointerEvents(mode: Mode) {
		return mode === 'move' || mode === 'resize' || mode === 'select';
	}
</script>

<main class="absolute top-0 left-0 w-full h-full">
	<div
		class:pointer-events-none={drawing || selecting || blockPointerEvents(mode)}
		class="relative flex justify-center w-full h-full overflow-hidden"
	>
		<div
			class="absolute z-10 cursor-default shadow-lg border border-stone-300 bg-white max-w-full min-w-56 bottom-4 rounded-2xl px-2"
		>
			<Toolbar
				selected={tool}
				pointer={() => {
					tool = 'pointer';
					cursor = 'custom';
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
	</div>
	<div class="w-full h-full absolute top-0 left-0">
		{#if tool === 'pointer' && mode === 'select'}
			<Lasso x={last.x} y={last.y} {width} {height} completed={() => (selecting = false)} />
		{/if}

		<Canvas
			{tool}
			{mode}
			{selecting}
			{drawing}
			bind:cursor
			draw={() => (drawing = true)}
			drag={() => {
				mode = 'move';
				selecting = false;
			}}
			rotate={() => {
				mode = 'rotate';
			}}
			select={() => {
				mode = 'select';
			}}
			resize={() => {
				mode = 'resize';
				selecting = false;
			}}
			reset={() => {
				tool = 'pointer';
				mode = 'idle';
				selecting = false;
				drawing = false;
			}}
		/>
	</div>
</main>

<svelte:window
	onpointerdown={(event: PointerEvent) => {
		last = { x: event.offsetX, y: event.offsetY }
	}}
	onpointermove={(event: PointerEvent) => {
		mouse = { x: event.offsetX, y: event.offsetY }
	}}
	onmouseup={() => {
		selecting = false;
	}}
	onkeydown={(event) => {
		const key = event.key;

		tool = retrieve_tool_by_shortcut(key) ?? tool;

		if (tool === 'pointer') {
			cursor = 'custom';
			return;
		}

		if (tool === 'rectangle' || tool === 'ellipse' || tool === 'segment') {
			cursor = 'crosshair';
			return;
		}

		cursor = 'custom';
	}}
/>
