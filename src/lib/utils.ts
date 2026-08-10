import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { env } from "cloudflare:workers";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChild<T> = T extends { child?: any } ? Omit<T, "child"> : T;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type WithoutChildren<T> = T extends { children?: any } ? Omit<T, "children"> : T;
export type WithoutChildrenOrChild<T> = WithoutChildren<WithoutChild<T>>;
export type WithElementRef<T, U extends HTMLElement = HTMLElement> = T & { ref?: U | null };

export function getStub(sessionID: string) {
	return env.IHC_GAME_SERVER.getByName(sessionID);
}

export async function newSession(stub: DurableObjectStub, sessionID: string) {
	const headersObject = {
		"Join-Type": "new",
		"method": "GET",
		"Session-ID": sessionID
	}
	const request: Request = new Request('do://mechanist.net/ihc-gameserver',{"headers": headersObject})
	return await stub.fetch(request);
}

export async function joinSession(stub: DurableObjectStub, sessionID: string) {
	const headersObject = {
		"Join-Type": "existing",
		"method": "GET",
		"Session-ID": sessionID
	}
	const request: Request = new Request('do://mechanist.net/ihc-gameserver',{"headers": headersObject})
	return await stub.fetch(request);
}