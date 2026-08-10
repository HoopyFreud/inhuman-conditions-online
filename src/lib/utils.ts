import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

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
	url.searchParams.append('joinType',joinType)

	let header = new Headers()
	header.append("Upgrade","websocket")

	let request = new Request(url, {
		method:"GET",
		headers: header
	})

	const response = await fetch(request);
	return response.webSocket;
}