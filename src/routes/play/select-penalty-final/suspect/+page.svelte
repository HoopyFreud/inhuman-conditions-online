<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    
	import * as Alert from "#lib/components/ui/alert/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCStateData } from "#lib/stateHandlerTypes.svelte.js"
	import type { IHCPenalty } from "#lib/gameObjectTypes.svelte.js"
	import { clientRoleObject, clientStateObject, sessionIDObject } from "#lib/stateHandler.svelte.js"
    import { updateGameState } from "#lib/stateHandler.svelte.js"
    import { getErrorContext } from '#lib/errorContext.js';

    import penaltyData from "#lib/gameData/penalties/penalties.json"


    const gameError = getErrorContext()

    // @ts-ignore - this is the isArray bug, clientStateObject.state.penaltyCardID can only be a [number, number] here
    let availablePenalties = $derived(Array.isArray(clientStateObject.state?.penaltyCardID) ? penaltyData.filter((penalty) => clientStateObject.state.penaltyCardID?.includes(penalty.id)) as IHCPenalty[] : [])
    let selectedPenalty: number | null = $state(null)
    let permanentPenalty: IHCPenalty | null = $derived(clientStateObject.state.permanentPenalty ? penaltyData[0] as IHCPenalty : null)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "calibrate-penalty",
        penaltyCardID: selectedPenalty
    })

    let invalidPenaltySelection = $derived(selectedPenalty === null);
    let roleError = $derived(clientRoleObject.role !== "suspect");
    let invalidDataError = $derived(availablePenalties.length === 0 && clientStateObject.state.gameState === "select-penalty-final");
    let disablePenaltyRemoveButton: boolean = $derived(selectedPenalty === null);
    let disableSelectPenalty: boolean = $derived(invalidPenaltySelection || roleError || invalidDataError || gameError());

    function removePenalty() {
        selectedPenalty = null
    }

    function addPenalty(penalty: IHCPenalty) {
        selectedPenalty = penalty.id
    }

    async function submitPenalty() {
        if (!disableSelectPenalty) {
            await updateGameState(gameStateUpdate)
            await goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    }
</script>

<h2 class="max-w-3/4 mx-auto">Penalty Selection</h2>
<div class="w-3/4 text-left mx-auto">
    <p>
        Choose one of the penalties shown below to play with this round.
    </p>
    {#if permanentPenalty !== null}
    <p>
        The permanent penalty will be enforced in addition to the selected penalty.
    </p>
    {/if}
</div>

<div class="flex gap-2 my-4 mx-auto w-3/4 flex-col">
    {#if permanentPenalty !== null}
        <Card.Root class="w-full light">
            <Card.Content class="flex flex-col h-full gap-2 justify-between">
                <p>Permanent penalty: {permanentPenalty.text}</p>
                <Button variant="outline" type="submit" disabled={true} class="w-fit mx-auto">
                    <h3>Cannot be deselected</h3>
                </Button>
            </Card.Content>
        </Card.Root>
    {/if}
    {#each availablePenalties as availablePenalty}
        <Card.Root class="w-full {selectedPenalty === availablePenalty.id ? 'light' : ''}">
            <Card.Content class="flex flex-col h-full gap-2 justify-between">
                <p>{availablePenalty.text}</p>
                {#if selectedPenalty === availablePenalty.id}
                    <Button variant="outline" type="submit" disabled={disablePenaltyRemoveButton} onclick={() => removePenalty()} class="w-fit mx-auto">
                        <h3>Deselect</h3>
                    </Button>
                {:else}
                    <Button variant="outline" type="submit" onclick={() => addPenalty(availablePenalty)} class="w-fit mx-auto">
                        <h3>Select</h3>
                    </Button>
                {/if}
            </Card.Content>
        </Card.Root>
    {/each}
</div>
<Button disabled={disableSelectPenalty} variant="outline" type="submit" onclick={async () => await submitPenalty()} class="w-fit m-auto"><h3>Select Penalty</h3></Button>

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
    <p>Refresh the page or return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}
