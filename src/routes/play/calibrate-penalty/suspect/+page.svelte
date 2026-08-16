
<script lang="ts">
    import { goto } from '$app/navigation';
    
	import * as Alert from "#lib/components/ui/alert/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
    import { Ellipsis } from "#lib/components/ui/loading-page-ellipsis/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject, gamePenalties } from "#lib/stateHandler.svelte.js"

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    let roleError = $derived(clientRoleObject.role !== "suspect")

    let invalidDataError = $derived(gamePenalties.currentPenalties === null)

    $effect(() => {
        if (clientStateObject.state.gameState !== "calibrate-penalty") {
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
        else if (invalidDataError) {
            console.log("Bad penalty data, closing websocket")
            webSocketObject.websocket?.close()
        }
    })
</script>

<h2 class="max-w-3/4 mx-auto">Penalty calibration</h2>
<div class="flex flex-col gap-2 w-3/4 text-left mx-auto">
    <p>
        The detective will ask you to perform {#if multiplePenalties}each{:else}the{/if} penalty.
    </p>
    <p>
        They may ask them to do so in as specific a manner as they like.
    </p>
    <p>
        Penalty calibration is an opportunity for you both to come to an agreement about what exactly constitutes "performing the penalty," so if you think of an edge case, you should mention it to the detective.
    </p>
    <p>
        Once you have performed {#if multiplePenalties}each{:else}the{/if} penalty three times, the detective will confirm that calibration is complete.
    </p>
</div>

<div class="flex flex-row justify-evenly gap-2 my-4">
    {#each gamePenalties.currentPenalties as activePenalty}
        <Card.Root class={multiplePenalties ? 'w-1/4' : 'w-1/3'}>
            <Card.Content>
                <p>{activePenalty.text}</p>
            </Card.Content>
        </Card.Root>
    {/each}
</div>
<Ellipsis />

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
