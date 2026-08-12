<script lang="ts">
    import { goto } from "$app/navigation";

	import * as Alert from "$lib/components/ui/alert/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientStateObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"

    const loadingElementTextSequence = ["",".","..","..."]

    let loadingElementText = $state("")

    let validState = $derived(
        clientStateObject.state.gameState === "select-penalty-prelim" ||
        clientStateObject.state.gameState === "select-penalty-final"
    )

    let stateUpdateError = $derived(!validState)

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
        if (stateUpdateError) {
            console.log("Failed state update, closing websocket")
            webSocketObject.websocket?.close()
        }
        else if (clientStateObject.state.gameState === "select-penalty-final") {
            goto("/play/select-penalty-final/suspect-do?room="+sessionIDObject.ID)
        }
    })

    loadingSequence()
</script>

<h2>Waiting for detective to select penalties</h2>

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