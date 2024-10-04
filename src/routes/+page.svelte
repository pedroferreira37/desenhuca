<script lang="ts">
	import Canvas from '$lib/components/Canvas.svelte';
	import Lasso from '$lib/components/Lasso.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import type { CursorStyle, Tools } from '$lib/types';

	let tool: Tools = $state('pointer');
	let behavior: 'drag' | 'resize' | 'none' = $state('none');

	let cursor_style: CursorStyle = $state('default');

	let drawing: boolean = $state(false);
	let selecting: boolean = $state(false);

	let prev_mouse = $state({ x: 0, y: 0 });
	let mouse = $state({ x: 0, y: 0 });

	function is_pointer_evs_blocked(behavior: 'drag' | 'resize' | 'none') {
		return behavior === 'drag' || behavior === 'resize';
	}
</script>

<main class="absolute top-0 left-0 w-full h-full">
	<div
		class:pointer-events-none={drawing || selecting || is_pointer_evs_blocked(behavior)}
		class="relative flex justify-center w-full h-full overflow-hidden"
	>
		<div class="absolute z-10 shadow-sm max-w-full bottom-4">
			<Toolbar
				selected={tool}
				pointer={() => (tool = 'pointer')}
				rectangle={() => {
					tool = 'rectangle';
					cursor_style = 'crosshair';
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
		{#if tool === 'pointer' && selecting}
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
			{behavior}
			{selecting}
			{drawing}
			bind:cursor_style
			select={() => (selecting = true)}
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
				behavior = 'none';
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

		prev_mouse.x = x;
		prev_mouse.y = y;
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
/>
