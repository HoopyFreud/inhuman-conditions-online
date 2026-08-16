
<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    
	import * as Alert from "#lib/components/ui/alert/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
    import { Ellipsis } from "#lib/components/ui/loading-page-ellipsis/index.js";
    import { ModuleCycle } from "#lib/components/ui/moduleCycle/index.js"
    import { ModuleMaze } from "#lib/components/ui/moduleMaze/index.js"
    import { Separator } from '#lib/components/ui/separator/index.js';
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

    import { knuthShuffle } from 'knuth-shuffle';

    import type {
        IHCHumanProfile,
        IHCPatientRobotProfile,
        IHCViolentRobotProfile
    } from "#lib/gameObjectTypes.svelte.js";

    import {
        clientRoleObject,
        clientStateObject,
        profileObject,
        sessionIDObject,
        webSocketObject,
        gameModule,
        gamePenalties
    } from "#lib/stateHandler.svelte.js";

    import humanData from "#lib/gameData/suspectProfiles/humanProfile.json";
    import patientRobotData from "#lib/gameData/suspectProfiles/patientRobotProfiles.json";
    import violentRobotData from "#lib/gameData/suspectProfiles/violentRobotProfiles.json";
    import profileStrings from "#lib/gameData/suspectProfiles/profileStrings.json";
    import profileBlurbs from "#lib/gameData/suspectProfiles/profileBlurbs.json";

    let profileString = $derived(profileObject.profile?.type ? profileStrings[profileObject.profile.type] : "");
    let profileBlurb = $derived(profileObject.profile?.type ? profileBlurbs[profileObject.profile.type] : "");
    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1);
    let roleError = $derived(clientRoleObject.role !== "suspect");
    let invalidProfileDataError = $state(false);
    let invalidDataError = $derived(gamePenalties.currentPenalties === null || gameModule.currentModule === null || invalidProfileDataError);

    afterNavigate(() => {
        const randomIndex = Math.floor(Math.random() * 3);

        switch (randomIndex) {
            case 0:
                profileObject.profile = humanData as IHCHumanProfile
                break
            case 1:
                profileObject.profile = knuthShuffle(
                    patientRobotData.filter((robotData) => 
                    gameModule.currentModule.patientRobotProfiles.includes(robotData.id))
                )[0] as IHCPatientRobotProfile
                break
            case 2:
                profileObject.profile = knuthShuffle(
                    violentRobotData.filter((robotData) => 
                    gameModule.currentModule.violentRobotProfiles.includes(robotData.id))
                )[0] as IHCViolentRobotProfile
                break
        }
        if (profileObject.profile === null) {
            invalidProfileDataError = true
        }

    })

    $effect(() => {
        if (webSocketObject.websocket !== null && clientStateObject.state.gameState !== "confirm-module") {
            goto("/play/" + clientStateObject.state.gameState + "/" + clientRoleObject.role + "?room=" + sessionIDObject.ID);
        } else if (invalidDataError) {
            console.log("Bad penalty or module data, closing websocket");
            webSocketObject.websocket?.close();
        }
    });
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
</div>
<Separator class="w-3/4! my-4 mx-auto"/>
<h2 class="max-w-3/4 mx-auto">Module validation</h2>
<div class="flex flex-col gap-2 w-3/4 text-left mx-auto">
    {#if !clientStateObject.state.continuousCatalyzation}
        <p>
            The detective will now ask you a question about the module sequence shown below, such as "what letters come between D and A?" or "what letter follows B?"
        </p>
    {:else}
        <p>
            The detective will now ask you a question about the module sequence shown below with a single answer, such as "what letter is between D and A?" or "what letter follows B?" but not "what two letters are between E and C?"
        </p>
    {/if}
    <p>
        Note that there is no beginning or end to this sequence of letters; it is cyclical.
    </p>
    {#if profileObject.profile?.type === "human"}
        <p>
            Because you are a human, you will need to solve the maze below to answer this question.
        </p>
    {:else}
        <p>
            Because you are a robot, you will not need to solve a maze to answer this question. Take some time to study your restrictions and obligations, as a human would need to solve a maze to obtain the answer.
        </p>
    {/if}
    {#if !clientStateObject.state.sealedFile}
        <p>
            If you answer the detective's question correctly on the first try, you will be allowed to pick between several backgrounds before the interrogation starts. Otherwise, one will be provided for you.
        </p>
    {/if}
</div>
<Card.Root class="w-3/4 mx-auto mt-4">
    <Card.Header>
        <Card.Title>
            <h2>You are a {profileString}</h2>
            <div class="flex flex-col gap-2 max-w-3/4 w-fit mx-auto text-left">
                {#each profileBlurb as blurbLine}
                    <p class="text-base">{blurbLine}</p>
                {/each}
            </div>
        </Card.Title>
    </Card.Header>
    <Card.Content>
        {#if !invalidProfileDataError && profileObject.profile?.type === "human"}
            <h3>Module Verification Maze</h3>
            <ModuleMaze class="w-3/4 mx-auto" sequence={gameModule.currentModule.mazePoints}/>
        {:else if !invalidProfileDataError}
            {#if profileObject.profile?.type === "patientRobot"}
                {#if typeof profileObject.profile.restriction === "string"}
                    <h3>Restriction</h3>
                    <div class="max-w-3/4 w-fit mx-auto text-left">
                        <p class="text-base">{profileObject.profile.restriction}</p>
                        {#if profileObject.profile.explainerText !== ""}
                            <p class="text-base text-muted-foreground">Note: {profileObject.profile.explainerText}</p>
                        {/if}
                    </div>
                {:else}
                    <h3>Restriction — Choose One</h3>
                    <ul class="max-w-3/4 w-fit mx-auto text-left" style="list-style-type: upper-alpha; list-style-position: inside;">
                        {#each profileObject.profile.restriction as restriction}
                            <Separator class="my-2 mx-auto"/>
                            <li class="text-base">{restriction}</li>
                        {/each}
                        <Separator class="my-2 mx-auto"/>
                    </ul>
                {/if}
            {:else if profileObject.profile?.type === "violentRobot"}
                <h3>Requirements</h3>
                <ul class="max-w-3/4 w-fit mx-auto text-left" style="list-style-type: upper-alpha; list-style-position: inside;">
                    {#each profileObject.profile.requirements as requirement}
                        <Separator class="my-2 mx-auto"/>
                        <li class="text-base">{requirement}</li>
                    {/each}
                    <Separator class="my-2 mx-auto"/>
                </ul>
            {/if}
            <h3 class="mt-3">Module Verification Sequence</h3>
            <ModuleCycle class="w-3/4 mx-auto" sequence={gameModule.currentModule.mazePoints}/>
        {/if}
    </Card.Content>
</Card.Root>
<Ellipsis />

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
