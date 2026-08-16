<script lang="ts">
    import { afterNavigate } from '$app/navigation';
    
    import * as Accordion from "#lib/components/ui/accordion/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
    import { ModuleCycle } from "#lib/components/ui/moduleCycle/index.js"
    import { ModuleMaze } from "#lib/components/ui/moduleMaze/index.js"
    import { Separator } from '#lib/components/ui/separator/index.js';

    import { knuthShuffle } from 'knuth-shuffle';

    import type {
        IHCProfile,
        IHCHumanProfile,
        IHCPatientRobotProfile,
        IHCViolentRobotProfile,

        IHCModule

    } from "#lib/gameObjectTypes.svelte.js";

    import moduleData from "#lib/gameData/modules/modules.json";
    import humanData from "#lib/gameData/suspectProfiles/humanProfile.json";
    import patientRobotData from "#lib/gameData/suspectProfiles/patientRobotProfiles.json";
    import violentRobotData from "#lib/gameData/suspectProfiles/violentRobotProfiles.json";
    import profileStrings from "#lib/gameData/suspectProfiles/profileStrings.json";
    import profileBlurbs from "#lib/gameData/suspectProfiles/profileBlurbs.json";

    let profileObject: {profile: IHCProfile | null} = $state({profile: null})
    let gameModule: {currentModule: IHCModule} = $state({currentModule: moduleData[2] as IHCModule})

    let profileString = $derived(profileObject.profile?.type ? profileStrings[profileObject.profile.type] : "");
    let profileBlurb = $derived(profileObject.profile?.type ? profileBlurbs[profileObject.profile.type] : "");
    let invalidProfileDataError = $state(false);

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
    })
</script>

<Card.Root class="w-3/4 mx-auto my-2">
    <Card.Header>
        <Card.Title><h2>{gameModule.currentModule.name}</h2></Card.Title>
    </Card.Header>
    <Card.Content class="mt-auto">
        <img src={gameModule.currentModule.lightIcon} alt={gameModule.currentModule.name} class="w-1/4 mx-auto mb-1"/>
        <p>Difficulty: {gameModule.currentModule.difficulty}</p>
        <h3 class="mt-2">Module verification sequence</h3>
        <ModuleCycle class="w-3/4 mx-auto" sequence={gameModule.currentModule.mazePoints}/>
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