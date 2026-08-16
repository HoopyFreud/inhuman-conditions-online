<script lang="ts">
    import { goto } from '$app/navigation';
    
    import * as Accordion from "$lib/components/ui/accordion/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import { Ellipsis } from "$lib/components/ui/loading-page-ellipsis";
    import { ModuleCycle } from "$lib/components/ui/moduleCycle"
    import { Separator } from "$lib/components/ui/separator/";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject, gameModule, gameModuleIcon, gamePenalties } from "$lib/stateHandler.svelte"

    const moduleIcon = gameModuleIcon.currentModuleIcon

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    let roleError = $derived(clientRoleObject.role !== "detective")

    let invalidDataError = $derived(!clientStateObject.state.sealedFile || gameModule.currentModule === null || gamePenalties.currentPenalties === null)

    $effect(() => {
        if (clientStateObject.state.gameState !== "select-background-sealed") {
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
        else if (invalidDataError) {
            console.log("Bad penalty or module data, closing websocket")
            webSocketObject.websocket?.close()
        }
    })
</script>

<h2>Role Selection</h2>
<p>
    The suspect will decide how they want to portray themselves. Take this time to review the {#if multiplePenalties}penalties{:else}penalty{/if} and module prompts and prepare to interrogate the suspect.
</p>
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
<h2>Module</h2>
<Card.Root class="w-3/4 mx-auto my-2">
    <Card.Header>
        <Card.Title><h3>{gameModule.currentModule.name}</h3></Card.Title>
    </Card.Header>
    <Card.Content class="mt-auto">
        <img src={moduleIcon} alt={gameModule.currentModule.name} class="w-1/2 mx-auto"/>
        <p class="my-2">Difficulty: {gameModule.currentModule.difficulty}</p>
        <h3>Module verification sequence</h3>
        <ModuleCycle class="w-3/4 mx-auto" sequence={gameModule.currentModule.mazePoints}/>
        <h3>Primary prompts</h3>
        <Accordion.Root type="single" class="w-full">
            {#each gameModule.currentModule.primaryPrompts as prompt, index}
                
                <Accordion.Item value={"item-" + index.toString()}>
                    <Accordion.Trigger>{prompt.task}</Accordion.Trigger>
                    <Accordion.Content class="flex flex-col gap-4 text-balance">
                    <ul>
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
                    <Accordion.Content class="flex flex-col gap-4 text-balance">
                    <ul>
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
    <Alert.Title>Bad client data, incoming penalty, or module data</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}