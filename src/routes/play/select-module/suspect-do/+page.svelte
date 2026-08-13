<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCStateData } from "$lib/stateHandler.svelte"
	import type { IHCPenalty, IHCModule } from "$lib/gameObjectHandler.svelte."
	import { clientStateObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"
    import { updateGameState } from "$lib/stateHandler.svelte"
    import { getErrorContext } from '$lib/errorContext';

    import penaltyData from "$lib/gameData/penalties/penalties.json"
    import moduleData from "$lib/gameData/modules/modules.json" 

    const gameError = getErrorContext()

    let selectedPenalty: IHCPenalty | null = $derived(penaltyData.find((penalty) => penalty.id === clientStateObject.state.penaltyCardID) ?? null)
    let invalidPenaltyError = $derived(selectedPenalty === null)

    let selectedModule: number | null = $state(null)
    let availableModules: IHCModule[] = $state([])
    let invalidModuleSelection = $derived(selectedModule === null)

    let validState = $derived(
        clientStateObject.state.gameState === "select-module" ||
        clientStateObject.state.gameState === "confirm-module"
    )
    
    let stateUpdateError = $derived(!validState)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "confirm-module",
        penaltyCardID: selectedModule
    })

    let disableModuleSelectButton: boolean = $derived(selectedModule !== null)
    let disableModuleDeselectButton: boolean = $derived(selectedModule === null)
    let disableSelectModule: boolean = $derived(invalidModuleSelection || invalidPenaltyError || stateUpdateError || gameError())

    function removeModule() {
        selectedModule = null
    }

    function addModule(module: IHCModule) {
        selectedModule = module.id
    }

    async function submitModule() {
        if (!disableSelectModule){
            await updateGameState(gameStateUpdate)
            goto("/play/confirm-module/suspect-await?room="+sessionIDObject.ID)
        }
    }

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
    })
</script>

<h2>Select Module</h2>
<p>
    Choose a module to play. You may consult with the detective player, but you have final authority over this decision.
</p>
<div class="flex flex-row justify-around gap-2 mx-2 my-2">
    {#each availableModules as availableModule}
        <Card.Root class="w-1/4 {selectedModule === availableModule.id? 'light' : ''}">
            <Card.Header>
                <Card.Title>{availableModule.name}</Card.Title>
            </Card.Header>
            <Card.Content class="mt-auto">
                {#if selectedModule === availableModule.id}
                    <img src={availableModule.lightIcon} alt={availableModule.name}/>
                    <Button variant="outline" type="submit" disabled={disableModuleDeselectButton} onclick={() => removeModule()} class="w-fit m-auto mt-4">
                        <h3>Deselect</h3>
                    </Button>
                {:else}
                    <img src={availableModule.darkIcon} alt={availableModule.name}/>
                    <Button variant="outline" type="submit" disabled={disableModuleSelectButton} onclick={() => addModule(availableModule)} class="w-fit m-auto mt-4">
                        <h3>Select"</h3>
                    </Button>
                {/if}
            </Card.Content>
        </Card.Root>
    {/each}
    </div>
<Button disabled={disableSelectModule} variant="outline" type="submit" onclick={async () => await submitModule()} class="w-fit m-auto mb-2"><h3>Select Module</h3></Button>

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