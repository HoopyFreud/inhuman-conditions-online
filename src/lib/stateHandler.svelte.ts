import type { IHCCombinedResponse, IHCMessageData, IHCQuery, IHCResponse, IHCRole, IHCRoleData, IHCRoleUpdate, IHCStateData, IHCStateUpdate } from '$lib/stateHandlerTypes.svelte'
import type { IHCModule, IHCBackground, IHCPenalty, IHCProfile } from './gameObjectTypes.svelte'

import penaltyData from "$lib/gameData/penalties/penalties.json" 
import moduleData from "$lib/gameData/modules/modules.json" 
import backgroundData from "$lib/gameData/backgrounds/backgrounds.json" 

let reconnectAttempt = 0

export const clientErroredObject: {error: boolean} = $state({error: false})
export const clientLastMessageObject: {message: string} = $state({message: ""})
export const clientLastStatusCode: {code: number | null} = $state({code: null})
export const clientRoleObject: {role: IHCRole | null} = $state({role: null})
export const clientStateObject: {state:IHCStateData} = $state({
    state: {
        gameState: "init",
        validatedSessions: 0,
        moduleID: null,
        penaltyCardID: null,
        backgroundCardID: null,
        permanentPenalty: false,
        continuousCatalyzation: false,
        digitalGame: false,
        sealedFile: false,
        endTime: null
    } as IHCStateData
})

export const profileObject: {profile: IHCProfile | null} = $state({profile: null})
export const sessionIDObject: {ID: string} = $state(({ID: ""}))
export const webSocketObject: {websocket: WebSocket | null} = $state({websocket: null})

const currentPenalties: IHCPenalty[] = $derived(
	typeof clientStateObject.state.penaltyCardID === "number" ?
		clientStateObject.state.permanentPenalty ? 
			penaltyData.filter((penalty) => penalty.id === 0 || penalty.id === clientStateObject.state.penaltyCardID) :
			penaltyData.filter((penalty) => penalty.id === clientStateObject.state.penaltyCardID)
		:
		[]
)
export const gamePenalties = {
	get currentPenalties() { return currentPenalties; },
}

const currentModule: IHCModule | null = $derived(moduleData.find((module) => module.id === clientStateObject.state.moduleID) as IHCModule ?? null)
export const gameModule = {
	get currentModule() { return currentModule; },
}

const currentBackground: IHCBackground | null = $derived(backgroundData.find((background) => background.id === clientStateObject.state.backgroundCardID) as IHCBackground ?? null)
export const gameBackground = {
	get currentBackground() { return currentBackground; },
}

export function resetState() {
	console.log("resetting state")
	clientErroredObject.error = false
	clientLastMessageObject.message = ""
	clientLastStatusCode.code = null
	clientRoleObject.role = null
	clientStateObject.state = {
		gameState: "init",
		validatedSessions: 0,
		moduleID: null,
		penaltyCardID: null,
		backgroundCardID: null,
		permanentPenalty: false,
		continuousCatalyzation: false,
        digitalGame: false,
		sealedFile: false,
		endTime: null
	}
	profileObject.profile = null
	sessionIDObject.ID = ""
	if (webSocketObject.websocket !== null) {
		webSocketObject.websocket.close()
	}
	webSocketObject.websocket = null
}

export async function joinGame(sessionID:string, joinType:string) {
	let url = new URL('https://ihc-server.mechanist.net/ihc-gameserver')
	url.searchParams.append('sessionID',sessionID)

	const socket = new WebSocket(url)
	const introMessage: IHCMessageData = {
		"type": "intro",
		"data": {
			sessionID: sessionID,
			joinType: joinType
		}
	}
	
	socket.addEventListener("message", (event) => {
		const response: IHCResponse = JSON.parse(event.data)
		console.log([response.type,response.state,response.role,response.string])
		if (response.type == "state-response" || response.type == "combined-response") {
			clientStateObject.state = {...clientStateObject.state, ...response.state};
		}
		if (response.type == "role-response" || response.type == "combined-response") {
			clientRoleObject.role = response.role;
		}
		if (response.string !== null) {
			clientLastMessageObject.message = response.string;
		}
	});
	// Handle errors
	socket.addEventListener("error", (event) => {
		clientErroredObject.error = true;
		console.log(event)
	});

	// Handle disconnection
	socket.addEventListener("close", async (event) => {
        webSocketObject.websocket = null
		clientLastMessageObject.message = event.reason
		clientLastStatusCode.code = event.code
		if (event.wasClean) {
			console.log(`Closed cleanly, code=${event.code}, reason=${event.reason}`);
		} else {
			console.log("Connection died");
		}
		if (reconnectAttempt === 0) {
			webSocketObject.websocket = await joinGame(sessionIDObject.ID, "existing")
		}
	});

	return await sendAndRecieveIntroduction(socket, introMessage)
}

export async function queryGameState() {
	if (webSocketObject.websocket) {
		const query: IHCQuery = {type: "query", data: null}
		await sendMessageAndAwaitResponse(query, "query")
	}
}

export async function updateGameState(stateUpdateData: Partial<IHCStateData>) {
	if (webSocketObject.websocket) {
		clientStateObject.state = {...clientStateObject.state,...stateUpdateData}
		const stateUpdate: IHCStateUpdate = {type: "state-update", data: stateUpdateData}
		await sendMessageAndAwaitResponse(stateUpdate, "state-update")
	}
}

export async function assignRoles(roleData: IHCRoleData) {
	if (webSocketObject.websocket) {
		clientRoleObject.role = roleData.self
		const roleUpdate: IHCRoleUpdate = {type: "role-update", data: roleData}
		await sendMessageAndAwaitResponse(roleUpdate, "role-update")
	}
}

async function sendAndRecieveIntroduction(socket: WebSocket, introMessage: IHCMessageData) {
	return new Promise<WebSocket | null>((resolve) => {
		const timeoutID = setTimeout(() => {
			socket.close()
			console.log("websocket timeout")
			resolve(null)
		},5000)

		socket.addEventListener("message", (event) => {
			const response: IHCCombinedResponse = JSON.parse(event.data)
			clearTimeout(timeoutID)
			if (response.string === "confirm") {
				reconnectAttempt = 0
				resolve(socket);
			}
			else {
				socket.close()
				resolve(null)
			}
		},
		{once: true}
		)

		// Connection opened
		socket.addEventListener("open", (event) => {
			socket.send(JSON.stringify(introMessage))
		})
	})
}

async function sendMessageAndAwaitResponse(message: IHCMessageData, messageType: "query" | "state-update" | "role-update") {
	return new Promise((resolve) => {
		if (webSocketObject.websocket) {
			const timeoutID = setTimeout(() => {
				webSocketObject.websocket!.close()
				console.log("websocket timeout")
				resolve(null)
			},5000)

			webSocketObject.websocket.addEventListener("message", (event) => {
				const response: IHCResponse = JSON.parse(event.data)
				if (
					(messageType === "query" && response.string === "confirm" && response.type === "combined-response") ||
					(messageType === "state-update" && response.string === "confirm" && response.type === "state-response") ||
					(messageType === "role-update" && response.string === "confirm" && response.type === "role-response")
				) {
					clearTimeout(timeoutID)
					resolve(null)
				}
			},
			{once: true}
			)
			webSocketObject.websocket.send(JSON.stringify(message))
		}
		else resolve(null)
	})
}