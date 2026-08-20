<script lang="ts">
    import { goto } from '$app/navigation';
    
	import * as Alert from "#lib/components/ui/alert/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientRoleObject, clientStateObject, webSocketObject } from "#lib/stateHandler.svelte.js"
    import { resetGameSession } from "#lib/stateHandler.svelte.js"

    let roleError = $derived(clientRoleObject.role !== "detective")

    async function restartGame() {
        await resetGameSession()
    }

    $effect(() => {
        if (webSocketObject.websocket !== null && clientStateObject.state.gameState !== "end-game-lose-together") {
            goto("/play/game-setup/do")
        }
    })
</script>
<h2 class="max-w-3/4 mx-auto">Success</h2>
<div class="flex flex-col gap-2 w-3/4 text-left mx-auto">
    <p>
        You did it. You got out. Or you killed them. Either way, you're a step closer to freedom. Don't worry about the blood.
    </p>
</div>
<Button variant="outline" type="submit" onclick={async () => await restartGame()} class="w-fit mx-auto"><h3>Play again</h3></Button>

{#if roleError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Wrong role</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}
