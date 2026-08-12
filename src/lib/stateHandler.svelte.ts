export interface IHCStateData {
	gameState: (
		"init" | "game-setup" | 
		"select-penalty-prelim" | "select-penalty-final" | "calibrate-penalty" |
		"select-module" | "confirm-module" |
		"select-background-fail" | "select-background-success" |
		"interrogate" | "end-game");
	validatedSessions: number;
	moduleID: number | null;
	robotCardID: number | null;
	penaltyCardID: number | [number, number] | null;
	backgroundCardID: number | null;
	permanentPenalty: boolean;
	continuousCatalyzation: boolean;
	digitalGame: boolean;
	sealedFile: boolean;
	endTime: Date | null
}

export type IHCRole = "detective" | "suspect"

interface IHCRoleData {
	self: IHCRole;
	other: IHCRole;
}

interface IHCIntroductionData {
	type: "intro";
	data: {
		sessionID: string;
		joinType: string;
	}
}

interface IHCQuery {
	type: "query";
	data: null
}

interface IHCStateUpdate {
	type: "state-update";
	data: Partial<IHCStateData>
}

interface IHCRoleUpdate {
	type: "role-update";
	data: IHCRoleData
}

type IHCMessageData = (IHCIntroductionData | IHCQuery | IHCStateUpdate | IHCRoleUpdate)

interface IHCStateResponse {
	type: "state-response";
	state: Partial<IHCStateData>
	role: null
	string: "confirm" | null
}

interface IHCRoleResponse {
	type: "role-response";
	state: null
	role: IHCRole
	string: "confirm" | null
}

interface IHCCombinedResponse {
	type: "combined-response";
	state: Partial<IHCStateData> | null
	role: IHCRole | null
	string: "confirm" | null
}

type IHCResponse = (IHCStateResponse | IHCRoleResponse | IHCCombinedResponse)

export const clientLastMessageObject: {message: string} = $state({message: ""})
export const clientLastStatusCode: {code: number | null} = $state({code: null})
export const clientErroredObject: {error: boolean} = $state({error: false})
export const clientStateObject: {state:IHCStateData} = $state({
    state: {
        gameState: "init",
        validatedSessions: 0,
        moduleID: null,
        robotCardID: null,
        penaltyCardID: null,
        backgroundCardID: null,
        permanentPenalty: false,
        continuousCatalyzation: false,
        digitalGame: false,
        sealedFile: false,
        endTime: null
    }
})
export const clientRoleObject: {role: IHCRole | null} = $state({role: null})
export const sessionIDObject: {ID: string} = $state(({ID: ""}))
export const webSocketObject: {websocket: WebSocket | null} = $state({websocket: null})

export function resetState() {
	console.log("resetting state")
	clientLastMessageObject.message = ""
	clientLastStatusCode.code = null
	clientErroredObject.error = false
	clientStateObject.state = {
		gameState: "init",
		validatedSessions: 0,
		moduleID: null,
		robotCardID: null,
		penaltyCardID: null,
		backgroundCardID: null,
		permanentPenalty: false,
		continuousCatalyzation: false,
        digitalGame: false,
		sealedFile: false,
		endTime: null
	}
	clientRoleObject.role = null
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
	socket.addEventListener("close", (event) => {
        webSocketObject.websocket = null
		clientLastMessageObject.message = event.reason
		clientLastStatusCode.code = event.code
		if (event.wasClean) {
			console.log(`Closed cleanly, code=${event.code}, reason=${event.reason}`);
		} else {
			console.log("Connection died");
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
		},1000)

		socket.addEventListener("message", (event) => {
			const response: IHCCombinedResponse = JSON.parse(event.data)
			clearTimeout(timeoutID)
			if (response.string === "confirm") {
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
			},1000)

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