import type { DataspaceManagement } from '$lib/types';
import { writable, get } from 'svelte/store';
import { getContext, setContext } from 'svelte';
import { getToastState } from '$lib/components/states/toast-state.svelte';
import {
	getAllDataspaces as getAllDataspacesQuery,
	createDataspaceManagement as createDataspaceManagementQuery,
	testDataspaceConnection as testDataspaceConnectionQuery,
	syncDataspace as syncDataspaceQuery,
	deleteDataspaceManagement as deleteDataspaceManagementQuery,
	unpublishFromDataspace as unpublishFromDataspaceQuery,
	publishToDataspace as publishToDataspaceQuery
} from '$apis/sindit-backend/dataspace';

const DATASPACES_STATE_KEY = Symbol('dataspaces');

export class DataspacesState {
	dataspaces = writable<DataspaceManagement[]>([]);
	private toastState: ReturnType<typeof getToastState>;

	constructor() {
		this.toastState = getToastState();
	}

	destroy() {
		this.dataspaces.set([]);
	}

	getDataspace(id: string): DataspaceManagement | undefined {
		return get(this.dataspaces).find((d) => d.id === id);
	}

	getAllDataspaces(): DataspaceManagement[] {
		return get(this.dataspaces);
	}

	addDataspace(dataspace: DataspaceManagement) {
		this.dataspaces.update((list) => [...list, dataspace]);
	}

	updateDataspace(updated: DataspaceManagement) {
		this.dataspaces.update((list) =>
			list.map((d) => (d.id === updated.id ? updated : d))
		);
	}

	deleteDataspace(id: string) {
		this.dataspaces.update((list) => list.filter((d) => d.id !== id));
	}

	async updateDataspacesFromBackend() {
		try {
			const backendNodes = await getAllDataspacesQuery();
			this.dataspaces.set([]);
			backendNodes.forEach((node: any) => {
				const dataspace: DataspaceManagement = {
					id: node.uri ?? node.id ?? crypto.randomUUID(),
					nodeType: 'DataspaceManagement',
					endpoint: node.endpoint ?? '',
					dataspaceDescription: node.dataspaceDescription ?? '',
					authenticationType: node.authenticationType ?? '',
					authenticationKeyPath: node.authenticationKeyPath ?? '',
					isActive: node.isActive ?? false,
					sinditApiBaseUrl: node.sinditApiBaseUrl ?? '',
					sinditWorkspaceUri: node.sinditWorkspaceUri ?? '',
					sinditCallbackKeyPath: node.sinditCallbackKeyPath ?? '',
					dataspaceAssets: node.dataspaceAssets ?? []
				};
				this.addDataspace(dataspace);
			});
		} catch (err) {
			console.error('Failed to load dataspaces from backend:', err);
			throw err;
		}
	}

	async testConnection(id: string) {
		const updated = await testDataspaceConnectionQuery(id);
		const dataspace: DataspaceManagement = {
			...this.getDataspace(id)!,
			isActive: (updated as any).healthy ?? (updated as any).isActive ?? false
		};
		this.updateDataspace(dataspace);
		return dataspace;
	}

	async sync(id: string) {
		await syncDataspaceQuery(id);
	}

	async delete(id: string) {
		await deleteDataspaceManagementQuery(id);
		this.deleteDataspace(id);
	}

	async unpublishAsset(dataspaceId: string, assetUri: string) {
		await unpublishFromDataspaceQuery(dataspaceId, [assetUri]);
		const current = this.getDataspace(dataspaceId);
		if (current) {
			const updated: DataspaceManagement = {
				...current,
				dataspaceAssets: (current.dataspaceAssets ?? []).filter(
					(a: any) => (a.uri ?? a) !== assetUri
				)
			};
			this.updateDataspace(updated);
		}
	}

	async publishAssets(dataspaceId: string, nodeUris: string[]) {
		await publishToDataspaceQuery(dataspaceId, nodeUris);
		const current = this.getDataspace(dataspaceId);
		if (current) {
			const existingUris = new Set(
				(current.dataspaceAssets ?? []).map((a: any) => a.uri ?? a)
			);
			const newAssets = [
				...(current.dataspaceAssets ?? []),
				...nodeUris.filter((u) => !existingUris.has(u)).map((u) => ({ uri: u }))
			];
			const updated: DataspaceManagement = { ...current, dataspaceAssets: newAssets };
			this.updateDataspace(updated);
		}
	}

	async create(node: Partial<DataspaceManagement> & { uri?: string }): Promise<DataspaceManagement> {
		const created = await createDataspaceManagementQuery(node);
		const dataspace: DataspaceManagement = {
			id: (created as any).uri ?? node.uri ?? (created as any).id ?? crypto.randomUUID(),
			nodeType: 'DataspaceManagement',
			endpoint: (created as any).endpoint ?? node.endpoint ?? '',
			dataspaceDescription: (created as any).dataspaceDescription ?? node.dataspaceDescription ?? '',
			authenticationType: (created as any).authenticationType ?? node.authenticationType ?? '',
			authenticationKeyPath: (created as any).authenticationKeyPath ?? node.authenticationKeyPath ?? '',
			isActive: (created as any).isActive ?? false,
			sinditApiBaseUrl: (created as any).sinditApiBaseUrl ?? node.sinditApiBaseUrl ?? '',
			sinditWorkspaceUri: (created as any).sinditWorkspaceUri ?? node.sinditWorkspaceUri ?? '',
			sinditCallbackKeyPath: (created as any).sinditCallbackKeyPath ?? node.sinditCallbackKeyPath ?? '',
			dataspaceAssets: (created as any).dataspaceAssets ?? []
		};
		this.addDataspace(dataspace);
		return dataspace;
	}
}

export function getDataspacesState(): DataspacesState {
	return getContext<DataspacesState>(DATASPACES_STATE_KEY);
}

export function setDataspacesState(): DataspacesState {
	const state = new DataspacesState();
	setContext(DATASPACES_STATE_KEY, state);
	return state;
}
