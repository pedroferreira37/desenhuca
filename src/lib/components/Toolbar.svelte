<script lang="ts">
	import type { Tool } from '$lib/types';

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
		<button onclick={() => pointer()} aria-label="move" class="block p-2">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="stroke-stone-700 w-4 h-4"><path d="m4 4 7.07 17 2.51-7.39L21 11.07z" /></svg
			>
		</button>
	</li>

	<li class:bg-zinc-200={selected === 'pencil'} class="rounded-lg hover:bg-zinc-200 transition-all">
		<button aria-label="pencil" class="p-2 block">
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="stroke-stone-700 w-4 h-4"
				><path
					d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"
				/></svg
			>
		</button>
	</li>

	<li
		class:bg-zinc-200={selected === 'rectangle'}
		class="rounded-lg hover:bg-zinc-200 transition-all"
	>
		<button class="p-2" aria-label="rectangle" onmousedown={() => rectangle()}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="stroke-stone-700 w-4 h-4"><rect width="18" height="18" x="3" y="3" rx="2" /></svg
			>
		</button>
	</li>

	<li
		class:bg-zinc-200={selected === 'ellipse'}
		class="rounded-lg hover:bg-zinc-200 transition-all"
	>
		<button class="p-2" aria-label="ellipse" onmousedown={() => ellipse()}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="stroke-stone-700 w-4 h-4"><circle cx="12" cy="12" r="10" /></svg
			>
		</button>
	</li>

	<li
		class:bg-zinc-200={selected === 'segment'}
		class="rounded-lg hover:bg-zinc-200 transition-all"
	>
		<button class="p-2" aria-label="line" onmousedown={() => line()}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="stroke-stone-700 w-4 h-4"><path d="M5 12h14" /></svg
			>
		</button>
	</li>
	<ul class="border-l border-stone-300 block text-stone-700 pl-4 pr-3">
		<li class="text-sm">100%</li>
	</ul>
</ul>
