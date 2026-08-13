<script lang="ts">
    import { goto } from "$app/navigation";

	import * as Alert from "$lib/components/ui/alert/index.js";
    import { Ellipsis } from "$lib/components/ui/loading-page-ellipsis";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientStateObject, clientRoleObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"

    let validState = $derived(
        clientStateObject.state.gameState === "game-setup" ||
        clientStateObject.state.gameState === "select-penalty-prelim"
    )

    let stateUpdateError = $derived(!validState)

    $effect(() => {
        if (stateUpdateError) {
            console.log("Failed state update, closing websocket")
            webSocketObject.websocket?.close()
        }
        else if (clientStateObject.state.gameState === "select-penalty-prelim" && clientRoleObject.role === "detective") {
            goto("/play/select-penalty-prelim/detective-do?room="+sessionIDObject.ID)
        }
        else if (clientStateObject.state.gameState === "select-penalty-prelim" && clientRoleObject.role === "suspect") {
            goto("/play/select-penalty-prelim/suspect-await?room="+sessionIDObject.ID)
        }
    })
</script>

<h2>Waiting for game setup</h2>

<Ellipsis />

{#if stateUpdateError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Failed to update game state</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and choose a different room to join.</p>
    </Alert.Description>
</Alert.Root>
{/if}