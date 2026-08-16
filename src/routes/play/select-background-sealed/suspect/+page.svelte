<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
    import { ModuleCycle } from "$lib/components/ui/moduleCycle"
    import { ModuleMaze } from "$lib/components/ui/moduleMaze"
    import { Separator } from "$lib/components/ui/separator/";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

    import { knuthShuffle } from 'knuth-shuffle'

	import type { IHCStateData } from "$lib/stateHandlerTypes.svelte"
	import type { IHCBackground } from "$lib/gameObjectTypes.svelte"
	import { clientRoleObject, clientStateObject, profileObject, sessionIDObject, webSocketObject, gameModule, gamePenalties } from "$lib/stateHandler.svelte"
    import { updateGameState } from "$lib/stateHandler.svelte"
    import { getErrorContext } from '$lib/errorContext';

    import backgroundData from "$lib/gameData/backgrounds/backgrounds.json" 
    import profileStrings from "$lib/gameData/suspectProfiles/profileStrings.json"

    let profileString = $derived(profileObject.profile?.type ? profileStrings[profileObject.profile.type] : "")

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    const gameError = getErrorContext()

    let availableBackgrounds: IHCBackground[] = $state([])
    let selectedBackground: number | null = $derived(availableBackgrounds[0]?.id)
    let invalidBackgroundSelection = $derived(selectedBackground === null)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "interrogate",
        backgroundCardID: selectedBackground
    })

    let roleError = $derived(clientRoleObject.role !== "suspect")

    let invalidDataError = $derived(!clientStateObject.state.sealedFile || gameModule.currentModule === null || gamePenalties.currentPenalties === null || profileObject.profile === null)

    let disableSelectBackground: boolean = $derived(invalidBackgroundSelection || roleError || invalidDataError || gameError())

    async function submitBackground() {
        if (!disableSelectBackground){
            await updateGameState(gameStateUpdate)
            await goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    }

    afterNavigate(() => {
        availableBackgrounds = backgroundData.slice(0,1)
    })

    $effect(() => {
        if (invalidDataError) {
            console.log("Bad penalty, profile, or module data, closing websocket")
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
            <ModuleCycle class="w-3/4 mx-auto" sequence={gameModule.currentModule.mazePoints}/>
        {:else if !invalidDataError}
            <h3>Module Verification Sequence</h3>
            <ModuleMaze class="w-3/4 mx-auto" sequence={gameModule.currentModule.mazePoints}/>
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
<h2>Sealed Role</h2>
<p>
    The sealed role option is enabled for this game. The character for this role is based on yourself. Take a moment to decide what that will look like — What will you fictionalize? What will be true to life? Click the button when you are ready to proceed.
</p>
<div class="flex flex-row justify-around gap-2 mx-2 my-2">
    {#each availableBackgrounds as availableBackground}
        <Card.Root class="w-1/4">
            <Card.Header>
                <Card.Title>{availableBackground.background}</Card.Title>
            </Card.Header>
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
    <Alert.Title>Bad client data, incoming penalty, profile, or module data</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}