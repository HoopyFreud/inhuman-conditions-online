
<script lang="ts">
    import { goto } from '$app/navigation';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Ellipsis } from "$lib/components/ui/loading-page-ellipsis";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject, gameModule, gamePenalties } from "$lib/stateHandler.svelte"
    
    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    let validState = $derived(
        clientStateObject.state.gameState === "confirm-module" ||
        clientStateObject.state.gameState === "select-background-fail" ||
        clientStateObject.state.gameState === "select-background-success"
    )

    let stateUpdateError = $derived(!validState)

    let roleError = $derived(clientRoleObject.role !== "detective")

    let invalidDataError = $derived(gamePenalties.currentPenalties === null || gameModule.currentModule === null)

    $effect(() => {
        if (stateUpdateError) {
            console.log("Failed state update, closing websocket")
            webSocketObject.websocket?.close()
        }
        else if (invalidDataError) {
            console.log("Bad penalty or module data, closing websocket")
            webSocketObject.websocket?.close()
        }
        else if (clientStateObject.state.gameState === "select-background-fail") {
            goto("/play/select-background-fail/suspect-do?room="+sessionIDObject.ID)
        }
        else if (clientStateObject.state.gameState === "select-background-success") {
            goto("/play/select-background-success/suspect-do?room="+sessionIDObject.ID)
        }
    })
</script>

<h2>Module validation</h2>
<p>
    The detective will ask you a question about the module sequence, such as "what letters come between D and A?" or "what letter follows B?" Note that there is no beginning or end to this sequence of letters; it is cyclical. Take some time to answer the question; if you are human, make sure you solve the maze correctly. If you are robot, take this time to study the requirements for this round.
</p>
<p>
    If you provide a correct answer on the first try, you will get to choose between three backgrounds. Otherwise, one will be picked for you.
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