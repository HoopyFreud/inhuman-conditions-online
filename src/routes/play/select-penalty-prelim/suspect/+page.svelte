<script lang="ts">
    import { goto } from "$app/navigation";

	import * as Alert from "#lib/components/ui/alert/index.js";
    import { Ellipsis } from "#lib/components/ui/loading-page-ellipsis/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject } from "#lib/stateHandler.svelte.js"

    let roleError = $derived(clientRoleObject.role !== "suspect")

    $effect(() => {
        if (webSocketObject.websocket !== null && clientStateObject.state.gameState !== "select-penalty-prelim") {
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    })
</script>

<h2 class="max-w-3/4 mx-auto">Wait for Penalty Selection</h2>

<Ellipsis />

{#if roleError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Wrong role</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}
