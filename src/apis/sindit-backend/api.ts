const API_BASE_URL = import.meta.env.VITE_SINDIT_BACKEND_API
const KG_BASE_URI = import.meta.env.VITE_SINDIT_KG_BASE_URI


export async function getNodes() {
    const endpoint = 'kg/nodes';
    const url = `${API_BASE_URL}/${endpoint}`;
    console.log("getNodes", `${url}`)
    const response = await fetch(`${url}`);
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
    return response.json();
}

export async function getNode(node_uri: string, depth: number = 1) {
    const endpoint = 'kg/node';
    const uri = `${API_BASE_URL}/${node_uri}`;
    const url = `${API_BASE_URL}/${endpoint}?node_uri=${uri}&depth=${depth}`;
    console.log("getNodes", `${url}`)
    const response = await fetch(`${url}`);
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
    return response.json();
}

export async function createAbstractNodeForWorkspace(workspace: string) {
    const data = {
        uri: `${KG_BASE_URI}${workspace}`,
        label: workspace,
        assetDescription: 'Workspace'
    }
    const response = await fetch(`${API_BASE_URL}/kg/asset`, {
        method: 'POST',
        headers: {
        'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error('Error performing POST request');
    }
        return response.json();
}

export async function createAbstractNode(
                        nodeId: string, nodeName: string, nodeDescription: string,
                        workspace: string = 'default'
                    ) {
    const data = {
        uri: `${KG_BASE_URI}${workspace}/${nodeId}`,
        label: nodeName,
        assetDescription: nodeDescription
    }
    const response = await fetch(`${API_BASE_URL}/kg/asset`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
    });
    if (!response.ok) {
        throw new Error('Error performing POST request');
    }
    return response.json();
}
