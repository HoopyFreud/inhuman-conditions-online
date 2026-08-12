<script lang="ts">
    import { page } from '$app/state';
    import { goto } from '$app/navigation';

	import * as Alert from "$lib/components/ui/alert/index.js";
	import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
	import { DisplayInput } from "$lib/components/ui/display-input/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import Copy from '@lucide/svelte/icons/copy';
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

    import { setErrorContext } from '$lib/errorContext';
    import { sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"

    let sessionID = $derived(sessionIDObject.ID)
    const urlSessionID = page.url.searchParams.get('room')
    
    let sessionIDMismatchError = $derived(urlSessionID !== sessionID)
    let websocketError = $derived(webSocketObject.websocket === null)

    function newGame() {
		goto("/")
	}

    function copyRoomLink() {
		navigator.clipboard.writeText(page.url.href)
	}

    setErrorContext(() => sessionIDMismatchError || websocketError)

    $effect(() => {
        if (sessionIDMismatchError) {
            console.log("Session ID mismatch")
            webSocketObject.websocket!.close()
        }
        if (websocketError) {
            console.log("Websocket failure")
        }
    })
    
	let { children } = $props();
</script>

<svelte:head>
	<title>Identity Crisis - Play</title>
	<meta name="description" content="Play Identity Crisis" />
</svelte:head>

<h1>
    Identity Crisis
</h1>

<section class="game-area">
    <div class="flex flex-row m-3 justify-between">
        <div class="w-fit">
            <Button variant="outline" aria-label="New Game" title="New Game" onclick={() => newGame()}>
                <h2 class="m-0! align-middle">New Game</h2>
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
    {#if sessionIDMismatchError}
    <Alert.Root variant="destructive">
        <AlertCircleIcon />
        <Alert.Title>Session ID mismatch</Alert.Title>
        <Alert.Description>
        <p>Return to the <a href="/">home page</a> and join room again.</p>
        </Alert.Description>
    </Alert.Root>
    {/if}
    {#if websocketError}
    <Alert.Root variant="destructive">
        <AlertCircleIcon />
        <Alert.Title>Websocket closed unexpectedly</Alert.Title>
        <Alert.Description>
        <p>Return to the <a href="/">home page</a> and try again.</p>
        </Alert.Description>
    </Alert.Root>
    {/if}
</section>