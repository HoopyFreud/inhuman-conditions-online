
<script lang="ts">
    import { goto } from '$app/navigation';
    
    import * as Accordion from "#lib/components/ui/accordion/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
	import * as ResizableToggleGroup from "#lib/components/ui/resizable-toggle-group/index.js";
	import { Button } from "#lib/components/ui/button/index.js";
    import { Checkbox } from "#lib/components/ui/checkbox/index.js";
    import { Label } from "#lib/components/ui/label/index.js";
    import { Separator } from "#lib/components/ui/separator/index.js"

	import type { IHCStateData, IHCRole } from "#lib/stateHandlerTypes.svelte.js"
	import { clientRoleObject, clientStateObject, sessionIDObject } from "#lib/stateHandler.svelte.js"
    import { updateGameState, assignRoles } from "#lib/stateHandler.svelte.js"
    import { getErrorContext } from '#lib/errorContext.js';

    let accordionValue = $derived(
        (clientStateObject.state.continuousCatalyzation || clientStateObject.state.permanentPenalty || clientStateObject.state.sealedFile) ?
        "rules-drawer" : undefined
    )

    let permanentPenaltyValue: boolean = $state(false)
    let continuousCatalyzationValue: boolean = $state(false)
    let sealedFileValue: boolean = $state(false)
    let digitalGameValue: boolean = $state(false)

    const gameError = getErrorContext()

    let disableSetupSubmission: boolean = $derived(clientRoleObject.role === null || gameError())

    async function performSetup() {
        if (!disableSetupSubmission) {
            if (clientRoleObject.role === "detective") {
                await assignRoles({self: "detective", other: "suspect"})
            }
            else if (clientRoleObject.role === "suspect") {
                await assignRoles({self: "suspect", other: "detective"})
            }
            const gameStateUpdate: Partial<IHCStateData> = {
                gameState: "select-penalty-prelim",
                permanentPenalty: $state.snapshot(permanentPenaltyValue),
                continuousCatalyzation: $state.snapshot(continuousCatalyzationValue),
                sealedFile: $state.snapshot(sealedFileValue),
                digitalGame: $state.snapshot(digitalGameValue)
            }
            await updateGameState(gameStateUpdate)
            await goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    }
</script>

<h2 class="max-w-3/4 mx-auto">Game Setup</h2>
<Card.Root class="w-1/2 mx-auto mt-2">
    <Card.Header>
        <Card.Title><h2>Select Role</h2></Card.Title>
    </Card.Header>
    <Card.Content>
        <ResizableToggleGroup.Root size="lg" variant="outline" type="single" class="flex place-center m-auto"
            bind:value={
                () => clientRoleObject.role ?? "",
                (v:IHCRole | "") => clientRoleObject.role = v || null
            }>
            <ResizableToggleGroup.Item value="detective" aria-label="Toggle Detective">
                <h3 class="m-0!">Detective</h3>
            </ResizableToggleGroup.Item>
            <ResizableToggleGroup.Item value="suspect" aria-label="Toggle Suspect">
                <h3 class="m-0!">Suspect</h3>
            </ResizableToggleGroup.Item>
        </ResizableToggleGroup.Root>
    </Card.Content>
</Card.Root>

<Accordion.Root type="single" class="w-3/4 mt-3 mx-auto" value={accordionValue}>
    <Accordion.Item value="rules-drawer">
        <Accordion.Trigger class="text-center"><h2>Optional rules</h2></Accordion.Trigger>
        <Accordion.Content class="w-full text-left">
            <Card.Root class="w-full">
                <Card.Content>
                    <div class="flex gap-3 w-full">
                        <Checkbox id="permanentPenalty" checked={permanentPenaltyValue}/>
                        <div class="grid gap-2">
                            <Label for="permanentPenalty"><h3>Enable permanent penalty</h3></Label>
                            <p class="text-sm text-muted-foreground">
                                The permanent penalty is an additional penalty that reads, "Answer 3 questions without referencing your Background."
                            </p>
                        </div>
                    </div>

                    <Separator class="mt-2! mb-4!"/>

                    <div class="flex gap-3 w-full">
                        <Checkbox id="continuousCatalyzation" checked={continuousCatalyzationValue}/>
                        <div class="grid gap-2">
                            <Label for="continuousCatalyzation"><h3>Enable continuous catalyzation</h3></Label>
                            <p class="text-sm text-muted-foreground">
                                Continuous catalyzation is an additional rule that requires the suspect to provide multiple calibration answers throughout the interrogation.
                            </p>
                        </div>
                    </div>

                    <Separator class="mt-2! mb-4!"/>

                    <div class="flex gap-3 w-full">
                        <Checkbox id="sealedFile" checked={sealedFileValue}/>
                        <div class="grid gap-2">
                            <Label for="sealedFile"><h3>Enable sealed file</h3></Label>
                            <p class="text-sm text-muted-foreground">
                                Sealed file is an optional rule that allows suspects to use their real-life identity as a background.
                            </p>
                        </div>
                    </div>

                    <Separator class="mt-2! mb-4!"/>

                    <div class="flex gap-3 my-3 w-full">
                        <Checkbox id="digitalGame" checked={digitalGameValue}/>
                        <div class="grid gap-2">
                            <Label for="digitalGame"><h3>Digital-only game</h3></Label>
                            <p class="text-sm text-muted-foreground">
                                Excludes penalties that are impractical for a digital-only game.
                            </p>
                        </div>
                    </div>
                </Card.Content>
            </Card.Root>
        </Accordion.Content>
    </Accordion.Item>
</Accordion.Root>
    
<Button disabled={disableSetupSubmission} type="submit" onclick={async () => await performSetup()} class="w-fit mx-auto h-auto py-3"><h3 class="text-wrap">Set Up Room</h3></Button>
