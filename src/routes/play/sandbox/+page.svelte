<script lang="ts">
    import { afterNavigate } from '$app/navigation';
    
    import * as Accordion from "#lib/components/ui/accordion/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
    import * as Carousel from "#lib/components/ui/carousel/index.js";
    import { default as AutoHeight } from 'embla-carousel-auto-height'
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

