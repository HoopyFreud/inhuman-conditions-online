<script lang="ts">
    import { untrack } from 'svelte';
    import { goto } from '$app/navigation';
    
    import * as Accordion from "#lib/components/ui/accordion/index.js";
	import * as Alert from "#lib/components/ui/alert/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
    import { Separator } from "#lib/components/ui/separator//index.js";
    import { ModuleCycle } from "#lib/components/ui/moduleCycle/index.js"
    import { ModuleMaze } from "#lib/components/ui/moduleMaze/index.js"
    import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
    import type { IHCStateData, IHCStateUpdate } from "#lib/stateHandlerTypes.svelte.js";

    import { clientRoleObject, clientStateObject, profileObject, sessionIDObject, webSocketObject, gameBackground, gameModule, gamePenalties } from "#lib/stateHandler.svelte.js";

    import { updateGameState } from "#lib/stateHandler.svelte.js";
    import { getErrorContext } from '#lib/errorContext.js';

    import profileStrings from "#lib/gameData/suspectProfiles/profileStrings.json"
    import profileBlurbs from "#lib/gameData/suspectProfiles/profileBlurbs.json";

    let profileString = $derived(profileObject.profile?.type ? profileStrings[profileObject.profile.type] : "")
    let profileBlurb = $derived(profileObject.profile?.type ? profileBlurbs[profileObject.profile.type] : "")
    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    let endTime = $derived(clientStateObject.state.endTime?.getTime() ?? Infinity)

    let countdownInterval: any = null

    let timerTime = $state(Infinity)
    let timerText = $derived.by(() => {
        if (timerTime !== Infinity) {
            return timerTime?.toString()
        }
        else {
            return ""
        }
    })

    const gameError = getErrorContext()
    let roleError = $derived(clientRoleObject.role !== "suspect");
    let invalidDataError = $derived(gameBackground.currentBackground === null || gameModule.currentModule === null || gamePenalties.currentPenalties === null || profileObject.profile === null);

    let disableStateUpdate = $derived(invalidDataError || gameError())

    async function updateInterrogationState(newState:IHCStateData["interrogationState"]) {
        if (!disableStateUpdate){
            const gameStateUpdate: Partial<IHCStateData> = {
                interrogationState: newState
            }
            if (newState === "ongoing") {
                gameStateUpdate.endTime = new Date()
            }
            if (newState === "pause") {
                gameStateUpdate.endTime = null
            }
            await updateGameState(gameStateUpdate)
        }
    }

    async function updateOverallGameState(newState:IHCStateData["gameState"]) {
        if (!disableStateUpdate){
            const gameStateUpdate: Partial<IHCStateData> = {
                gameState: newState
            }
            await updateGameState(gameStateUpdate)
        }
    }

    $effect(() => {
        if (webSocketObject.websocket !== null && clientStateObject.state.gameState !== "select-background-fail") {
            clearInterval(countdownInterval)
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
        //this too tbh
        else if (webSocketObject.websocket !== null && clientStateObject.state.interrogationState === "pause") {
            clearInterval(countdownInterval)
        }
        //this should really be a new event listener rather than this - will fix later
        else if (webSocketObject.websocket !== null && clientStateObject.state.interrogationState === "ongoing") {
            countdownInterval = setInterval(() => {
                if (clientStateObject.state.endTime !== null) {
                    untrack(() => timerTime = endTime - Date.now())
                }
            },10)
        }
        // this one should also be a listener
        else if (webSocketObject.websocket !== null && clientStateObject.state.interrogationState === "kill-attempt") {
            clearInterval(countdownInterval)
            if (profileObject.profile?.type === "human") {
                updateOverallGameState("end-game-lose-together")
            }
            else {
                updateOverallGameState("end-game-win-detective")
            }
        }
        else if (invalidDataError) {
            console.log("Bad penalty, background, profile, or module data, closing websocket")
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
            <Card.Title>
                <h3>Background</h3>
            </Card.Title>
        </Card.Header>
        <Card.Content>
            <p>{gameBackground.currentBackground.background}</p>
        </Card.Content>
    </Card.Root>
</div>
<div class="flex flex-row justify-evenly gap-2">
    <Card.Root class="w-3/4">
        <Card.Header>
            <Card.Title>
                <h2>Identity: {profileString}</h2>
                <div class="flex flex-col gap-2 max-w-3/4 w-fit mx-auto text-left">
                    {#each profileBlurb as blurbLine}
                        <p class="text-base">{blurbLine}</p>
                    {/each}
                </div>
            </Card.Title>
        </Card.Header>
        <Card.Content>
            {#if profileObject.profile?.type === "patientRobot"}
                <Accordion.Root type="single" class="max-w-3/4 w-fit mx-auto ">
                    <Accordion.Item>
                        <Accordion.Trigger><h3>Restriction</h3></Accordion.Trigger>
                        <Accordion.Content class="w-full text-left">
                            <p class="text-base">{profileObject.profile.restriction}</p>
                            {#if profileObject.profile.explainerText !== ""}
                                <p class="text-base text-muted-foreground">Note: {profileObject.profile.explainerText}</p>
                            {/if}
                        </Accordion.Content>
                    </Accordion.Item>
                </Accordion.Root>
            {:else if profileObject.profile?.type === "violentRobot"}
                <Accordion.Root type="single" class="max-w-3/4 w-fit mx-auto ">
                    <Accordion.Item>
                        <Accordion.Trigger><h3>Requirements</h3></Accordion.Trigger>
                        <Accordion.Content class="w-full text-left">
                            <ul class="justify-items-start" style="list-style-type: upper-alpha">
                                {#each profileObject.profile.requirements as requirement}
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
<h2 class="max-w-3/4 mx-auto">Interrogation</h2>
<div class="flex flex-col gap-2 w-3/4 text-left mx-auto">
    <p>
        The detective will ask you to confirm your background and read you a statement aloud before the timer starts.
    </p>
    {#each profileBlurb as blurbLine}
        <p class="text-base">{blurbLine}</p>
    {/each}
</div>
<div class="flex flex-row justify-evenly gap-2 my-4">
    <Card.Root class="w-1/4">
        <Card.Header>
            <Card.Title>
                <h3>Time remaining</h3>
            </Card.Title>
        </Card.Header>
        <Card.Content class="flex flex-col h-full gap-2 justify-between">
            <h3>{timerText}</h3>
            <Button disabled={disableStateUpdate} variant="destructive" type="submit" onclick={async () => await updateInterrogationState("pause")} class="w-fit mx-auto"><h3>Pause</h3></Button>
        </Card.Content>
    </Card.Root>
    <Card.Root class="w-1/4">
        <Card.Header>
            <Card.Title>
                <Button disabled={disableStateUpdate} variant="destructive" type="submit" onclick={async () => await updateOverallGameState("end-game-win-robot")} class="w-fit mx-auto"><h3>Kill</h3></Button>
            </Card.Title>
        </Card.Header>
    </Card.Root>
    <Card.Root class="w-1/4">
        <Card.Header>
            <Card.Title>
                <h3>Verification sequence</h3>
            </Card.Title>
        </Card.Header>
        <Card.Content>
            <ModuleCycle class="mx-auto" sequence={gameModule.currentModule.mazePoints}/>
        </Card.Content>
    </Card.Root>
</div>

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
