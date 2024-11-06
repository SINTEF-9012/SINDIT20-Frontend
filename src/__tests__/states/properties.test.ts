import { describe, it, vi, expect, beforeEach } from 'vitest';
import { Properties } from '$lib/components/states/properties.svelte';
import type { PropertyNodeType, NodeUri } from '$lib/types';
import { property } from 'three/webgpu';


// Mock Toast State
vi.mock('$lib/components/states/toast-state.svelte', () => {
    return {
        getToastState: vi.fn().mockReturnValue({
            add: vi.fn(),
            destroy: vi.fn()
        })
    };
});

const node1 = {
    propertyName: 'Test1',
    description: 'Description1',
    propertyDataType: {uri: 'http://www.w3.org/2001/XMLSchema#string1'},
    propertyUnit: {uri: 'http://www.w3.org/2001/XMLSchema#string1'},
    propertyValue: 'Test1',

};
const node2 = {
    propertyName: 'Test2',
    description: 'Description2',
    propertyDataType: {uri: 'http://www.w3.org/2001/XMLSchema#string2'},
    propertyUnit: {uri: 'http://www.w3.org/2001/XMLSchema#string2'},
    propertyValue: 'Test2',

};
const node3 = {
    propertyName: 'Test3',
    propertyDescription: 'Test Description', // Changed from description to propertyDescription!!!
    propertyDataType: {uri: 'http://www.w3.org/2001/XMLSchema#string'},
    propertyUnit: {uri: 'http://www.w3.org/2001/XMLSchema#string'},
    propertyValue: 'Test3',
    streamingTopic: 'topic/test',
    streamingPath: 'tmp',
    propertyConnection: {uri: 'http://www.w3.org/2001/XMLSchema#string'},

};

describe('Properties State', () => {
    let propertiesState = new Properties();

    beforeEach(() => {
        propertiesState.destroy();
        propertiesState = new Properties();
    });

    it('should initialize with an empty array', () => {
        expect(propertiesState.getAllProperties()).toEqual([]);
    });

    it('should get properties by list of ids', () => {
        const propertyNodeType: PropertyNodeType = 'AbstractAssetProperty';
        propertiesState.addPropertyNode(propertyNodeType, node1);
        propertiesState.addPropertyNode(propertyNodeType, node2);
        const properties = propertiesState.getAllProperties();
        expect(properties).toBeDefined();
        expect(properties).to.have.length(2);
        const propertyIds: NodeUri[] = [];
        properties.forEach((property) => {
            propertyIds.push({uri: property.id});
        });
        const propertiesById = propertiesState.getProperties(propertyIds);
        expect(propertiesById).toBeDefined();
        expect(propertiesById).to.have.length(2);
        expect(propertiesById[0]).to.have.property('propertyName', node1.propertyName);
        expect(propertiesById[0]).to.have.property('nodeType', propertyNodeType);
        expect(propertiesById[1]).to.have.property('propertyName', node2.propertyName);
    });

    it('should add a new AbstractAssetProperty', () => {
        const propertyNodeType: PropertyNodeType = 'AbstractAssetProperty';
        propertiesState.addPropertyNode(propertyNodeType, node1);
        const properties = propertiesState.getAllProperties();
        expect(properties).toBeDefined();
        expect(properties).to.have.length(1);
        expect(properties[0]).to.have.property('propertyName', node1.propertyName);
        expect(properties[0]).to.have.property('description', node1.description);
        expect(properties[0]).to.have.property('propertyValue', node1.propertyValue);
        expect(properties[0]).to.have.property('nodeType', propertyNodeType);
    });

    it('should add a new StreamingProperty', () => {
        const propertyNodeType: PropertyNodeType = 'StreamingProperty';
        propertiesState.addPropertyNode(propertyNodeType, node3);
        const properties = propertiesState.getAllProperties();
        expect(properties).toBeDefined();
        expect(properties).to.have.length(1);
        expect(properties[0]).to.have.property('propertyName', node3.propertyName);
        expect(properties[0]).to.have.property('description', node3.propertyDescription);
        expect(properties[0]).to.have.property('propertyValue', node3.propertyValue);
        expect(properties[0]).to.have.property('nodeType', propertyNodeType);
    });

});
