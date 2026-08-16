<script lang="ts">
	import { onMount } from 'svelte'

    import type { WithElementRef } from "$lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";

    let {
		class: className,
        sequence,
		...props
	}: WithElementRef<HTMLAttributes<HTMLElement>> & {sequence: string[]} = $props();
    
    let textArray:string[] = []
    let canvas: HTMLCanvasElement
    let context: CanvasRenderingContext2D | null = null

    const width = 512
    const height = 1024
    const textLocations = [
        [462.584,620],
        [167.464,280],
        [403.560,310],
        [340,775],
        [226.488,685],
        [108.440,555]
    ]
    
    function drawText () {
        if (context !== null) {
            context.save()
            context.translate(width/2, height/2);

            for(var i=0;i<textArray.length;i++){
                context.translate(textLocations[i][0], textLocations[i][1]);
                context.fillText(textArray[i],0,0);
                context.restore();
            }
        }
    }

    onMount(() => {
        const randomIndex = Math.floor(Math.random() * sequence.length)
        textArray = sequence.slice(randomIndex).concat(sequence.slice(0,randomIndex))
        context = canvas.getContext("2d")
        if (context !== null) {
            const img = new Image();
            img.src = '/images/maze.svg'; 
            context.drawImage(img, 0, 0);
            context.font = "500, 24px, Circuit"
            context.textAlign = "center"
            context.textBaseline = "middle"
            drawText()
        }
    })
</script>

<canvas
    {width}
    {height}
    bind:this={canvas} 
    class={className}
>
</canvas>
