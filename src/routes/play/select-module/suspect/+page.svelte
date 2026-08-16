<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';
    
    import * as Accordion from "$lib/components/ui/accordion/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Carousel from "$lib/components/ui/carousel/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
    import { Separator } from '$lib/components/ui/separator';
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCStateData } from "$lib/stateHandlerTypes.svelte"
	import type { IHCModule } from "$lib/gameObjectTypes.svelte"
	import { clientRoleObject, clientStateObject, moduleIconGlob, sessionIDObject, webSocketObject, gamePenalties } from "$lib/stateHandler.svelte"
    import { updateGameState } from "$lib/stateHandler.svelte"
    import { getErrorContext } from '$lib/errorContext';

    import moduleData from "$lib/gameData/modules/modules.json"

    const headerImages: Map<number,[string,string]> = new Map(moduleData.map(
        (module) => [
            module.id,
            [
                moduleIconGlob[module.darkIcon],
                moduleIconGlob[module.lightIcon]
            ]
        ]
    ))

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    const gameError = getErrorContext()

    let selectedModule: number | null = $state(null)
    let availableModules: IHCModule[] = $state([])
    let invalidModuleSelection = $derived(selectedModule === null)

    let gameStateUpdate: Partial<IHCStateData> = $derived({
        gameState: "confirm-module",
        moduleID: selectedModule
    })

    let roleError = $derived(clientRoleObject.role !== "suspect")

    let invalidDataError = $derived(gamePenalties.currentPenalties === null)

    let disableModuleDeselectButton: boolean = $derived(selectedModule === null)
    let disableSelectModule: boolean = $derived(invalidModuleSelection || roleError || invalidDataError || gameError())

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

    afterNavigate(() => {
        availableModules = moduleData as IHCModule[]
    })

    $effect(() => {
        if (invalidDataError) {
            console.log("Bad penalty data, closing websocket")
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
<h2>Select Module</h2>
<p>
    Choose a module to play. You may consult with the detective player, but you have final authority over this decision.
</p>
<Carousel.Root class="w-3/4 mx-auto my-2" opts={{align: "center", loop: true}}>
  <Carousel.Content>
    {#each availableModules as availableModule}
        <Carousel.Item>
            <Card.Root class="w-5/6 mx-auto {selectedModule === availableModule.id? 'light' : ''}">
                <Card.Header>
                    <Card.Title><h3>{availableModule.name}</h3></Card.Title>
                </Card.Header>
                <Card.Content class="mt-auto">
                    {#if selectedModule === availableModule.id}
                        <img src={headerImages.get(availableModule.id)?.[0]} alt={availableModule.name} class="w-1/2 mx-auto"/>
                    {:else}
                        <img src={headerImages.get(availableModule.id)?.[1]} alt={availableModule.name} class="w-1/2 mx-auto"/>
                    {/if}
                    <p class="my-2">Difficulty: {availableModule.difficulty}</p>
                    <h3>Primary prompts</h3>
                    <Accordion.Root type="single" class="w-full">
                        {#each availableModule.primaryPrompts as prompt, index}
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
                        {#each availableModule.secondaryPrompts as prompt, index}
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
                    {#if selectedModule === availableModule.id}
                        <Button variant="outline" type="submit" disabled={disableModuleDeselectButton} onclick={() => removeModule()} class="w-fit m-auto mt-4">
                            <h3>Deselect</h3>
                        </Button>
                    {:else}
                        <Button variant="outline" type="submit" onclick={() => addModule(availableModule)} class="w-fit m-auto mt-4">
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
<Button disabled={disableSelectModule} variant="outline" type="submit" onclick={async () => await submitModule()} class="w-fit m-auto mb-2"><h3>Select Module</h3></Button>

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