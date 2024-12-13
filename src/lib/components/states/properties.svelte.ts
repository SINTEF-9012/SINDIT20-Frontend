import { getContext, setContext } from 'svelte';
import { writable, get } from 'svelte/store';
import { getToastState } from './toast-state.svelte';
import type {
    Property,
    AbstractAssetProperty,
    DatabaseProperty,
    StreamingProperty,
    S3ObjectProperty,
    PropertyNodeType,
    NodeUri
} from '$lib/types';
import {
    createAbstractPropertyNode as createAbstractAssetPropertyQuery,
    createStreamingPropertyNode as createStreamingPropertyQuery,
    createS3PropertyNode as createS3PropertyQuery,
    addPropertyToAssetNode as addPropertyToAssetNodeQuery,
    updateNode as updateNodeQuery,
    streamDataReader as streamDataReaderQuery
} from '$apis/sindit-backend/kg';

export class Properties {
    properties = writable<Property[]>([]); // PropertyNodes
    private streamingObjects: Set<StreamingProperty> = new Set();
    private readers: Map<string, ReadableStreamDefaultReader<Uint8Array>> = new Map();
    private toastState: ReturnType<typeof getToastState>;

    constructor() {
        this.toastState = getToastState();
    }

    destroy() {
        this.properties.set([]);
        this.streamingObjects.forEach(obj => this.stopStreamingData(obj));
        this.streamingObjects.clear();
        this.toastState.destroy();
    }

    addStreamingObject(streamingObject: StreamingProperty) {
        if (!this.streamingObjects.has(streamingObject)) {
            this.streamingObjects.add(streamingObject);
            this.startStreamingData(streamingObject);
        }
    }

    removeStreamingObject(streamingObject: StreamingProperty) {
        if (this.streamingObjects.has(streamingObject)) {
            this.streamingObjects.delete(streamingObject);
            this.stopStreamingData(streamingObject);
        }
    }

    private handleDataSteam(data: any) {
        const jsondata = JSON.parse(data);
        if (jsondata.propertyValue) {
            const property = this.getProperty(jsondata.uri);
            if (property) {
                property.propertyValue = jsondata.propertyValue;
                property.propertyValueTimestamp = jsondata.propertyValueTimestamp;
                this.updateProperty(property);
            }
        }
    }

    private async streamData(reader: ReadableStreamDefaultReader<Uint8Array>) {
        const decoder = new TextDecoder();
        let done = false;
        while (!done) {
            const { value, done: readerDone } = await reader.read();
            done = readerDone;
            const chunk = decoder.decode(value, { stream: true });
            this.handleDataSteam(chunk);
        }
    }

    private startStreamingData(streamingObject: StreamingProperty) {
        streamDataReaderQuery(streamingObject.id).then((reader) => {
            this.readers.set(streamingObject.id, reader);
            this.streamData(reader);
        }).catch((error) => {
            this.toastState.add('Failed to stream data', error as string, 'error');
        });
    }

    private stopStreamingData(streamingObject: StreamingProperty) {
        const reader = this.readers.get(streamingObject.id);
        if (reader) {
            reader.cancel();
            this.readers.delete(streamingObject.id);
        }
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

    private s3PropertyObject(
        bucket: string,
        key: string,
        connectionURI: string,
        propertyName: string,
        description: string,
        id?: string,
        propertyValue?: string,
        propertyValueTimestamp?: string,
    ): S3ObjectProperty {
        const property = this.propertyObject(
            propertyName,
            description,
            undefined,
            undefined,
            id,
            propertyValue,
            propertyValueTimestamp,
        );
        return {
            ...property,
            nodeType: 'S3ObjectProperty',
            propertyConnection: {
                uri: connectionURI,
            },
            bucket,
            key,
        };
    }

    getAllProperties() {
        return get(this.properties);
    }

    getProperty(id: string): Property | AbstractAssetProperty | DatabaseProperty | StreamingProperty | S3ObjectProperty | undefined {
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
        }
    }

    updatePropertyBackend(new_property: Property) {
        try {
            updateNodeQuery(new_property);
        } catch (error) {
            this.toastState.add('Failed to update property node', error as string, 'error');
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
        } else if ( class_type === 'S3ObjectProperty' ) {
            console.log(node);
            this.addS3Property(node.uri, node.bucket, node.key, propertyName, node.description, node.propertyConnection.uri, node.propertyValue, node.propertyValueTimestamp);
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
        this.addStreamingObject(newProperty);
    }

    async addS3Property(
        id: string,
        bucket: string,
        key: string,
        propertyName: string,
        description: string,
        connectionURI: string,
        propertyValue?: string,
        propertyValueTimestamp?: string,
    ) {
        const newProperty = this.s3PropertyObject(
            bucket,
            key,
            connectionURI,
            propertyName,
            description,
            id,
            propertyValue,
            propertyValueTimestamp,
        );
        this.addProperty(newProperty);
        console.log(get(this.properties));
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

    async createS3Property(
        assetNodeId: string,
        bucket: string,
        key: string,
        propertyName: string,
        description: string,
        connectionURI: string,
        propertyValue?: string,
        propertyValueTimestamp?: string,
    ) {
        const newProperty = this.s3PropertyObject(
            bucket,
            key,
            connectionURI,
            propertyName,
            description,
            undefined,
            propertyValue,
            propertyValueTimestamp,
        );
        let ok = true;
        try {
            this.addProperty(newProperty);
            await createS3PropertyQuery(newProperty);
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
