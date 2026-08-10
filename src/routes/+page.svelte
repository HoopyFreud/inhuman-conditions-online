<script lang="ts">
	import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { joinGame } from "$lib/utils";

	let sessionID = $state("")

	let invalidInputError = $state(false)
	let roomDoesNotExistError = $state(false)
	let roomAlreadyExistsError = $state(false)

	const characters = "01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"

	function randomize_room() {
		let sessionStr = ""
		for(let i=0;i<8;i++){
			sessionStr += characters[Math.floor(Math.random()*36)]
		}
		sessionID = sessionStr
	}

	function validate_room_number() {
		sessionID = sessionID.toUpperCase()
  		invalidInputError = /[^A-Z0-9]/.test(sessionID)
	}

	async function getSessionWebocket(joinType:string) {
		const ws: WebSocket | null = await joinGame(sessionID,joinType)
		if (ws) {
			console.log("websocket established")
		}
	}

</script>

<svelte:head>
	<title>Identity Crisis</title>
	<meta name="description" content="Identity Crisis landing page" />
</svelte:head>

<h1>
	Identity Crisis
</h1>
<section class="game-area">
	<h2 class="m-10!">Begin Interrogation</h2>
	<h2>Room Number</h2>
	<div class="w-60">
		<ButtonGroup.Root class="justify-center w-full">
			<Input type="text" bind:value={sessionID} oninput={() => validate_room_number()}/>
			<Button variant="outline" size="icon" aria-label="Random" title="Random" onclick={() => randomize_room()}>
				<Shuffle />
			</Button>
		</ButtonGroup.Root>
		{#if invalidInputError}
		<Alert.Root variant="destructive">
			<AlertCircleIcon />
			<Alert.Title>Invalid room number</Alert.Title>
			<Alert.Description>
			<p>Room number should contain only numbers and letters.</p>
			</Alert.Description>
		</Alert.Root>
		{/if}
		{#if roomDoesNotExistError}
		<Alert.Root variant="destructive">
			<AlertCircleIcon />
			<Alert.Title>Room does not exist</Alert.Title>
			<Alert.Description>
			<p>Please verify room number.</p>
			</Alert.Description>
		</Alert.Root>
		{/if}
		{#if roomAlreadyExistsError}
		<Alert.Root variant="destructive">
			<AlertCircleIcon />
			<Alert.Title>Room already exists</Alert.Title>
			<Alert.Description>
			<p>Enter a different room number or join room.</p>
			</Alert.Description>
		</Alert.Root>
		{/if}
	</div>
	<div class="flex flex-row justify-evenly w-100 mt-4">
		<Button variant="outline" type="submit" onclick={() => getSessionWebocket("new")}><h3>Set Up Room</h3></Button>
		<Button variant="outline" type="submit" onclick={() => getSessionWebocket("existing")}><h3>Join Room</h3></Button>
	</div>
</section>

<style>
	section {
		display: flex;
		flex-direction: column;
		justify-content: center;
		align-items: center;
		flex: 0.6;
	}
</style>
