import type {
    ReturnedDataTypeAllDataTypes,
    ReturnedDataTypeAllUnits,
    ReturnedDataTypeSearchUnits
} from "$lib/types";

// Metamodel - SINDIT API endpoints
const API_BASE_URL = import.meta.env.VITE_SINDIT_BACKEND_API
const API_BASE_ENDPOINT = `${API_BASE_URL}/metamodel`



export async function getAllDataTypes(): Promise<ReturnedDataTypeAllDataTypes[]>  {
    // Get all data types
    const endpoint = 'get_data_type';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    console.log("getAllDataTypes GET:", url)
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
    return response.json();
}

export async function getAllUnits(): Promise<ReturnedDataTypeAllUnits[]> {
    // Get all units
    const endpoint = 'get_all_units';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    console.log("getAllUnits GET:", url)
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }
    return response.json();
}

export async function searchUnits(
    query: string
): Promise<ReturnedDataTypeSearchUnits[]> {
    // Search for units
    const endpoint = 'search_unit';
    const url = `${API_BASE_ENDPOINT}/${endpoint}?search_term=${query}`;
    console.log("searchUnits GET:", url)
    const response = await fetch(url, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json'
        }
    });
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url} ${response.statusText}`);
    }
    return response.json();
}
