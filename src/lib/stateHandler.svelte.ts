
import type { IHCCombinedResponse, IHCMessageData, IHCQuery, IHCResponse, IHCRole, IHCRoleData, IHCRoleUpdate, IHCStateData, IHCStateUpdate, IHCResetSession } from '#lib/stateHandlerTypes.svelte.js'
import type { IHCModule, IHCBackground, IHCPenalty, IHCProfile, IHCHumanProfile, IHCPatientRobotProfile, IHCViolentRobotProfile } from './gameObjectTypes.svelte'

import penaltyData from "#lib/gameData/penalties/penalties.json" 
import moduleData from "#lib/gameData/modules/modules.json" 
import backgroundData from "#lib/gameData/backgrounds/backgrounds.json"
import humanData from "#lib/gameData/suspectProfiles/humanProfile.json";
import patientRobotData from "#lib/gameData/suspectProfiles/patientRobotProfiles.json";
import violentRobotData from "#lib/gameData/suspectProfiles/violentRobotProfiles.json";
import profileStrings from "#lib/gameData/suspectProfiles/profileStrings.json";
import profileBlurbs from "#lib/gameData/suspectProfiles/profileBlurbs.json";

export const moduleIconGlob = import.meta.glob("#lib/gameData/icons/*.svg", {eager: true, query: "?url", import: "default"})

export const clientErroredObject: {error: boolean} = $state({error: false})
export const clientLastMessageObject: {message: string} = $state({message: ""})
export const clientLastStatusCode: {code: number | null} = $state({code: null})
export const clientRoleObject: {role: IHCRole | null} = $state({role: null})
export const clientStateObject: {state:IHCStateData} = $state({
    state: {
        gameState: "init",
		interrogationState: "prelim",
        validatedSessions: 0,
        moduleID: null,
        penaltyCardID: null,
        backgroundCardID: null,
		suspectProfileType: null,
		suspectProfileID: null,
        permanentPenalty: false,
        continuousCatalyzation: false,
        digitalGame: false,
        sealedFile: false,
        endTime: null
    }
})

export const sessionIDObject: {ID: string} = $state(({ID: ""}))
export const webSocketObject: {websocket: WebSocket | null} = $state({websocket: null})

let currentPenalties: IHCPenalty[] = $derived.by(() => {
	if (typeof clientStateObject.state.penaltyCardID === "number") {
		if (clientStateObject.state.permanentPenalty) {
			return penaltyData.filter((penalty) => penalty.id === 0 || penalty.id === clientStateObject.state.penaltyCardID)
		}
		else {
			return penaltyData.filter((penalty) => penalty.id === clientStateObject.state.penaltyCardID)
		}
	}
	else {
		return []
	}
})
export let gamePenalties = {
	get currentPenalties() { return currentPenalties; },
}

let currentModule: IHCModule | null = $derived(moduleData.find((module) => module.id === clientStateObject.state.moduleID) as IHCModule ?? null)
export let gameModule = {
	get currentModule() { return currentModule; },
}
let currentModuleIcon: string | null = $derived(moduleIconGlob[currentModule?.lightIcon] ?? null)
export let gameModuleIcon = {
	get currentModuleIcon() { return currentModuleIcon; },
}

let currentBackground: IHCBackground | null = $derived(backgroundData.find((background) => background.id === clientStateObject.state.backgroundCardID) as IHCBackground ?? null)
export let gameBackground = {
	get currentBackground() { return currentBackground; },
}

let currentProfile: IHCProfile | null = $derived.by(() => {
	if (clientStateObject.state.suspectProfileType === "human") {
		return humanData as IHCHumanProfile
	}
	else if (clientStateObject.state.suspectProfileType === "patientRobot") {
		return patientRobotData.find((profile) => profile.id === clientStateObject.state.suspectProfileID)  as IHCPatientRobotProfile
	}
	else if (clientStateObject.state.suspectProfileType === "violentRobot") {
		return violentRobotData.find((profile) => profile.id === clientStateObject.state.suspectProfileID) as IHCViolentRobotProfile
	}
	else {
		return null
	}
})
export let gameProfile = {
	get currentProfile() { return currentProfile; },
}

let currentProfileString = $derived(currentProfile?.type ? profileStrings[currentProfile.type] : "")
export let gameProfileString = {
	get currentProfileString() { return currentProfileString; },
}

let currentProfileBlurb = $derived(currentProfile?.type ? profileBlurbs[currentProfile.type] : [])
export let gameProfileBlurb = {
	get currentProfileBlurb() { return currentProfileBlurb; },
}

export function resetState() {
	console.log("resetting state")
	clientErroredObject.error = false
	clientLastMessageObject.message = ""
	clientLastStatusCode.code = null
	clientRoleObject.role = null
	clientStateObject.state = {
		gameState: "init",
		interrogationState: "prelim",
		validatedSessions: 0,
		moduleID: null,
		penaltyCardID: null,
		backgroundCardID: null,
		suspectProfileType: null,
		suspectProfileID: null,
		permanentPenalty: false,
		continuousCatalyzation: false,
        digitalGame: false,
		sealedFile: false,
		endTime: null
	}
	sessionIDObject.ID = ""
	webSocketObject.websocket?.close()
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

	await sendAndRecieveIntroduction(socket, introMessage)
}

export async function queryGameState() {
	if (webSocketObject.websocket !== null) {
		const query: IHCQuery = {type: "query", data: null}
		await sendMessageAndAwaitResponse(query, "query")
	}
}

export async function updateGameState(stateUpdateData: Partial<IHCStateData>) {
	if (webSocketObject.websocket !== null) {
		clientStateObject.state = {...clientStateObject.state,...stateUpdateData}
		const stateUpdate: IHCStateUpdate = {type: "state-update", data: stateUpdateData}
		await sendMessageAndAwaitResponse(stateUpdate, "state-update")
	}
}

export async function assignRoles(roleData: IHCRoleData) {
	if (webSocketObject.websocket !== null) {
		clientRoleObject.role = roleData.self
		const roleUpdate: IHCRoleUpdate = {type: "role-update", data: roleData}
		await sendMessageAndAwaitResponse(roleUpdate, "role-update")
	}
}

export async function resetGameSession() {
	if (webSocketObject.websocket !== null) {
		const resetMessage: IHCResetSession = {type: "reset-session", data: null}
		await sendMessageAndAwaitResponse(resetMessage, "reset-session")
	}
}

async function sendAndRecieveIntroduction(socket: WebSocket, introMessage: IHCMessageData) {
	return new Promise<WebSocket | null>((resolve) => {
		const timeoutID = setTimeout(() => {
			socket.close()
			console.log("websocket timeout")
			resolve(null)
		},5000)

		// Handle disconnection
		socket.addEventListener("close", (event) => {
			clientLastMessageObject.message = event.reason
			clientLastStatusCode.code = event.code
			if (event.wasClean) {
				console.log(`Closed cleanly, code=${event.code}, reason=${event.reason}`);
			} else {
				console.log("Connection died");
			}
			resolve(null)
		});

		// Handle errors
		socket.addEventListener("error", (event) => {
			resolve(null)
			console.log(event)
		});

		socket.addEventListener("message", (event) => {
			const response: IHCCombinedResponse = JSON.parse(event.data,(key,value) => key === "endTime" && value !== null ? new Date(value) : value)
			console.log("recieved update:",response.type,response.state,response.role,response.string)
			if (response.string === "confirm") {
				clearTimeout(timeoutID)
				//update state based on response
				clientStateObject.state = {...clientStateObject.state, ...response.state};
				clientRoleObject.role = response.role;

				// add the ongoing event listener
				socket.addEventListener("message", (event) => {
					const response: IHCResponse = JSON.parse(event.data,(key,value) => key === "endTime" && value !== null ? new Date(value) : value)
					console.log("recieved update:",response.type,response.state,response.role,response.string)
					if (response.type == "state-response" || response.type == "combined-response") {
						clientStateObject.state = {...clientStateObject.state, ...response.state};
					}
					if (response.type == "role-response" || response.type == "combined-response") {
						clientRoleObject.role = response.role;
					}
					if (response.string !== null && response.string !== "confirm") {
						clientLastMessageObject.message = response.string;
					}
				});

				// Handle disconnection
				socket.addEventListener("close", (event) => {
					clientLastMessageObject.message = event.reason
					clientLastStatusCode.code = event.code
					if (event.wasClean) {
						console.log(`Closed cleanly, code=${event.code}, reason=${event.reason}`);
					} else {
						console.log("Connection died");
					}
					webSocketObject.websocket = null
				});
	
				// Handle errors
				socket.addEventListener("error", (event) => {
					clientErroredObject.error = true;
					console.log(event)
				});

				webSocketObject.websocket = socket
				resolve(null);
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

async function sendMessageAndAwaitResponse(message: IHCMessageData, messageType: "query" | "state-update" | "role-update" | "reset-session") {
	return new Promise((resolve) => {
		if (webSocketObject.websocket) {
			const timeoutID = setTimeout(() => {
				webSocketObject.websocket!.close()
				console.log("websocket timeout")
				resolve(null)
			},5000)

			webSocketObject.websocket.addEventListener("message", (event) => {
				const response: IHCResponse = JSON.parse(event.data,(key,value) => key === "endTime" && value !== null ? new Date(value) : value)
				if (
					(messageType === "query" && response.string === "confirm" && response.type === "combined-response") ||
					(messageType === "state-update" && response.string === "confirm" && response.type === "state-response") ||
					(messageType === "role-update" && response.string === "confirm" && response.type === "role-response") ||
					(messageType === "reset-session" && response.string === "confirm" && response.type === "combined-response")
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
