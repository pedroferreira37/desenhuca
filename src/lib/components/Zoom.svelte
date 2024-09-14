<script lang="ts">
	type Props = {
		scale: number;
		upscale: () => void;
		downscale: () => void;
	};

	let { scale, upscale, downscale }: Props = $props();

	scale = 3000;
</script>

<ul>
	<li>
		<button onclick={() => downscale()}>
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
				class="lucide lucide-minus"><path d="M5 12h14" /></svg
			>
		</button>
	</li>
	<li class="scale">
		<span>{scale.toFixed(0)}%</span>
	</li>
	<li>
		<button onclick={() => upscale()}>
			<svg
				xmlns="http://www.w3.org/2000/svg"
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="#37352e"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
				class="lucide lucide-square"><path d="M5 12h14" /><path d="M12 5v14" /></svg
			>
		</button>
	</li>
</ul>
