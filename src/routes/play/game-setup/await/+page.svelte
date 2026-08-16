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

<h2 class="max-w-3/4 mx-auto">Wait for Game Setup</h2>

<Ellipsis />
