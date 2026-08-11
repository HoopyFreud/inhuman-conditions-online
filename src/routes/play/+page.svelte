<script lang="ts">
    import { goto } from '$app/navigation';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientLastStatusCode, clientStateObject, clientRoleObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"
	import { joinGame } from "$lib/stateHandler.svelte"

	let roomIsFullError = $state(false)
	let roomDoesNotExistError = $state(false)
	let joinGameError = $state(false)

    let joinError = $derived(roomIsFullError || roomDoesNotExistError || joinGameError)

    $effect(() => {
        (async () => {
            await joinGame(sessionIDObject.ID,"existing")
            if (webSocketObject.websocket) {
                console.log("websocket established, joining existing room")
                if (clientStateObject.state.gameState === "role-selection") {
                    goto("/play/await-select-role?"+sessionIDObject.ID)
                }
                else if (clientStateObject.state.gameState === "penalty-selection" && clientRoleObject.role === "detective") {
                    goto("/play/detective-select-penalty?"+sessionIDObject.ID)
                }
                else if (clientStateObject.state.gameState === "penalty-selection" && clientRoleObject.role === "suspect") {
                    goto("/play/suspect-await-select-penalty?"+sessionIDObject.ID)
                }
                else if (clientStateObject.state.gameState === "penalty-calibration" && clientRoleObject.role === "suspect") {
                    goto("/play/calibrate-penalty?"+sessionIDObject.ID)
                }
                else {
                    webSocketObject.websocket.close()
                    console.log("Can't join game, closing websocket")
                    joinGameError = true
                }
            }
            else {
                console.log("websocket initialization failed")
                switch(clientLastStatusCode.code) {
                    case 4001: roomIsFullError = true
                    case 4002: roomDoesNotExistError = true
                    default: joinGameError = true
                }
            }
        })
    })
</script>

<svelte:head>
	<title>Identity Crisis - Play</title>
	<meta name="description" content="Play Identity Crisis" />
</svelte:head>


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
    <p>Return to the home page and choose a different room number.</p>
    </Alert.Description>
</Alert.Root>
{/if}