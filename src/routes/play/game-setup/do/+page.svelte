
<script lang="ts">
    import { goto } from '$app/navigation';
    
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
    import { Checkbox } from "$lib/components/ui/checkbox/index.js";
    import { Label } from "$lib/components/ui/label/index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCStateData, IHCRole } from "$lib/stateHandler.svelte"
	import { clientRoleObject, webSocketObject, clientStateObject, sessionIDObject } from "$lib/stateHandler.svelte"
    import { updateGameState, assignRoles } from "$lib/stateHandler.svelte"

    let permanentPenaltyValue: boolean = $state(false)
    let continuousCatalyzationValue: boolean = $state(false)
    let sealedFileValue: boolean = $state(false)
    let digitalGameValue: boolean = $state(false)

    let validState = $derived(
        clientStateObject.state.gameState === "game-setup" ||
        clientStateObject.state.gameState === "select-penalty-prelim"
    )
    let stateUpdateError = $derived(!validState)
    let websocketError = $derived(webSocketObject.websocket === null)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "select-penalty-prelim",
        permanentPenalty: permanentPenaltyValue,
        continuousCatalyzation: continuousCatalyzationValue,
        sealedFile: sealedFileValue,
        digitalGame: digitalGameValue
    })

    let disableSetupButton: boolean = $derived(clientRoleObject.role === null || stateUpdateError)

    async function performSetup() {
        if (clientRoleObject.role === "detective") {
            assignRoles({self: "detective", other: "suspect"})
            await updateGameState(gameStateUpdate)
            goto("/play/select-penalty-prelim/detective-do?room="+sessionIDObject.ID)
        }
        else if (clientRoleObject.role === "suspect") {
            assignRoles({self: "suspect", other: "detective"})
            await updateGameState(gameStateUpdate)
            goto("/play/select-penalty-prelim/suspect-await?room="+sessionIDObject.ID)
        }
    }

    $effect(() => {
        if (websocketError) {
            console.log("Websocket failure")
        }
        else if (stateUpdateError) {
                console.log("Failed state update, closing websocket")
                webSocketObject.websocket?.close()
        }
    })
</script>

<svelte:head>
	<title>Identity Crisis - Play</title>
	<meta name="description" content="Play Identity Crisis" />
</svelte:head>

<h2>Game Setup</h2>
<h2>Select Role</h2>
<ToggleGroup.Root size="lg" variant="outline" type="single" class="flex place-center m-auto" bind:value={() => clientRoleObject.role ?? undefined,(v:IHCRole | undefined) => clientRoleObject.role = v ?? null}>
    <ToggleGroup.Item value="detective" aria-label="Toggle Detective">
        <h3 class="m-0!">Detective</h3>
    </ToggleGroup.Item>
    <ToggleGroup.Item value="suspect" aria-label="Toggle Suspect">
        <h3 class="m-0!">Suspect</h3>
    </ToggleGroup.Item>
</ToggleGroup.Root>

<div class="flex items-center gap-3">
    <Checkbox id="permanentPenalty" checked={permanentPenaltyValue}/>
    <div class="grid gap-2">
        <Label for="permanentPenalty">Enable permanent penalty</Label>
        <p class="text-sm text-muted-foreground">
            The permanent penalty is an additional penalty that reads, "Answer 3 questions without referencing your Background."
        </p>
    </div>
</div>

<div class="flex items-center gap-3">
    <Checkbox id="continuousCatalyzation" checked={continuousCatalyzationValue}/>
    <div class="grid gap-2">
        <Label for="continuousCatalyzation">Enable continuous catalyzation</Label>
        <p class="text-sm text-muted-foreground">
            Continuous catalyzation is an additional rule that requires the suspect to provide multiple calibration answers throughout the interrogation.
        </p>
    </div>
</div>

<div class="flex items-center gap-3">
    <Checkbox id="sealedFile" checked={sealedFileValue}/>
    <div class="grid gap-2">
        <Label for="sealedFile">Enable sealed file</Label>
        <p class="text-sm text-muted-foreground">
            Sealed file is an optional rule that allows suspects to use their real-life identity as a background.
        </p>
    </div>
</div>

<div class="flex items-center gap-3">
    <Checkbox id="digitalGame" checked={digitalGameValue}/>
    <div class="grid gap-2">
        <Label for="digitalGame">Digital-only game</Label>
        <p class="text-sm text-muted-foreground">
            Excludes penalties that are impractical for a digital-only game.
        </p>
    </div>
</div>
    
<Button disabled={disableSetupButton} variant="outline" type="submit" onclick={async () => await performSetup()} class="w-fit m-auto mt-4 "><h3>Set Up Room</h3></Button>

{#if stateUpdateError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Failed to update game state</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and choose a different room to join.</p>
    </Alert.Description>
</Alert.Root>
{/if}
{#if websocketError}
<Alert.Root variant="destructive">
    <AlertCircleIcon />
    <Alert.Title>Websocket closed unexpectedly</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}