<script lang="ts">
    import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

    import { knuthShuffle } from 'knuth-shuffle'

	import type { IHCStateData } from "$lib/stateHandlerTypes.svelte"
	import type { IHCBackground } from "$lib/gameObjectTypes.svelte"
	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject, gameModule, gamePenalties } from "$lib/stateHandler.svelte"
    import { updateGameState } from "$lib/stateHandler.svelte"
    import { getErrorContext } from '$lib/errorContext';

    import backgroundData from "$lib/gameData/backgrounds/backgrounds.json" 

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    const gameError = getErrorContext()

    let availableBackgrounds: IHCBackground[] = $state([])
    let selectedBackground: number | null = $derived(availableBackgrounds[0]?.id)
    let invalidBackgroundSelection = $derived(selectedBackground === null)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "interrogate-prelim",
        penaltyCardID: selectedBackground
    })

    let validState = $derived(
        clientStateObject.state.gameState === "select-module" ||
        clientStateObject.state.gameState === "interrogate-prelim"
    )
    
    let stateUpdateError = $derived(!validState)

    let roleError = $derived(clientRoleObject.role !== "detective")

    let invalidDataError = $derived(gameModule.currentModule === null || gamePenalties.currentPenalties === null)

    let disableSelectBackground: boolean = $derived(invalidBackgroundSelection || roleError || invalidDataError || stateUpdateError || gameError())

    async function submitBackground() {
        if (!disableSelectBackground){
            await updateGameState(gameStateUpdate)
            goto("/play/interrogate-prelim/suspect?room="+sessionIDObject.ID)
        }
    }

    onMount(() => {
        availableBackgrounds = [...backgroundData]
        availableBackgrounds = knuthShuffle(availableBackgrounds).slice(0,1)
    })

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

<h2>Select Role</h2>
<p>
    Prepare to take on the provided role. Because you failed validation, you may not choose a different one.
</p>
<div class="flex flex-row justify-around gap-2 mx-2 my-2">
    {#each availableBackgrounds as availableBackground}
        <Card.Root class="w-1/4">
            <Card.Header>
                <Card.Title>{availableBackground.background}</Card.Title>
            </Card.Header>
            <Card.Content class="mt-auto">
            </Card.Content>
        </Card.Root>
    {/each}
    </div>
<Button disabled={disableSelectBackground} variant="outline" type="submit" onclick={async () => await submitBackground()} class="w-fit m-auto mb-2"><h3>Ready for interrogation</h3></Button>

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