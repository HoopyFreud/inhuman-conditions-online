
<script lang="ts">
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import { Button } from "$lib/components/ui/button/index.js";

	import { clientStateObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"

    let loadingElementText = $state("")

    const loadingElementTextSequence = ["",".","..","..."]

    function loadingSequence() {
        let textIndex = 0
        setTimeout(() => {
            if (textIndex < loadingElementTextSequence.length) {
                textIndex += 1
            }
            else {
                textIndex = 0
            }
            loadingElementText = loadingElementTextSequence[textIndex]
        },500)
    }

    loadingSequence()
</script>

<svelte:head>
	<title>Identity Crisis - Play</title>
	<meta name="description" content="Play Identity Crisis" />
</svelte:head>

<h2>Waiting for host to select Role</h2>

<h3>{loadingElementText}</h3>