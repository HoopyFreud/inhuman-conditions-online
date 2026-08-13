<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Ellipsis } from "$lib/components/ui/loading-page-ellipsis";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCPenalty, IHCModule } from "$lib/gameObjectHandler.svelte."
	import { clientStateObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"

    import penaltyData from "$lib/gameData/penalties/penalties.json"
    import moduleData from "$lib/gameData/modules/modules.json" 

    let selectedPenalty: IHCPenalty | null = $derived(penaltyData.find((penalty) => penalty.id === clientStateObject.state.penaltyCardID) ?? null)
    let invalidPenaltyError = $derived(selectedPenalty === null)

    let availableModules: IHCModule[] = $state([])

    let validState = $derived(
        clientStateObject.state.gameState === "select-module" ||
        clientStateObject.state.gameState === "confirm-module"
    )
    
    let stateUpdateError = $derived(!validState)

    onMount(() => {
        availableModules = [...(moduleData as IHCModule[])]
    })

    $effect(() => {
        if (stateUpdateError) {
            console.log("Failed state update, closing websocket")
            webSocketObject.websocket?.close()
        }
        else if (invalidPenaltyError) {
            console.log("Client has invalid penalty selection, closing websocket")
            webSocketObject.websocket?.close()
        }
        else if (clientStateObject.state.gameState === "confirm-module") {
            goto("/play/confirm-module/detective-do?room="+sessionIDObject.ID)
        }
    })
</script>

<h2>Select Module</h2>
<p>
    Choose a module to play. You may consult with the detective player, but you have final authority over this decision.
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

{#if stateUpdateError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Failed to update game state</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and choose a different room to join.</p>
    </Alert.Description>
</Alert.Root>
{/if}
{#if invalidPenaltyError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Client has an invalid penalty</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}