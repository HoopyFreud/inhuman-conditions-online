<script lang="ts">
	import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    import { page } from '$app/state';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientLastStatusCode, clientStateObject, clientRoleObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"
	import { joinGame } from "$lib/stateHandler.svelte"

    const urlSessionID = page.url.searchParams.get('room')

	let roomIsFullError = $state(false)
	let roomDoesNotExistError = $state(false)
	let joinGameError = $state(false)

    let stateError = $state(false)

    let websocketError = $derived(roomIsFullError || roomDoesNotExistError || joinGameError)

    let joinError = $derived(websocketError || stateError)

    onMount(async () => {
        if (urlSessionID !== null) {
            await joinGame(urlSessionID,"existing")
        }
        
        if (webSocketObject.websocket) {
            console.log("websocket established, joining existing room")
        }
        else {
            console.log("websocket initialization failed")
            switch(clientLastStatusCode.code) {
                case 4001:
                    roomIsFullError = true
                    break
                case 4002:
                    roomDoesNotExistError = true
                    break
                default: joinGameError = true
            }
        }

        stateError = !(
            clientStateObject.state.gameState === "game-setup" ||
            clientStateObject.state.gameState === "select-penalty-prelim" ||
            (clientStateObject.state.gameState === "select-penalty-final" && clientRoleObject.role === "suspect")
        )
        
        if (!joinError) {
            if (clientStateObject.state.gameState === "game-setup") {
                goto("/play/game-setup/await?room="+sessionIDObject.ID)
            }
            else if (clientStateObject.state.gameState === "select-penalty-prelim" && clientRoleObject.role === "suspect") {
                goto("/play/select-penalty-prelim/suspect-await?room="+sessionIDObject.ID)
            }
            else if (clientStateObject.state.gameState === "select-penalty-prelim" && clientRoleObject.role === "detective") {
                goto("/play/select-penalty-prelim/detective-do?room="+sessionIDObject.ID)
            }
            else if (clientStateObject.state.gameState === "select-penalty-final" && clientRoleObject.role === "suspect") {
                goto("/play/select-penalty-final/suspect-do?room="+sessionIDObject.ID)
            }
            else {
                console.log("No valid redirect, closing websocket")
                webSocketObject.websocket?.close()
            }
        }
    })
</script>

<svelte:head>
	<title>Identity Crisis - Play</title>
	<meta name="description" content="Join Identity Crisis Game" />
</svelte:head>

<h1>
    Identity Crisis
</h1>

<section class="game-area">
    {#if joinError}
    <Alert.Root variant="destructive">
        <AlertCircleIcon />
        {#if roomIsFullError}
        <Alert.Title>Room is full</Alert.Title>
        {/if}
        {#if roomDoesNotExistError}
        <Alert.Title>Room does not exist</Alert.Title>
        {/if}
        {#if joinGameError}
        <Alert.Title>Cannot join game</Alert.Title>
        {/if}
        <Alert.Description>
        <p>Return to the <a href="/">home page</a> and choose a different room to join.</p>
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