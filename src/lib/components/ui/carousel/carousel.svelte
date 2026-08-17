<script lang="ts">
	import { cn, type WithElementRef } from "#lib/utils.js";
	import {
		type CarouselAPI,
		type CarouselProps,
		type EmblaContext,
		setEmblaContext,
	} from "./context.js";

	let {
		ref = $bindable(null),
		opts = {},
		plugins = [],
		setApi = () => {},
		orientation = "horizontal",
		class: className,
		children,
		...restProps
	}: WithElementRef<CarouselProps> = $props();

	// svelte-ignore state_referenced_locally
	let carouselState = $state<EmblaContext>({
		api: undefined,
		goToPrev,
		goToNext,
		orientation,
		canGoToNext: false,
		canGoToPrev: false,
		handleKeyDown,
		options: opts,
		plugins,
		onInit,
		scrollSnaps: [],
		selectedIndex: 0,
		goTo,
	});

	setEmblaContext(carouselState);

	function goToPrev() {
		carouselState.api?.goToPrev();
	}

	function goToNext() {
		carouselState.api?.goToNext();
	}

	function goTo(index: number, instant?: boolean) {
		carouselState.api?.goTo(index, instant);
	}

	function onSelect() {
		if (!carouselState.api) return;
		carouselState.selectedIndex = carouselState.api.selectedSnap();
		carouselState.canGoToNext = carouselState.api.canGoToNext();
		carouselState.canGoToPrev = carouselState.api.canGoToPrev();
	}

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === "ArrowLeft") {
			e.preventDefault();
			goToPrev();
		} else if (e.key === "ArrowRight") {
			e.preventDefault();
			goToNext();
		}
	}

	function onInit(event: CustomEvent<CarouselAPI>) {
		carouselState.api = event.detail;
		setApi(carouselState.api);
		carouselState.scrollSnaps = carouselState.api.snapList();
		carouselState.api.on("select", onSelect);
		onSelect();
	}

	$effect(() => {
		return () => {
			carouselState.api?.off("select", onSelect);
		};
	});
</script>

<div
	bind:this={ref}
	data-slot="carousel"
	class={cn("relative", className)}
	role="region"
	aria-roledescription="carousel"
	{...restProps}
>
	{@render children?.()}
</div>
