<script lang="ts">
	type Props = {
		x: number;
		y: number;
		width: number;
		height: number;
		completed: () => void;
	};

	let { x, y, width, height, completed }: Props = $props();

	const is_width_negative = $derived(width < 0);
	const is_height_negative = $derived(height < 0);
</script>

<div
	style="
	left: {is_width_negative ? x + width : x}px; 
	top: {is_height_negative ? y + height : y}px; 
	width: {Math.abs(width)}px; 
	height: {Math.abs(height)}px;"
	onpointerup={() => completed()}
></div>

<style>
	div {
		position: absolute;
		border: 0.1rem solid rgba(137, 196, 244, 1);
		cursor: pointer;
		background: rgba(137, 196, 244, 0.1);
		pointer-events: none;
	}
</style>
