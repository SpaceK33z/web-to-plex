/* global browser */
let BACKGROUND_DEVELOPER = false;

let external = {},
	__context_parent__,
	__context_save_element__,
	BACKGROUND_TERMINAL =
		BACKGROUND_DEVELOPER?
			console:
		{ error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m };

let date  = (new Date),
	YEAR  = date.getFullYear(),
	MONTH = date.getMonth() + 1,
	DATE  = date.getDate();

let BACKGROUND_STORAGE = browser.storage.sync || browser.storage.local;
let BACKGROUND_CONFIGURATION;


// returns the proper CORS mode of the URL
let cors = url => ((/^(https|sftp)\b/i.test(url) || /\:(443|22)\b/i.test(url)? '': 'no-') + 'cors');

// Create a Crypto-Key
// new Key(number:integer, string:symbol) -> string
class Key {
	constructor(length = 8, symbol = '') {
		let values = [];

		window.crypto.getRandomValues(new Uint32Array(16)).forEach((value, index, array) => values.push(value.toString(36)));

		return this.length = length, this.value = values.join(symbol);
	}

	rehash(length, symbol) {
		if(length <= 0)
			length = this.length;

		return this.value = new Key(length, symbol);
	}
}

// Session instances
let SessionKey = new Key(16), // create a session key
	SessionState = false;     // has this been run already?

// Generate request headers (for fetches)
// new Headers({username, password}) -> object
class Headers {
	constructor(Authorization) {
		let headers = { Accept: 'application/json' };

		if(!Authorization)
			return headers;

		return {
			Authorization: `Basic ${ btoa(`${ Authorization.username }:${ Authorization.password }`) }`,
			...headers
		};
	}
}

// Change the badge status
// ChangeStatus({ MovieOrShowID, MovieOrShowTitle, MovieOrShowType, MovieOrShowIDProvider, MovieOrShowYear, LinkURL, FileType, FilePath }) -> undefined
function ChangeStatus({ ITEM_ID, ITEM_TITLE, ITEM_TYPE, ID_PROVIDER, ITEM_YEAR, ITEM_URL = '', FILE_TYPE = '', FILE_PATH }) {

	let FILE_TITLE = ITEM_TITLE.replace(/\-/g, ' ').replace(/[\s\:]{2,}/g, ' - ').replace(/[^\w\s\-\']+/g, ''),
			// File friendly title
		SEARCH_TITLE = ITEM_TITLE.replace(/[\-\s]+/g, '-').replace(/\s*&\s*/g, ' and ').replace(/[^\w\-\'\*\#]+/g, ''),
			// Search friendly title
		SEARCH_PROVIDER = /\b(tv|show|series)\b/i.test(ITEM_TYPE)? 'GG': /^im/i.test(ID_PROVIDER)? 'VO': /^tm/i.test(ID_PROVIDER)? 'GX': 'GG';

	ITEM_ID = (ITEM_ID && !/^tt$/i.test(ITEM_ID)? ITEM_ID: '') + '';
	ITEM_ID = ITEM_ID.replace(/^.*\b(tt\d+)\b.*$/, '$1').replace(/^.*\bid=(\d+)\b.*$/, '$1').replace(/^.*(?:movie|tv|(?:tv-?)?(?:shows?|series|episodes?))\/(\d+).*$/, '$1');

	external = { ...external, ID_PROVIDER, ITEM_ID, ITEM_TITLE, ITEM_YEAR, ITEM_URL, ITEM_TYPE, SEARCH_PROVIDER, SEARCH_TITLE, FILE_PATH, FILE_TITLE, FILE_TYPE };

	browser.browserAction.setBadgeText({
		text: ID_PROVIDER
	});

	browser.browserAction.setBadgeBackgroundColor({
		color: (ITEM_ID? '#f45a26': '#666666')
	});

	browser.contextMenus.update('W2P', {
		title: `Find "${ ITEM_TITLE } (${ ITEM_YEAR || YEAR })"`
	});

	for(let databases = 'IM TM TV'.split(' '), length = databases.length, index = 0, database; index < length; index++)
		browser.contextMenus.update('W2P-' + (database = databases[index]), {
			title: (
				((ID_PROVIDER == (database += 'Db')) && ITEM_ID)?
					`Open in ${ database } (${ (+ITEM_ID? '#': '') + ITEM_ID })`:
				`Find in ${ database }`
			),
			checked: false
		});

	browser.contextMenus.update('W2P-XX', {
		title: `Find on ${ (SEARCH_PROVIDER == 'VO'? 'Vumoo': SEARCH_PROVIDER == 'GX'? 'GoStream': 'Google') }`,
		checked: false
	});
}

// get the saved options
function getConfiguration() {
	return new Promise((resolve, reject) => {
		function handleConfiguration(options) {
			if((!options.plexToken || !options.servers) && !options.IGNORE_PLEX)
				return reject(new Error('Required options are missing')),
					null;

			let server, o;

			if(!options.IGNORE_PLEX) {
				// For now we support only one Plex server, but the options already
				// allow multiple for easy migration in the future.
				server = options.servers[0];
				o = {
					server: {
						...server,
						// Compatibility for users who have not updated their settings yet.
						connections: server.connections || [{ uri: server.url }]
					},
					...options
				};
			} else {
				o = options;
			}

			resolve(o);
		}

		BACKGROUND_STORAGE.get(null, options => {
			if(browser.runtime.lastError)
				browser.runtime.lastError.message ||
				browser.storage.local.get(null, handleOptions);
			else
				handleConfiguration(options);
		});
	});
}

// self explanatory, returns an object; sets the configuration variable
function parseConfiguration() {
	return getConfiguration().then(options => options, error => { throw error });
}

function load(name, private) {
	return JSON.parse((private && sessionStorage? sessionStorage: localStorage).getItem(btoa(name)));
}

function save(name, data, private) {
	return (private && sessionStorage? sessionStorage: localStorage).setItem(btoa(name), JSON.stringify(data));
}

async function UpdateConfiguration(force_update = false) {
	let configuration = load('configuration');

	if(force_update || configuration === null || configuration === undefined)
		BACKGROUND_CONFIGURATION = configuration = await parseConfiguration();
	else
		BACKGROUND_CONFIGURATION = configuration;

	if(BACKGROUND_DEVELOPER = configuration.DeveloperMode) {
		BACKGROUND_TERMINAL =
			BACKGROUND_DEVELOPER?
				console:
			{ error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m };

		BACKGROUND_TERMINAL.warn(`BACKGROUND_DEVELOPER: ${BACKGROUND_DEVELOPER}`);
	}

	save('configuration', BACKGROUND_CONFIGURATION);
};

UpdateConfiguration();

/** CouchPotato - Movies **/
// At this point you might want to think, WHY would you want to do
// these requests in a background page instead of the content script?
// This is because Movieo is served over HTTPS, so it won't accept requests to
// HTTP servers. Unfortunately, many people use CouchPotato over HTTP.
function Open_CouchPotato(request, sendResponse) {
	fetch(`${ request.url }?id=${ request.imdbId }`, {
		headers: new Headers(request.basicAuth),
		mode: cors(request.url)
	})
	.then(response => response.json())
	.then(json => {
		sendResponse({ success, status: (success? json.media.status: null) });
	})
	.catch(error => {
		sendResponse({ error: String(error), location: '@0B: Open_CouchPotato' });
	});
}

function Push_CouchPotato(request, sendResponse) {
	fetch(`${ request.url }?identifier=${ request.imdbId }`, {
		headers: new Headers(request.basicAuth),
		mode: cors(request.url)
	})
	.then(response => response.json())
	.catch(error => sendResponse({ error: 'Item not found', location: '@0B: Push_CouchPotato => fetch.then.catch', silent: true }))
	.then(response => {
		sendResponse({ success: response.success });
	})
	.catch(error => {
		sendResponse({ error: String(error) , location: '@0B: Push_CouchPotato'});
	});
}

/** Watcher - Movies **/
function Push_Watcher(request, sendResponse) {
	let headers = {
			'Content-Type': 'application/json',
			'X-Api-Key': request.token,
			...(new Headers(request.basicAuth))
		},
		id = (/^(tt)?$/.test(request.imdbId)? request.tmdbId: request.imdbId),
			// if the IMDbID is empty, jump to the TMDbID
		query = (/^tt\d+$/i.test(id)? 'imdbid': /^\d+$/.test(id)? 'tmdbid': (id = encodeURI(`${request.title} ${request.year}`), 'term')),
			// if the IMDbID is empty, use "&tmdbid={ id }"
			// if the IMDbID isn't empty, use "&imdbid={ id }"
			// otherwise, use "&term={ title } { year }"
		debug = { headers, query, request };
			// setup a stack trace for debugging

	fetch(debug.url = `${ request.url }?apikey=${ request.token }&mode=addmovie&${ query }=${ id }`)
		.then(response => response.json())
		.catch(error => sendResponse({ error: 'Movie not found', location: '@0B: Push_Watcher => fetch.then.catch', silent: true }))
		.then(response => {
			if((response.response + "") == "true")
				return sendResponse({
					success: `Added to Watcher (${ request.StoragePath })`
				});

			throw new Error(response.error);
		})
		.catch(error => {
			sendResponse({
				error: String(error),
				location: `@0B: Push_Watcher => fetch("${ request.url }", { headers }).catch(error => { sendResponse })`,
				debug
			});
		});
}

/** Radarr - Movies **/
function Push_Radarr(request, sendResponse) {
	let headers = {
			'Content-Type': 'application/json',
			'X-Api-Key': request.token,
			...(new Headers(request.basicAuth))
		},
		id = (/^(tt)?$/.test(request.imdbId)? request.tmdbId: request.imdbId),
			// if the IMDbID is empty, jump to the TMDbID
		query = (/^tt\d+$/i.test(id)? 'imdb?imdbid': /^\d+$/.test(id)? 'tmdb?tmdbid': (id = encodeURI(`${request.title} ${request.year}`), 'term')),
			// if the IMDbID is empty, use "/tmdb?tmdbid={ id }"
			// if the IMDbID isn't empty, use "/imdb?imdbid={ id }"
			// otherwise, use "&term={ title } { year }"
		debug = { headers, query, request };
			// setup a stack trace for debugging

	fetch(debug.url = `${ request.url }lookup/${ query }=${ id }&apikey=${ request.token }`)
		.then(response => response.json())
		.catch(error => sendResponse({ error: 'Movie not found', location: '@0B: Push_Radarr => fetch.then.catch', silent: true }))
		.then(data => {
			let body,
				// Monitor, search, and download movie ASAP
				props = {
					monitored: true,
					minimumAvailability: 'preDB',
					qualityProfileId: request.QualityID,
					rootFolderPath: request.StoragePath,
					addOptions: {
						searchForMovie: true
					}
				};

			if(!(data instanceof Array) && !data.length && !data.title) {
				throw new Error('Movie not found');
			} else if(data.length) {
				body = {
					...data[0],
					...props
				};
			} else if(data.title) {
				body = {
					...data,
					...props
				};
			}

			BACKGROUND_TERMINAL.group('Generated URL');
				BACKGROUND_TERMINAL.log('URL', request.url);
				BACKGROUND_TERMINAL.log('Head', headers);
				BACKGROUND_TERMINAL.log('Body', body);
			BACKGROUND_TERMINAL.groupEnd();

			return debug.body = body;
		})
		.then(body => {
			return fetch(`${ request.url }?apikey=${ request.token }`, debug.requestHeaders = {
				method: 'POST',
				mode: cors(request.url),
				body: JSON.stringify(body),
				headers
			});
		})
		.then(response => response.text())
		.then(data => {
			debug.data =
			data = JSON.parse(data || `{"path":"${ request.StoragePath.replace(/\\/g, '\\\\') }${ request.title } (${ request.year })"}`);

			if(data && data[0] && data[0].errorMessage) {
				sendResponse({
					error: data[0].errorMessage,
					location: `@0B: Push_Radarr => fetch("${ request.url }", { headers }).then(data => { if })`,
					debug
				});
			} else if(data && data.path) {
				sendResponse({
					success: 'Added to ' + data.path
				});
			} else {
				sendResponse({
					error: 'Unknown error',
					location: `@0B: Push_Radarr => fetch("${ request.url }", { headers }).then(data => { else })`,
					debug
				});
			}
		})
		.catch(error => {
			sendResponse({
				error: String(error),
				location: `@0B: Push_Radarr => fetch("${ request.url }", { headers }).catch(error => { sendResponse })`,
				debug
			});
		});
}

/** Sonarr - TV Shows **/
function Push_Sonarr(request, sendResponse) {
	let headers = {
			'Content-Type': 'application/json',
			'X-Api-Key': request.token,
			...(new Headers(request.basicAuth))
		},
		id = request.tvdbId,
		query = encodeURIComponent(`tvdb:${ id }`),
		debug = { headers, query, request };
			// setup stack trace for debugging

	fetch(debug.url = `${ request.url }lookup?apikey=${ request.token }&term=${ query }`)
		.then(response => response.json())
		.catch(error => sendResponse({ error: 'TV Show not found', location: '@0B: Push_Sonarr => fetch.then.catch', silent: true }))
		.then(data => {
			if(!(data instanceof Array) || !data.length)
				throw new Error('TV Show not found');

			// Monitor, search, and download series ASAP
			let body = {
				...data[0],
				monitored: true,
				seasonFolder: true,
				minimumAvailability: 'preDB',
				qualityProfileId: request.QualityID,
				rootFolderPath: request.StoragePath,
				addOptions: {
					searchForMissingEpisodes: true
				}
			};

			BACKGROUND_TERMINAL.group('Generated URL');
				BACKGROUND_TERMINAL.log('URL', request.url);
				BACKGROUND_TERMINAL.log('Head', headers);
				BACKGROUND_TERMINAL.log('Body', body);
			BACKGROUND_TERMINAL.groupEnd();

			return debug.body = body;
		})
		.then(body => {
			return fetch(`${ request.url }?apikey=${ request.token }`, debug.requestHeaders = {
				method: 'POST',
				mode: cors(request.url),
				body: JSON.stringify(body),
				headers
			});
		})
		.then(response => response.text())
		.then(data => {
			debug.data =
			data = JSON.parse(data || `{"path":"${ request.StoragePath.replace(/\\/g, '\\\\') }${ request.title } (${ request.year })"}`);

			if(data && data[0] && data[0].errorMessage) {
				sendResponse({
					error: data[0].errorMessage,
					location: `@0B: Push_Sonarr => fetch("${ request.url }", { headers }).then(data => { if })`,
					debug
				});
			} else if(data && data.path) {
				sendResponse({
					success: 'Added to ' + data.path
				});
			} else {
				sendResponse({
					error: 'Unknown error',
					location: `@0B: Push_Sonarr => fetch("${ request.url }", { headers }).then(data => { else })`,
					debug
				});
			}
		})
		.catch(error => {
			sendResponse({
				error: String(error),
				location: `@0B: Push_Sonarr => fetch("${ request.url }", { headers }).catch(error => { sendResponse })`,
				debug
			});
		});
}

/** Medusa - TV Shows **/
function Push_Medusa(request, sendResponse) {
	let headers = {
			'Content-Type': 'application/json',
			'X-Api-Key': request.token,
			...(new Headers(request.basicAuth))
		},
		id = request.tvdbId,
		query = request.title.replace(/\s+/g, '+'),
		debug = { headers, query, request };
			// setup stack trace for debugging

	fetch(debug.url = `${ request.root }internal/searchIndexersForShowName?api_key=${ request.token }&indexerId=0&query=${ query }`)
		.then(response => response.json())
		.catch(error => sendResponse({ error: 'TV Show not found', location: '@0B: Push_Medusa => fetch.then.catch', silent: true }))
		.then(data => {
			data = data.results;

			if(!(data instanceof Array) || !data.length)
				throw new Error('TV Show not found');

			// Monitor, search, and download series ASAP
			let body = data[0].join('|');

			BACKGROUND_TERMINAL.group('Generated URL');
				BACKGROUND_TERMINAL.log('URL', request.url);
				BACKGROUND_TERMINAL.log('Head', headers);
				BACKGROUND_TERMINAL.log('Body', body);
			BACKGROUND_TERMINAL.groupEnd();

			return debug.body = body;
		})
		.then(body => {
			return fetch(`${ request.url }`, debug.requestHeaders = {
				method: 'POST',
				mode: cors(request.url),
				body: JSON.stringify({ id: { tvdb: id } }),
				headers
			});
		})
		.then(response => response.text())
		.then(data => {
			let path = request.StoragePath.replace(/\\?$/, '\\');

			debug.data =
			data = JSON.parse(data || `{"path":"${ path }${ request.title } (${ request.year })"}`);

			if(data && data.error) {
				sendResponse({
					error: data.error,
					location: `@0B: Push_Medusa => fetch("${ request.url }", { headers }).then(data => { if })`,
					debug
				});
			} else if(data && data.id) {
				sendResponse({
					success: `Added to ${ path }${ request.title }(${ request.year })`
				});
			} else {
				sendResponse({
					error: 'Unknown error',
					location: `@0B: Push_Medusa => fetch("${ request.url }", { headers }).then(data => { else })`,
					debug
				});
			}
		})
		.catch(error => {
			sendResponse({
				error: String(error),
				location: `@0B: Push_Medusa => fetch("${ request.url }", { headers }).catch(error => { sendResponse })`,
				debug
			});
		});
}

/** Medusa - TV Shows **/
function addMedusa(request, sendResponse) {
	let headers = {
			'Content-Type': 'application/json',
			'X-Api-Key': request.token,
			...(new Headers(request.basicAuth))
		},
		id = request.tvdbId,
		query = request.title.replace(/\s+/g, '+'),
		debug = { headers, query, request };
			// setup stack trace for debugging

	fetch(debug.url = `${ request.root }internal/searchIndexersForShowName?api_key=${ request.token }&indexerId=0&query=${ query }`)
		.then(response => response.json())
		.catch(error => sendResponse({ error: 'TV Show not found', location: 'addMedusa => fetch.then.catch', silent: true }))
		.then(data => {
			data = data.results;

			if(!(data instanceof Array) || !data.length)
				throw new Error('TV Show not found');

			// Monitor, search, and download series ASAP
			let body = data[0].join('|');

			BACKGROUND_TERMINAL.group('Generated URL');
				BACKGROUND_TERMINAL.log('URL', request.url);
				BACKGROUND_TERMINAL.log('Head', headers);
				BACKGROUND_TERMINAL.log('Body', body);
			BACKGROUND_TERMINAL.groupEnd();

			return debug.body = body;
		})
		.then(body => {
			return fetch(`${ request.url }`, debug.requestHeaders = {
				method: 'POST',
				mode: cors(request.url),
				body: JSON.stringify({ id: { tvdb: id } }),
				headers
			});
		})
		.then(response => response.text())
		.then(data => {
			let path = request.StoragePath.replace(/\\?$/, '\\');

			debug.data =
			data = JSON.parse(data || `{"path":"${ path }${ request.title } (${ request.year })"}`);

			if(data && data.error) {
				sendResponse({
					error: data.error,
					location: `addMedusa => fetch("${ request.url }", { headers }).then(data => { if })`,
					debug
				});
			} else if(data && data.id) {
				sendResponse({
					success: `Added to ${ path }${ request.title }(${ request.year })`
				});
			} else {
				sendResponse({
					error: 'Unknown error',
					location: `addMedusa => fetch("${ request.url }", { headers }).then(data => { else })`,
					debug
				});
			}
		})
		.catch(error => {
			sendResponse({
				error: String(error),
				location: `addMedusa => fetch("${ request.url }", { headers }).catch(error => { sendResponse })`,
				debug
			});
		});
}

/** Sick Beard - TV Shows **/
function Push_SickBeard(request, sendResponse) {
	let headers = {
			'Content-Type': 'application/json',
			'X-Api-Key': request.token,
			...(new Headers(request.basicAuth))
		},
		id = request.tvdbId,
		query = `tvdbid=${ id }`,
		path = (`${ request.StoragePath }\\${ request.title }`).replace(/\\\\/g, '\\'),
		debug = { headers, query, request };
			// setup stack trace for debugging

	fetch(debug.url = `${ request.url }?cmd=sb.searchtvdb&${ query }`)
		.then(response => response.json())
		.catch(error => sendResponse({ error: 'TV Show not found', location: '@0B: Push_SickBeard => fetch.then.catch', silent: true }))
		.then(data => {
			if(!/^success$/i.test(data.result))
				throw new Error('TV Show not found');

			data = data.data.results;

			// Monitor, search, and download series ASAP
			let body = formify({
				tvdbid: id,
				initial: request.QualityID,
				location: encodeURIComponent(path),
				status: 'wanted',
			});

			BACKGROUND_TERMINAL.group('Generated URL');
				BACKGROUND_TERMINAL.log('URL', request.url);
				BACKGROUND_TERMINAL.log('Head', headers);
				BACKGROUND_TERMINAL.log('Body', body);
			BACKGROUND_TERMINAL.groupEnd();

			return debug.body = body;
		})
		.then(async body => {
			await fetch(`${ request.url }?cmd=sb.addrootdir&${ body }`);

			return fetch(`${ request.url }?cmd=show.${ request.exists? 'addexisting': 'addnew' }&${ body }`, debug.requestHeaders = {
				method: 'POST',
				mode: cors(request.url),
				// body: JSON.stringify(body),
				headers
			});
		})
		.then(response => response.text())
		.then(results => {
			debug.data =
			results = JSON.parse(results || `{"data":{},message:"",result:""}`);

			let { data, message, result } = results;

			if(data && !/^success$/i.test(result) && message) {
				sendResponse({
					error: message,
					location: `@0B: Push_SickBeard => fetch("${ request.url }", { headers }).then(results => { if })`,
					debug
				});
			} else if(data && data.path) {
				sendResponse({
					success: `Added to ${ request.StoragePath }${ request.title } (${ request.year })`
				});
			} else {
				sendResponse({
					error: 'Unknown error',
					location: `@0B: Push_SickBeard => fetch("${ request.url }", { headers }).then(results => { else })`,
					debug
				});
			}
		})
		.catch(error => {
			sendResponse({
				error: String(error),
				location: `@0B: Push_SickBeard => fetch("${ request.url }", { headers }).catch(error => { sendResponse })`,
				debug
			});
		});
}

/** Ombi* - TV Shows/Movies **/
function Push_Ombi(request, sendResponse) {
	let headers = {
			'Content-Type': 'application/json',
			'ApiKey': request.token,
			...(new Headers)
		},
		type = request.contentType,
		id = (type == 'movie'? request.tmdbId: request.tvdbId),
		body = ({ [type == 'movie'? 'theMovieDbId': 'theTvDbId']: id }),
		debug = { headers, request };
			// setup stack trace for debugging

	if(request.contentType == 'movie' && (id || null) === null)
		sendResponse({ error: 'Invalid TMDbID', location: '@0B: Push_Ombi => if', silent: true });
	else if((id || null) === null)
		sendResponse({ error: 'Invalid TVDbID', location: '@0B: Push_Ombi => else if', silent: true });

	fetch(debug.url = request.url, {
			method: 'POST',
			mode: cors(request.url),
			body: JSON.stringify(body),
			headers
		})
		.catch(error => sendResponse({ error: `${ type } not found`, location: '@0B: Push_Ombi => fetch.then.catch', silent: true }))
		.then(response => response.text())
		.then(data => {
			debug.data =
			data = JSON.parse(data);

			if(data && data.isError) {
				if(/already +been +requested/i.test(data.errorMessage))
					sendResponse({
						success: 'Already requested on Ombi'
					});
				else
					sendResponse({
						error: data.errorMessage,
						location: `@0B: Push_Ombi => fetch("${ request.url }", { headers }).then(data => { if })`,
						debug
					});
			} else if(data && data.path) {
				sendResponse({
					success: 'Added to Ombi'
				});
			} else {
				sendResponse({
					error: 'Unknown error',
					location: `@0B: Push_Ombi => fetch("${ request.url }", { headers }).then(data => { else })`,
					debug
				});
			}
		})
		.catch(error => {
			sendResponse({
				error: String(error),
				location: `@0B: Push_Ombi => fetch("${ request.url }", { headers }).catch(error => { sendResponse })`,
				debug
			});
		});
}

// Unfortunately the native Promise.race does not work as you would suspect.
// If one promise (Plex request) fails, we still want the other requests to continue racing.
// See https://www.jcore.com/2016/12/18/promise-me-you-wont-use-promise-race/ for an explanation
function PromiseRace(promises) {
	if(!~promises.length) {
		return Promise.reject('Cannot start a race without promises!');
	}

	// There is no way to know which promise is rejected.
	// So we map it to a new promise to return the index when it fails
	let Promises = promises.map((promise, index) =>
		promise.catch(() => {
			throw index;
		})
	);

	return Promise.race(Promises)
		.catch(index => {
			// The promise has rejected, remove it from the list of promises and just continue the race.
			let promise = promises.splice(index, 1)[0];

			promise.catch(error => BACKGROUND_TERMINAL.log(`Plex request #${ index } failed:`, error));
			return PromiseRace(promises);
		});
}

function $Search_Plex(connection, headers, options) {
	let type = options.type || 'movie',
		url = `${ connection.uri }/hubs/search`,
		field = options.field || 'title';

	if(!options.title)
		return {};

	if(/movie|film|cinema|theat[re]{2}/i.test(type))
		type = 'movie';
	else if(/tv|show|series|episode/i.test(type))
		type = 'show';

	// Letterboxd can contain special white-space characters. Plex doesn't like this.
	let title = encodeURIComponent(options.title.replace(/\s+/g, ' ')),
		finalURL = `${ url }?query=${ field }:${ title }`;

	// BACKGROUND_TERMINAL.warn(`Fetching <${ JSON.stringify(headers) } ${ finalURL } >`);
	return fetch(finalURL, { headers })
		.then(response => response.json())
		.then(data => {
			let Hub = data.MediaContainer.Hub.find(hub => hub.type === type);
			// type: actor album artist autotag collection director episode genre movie photo photoalbum place playlist shared show track

			if(!Hub || !Hub.Metadata)
				return { found: false };

			// We only want to search in Plex libraries with the type "Movie", i.e. not the type "Other Videos".
			// Weirdly enough Plex doesn't seem to have an easy way to filter those libraries so we invent our own hack.
			let items = Hub.Metadata.filter(
				meta =>
					meta.Directory ||
					meta.Genre ||
					meta.Country ||
					meta.Role ||
					meta.Writer
			),
				strip = (string) => string.replace(/\W+/g, '').toLowerCase();

			// This is messed up, but Plex's definition of a year is year when it was available,
			// not when it was released (which is Movieo's definition).
			// For examples, see Bone Tomahawk, The Big Short, The Hateful Eight.
			// So we'll first try to find the movie with the given year, and then + 1 it.
			// Added [strip] to prevent mix-ups, see: "Kingsman: The Golden Circle" v. "The Circle"
			let media = items.find(meta => (((meta.year == +options.year) || (meta.year == +options.year + 1)) && strip(meta.title) == strip(options.title))),
				key = null;

			if(!media && options.IMDbID)
				media = items.find(meta => new RegExp('imdb://' + options.IMDbID, 'i').test(meta.guid));

			key = !!media? media.key.replace('/children', ''): key;

			return {
				found: !!media,
				key
			};
		})
		.catch(error => { throw error });
}

async function Search_Plex(request, sendResponse) {
	let { options, serverConfig } = request,
		headers = {
			'X-Plex-Token': serverConfig.token,
			'Accept': 'application/json'
		};

	// Try all Plex connection URLs
	let requests = serverConfig.connections.map(connection =>
		$Search_Plex(connection, headers, options)
	);

	try {
		// See what connection URL finishes the request first and pick that one.
		// TODO: optimally, as soon as the first request is finished, all other requests would be cancelled using AbortController.
		let result = await PromiseRace(requests);

		sendResponse(result);
	} catch (error) {
		sendResponse({ error: String(error), location: '@0B: Search_Plex' });
	}
}

// Chrome is f**king retarted...
// Instead of having an object returned (for the context-menu)
// You have to make API calls on ALL clicks...
browser.contextMenus.onClicked.addListener(item => {
	if(!/^W2P/i.test(item.menuItemId)) return;

	let url = "", dnl = false,
		db = item.menuItemId.slice(-2).toLowerCase(),
		pv = external.ID_PROVIDER.slice(0, 2).toLowerCase(),
		qu = external.ITEM_ID,
		tl = external.SEARCH_TITLE,
		yr = external.ITEM_YEAR,
		tt = external.ITEM_TITLE,
		lt = external.FILE_TITLE,
		ft = external.FILE_TYPE,
		fp = external.FILE_PATH,
		p = (s, r = '+') => s.replace(/-/g, r);

	switch(db) {
		case 'im':
			url = (qu && pv == 'im')?
				`imdb.com/title/${ qu }/`:
			`imdb.com/find?ref_=nv_sr_fn&s=all&q=${ tt }`;
			break;
		case 'tm':
			url = (qu && pv == 'tm')?
				`themoviedb.org/${ external.ITEM_TYPE == 'show'? 'tv': 'movie' }/${ qu }`:
			`themoviedb.org/search?query=${ tt }`;
			break;
		case 'tv':
			url = (qu && pv == 'tv')?
				`thetvdb.com/series/${ tl }#${ qu }`: // TVDb accepts either: a title, or a series number... but only one
			`thetvdb.com/search?q=${ p(tl) }`;
			break;
		case 'xx':
			url = external.SEARCH_PROVIDER == 'VO'?
				`google.com/search?q=${ p(tl) }+site:vumoo.to`:
			external.SEARCH_PROVIDER == 'GX'?
				`gostream.site/?s=${ p(tl) }`:
			`google.com/search?q="${ p(tl, ' ') } ${ yr }"+${ pv }db`;
			break;
		case 'dl':
			dnl = true;
			url = external.ITEM_URL;
			break;
		default: return; break;
	}

	if(!dnl)
		window.open(`https://${ url }`, '_blank');
	else if(dnl)
		// try/catch won't work here, so use the first download's callback as an error catcher
		browser.downloads.download({
			url: item.href,
			filename: `${ fp }${ lt } (${ yr }).${ ft }`,
			saveAs: true
		}, id => {
			if(id === undefined || id === null)
				browser.downloads.download({
					url: item.href,
					saveAs: true
				});
		});
});

browser.runtime.onMessage.addListener((request = {}, sender, callback) => {
	BACKGROUND_TERMINAL.log('From:', sender);

	let item = (request.options || request),
		ITEM_TITLE = item.title,
		ITEM_YEAR = item.year,
		ITEM_TYPE = item.type,
		ID_PROVIDER = (i=>{for(let p in i)if(/^TV(Db)?/i.test(p)&&i[p])return'TVDb';else if(/^TM(Db)?/i.test(p)&&i[p])return'TMDb';return'IMDb'})(item),
		ITEM_URL = (item.href || ''),
		FILE_TYPE = (item.tail || 'mp4'),
		FILE_PATH = (item.path || ''),
		ITEM_ID = ((i, I)=>{for(let p in i)if(RegExp('^'+I,'i').test(p))return i[p]})(item, ID_PROVIDER);

	if(request.type) {
		try {
			switch(request.type) {
				case 'SEARCH_PLEX':
					Search_Plex(request, callback);
					break;

				case 'VIEW_COUCHPOTATO':
					Open_CouchPotato(request, callback);
					break;

				case 'PUSH_COUCHPOTATO':
					Push_CouchPotato(request, callback);
					break;

				case 'PUSH_RADARR':
					Push_Radarr(request, callback);
					break;

				case 'PUSH_SONARR':
					Push_Sonarr(request, callback);
					break;

				case 'PUSH_MEDUSA':
					Push_Medusa(request, callback);
					break;

				case 'PUSH_WATCHER':
					Push_Watcher(request, callback);
					break;

				case 'PUSH_OMBI':
					Push_Ombi(request, callback);
					break;

				case 'PUSH_SICKBEARD':
					Push_SickBeard(request, callback);
					break;

				case 'OPEN_OPTIONS':
					browser.runtime.openOptionsPage();
					break;

				case 'SEARCH_FOR':
					if(ITEM_TITLE && ITEM_TYPE)
						ChangeStatus({ ITEM_ID, ITEM_TITLE, ITEM_TYPE, ID_PROVIDER, ITEM_YEAR, ITEM_URL, FILE_TYPE, FILE_PATH });
					break;

				case 'SAVE_AS':
					browser.contextMenus.update('W2P-DL', {
						title: `Save as "${ ITEM_TITLE } (${ ITEM_YEAR })" (${ FILE_TYPE })`
					});
					break;

				case 'DOWNLOAD_FILE':
					let FILE_TITLE = ITEM_TITLE.replace(/\-/g, ' ').replace(/[\s\:]{2,}/g, ' - ').replace(/[^\w\s\-\']+/g, '');

					// no try/catch, use callback for that
					browser.downloads.download({
						url: item.href,
						filename: `${ FILE_TITLE } (${ ITEM_YEAR }).${ FILE_TYPE }`,
						saveAs: true
					}, id => {
						// Error Occured
						if(id === undefined || id === null)
							browser.downloads.download({
							url: item.href,
							filename: `${ FILE_TITLE } (${ ITEM_YEAR })`,
							saveAs: true
						});
					});
					break;

				case 'UPDATE_CONFIGURATION':
					UpdateConfiguration(true);
					break;

				case 'PLUGIN':
				case 'SCRIPT':
				case '_INIT_':
				case '$INIT$':
				case 'FOUND':
				case 'GRANT_PERMISSION':
					/* These are meant to be handled by plugn.js */
					break;

				default:
					BACKGROUND_TERMINAL.warn(`Unknown background event [${ request.type }]`);
					break;
			}

			return true;
		} catch (error) {
			BACKGROUND_TERMINAL.error(error);
			callback(String(error));
		}
	} else {
		return false;
	}
});

// If background.js is already running, ignore the new state
// otherwise, use the following to start up
if(SessionState === false) {
	SessionState = true;

	__context_parent__ = browser.contextMenus.create({
		id: 'W2P',
		title: 'Web to Plex'
	});

	__context_save_element__ = browser.contextMenus.create({
		id: 'W2P-DL',
		title: 'Nothing to Save'
	});

	// Standard search engines
	for(let array = 'IM TM TV'.split(' '), DL = {}, length = array.length, index = 0, item; index < length; index++)
		browser.contextMenus.create({
			id: 'W2P-' + (item = array[index]),
			parentId: __context_parent__,
			title: `Using ${ item }Db`,
			type: 'checkbox',
			checked: true // implement a way to use the checkboxes?
		});

	// Non-standard search engines
	browser.contextMenus.create({
		id: 'W2P-XX',
		parentId: __context_parent__,
		title: `Using best guess`,
		type: 'checkbox',
		checked: true // implement a way to use the checkboxes?
	});

}

// turn object into URL paramaeters:
// { data: data, ... } => data=data&...
function formify(data) {
	let body = [];
	for(let key in data)
		body.push(`${ key }=${ data[key] }`);
	return body.join('&');
}

if(browser.runtime.lastError)
	BACKGROUND_TERMINAL.warn(`Last known error: ${ browser.runtime.lastError.message }`);
