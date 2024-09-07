import type { Link, LinkDirection } from '$lib/types';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/components/states/toast-state.svelte';
import { writable, get } from 'svelte/store';
import { getNodes } from './nodes-state.svelte';

export class Links {
	links = writable<Link[]>([]);
	private toastState: ReturnType<typeof getToastState>;
    private nodesState: ReturnType<typeof getNodes>;

	constructor() {
		this.toastState = getToastState();
        this.nodesState = getNodes();
	}

	// Create a new link
	async createLink(
        linkDescription: string,
        linkWeight: number,
        linkDirection: LinkDirection,
        sourceNodeId: string,
        targetNodeId: string,
	): Promise<void> {
		const newLink: Link = {
			id: crypto.randomUUID(),
			linkDescription,
            linkWeight,
            linkDirection,
            sourceNodeId,
            targetNodeId
		};
        const sourceNode = this.nodesState.getNode(sourceNodeId);
        const targetNode = this.nodesState.getNode(targetNodeId);
		this.links.update((links) => [...links, newLink]);
		this.toastState.add('Link created', `Link "${newLink.linkDescription}" created from "${sourceNode?.nodeName}" to "${targetNode?.nodeName}"`, 'info');

		return Promise.resolve();
	}

	// Get a link by id
	getLink(id: string) {
		const links = get(this.links);
		return links.find((link) => link.id === id);
	}

	// Update a link by id
	updateLink(id: string, updatedLink: Link) {
		const links = get(this.links);
		const linkId = links.findIndex((link) => link.id === id);
		updatedLink.id = id;
		this.links.update((links) => [
			...links.slice(0, linkId),
			updatedLink,
			...links.slice(linkId + 1)
		]);
		this.toastState.add('Link updated', `Link "${id}" updated`, 'info');
	}

	// Delete a link by index
	deleteLink(id: string) {
		const links = get(this.links);
		if (!links.find((link) => link.id === id)) {
			this.toastState.add('Link not found', `Link "${id}" not found`, 'error');
			return;
		} else {
			this.links.update((links) => [...links.filter((link) => link.id !== id)]);
			this.toastState.add('Link deleted', `Link "${id}" has been deleted`, 'info');
		}
	}

	// Get all links
	getAllLinks() {
		return this.links;
	}
}

// Unique key to store the state in the Svelte context
const LINKS_KEY = Symbol('LINKS');

export function setLinks() {
	const linkState = new Links();
	setContext(LINKS_KEY, linkState);
	return linkState;
}

export function getLinks() {
	return getContext<ReturnType<typeof setLinks>>(LINKS_KEY);
}
