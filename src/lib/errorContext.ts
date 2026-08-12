import { createContext } from 'svelte';

export const [getErrorContext, setErrorContext] = createContext<() => boolean>();