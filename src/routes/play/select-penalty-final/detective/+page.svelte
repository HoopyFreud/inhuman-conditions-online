<script lang="ts">
    import { afterNavigate, goto } from "$app/navigation";

	import * as Alert from "#lib/components/ui/alert/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
    import { Ellipsis } from "#lib/components/ui/loading-page-ellipsis/index.js";
    import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
    import type { IHCPenalty } from "#lib/gameObjectTypes.svelte.js";

    import {
        clientRoleObject,
        clientStateObject,
        sessionIDObject,
        webSocketObject
    } from "#lib/stateHandler.svelte.js";

    import penaltyData from "#lib/gameData/penalties/penalties.json"

    let availablePenalties: IHCPenalty[] = $state([]);
    let permanentPenalty: IHCPenalty | null = $derived(clientStateObject.state.permanentPenalty ? penaltyData[0] as IHCPenalty : null);
    let roleError = $derived(clientRoleObject.role !== "detective");
    let invalidDataError = $state(false);

    afterNavigate(() => {
        if (Array.isArray(clientStateObject.state.penaltyCardID)) {
            // @ts-ignore - this is the isArray bug, clientStateObject.state.penaltyCardID can only be a [number, number] here
            availablePenalties = penaltyData.filter((penalty) => clientStateObject.state.penaltyCardID.includes(penalty.id))
        }
        invalidDataError = availablePenalties.length === 0
    })

    $effect(() => {
        if (webSocketObject.websocket !== null && clientStateObject.state.gameState !== "select-penalty-final") {
            goto("/play/" + clientStateObject.state.gameState + "/" + clientRoleObject.role + "?room=" + sessionIDObject.ID);
        } else if (invalidDataError) {
            console.log("Bad penalty data, closing websocket");
            webSocketObject.websocket?.close();
        }
    });
</script>

<h2 class="max-w-3/4 mx-auto">Wait for Penalty Selection</h2>
<div class="w-3/4 text-left mx-auto">
    {#if permanentPenalty !== null}
    <p>
        The permanent penalty will be enforced in addition to the selected penalty.
    </p>
    {/if}
</div>
<div class="flex flex-row justify-evenly gap-2 my-4">
    {#if permanentPenalty !== null}
        <Card.Root class="w-1/4 light">
            <Card.Content>
                <p>Permanent penalty: {permanentPenalty.text}</p>
            </Card.Content>
        </Card.Root>
    {/if}
    {#each availablePenalties as availablePenalty}
        <Card.Root class={permanentPenalty !== null ? 'w-1/4' : 'w-1/3'}>
            <Card.Content>
                <p>{availablePenalty.text}</p>
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
