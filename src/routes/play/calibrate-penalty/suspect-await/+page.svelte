
<script lang="ts">
    import { goto } from '$app/navigation';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Ellipsis } from "$lib/components/ui/loading-page-ellipsis";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientStateObject, sessionIDObject, webSocketObject, gamePenalties } from "$lib/stateHandler.svelte"

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    let validState = $derived(
        clientStateObject.state.gameState === "calibrate-penalty" ||
        clientStateObject.state.gameState === "select-module"
    )

    let stateUpdateError = $derived(!validState)

    let invalidDataError = $derived(gamePenalties.currentPenalties === null)

    $effect(() => {
        if (stateUpdateError) {
            console.log("Failed state update, closing websocket")
            webSocketObject.websocket?.close()
        }
        else if (invalidDataError) {
            console.log("Bad penalty data, closing websocket")
            webSocketObject.websocket?.close()
        }
        else if (clientStateObject.state.gameState === "select-module") {
            goto("/play/select-module/suspect-do?room="+sessionIDObject.ID)
        }
    })
</script>

<h2>Penalty calibration</h2>
<p>
    The detective will ask you to perform {#if multiplePenalties}each{:else}the{/if} penalty. They may ask them to do so in as specific a manner as they like. Penalty calibration is an opportunity for you both to come to an agreement about what exactly constitutes "performing the penalty,"" so if you think of an edge case, you should mention it to the detective.
</p>
<p>
    Once you have performed {#if multiplePenalties}each{:else}the{/if} penalty three times, the detective will confirm that calibration is complete.
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
{#if invalidDataError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Bad incoming penalty data</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}