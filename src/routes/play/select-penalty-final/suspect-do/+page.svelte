<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCStateData } from "$lib/stateHandler.svelte"
	import type { IHCPenalty } from "$lib/gameObjectHandler.svelte."
	import { clientStateObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"
    import { updateGameState } from "$lib/stateHandler.svelte"
    import { getErrorContext } from '$lib/errorContext';

    import penaltyData from "$lib/gameData/penalties/penalties.json"
    
    const gameError = getErrorContext()

    let selectedPenalty: number | null = $state(null)
    let availablePenalties: IHCPenalty[] = $state([])
    let permanentPenalty: IHCPenalty | null = $state(null)

    let invalidPenaltySelection = $derived(selectedPenalty === null)

    let invalidDataError = $state(false)

    let validState = $derived(
        clientStateObject.state.gameState === "select-penalty-final" ||
        clientStateObject.state.gameState === "calibrate-penalty"
    )

    let stateUpdateError = $derived(!validState)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "calibrate-penalty",
        penaltyCardID: selectedPenalty
    })

    let disablePenaltyAddButton: boolean = $derived(selectedPenalty !== null)
    let disablePenaltyRemoveButton: boolean = $derived(selectedPenalty === null)
    let disableSelectPenalty: boolean = $derived(invalidPenaltySelection || invalidDataError || stateUpdateError || gameError())

    function removePenalty() {
        selectedPenalty = null
    }

    function addPenalty(penalty: IHCPenalty) {
        selectedPenalty = penalty.id
    }

    async function submitPenalty() {
        if (!disableSelectPenalty) {
            await updateGameState(gameStateUpdate)
            goto("/play/calibrate-penalty/suspect-await?room="+sessionIDObject.ID)
        }
    }

    onMount(() => {
        availablePenalties = [...penaltyData]
        if (clientStateObject.state.permanentPenalty) {
            permanentPenalty = availablePenalties[0]
        }
        if (Array.isArray(clientStateObject.state.penaltyCardID)) {
            // @ts-ignore - this is the isArray bug, clientStateObject.state.penaltyCardID can only be a [number, number] here
            availablePenalties.filter((penalty) => clientStateObject.state.penaltyCardID.includes(penalty.ID))
        }
        else {
            invalidDataError = true
        }
    })

    $effect(() => {
        if (stateUpdateError) {
            console.log("Failed state update, closing websocket")
            webSocketObject.websocket?.close()
        }
    })
</script>

<h2>Select Penalty</h2>
<p>
    Choose one the penalties shown below to play with this round.
</p>
{#if permanentPenalty !== null}
<p>
    The permanent penalty will be enforced in addition to the selected penalty.
</p>
{/if}

<div class="flex flex-row justify-around gap-2 mx-2 my-2">
    {#if permanentPenalty !== null}
        <Card.Root class="w-1/4 light">
            <Card.Header>
                <Card.Title>Permanent penalty: {permanentPenalty.text}</Card.Title>
            </Card.Header>
            <Card.Content class="mt-auto">
                <Button variant="outline" type="submit" disabled={true} class="w-fit m-auto mt-4">
                    <h3>Cannot be deselected</h3>
                </Button>
            </Card.Content>
        </Card.Root>
    {/if}
    {#each availablePenalties as availablePenalty}
        <Card.Root class="{permanentPenalty !== null ? 'w-1/4' : 'w-1/3'} {selectedPenalty === availablePenalty.id ? 'light' : ''}">
            <Card.Header>
                <Card.Title>{availablePenalty.text}</Card.Title>
            </Card.Header>
            <Card.Content class="mt-auto">
                {#if selectedPenalty === availablePenalty.id}
                    <Button variant="outline" type="submit" disabled={disablePenaltyRemoveButton} onclick={() => removePenalty()} class="w-fit m-auto mt-4">
                        <h3>Deselect</h3>
                    </Button>
                {:else}
                    <Button variant="outline" type="submit" disabled={disablePenaltyAddButton} onclick={() => addPenalty(availablePenalty)} class="w-fit m-auto mt-4">
                        <h3>Select</h3>
                    </Button>
                {/if}
            </Card.Content>
        </Card.Root>
    {/each}
</div>
<Button disabled={disableSelectPenalty} variant="outline" type="submit" onclick={async () => await submitPenalty()} class="w-fit m-auto mb-2"><h3>Select Penalty</h3></Button>

{#if invalidDataError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Bad incoming penalty data</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}
{#if stateUpdateError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Failed to update game state</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and choose a different room to join.</p>
    </Alert.Description>
</Alert.Root>
{/if}