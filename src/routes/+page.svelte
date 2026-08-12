<script lang="ts">
	import { onMount } from 'svelte';
    import { goto } from '$app/navigation';
	
	import * as ButtonGroup from "$lib/components/ui/button-group/index.js";
	import * as Alert from "$lib/components/ui/alert/index.js";
	import { Button } from "$lib/components/ui/button/index.js";
	import { Input } from "$lib/components/ui/input/index.js";
	import Shuffle from '@lucide/svelte/icons/shuffle';
	import AlertCircleIcon from "@lucide/svelte/icons/alert-circle";

	import { clientLastStatusCode, clientStateObject, clientRoleObject, sessionIDObject, webSocketObject } from "$lib/stateHandler.svelte"
	import { joinGame, updateGameState, resetState } from "$lib/stateHandler.svelte";

	onMount(() => resetState())

	let invalidInputError = $state(false)

	let roomIsFullError = $state(false)
	let roomDoesNotExistError = $state(false)
	let roomAlreadyExistsError = $state(false)
	let joinGameError = $state(false)

	let websocketError = $derived(roomIsFullError || roomDoesNotExistError || roomAlreadyExistsError || joinGameError)
	
    let stateError = $state(false)

	let disableRoomCreation = $derived(invalidInputError || websocketError || stateError || sessionIDObject.ID === "")

	const characters = "01234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ"

	function resetErrors() {
		roomIsFullError = false
		roomDoesNotExistError = false
		roomAlreadyExistsError = false
		joinGameError = false
		stateError = false
	}

	function randomizeRoom() {
		let sessionStr = ""
		for(let i=0;i<8;i++){
			sessionStr += characters[Math.floor(Math.random()*36)]
		}
		sessionIDObject.ID = sessionStr
		resetErrors()
	}

	function validateRoomNumber() {
		sessionIDObject.ID = sessionIDObject.ID.toUpperCase()
  		invalidInputError = /[^A-Z0-9]/.test(sessionIDObject.ID)
		resetErrors()
	}

	async function getSessionWebsocket(joinType:"new" | "existing") {
		webSocketObject.websocket = await joinGame(sessionIDObject.ID,joinType)

		if (webSocketObject.websocket && joinType === "new") {
			console.log("websocket established, creating new room")
		}
		else if (webSocketObject.websocket && joinType === "existing") {
			console.log("websocket established, joining existing room")
		}
		else {
			console.log("websocket initialization failed")
			switch(clientLastStatusCode.code) {
				case 4001:
					roomIsFullError = true
					break
				case 4002:
					roomDoesNotExistError = true
					break
				case 4003:
					roomAlreadyExistsError = true
					break
				default: joinGameError = true
			}
		}
		
		if (!websocketError) {
            if (joinType === "new" && clientStateObject.state.gameState === "init") {
				await updateGameState({gameState: "game-setup"})
                goto("/play/game-setup/do?room="+sessionIDObject.ID)
            }
            else if (joinType === "existing" && clientStateObject.state.gameState === "game-setup") {
                goto("/play/game-setup/await?room="+sessionIDObject.ID)
            }
            else if (joinType === "existing" && clientStateObject.state.gameState === "select-penalty-prelim" && clientRoleObject.role === "suspect") {
                goto("/play/select-penalty-prelim/suspect-await?room="+sessionIDObject.ID)
            }
            else if (joinType === "existing" && clientStateObject.state.gameState === "select-penalty-prelim" && clientRoleObject.role === "detective") {
                goto("/play/select-penalty-prelim/detective-do?room="+sessionIDObject.ID)
            }
            else if (joinType === "existing" && clientStateObject.state.gameState === "select-penalty-final" && clientRoleObject.role === "suspect") {
                goto("/play/select-penalty-final/suspect-do?room="+sessionIDObject.ID)
            }
            else {
                console.log("Failed state init, closing websocket")
                webSocketObject.websocket?.close()
                stateError = true
            }
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
			<Input type="text" bind:value={sessionIDObject.ID} oninput={() => validateRoomNumber()}/>
			<Button variant="outline" size="icon" aria-label="Random" title="Random" onclick={() => randomizeRoom()}>
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
		{#if joinGameError}
		<Alert.Root variant="destructive">
			<AlertCircleIcon />
			<Alert.Title>Unable to join game</Alert.Title>
			<Alert.Description>
			<p>Try again.</p>
			</Alert.Description>
		</Alert.Root>
		{/if}
		{#if stateError}
		<Alert.Root variant="destructive">
			<AlertCircleIcon />
			<Alert.Title>Unable to set initial state</Alert.Title>
			<Alert.Description>
			<p>Try again.</p>
			</Alert.Description>
		</Alert.Root>
		{/if}
	</div>
	<div class="flex flex-row justify-evenly w-100 mt-4">
		<Button variant="outline" type="submit" onclick={async () => await getSessionWebsocket("new")} disabled={disableRoomCreation}><h3>Set Up Room</h3></Button>
		<Button variant="outline" type="submit" onclick={async() => await getSessionWebsocket("existing")} disabled={disableRoomCreation}><h3>Join Room</h3></Button>
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
