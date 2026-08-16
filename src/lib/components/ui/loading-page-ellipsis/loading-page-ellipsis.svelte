<script lang="ts">
    import { type WithElementRef } from "#lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";

	const loadingElementTextSequence = [".","..","..."]

    let textElement = $state(loadingElementTextSequence[0])

    let {
		class: className,
		...props
	}: WithElementRef<HTMLAttributes<HTMLElement>> = $props();

    function loadingSequence() {
        let textIndex = 0
        textElement = loadingElementTextSequence[textIndex]
        setInterval(() => {
            if (textIndex < loadingElementTextSequence.length-1) {
                textIndex += 1
            }
            else {
                textIndex = 0
            }
            textElement = loadingElementTextSequence[textIndex]
        },500)
    }

    loadingSequence()
</script>

<h3 class={className}>{textElement}</h3>
