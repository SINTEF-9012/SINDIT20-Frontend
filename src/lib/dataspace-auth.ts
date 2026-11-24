/**
 * Authentication types understood by the SINDIT backend's EDC Management API client
 * (`sindit/dataspace/edc_client.py`). Only `tokenbased` makes the backend send the
 * key resolved from `authenticationKeyPath` as the `X-Api-Key` header; any other
 * value results in no auth header being sent.
 */
export const DATASPACE_AUTH_TYPES = [
	{ value: '', label: 'None (management API is open)' },
	{ value: 'tokenbased', label: 'API key (X-Api-Key header)' }
] as const;

export function isSupportedDataspaceAuthType(value: string | undefined | null): boolean {
	const normalized = (value ?? '').trim().toLowerCase();
	return DATASPACE_AUTH_TYPES.some((t) => t.value === normalized);
}
