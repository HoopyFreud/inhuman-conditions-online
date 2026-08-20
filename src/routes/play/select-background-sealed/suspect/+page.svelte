<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    
    import * as Accordion from "#lib/components/ui/accordion/index.js";
	import * as Alert from "#lib/components/ui/alert/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
    import { ModuleCycle } from "#lib/components/ui/moduleCycle/index.js"
    import { ModuleMaze } from "#lib/components/ui/moduleMaze/index.js"
    import { Separator } from "#lib/components/ui/separator//index.js";
    import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
    import type { IHCStateData } from "#lib/stateHandlerTypes.svelte.js";
    import type { IHCBackground } from "#lib/gameObjectTypes.svelte.js";

    import { clientRoleObject, clientStateObject, persistedProfileObject, sessionIDObject, webSocketObject, gameModule, gamePenalties } from "#lib/stateHandler.svelte.js";

    import { updateGameState } from "#lib/stateHandler.svelte.js";
    import { getErrorContext } from '#lib/errorContext.js';

    import backgroundData from "#lib/gameData/backgrounds/backgrounds.json" 
    import profileStrings from "#lib/gameData/suspectProfiles/profileStrings.json"

    let profileString = $derived(persistedProfileObject.current.profile?.type ? profileStrings[persistedProfileObject.current.profile.type] : "")

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    const gameError = getErrorContext()

    let availableBackgrounds: IHCBackground[] = $state([])
    let selectedBackground: number | null = $derived(availableBackgrounds[0]?.id)
    let invalidBackgroundSelection = $derived(selectedBackground === null)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "interrogate",
        backgroundCardID: selectedBackground
    })

    let roleError = $derived(clientRoleObject.role !== "suspect");
    let invalidDataError = $derived(!clientStateObject.state.sealedFile || gameModule.currentModule === null || gamePenalties.currentPenalties === null || persistedProfileObject.current.profile === null);
    let disableSelectBackground: boolean = $derived(invalidBackgroundSelection || roleError || invalidDataError || gameError());

    async function submitBackground() {
        if (!disableSelectBackground){
            await updateGameState(gameStateUpdate)
            await goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    }

    afterNavigate(() => availableBackgrounds = backgroundData.slice(0, 1));

    $effect(() => {
        if (invalidDataError) {
            console.log("Bad penalty, profile, or module data, closing websocket")
            webSocketObject.websocket?.close()
        }
    })
</script>
<div class="flex flex-row justify-evenly gap-2">
    {#each gamePenalties.currentPenalties as activePenalty}
        <Card.Root class={multiplePenalties ? 'w-1/4' : 'w-1/3'}>
            <Card.Header>
                <Card.Title>
                    <h3>Penalty</h3>
                </Card.Title>
            </Card.Header>
            <Card.Content>
                <p>{activePenalty.text}</p>
            </Card.Content>
        </Card.Root>
    {/each}
    <Card.Root class={multiplePenalties ? 'w-1/4' : 'w-1/3'}>
        <Card.Header>
            <Card.Title><h3>Identity: {profileString}</h3></Card.Title>
        </Card.Header>
        <Card.Content>
            {#if persistedProfileObject.current.profile?.type === "patientRobot"}
                <Accordion.Root type="single" class="max-w-3/4 w-fit mx-auto ">
                    <Accordion.Item>
                        <Accordion.Trigger><h3>Restriction</h3></Accordion.Trigger>
                        <Accordion.Content class="w-full text-left">
                            <p class="text-base">{persistedProfileObject.current.profile.restriction}</p>
                            {#if persistedProfileObject.current.profile.explainerText !== ""}
                                <p class="text-base text-muted-foreground">Note: {persistedProfileObject.current.profile.explainerText}</p>
                            {/if}
                        </Accordion.Content>
                    </Accordion.Item>
                </Accordion.Root>
            {:else if persistedProfileObject.current.profile?.type === "violentRobot"}
                <Accordion.Root type="single" class="max-w-3/4 w-fit mx-auto ">
                    <Accordion.Item>
                        <Accordion.Trigger><h3>Requirements</h3></Accordion.Trigger>
                        <Accordion.Content class="w-full text-left">
                            <ul class="justify-items-start" style="list-style-type: upper-alpha">
                                {#each persistedProfileObject.current.profile.requirements as requirement}
                                    <Separator class="my-2 mx-auto"/>
                                    <li>{requirement}</li>
                                {/each}
                            </ul>
                        </Accordion.Content>
                    </Accordion.Item>
                </Accordion.Root>
            {/if}
        </Card.Content>
    </Card.Root>
</div>
<Separator class="w-3/4! my-2 mx-auto"/>
<h2 class="max-w-3/4 mx-auto">Role Selection</h2>
<div class="flex flex-col gap-2 w-3/4 text-left mx-auto">
    <p>
        The sealed role option is enabled for this game. The character for this role is based on yourself.
    </p>
    <p>
        Take a moment to decide what that will look like — What will you fictionalize? What will be true to life?
    </p>
    <p>
        Click the button when you are ready to proceed.
    </p>
</div>
<div class="flex flex-row justify-evenly gap-2 my-4">
    {#each availableBackgrounds as availableBackground}
        <Card.Root class="w-1/4 light">
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
