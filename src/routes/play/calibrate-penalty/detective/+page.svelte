
<script lang="ts">
    import { goto } from '$app/navigation';
    
	import * as Alert from "#lib/components/ui/alert/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCStateData } from "#lib/stateHandlerTypes.svelte.js"
	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject, gamePenalties } from "#lib/stateHandler.svelte.js"
    import { updateGameState } from "#lib/stateHandler.svelte.js"
    import { getErrorContext } from '#lib/errorContext.js';
    
    const gameError = getErrorContext()

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    let roleError = $derived(clientRoleObject.role !== "detective")

    let invalidDataError = $derived(gamePenalties.currentPenalties === null)

    let disableConfirmPenalty = $derived(roleError || invalidDataError || gameError())

    async function calibrationCompleted() {
        if (!disableConfirmPenalty) {
            const gameStateUpdate: Partial<IHCStateData> = {
                gameState: "select-module",
            }
            await updateGameState(gameStateUpdate)
            await goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    }

    $effect(() => {
        if (invalidDataError) {
            console.log("Bad penalty data, closing websocket")
            webSocketObject.websocket?.close()
        }
    })

</script>

<h2 class="max-w-3/4 mx-auto">Penalty calibration</h2>
<div class="flex flex-col gap-2 w-3/4 text-left mx-auto">
    <p>
        {#if multiplePenalties}For each penalty, ask{:else}Ask{/if} the suspect to perform the penalty a few times.
    </p>
    <p>
        You may ask them to do so in as specific a manner as you like.
    </p>
    <p>
        Penalty calibration is an opportunity for you both to come to an agreement about what exactly constitutes "performing the penalty," so seek out edge cases.
    </p>
    <p>
        Once the suspect has performed {#if multiplePenalties}each{:else}the{/if} penalty three times, press the "calibration completed" button below.
    </p>
</div>
<div class="flex gap-2 my-4 mx-auto w-3/4 flex-col">
    {#each gamePenalties.currentPenalties as activePenalty}
        <Card.Root class="w-full">
            <Card.Content>
                <p>{activePenalty.text}</p>
            </Card.Content>
        </Card.Root>
    {/each}
</div>

<Button disabled={disableConfirmPenalty} variant="outline" type="submit" onclick={async () => await calibrationCompleted()} class="w-fit mx-auto"><h3>Calibration completed</h3></Button>

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
