import { getContext, setContext } from 'svelte';
import { writable, get } from 'svelte/store';
import { getToastState } from './toast-state.svelte';
import type {
    Property,
    AbstractAssetProperty,
    DatabaseProperty,
    StreamingProperty,
    PropertyNodeType,
    NodeUri
} from '$lib/types';
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
        query: string,
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
            query,
        };
    }

    private streamingPropertyObject(
        streamingTopic: string,
        streamingPath: string,
        propertyName: string,
        description: string,
        propertyDataTypeURI: string,
        propertyUnitURI: string,
        id?: string,
        propertyValue?: string,
        propertyValueTimestamp?: string,
    ): StreamingProperty {
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
            nodeType: 'StreamingProperty',
            streamingTopic,
            streamingPath,
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

    addPropertyNode(class_type: PropertyNodeType, node: any) {
        if (class_type === 'AbstractAssetProperty') {
            this.addAbstractAssetPropertyNode(node.uri, node.propertyName, node.description, node.propertyDataType.uri, node.propertyUnit.uri, node.propertyValue, node.propertyValueTimestamp);
        }
    }

    addAbstractAssetPropertyNode(
        id: string,
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
            id,
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

    // Get properties by their IDs
	getProperties(ids: NodeUri[]): Property[] {
		const properties = get(this.properties);
		//const uris = ids.map((id) => getNodeIdFromBackendUri(id.uri));
        const uris = ids.map((id) => (id.uri));
		return properties.filter((property) => uris.includes(property.id));
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
