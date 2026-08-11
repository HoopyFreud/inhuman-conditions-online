<script lang="ts">
    import { page } from '$app/state';

	import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
	import { DisplayInput } from "$lib/components/ui/display-input/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import Copy from '@lucide/svelte/icons/copy';
    
    import { goto } from '$app/navigation';
    
	let { children } = $props();

    let sessionID = $state("TEST")

    function newGame() {
		goto("/")
	}

    function copyRoomLink() {
		navigator.clipboard.writeText(page.url.href)
	}
</script>

<h1>
    Identity Crisis
</h1>

<section class="game-area">
<div class="m-3 mr-auto top-0 left-0 w-fit">
    <Button variant="outline" size="icon" 
        aria-label="New Game"
        title="New Game"
        onclick={() => newGame()}
    >
        
    </Button>
</div>
<div class="m-3 ml-auto top-0 right-0 w-fit">
    <h3>Room Number</h3>
    <ButtonGroup.Root>
        <DisplayInput id="room" aria-label="Room Number" value={sessionID}/>
        <Button variant="outline" size="icon" 
                aria-label="Copy"
                title="Copy"
                onclick={() => copyRoomLink()}
            >
                <Copy/>
            </Button>
    </ButtonGroup.Root>
</div>
{@render children()}
</section>