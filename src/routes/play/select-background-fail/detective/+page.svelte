<script lang="ts">
    import { goto } from '$app/navigation';
    
    import * as Accordion from "#lib/components/ui/accordion/index.js";
	import * as Alert from "#lib/components/ui/alert/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
    import { Ellipsis } from "#lib/components/ui/loading-page-ellipsis/index.js";
    import { ModuleCycle } from "#lib/components/ui/moduleCycle/index.js"
    import { Separator } from "#lib/components/ui/separator//index.js";
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject, gameModule, gameModuleIcon, gamePenalties } from "#lib/stateHandler.svelte.js"
    
    let moduleIcon = $derived(gameModuleIcon.currentModuleIcon)

    let multiplePenalties = $derived(gamePenalties.currentPenalties?.length > 1)

    let roleError = $derived(clientRoleObject.role !== "detective")

    let invalidDataError = $derived(gameModule.currentModule === null || gamePenalties.currentPenalties === null)

    $effect(() => {
        if (webSocketObject.websocket !== null && clientStateObject.state.gameState !== "select-background-fail") {
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
        else if (invalidDataError) {
            console.log("Bad penalty or module data, closing websocket")
            webSocketObject.websocket?.close()
        }
    })
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
<h2 class="max-w-3/4 mx-auto">Wait for Role Selection</h2>
<div class="flex flex-col gap-2 w-3/4 text-left mx-auto">
    <p>
        The suspect will now recieve a role.
    </p>
    <p>
        Take this time to review the {#if multiplePenalties}penalties{:else}penalty{/if} and module prompts and prepare to interrogate the suspect.
    </p>
</div>
<Card.Root class="w-3/4 mx-auto mt-4">
    <Card.Header>
        <Card.Title><h2>{gameModule.currentModule?.name}</h2></Card.Title>
    </Card.Header>
    <Card.Content class="flex flex-col h-full gap-2 justify-between">
        <img src={moduleIcon} alt={gameModule.currentModule?.name} class="w-1/4 mx-auto"/>
        <p>Difficulty: {gameModule.currentModule?.difficulty}</p>
        <h3>Module verification sequence</h3>
        <ModuleCycle class="w-3/4 mx-auto" sequence={gameModule.currentModule?.mazePoints ?? []}/>
        <h3>Primary prompts</h3>
        <Accordion.Root type="single" class="w-full">
            {#each gameModule.currentModule?.primaryPrompts as prompt, index}
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
            {#each gameModule.currentModule?.secondaryPrompts as prompt, index}
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
