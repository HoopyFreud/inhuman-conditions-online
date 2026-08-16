<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    
	import * as Alert from "#lib/components/ui/alert/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
    import { ModuleCycle } from "#lib/components/ui/moduleCycle/index.js"
    import { ModuleMaze } from "#lib/components/ui/moduleMaze/index.js"
    import { Separator } from "#lib/components/ui/separator//index.js";
    import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
    import { knuthShuffle } from 'knuth-shuffle';
    import type { IHCStateData } from "#lib/stateHandlerTypes.svelte.js";
    import type { IHCBackground } from "#lib/gameObjectTypes.svelte.js";

    import {
        clientRoleObject,
        clientStateObject,
        profileObject,
        sessionIDObject,
        webSocketObject,
        gameModule,
        gamePenalties
    } from "#lib/stateHandler.svelte.js";

    import { updateGameState } from "#lib/stateHandler.svelte.js";
    import { getErrorContext } from '#lib/errorContext.js';

    import backgroundData from "#lib/gameData/backgrounds/backgrounds.json" 
    import profileStrings from "#lib/gameData/suspectProfiles/profileStrings.json"

    let profileString = $derived(profileObject.profile?.type ? profileStrings[profileObject.profile.type] : "")

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    const gameError = getErrorContext()

    let selectedBackground: number | null = $state(null)
    let availableBackgrounds: IHCBackground[] = $state([])
    let invalidBackgroundSelection = $derived(selectedBackground === null)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "interrogate",
        backgroundCardID: selectedBackground
    })

    let roleError = $derived(clientRoleObject.role !== "suspect");
    let invalidDataError = $derived(gameModule.currentModule === null || gamePenalties.currentPenalties === null || profileObject.profile === null);
    let disableBackgroundSelectButton: boolean = $derived(selectedBackground !== null);
    let disablebackgroundDeselectButton: boolean = $derived(selectedBackground === null);
    let disableSelectBackground: boolean = $derived(invalidBackgroundSelection || roleError || invalidDataError || gameError());

    function removeBackground() {
        selectedBackground = null
    }

    function addBackground(background: IHCBackground) {
        selectedBackground = background.id
    }

    async function submitBackground() {
        if (!disableSelectBackground){
            await updateGameState(gameStateUpdate)
            await goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    }

    afterNavigate(() => availableBackgrounds = knuthShuffle(backgroundData).slice(0, 3));

    $effect(() => {
        if (invalidDataError) {
            console.log("Bad penalty or module data, closing websocket")
            webSocketObject.websocket?.close()
        }
    })
</script>
{#if multiplePenalties}
<h2>Penalties</h2>
{:else}
<h2>Penalty</h2>
{/if}
<div class="flex flex-row justify-around gap-2 mx-2">
    {#each gamePenalties.currentPenalties as activePenalty}
        <Card.Root class={multiplePenalties ? 'w-1/4' : 'w-1/3'}>
            <Card.Header>
                <Card.Title>{activePenalty.text}</Card.Title>
            </Card.Header>
        </Card.Root>
    {/each}
</div>
<Separator class="w-3/4! my-2 mx-auto"/>
<h2>Module</h2>
<Card.Root class="w-3/4 mx-auto my-2">
    <Card.Header>
        <Card.Title>
            <h3>You are a {profileString}</h3>
        </Card.Title>
    </Card.Header>
    <Card.Content class="mt-auto">
        {#if !invalidDataError && profileObject.profile?.type === "human"}
            <h3>Module Verification Maze</h3>
            <ModuleMaze class="w-3/4 mx-auto" sequence={gameModule.currentModule.mazePoints}/>
        {:else if !invalidDataError}
            <h3>Module Verification Sequence</h3>
            <ModuleCycle class="w-3/4 mx-auto" sequence={gameModule.currentModule.mazePoints}/>
            {#if profileObject.profile?.type === "patientRobot"}
                <h3>Restriction</h3>
                <p>{profileObject.profile.restriction}</p>
                {#if profileObject.profile.explainerText !== ""}
                    <p>{profileObject.profile.explainerText}</p>
                {/if}
            {:else if profileObject.profile?.type === "violentRobot"}
                <h3>Requirements</h3>
                {#each profileObject.profile.requirements as requirement}
                    <p>{requirement}</p>
                {/each}
            {/if}
        {/if}
    </Card.Content>
</Card.Root>
<h2>Select Role</h2>
<p>
    Prepare to take on the provided role. Because you failed validation, you may not choose a different one. Click the button when you are ready to proceed.
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
                        <h3>Select</h3>
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
    <Alert.Title>Bad incoming penalty, profile, or module data</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}
