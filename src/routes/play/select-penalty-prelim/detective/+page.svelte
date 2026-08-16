<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

    import { knuthShuffle } from 'knuth-shuffle'

	import type { IHCStateData } from "$lib/stateHandlerTypes.svelte"
	import type { IHCPenalty } from "$lib/gameObjectTypes.svelte"
	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"
    import { updateGameState } from "$lib/stateHandler.svelte"
    import { getErrorContext } from '$lib/errorContext';

    import penaltyData from "$lib/gameData/penalties/penalties.json"

    const gameError = getErrorContext()

    let selectedPenalties: number[] = $state([])
    let availablePenalties: IHCPenalty[] = $state([])
    let invalidPenaltySelection = $derived(selectedPenalties.length !== 2)
    
    let permanentPenalty: IHCPenalty | null = $derived(clientStateObject.state.permanentPenalty ? penaltyData[0] as IHCPenalty : null)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "select-penalty-final",
        penaltyCardID: invalidPenaltySelection ? null : selectedPenalties as [number, number]
    })

    let roleError = $derived(clientRoleObject.role !== "detective")

    let disablePenaltyAddButton: boolean = $derived(selectedPenalties.length >= 2)
    let disablePenaltyRemoveButton: boolean = $derived(selectedPenalties.length === 0)
    let disableSelectPenalty: boolean = $derived(invalidPenaltySelection || roleError || gameError())

    function removePenalty(penalty: IHCPenalty) {
        selectedPenalties = selectedPenalties.filter((id) => id !== penalty.id)
    }

    function addPenalty(penalty: IHCPenalty) {
        if (selectedPenalties.length < 2 && !selectedPenalties.includes(penalty.id)) {
            selectedPenalties.push(penalty.id)
        }
    }

    async function submitPenalties() {
        if (!disableSelectPenalty){
            await updateGameState(gameStateUpdate)
            await goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    }

    afterNavigate(() => {
        if (clientStateObject.state.permanentPenalty) {
            permanentPenalty = penaltyData[0]
            availablePenalties = penaltyData.slice(1)
        }
        if (clientStateObject.state.digitalGame) {
            availablePenalties = penaltyData.filter((penalty) => penalty.digitalSafe)
        }
        availablePenalties = knuthShuffle(availablePenalties).slice(0,3)
        console.log(penaltyData)
        console.log(availablePenalties)
    })
</script>

<h2>Select Penalties</h2>
<p>
    Choose two of the penalties shown below to give to the suspect. The suspect will choose the penalty for this round from among them.
</p>
{#if permanentPenalty !== null}
<p>
    The permanent penalty will be enforced in addition to the one the suspect selects.
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
        <Card.Root class="{permanentPenalty !== null ? 'w-1/4' : 'w-1/3'} {selectedPenalties.includes(availablePenalty.id)? 'light' : ''}">
            <Card.Header>
                <Card.Title>{availablePenalty.text}</Card.Title>
            </Card.Header>
            <Card.Content class="mt-auto">
                {#if selectedPenalties.includes(availablePenalty.id)}
                    <Button variant="outline" type="submit" disabled={disablePenaltyRemoveButton} onclick={() => removePenalty(availablePenalty)} class="w-fit m-auto mt-4">
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
<Button disabled={disableSelectPenalty} variant="outline" type="submit" onclick={async () => await submitPenalties()} class="w-fit m-auto mb-2"><h3>Select Penalties</h3></Button>

{#if roleError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Wrong role</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}