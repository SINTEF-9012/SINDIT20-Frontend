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
    createStreamingPropertyNode as createStreamingPropertyQuery,
    addPropertyToAssetNode as addPropertyToAssetNodeQuery,
    updateNode as updateNodeQuery
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
		propertyDataTypeURI?: string,
		propertyUnitURI?: string,
		id?: string,
        propertyValue?: string,
        propertyValueTimestamp?: string,
	): Property {
		if (!id) {
			id = crypto.randomUUID();
		}
		return {
			id,
            nodeType: 'Property',
			propertyName,
			description,
			propertyDataType: {
				uri: propertyDataTypeURI ?? '',
			},
			propertyUnit: {
				uri: propertyUnitURI ?? '',
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
            propertyValue: propertyValue ?? '',
        };
    }

    private databasePropertyObject(
        query: string,
        propertyName: string,
        description: string,
        propertyDataTypeURI: string,
        propertyUnitURI: string,
        connectionURI: string,
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
            propertyConnection: {
                uri: connectionURI,
            },
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
        connectionURI: string,
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
            propertyConnection: {
                uri: connectionURI,
            },
        };
    }

    getAllProperties() {
        return get(this.properties);
    }

    getProperty(id: string): Property | AbstractAssetProperty | DatabaseProperty | StreamingProperty | undefined {
        const properties = get(this.properties);
        return properties.find((node) => node.id === id);
    }

    updateProperty(new_property: Property) {
        const properties = get(this.properties);
        const property = properties.find((node) => node.id === new_property.id);
        if (!property) {
            throw new Error(`Property with ID '${new_property.id}' not found`);
        } else {
            this.properties.update((properties) => properties.map((node) => (node.id === new_property.id ? new_property : node)));
            try {
                updateNodeQuery(new_property);
            } catch (error) {
                // revert the change
                this.toastState.add('Failed to update property node', error as string, 'error');
                this.properties.update((properties) => properties.map((node) => (node.id === new_property.id ? property : node)));
            }
        }
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
        let propertyName = '';
        if (node.propertyName) {
            propertyName = node.propertyName;
        } else {
            propertyName = node.label;
        }
        if (class_type === 'AbstractAssetProperty') {
            this.addAbstractAssetProperty(node.uri, propertyName, node.description, node.propertyDataType.uri, node.propertyUnit.uri, node.propertyValue, node.propertyValueTimestamp);
        } else if (class_type === 'StreamingProperty') {
            // console.log("addPropertyNode", node)
            this.addStreamingProperty(node.uri, node.streamingTopic, node.streamingPath, propertyName, node.propertyDescription, node.propertyDataType?.uri, node.propertyUnit?.uri, node.propertyConnection.uri, node.propertyValue, node.propertyValueTimestamp);
        } else {
            throw new Error(`Invalid property node type '${class_type}'`);
        }
    }

    createProperty(class_type: PropertyNodeType, assetNodeId: string, node: any) {
        console.log("createProperty", class_type, node)
        if (class_type === 'AbstractAssetProperty') {
            return this.createAbstractAssetProperty(assetNodeId, node.propertyName, node.description, node.propertyDataType.uri, node.propertyUnit.uri, node.propertyValue);
        } else if (class_type === 'StreamingProperty') {
            return this.createStreamingProperty(assetNodeId, node.streamingTopic, node.streamingPath, node.propertyName, node.description, node.propertyDataType.uri, node.propertyUnit.uri, node.propertyConnection.uri);
        } else {
            throw new Error(`Invalid property node type '${class_type}'`);
        }
    }

    addAbstractAssetProperty(
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

    async addStreamingProperty(
        id: string,
        streamingTopic: string,
        streamingPath: string,
        propertyName: string,
        description: string,
        propertyDataTypeURI: string,
        propertyUnitURI: string,
        connectionURI: string,
        propertyValue?: string,
        propertyValueTimestamp?: string,
    ) {
        const newProperty = this.streamingPropertyObject(
            streamingTopic,
            streamingPath,
            propertyName,
            description,
            propertyDataTypeURI,
            propertyUnitURI,
            connectionURI,
            id,
            propertyValue,
            propertyValueTimestamp,
        );
        this.addProperty(newProperty);
    }

    async createAbstractAssetProperty(
        assetNodeId: string,
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
        let ok = true;
        try {
            this.addProperty(newProperty);
            await createAbstractAssetPropertyQuery(newProperty);
            await addPropertyToAssetNodeQuery(assetNodeId, newProperty.id);
            // Property needs to be added to the asset node outside this function! (See create-new-node-property.svelte)
        } catch (error) {
            this.toastState.add('Failed to create property node', error as string, 'error');
            this.deleteProperty(newProperty.id);
            ok = false;
        }
        if (ok)
            return newProperty.id;
        else
            return undefined;
    }

    async createStreamingProperty(
        assetNodeId: string,
        streamingTopic: string,
        streamingPath: string,
        propertyName: string,
        description: string,
        propertyDataTypeURI: string,
        propertyUnitURI: string,
        connectionURI: string,
        propertyValue?: string,
        propertyValueTimestamp?: string,
    ) {
        const newProperty = this.streamingPropertyObject(
            streamingTopic,
            streamingPath,
            propertyName,
            description,
            propertyDataTypeURI,
            propertyUnitURI,
            connectionURI,
            undefined,
            propertyValue,
            propertyValueTimestamp,
        );
        let ok = true;
        try {
            this.addProperty(newProperty);
            await createStreamingPropertyQuery(newProperty);
            await addPropertyToAssetNodeQuery(assetNodeId, newProperty.id);
            // Property needs to be added to the asset node outside this function! (See create-new-node-property.svelte)
        } catch (error) {
            this.toastState.add('Failed to create property node', error as string, 'error');
            this.deleteProperty(newProperty.id);
            ok = false;
        }
        if (ok)
            return newProperty.id;
        else
            return undefined;
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
