<script lang="ts">
    import { afterNavigate, goto } from "$app/navigation";

	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Ellipsis } from "$lib/components/ui/loading-page-ellipsis";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCPenalty } from "$lib/gameObjectTypes.svelte"
	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"

    import penaltyData from "$lib/gameData/penalties/penalties.json"

    let availablePenalties: IHCPenalty[] = $state([])
    let permanentPenalty: IHCPenalty | null = $derived(clientStateObject.state.permanentPenalty ? penaltyData[0] as IHCPenalty : null)

    let roleError = $derived(clientRoleObject.role !== "detective")

    let invalidDataError = $derived(availablePenalties.length === 0)

    afterNavigate(() => {
        if (Array.isArray(clientStateObject.state.penaltyCardID)) {
            // @ts-ignore - this is the isArray bug, clientStateObject.state.penaltyCardID can only be a [number, number] here
            availablePenalties = penaltyData.filter((penalty) => clientStateObject.state.penaltyCardID.includes(penalty.id))
        }
        console.log(availablePenalties)
        invalidDataError = availablePenalties.length === 0
    })

    $effect(() => {
        if (clientStateObject.state.gameState !== "select-penalty-final") {
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
        else if (invalidDataError) {
            console.log("Bad penalty data, closing websocket")
            webSocketObject.websocket?.close()
        }
    })
</script>

<h2>Waiting for suspect to select penalty</h2>
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
        </Card.Root>
    {/if}
    {#each availablePenalties as availablePenalty}
        <Card.Root class={permanentPenalty !== null ? 'w-1/4' : 'w-1/3'}>
            <Card.Header>
                <Card.Title>{availablePenalty.text}</Card.Title>
            </Card.Header>
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