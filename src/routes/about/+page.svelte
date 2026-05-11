<script lang="ts">
	import { onMount } from 'svelte';
	import { env } from '$env/dynamic/public';
	import { isBackendRunning } from '$lib/stores';
	import { getBackendVersion } from '$apis/sindit-backend/connection';

	const backendUrl = env.PUBLIC_SINDIT_BACKEND_API;

	let version: string | null = null;

	onMount(async () => {
		version = await getBackendVersion();
	});
	const sinditUrl = 'https://www.sintef.no/en/software/sindit-sintef-digital-twin-framework/';
	const repoUrl = 'https://github.com/SINTEF-9012/SINDIT20';
	const license = 'MIT';

	const contacts = [
		{
			name: 'An Ngoc Lam',
			email: 'an.lam@sintef.no',
			url: 'https://www.sintef.no/en/all-employees/employee/an.lam/'
		},
		{
			name: 'Gøran Brekke Svaland',
		email: 'goran.svaland@sintef.no',
			url: 'https://www.sintef.no/en/all-employees/employee/goran.svaland/'
		}
	];

	const stack = [
		{ name: 'FastAPI', role: 'REST API backend', color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
		{ name: 'GraphDB', role: 'RDF triple store', color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300' },
		{ name: 'SvelteKit', role: 'Frontend framework', color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' },
		{ name: 'RDFLib', role: 'Semantic data modeling', color: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
		{ name: 'InfluxDB', role: 'Time-series storage', color: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
		{ name: 'MQTT', role: 'Real-time streaming', color: 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300' },
	];
</script>

<div class="min-h-screen bg-slate-50 dark:bg-slate-900">
	<div class="container mx-auto px-6 py-12 max-w-4xl">

		<!-- Header -->
		<div class="text-center mb-12">
			<img
				src="/logo/sindit_logo_with_slogan-removebg.png"
				alt="SINDIT Logo"
				class="mx-auto mb-8 max-h-32 md:max-h-40 w-auto drop-shadow-xl"
			/>
		</div>

		<!-- Backend Status Card -->
		<div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-sm mb-8">
			<div class="flex items-start justify-between gap-4">
				<div>
					<p class="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">Backend</p>
					{#if $isBackendRunning}
						<div class="flex items-center gap-2 mb-1">
							<span class="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
							<span class="font-semibold text-green-600 dark:text-green-400">Online</span>
						</div>
					{:else}
						<div class="flex items-center gap-2 mb-1">
							<span class="w-2.5 h-2.5 rounded-full bg-red-500"></span>
							<span class="font-semibold text-red-600 dark:text-red-400">Offline</span>
						</div>
					{/if}
					<a href={backendUrl} target="_blank" rel="noopener noreferrer" class="text-sm text-slate-500 dark:text-slate-400 font-mono hover:text-indigo-600 dark:hover:text-indigo-400 break-all transition-colors">{backendUrl}</a>
				</div>
				<span class="flex-shrink-0 px-2.5 py-1 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs font-mono rounded-full">
					{#if version}v{version}{:else}—{/if}
				</span>
			</div>
		</div>

		<!-- Description -->
		<div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm mb-6">
			<h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-3">About</h2>
			<p class="text-slate-600 dark:text-slate-400 leading-relaxed">
				SINDIT is a semantic knowledge graph-based digital twin framework developed by
				<a href={sinditUrl} target="_blank" rel="noopener noreferrer" class="text-indigo-600 dark:text-indigo-400 hover:underline font-medium">SINTEF</a>.
				It provides a REST API for managing digital twin assets, their properties, and real-time connections
				to data sources such as InfluxDB, MQTT, S3, and PostgreSQL.
			</p>
		</div>

		<!-- Contact -->
		<div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm mb-6">
			<h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Contact</h2>
			<div class="flex flex-col gap-3">
				{#each contacts as contact}
					<div class="flex items-center gap-3">
						<div class="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
							<svg class="w-4 h-4 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
								<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
							</svg>
						</div>
						<div>
							<a href={contact.url} target="_blank" rel="noopener noreferrer" class="font-medium text-slate-800 dark:text-slate-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{contact.name}</a>
							{#if contact.email}
								<p class="text-sm text-slate-500 dark:text-slate-400">
									<a href="mailto:{contact.email}" class="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">{contact.email}</a>
								</p>
							{/if}
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Contact Form -->
		<div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm mb-6">
			<h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-1">Report an Issue or Ask a Question</h2>
			<p class="text-sm text-slate-500 dark:text-slate-400 mb-4">Your message will be sent directly to the SINDIT team.</p>
			<iframe
				src="https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=OQ_w4UFgsEWzCeAhDYsyr-UaDyNbq8ZOh-Nu8BbNq_NUQjAzWUo3UUJEWDBRMFFBOU9TVVRXTUo4Ui4u&embed=true"
				title="Contact form"
				width="100%"
				height="600"
				frameborder="0"
				marginwidth="0"
				marginheight="0"
				style="border: none; min-width: 100%;"
				allowfullscreen
			></iframe>
		</div>

		<div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm mb-6">
			<h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Technology Stack</h2>
			<div class="flex flex-wrap gap-2">
				{#each stack as item}
					<span class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium {item.color}" title={item.role}>
						{item.name}
					</span>
				{/each}
			</div>
		</div>


		<!-- Links -->
		<div class="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm">
			<h2 class="text-lg font-semibold text-slate-800 dark:text-slate-100 mb-4">Links</h2>
			<div class="flex flex-wrap gap-3">
				<a
					href={repoUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors"
				>
					<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
						<path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.2 11.38.6.1.82-.26.82-.58v-2.02c-3.34.72-4.04-1.6-4.04-1.6-.54-1.38-1.33-1.74-1.33-1.74-1.08-.74.08-.72.08-.72 1.2.08 1.83 1.23 1.83 1.23 1.07 1.82 2.8 1.3 3.48 1 .1-.77.42-1.3.76-1.6-2.66-.3-5.46-1.33-5.46-5.93 0-1.3.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.18 0 0 1-.32 3.3 1.23a11.5 11.5 0 013-.4c1.02.01 2.04.14 3 .4 2.28-1.55 3.28-1.23 3.28-1.23.66 1.66.25 2.88.12 3.18.77.84 1.23 1.92 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.82 1.1.82 2.22v3.3c0 .32.22.7.83.58C20.57 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z"/>
					</svg>
					GitHub
				</a>
				<a
					href={sinditUrl}
					target="_blank"
					rel="noopener noreferrer"
					class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-xl text-sm font-medium transition-colors"
				>
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
					</svg>
					SINTEF Page
				</a>
				<span class="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 rounded-xl text-sm font-medium">
					<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
						<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
					</svg>
					{license} License
				</span>
			</div>
		</div>

	</div>
</div>

