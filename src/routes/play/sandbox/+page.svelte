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
    import { Textarea } from "#lib/components/ui/textarea/index.js";
    import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

    import type { IHCStateData, IHCStateUpdate, IHCRole } from "#lib/stateHandlerTypes.svelte.js";
    import { sessionIDObject } from "#lib/stateHandler.svelte.js";

    import humanData from "#lib/gameData/suspectProfiles/humanProfile.json";
    import patientRobotData from "#lib/gameData/suspectProfiles/patientRobotProfiles.json";
    import violentRobotData from "#lib/gameData/suspectProfiles/violentRobotProfiles.json";
    import backgroundData from "#lib/gameData/backgrounds/backgrounds.json"
    import penaltyData from "#lib/gameData/penalties/penalties.json" 
    import moduleData from "#lib/gameData/modules/modules.json" 

    import { updateGameState, moduleIconGlob } from "#lib/stateHandler.svelte.js";
    import { getErrorContext } from '#lib/errorContext.js';

    import profileStrings from "#lib/gameData/suspectProfiles/profileStrings.json"
    import profileBlurbs from "#lib/gameData/suspectProfiles/profileBlurbs.json";
    import type { IHCProfile, IHCPatientRobotProfile, IHCBackground, IHCModule, IHCPenalty } from '#lib/gameObjectTypes.svelte.js';

    const clientStateObject: {state: IHCStateData} = $state({
        state: {
            gameState: "interrogate",
            interrogationState: 'prelim',
            validatedSessions: 2,
            moduleID: 1,
            penaltyCardID: 1,
            backgroundCardID: 1,
            continuousCatalyzation: true,
            permanentPenalty: false,
            digitalGame: false,
            sealedFile: false,
            endTime: new Date(2026,8,20)
    }})

    const clientRoleObject: {role: IHCRole} = $state({
        role:  "suspect"
    })

    const profileID = 1

    const profileObject: {profile: IHCProfile} = $state({
        profile: {
            id: profileID,
            type: "patientRobot",
            restriction: patientRobotData.find((profile) => profile.id === profileID)?.restriction ?? [],
            explainerText: patientRobotData.find((profile) => profile.id === profileID)?.explainerText ?? "",
        }
    })

    const gameBackground: {currentBackground: IHCBackground} = $derived({
        currentBackground: backgroundData.find((background) => background.id === clientStateObject.state.backgroundCardID) as IHCBackground ?? null
    })

    const gameModule: {currentModule: IHCModule} = $derived({
        currentModule: moduleData.find((module) => module.id === clientStateObject.state.moduleID) as IHCModule ?? null
    })

    const gamePenalties: {currentPenalties: IHCPenalty[]} = $derived({
        currentPenalties: 
        typeof clientStateObject.state.penaltyCardID === "number" ?
            clientStateObject.state.permanentPenalty ? 
                penaltyData.filter((penalty) => penalty.id === 0 || penalty.id === clientStateObject.state.penaltyCardID) :
                penaltyData.filter((penalty) => penalty.id === clientStateObject.state.penaltyCardID)
            :
            []
    })

    const webSocketObject = {websocket: true}

    const gameModuleIcon = {
        currentModuleIcon: moduleIconGlob[moduleData.find((module) => module.id === clientStateObject.state.moduleID)?.lightIcon ?? ""]
    }
    
    let moduleIcon = $derived(gameModuleIcon.currentModuleIcon)

    let endTime = $derived(clientStateObject.state.endTime?.getTime() ?? Infinity)

    let countdownInterval: any = null
    let lastQuestionTimeout: any = null

    let timerTime = $state(Infinity)
    let timerText = $derived.by(() => {
        if (timerTime !== Infinity) {
            const minutes = Math.floor(timerTime / 60000)
            const seconds = Math.floor((timerTime - minutes*60000) / 1000)
            const millis = timerTime - (minutes*60000+seconds*1000)
            return minutes.toString() + ":" + seconds.toString().padStart(2,"0") + ":" + millis.toString().padStart(3,"0")
        }
        else {
            return "0:00:000"
        }
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
        if (webSocketObject.websocket !== null && clientStateObject.state.gameState !== "interrogate") {
            clearInterval(countdownInterval)
            clearTimeout(lastQuestionTimeout)
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
        else if (webSocketObject.websocket !== null && clientStateObject.state.interrogationState === "pause") {
            clearInterval(countdownInterval)
            clearTimeout(lastQuestionTimeout)
        }
        else if (webSocketObject.websocket !== null && clientStateObject.state.interrogationState === "ongoing") {
            console.log("timer refresh")
            clearInterval(countdownInterval)
            timerTime = endTime - Date.now()
            countdownInterval = setInterval(() => {
                if (clientStateObject.state.endTime !== null) {
                    untrack(() => timerTime = endTime - Date.now())
                }
            },20)
            lastQuestionTimeout = setTimeout(() => {
                updateInterrogationState("last-question")
            },endTime)
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
            Confirm the suspect's background by reading the following statement out loud.
        </p>
        {#if clientStateObject.state.sealedFile}
            <p>
                "Tell me something about yourself."
            </p>
        {:else}
            <p>
                "It says here you're a {gameBackground.currentBackground.background}. Tell me something about that."
            </p>
        {/if}
        <Separator class="w-3/4! my-2 mx-auto"/>
        <p>
            After they have answered this question, read the following statement out loud, then start the timer.
        </p>
        <p>
            {@html gameModule.currentModule.coverSheet}
        </p>
        {#if clientStateObject.state.continuousCatalyzation}
            <Separator class="w-3/4! my-2 mx-auto"/>
        {/if}
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
<div class="flex flex-col justify-between gap-2 w-3/4 mx-auto">
    <Card.Root class="w-full">
        <Card.Content class="flex flex-row gap-2 justify-center">
            <h3 class="inline-block w-fit! my-auto text-right text-lg">
                Time remaining:
            </h3>
            <h3 class="inline-block w-fit! my-auto">
                {#each timerText as c}
                    <span class="w-4 inline-block text-center text-lg">{c}</span>
                {/each}
            </h3>
            <div class="flex flex-row my-auto pl-4 justify-start">
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
                    <Button disabled={disableNonResumeUI} variant="destructive" type="submit" onclick={async () => await updateInterrogationState("kill-attempt")} class="w-fit mx-auto"><h3>Kill (On Suspicion of Being A Robot)</h3></Button>
                    <Button disabled={disableNonResumeUI} variant="destructive" type="submit" onclick={async () => await updateOverallGameState("end-game-win-detective")} class="w-fit mx-auto"><h3>Kill (Repeated Verification Failure)</h3></Button>
                {:else}
                    <Button disabled={disableNonResumeUI} variant="destructive" type="submit" onclick={async () => await updateInterrogationState("kill-attempt")} class="w-fit mx-auto"><h3>Kill</h3></Button>
                {/if}
        </Card.Content>
    </Card.Root>
    {#each gamePenalties.currentPenalties as activePenalty}
        <Card.Root class="w-full">
            <Card.Content>
                    <h3>Penalty: {activePenalty.text}</h3>
            </Card.Content>
        </Card.Root>
    {/each}
    <Card.Root class="w-full">
        <Card.Content>
                <h3>Background: {gameBackground.currentBackground.background}</h3>
        </Card.Content>
    </Card.Root>
    <Card.Root>
        <Card.Header>
            <Card.Title><h3>{gameModule.currentModule.name}</h3></Card.Title>
        </Card.Header>
        <Card.Content class="flex flex-col h-full gap-2 justify-between">
            <img src={moduleIcon} alt={gameModule.currentModule.name} class="w-1/4 mx-auto"/>
            <p>Difficulty: {gameModule.currentModule.difficulty}</p>
            <h3>Primary prompts</h3>
            <Accordion.Root type="single" class="w-full">
                {#each gameModule.currentModule.primaryPrompts as prompt, index}
                    <Accordion.Item value={"item-" + index.toString()}>
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
            </Accordion.Root>
            <h3>Secondary prompts</h3>
            <Accordion.Root type="single" class="w-full">
                {#each gameModule.currentModule.secondaryPrompts as prompt, index}
                    <Accordion.Item value={"item-" + index.toString()}>
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
            </Accordion.Root>
        </Card.Content>
    </Card.Root>
    <Card.Root class="w-full">
        <Card.Header>
            <Card.Title>
                <h3>Verification sequence</h3>
            </Card.Title>
        </Card.Header>
        <Card.Content>
            <ModuleCycle class="mx-auto w-1/2" sequence={gameModule.currentModule.mazePoints}/>
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