<script lang="ts">
    import { goto } from "$app/navigation";

	import * as Alert from "$lib/components/ui/alert/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientStateObject, clientRoleObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"

    let loadingElementText = $state("")

    let validState = $derived(
        clientStateObject.state.gameState === "game-setup" ||
        clientStateObject.state.gameState === "select-penalty-prelim"
    )
    let stateUpdateError = $derived(!validState)
    let websocketError = $derived(webSocketObject.websocket === null)

    const loadingElementTextSequence = ["",".","..","..."]

    function loadingSequence() {
        let textIndex = 0
        loadingElementText = loadingElementTextSequence[textIndex]
        while(true) {
            setTimeout(() => {
                if (textIndex < loadingElementTextSequence.length) {
                    textIndex += 1
                }
                else {
                    textIndex = 0
                }
                loadingElementText = loadingElementTextSequence[textIndex]
            },500)
        }
    }

    $effect(() => {
        if (websocketError) {
            console.log("Websocket failure")
        }
        else if (stateUpdateError) {
                console.log("Failed state update, closing websocket")
                webSocketObject.websocket?.close()
        }
        else {
            if (clientStateObject.state.gameState === "select-penalty-prelim" && clientRoleObject.role === "detective") {
            goto("/play/select-penalty-prelim/detective-do?room="+sessionIDObject.ID)
            }
            else if (clientStateObject.state.gameState === "select-penalty-prelim" && clientRoleObject.role === "suspect") {
            goto("/play/select-penalty-prelim/suspect-await?room="+sessionIDObject.ID)
            }
        }
    })

    loadingSequence()
</script>

<svelte:head>
	<title>Identity Crisis - Play</title>
	<meta name="description" content="Play Identity Crisis" />
</svelte:head>

<h2>Waiting for game setup</h2>

<h3>{loadingElementText}</h3>

{#if stateUpdateError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Failed to update game state</Alert.Title>
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