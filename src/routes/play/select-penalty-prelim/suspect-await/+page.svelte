<script lang="ts">
    import { goto } from "$app/navigation";

	import * as Alert from "$lib/components/ui/alert/index.js";
    import { Ellipsis } from "$lib/components/ui/loading-page-ellipsis";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"

    let validState = $derived(
        clientStateObject.state.gameState === "select-penalty-prelim" ||
        clientStateObject.state.gameState === "select-penalty-final"
    )

    let stateUpdateError = $derived(!validState)

    let roleError = $derived(clientRoleObject.role !== "detective")

    $effect(() => {
        if (stateUpdateError) {
            console.log("Failed state update, closing websocket")
            webSocketObject.websocket?.close()
        }
        else if (clientStateObject.state.gameState === "select-penalty-final") {
            goto("/play/select-penalty-final/suspect-do?room="+sessionIDObject.ID)
        }
    })
</script>

<h2>Waiting for detective to select penalties</h2>

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
{#if roleError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Wrong role</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}