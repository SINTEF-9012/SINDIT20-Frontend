import { it, expect } from 'vitest';
import {
  getBackendUri,
  getNodeIdFromBackendUri,
  getNodeClassTypeFromBackendClassUri,
  getWorkspaceDictFromUri,
} from '$lib/utils';

const API_BASE_URI = import.meta.env.VITE_SINDIT_BACKEND_API_BASE_URI

it('getBackendUri', () => {
  const id = 'test';
  const uri = getBackendUri(id);

  expect(uri).toBe(`${API_BASE_URI}${id}`);
});

it('getNodeIdFromBackendUri', () => {
  const id = 'test';
  const uri = `${API_BASE_URI}${id}`;
  const nodeId = getNodeIdFromBackendUri(uri);

  expect(nodeId).toBe(id);
});

it('getNodeClassTypeFromBackendClassUri', () => {
  const test_class = 'test_class'
  const class_uri = `test#${test_class}`;
  const result = getNodeClassTypeFromBackendClassUri(class_uri);

  expect(result).toBe(test_class);
});

it('getWorkspaceDictFromUri', () => {
  const workspace = 'workspace';
  const workspaceUri = `test#${workspace}`;
  const result = getWorkspaceDictFromUri(workspaceUri);

  expect(result).toEqual({
    name: workspace,
    uri: workspaceUri
  });
});
