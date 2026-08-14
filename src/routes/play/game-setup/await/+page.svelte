<script lang="ts">
    import { goto } from "$app/navigation";

    import { Ellipsis } from "$lib/components/ui/loading-page-ellipsis";

	import { clientStateObject, clientRoleObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"

    $effect(() => {
        if (clientStateObject.state.gameState !== "game-setup") {
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    })
</script>

<h2>Waiting for game setup</h2>

<Ellipsis />