
<script lang="ts">
    import { goto } from '$app/navigation';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

    import { knuthShuffle } from 'knuth-shuffle'

	import type { IHCStateData, IHCRole } from "$lib/stateHandler.svelte"
	import type { IHCPenalty } from "$lib/gameObjectHandler.svelte."
	import { clientRoleObject, webSocketObject, clientStateObject, sessionIDObject } from "$lib/stateHandler.svelte"
    import { updateGameState } from "$lib/stateHandler.svelte"

    import penaltyData from "$lib/gameData/penalties/penaltyData.json"

    const availablePenalties = knuthShuffle(reducePenaltyData(penaltyData)).slice(0,3)

    function reducePenaltyData(penaltyData: IHCPenalty[]) {
        let newPenalties = [...penaltyData]
        if (clientStateObject.state.permanentPenalty) {
            newPenalties = newPenalties.slice(1)
        }
        if (clientStateObject.state.digitalGame) {
            newPenalties.filter((penalty) => penalty.digitalSafe)
        }
        return newPenalties
    }

    let selectedPenalties: number[]= $state([])

    let validState = $derived(
        clientStateObject.state.gameState === "game-setup" ||
        clientStateObject.state.gameState === "select-penalty-prelim"
    )
    let stateUpdateError = $derived(!validState)
    let websocketError = $derived(webSocketObject.websocket === null)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "select-penalty-final",
        penaltyCardID: selectedPenalties.length === 2 ? selectedPenalties as [number, number] : null
    })

    let disableSelectPenaltyButton: boolean = $derived(clientRoleObject.role === null || stateUpdateError)

    function selectPenalty(penalty: IHCPenalty) {
        selectedPenalties = [penalty.id]
    }

    async function submitPenalties() {
        await updateGameState(gameStateUpdate)
        goto("/play/select-penalty-final/detective-await?room="+sessionIDObject.ID)
    }

    $effect(() => {
        if (websocketError) {
            console.log("Websocket failure")
        }
        else if (stateUpdateError) {
                console.log("Failed state update, closing websocket")
                webSocketObject.websocket?.close()
        }
    })
</script>

<svelte:head>
	<title>Identity Crisis - Play</title>
	<meta name="description" content="Play Identity Crisis" />
</svelte:head>

<h2>Select Penalties</h2>
<p>
    Choose two of the penalties shown below to give to the suspect. The suspect will choose the penalty for this round from among them.
</p>
{#if clientStateObject.state.permanentPenalty}
<p>
    The permanent penalty will be enforced in addition to the one the suspect selects.
</p>
{/if}

{#each availablePenalties as availablePenalty}
    <Card.Root class={selectedPenalties.includes(availablePenalty.id)? "bg-slate-100" : ""}>
        <Card.Header>
            <Card.Title>{availablePenalty.text}</Card.Title>
        </Card.Header>
        <Card.Content>
            <Button variant="outline" type="submit" onclick={async () => selectPenalty(availablePenalty)} class="w-fit m-auto mt-4">
                <h3>Select</h3>
            </Button>
        </Card.Content>
    </Card.Root>
{/each} 
<Button disabled={disableSelectPenaltyButton} variant="outline" type="submit" onclick={async () => await submitPenalties()} class="w-fit m-auto mt-4 "><h3>Select Penalties</h3></Button>

{#if stateUpdateError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Failed to update game state</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and choose a different room to join.</p>
    </Alert.Description>
</Alert.Root>
{/if}
{#if websocketError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Websocket closed unexpectedly</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}