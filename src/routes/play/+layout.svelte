<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';

	import * as Alert from "#lib/components/ui/alert/index.js";
	import * as ButtonGroup from "#lib/components/ui/button-group/index.js";
	import { DisplayInput } from "#lib/components/ui/display-input/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import Copy from '@lucide/svelte/icons/copy';
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

    import { setErrorContext } from '#lib/errorContext.js';
    import { clientStateObject, clientRoleObject, sessionIDObject, webSocketObject } from "#lib/stateHandler.svelte.js"
    import { joinGame } from "#lib/stateHandler.svelte.js"

    let retry = false

    let sessionID = $derived(sessionIDObject.ID)
    const urlSessionID = page.url.searchParams.get('room')
    
    let sessionIDMismatchError = $derived(urlSessionID !== sessionID)
    let websocketError = $derived(webSocketObject.websocket === null)

    function newGame() {
		goto("/")
	}

    function copyRoomLink() {
		navigator.clipboard.writeText(page.url.host+"/join?room="+urlSessionID)
	}

    async function retryJoin() {
        if (urlSessionID !== null) {
            await joinGame(urlSessionID,"existing")
        }
        if (webSocketObject !== null) {
            retry = false
            const goUrl = "/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+urlSessionID
            if (goUrl !== page.url.pathname + page.url.search) {
                await goto(goUrl)
            }
        }
    }

    setErrorContext(() => sessionIDMismatchError || websocketError)

    onMount(async () => {
        if (urlSessionID !== null && webSocketObject.websocket === null) {
            console.log("trying to establish websocket")
            sessionIDObject.ID = urlSessionID
            await joinGame(urlSessionID,"existing")
        }
    })

    $effect(() => {
        if (sessionIDMismatchError) {
            console.log("Session ID mismatch")
            webSocketObject.websocket?.close()
            webSocketObject.websocket = null
        }
        if (websocketError) {
            console.log("Websocket failure")
            if (!retry) {
                console.log("attempting to reconnect")
                retry = true
                retryJoin()
            }
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
