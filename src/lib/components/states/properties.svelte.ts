import { getContext, setContext } from 'svelte';

export class Properties {

}

// Unique key to store the state in the Svelte context
const KEY = Symbol('PROPERTIES');

export function setPropertiesState() {
	const state = new Properties();
	setContext(KEY, state);
	return state;
}

export function getPropertiesState() {
	return getContext<ReturnType<typeof setPropertiesState>>(KEY);
}
