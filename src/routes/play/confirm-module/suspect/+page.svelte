
<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Ellipsis } from "$lib/components/ui/loading-page-ellipsis";
    import { ModuleCycle } from "$lib/components/ui/moduleCycle"
    import { ModuleMaze } from "$lib/components/ui/moduleMaze"
    import { Separator } from '$lib/components/ui/separator';
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

    import { knuthShuffle } from 'knuth-shuffle';

	import type { IHCProfile, IHCHumanProfile, IHCPatientRobotProfile, IHCViolentRobotProfile } from "$lib/gameObjectTypes.svelte"
	import { clientRoleObject, clientStateObject, profileObject, sessionIDObject, webSocketObject, gameModule, gamePenalties } from "$lib/stateHandler.svelte"

    import humanData from "$lib/gameData/suspectProfiles/humanProfile.json" 
    import patientRobotData from "$lib/gameData/suspectProfiles/patientRobotProfiles.json" 
    import violentRobotData from "$lib/gameData/suspectProfiles/violentRobotProfiles.json"
    import profileStrings from "$lib/gameData/suspectProfiles/profileStrings.json"
    import profileBlurbs from "$lib/gameData/suspectProfiles/profileBlurbs.json"
    
    let profileString = $derived(profileObject.profile?.type ? profileStrings[profileObject.profile.type] : "")
    let profileBlurb = $derived(profileObject.profile?.type ? profileBlurbs[profileObject.profile.type] : "")
    
    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    let roleError = $derived(clientRoleObject.role !== "suspect")

    let invalidProfileDataError = $state(false)

    let invalidDataError = $derived(gamePenalties.currentPenalties === null || gameModule.currentModule === null || invalidProfileDataError)

    afterNavigate(() => {
        const randomIndex = Math.floor(Math.random() * 3)
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
        if (clientStateObject.state.gameState !== "confirm-module") {
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
        else if (invalidDataError) {
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

<h2>Module validation</h2>
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
    Note that there is no beginning or end to this sequence of letters; it is cyclical. If you are human, it may take you some time to figure out the answer to the question. If you are a robot, the answer is provided for you. Take some time to study your restrictions and obligations.
</p>
{#if !clientStateObject.state.sealedFile}
<p>
    If you answer the detective's question correctly on the first try, you will be allowed to pick between several backgrounds before the interrogation starts. Otherwise, one will be provided for you.
</p>
{/if}
<Card.Root class="w-3/4 mx-auto my-2">
    <Card.Header>
        <Card.Title>
            <h3>You are a {profileString}</h3>
            <p>{profileBlurb}</p>
        </Card.Title>
    </Card.Header>
    <Card.Content class="mt-auto">
        {#if !invalidProfileDataError && profileObject.profile?.type === "human"}
            <h3>Module Verification Maze</h3>
            <ModuleMaze class="w-3/4 mx-auto" sequence={gameModule.currentModule.mazePoints}/>
        {:else if !invalidProfileDataError}
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
                <ul>
                    {#each profileObject.profile.requirements as requirement}
                        <li>{requirement}</li>
                    {/each}
                </ul>
            {/if}
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