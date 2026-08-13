<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from "$app/navigation";

	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Ellipsis } from "$lib/components/ui/loading-page-ellipsis";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCPenalty } from "$lib/gameObjectHandler.svelte."
	import { clientStateObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"

    import penaltyData from "$lib/gameData/penalties/penalties.json"

    let availablePenalties: IHCPenalty[]= $state([])
    let permanentPenalty: IHCPenalty | null = $state(null)

    let invalidDataError = $state(false)

    let validState = $derived(
        clientStateObject.state.gameState === "select-penalty-final" ||
        clientStateObject.state.gameState === "select-module"
    )

    let stateUpdateError = $derived(!validState)

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
        else if (invalidDataError) {
            console.log("Bad penalty data, closing websocket")
            webSocketObject.websocket?.close()
        }
        else if (clientStateObject.state.gameState === "calibrate-penalty") {
            goto("/play/calibrate-penalty/detective-do?room="+sessionIDObject.ID)
        }
    })
</script>

<h2>Waiting for suspect to select penalty</h2>
<Ellipsis />
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
            </Card.Content>
        </Card.Root>
    {/if}
    {#each availablePenalties as availablePenalty}
        <Card.Root class={permanentPenalty !== null ? 'w-1/4' : 'w-1/3'}>
            <Card.Header>
                <Card.Title>{availablePenalty.text}</Card.Title>
            </Card.Header>
            <Card.Content class="mt-auto">
            </Card.Content>
        </Card.Root>
    {/each}
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