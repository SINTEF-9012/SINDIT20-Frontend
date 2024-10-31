
const API_BASE_URL = import.meta.env.VITE_SINDIT_BACKEND_API
const API_BASE_ENDPOINT = `${API_BASE_URL}/connection`


export async function backendHealthCheck(): Promise<boolean> {
    const url = `${API_BASE_URL}`;
    console.log("backendHealthCheck GET:", url);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Error performing GET request ${url}`);
        } else if (response.status === 200) {
            return true;
        } else {
            return false;
        }
    } catch (error) {
        console.error(error);
        return false;
    }
}

export async function refreshConnections(): Promise<boolean> {
    const endpoint = 'refresh';
    const url = `${API_BASE_ENDPOINT}/${endpoint}`;
    console.log("refreshConnections GET:", url)
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Error performing GET request ${url}`);
    }  else if (response.status === 200) {
        return true;
    } else {
        return false;
    }
}
