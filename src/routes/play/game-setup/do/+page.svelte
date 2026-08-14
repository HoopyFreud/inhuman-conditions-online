
<script lang="ts">
    import { goto } from '$app/navigation';
    
    import * as Accordion from "$lib/components/ui/accordion/index.js";
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
    import { Separator } from "$lib/components/ui/separator"
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCStateData, IHCRole } from "$lib/stateHandlerTypes.svelte"
	import { clientRoleObject, webSocketObject, clientStateObject, sessionIDObject } from "$lib/stateHandler.svelte"
    import { updateGameState, assignRoles } from "$lib/stateHandler.svelte"
    import { getErrorContext } from '$lib/errorContext';
    
    const gameError = getErrorContext()

    let permanentPenaltyValue: boolean = $state(false)
    let continuousCatalyzationValue: boolean = $state(false)
    let sealedFileValue: boolean = $state(false)
    let digitalGameValue: boolean = $state(false)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "select-penalty-prelim",
        permanentPenalty: permanentPenaltyValue,
        continuousCatalyzation: continuousCatalyzationValue,
        sealedFile: sealedFileValue,
        digitalGame: digitalGameValue
    })

    let noRoleSelected = $derived(clientRoleObject.role === null)

    let validState = $derived(
        clientStateObject.state.gameState === "game-setup" ||
        clientStateObject.state.gameState === "select-penalty-prelim"
    )

    let stateUpdateError = $derived(!validState)

    let disableSetupSubmission: boolean = $derived(noRoleSelected || stateUpdateError || gameError())

    async function performSetup() {
        if (!disableSetupSubmission) {
            if (clientRoleObject.role === "detective") {
                await assignRoles({self: "detective", other: "suspect"})
                await updateGameState(gameStateUpdate)
                goto("/play/select-penalty-prelim/detective-do?room="+sessionIDObject.ID)
            }
            else if (clientRoleObject.role === "suspect") {
                await assignRoles({self: "suspect", other: "detective"})
                await updateGameState(gameStateUpdate)
                goto("/play/select-penalty-prelim/suspect-await?room="+sessionIDObject.ID)
            }
        }
    }

    $effect(() => {
        if (stateUpdateError) {
            console.log("Failed state update, closing websocket")
            webSocketObject.websocket?.close()
        }
    })
</script>

<h2>Game Setup</h2>
<h2>Select Role</h2>
<ToggleGroup.Root size="lg" variant="outline" type="single" class="flex place-center m-auto"
    bind:value={
    () => clientRoleObject.role ?? "",
    (v:IHCRole | "") => clientRoleObject.role = v || null
}>
    <ToggleGroup.Item value="detective" aria-label="Toggle Detective">
        <h3 class="m-0!">Detective</h3>
    </ToggleGroup.Item>
    <ToggleGroup.Item value="suspect" aria-label="Toggle Suspect">
        <h3 class="m-0!">Suspect</h3>
    </ToggleGroup.Item>
</ToggleGroup.Root>

<Accordion.Root type="single" class="gap-3 w-1/2 mt-3 mx-auto">
    <Accordion.Item value="item-1">
        <Accordion.Trigger class="text-center"><h2>Optional rules</h2></Accordion.Trigger>
        <Accordion.Content class="w-full text-left">
            <div class="flex gap-3 my-3 w-full">
                <Checkbox id="permanentPenalty" checked={permanentPenaltyValue}/>
                <div class="grid gap-2">
                    <Label for="permanentPenalty"><h3>Enable permanent penalty</h3></Label>
                    <p class="text-sm text-muted-foreground">
                        The permanent penalty is an additional penalty that reads, "Answer 3 questions without referencing your Background."
                    </p>
                </div>
            </div>

            <Separator />

            <div class="flex gap-3 my-3 w-full">
                <Checkbox id="continuousCatalyzation" checked={continuousCatalyzationValue}/>
                <div class="grid gap-2">
                    <Label for="continuousCatalyzation"><h3>Enable continuous catalyzation</h3></Label>
                    <p class="text-sm text-muted-foreground">
                        Continuous catalyzation is an additional rule that requires the suspect to provide multiple calibration answers throughout the interrogation.
                    </p>
                </div>
            </div>

            <Separator />

            <div class="flex gap-3 my-3 w-full">
                <Checkbox id="sealedFile" checked={sealedFileValue}/>
                <div class="grid gap-2">
                    <Label for="sealedFile"><h3>Enable sealed file</h3></Label>
                    <p class="text-sm text-muted-foreground">
                        Sealed file is an optional rule that allows suspects to use their real-life identity as a background.
                    </p>
                </div>
            </div>

            <Separator />

            <div class="flex gap-3 my-3 w-full">
                <Checkbox id="digitalGame" checked={digitalGameValue}/>
                <div class="grid gap-2">
                    <Label for="digitalGame"><h3>Digital-only game</h3></Label>
                    <p class="text-sm text-muted-foreground">
                        Excludes penalties that are impractical for a digital-only game.
                    </p>
                </div>
            </div>
        </Accordion.Content>
    </Accordion.Item>

</Accordion.Root>
    
<Button disabled={disableSetupSubmission} variant="outline" type="submit" onclick={async () => await performSetup()} class="w-fit mx-auto mb-2 "><h3>Set Up Room</h3></Button>

{#if stateUpdateError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Failed to update game state</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and choose a different room to join.</p>
    </Alert.Description>
</Alert.Root>
{/if}