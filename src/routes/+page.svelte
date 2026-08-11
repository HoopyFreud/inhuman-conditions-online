<script lang="ts">
	import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientLastStatusCode, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"
	import { joinGame, updateGameState } from "$lib/stateHandler.svelte";
    import { goto } from '$app/navigation';

	let invalidInputError = $state(false)
	let roomIsFullError = $state(false)
	let roomDoesNotExistError = $state(false)
	let roomAlreadyExistsError = $state(false)

	let disableRoomCreation = $derived(invalidInputError || roomDoesNotExistError || roomAlreadyExistsError || roomIsFullError || sessionIDObject.ID === "")

	const characters = "01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"

	function randomize_room() {
		let sessionStr = ""
		for(let i=0;i<8;i++){
			sessionStr += characters[Math.floor(Math.random()*36)]
		}
		sessionIDObject.ID = sessionStr
	}

	function validate_room_number() {
		sessionIDObject.ID = sessionIDObject.ID.toUpperCase()
  		invalidInputError = /[^A-Z0-9]/.test(sessionIDObject.ID)
	}

	async function getSessionWebsocket(joinType:string) {
		webSocketObject.websocket = await joinGame(sessionIDObject.ID,joinType)
		console.log(webSocketObject)
		if (webSocketObject.websocket && joinType === "new") {
			console.log("websocket established, creating new room")
			updateGameState({gameState: "select-role"})
			goto("/play/slect-role?"+sessionIDObject.ID)
		}
		else if (webSocketObject.websocket && joinType === "existing") {
			console.log("websocket established, joining existing room")
			goto("/play/await-select-role?"+sessionIDObject.ID)
		}
		else {
			console.log("websocket initialization failed")
			roomIsFullError = (clientLastStatusCode.code === 4001)
			roomDoesNotExistError = (clientLastStatusCode.code === 4002)
			roomAlreadyExistsError = (clientLastStatusCode.code === 4003)
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
			<Input type="text" bind:value={sessionIDObject.ID} oninput={() => validate_room_number()}/>
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
		{#if roomIsFullError}
		<Alert.Root variant="destructive">
			<AlertCircleIcon />
			<Alert.Title>Room is full</Alert.Title>
			<Alert.Description>
			<p>Choose a different room number.</p>
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
		<Button variant="outline" type="submit" onclick={() => getSessionWebsocket("new")} disabled={disableRoomCreation}><h3>Set Up Room</h3></Button>
		<Button variant="outline" type="submit" onclick={() => getSessionWebsocket("existing")} disabled={disableRoomCreation}><h3>Join Room</h3></Button>
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
