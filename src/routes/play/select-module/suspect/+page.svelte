<script lang="ts">
    import { goto } from '$app/navigation';

    import * as Accordion from "#lib/components/ui/accordion/index.js";
    import * as Alert from "#lib/components/ui/alert/index.js";
    import * as Card from "#lib/components/ui/card/index.js";
    import * as Carousel from "#lib/components/ui/carousel/index.js";
    import { default as AutoHeight } from 'embla-carousel-auto-height'
    import { Button } from "#lib/components/ui/button/index.js";
    import { Separator } from '#lib/components/ui/separator/index.js';
    import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";
    import type { IHCStateData } from "#lib/stateHandlerTypes.svelte.js";
    import type { IHCModule } from "#lib/gameObjectTypes.svelte.js";

    import { clientRoleObject, clientStateObject, moduleIconGlob, sessionIDObject, webSocketObject, gamePenalties } from "#lib/stateHandler.svelte.js";

    import { updateGameState } from "#lib/stateHandler.svelte.js";
    import { getErrorContext } from '#lib/errorContext.js';

    import moduleData from "#lib/gameData/modules/modules.json"

    const availableModules = moduleData as IHCModule[]

    const headerImages: Map<number,[string,string]> = new Map(moduleData.map(
    (module) => [
        module.id,
        [
            moduleIconGlob[module.darkIcon],
            moduleIconGlob[module.lightIcon]
        ]
    ]
    ))

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1);
    const gameError = getErrorContext();
    let selectedModule: number | null = $state(null);
    let invalidModuleSelection = $derived(selectedModule === null);
    let gameStateUpdate: Partial<IHCStateData> = $derived({ gameState: "confirm-module", moduleID: selectedModule });
    let roleError = $derived(clientRoleObject.role !== "suspect");
    let invalidDataError = $derived(gamePenalties.currentPenalties === null);
    let disableModuleDeselectButton: boolean = $derived(selectedModule === null);
    let disableSelectModule: boolean = $derived(invalidModuleSelection || roleError || invalidDataError || gameError());

    function removeModule() {
        selectedModule = null
    }

    function addModule(module: IHCModule) {
        selectedModule = module.id
    }

    async function submitModule() {
        if (!disableSelectModule){
            await updateGameState(gameStateUpdate)
            await goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
    }

    $effect(() => {
        if (invalidDataError) {
                console.log("Bad penalty data, closing websocket")
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
<h2 class="max-w-3/4 mx-auto">Module Selection</h2>
<div class="flex flex-col gap-2 w-3/4 text-left mx-auto">
    <p>
        Choose a module to play. You may consult with the detective player, but you have final authority over this decision.
    </p>
</div>
<Carousel.Root class="w-3/4 mx-auto my-4" opts={{align: "center", loop: true}} plugins={[AutoHeight()]}>
  <Carousel.Content class="items-start">
    {#each availableModules as availableModule}
        <Carousel.Item>
            <Card.Root class="w-5/6 mx-auto {selectedModule === availableModule.id? 'light' : ''}">
                <Card.Header>
                    <Card.Title><h2>{availableModule.name}</h2></Card.Title>
                </Card.Header>
                <Card.Content class="flex flex-col h-full gap-2 justify-between">
                    {#if selectedModule === availableModule.id}
                        <img src={headerImages.get(availableModule.id)?.[0]} alt={availableModule.name} class="w-1/4 mx-auto"/>
                    {:else}
                        <img src={headerImages.get(availableModule.id)?.[1]} alt={availableModule.name} class="w-1/4 mx-auto"/>
                    {/if}
                    <p>Difficulty: {availableModule.difficulty}</p>
                    <h3>Primary prompts</h3>
                    <Accordion.Root type="single" class="w-full">
                        {#each availableModule.primaryPrompts as prompt, index}
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
                        {#each availableModule.secondaryPrompts as prompt, index}
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
                    {#if selectedModule === availableModule.id}
                        <Button variant="outline" type="submit" disabled={disableModuleDeselectButton} onclick={() => removeModule()} class="w-fit mx-auto">
                            <h3>Deselect</h3>
                        </Button>
                    {:else}
                        <Button variant="outline" type="submit" onclick={() => addModule(availableModule)} class="w-fit mx-auto">
                            <h3>Select</h3>
                        </Button>
                    {/if}
                </Card.Content>
            </Card.Root>
        </Carousel.Item>
    {/each}
  </Carousel.Content>
  <Carousel.Previous />
  <Carousel.Next />
</Carousel.Root>
<Button disabled={disableSelectModule} variant="outline" type="submit" onclick={async () => await submitModule()} class="w-fit m-auto"><h3>Select Module</h3></Button>

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
    <Alert.Title>Bad incoming penalty data</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}
