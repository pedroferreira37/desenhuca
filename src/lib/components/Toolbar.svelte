<script lang="ts">
	import type { Tools } from '$lib/types';

	type Props = {
		selected: Tools;
		pointer: () => void;
		rectangle: () => void;
		ellipse: () => void;
		line: () => void;
	};

	let { selected, pointer, rectangle, ellipse, line }: Props = $props();
</script>

<ul class="flex justify-center py-2 rounded-md bg-white text-white h-12 gap-4 px-2 border">
	<li
		class="rounded hover:bg-slate-200 p-2 transition-all flex items-center justify-center relative"
		class:bg-slate-200={selected === 'pointer'}
	>
		<button onclick={() => pointer()}>
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
			<p class="text-[12px] text-stone-700 absolute bottom-0 right-0 mr-1">1</p>
		</button>
	</li>

	<li
		class:bg-slate-200={selected === 'free-hand-draw'}
		class="rounded hover:bg-slate-200 transition-all p-2 flex items-center justify-center relative"
	>
		<button>
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

			<p class="text-[12px] text-stone-700 absolute bottom-0 right-0 mr-1">2</p>
		</button>
	</li>

	<li
		class:bg-slate-200={selected === 'rectangle'}
		class="rounded hover:bg-slate-200 transition-all flex items-center justify-center relative"
	>
		<button class="p-2" onmousedown={() => rectangle()}>
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

			<p class="text-[12px] text-stone-700 absolute bottom-0 right-0 mr-1">3</p>
		</button>
	</li>

	<li
		class:bg-slate-200={selected === 'ellipse'}
		class="rounded hover:bg-slate-200 transition-all flex items-center justify-center"
	>
		<button class="p-2" onmousedown={() => ellipse()}>
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
		class:bg-slate-200={selected === 'line'}
		class="rounded hover:bg-slate-200 transition-all flex items-center justify-center"
	>
		<button class="p-2" onmousedown={() => line()}>
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
</ul>
