import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

interface IHCSessionData {
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

interface IHCSessionUpdate {
	type: "update";
	data: Partial<IHCSessionData>
}

type IHCMessageData = (IHCIntroductionData | IHCQuery | IHCSessionUpdate)

interface IHCSessionResponse {
	type: "session";
	data: IHCSessionData
}

interface IHCStringResponse {
	type: "string";
	data: string
}

type IHCResponse = (IHCSessionResponse | IHCStringResponse)

let clientStateModel: IHCSessionData = {
	"gameState": "pre-init",
	"validatedSessions": 0,
	"moduleID": null,
	"robotCardID": null,
	"penaltyCardID": null,
	"backgroundCardID": null,
	"permanentPenalty": false,
	"continuousCatalyzation": false,
	"sealedFile": false,
	"endTime": null
}

let clientLastMessage: string = ""

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

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
		if (response.type == "session") {
			clientStateModel = response.data;
		}
		else {
			clientLastMessage = response.data;
		}
	});
	// Handle errors
	socket.addEventListener("error", (event) => {
		console.error("WebSocket error:", event);
	});

	// Handle disconnection
	socket.addEventListener("close", (event) => {
		if (event.wasClean) {
			console.log(`Closed cleanly, code=${event.code}, reason=${event.reason}`);
		} else {
			console.log("Connection died");
		}
	});

	return await sendAndRecieveIntroduction(socket, introMessage)
}

async function sendAndRecieveIntroduction(socket: WebSocket, introMessage: IHCMessageData) {
	return Promise.race([
		new Promise<WebSocket | null>((resolve) => {
			socket.addEventListener("message", (event) => {
				const response: IHCResponse = JSON.parse(event.data)
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
		}),
		new Promise<null>((resolve) => {
			setTimeout(() => {
				socket.close()
				resolve(null)
			},1000)
		})
	])
}