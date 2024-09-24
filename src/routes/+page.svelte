<script lang="ts">
	import Canvas from '$lib/components/Canvas.svelte';
	import Lasso from '$lib/components/Lasso.svelte';
	import Toolbar from '$lib/components/Toolbar.svelte';
	import type { DesenhucaMode } from '$lib/types';

	let mode: DesenhucaMode = $state('select');

	let drawing: boolean = $state(false);
	let selecting: boolean = $state(false);
	let dragging: boolean = $state(false);
	let resizing: boolean = $state(false);

	let prev_mouse = $state({ x: 0, y: 0 });
	let mouse = $state({ x: 0, y: 0 });

	function window_mousedown(event: MouseEvent) {
		const x = event.offsetX;
		const y = event.offsetY;

		prev_mouse.x = x;
		prev_mouse.y = y;
	}

	function window_mousemove(event: MouseEvent) {
		const x = event.offsetX;
		const y = event.offsetY;

		mouse.x = x;
		mouse.y = y;
	}
</script>

<main class="absolute top-0 left-0 w-full h-full">
	<div
		class:pointer-events-none={drawing || selecting || dragging}
		class="relative flex justify-center w-full h-full overflow-hidden"
	>
		<div class="absolute z-10 shadow-sm max-w-full bottom-4">
			<Toolbar
				selected={mode}
				select={() => (mode = 'select')}
				rectangle={() => (mode = 'rectangle')}
				ellipse={() => (mode = 'ellipse')}
				line={() => (mode = 'line')}
			/>
		</div>
		<!-- <div class="grid">
			<Zoom />
		</div> -->
	</div>
	<div class="w-full h-full absolute top-0 left-0">
		{#if selecting && mode === 'select'}
			<Lasso
				x={prev_mouse.x}
				y={prev_mouse.y}
				width={mouse.x - prev_mouse.x}
				height={mouse.y - prev_mouse.y}
				completed={() => (selecting = false)}
			/>
		{/if}

		<Canvas
			{resizing}
			{mode}
			{drawing}
			{selecting}
			{dragging}
			draw={() => (drawing = true)}
			select={() => (selecting = true)}
			drag={() => (dragging = true)}
			resize={() => (resizing = true)}
			defer={() => {
				mode = 'select';
				drawing = false;
				selecting = false;
				dragging = false;
				resizing = false;
			}}
		/>
	</div>
</main>

<svelte:window
	onmousedown={window_mousedown}
	onmousemove={window_mousemove}
	onmouseup={() => {
		selecting = false;
	}}
/>
