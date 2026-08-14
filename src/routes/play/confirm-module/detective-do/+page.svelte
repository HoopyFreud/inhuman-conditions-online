
<script lang="ts">
    import { goto } from '$app/navigation';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCStateData } from "$lib/stateHandlerTypes.svelte"
	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject, gameModule, gamePenalties } from "$lib/stateHandler.svelte"
    import { updateGameState } from "$lib/stateHandler.svelte"
    import { getErrorContext } from '$lib/errorContext';
    
    const gameError = getErrorContext()

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    let validState = $derived(
        clientStateObject.state.gameState === "confirm-module" ||
        clientStateObject.state.gameState === "select-background-fail" ||
        clientStateObject.state.gameState === "select-background-success"
    )

    let stateUpdateError = $derived(!validState)

    let roleError = $derived(clientRoleObject.role !== "detective")

    let invalidDataError = $derived(gamePenalties.currentPenalties === null || gameModule.currentModule === null)

    let disableConfirmModule = $derived(roleError || invalidDataError || stateUpdateError || gameError())

    async function validationFailure() {
        if (!disableConfirmModule) {
            const gameStateUpdate: Partial<IHCStateData> = {
                gameState: "select-background-fail",
            }
            await updateGameState(gameStateUpdate)
            goto("/play/select-background-fail/detective-await?room="+sessionIDObject.ID)
        }
    }

    async function validationSuccess() {
        if (!disableConfirmModule) {
            const gameStateUpdate: Partial<IHCStateData> = {
                gameState: "select-background-success",
            }
            await updateGameState(gameStateUpdate)
            goto("/play/select-background-success/detective-await?room="+sessionIDObject.ID)
        }
    }

    $effect(() => {
        if (stateUpdateError) {
            console.log("Failed state update, closing websocket")
            webSocketObject.websocket?.close()
        }
        else if (invalidDataError) {
            console.log("Bad penalty or module data, closing websocket")
            webSocketObject.websocket?.close()
        }
    })
</script>

<h2>Module validation</h2>
<p>
    Ask the suspect a question about the module sequence, such as "what letters come between D and A?" or "what letter follows B?" Note that there is no beginning or end to this sequence of letters; it is cyclical. They will take some time to answer the question.
</p>
<p>
    If the suspect's provides a correct answer on the first try, press the "Suspect completed validation" button below. If the suspect's answer is incorrect, tell them so and wait for them to provide the corerct answer. Once they do, press the "Suspect failed validation" button below. 
</p>

<div class="flex flex-row justify-around gap-2 mx-2 my-2">
    {#each gamePenalties.currentPenalties as activePenalty}
        <Card.Root class={multiplePenalties ? 'w-1/4' : 'w-1/3'}>
            <Card.Header>
                <Card.Title>{activePenalty.text}</Card.Title>
            </Card.Header>
            <Card.Content class="mt-auto">
            </Card.Content>
        </Card.Root>
    {/each}
</div>
    
<div class="flex flex-row justify-evenly w-3/4 mt-4">
    <Button variant="destructive" type="submit" onclick={async () => await validationFailure()} disabled={disableConfirmModule}><h3>Suspect failed validation</h3></Button>
    <Button variant="outline" type="submit" onclick={async() => await validationSuccess()} disabled={disableConfirmModule}><h3>Suspect completed validation</h3></Button>
</div>

{#if stateUpdateError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Failed to update game state</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and choose a different room to join.</p>
    </Alert.Description>
</Alert.Root>
{/if}
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
    <Alert.Title>Bad incoming penalty or module data</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}