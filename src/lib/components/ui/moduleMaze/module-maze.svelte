<script lang="ts">
	import { onMount } from 'svelte'

    import type { WithElementRef } from "#lib/utils.js";
    import type { HTMLAttributes } from "svelte/elements";

    import maze from "./maze.svg?url"

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
        [462.584,625],
        [167.464,280],
        [403.560,310],
        [340,780],
        [226.488,705],
        [108.440,575]
    ]
    
    function draw () {
        if (context !== null) {
            const img = new Image();
            img.onload = () => context?.drawImage(img, 0, 0)
            img.src = maze; 
            for(var i=0;i<textArray.length;i++){
                context.save()
                context.translate(textLocations[i][0], textLocations[i][1]);
                context.fillText(textArray[i],0,0);
                context.restore();
            }
        }
    }

    onMount(async () => {
        const randomIndex = Math.floor(Math.random() * sequence.length)
        textArray = sequence.slice(randomIndex).concat(sequence.slice(0,randomIndex))
        context = canvas.getContext("2d")
        if (context !== null) {
            document.fonts.ready.then(async (fontFaceSet) => {
                // Any operation that needs to be done only after all used fonts
                // have finished loading can go here.
                await [...fontFaceSet].find((fontFace) => fontFace.family == '"Xirod"')?.load()
                //we just checked if context exists
                context!.textAlign = "center"
                context!.textBaseline = "middle"
                context!.fillStyle = "oklch(0.985 0 0)"
                context!.strokeStyle = "oklch(0.985 0 0)"
                context!.font = "50px Xirod"
                draw()
            })
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
