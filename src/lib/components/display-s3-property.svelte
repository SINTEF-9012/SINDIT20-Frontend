<script lang="ts">
	import { onMount } from 'svelte';
	import type { S3ObjectProperty } from '$lib/types';
	import { FileDropzone } from '@skeletonlabs/skeleton';
	import { FileIcon, FileTextIcon } from 'svelte-feather-icons';
	import {
		deleteNode as deleteNodeQuery,
		updateNode as updateNodeQuery
	} from '$apis/sindit-backend/kg';

	export let property: S3ObjectProperty;

	const inputForm = {
		propertyName: property.propertyName,
		description: property.description,
		propertyValue: property.propertyValue
	};

	// Legacy presigned POST: { url, fields }. Current backends send a presigned PUT URL string.
	let jsonPropertyValue: { url: string; fields: string | Record<string, string> } | null = null;
	let uploadUrl = ''; // presigned PUT URL (current backend)
	let uploadFile: File | null = null;
	let isUploadValue = false;
	let isUploaded = false;

	let content = null; // This will be the content of the S3 object
	let textContent = ''; // If content is text, use this to display the text content of the S3 object
	let contentType = ''; // This will be used to determine the type of the S3 object
	let presignedUrl = ''; // This will be used to fetch the S3 object (if not possible from contentType)
	let filename = ''; // This will be used to infer the MIME type of the S3 object
	$: isLoading = false; // Bool - fetching the S3 object
	$: isFileReady = false; // Bool - file is ready to upload

	let errorMessage = ''; // Status message if error occurs
	$: isError = false; // Bool - the S3 object cannot be fetched

	// Supported file extensions and their MIME types
	const mimeTypes: { [key: string]: string } = {
		txt: 'text/plain',
		pdf: 'application/pdf',
		png: 'image/png',
		jpg: 'image/jpeg',
		jpeg: 'image/jpeg',
		gif: 'image/gif',
		mp4: 'video/mp4',
		webm: 'video/webm',
		mov: 'video/quicktime'
	};

	function getPresignedUrl(value: string): string {
		// if value starts with host.docker.internal, replace it with localhost
		let presignedUrl = '';
		if (
			value.startsWith('host.docker.internal') ||
			value.startsWith('http://host.docker.internal')
		) {
			presignedUrl = value.replace('host.docker.internal', 'localhost');
		} else {
			presignedUrl = value;
		}
		console.log(presignedUrl);
		return presignedUrl;
	}

	// Guess MIME type based on file extension
	function getMimeType(filename: string) {
		const ext = filename.split('.').pop()?.toLowerCase();
		if (!ext) {
			return 'application/octet-stream';
		} else {
			return mimeTypes[ext] || 'application/octet-stream';
		}
	}

	function isTextContent() {
		return contentType.startsWith('text/') || contentType === 'application/json';
	}

	async function getTextContent(content: Blob): Promise<void> {
		const reader = new FileReader();
		reader.onload = () => {
			textContent = reader.result as string;
		};
		reader.readAsText(content);
	}

	function parseFields(raw: string | Record<string, string>): Record<string, string> {
		return typeof raw === 'string' ? JSON.parse(raw.replace(/'/g, '"')) : raw;
	}

	async function uploadFileToS3(file: File): Promise<void> {
		try {
			let response: Response;
			if (uploadUrl) {
				// Presigned PUT. Send raw bytes without a Content-Type header: older backends
				// sign with SigV2, where an unsigned Content-Type breaks the signature.
				response = await fetch(getPresignedUrl(uploadUrl), {
					method: 'PUT',
					body: await file.arrayBuffer()
				});
			} else if (jsonPropertyValue) {
				// Legacy presigned POST: every policy field must be sent, then the file last.
				const formData = new FormData();
				for (const [name, value] of Object.entries(parseFields(jsonPropertyValue.fields))) {
					formData.append(name, value);
				}
				formData.append('file', file);
				response = await fetch(getPresignedUrl(jsonPropertyValue.url), {
					method: 'POST',
					body: formData
				});
			} else {
				return;
			}
			if (!response.ok) {
				throw new Error(`HTTP error ${response.status} ${response.statusText}`);
			}
			// The backend polls S3 and switches the property to a download URL by itself.
			isUploaded = true;
		} catch (error) {
			errorMessage = `Error uploading file: ${error}`;
			alert(errorMessage);
			isError = true;
		}
	}

	function handleFileChange(event) {
		uploadFile = event.target.files[0];
		isFileReady = true;
	}

	function handleUploadFile() {
		if (uploadFile && (uploadUrl || jsonPropertyValue)) {
			uploadFileToS3(uploadFile);
		}
	}

	onMount(async () => {
		// The backend sets urlMode ("upload" | "download"); fall back to the value's shape
		// for older nodes (an object means a legacy presigned POST).
		const value = property.propertyValue;
		if (value && typeof value === 'object') {
			jsonPropertyValue = value as typeof jsonPropertyValue;
			isUploadValue = true;
		} else if (property.urlMode === 'upload' && typeof value === 'string') {
			uploadUrl = value;
			isUploadValue = true;
		} else {
			isUploadValue = false;
		}

		if (!isUploadValue) {
			// Fetch the S3 object
			isLoading = true;
			presignedUrl = getPresignedUrl(property.propertyValue as string);
			try {
				const response = await fetch(presignedUrl);
				if (!response.ok) {
					throw new Error(`HTTP error ${response.status} ${response.statusText}`);
				}

				// Extract the file name from the URL
				const urlParts = presignedUrl.split('?');
				filename = urlParts[0].split('/').pop() as string;

				// Get the Content-Type header or guess from the file extension
				const tmpContentType = response.headers.get('Content-Type');
				if (tmpContentType === 'binary/octet-stream') {
					contentType = getMimeType(filename);
				} else {
					contentType = tmpContentType as string;
				}
				console.log(contentType);

				// Fetch the content of the S3 object
				content = await response.blob();

				// If the content is text, read it
				if (isTextContent()) {
					await getTextContent(content);
				}
			} catch (error) {
				errorMessage = `Error fetching the S3 object: ${error}`;
				console.error(errorMessage);
				isError = true;
			}
			isLoading = false;
		} else {
			// propertyValue contains information to upload a file to S3
			console.log('propertyValue is a JSON object to upload a file to S3');
			isLoading = false;
		}
	});

	// Use a unique suffix for IDs
	const idSuffix =
		property.id ?? property.propertyName ?? Math.random().toString(36).slice(2, 10);
</script>

<div class="s3-properties border variant-ghost-tertiary">
	<div class="prop">
		<label for={'name-' + idSuffix}>PropertyName:</label>
		<input
			type="input"
			id={'name-' + idSuffix}
			name={'name-' + idSuffix}
			bind:value={inputForm.propertyName}
			class="input text-white"
		/>
	</div>
	<div class="prop">
		<label for={'description-' + idSuffix}>Description:</label>
		<input
			type="input"
			id={'description-' + idSuffix}
			name={'description-' + idSuffix}
			bind:value={inputForm.description}
			class="input text-white"
		/>
	</div>
	<div class="prop">
		<label for={'bucket-' + idSuffix}>Bucket:</label>
		<input
			type="input"
			id={'bucket-' + idSuffix}
			name={'bucket-' + idSuffix}
			value={property.bucket}
			readonly
			class="input text-white"
		/>
	</div>
	<div class="prop">
		<label for={'key-' + idSuffix}>Key:</label>
		<input
			type="input"
			id={'key-' + idSuffix}
			name={'key-' + idSuffix}
			value={property.key}
			readonly
			class="input text-white"
		/>
	</div>
	{#if property.urlMode}
		<div class="prop">
			<label for={'urlMode-' + idSuffix}>URL Mode:</label>
			<input
				type="input"
				id={'urlMode-' + idSuffix}
				name={'urlMode-' + idSuffix}
				value={property.urlMode}
				readonly
				class="input text-white"
			/>
		</div>
	{/if}
	<div class="prop">
		<label for={'value-' + idSuffix}>Value:</label>
		<input
			type="input"
			id={'value-' + idSuffix}
			name={'value-' + idSuffix}
			bind:value={inputForm.propertyValue}
			readonly
			class="input text-white"
		/>
	</div>
	<div class="s3-object">
		{#if isUploadValue && isUploaded}
			<div class="justify-center variant-soft-success">
				Uploaded. SINDIT switches this property to the file within about 10 seconds; reopen
				the node to view it.
			</div>
		{:else if isUploadValue}
			<FileDropzone
				name="file"
				class="text-white"
				bind:file={uploadFile}
				multiple={false}
				on:change={handleFileChange}
			>
				<svelte:fragment slot="lead">
					<div style="display: flex; justify-content: center; width: 100%;">
						{#if isFileReady}
							<FileTextIcon size="20" />
						{:else}
							<FileIcon size="18" />
						{/if}
					</div>
				</svelte:fragment>
				<svelte:fragment slot="message">Drag and drop or browse for file</svelte:fragment>
				<svelte:fragment slot="meta"
					>Upload single file to S3 object storage</svelte:fragment
				>
			</FileDropzone>
			<button
				class="btn variant-ghost-primary"
				on:click={handleUploadFile}
				disabled={!isFileReady}>Upload</button
			>
		{:else if isLoading}
			<div class="placeholder animate-pulse justify-center">Loading...</div>
		{:else if isError}
			<div class="justify-center variant-soft-error">{errorMessage}</div>
		{:else}
			<div>
				<!-- Render file content based on file type -->
				{#if content && !isLoading && !isError}
					{#if isTextContent()}
						<div class="overflow-y-scroll variant-soft-primary">
							<pre>{textContent}</pre>
						</div>
					{:else if contentType === 'application/pdf'}
						<iframe
							title="pdf document"
							src={URL.createObjectURL(content)}
							frameborder="0"
						></iframe>
					{:else if contentType.startsWith('image/')}
						<img src={URL.createObjectURL(content)} alt="" />
					{:else if contentType.startsWith('video/')}
						<video controls>
							<source src={URL.createObjectURL(content)} type={contentType} />
							<track kind="captions" />
							Your browser does not support the video tag.
						</video>
					{:else}
						<p>Unsupported file type: {contentType}</p>
					{/if}
				{/if}
			</div>
		{/if}
	</div>
</div>

<style>
	.s3-properties {
		padding: 10px;
	}
	.prop {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: 5px;
		margin-top: 10px;
		width: 100%;
	}
	.input {
		flex-grow: 1;
		padding-left: 10px;
	}
	.s3-object {
		display: flex;
		flex-direction: row;
		gap: 5px;
		margin-top: 10px;
		width: 100%;
		height: 200px;
	}
</style>
