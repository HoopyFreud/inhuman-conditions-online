
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

    let activePenalties: IHCPenalty[] = $state([])
    let multiplePenalties = $derived(activePenalties.length > 1)

    let invalidDataError = $state(false)

    let validState = $derived(
        clientStateObject.state.gameState === "calibrate-penalty" ||
        clientStateObject.state.gameState === "select-module"
    )

    let stateUpdateError = $derived(!validState)

    let disableConfirmPenalty = $derived(invalidDataError || stateUpdateError || gameError())

    async function calibrationCompleted() {
        if (!disableConfirmPenalty) {
            const gameStateUpdate: Partial<IHCStateData> = {
                gameState: "select-module",
            }
            await updateGameState(gameStateUpdate)
            goto("/play/select-module/detective-await?room="+sessionIDObject.ID)
        }
    }

    $effect(() => {
        if (stateUpdateError) {
            console.log("Failed state update, closing websocket")
            webSocketObject.websocket?.close()
        }
        else if (invalidDataError) {
            console.log("Bad penalty data, closing websocket")
            webSocketObject.websocket?.close()
        }
    })

    onMount(() => {
        activePenalties = [...penaltyData]
        if (clientStateObject.state.permanentPenalty) {
            activePenalties.filter((penalty) => penalty.id === 0 || penalty.id === clientStateObject.state.penaltyCardID)
            if (activePenalties.length !== 2) {
                invalidDataError = true
            }
        }
        else {
            activePenalties.filter((penalty) => penalty.id === clientStateObject.state.penaltyCardID)
            if (activePenalties.length !== 1) {
                invalidDataError = true
            }
        }
    })
</script>

<h2>Penalty calibration</h2>
<p>
    {#if multiplePenalties}For each penalty, ask{:else}Ask{/if} the suspect to perform the penalty. You may ask them to do so in as specific a manner as you like. Penalty calibration is an opportunity for you both to come to an agreement about what exactly constitutes "performing the penalty,"" so seek out edge cases.
</p>
<p>
    Once the suspect has performed {#if activePenalties.length > 1}each{:else}the{/if} penalty three times, press the "calibration completed" button below.
</p>

<div class="flex flex-row justify-around gap-2 mx-2 my-2">
    {#each activePenalties as activePenalty}
        <Card.Root class={multiplePenalties ? 'w-1/4' : 'w-1/3'}>
            <Card.Header>
                <Card.Title>{activePenalty.text}</Card.Title>
            </Card.Header>
            <Card.Content class="mt-auto">
            </Card.Content>
        </Card.Root>
    {/each}
</div>

<Button disabled={disableConfirmPenalty} variant="outline" type="submit" onclick={async () => await calibrationCompleted()} class="w-fit m-auto mb-2"><h3>Calibration completed</h3></Button>

    
<div class="flex flex-row justify-evenly w-3/4 mt-4">
    <Button variant="destructive" type="submit" onclick={async () => await calibrationFailed()} disabled={disableConfirmPenalty}><h3>Suspect failed calibration</h3></Button>
    <Button variant="outline" type="submit" onclick={async() => await calibrationCompleted()} disabled={disableConfirmPenalty}><h3>Suspect achieved calibration</h3></Button>
</div>

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