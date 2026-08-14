<script lang="ts">
    import { afterNavigate, goto } from '$app/navigation';

    import * as Accordion from "$lib/components/ui/accordion/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
    import * as Card from "$lib/components/ui/card/index.js";
    import * as Carousel from "$lib/components/ui/carousel/index.js";
    import { Ellipsis } from "$lib/components/ui/loading-page-ellipsis";
    import { Separator } from '$lib/components/ui/separator';
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import type { IHCModule } from "$lib/gameObjectTypes.svelte"
	import { clientRoleObject, clientStateObject, sessionIDObject, webSocketObject, gamePenalties } from "$lib/stateHandler.svelte"

    import moduleData from "$lib/gameData/modules/modules.json"

    let multiplePenalties = $derived(gamePenalties.currentPenalties.length > 1)

    let availableModules: IHCModule[] = $state([])

    let roleError = $derived(clientRoleObject.role !== "detective")

    let invalidDataError = $derived(gamePenalties.currentPenalties === null)

    afterNavigate(() => {
        availableModules = [...(moduleData as IHCModule[])]
    })

    $effect(() => {
        if (clientStateObject.state.gameState !== "select-module") {
            goto("/play/"+clientStateObject.state.gameState+"/"+clientRoleObject.role+"?room="+sessionIDObject.ID)
        }
        else if (invalidDataError) {
            console.log("Bad penalty data, closing websocket")
            webSocketObject.websocket?.close()
        }
    })
</script>

{#if clientStateObject.state.permanentPenalty}
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
<h2>Wait for module selection</h2>
<p>
    The suspect will now choose a module to play. You may offer input, but they have final authority over this decision.
</p>
<Carousel.Root class="w-3/4 mx-auto my-2" opts={{align: "center", loop: true}}>
  <Carousel.Content>
    {#each availableModules as availableModule}
        <Carousel.Item>
            <Card.Root class="w-5/6 mx-auto">
                <Card.Header>
                    <Card.Title><h3>{availableModule.name}</h3></Card.Title>
                </Card.Header>
                <Card.Content class="mt-auto">
                    <img src={availableModule.darkIcon} alt={availableModule.name} class="w-1/2 mx-auto"/>
                    <p class="my-2">Difficulty: {availableModule.difficulty}</p>
                    <h3>Primary prompts</h3>
                    <Accordion.Root type="single" class="w-full">
                        {#each availableModule.primaryPrompts as prompt, index}
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
                        {#each availableModule.secondaryPrompts as prompt, index}
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
        </Carousel.Item>
    {/each}
  </Carousel.Content>
  <Carousel.Previous />
  <Carousel.Next />
</Carousel.Root>

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
    <Alert.Title>Bad incoming penalty data</Alert.Title>
    <Alert.Description>
    <p>Return to the <a href="/">home page</a> and try again.</p>
    </Alert.Description>
</Alert.Root>
{/if}