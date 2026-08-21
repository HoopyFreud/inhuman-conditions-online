<script lang="ts">
    import { untrack } from 'svelte';
    import { goto } from '$app/navigation';
    
    import * as Accordion from "#lib/components/ui/accordion/index.js";
	import * as Alert from "#lib/components/ui/alert/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
    import { ModuleCycle } from "#lib/components/ui/moduleCycle/index.js"
    import { Separator } from "#lib/components/ui/separator//index.js";
    import { Textarea } from "#lib/components/ui/textarea/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

    import type { IHCStateData } from "#lib/stateHandlerTypes.svelte.js";
	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject, gameBackground, gameModule, gameModuleIcon, gamePenalties } from "#lib/stateHandler.svelte.js"

    import { updateGameState } from "#lib/stateHandler.svelte.js";
    import { getErrorContext } from '#lib/errorContext.js';

    let moduleIcon = $derived(gameModuleIcon.currentModuleIcon)

    let endTime = $derived(clientStateObject.state.endTime?.getTime() ?? Infinity)

    let countdownInterval: any = null
    let lastQuestionTimeout: any = null

    let timerTime = $state(300000)
    let timerText = $derived.by(() => {
        const minutes = Math.floor(timerTime / 60000)
        const seconds = Math.floor((timerTime - minutes*60000) / 1000)
        const millis = timerTime - (minutes*60000+seconds*1000)
        return minutes.toString() + ":" + seconds.toString().padStart(2,"0") + ":" + millis.toString().padStart(3,"0")
    })

    const gameError = getErrorContext()

    let roleError = $derived(clientRoleObject.role !== "detective")
    let invalidDataError = $derived(gameBackground.currentBackground === null || gameModule.currentModule === null || gamePenalties.currentPenalties === null)
    
    let disableStateUpdate = $derived(invalidDataError || gameError())
    let disableNonResumeUI = $derived(disableStateUpdate || clientStateObject.state.interrogationState !== "ongoing")

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

    $effect(() => {
        if (webSocketObject.websocket !== null && clientStateObject.state.gameState !== "interrogate") {
            clearInterval(countdownInterval)
            clearTimeout(lastQuestionTimeout)
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    })

    $effect(() => {
        if (webSocketObject.websocket !== null && clientStateObject.state.gameState === "interrogate" && clientStateObject.state.interrogationState === "pause") {
            clearInterval(countdownInterval)
            clearTimeout(lastQuestionTimeout)
        }
    })

    $effect(() => {
        if (webSocketObject.websocket !== null && clientStateObject.state.gameState === "interrogate" && clientStateObject.state.interrogationState === "ongoing") {
            clearInterval(countdownInterval)
            clearTimeout(lastQuestionTimeout)
            timerTime = endTime - Date.now()
            countdownInterval = setInterval(() => {
                if (clientStateObject.state.endTime !== null) {
                    untrack(() => timerTime = endTime - Date.now())
                }
            },20)
            lastQuestionTimeout = setTimeout(() => {
                updateInterrogationState("last-question")
            },timerTime)
        }
    })

    $effect(() => {
        if (webSocketObject.websocket !== null && clientStateObject.state.gameState === "interrogate" && clientStateObject.state.interrogationState === "last-question") {
            clearInterval(countdownInterval)
            clearTimeout(lastQuestionTimeout)
            timerTime = 0
        }
    })

    $effect(() => {
        if (invalidDataError) {
            console.log("Bad penalty, background, profile, or module data, closing websocket")
            webSocketObject.websocket?.close()
        }
    })
</script>

<h2 class="max-w-3/4 mx-auto">Interrogation</h2>
<div class="flex flex-col gap-2 w-3/4 text-left mx-auto">
    {#if clientStateObject.state.interrogationState === "prelim"}
        <p>
            Confirm the suspect's background by reading the following statement out loud.
        </p>
        {#if clientStateObject.state.sealedFile}
            <p>
                "Tell me something about yourself."
            </p>
        {:else}
            <p>
                "It says here you're a {gameBackground.currentBackground?.background}. Tell me something about that."
            </p>
        {/if}
        <Separator class="w-3/4! my-2 mx-auto"/>
        <p>
            After they have answered this question, read the following statement out loud, then start the timer.
        </p>
        <p>
            {@html gameModule.currentModule?.coverSheet}
        </p>
        {#if clientStateObject.state.continuousCatalyzation}
            <Separator class="w-3/4! my-2 mx-auto"/>
        {/if}
    {:else if clientStateObject.state.interrogationState === "last-question"}
        <p>
            You may ask the suspect one final question. Once they have answered, you must either kill them or let them go.
        </p>
    {/if}
    {#if clientStateObject.state.continuousCatalyzation}
        <p>
            Continuous Catalyzation is enabled for this game.
        </p>
        <p>
            At each minute mark on the timer, the suspect must provide you with the next letter in the verification sequence, starting from the letter after the one you asked for during Module Verification.
        </p>
        <p>
            If they fail to provide this information, you must announce that they have not. Then, if they have failed to provide this information twice, you may kill them immediately. If you do, you will win, whether or not they are a robot.
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
                {:else if clientStateObject.state.interrogationState === "prelim"}
                    <Button disabled={disableStateUpdate} type="submit" onclick={async () => await updateInterrogationState("ongoing")} class="w-fit inline-block"><h3>Begin</h3></Button>
                {/if}
            </div>
        </Card.Content>
    </Card.Root>
    <Card.Root class="w-full">
        <Card.Content class="flex flex-col gap-4 justify-around">
                {#if clientStateObject.state.continuousCatalyzation}
                    <Button disabled={disableNonResumeUI} variant="destructive" type="submit" onclick={async () => await updateInterrogationState("kill-attempt")} class="w-fit mx-auto h-auto py-3"><h3 class="text-wrap">Kill (On Suspicion of Being A Robot)</h3></Button>
                    <Button disabled={disableNonResumeUI} variant="destructive" type="submit" onclick={async () => await updateOverallGameState("end-game-win-detective")} class="w-fit mx-auto h-auto py-3"><h3 class="text-wrap">Kill (Repeated Verification Failure)</h3></Button>
                {:else}
                    <Button disabled={disableNonResumeUI} variant="destructive" type="submit" onclick={async () => await updateInterrogationState("kill-attempt")} class="w-fit mx-auto h-auto py-3"><h3 class="text-wrap">Kill The Suspect</h3></Button>
                {/if}
                <Button disabled={clientStateObject.state.interrogationState !== "last-question"} type="submit" onclick={async () => await updateInterrogationState("spare")} class="w-fit mx-auto h-auto py-3"><h3 class="text-wrap">Let the suspect go</h3></Button>
        </Card.Content>
    </Card.Root>
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
    <Card.Root>
        <Card.Content class="flex flex-col h-full gap-2 justify-between">
            <Accordion.Root type="single" class="w-full">
                <Accordion.Item value="item-title">
                    <Accordion.Trigger><h3 class="text-center">{gameModule.currentModule?.name}</h3></Accordion.Trigger>
                    <Accordion.Content>
                        <img src={moduleIcon} alt={gameModule.currentModule?.name} class="w-1/4 mx-auto"/>
                        <p>Difficulty: {gameModule.currentModule?.difficulty}</p>
                    </Accordion.Content>
                </Accordion.Item>
                <h3 class="mt-4">Primary prompts</h3>
                {#each gameModule.currentModule?.primaryPrompts as prompt, index}
                    <Accordion.Item value={"item-p-" + index.toString()}>
                        <Accordion.Trigger>{prompt.task}</Accordion.Trigger>
                        <Accordion.Content class="ml-4 text-left">
                        <p>Examples:</p>
                        <ul style="list-style-type: disc; list-style-position: inside;">
                            {#each prompt.samplePrompts as sample}
                                <li>
                                    {sample}
                                </li>
                            {/each}
                        </ul>
                        </Accordion.Content>
                    </Accordion.Item>
                {/each}
                <h3 class="mt-4">Secondary prompts</h3>
                {#each gameModule.currentModule?.secondaryPrompts as prompt, index}
                    <Accordion.Item value={"item-s-" + index.toString()}>
                        <Accordion.Trigger>{prompt.task}</Accordion.Trigger>
                        <Accordion.Content class="ml-4 text-left">
                        <p>Examples:</p>
                        <ul style="list-style-type: disc; list-style-position: inside;">
                            {#each prompt.samplePrompts as sample}
                                <li>
                                    {sample}
                                </li>
                            {/each}
                        </ul>
                        </Accordion.Content>
                    </Accordion.Item>
                {/each}
                {#if clientStateObject.state.continuousCatalyzation}
                    <Accordion.Item value="item-verification">
                        <Accordion.Trigger><h3 class="text-center">Verification sequence</h3></Accordion.Trigger>
                        <Accordion.Content>
                            <ModuleCycle class="mx-auto w-1/2" sequence={gameModule.currentModule?.mazePoints ?? []}/>
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
    <Alert.Title>Bad incoming penalty or module data</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}