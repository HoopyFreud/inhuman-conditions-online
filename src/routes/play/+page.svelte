
<script lang="ts">
    import { getContext } from 'svelte';
	import * as ToggleGroup from "$lib/components/ui/toggle-group/index.js";
	import { Button } from "$lib/components/ui/button/index.js";

	const sessionID = getContext<string>('sessionID');

</script>

<svelte:head>
	<title>Identity Crisis - Play</title>
	<meta name="description" content="Identity Crisis play page" />
</svelte:head>

<h2>Role</h2>
<ToggleGroup.Root size="lg" variant="outline" type="single" class="flex place-center m-auto">
    <ToggleGroup.Item value="detective" aria-label="Toggle Detective">
        <h3 class="m-0!">Detective</h3>
    </ToggleGroup.Item>
    <ToggleGroup.Item value="suspect" aria-label="Toggle Suspect">
        <h3 class="m-0!">Suspect</h3>
    </ToggleGroup.Item>
</ToggleGroup.Root>
    
<Button variant="outline" type="submit" class="w-fit m-auto mt-4 "><h3>Set Up Room</h3></Button>