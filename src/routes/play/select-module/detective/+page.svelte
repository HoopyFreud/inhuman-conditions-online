<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Ellipsis } from "$lib/components/ui/loading-page-ellipsis";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCModule } from "$lib/gameObjectTypes.svelte"
	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject, gamePenalties } from "$lib/stateHandler.svelte"

    import moduleData from "$lib/gameData/modules/modules.json"

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    let availableModules: IHCModule[] = $state([])

    let roleError = $derived(clientRoleObject.role !== "detective")

    let invalidDataError = $derived(gamePenalties.currentPenalties === null)

    afterNavigate(() => {
        availableModules = [...(moduleData as IHCModule[])]
    })

    $effect(() => {
        if (invalidDataError) {
            console.log("Bad penalty data, closing websocket")
            webSocketObject.websocket?.close()
        }
        else if (clientStateObject.state.gameState !== "select-module") {
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    })
</script>

<h2>Select Module</h2>
<p>
    The suspect will now choose a module to play. You may offer input, but they have final authority over this decision.
</p>
<div class="flex flex-row justify-around gap-2 mx-2 my-2">
    {#each availableModules as availableModule}
        <Card.Root class="w-1/4">
            <Card.Header>
                <Card.Title>{availableModule.name}</Card.Title>
            </Card.Header>
            <Card.Content class="mt-auto">
                <img src={availableModule.darkIcon} alt={availableModule.name}/>
            </Card.Content>
        </Card.Root>
    {/each}
</div>

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
{#if invalidDataError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Bad incoming penalty data</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}