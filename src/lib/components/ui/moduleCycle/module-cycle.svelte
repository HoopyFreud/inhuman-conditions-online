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

    const width = 400
    const height = 400
    const radius = 150
    const arrowDist = 10
    const paddingRads = Math.PI/10;
    
    function draw () {
        if (context !== null) {
            const numRadsPerLetter = 2*Math.PI / textArray.length;
            context.translate(width/2, height/2);

            for(var i=0;i<textArray.length;i++){
                context.save();
                context.translate(radius*Math.cos(i*numRadsPerLetter),radius*Math.sin(i*numRadsPerLetter));
                context.fillText(textArray[i],0,0);
                context.restore();
                context.save()
                context.beginPath()
                context.arc(0,0,radius,(i*numRadsPerLetter)+paddingRads, ((i+1)*numRadsPerLetter)-paddingRads,false);
                context.stroke()
                context.restore()
                context.save()
                context.rotate((i*numRadsPerLetter)+paddingRads)
                context.translate(radius,0);
                context.beginPath()
                context.moveTo(arrowDist,arrowDist)
                context.lineTo(0,0)
                context.lineTo(-arrowDist,arrowDist)
                context.stroke()
                context.restore();
            }
        }
    }

    onMount(() => {
        const randomIndex = Math.floor(Math.random() * sequence.length)
        textArray = sequence.slice(randomIndex).concat(sequence.slice(0,randomIndex))
        context = canvas.getContext("2d")
        if (context !== null) {
            context.textAlign = "center"
            context.textBaseline = "middle"
            context.fillStyle = "oklch(0.985 0 0)"
            context.strokeStyle = "oklch(0.985 0 0)"
            context.font = "50px Circuit"
            draw()
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
