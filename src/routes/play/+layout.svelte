<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';

	import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
	import { DisplayInput } from "$lib/components/ui/display-input/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import Copy from '@lucide/svelte/icons/copy';

    import { sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"
    
	let { children } = $props();

    let sessionID = $derived(sessionIDObject.ID)

    $effect(() => {
        if (
            webSocketObject.websocket !== null && (
                sessionID === "" ||
                page.url.searchParams.get("room") === null ||
                page.url.searchParams.get("room") !== sessionID
        )) {
            webSocketObject.websocket!.close()
        }
    })

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
    <div class="flex flex-row m-3 justify-between">
        <div class="w-fit">
            <Button variant="outline" aria-label="New Game" title="New Game" onclick={() => newGame()}>
                <h2 class="m-0! align-middle">Return</h2>
            </Button>
        </div>
        <div class="w-fit">
            <h3>Room Number</h3>
            <ButtonGroup.Root>
                <DisplayInput id="room" aria-label="Room Number" value={sessionID}/>
                <Button variant="outline" size="icon" aria-label="Copy" title="Copy" onclick={() => copyRoomLink()}>
                        <Copy/>
                    </Button>
            </ButtonGroup.Root>
        </div>
    </div>
    {@render children()}
</section>