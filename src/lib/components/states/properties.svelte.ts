import { getContext, setContext } from 'svelte';
import { writable, get } from 'svelte/store';
import { getToastState } from './toast-state.svelte';
import type {
    Property,
    AbstractAssetProperty,
    DatabaseProperty,
} from '$lib/types';
import crypto from 'crypto';
import {
    createAbstractPropertyNode as createAbstractAssetPropertyQuery,
} from '$apis/sindit-backend/kg';
export class Properties {
    properties = writable<Property[]>([]); // PropertyNodes

    private toastState: ReturnType<typeof getToastState>;

    constructor() {
        this.toastState = getToastState();
    }


    private propertyObject(
		propertyName: string,
		description: string,
		propertyDataTypeURI: string,
		propertyUnitURI: string,
		id?: string,
        propertyValue?: string,
        propertyValueTimestamp?: string,
	): Property {
		if (!id) {
			id = crypto.randomUUID();
		}
		return {
			id,
			propertyName,
			description,
			propertyDataType: {
				uri: propertyDataTypeURI,
			},
			propertyUnit: {
				uri: propertyUnitURI,
			},
            propertyValue,
            propertyValueTimestamp,
		};
	}

    private abstractAssetPropertyObject(
        propertyName: string,
        description: string,
        propertyDataTypeURI: string,
        propertyUnitURI: string,
        id?: string,
        propertyValue?: string,
        propertyValueTimestamp?: string,
    ): AbstractAssetProperty {
        const property = this.propertyObject(
            propertyName,
            description,
            propertyDataTypeURI,
            propertyUnitURI,
            id,
            propertyValue,
            propertyValueTimestamp,
        );
        return {
            ...property,
            nodeType: 'AbstractAssetProperty',
        };
    }

    private databasePropertyObject(
        propertyName: string,
        description: string,
        propertyDataTypeURI: string,
        propertyUnitURI: string,
        id?: string,
        propertyValue?: string,
        propertyValueTimestamp?: string,
    ): DatabaseProperty {
        const property = this.propertyObject(
            propertyName,
            description,
            propertyDataTypeURI,
            propertyUnitURI,
            id,
            propertyValue,
            propertyValueTimestamp,
        );
        return {
            ...property,
            nodeType: 'DatabaseProperty',
            query: '',
        };
    }

    getAllProperties() {
        return get(this.properties);
    }

    deleteAllProperties() {
        this.properties.set([]);
    }

    deleteProperty(id: string) {
        this.properties.update((properties) => properties.filter((node) => node.id !== id));
    }

    addProperty<T extends Property>(
        property: T
    ) {
        this.properties.update((properties) => [...properties, property]);
    }

    addAbstractAssetPropertyNode(
        propertyName: string,
        description: string,
        propertyDataTypeURI: string,
        propertyUnitURI: string,
        propertyValue?: string,
        propertyValueTimestamp?: string,
    ) {
        const newProperty = this.abstractAssetPropertyObject(
            propertyName,
            description,
            propertyDataTypeURI,
            propertyUnitURI,
            undefined,
            propertyValue,
            propertyValueTimestamp,
        );
        this.addProperty(newProperty);
    }

    async createAbstractAssetPropertyNode(
        propertyName: string,
        description: string,
        propertyDataTypeURI: string,
        propertyUnitURI: string,
        propertyValue?: string,
        propertyValueTimestamp?: string,
    ) {
        const newProperty = this.abstractAssetPropertyObject(
            propertyName,
            description,
            propertyDataTypeURI,
            propertyUnitURI,
            undefined,
            propertyValue,
            propertyValueTimestamp,
        );
        try {
            await createAbstractAssetPropertyQuery(newProperty.id, newProperty.propertyName, newProperty.description, newProperty.propertyDataType.uri, newProperty.propertyUnit.uri);
        } catch (error) {
            this.toastState.add('Failed to create property node', error as string, 'error');
            this.deleteProperty(newProperty.id);
        }
    }
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
