<script lang="ts">
	import Canvas from '$lib/components/Canvas.svelte';
	import Lasso from '$lib/components/Lasso.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import type { Cursor, Tools } from '$lib/types';
	import { switchToolByKey } from '$lib/util';

	let tool: Tools = $state('pointer');
	let behavior: 'select' | 'drag' | 'resize' | 'default' = $state('default');

	let cursor_glyph: Cursor = $state('default');

	let drawing: boolean = $state(false);
	let selecting: boolean = $state(false);

	let prevMouse = $state({ x: 0, y: 0 });
	let mouse = $state({ x: 0, y: 0 });

	function isPointerEvsBlocked(behavior: 'select' | 'drag' | 'resize' | 'default') {
		return behavior === 'drag' || behavior === 'resize' || behavior === 'select';
	}
</script>

<main class="absolute top-0 left-0 w-full h-full">
	<div
		class:pointer-events-none={drawing || selecting || isPointerEvsBlocked(behavior)}
		class="relative flex justify-center w-full h-full overflow-hidden"
	>
		<div class="absolute z-10 shadow-sm max-w-full bottom-4">
			<Toolbar
				selected={tool}
				pointer={() => {
					tool = 'pointer';
					cursor_glyph = 'default';
				}}
				rectangle={() => {
					tool = 'rectangle';
					cursor_glyph = 'crosshair';
				}}
				ellipse={() => (tool = 'ellipse')}
				line={() => (tool = 'line')}
			/>
		</div>
		<!-- <div class="grid">
			<Zoom />
		</div> -->
	</div>
	<div class="w-full h-full absolute top-0 left-0">
		{#if behavior === 'select'}
			<Lasso
				x={prevMouse.x}
				y={prevMouse.y}
				width={mouse.x - prevMouse.x}
				height={mouse.y - prevMouse.y}
				completed={() => (selecting = false)}
			/>
		{/if}

		<Canvas
			{tool}
			{behavior}
			{selecting}
			{drawing}
			bind:cursor_glyph
			select={() => {
				behavior = 'select';
			}}
			draw={() => (drawing = true)}
			drag={() => {
				behavior = 'drag';
				selecting = false;
			}}
			resize={() => {
				behavior = 'resize';
				selecting = false;
			}}
			defer={() => {
				tool = 'pointer';
				behavior = 'default';
				selecting = false;
				drawing = false;
			}}
		/>
	</div>
</main>

<svelte:window
	onpointerdown={(event) => {
		const x = event.offsetX;
		const y = event.offsetY;

		prevMouse.x = x;
		prevMouse.y = y;
	}}
	onpointermove={(event) => {
		const x = event.offsetX;
		const y = event.offsetY;

		mouse.x = x;
		mouse.y = y;
	}}
	onmouseup={() => {
		selecting = false;
	}}
	onkeydown={(event) => {
		const key = event.key;
		tool = switchToolByKey(key);

		if (tool === 'rectangle') {
			cursor_glyph = 'crosshair';
		}
	}}
/>
