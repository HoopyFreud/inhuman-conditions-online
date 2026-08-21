<script lang="ts">
    import { untrack } from 'svelte';
    import { afterNavigate, goto } from '$app/navigation';
    
    import * as Accordion from "#lib/components/ui/accordion/index.js";
	import * as Alert from "#lib/components/ui/alert/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
    import { ModuleCycle } from "#lib/components/ui/moduleCycle/index.js"
    import { ModuleMaze } from "#lib/components/ui/moduleMaze/index.js"
    import { Separator } from "#lib/components/ui/separator//index.js";
    import { Textarea } from "#lib/components/ui/textarea/index.js";
    import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

    import type { IHCStateData } from "#lib/stateHandlerTypes.svelte.js";
    import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject, gameBackground, gameModule, gamePenalties, gameProfile, gameProfileBlurb, gameProfileString } from "#lib/stateHandler.svelte.js";

    import { updateGameState } from "#lib/stateHandler.svelte.js";
    import { getErrorContext } from '#lib/errorContext.js';

    let endTime = $derived(clientStateObject.state.endTime?.getTime() ?? Infinity)

    let countdownInterval: any = null

    let timerTime = $state(300000)
    let timerText = $derived.by(() => {
        const minutes = Math.floor(timerTime / 60000)
        const seconds = Math.floor((timerTime - minutes*60000) / 1000)
        const millis = timerTime - (minutes*60000+seconds*1000)
        return minutes.toString() + ":" + seconds.toString().padStart(2,"0") + ":" + millis.toString().padStart(3,"0")
    })

    let accordionUISection: string[] = $state([])

    const gameError = getErrorContext()
    let roleError = $derived(clientRoleObject.role !== "suspect");
    let invalidDataError = $derived(gameBackground.currentBackground === null || gameModule.currentModule === null || gamePenalties.currentPenalties === null || gameProfile.currentProfile === null);

    let disableStateUpdate = $derived(invalidDataError || gameError())
    let disableNonResumeUI = $derived(invalidDataError || clientStateObject.state.interrogationState === "pause")

    async function updateInterrogationState(newState:IHCStateData["interrogationState"]) {
        if (!disableStateUpdate){
            const gameStateUpdate: Partial<IHCStateData> = {
                interrogationState: newState
            }
            if (newState === "ongoing") {
                gameStateUpdate.endTime = new Date(Date.now() + timerTime)
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

    afterNavigate(() => {
        switch (gameProfile.currentProfile?.type) {
            case "patientRobot":
                accordionUISection = ["restriction"]
                break
            case "violentRobot": 
                accordionUISection = ["requirements"]
                break
            default: 
                accordionUISection = ["rules"]
        }
    })

    $effect(() => {
        if (webSocketObject.websocket !== null && clientStateObject.state.gameState !== "interrogate") {
            clearInterval(countdownInterval)
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
        else if (webSocketObject.websocket !== null && clientStateObject.state.interrogationState === "pause") {
            clearInterval(countdownInterval)
        }
        else if (webSocketObject.websocket !== null && clientStateObject.state.interrogationState === "ongoing") {
            clearInterval(countdownInterval)
            timerTime = endTime - Date.now()
            countdownInterval = setInterval(() => {
                if (clientStateObject.state.endTime !== null) {
                    untrack(() => timerTime = endTime - Date.now())
                }
            },20)
        }
        else if (webSocketObject.websocket !== null && clientStateObject.state.interrogationState === "last-question") {
            clearInterval(countdownInterval)
            timerTime = 0
        }
        else if (webSocketObject.websocket !== null && clientStateObject.state.interrogationState === "kill-attempt") {
            clearInterval(countdownInterval)
            if (gameProfile.currentProfile?.type === "human") {
                updateOverallGameState("end-game-lose-together")
            }
            else {
                updateOverallGameState("end-game-win-detective")
            }
        }
        else if (webSocketObject.websocket !== null && clientStateObject.state.interrogationState === "spare") {
            clearInterval(countdownInterval)
            if (gameProfile.currentProfile?.type === "human") {
                updateOverallGameState("end-game-win-together")
            }
            else {
                updateOverallGameState("end-game-win-robot")
            }
        }
        else if (invalidDataError) {
            console.log("Bad penalty, background, profile, or module data, closing websocket")
            webSocketObject.websocket?.close()
        }
    })    
</script>

<h2 class="max-w-3/4 mx-auto">Interrogation</h2>
<div class="flex flex-col gap-2 w-3/4 text-left mx-auto">
    {#if clientStateObject.state.interrogationState === "prelim"}
        <p>
            The detective will ask you a question about your background and read you a statement aloud before the timer starts.
        </p>
        <p>
            You can give as lengthy or short a response as you like.
        </p>
        {#if clientStateObject.state.continuousCatalyzation}
            <Separator class="w-3/4! my-2 mx-auto"/>
        {/if}
    {:else if clientStateObject.state.interrogationState === "last-question"}
        <p>
            The detective will ask you one last question. Once you have answered, they will either kill you or let you go.
        </p>
        {#if gameProfile.currentProfile?.type === "patientRobot"}
        <p>
            If you have not performed the penalty enough times to make up for your restriction violations yet, you may not answer the detective's final question until you do.
        </p>
        {:else if gameProfile.currentProfile?.type === "violentRobot"}
        <p>
            If you have not fulfilled at least two of your requirements yet, you may not answer the detective's final question until you do.
        </p>
        {/if}
    {/if}
    {#if clientStateObject.state.continuousCatalyzation}
        <p>
            Continuous Catalyzation is enabled for this game.
        </p>
        <p>
            At each minute mark on the timer, you must provide the detective with the next letter in the verification sequence, starting from the letter after the one they asked for during Module Verification.
        </p>
        <p>
            If you fail to provide this information twice, you will be killed and the detective will win, regardless of whether you are a robot.
        </p>
    {/if}
</div>
<div class="flex flex-col justify-between gap-2 w-3/4 mx-auto mt-2">
    <Card.Root class="w-full">
        <Card.Content class="flex gap-2 justify-center flex-col lg:flex-row">
            <h3 class="inline-block w-fit! my-auto mx-auto text-lg lg:text-right ">
                Time remaining:
            </h3>
            <h3 class="inline-block w-fit! mx-auto lg:my-auto">
                {#each timerText as c}
                    <span class="w-4 inline-block text-center text-lg">{c}</span>
                {/each}
            </h3>
            <div class="flex flex-row my-auto mx-auto lg:justify-start lg:pl-4">
                {#if clientStateObject.state.interrogationState === "pause"}
                    <Button disabled={disableStateUpdate} type="submit" onclick={async () => await updateInterrogationState("ongoing")} class="w-fit my-auto inline-block"><h3>Resume</h3></Button>
                {:else if clientStateObject.state.interrogationState === "ongoing"}
                    <Button disabled={disableStateUpdate} variant="destructive" type="submit" onclick={async () => await updateInterrogationState("pause")} class="w-fit my-auto inline-block"><h3>Pause</h3></Button>
                {/if}
            </div>
        </Card.Content>
    </Card.Root>
    {#if gameProfile.currentProfile?.type === "violentRobot"}
    <Card.Root class="w-full">
        <Card.Header>
            <Card.Title>
                <Button disabled={disableNonResumeUI} variant="destructive" type="submit" onclick={async () => await updateOverallGameState("end-game-win-robot")} class="w-fit mx-auto h-auto py-3"><h3 class="text-wrap">Kill (Fulfilled two requirements)</h3></Button>
            </Card.Title>
        </Card.Header>
    </Card.Root>
    {/if}
    {#each gamePenalties.currentPenalties as activePenalty}
        <Card.Root class="w-full">
            <Card.Content>
                    <h3 class="inline">Penalty:</h3> <span>{activePenalty.text}</span>
            </Card.Content>
        </Card.Root>
    {/each}
    <Card.Root class="w-full">
        <Card.Content>
                <h3 class="inline">Background:</h3> <span>{gameBackground.currentBackground?.background}</span>
        </Card.Content>
    </Card.Root>
    <Card.Root class="w-full">
        <Card.Header>
            <Card.Title>
                <h3>Identity: {gameProfileString.currentProfileString}</h3>
            </Card.Title>
        </Card.Header>
        <Card.Content>
            <Accordion.Root type="multiple" class="w-3/4 mx-auto" bind:value={accordionUISection}>
                <Accordion.Item value="rules">
                    <Accordion.Trigger><h3 class="text-center">Rules</h3></Accordion.Trigger>
                    <Accordion.Content class="w-full text-left">
                        {#each gameProfileBlurb.currentProfileBlurb as blurbLine}
                            <p class="text-base">{blurbLine}</p>
                        {/each}
                    </Accordion.Content>
                </Accordion.Item>
                {#if gameProfile.currentProfile?.type === "patientRobot"}
                    <Accordion.Item value="restriction">
                        <Accordion.Trigger><h3 class="text-center">Restriction</h3></Accordion.Trigger>
                        <Accordion.Content class="w-full text-left">
                            <p class="text-base">{gameProfile.currentProfile?.restriction}</p>
                            {#if gameProfile.currentProfile?.explainerText !== ""}
                                <p class="text-base text-muted-foreground">Note: {gameProfile.currentProfile?.explainerText}</p>
                            {/if}
                        </Accordion.Content>
                    </Accordion.Item>
                {:else if gameProfile.currentProfile?.type === "violentRobot"}
                    <Accordion.Item value="requirements">
                        <Accordion.Trigger><h3>Requirements</h3></Accordion.Trigger>
                        <Accordion.Content class="w-full text-left">
                            <ul class="justify-items-start" style="list-style-type: upper-alpha">
                                {#each gameProfile.currentProfile?.requirements as requirement}
                                    <Separator class="my-2 mx-auto"/>
                                    <li>{requirement}</li>
                                {/each}
                            </ul>
                        </Accordion.Content>
                    </Accordion.Item>
                {/if}
                {#if clientStateObject.state.continuousCatalyzation}
                    <Accordion.Item value="item-verification">
                        <Accordion.Trigger><h3 class="text-center">Verification sequence</h3></Accordion.Trigger>
                        <Accordion.Content>
                            {#if gameProfile.currentProfile?.type === "human" && !disableNonResumeUI}
                                <ModuleMaze class="mx-auto w-1/2" sequence={gameModule.currentModule?.mazePoints ?? []}/>
                            {:else if !disableNonResumeUI}
                                <ModuleCycle class="mx-auto w-1/2" sequence={gameModule.currentModule?.mazePoints ?? []}/>
                            {:else}
                                <h3>Game is currently paused</h3>
                            {/if}
                        </Accordion.Content>
                    </Accordion.Item>
                {/if}
            </Accordion.Root>
        </Card.Content>
    </Card.Root>
    <Card.Root class="w-full">
        <Card.Header>
            <Card.Title>
                <h3>Notes</h3>
            </Card.Title>
        </Card.Header>
        <Card.Content>
            <Textarea class="w-full" />
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
