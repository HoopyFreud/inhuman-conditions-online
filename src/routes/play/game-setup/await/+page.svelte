<script lang="ts">
    import { goto } from "$app/navigation";

    import { Ellipsis } from "#lib/components/ui/loading-page-ellipsis/index.js";

	import { clientStateObject, clientRoleObject, sessionIDObject, webSocketObject } from "#lib/stateHandler.svelte.js"

    $effect(() => {
        if (clientStateObject.state.gameState !== "game-setup") {
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    })
</script>

<h2>Waiting for game setup</h2>

<Ellipsis />
