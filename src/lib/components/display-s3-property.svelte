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
        propertyValue: property.propertyValue,
    };

    let jsonPropertyValue: {url: string, fields: string} | null = null;
    let fields: {key: string, policy: string, signature: string } | null = null;
    let uploadFile: File | null = null;
    const uploadFileFormData = new FormData();
    let isUploadValue = false;

    let content = null;    // This will be the content of the S3 object
    let textContent = '';  // If content is text, use this to display the text content of the S3 object
    let contentType = '';  // This will be used to determine the type of the S3 object
    let presignedUrl = ''; // This will be used to fetch the S3 object (if not possible from contentType)
    let filename = '';     // This will be used to infer the MIME type of the S3 object
    $: isLoading = false;  // Bool - fetching the S3 object
    $: isFileReady = false;// Bool - file is ready to upload

    let errorMessage = ''; // Status message if error occurs
    $: isError = false;    // Bool - the S3 object cannot be fetched

    // Supported file extensions and their MIME types
    const mimeTypes: { [key: string]: string } = {
        "txt": "text/plain",
        "pdf": "application/pdf",
        "png": "image/png",
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "gif": "image/gif",
        "mp4": "video/mp4",
        "webm": "video/webm",
        "mov": "video/quicktime",
    };

    function getPresignedUrl(value: string): string {
        // if value starts with host.docker.internal, replace it with localhost
        let presignedUrl = '';
        if (value.startsWith('host.docker.internal') || value.startsWith('http://host.docker.internal')) {
            presignedUrl = value.replace('host.docker.internal', 'localhost');
        } else {
            presignedUrl = value;
        }
        console.log(presignedUrl);
        return presignedUrl;
    }

    // Guess MIME type based on file extension
    function getMimeType(filename: string) {;
        const ext = filename.split(".").pop()?.toLowerCase();
        if (!ext) {
            return "application/octet-stream";
        } else {
            return mimeTypes[ext] || "application/octet-stream";
        }
    }

    function isTextContent() {
        return contentType.startsWith("text/") || contentType === "application/json";
    }

    async function getTextContent(content: Blob): Promise<void> {
        const reader = new FileReader();
        reader.onload = () => {
            textContent = reader.result as string;
        };
        reader.readAsText(content);
    }

    async function uploadFileToS3(file: File): Promise<void> {

        if (!jsonPropertyValue) {
            console.error("JSON object is not defined");
            return;
        }
        if (!uploadFile) {
            console.error("File is not defined");
            return;
        }
        try {
            const jsonString = jsonPropertyValue.fields.replace(/'/g, '"');
            fields = JSON.parse(jsonString);
        } catch (error) {
            console.error("Error parsing JSON object:", error);
            throw error;
        }
        if (!fields) {
            console.error("Fields are not defined");
            return;
        }
        uploadFileFormData.append('key', fields.key);
        uploadFileFormData.append('policy', fields.policy);
        uploadFileFormData.append('signature', fields.signature);
        uploadFileFormData.append('file', file);

        /*
        for(var pair of uploadFileFormData.entries()) {
            console.log(pair[0]+', '+pair[1]);
        }
        */
       const url = getPresignedUrl(jsonPropertyValue.url);

        try {
            const response = await fetch(url, {
                method: 'POST',
                body: uploadFileFormData,
            })
            console.log(response);
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status} ${response.statusText}`);
            } else {
                console.log("File uploaded successfully");
            }
            // TODO: upon successful upload, the propertyValue needs to be updated in the backend! (it does not know what has happened in S3)
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
        if (uploadFile && jsonPropertyValue) {
            uploadFileToS3(uploadFile);
        }
    }

    onMount(async () => {
        // check if propertyValue is upload or download object
        if (typeof property.propertyValue === 'string') {
            isUploadValue = false;
        } else if (typeof property.propertyValue === 'object') {
            jsonPropertyValue = property.propertyValue;
            isUploadValue = true;
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
                const urlParts = presignedUrl.split("?");
                filename = urlParts[0].split("/").pop() as string;

                // Get the Content-Type header or guess from the file extension
                const tmpContentType = response.headers.get("Content-Type")
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
            console.log("propertyValue is a JSON object to upload a file to S3");
            isLoading = false;
        }
    });

    // Use a unique suffix for IDs
    const idSuffix = property.id ?? property.propertyName ?? Math.random().toString(36).slice(2, 10);
</script>


<div class="s3-properties border variant-ghost-tertiary">
    <div class="prop">
        <label for={"name-" + idSuffix}>PropertyName:</label>
        <input type="input" id={"name-" + idSuffix} name={"name-" + idSuffix} bind:value={inputForm.propertyName} class="input text-white">
    </div>
    <div class="prop">
        <label for={"description-" + idSuffix}>Description:</label>
        <input type="input" id={"description-" + idSuffix} name={"description-" + idSuffix} bind:value={inputForm.description} class="input text-white">
    </div>
    <div class="prop">
        <label for={"bucket-" + idSuffix}>Bucket:</label>
        <input type="input" id={"bucket-" + idSuffix} name={"bucket-" + idSuffix} value={property.bucket} readonly class="input text-white">
    </div>
    <div class="prop">
        <label for={"key-" + idSuffix}>Key:</label>
        <input type="input" id={"key-" + idSuffix} name={"key-" + idSuffix} value={property.key} readonly class="input text-white">
    </div>
    {#if property.urlMode}
    <div class="prop">
        <label for={"urlMode-" + idSuffix}>URL Mode:</label>
        <input type="input" id={"urlMode-" + idSuffix} name={"urlMode-" + idSuffix} value={property.urlMode} readonly class="input text-white">
    </div>
    {/if}
    <div class="prop">
        <label for={"value-" + idSuffix}>Value:</label>
        <input type="input" id={"value-" + idSuffix} name={"value-" + idSuffix} bind:value={inputForm.propertyValue} readonly class="input text-white">
    </div>
    <div class="s3-object">
        {#if isUploadValue}
            <FileDropzone name="file" class="text-white" bind:file={uploadFile} multiple={false} on:change={handleFileChange}>
                <svelte:fragment slot="lead">
                    <div style="display: flex; justify-content: center; width: 100%;">
                        {#if isFileReady}
                            <FileTextIcon size=20/>
                        {:else}
                            <FileIcon size=18/>
                        {/if}
                    </div>
                </svelte:fragment>
                <svelte:fragment slot="message">Drag and drop or browse for file</svelte:fragment>
                <svelte:fragment slot="meta">Upload single file to S3 object storage</svelte:fragment>
            </FileDropzone>
            <button class="btn variant-ghost-primary" on:click={handleUploadFile} disabled={!isFileReady}>Upload</button>
        {:else}
            {#if isLoading}
                <div class="placeholder animate-pulse justify-center">Loading...</div>
            {:else}
                {#if isError}
                    <div class="justify-center variant-soft-error">{errorMessage}</div>
                {:else}
                    <div>
                        <!-- Render file content based on file type -->
                        {#if content && !isLoading && !isError}
                            {#if isTextContent()}
                                <div class="overflow-y-scroll variant-soft-primary">
                                    <pre>{textContent}</pre>
                                </div>
                            {:else if contentType === "application/pdf"}
                                <iframe title="pdf document" src="{URL.createObjectURL(content)}" frameborder="0"></iframe>
                            {:else if contentType.startsWith("image/")}
                                <img src="{URL.createObjectURL(content)}" alt="" />
                            {:else if contentType.startsWith("video/")}
                                <video controls>
                                    <source src="{URL.createObjectURL(content)}" type="{contentType}" />
                                    <track kind="captions" />
                                    Your browser does not support the video tag.
                                </video>
                            {:else}
                                <p>Unsupported file type: {contentType}</p>
                            {/if}
                        {/if}
                    </div>
                {/if}
            {/if}
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
