
<script lang="ts">
    import { goto } from '$app/navigation';
    
    import * as Accordion from "$lib/components/ui/accordion/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
    import { ModuleCycle } from "$lib/components/ui/moduleCycle"
    import { Separator } from '$lib/components/ui/separator';
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCStateData } from "$lib/stateHandlerTypes.svelte"
	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject, gameModule, gamePenalties } from "$lib/stateHandler.svelte"
    import { updateGameState } from "$lib/stateHandler.svelte"
    import { getErrorContext } from '$lib/errorContext';
    
    const gameError = getErrorContext()

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    let roleError = $derived(clientRoleObject.role !== "detective")

    let invalidDataError = $derived(gamePenalties.currentPenalties === null || gameModule.currentModule === null)

    let disableConfirmModule = $derived(roleError || invalidDataError || gameError())

    async function validationOutcome(newGameState: IHCStateData["gameState"]) {
        if (!disableConfirmModule) {
            const gameStateUpdate: Partial<IHCStateData> = {
                gameState: newGameState,
            }
            await updateGameState(gameStateUpdate)
            await goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    }

    $effect(() => {
        if (invalidDataError) {
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
    Ask the suspect a question about the module sequence, such as "what letters come between D and A?" or "what letter follows B?"
</p>
{:else}
<p>
    Ask the suspect a question about the module sequence with a single answer, such as "what letter is between D and A?" or "what letter follows B?" but not "what two letters are between E and C?"
</p>
{/if}
<p>
    Note that there is no beginning or end to this sequence of letters; it is cyclical. They will take some time to answer the question.
</p>
{#if !clientStateObject.state.sealedFile}
<p>
    If the suspect's provides a correct answer on the first try, press the "Suspect completed validation" button below. If the suspect's answer is incorrect, tell them so and wait for them to provide the corerct answer. Once they do, press the "Suspect failed validation" button below. 
</p>
{:else}
<p>
    Once the suspect provides a correct answer, press the "Suspect completed validation" button below. If the suspect's initial answer is incorrect, tell them so and wait for them to provide the corerct answer.
</p>
{/if}
<Card.Root class="w-3/4 mx-auto my-2">
    <Card.Header>
        <Card.Title><h3>{gameModule.currentModule.name}</h3></Card.Title>
    </Card.Header>
    <Card.Content class="mt-auto">
        <img src={gameModule.currentModule.darkIcon} alt={gameModule.currentModule.name} class="w-1/2 mx-auto"/>
        <p class="my-2">Difficulty: {gameModule.currentModule.difficulty}</p>
        <h3>Module verification sequence</h3>
        <ModuleCycle class="w-3/4 mx-auto" sequence={gameModule.currentModule.mazePoints}/>
        <h3>Primary prompts</h3>
        <Accordion.Root type="single" class="w-full">
            {#each gameModule.currentModule.primaryPrompts as prompt, index}
                <Accordion.Item value={"item-" + index.toString()}>
                    <Accordion.Trigger>{prompt.task}</Accordion.Trigger>
                    <Accordion.Content class="flex flex-col gap-4 text-balance">
                    {#each prompt.samplePrompts as sample}
                        <p>
                            - {sample}
                        </p>
                    {/each}
                    </Accordion.Content>
                </Accordion.Item>
            {/each}
        </Accordion.Root>
        <h3>Secondary prompts</h3>
        <Accordion.Root type="single" class="w-full">
            {#each gameModule.currentModule.secondaryPrompts as prompt, index}
                <Accordion.Item value={"item-" + index.toString()}>
                    <Accordion.Trigger>{prompt.task}</Accordion.Trigger>
                    <Accordion.Content class="flex flex-col gap-4 text-balance">
                    {#each prompt.samplePrompts as sample}
                        <p>
                            - {sample}
                        </p>
                    {/each}
                    </Accordion.Content>
                </Accordion.Item>
            {/each}
        </Accordion.Root>
    </Card.Content>
</Card.Root>
    
{#if !clientStateObject.state.sealedFile}
<div class="flex flex-row justify-evenly w-3/4 mt-4">
    <Button variant="destructive" type="submit" onclick={async () => await validationOutcome("select-background-fail")} disabled={disableConfirmModule}><h3>Suspect failed validation</h3></Button>
    <Button variant="outline" type="submit" onclick={async() => await validationOutcome("select-background-success")} disabled={disableConfirmModule}><h3>Suspect completed validation</h3></Button>
</div>
{:else}
<Button class="w-fit mx-auto mt-4" variant="outline" type="submit" onclick={async() => await validationOutcome("select-background-sealed")} disabled={disableConfirmModule}><h3>Suspect completed validation</h3></Button>
{/if}

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