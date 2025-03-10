<script lang="ts">
	import type { Tool } from '$lib/types';
	import Ellipse from './svgs/Ellipse.svelte';
	import Eraser from './svgs/Eraser.svelte';
	import Pencil from './svgs/Pencil.svelte';
	import Pointer from './svgs/Pointer.svelte';
	import Rectangle from './svgs/Rectangle.svelte';
	import Segment from './svgs/Segment.svelte';

	type Props = {
		selected: Tool;
		pointer: () => void;
		rectangle: () => void;
		ellipse: () => void;
		line: () => void;
	};

	let { selected, pointer, rectangle, ellipse, line }: Props = $props();
</script>

<ul class="flex justify-center items-center text-white gap-4 py-2">
	<li
		class="rounded-lg hover:bg-zinc-200 transition-all"
		class:bg-zinc-200={selected === 'pointer'}
	>
		<button
			onclick={() => pointer()}
			aria-label="move"
			class="p-2 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:stroke-stone-700"
		>
			<Pointer />
		</button>
	</li>

	<li class:bg-zinc-200={selected === 'pencil'} class="rounded-lg hover:bg-zinc-200 transition-all">
		<button aria-label="pencil" class="p-2 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:stroke-stone-700">
			<Pencil />
		</button>
	</li>

	<li
		class:bg-zinc-200={selected === 'rectangle'}
		class="rounded-lg hover:bg-zinc-200 transition-all"
	>
		<button
			class="p-2 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:stroke-stone-700"
			aria-label="rectangle"
			onmousedown={() => rectangle()}
		>
			<Rectangle />
		</button>
	</li>

	<li
		class:bg-zinc-200={selected === 'ellipse'}
		class="rounded-lg hover:bg-zinc-200 transition-all"
	>
		<button
			class="p-2 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:stroke-stone-700"
			aria-label="ellipse"
			onmousedown={() => ellipse()}
		>
			<Ellipse />
		</button>
	</li>

	<li
		class:bg-zinc-200={selected === 'segment'}
		class="rounded-lg hover:bg-zinc-200 transition-all"
	>
		<button
			class="p-2 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:stroke-stone-700"
			aria-label="line"
			onmousedown={() => line()}
		>
			<Segment />
		</button>
	</li>

	<li class:bg-zinc-200={selected === 'eraser'} class="rounded-lg hover:bg-zinc-200 transition-all">
		<button
			class="p-2 [&>svg]:w-4 [&>svg]:h-4 [&>svg]:stroke-stone-700"
			aria-label="line"
			onmousedown={() => line()}
		>
			<Eraser />
		</button>
	</li>
	<ul class="border-l border-stone-300 block text-stone-700 pl-4 pr-3">
		<li class="text-sm">100%</li>
	</ul>
</ul>
