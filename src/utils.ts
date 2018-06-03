import { StoredItems, FormattedOptions } from './options/types';

type CheckFn = () => boolean;
type ThenFn = () => void;
export function wait(check: CheckFn, then: ThenFn) {
	if (check()) {
		then();
	} else {
		setTimeout(() => wait(check, then), 50);
	}
}

export function getPlexMediaRequest({
	button,
	...mediaOptions
}: PlexMediaOptions): Promise<{ found: boolean; key: string | null }> {
	return new Promise((resolve, reject) => {
		chrome.runtime.sendMessage(
			{
				type: 'SEARCH_PLEX',
				options: mediaOptions,
				serverConfig: config.server,
			},
			res => {
				if (res.err) {
					reject(res.err);
				}
				resolve(res);
			}
		);
	});
}

function _getOptions(): Promise<FormattedOptions> {
	const storage = chrome.storage.sync || chrome.storage.local;

	return new Promise((resolve, reject) => {
		function handleOptions(items: StoredItems) {
			if (!items.plexToken || !items.servers) {
				reject(new Error('Unset options.'));
				return;
			}

			// For now we support only one Plex server, but the options already
			// allow multiple for easy migration in the future.
			const server = items.servers[0];
			const options: FormattedOptions = {
				server: {
					...server,
					// Compatibility for users who have not updated their settings yet.
					connections: server.connections || [{ uri: server.url }],
				},
			};
			if (items.couchpotatoBasicAuthUsername) {
				options.couchpotatoBasicAuth = {
					username: items.couchpotatoBasicAuthUsername,
					password: items.couchpotatoBasicAuthPassword,
				};
			}
			// TODO: stupid copy/pasta
			if (items.radarrBasicAuthUsername) {
				options.radarrBasicAuth = {
					username: items.radarrBasicAuthUsername,
					password: items.radarrBasicAuthPassword,
				};
			}
			if (items.couchpotatoUrlRoot && items.couchpotatoToken) {
				options.couchpotatoUrl = `${
					items.couchpotatoUrlRoot
				}/api/${encodeURIComponent(items.couchpotatoToken)}`;
			}
			if (items.radarrUrlRoot && items.radarrToken) {
				options.radarrUrl = items.radarrUrlRoot;
				options.radarrToken = items.radarrToken;
			}
			options.radarrStoragePath = items.radarrStoragePath;
			options.radarrQualityProfileId = items.radarrQualityProfileId;

			resolve(options);
		}
		storage.get(null, items => {
			if (chrome.runtime.lastError) {
				chrome.storage.local.get(null, handleOptions as any);
			} else {
				handleOptions(items as any);
			}
		});
	});
}

export function openOptionsPage() {
	chrome.runtime.sendMessage({ type: 'OPEN_OPTIONS' });
}

let config: FormattedOptions;
export function parseOptions() {
	return _getOptions().then(
		options => {
			config = options;
		},
		err => {
			showNotification(
				'warning',
				'Not all options for the Web to Plex extension are filled in.',
				15000,
				openOptionsPage
			);
			throw err;
		}
	);
}

function getPlexMediaUrl(plexMachineId: string, key: string) {
	return `https://app.plex.tv/web/app#!/server/${plexMachineId}/details?key=${encodeURIComponent(
		key
	)}`;
}

type CallBackFn = () => void;

let notificationTimeout;
function showNotification(
	state: 'warning' | 'info',
	text: string,
	timeout?: number,
	callback?: CallBackFn
) {
	if (notificationTimeout) {
		clearTimeout(notificationTimeout);
		notificationTimeout = null;
	}
	const existingEl = document.querySelector('.web-to-plex-notification');
	if (existingEl) {
		document.body.removeChild(existingEl);
	}

	const el = document.createElement('div');
	el.classList.add('web-to-plex-notification');
	function close() {
		document.body.removeChild(el);
	}
	el.onclick = () => {
		close();
		callback && callback();
	};
	if (state === 'warning') {
		el.classList.add('web-to-plex-warning');
	}
	el.textContent = text;
	document.body.appendChild(el);
	notificationTimeout = setTimeout(close, timeout || 5000);
}

type AddToDownloaderOptions = { imdbId?: string };

function _maybeAddToCouchpotato(options: AddToDownloaderOptions) {
	// TODO: this does not work anymore!
	if (!options.imdbId) {
		showNotification(
			'warning',
			'Cancelled adding to CouchPotato since there is no IMDB ID.'
		);
		return;
	}
	chrome.runtime.sendMessage(
		{
			type: 'VIEW_COUCHPOTATO',
			url: `${config.couchpotatoUrl}/media.get`,
			imdbId: options.imdbId,
			basicAuth: config.couchpotatoBasicAuth,
		},
		res => {
			const movieExists = res.success;
			if (res.err) {
				showNotification(
					'warning',
					'CouchPotato request failed (look in DevTools for more info)'
				);
				console.error('Error with viewing on CouchPotato:', res.err);
				return;
			}
			if (!movieExists) {
				_addToCouchPotatoRequest(options);
				return;
			}
			showNotification(
				'info',
				`Movie is already in CouchPotato (status: ${res.status})`
			);
		}
	);
}

function _addToCouchPotatoRequest(options: AddToDownloaderOptions) {
	chrome.runtime.sendMessage(
		{
			type: 'ADD_COUCHPOTATO',
			url: `${config.couchpotatoUrl}/movie.add`,
			imdbId: options.imdbId,
			basicAuth: config.couchpotatoBasicAuth,
		},
		res => {
			if (res.err) {
				showNotification(
					'warning',
					'Could not add to CouchPotato (look in DevTools for more info)'
				);
				console.error('Error with adding on CouchPotato:', res.err);
				return;
			}
			if (res.success) {
				showNotification('info', 'Added movie on CouchPotato.');
			} else {
				showNotification('warning', 'Could not add to CouchPotato.');
			}
		}
	);
}

function _addToRadarrRequest(options: AddToDownloaderOptions) {
	if (!options.imdbId) {
		showNotification(
			'warning',
			'Cancelled adding to Radarr since there is no IMDB ID.'
		);
		return;
	}
	chrome.runtime.sendMessage(
		{
			type: 'ADD_RADARR',
			url: `${config.radarrUrl}/api/movie`,
			imdbId: options.imdbId,
			radarrToken: config.radarrToken,
			radarrStoragePath: config.radarrStoragePath,
			radarrQualityProfileId: config.radarrQualityProfileId,
			basicAuth: config.radarrBasicAuth,
		},
		res => {
			if (res && res.err) {
				showNotification('warning', `Could not add to Radarr. ${res.err}`);
				console.error('Error with adding on Radarr:', res.err);
				return;
			} else if (res && res.success) {
				showNotification('info', 'Added movie on Radarr.');
			} else {
				showNotification('warning', 'Could not add to Radarr. Unknown Error');
			}
		}
	);
}

type Action = 'found' | 'notfound' | 'downloader' | 'error';

export function modifyPlexButton(
	el: HTMLAnchorElement,
	action: Action,
	title: string,
	options?: any
) {
	el.style.removeProperty('display');
	if (action === 'found') {
		el.href = getPlexMediaUrl(config.server.id, options.key);
		el.textContent = 'On Plex';
		el.classList.add('web-to-plex-button--found');
	}
	if (action === 'notfound' || action === 'error') {
		el.removeAttribute('href');
		el.textContent = action === 'notfound' ? 'Not on Plex' : 'Plex error';
		el.classList.remove('web-to-plex-button--found');
	}
	if (action === 'downloader') {
		el.href = '#';
		el.textContent = 'Download';
		el.classList.add('web-to-plex-button--downloader');
		el.addEventListener('click', e => {
			e.preventDefault();
			if (config.radarrUrl) {
				_addToRadarrRequest(options);
			} else {
				_maybeAddToCouchpotato(options);
			}
		});
	}

	if (title) {
		el.title = title;
	}
}

interface PlexMediaOptions {
	button: HTMLAnchorElement;
	field?: string;
	type?: 'show' | 'movie';
	title: string;
	year: number;
	imdbId?: string;
}

export function findPlexMedia(options: PlexMediaOptions) {
	getPlexMediaRequest(options)
		.then(({ found, key }) => {
			if (found) {
				modifyPlexButton(options.button, 'found', 'Found on Plex', { key });
				return Promise.resolve();
			}
			options.field = 'original_title';
			return getPlexMediaRequest(options).then(({ found, key }) => {
				if (found) {
					modifyPlexButton(options.button, 'found', 'Found on Plex', key);
				} else {
					const showDownloader =
						(config.couchpotatoUrl || config.radarrUrl) &&
						options.type !== 'show';
					const action = showDownloader ? 'downloader' : 'notfound';
					const title = showDownloader
						? 'Could not find, want to download?'
						: 'Could not find on Plex';
					modifyPlexButton(options.button, action, title, options);
				}
			});
		})
		.catch(err => {
			modifyPlexButton(
				options.button,
				'error',
				'Request to your Plex Media Server failed.'
			);
			console.error('Request to Plex failed', err);
		});
}
