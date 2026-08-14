<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    
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

    let selectedBackground: number | null = $state(null)
    let availableBackgrounds: IHCBackground[] = $state([])
    let invalidBackgroundSelection = $derived(selectedBackground === null)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "interrogate-prelim",
        penaltyCardID: selectedBackground
    })

    let roleError = $derived(clientRoleObject.role !== "suspect")

    let invalidDataError = $derived(gameModule.currentModule === null || gamePenalties.currentPenalties === null)

    let disableBackgroundSelectButton: boolean = $derived(selectedBackground !== null)
    let disablebackgroundDeselectButton: boolean = $derived(selectedBackground === null)
    let disableSelectBackground: boolean = $derived(invalidBackgroundSelection || roleError || invalidDataError || gameError())

    function removeBackground() {
        selectedBackground = null
    }

    function addBackground(background: IHCBackground) {
        selectedBackground = background.id
    }

    async function submitBackground() {
        if (!disableSelectBackground){
            await updateGameState(gameStateUpdate)
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    }

    afterNavigate(() => {
        availableBackgrounds = [...backgroundData]
        availableBackgrounds = knuthShuffle(availableBackgrounds).slice(0,3)
    })

    $effect(() => {
        if (invalidDataError) {
            console.log("Bad penalty or module data, closing websocket")
            webSocketObject.websocket?.close()
        }
    })
</script>

<h2>Select Role</h2>
<p>
    Prepare to take on one of the roles shown below.
</p>
<div class="flex flex-row justify-around gap-2 mx-2 my-2">
    {#each availableBackgrounds as availableBackground}
        <Card.Root class="w-1/4 {selectedBackground === availableBackground.id? 'light' : ''}">
            <Card.Header>
                <Card.Title>{availableBackground.background}</Card.Title>
            </Card.Header>
            <Card.Content class="mt-auto">
                {#if selectedBackground === availableBackground.id}
                    <Button variant="outline" type="submit" disabled={disablebackgroundDeselectButton} onclick={() => removeBackground()} class="w-fit m-auto mt-4">
                        <h3>Deselect</h3>
                    </Button>
                {:else}
                    <Button variant="outline" type="submit" disabled={disableBackgroundSelectButton} onclick={() => addBackground(availableBackground)} class="w-fit m-auto mt-4">
                        <h3>Select"</h3>
                    </Button>
                {/if}
            </Card.Content>
        </Card.Root>
    {/each}
    </div>
<Button disabled={disableSelectBackground} variant="outline" type="submit" onclick={async () => await submitBackground()} class="w-fit m-auto mb-2"><h3>Ready for interrogation</h3></Button>

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