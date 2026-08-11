interface IHCStateData {
	gameState: string;
	validatedSessions: number;
	moduleID: number | null;
	robotCardID: number | null;
	penaltyCardID: number | null;
	backgroundCardID: number | null;
	permanentPenalty: boolean;
	continuousCatalyzation: boolean;
	sealedFile: boolean;
	endTime: Date | null
}

type IHCRole = "detective" | "suspect"

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
	type: "state-response";
	data: Partial<IHCStateData>
}

interface IHCRoleUpdate {
	type: "role-response";
	data: IHCRoleData
}

type IHCMessageData = (IHCIntroductionData | IHCQuery | IHCStateUpdate)

interface IHCStateResponse {
	type: "state-response";
	data: Partial<IHCStateData>
}

interface IHCRoleResponse {
	type: "role-response";
	data: IHCRole | null
}

interface IHCStringResponse {
	type: "string-response";
	data: string
}

type IHCResponse = (IHCStateResponse | IHCRoleResponse | IHCStringResponse)

export const clientLastMessageObject: {message: string} = $state({message: ""})
export const clientLastStatusCode: {code: number | null} = $state({code: null})
export const clientErroredObject: {error: boolean} = $state({error: false})
export const clientStateObject: {state:IHCStateData} = $state({
    state: {
        gameState: "pre-init",
        validatedSessions: 0,
        moduleID: null,
        robotCardID: null,
        penaltyCardID: null,
        backgroundCardID: null,
        permanentPenalty: false,
        continuousCatalyzation: false,
        sealedFile: false,
        endTime: null
    }
})
export const clientRoleObject: {role: IHCRole | null} = $state({role: null})
export const sessionIDObject: {ID: string} = $state(({ID: ""}))
export const webSocketObject: {websocket: WebSocket | null} = $state({websocket: null})

export async function joinGame(sessionID:string, joinType:string) {
	let url = new URL('https://ihc-server.mechanist.net/ihc-gameserver')
	url.searchParams.append('sessionID',sessionID)

	const socket = new WebSocket(url)
	const introMessage: IHCMessageData = {
		"type": "intro",
		"data": {
			"sessionID": sessionID,
			"joinType": joinType
		}
	}
	
	socket.addEventListener("message", (event) => {
		const response: IHCResponse = JSON.parse(event.data)
		console.log(response.data)
		if (response.type == "state-response") {
			clientStateObject.state = {...clientStateObject.state, ...response.data};
		}
		else if (response.type == "role-response") {
			clientRoleObject.role = response.data;
		}
		else {
			clientLastMessageObject.message = response.data;
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
		webSocketObject.websocket.send(JSON.stringify(query))
	}
}

export async function updateGameState(stateUpdateData: Partial<IHCStateData>) {
	if (webSocketObject.websocket) {
		const stateUpdate: IHCStateUpdate = {type: "state-response", data: stateUpdateData}
		webSocketObject.websocket.send(JSON.stringify(stateUpdate))
	}
}

export async function assignRoles(roleData: IHCRoleData) {
	if (webSocketObject.websocket) {
		const roleUpdate: IHCRoleUpdate = {type: "role-response", data: roleData}
		webSocketObject.websocket.send(JSON.stringify(roleUpdate))
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
			const response: IHCResponse = JSON.parse(event.data)
			clearTimeout(timeoutID)
			if (response.data === "success") {
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