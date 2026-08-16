<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    
	import * as Alert from "#lib/components/ui/alert/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
    import { Button } from "#lib/components/ui/button/index.js";
    import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
    import { knuthShuffle } from 'knuth-shuffle';
    import type { IHCStateData } from "#lib/stateHandlerTypes.svelte.js";
    import type { IHCPenalty } from "#lib/gameObjectTypes.svelte.js";

    import {
        clientRoleObject,
        clientStateObject,
        sessionIDObject,
        webSocketObject
    } from "#lib/stateHandler.svelte.js";

    import { updateGameState } from "#lib/stateHandler.svelte.js";
    import { getErrorContext } from '#lib/errorContext.js';

    import penaltyData from "#lib/gameData/penalties/penalties.json"

    const gameError = getErrorContext()

    let selectedPenalties: number[] = $state([])
    let availablePenalties: IHCPenalty[] = $state([])
    let invalidPenaltySelection = $derived(selectedPenalties.length !== 2)
    
    let permanentPenalty: IHCPenalty | null = $derived(clientStateObject.state.permanentPenalty ? penaltyData[0] as IHCPenalty : null)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "select-penalty-final",
        penaltyCardID: invalidPenaltySelection ? null : selectedPenalties as [number, number]
    })

    let roleError = $derived(clientRoleObject.role !== "detective");
    let disablePenaltyAddButton: boolean = $derived(selectedPenalties.length >= 2);
    let disablePenaltyRemoveButton: boolean = $derived(selectedPenalties.length === 0);
    let disableSelectPenalty: boolean = $derived(invalidPenaltySelection || roleError || gameError());

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
            permanentPenalty = penaltyData[0];
            availablePenalties = penaltyData.slice(1);
        } else {
            availablePenalties = penaltyData;
        }

        if (clientStateObject.state.digitalGame) {
            availablePenalties = availablePenalties.filter((penalty) => penalty.digitalSafe)
        }
        availablePenalties = knuthShuffle(availablePenalties).slice(0,3)
    })
</script>

<h2 class="max-w-3/4 mx-auto">Penalty Selection</h2>
<div class="w-3/4 text-left mx-auto">
    <p>
        Choose two of the penalties shown below to give to the suspect. The suspect will choose the penalty for this round from among them.
    </p>
    {#if permanentPenalty !== null}
    <p>
        The permanent penalty will be enforced in addition to the one the suspect selects.
    </p>
    {/if}
</div>

<div class="flex flex-row justify-evenly gap-2 my-4">
    {#if permanentPenalty !== null}
        <Card.Root class="w-1/5 light">
            <Card.Content class="flex flex-col h-full gap-2 justify-between">
                <p>Permanent penalty: {permanentPenalty.text}</p>
                <Button variant="outline" type="submit" disabled={true} class="w-fit mx-auto">
                    <h3>Cannot be deselected</h3>
                </Button>
            </Card.Content>
        </Card.Root>
    {/if}
    {#each availablePenalties as availablePenalty}
        <Card.Root class="{permanentPenalty !== null ? 'w-1/5' : 'w-1/4'} {selectedPenalties.includes(availablePenalty.id)? 'light' : ''}">
            <Card.Content class="flex flex-col h-full gap-2 justify-between">
                <p>{availablePenalty.text}</p>
                {#if selectedPenalties.includes(availablePenalty.id)}
                    <Button variant="outline" type="submit" disabled={disablePenaltyRemoveButton} onclick={() => removePenalty(availablePenalty)} class="w-fit mx-auto">
                        <h3>Deselect</h3>
                    </Button>
                {:else}
                    <Button variant="outline" type="submit" disabled={disablePenaltyAddButton} onclick={() => addPenalty(availablePenalty)} class="w-fit mx-auto">
                        <h3>Select</h3>
                    </Button>
                {/if}
            </Card.Content>
        </Card.Root>
    {/each}
</div>
<Button disabled={disableSelectPenalty} variant="outline" type="submit" onclick={async () => await submitPenalties()} class="w-fit m-auto"><h3>Select Penalties</h3></Button>

{#if roleError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Wrong role</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}
