/* global parseXML */
/* Notes:
	#1: See https://github.com/SpaceK33z/web-to-plex/commit/db01d1a83d32e4d73f2ea671f634e6cc5b4c0fe7
	#2: See https://github.com/SpaceK33z/web-to-plex/commit/27506b9a4c12496bd7aad6ee09deb8a5b9418cac
	#3: See https://github.com/SpaceK33z/web-to-plex/issues/21
	#4: See https://github.com/SpaceK33z/web-to-plex/issues/61
*/

let DEVELOPER_MODE;

if(browser.runtime.lastError)
	/* Always causes errors on *nix machines, so just "poke" the errors here */
	browser.runtime.lastError.message;

// FireFox doesn't support sync storage.
const storage = (browser.storage.sync || browser.storage.local),
		$ = top.$ = (selector, all = false, container = document) => (all? [...container.querySelectorAll(selector)]: container.querySelector(selector)),
		$$ = top.$$ = (selector, all) => (all? [...$('display').querySelectorAll(selector)]: $('display').querySelector(selector)),
		__servers__ = $('[data-option="preferredServer"]'),
		__sickBeard_qualityProfile__  = $(`[data-option="sickBeardQualityProfileId"]`),
		__sickBeard_storagePath__     = $(`[data-option="sickBeardStoragePath"]`),
		__medusa_qualityProfile__     = $(`[data-option="medusaQualityProfileId"]`),
		__medusa_storagePath__        = $(`[data-option="medusaStoragePath"]`),
		__watcher_qualityProfile__    = $(`[data-option="watcherQualityProfileId"]`),
		__watcher_storagePath__       = $(`[data-option="watcherStoragePath"]`),
		__radarr_qualityProfile__     = $(`[data-option="radarrQualityProfileId"]`),
		__radarr_storagePath__        = $(`[data-option="radarrStoragePath"]`),
		__sonarr_qualityProfile__     = $(`[data-option="sonarrQualityProfileId"]`),
		__sonarr_storagePath__        = $(`[data-option="sonarrStoragePath"]`),
		__save__ = $('#save'),
		__options__ = [
			/* Plex Settings */
			'plexURL',
			'plexToken',
			'UseOmbi',
			'preferredServer',

			/* Manager Settings */
			// Ombi
			'usingOmbi',
			'ombiURLRoot',
			'ombiToken',

			// Medusa
			'usingMedusa',
			'medusaURLRoot',
			'medusaToken',
			'medusaBasicAuthUsername',
			'medusaBasicAuthPassword',
			'medusaStoragePath',
			'medusaQualityProfileId',

			// Watcher
			'usingWatcher',
			'watcherURLRoot',
			'watcherToken',
			'watcherBasicAuthUsername',
			'watcherBasicAuthPassword',
			'watcherStoragePath',
			'watcherQualityProfileId',

			// Radarr
			'usingRadarr',
			'radarrURLRoot',
			'radarrToken',
			'radarrBasicAuthUsername',
			'radarrBasicAuthPassword',
			'radarrStoragePath',
			'radarrQualityProfileId',

			// Sonarr
			'usingSonarr',
			'sonarrURLRoot',
			'sonarrToken',
			'sonarrBasicAuthUsername',
			'sonarrBasicAuthPassword',
			'sonarrStoragePath',
			'sonarrQualityProfileId',

			// Sick Beard
			'usingSickBeard',
			'sickBeardURLRoot',
			'sickBeardToken',
			'sickBeardBasicAuthUsername',
			'sickBeardBasicAuthPassword',
			'sickBeardStoragePath',
			'sickBeardQualityProfileId',

			// CouchPotato
			'enableCouchPotato',
			'usingCouchPotato',
			'couchpotatoURLRoot',
			'couchpotatoToken',
			'couchpotatoBasicAuthUsername',
			'couchpotatoBasicAuthPassword',
			// 'couchpotatoQualityProfileId',

			/* Other Settings */
			// Connection settings
			'UseProxy',
			'ProxyURL',
			'ProxyHeaders',

			// Media settings
			'UseAutoGrab',
			'AutoGrabLimit',
			'PromptLocation',
			'PromptQuality',

			// Notification Settings
			'NotifyNewOnly',
			'NotifyOnlyOnce',

			// Search Settings
			'UseLoose',
			'UseLooseScore',
			'ManagerSearch',
			'UseLowCache',

			// Advanced Settings
			'OMDbAPI',
			'TMDbAPI',
			'UseLZW',
			'DeveloperMode',

			// Hidden values
			'watcherQualities',
			'radarrQualities',
			'sonarrQualities',
			'medusaQualities',
			'sickBeardQualities',
			'watcherStoragePaths',
			'radarrStoragePaths',
			'sonarrStoragePaths',
			'medusaStoragePaths',
			'sickBeardStoragePaths',
			'__radarrQuality',
			'__sonarrQuality',
			'__medusaQuality',
			'__sickBeardQuality',
			'__radarrStoragePath',
			'__sonarrStoragePath',
			'__medusaStoragePath',
			'__sickBeardStoragePath',
			'__domains',
			'__caught',
			'__theme',

			// Builtins - End of file, "let builtins ="
			'builtin_allocine',
			'builtin_amazon',
			'builtin_couchpotato',
			'builtin_fandango',
			'builtin_flickmetrix',
			'builtin_google',
			'builtin_googleplay',
			'builtin_hulu',
			'builtin_imdb',
			'builtin_justwatch',
			'builtin_letterboxd',
			// 'builtin_metacritic', // demoted - 01.18.2020 15:10 MST
			'builtin_moviemeter',
			'builtin_movieo',
			'builtin_netflix',
			'builtin_plex',
			'builtin_rottentomatoes',
			'builtin_shanaproject',
			'builtin_showrss',
			'builtin_tmdb',
			'builtin_tvmaze',
			'builtin_tvdb',
			'builtin_trakt',
			'builtin_vrv',
			'builtin_verizon',
			'builtin_vudu',
			'builtin_vumoo',
			'builtin_youtube',
			'builtin_itunes',
			'builtin_gostream',
			'builtin_tubi',
			'builtin_webtoplex',

			// Plugins - End of file, "let plugins ="
			'plugin_toloka',
			// 'plugin_shanaproject', // promoted - 01.18.2020 15:10 MST
			'plugin_myanimelist',
			'plugin_myshows',
			'plugin_indomovie',
			'plugin_redbox',
			'plugin_kitsu',
			'plugin_go',
			'plugin_snagfilms',
			'plugin_freemoviescinema',
			'plugin_foxsearchlight',
			'plugin_metacritic',

			// Theme Settings
			'UseMinions',
			...(() => [...$('[data-option^="theme:"i]', true)].map(e => e.dataset.option))(),

			// Other Settings
			'__defaults',
		];

let PlexServers = [],
	ServerID = null,
	ClientID = null,
	manifest = browser.runtime.getManifest(),
	terminal = // See #3
		(DEVELOPER_MODE = $('[data-option="DeveloperMode"]').checked)?
			console:
		{ error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m };

browser.manifest = manifest;

// Not really important variables
// The "caught" IDs (already asked for in managers)
let __caught = {
	imdb: [],
	tmdb: [],
	tvdb: [],
},
// The theme classes
	__theme = {};

// Icon Markers
let MARKERS = [
	// yes
	`<svg viewBox="0 0 560 560" stroke-miterlimit="1.414" stroke-linejoin="round" class="icon true"><path d="m78.756 298.564l-40 69.282 242.488 140 240-415.692-69.282-40-200 346.41-173.206-100"></path></svg>`,
	// no
	`<svg viewBox="0 0 560 560" stroke-miterlimit="1.414" stroke-linejoin="round" class="icon false"><path d="m280 0c154.536 0 280 125.464 280 280 0 154.536-125.464 280-280 280-154.536 0-280-125.464-280-280 0-154.536 125.464-280 280-280m-40 420c0 22.077 17.923 40 40 40 22.077 0 40-17.923 40-40 0-22.077-17.923-40-40-40-22.077 0-40 17.923-40 40m60-320l-40 0c-11.038 0-20 8.962-20 20l0 200c0 11.038 8.962 20 20 20l40 0c11.038 0 20-8.962 20-20l0-200c0-11.038-8.962-20-20-20"></path></svg>`,
	// maybe
	`<svg viewBox="0 0 560 560" stroke-miterlimit="1.414" stroke-linejoin="round" class="icon maybe"><path d="m280 0c154.536 0 280 125.464 280 280 0 154.536-125.464 280-280 280-154.536 0-280-125.464-280-280 0-154.536 125.464-280 280-280m-40 440c0 22.077 17.923 40 40 40 22.077 0 40-17.923 40-40 0-22.077-17.923-40-40-40-22.077 0-40 17.923-40 40m70-80l0-6.84 0-.179c.011-2.265.168-4.528.482-6.772.586-4.188 1.706-8.299 3.324-12.206 1.56-3.765 3.581-7.337 6.005-10.613 1.378-1.861 2.886-3.622 4.506-5.277 12.286-12.48 24.784-24.75 37.148-37.152 1.253-1.265 2.48-2.554 3.674-3.873 2.298-2.538 4.482-5.178 6.544-7.91 5.64-7.475 10.359-15.64 14.021-24.258 2.605-6.129 4.675-12.484 6.18-18.972 1.516-6.534 2.457-13.201 2.81-19.9.584-11.079-.447-22.237-3.053-33.021-1.591-6.586-3.767-13.03-6.492-19.232-2.728-6.21-6.008-12.176-9.788-17.807-2.756-4.106-5.777-8.033-9.039-11.749-1.655-1.886-3.374-3.715-5.147-5.49-1.412-1.415-2.866-2.79-4.352-4.127-3.068-2.761-6.285-5.356-9.632-7.77-8.915-6.432-18.755-11.571-29.126-15.214-7.849-2.757-15.996-4.658-24.254-5.658-3.049-.369-6.113-.616-9.182-.74-1.423-.057-2.848-.086-4.272-.093-.357 0-.713 0-1.07.002-2.253.018-4.505.094-6.754.241-4.7.306-9.381.901-14.008 1.782-6.09 1.159-12.086 2.813-17.909 4.939-5.594 2.042-11.028 4.519-16.238 7.403-5.852 3.239-11.419 6.99-16.618 11.196-2.576 2.084-5.056 4.282-7.446 6.577-.342.331-.682.663-1.021.996-6.867 6.803-13.671 13.669-20.506 20.504l42.426 42.426 19.985-19.984.136-.137c1.966-1.946 4.07-3.749 6.304-5.381 3.924-2.868 8.23-5.21 12.77-6.946 3.392-1.297 6.913-2.256 10.494-2.859 3.453-.58 6.961-.829 10.461-.742 4.493.111 8.971.778 13.302 1.98 4.678 1.298 9.18 3.219 13.354 5.699 2.604 1.547 5.08 3.31 7.393 5.266 1.182 1 2.318 2.051 3.414 3.144.705.713 1.397 1.438 2.065 2.185 1.35 1.51 2.617 3.095 3.792 4.745 3.921 5.506 6.807 11.735 8.475 18.285 1.377 5.408 1.921 11.022 1.61 16.593-.35 6.263-1.783 12.458-4.219 18.239-1.715 4.068-3.921 7.928-6.559 11.468-1.484 1.993-3.105 3.879-4.843 5.655-12.294 12.486-24.797 24.764-37.169 37.173-1.121 1.131-2.22 2.283-3.292 3.46-2.284 2.506-4.452 5.119-6.494 7.825-5.604 7.427-10.259 15.565-13.819 24.161-3.431 8.283-5.844 16.985-7.167 25.852-.467 3.127-.799 6.275-.995 9.431-.098 1.587-.16 3.175-.192 4.764-.008.455-.013.91-.017 1.365-.012 2.515-.002 5.032-.002 7.546l60 0m8.826-198.747l0-.001c-.011-.01.043.043.032.032l-.032-.031"></path></svg>`
];

MARKERS.yes   = MARKERS[0];
MARKERS.no    = MARKERS[1];
MARKERS.maybe = MARKERS[2];

let RESETTING_SETTINGS = false;

// create and/or queue a notification
// state = "error" - red
// state = "update" - blue
// state = "info" - grey
// anything else for state will show as orange
class Notification {
	constructor(state, text, timeout = 7000, callback = () => {}, requiresClick = true) {
		let queue = (Notification.queue = Notification.queue || { list: [] }),
			last = queue.list[queue.list.length - 1];

		if (last && last.done === false)
			return (last => setTimeout(() => new Notification(state, text, timeout, callback, requiresClick), +(new Date) - last.start))(last);

		let element = document.furnish(`div.notification.${state}`, {
			onclick: event => {
				let notification = Notification.queue[event.target.id],
					element = notification.element;

				notification.done = true;
				Notification.queue.list.splice(notification.index, 1);
				clearTimeout(notification.job);
				element.remove();

				let removed = delete Notification.queue[notification.id];

				return (event.requiresClick)? null: notification.callback(removed);
			}
		}, text);

		queue[element.id = +(new Date)] = {
			start: +element.id,
			stop:  +element.id + timeout,
			span:  +timeout,
			done:  false,
			index: queue.list.length,
			job:   setTimeout(() => element.onclick({ target: element, requiresClick }), timeout),
			id:    +element.id,
			callback, element
		};
		queue.list.push(queue[element.id]);

		document.body.appendChild(element);

		return queue[element.id];
	}
}

class Prompt {
	constructor(type, options, callback = () => {}, container = document.body) {
		let prompt, remove, create,
			array = (options instanceof Array? options: [].slice.call(options)),
			data = [...array];

		switch(type) {
			/* Allows the user to add and remove items from a list */
			case 'prompt':
			case 'input':
				remove = element => {
					let prompter = document.querySelector('.prompt'),
						header = document.querySelector('.prompt-header'),
						counter = document.querySelector('.prompt-options');

					if(element === true)
						return prompter.remove();
					else
						element.remove();

					data.splice(+element.value, 1, null);
					header.innerText = 'Approve ' + counter.children.length + (counter.children.length == 1?' item': ' items');
				};

				prompt = document.furnish('div.prompt', {},
					document.furnish('div.prompt-body', {},
						// The prompt's title
						document.furnish('h1.prompt-header', {}, 'Approve ' + array.length + (array.length == 1? ' item': ' items')),

						// The prompt's items
						document.furnish('div.prompt-options', {},
							...(create = ITEMS => {
								let elements = [];

								for(let index = 0, length = ITEMS.length, ITEM; index < length; index++)
									ITEM = ITEMS[index],
									elements.push(
										document.furnish('li.prompt-option.mutable', { value: index },
											JSON.stringify(ITEM),
											document.furnish('button', { title: 'Remove', onclick: event => { remove(event.target.parentElement); event.target.remove() } })
										)
									);

								return elements
							})(array)
						),

						// The engagers
						document.furnish('div.prompt-footer', {},
							document.furnish('input.prompt-input[type=text]', { placeholder: 'Add an item (enter to add)', onkeydown: event => {
								let self = event.target;

								if (event.keyCode === 13) {
									event.preventDefault();
									remove(true);

									let value = self.value;

									try {
										value = JSON.parse(value);
									} catch(error) {
										/* Suppress input errors */
									}

									new Prompt(type, [value, ...data.filter(value => value !== null && value !== undefined)], callback, container);
								}
							} }),
							document.furnish('button.prompt-decline', { onclick: event => { remove(true); callback([]) } }, 'Close'),
							document.furnish('button.prompt-accept', { onclick: event => { remove(true); new Prompt(type, options, callback, container) } }, 'Reset'),
							document.furnish('button.prompt-accept', { onclick: event => { remove(true); callback(data.filter(value => value !== null && value !== undefined)) } }, 'Continue')
						)
					)
				);
				break;

			/* Allows the user to remove predetermined items */
			case 'select':
				remove = element => {
					let prompter = document.querySelector('.prompt'),
						header = document.querySelector('.prompt-header'),
						counter = document.querySelector('.prompt-options');

					if(element === true)
						return prompter.remove();
					else
						element.remove();

					data.splice(+element.value, 1, null);
					header.innerText = 'Approve ' + counter.children.length + (counter.children.length == 1?' item': ' items');
				};

				prompt = document.furnish('div.prompt', {},
					document.furnish('div.prompt-body', {},
						// The prompt's title
						document.furnish('h1.prompt-header', {}, 'Approve ' + array.length + (array.length == 1? ' item': ' items')),

						// The prompt's items
						document.furnish('div.prompt-options', {},
							...(create = ITEMS => {
								let elements = [];

								for(let index = 0, length = ITEMS.length, ITEM; index < length; index++)
									ITEM = ITEMS[index],
									elements.push(
										document.furnish('li.prompt-option.mutable', { value: index },
											JSON.stringify(ITEM),
											document.furnish('button', { title: 'Remove', onclick: event => { remove(event.target.parentElement); event.target.remove() } })
										)
									);

								return elements
							})(array)
						),

						// The engagers
						document.furnish('div.prompt-footer', {},
							document.furnish('button.prompt-decline', { onclick: event => { remove(true); callback([]) } }, 'Close'),
							document.furnish('button.prompt-accept', { onclick: event => { remove(true); new Prompt(type, options, callback, container) } }, 'Reset'),
							document.furnish('button.prompt-accept', { onclick: event => { remove(true); callback(data.filter(value => value !== null && value !== undefined)) } }, 'Continue')
						)
					)
				);
				break;

			default:
				return terminal.warn(`Unknown prompt type "${ type }"`);
				break;
		}

		return container.append(prompt), prompt;
	}
}

function TLDHost(host) {
	return host.replace(/^(ww\w+|\w{2})\./, '');
}

function addListener(element, eventName, callback = event => {}) {
	eventName = eventName.replace(/^(on)?/, 'on');
	callback = callback.toString().replace(/;+$/g, '');

	let event = element.getAttribute(eventName);

	if(event && event.length)
		event = `${ event }; ${ callback }`;
	else
		event = callback;

	element[eventName] = eval(event);
}

function traverse(element, until, siblings = false) {
	let elements;

	if(siblings) {
		if(element instanceof Array || element instanceof NodeList) {
			for(elements = [...element], element = elements[0]; until(element) === false && element;)
				if(element.previousElementSibling)
					element = element.previousElementSibling;
				else
					elements.splice(0, 1),
					element = elements[0];
		} else {
			while(until(element) === false && element)
				element = element.previousElementSibling || element.parentElement;
		}
	}

	if(element instanceof Array || element instanceof NodeList) {
		for(element = [...element]; until(element[0]) === false && element.length; element.splice(0, 1))
			continue;
		element = element[0];
	} else {
		while(until(element) === false && element)
			element = element.parentElement;
	}

	return element;
}

function LoadingAnimation(state = false) {
	$('display').setAttribute('loading', state);
}

function load(name, decompress_data = false) {
	let options = JSON.stringify(getOptionValues()),
		data;

	name = btoa(name);
	data = localStorage.getItem(name);

	if(decompress_data)
		data = iBWT(unzip(decompress(data)));

	return JSON.parse(data);
}

function save(name, data, compress_data = false) {
	let options = JSON.stringify(getOptionValues());

	name = btoa(name);
	data = JSON.stringify(data);

	if(compress_data)
		data = compress(zip(BWT(data)));

	return localStorage.setItem(name, data);
}

function getServers(plexToken) {
	return fetch('https://plex.tv/api/resources?includeHttps=1', {
		headers: {
			'X-Plex-Token': plexToken
		}
	})
	.then(response => response.text())
	.then(xml => {
		let data = parseXML(xml);

		if(/^\s*Invalid/i.test(data))
			return null;

		return data.Device.filter(device => !!~device.provides.split(',').indexOf('server'));
	});
}

/* See #1 */
function tryPlexLogin(username, password) {
	let hash = btoa(`${username}:${password}`);

	return fetch(`https://plex.tv/users/sign_in.json`, {
		method: 'POST',
		headers: {
			'X-Plex-Product': 'Web to Plex',
			'X-Plex-Version': manifest.version,
			'X-Plex-Client-Identifier': ClientID,
			'Authorization': `Basic ${ hash }`
		}
	})
	.then(response => response.json());
}

function performPlexLogin({ event }) {
	let u = $('#plex_username').value,
		p = $('#plex_password').value,
		s = $('#plex_test_status');

	s.title = '';
	__servers__.innerHTML = '';
	__save__.disabled = true;
	__save__.innerHTML = 'Save ' + MARKERS.maybe;
	LoadingAnimation(true);

	tryPlexLogin(u, p)
		.then(response => {
			LoadingAnimation();

			if(response.error)
				return s.title = 'Invalid login information', null;

			if(response.user) {
				let t = $('#plex_token');

				ClientID = t.value = t.textContent = response.user.authToken;

				return performPlexTest({});
			}
		})
		.catch(error => { LoadingAnimation(); new Notification('error', error); __save__.innerHTML = 'Save ' + MARKERS.no; });

}

function performPlexTest({ ServerID, event }) {
	let plexToken = $('#plex_token').value,
		teststatus = $('#plex_test_status'),
		inusestatus = [...$('[using="plex"]', true)];

	__save__.disabled = true;
	__save__.innerHTML = 'Save ' + MARKERS.maybe;
	__servers__.innerHTML = '';
	teststatus.innerHTML = MARKERS.maybe;
	inusestatus.map(e => e.setAttribute('in-use', false));
	LoadingAnimation(true);

	getServers(plexToken).then((servers = []) => {
		LoadingAnimation();

		PlexServers = servers;
		teststatus.innerHTML = MARKERS[+!servers];
		inusestatus.map(e => e.setAttribute('in-use', false));

		if(!servers)
			return teststatus.title = 'Failed to communicate with Plex', teststatus.classList = false;
		inusestatus.map(e => e.setAttribute('in-use', true));

		__save__.disabled = false;
		__save__.innerHTML = 'Save ' + MARKERS.yes;
		teststatus.classList = true;

		(servers = [{ sourceTitle: 'GitHub', clientIdentifier: '', name: 'No Server', notice: 'This will not connect to any Plex servers' }, ...servers]).forEach(server => {
			let $option = document.createElement('option'),
				source = server.sourceTitle;

			$option.value = server.clientIdentifier;
			$option.textContent = `${ server.name }${ source ? ` \u2014 ${ source }` : '' }`;
			$option.title = server.notice || (source? `"${ server.sourceTitle }" owns this server`: '');
			__servers__.appendChild($option);
		});

		if(ServerID) {
			__servers__.value = ServerID;
		}
	})
	.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no; __save__.innerHTML = 'Save ' + MARKERS.no; });
}

function getPlexConnections(server) {
	// `server.Connection` can be an array or object.
	let connections = [];

	if(server.Connection instanceof Array)
		connections = server.Connection;
 	else
		connections = [server.Connection];

	return connections.map(connection => ({
		uri: connection.uri,
		local: connection.local === '1'
	}));
}

function getOptionValues() {
	let options = {};

	__options__.forEach(option => {
		let element = $(`[data-option="${ option }"]`);

		if(element) {
			if(element.type == 'checkbox')
				options[option] = element.checked;
			else
				options[option] = element.value;
		}
	});

	let COM = options.UseLZW,
		DEF = options.__defaults == 'true',
		CHT = $('[data-option="__caught"i]'),
		THM = $('[data-option="__theme"i]');

	for(let key in __caught)
		__caught[key] = __caught[key].filter(id => id).slice(0, (COM? 200: 100)).sort();

	if(THM.value)
		__theme = JSON.parse(THM.value);
	//
	// __theme = __theme.filter(v => v);

	let _c = JSON.stringify(__caught),
		_t = JSON.stringify(__theme);

	CHT.value = options.__caught = (COM? compress(zip(BWT(_c))): _c);
	THM.value = options.__theme = (COM? compress(zip(BWT(_t))): _t);

	return options;
}

function performOmbiLogin({ event }) {
	let l = $('#ombi_url').value,
		a = $('#ombi_api').value,
		s = $('#plex_test_status'),
		e = ($0, $1, $$, $_) => ($1 + (/\\/.test($_)? '\\': '/'));

	l = l
		.replace(/([^\\\/])$/, e)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');
	s.title = '';
	__servers__.innerHTML = '';
	__save__.disabled = true;
	__save__.innerHTML = 'Save ' + MARKERS.maybe;
	LoadingAnimation(true);

	let APIURL = `${ l }api/v1/`,
		headers = { headers: { apikey: a, accept: 'application/json' } };

	fetch(`${ APIURL }Settings/plex`, headers)
		.then( response => response.json() )
		.then( json => {
			/* Get Plex's details first. If it's disabled, or non-existent, then exit */
			/* Swagger API says "enable", but we'll go with "enabled" */
			if(json && (json.enable || json.enabled)) {
				let t = $('#plex_token'),
					u = $('[data-option="UseOmbi"]'),
					s = __servers__;

				json = (json && json.servers.length? json.servers[0]: {});

				let name  = json.name,              // people friendly server name
					token = json.plexAuthToken,     // the auth token
					uuid  = json.machineIdentifier, // the machine ID
					url   = json.ip;                // the Plex URL used

				url = url.replace(/(?:[^\/]+\/\/)?([^\/]+)\/?/, `http${ json.ssl? 's': '' }://$1:${ json.port }/`);

				ClientID = t.value = t.textContent = token;
				ServerID = s.value = uuid;
				s.innerHTML = `<option value="${ uuid }">${ name }</option>`;

				/* Now we can fill in the other details */
				if(u.checked) {
					// Ombi
					let L = $('[data-option="ombiURLRoot"]'),
						A = $('[data-option="ombiToken"]');

					L.value = L.textContent = l;
					A.value = A.textContent = a;

					new Notification('update', 'Filled in Ombi', 3000);

					// CouchPotato
					fetch(`${ APIURL }Settings/CouchPotato`, headers)
						.then( data => data.json() )
						.then( json => {
							LoadingAnimation();
							if(!json || (!json.enabled && !json.enable)) return;

							let k = $('[data-option="couchpotatoToken"]'),
								K = $('[data-option="couchpotatoURLRoot"]');

							k.value = k.textContent = json.apiKey;
							K.value = K.textContent = json.ip.replace(/(?:[^\/]+\/\/)?([^\/]+)\/?/, `http${ json.ssl? 's': '' }://$1:${ json.port }/`);

							new Notification('update', 'Filled in CouchPotato', 3000);
						} )
						.catch( error => { new Notification('error', 'Error getting CouchPotato details from Ombi'); throw error } );

					// Radarr
					fetch(`${ APIURL }Settings/radarr`, headers)
						.then( data => data.json() )
						.then( json => {
							LoadingAnimation();
							if(!json || (!json.enabled && !json.enable)) return;

							let k = $('[data-option="radarrToken"]'),
								K = $('[data-option="radarrURLRoot"]'),
								q = $('[data-option="radarrQualityProfileId"]'),
								Q = $('[data-option="radarrStoragePath"]'),
								_q, _Q;

							k.value = k.textContent = json.apiKey;
							K.value = K.textContent = json.ip.replace(/(?:[^\/]+\/\/)?([^\/]+)\/?/, `http${ json.ssl? 's': '' }://$1:${ json.port }/`);
							q.value = _q = json.defaultQualityProfile;
							Q.value = _Q = json.defaultRootPath;

							q.innerHTML = `<option value="${ _q }">[Ombi]: ${ _q }</option>`;
							Q.innerHTML = `<option value="${ _Q }">[Ombi]: ${ _Q }</option>`;

							new Notification('update', 'Filled in Radarr', 3000);
						} )
						.catch( error => { new Notification('error', 'Error getting Radarr details from Ombi'); throw error } );

					// Sonarr
					fetch(`${ APIURL }Settings/sonarr`, headers)
						.then( data => data.json() )
						.then( json => {
							LoadingAnimation();
							if(!json || (!json.enabled && !json.enable)) return;

							let k = $('[data-option="sonarrToken"]'),
								K = $('[data-option="sonarrURLRoot"]'),
								q = $('[data-option="sonarrQualityProfileId"]'),
								Q = $('[data-option="sonarrStoragePath"]'),
								_q, _Q;

							k.value = k.textContent = json.apiKey;
							K.value = K.textContent = json.ip.replace(/(?:[^\/]+\/\/)?([^\/]+)\/?/, `http${ json.ssl? 's': '' }://$1:${ json.port }/`);
							q.value = _q = json.qualityProfile;
							Q.value = _Q = json.rootPath;

							q.innerHTML = `<option value="${ _q }">[Ombi]: ${ _q }</option>`;
							Q.innerHTML = `<option value="${ _Q }">[Ombi]: ${ _Q }</option>`;

							new Notification('update', 'Filled in Sonarr', 3000);
						} )
						.catch( error => { new Notification('error', 'Error getting Sonarr details from Ombi'); throw error } );
				}

				__save__.disabled = false;
				__save__.innerHTML = 'Save ' + MARKERS.yes;
			} else {
				/* Plex either doesn't exist, or is disabled */
				new Notification('error', 'Error getting Plex details from Ombi');
				__save__.innerHTML = 'Save ' + MARKERS.no;
			}
		} )
		.catch(error => { LoadingAnimation(); new Notification('error', error); __save__.innerHTML = 'Save ' + MARKERS.no; });
}

function performOmbiTest({ refreshing = false, event }) {
	let options = getOptionValues(),
		teststatus = $('#ombi_test_status'),
		path = $('[data-option="ombiURLRoot"]'),
		url,
		headers = { headers: { apikey: options.ombiToken, accept: 'text/html' } },
		enabled = refreshing? $('#using-ombi'): $$('#using-ombi'),
		inusestatus = [...$('[using="ombi"]', true)];

	teststatus.innerHTML = MARKERS.maybe;
	options.ombiURLRoot = url = path.value = options.ombiURLRoot.replace(/^(\:\d+)/, 'localhost$1').replace(/^(?!^http(s)?:)/, 'http$1://').replace(/\/+$/, '');
	inusestatus.map(e => e.setAttribute('in-use', false));
	LoadingAnimation(true);

	let Get = () => {
		try {
			fetch(`${ url }/api/v1/Request/movie`)
				.then(r => r.json())
				.then(json => {
					json.map(item => {
						__caught.imdb.push(item.imdbId);
						__caught.tmdb.push(item.theMovieDbId);
					});
				})
				.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no; });

			fetch(`${ url }/api/v1/Request/tv`)
				.then(r => r.json())
				.then(json => {
					json.map(item => {
						__caught.imdb.push(item.imdbId);
						__caught.tvdb.push(item.tvDbId);
					});

					fetch(`${ url }/api/v1/Status`, headers)
						.then( response => response.text() )
						.then( status => {
							LoadingAnimation();
							if (!status || !status.length) throw new Error('Unable to communicate with Ombi');

							if ((status = +status) >= 200 && status < 400) {
								teststatus.innerHTML = MARKERS.yes;
								enabled.checked = teststatus.classList = true;
								enabled.parentElement.removeAttribute('disabled');
								inusestatus.map(e => e.setAttribute('in-use', true));
							} else {
								teststatus.innerHTML = MARKERS.no;
								enabled.checked = teststatus.classList = false;
								enabled.parentElement.setAttribute('disabled');
								inusestatus.map(e => e.setAttribute('in-use', false));

								throw new Error(`Ombi error [${ status }]`);
							}
						} )
						.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no; });
				})
				.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no; });
		} catch(error) {
			LoadingAnimation();

			throw error;
		}
	}

	if(refreshing)
		Get();
	else if(url && url.length)
		requestURLPermissions(url + '/*', allowed =>
			(allowed)?
				Get():
			new Notification('error', 'The user refused permission to access Ombi')
		);
}

function getWatcher(options, api = "getconfig") {
	if(!options.watcherToken)
		return new Notification('error', 'Invalid Watcher token');

	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.watcherToken
	};

	if(options.watcherBasicAuthUsername)
		headers.Authorization = `Basic ${ btoa(`${ options.watcherBasicAuthUsername }:${ options.watcherBasicAuthPassword }`) }`;

	return fetch(`${ options.watcherURLRoot }/api/?apikey=${ options.watcherToken }&mode=${ api }&quality=${ options.watcherQualityProfileId || 'Default' }`, { headers })
		.then(response => response.json())
		.catch(error => {
			return new Notification('error', 'Watcher failed to connect with error:' + String(error)),
				[];
		});
}

function performWatcherTest({ QualityProfileID = 'Default', refreshing = false, event }) {
	let options = getOptionValues(),
		teststatus = $('#watcher_test_status'),
		path = $('[data-option="watcherURLRoot"]'),
		storagepath = __watcher_storagePath__,
		quality = __watcher_qualityProfile__,
		url,
		enabled = refreshing? $('#using-watcher'): $$('#using-watcher'),
		inusestatus = [...$('[using="watcher"]', true)];

	quality.innerHTML = '';
	teststatus.innerHTML = MARKERS.maybe;
	storagepath.value = '[Empty]';
	options.watcherURLRoot = url = path.value = options.watcherURLRoot.replace(/^(\:\d+)/, 'localhost$1').replace(/^(?!^http(s)?:)/, 'http$1://').replace(/\/+$/, '');
	inusestatus.map(e => e.setAttribute('in-use', false));
	LoadingAnimation(true);

	let Get = () => {
		try {
			getWatcher(options, 'liststatus').then(list => {
				list.map(item => {
					__caught.imdb.push(item.movies.imdbid);
					__caught.tmdb.push(item.movies.tmdbid);
				});
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });

			getWatcher(options, 'getconfig').then(configuration => {
				LoadingAnimation();
				if(!configuration || !configuration.response) return new Notification('error', 'Failed to get Watcher configuration');

				let names = configuration.config.Quality.Profiles,
					path = configuration.config.Postprocessing.moverpath,
					syntax = path.replace(/\/([\w\s\/\\\{\}]+)$/, '$1'),
					profiles = [];

				path = path.replace(syntax, '');

				for(let name in names)
					profiles.push({
						id: name,
						name
					});

				teststatus.innerHTML = MARKERS[+!(teststatus.classList = enabled.checked = !!profiles.length)];
				inusestatus.map(e => e.setAttribute('in-use', enabled.checked));

				if(!profiles.length)
					return teststatus.title = 'Failed to communicate with Watcher';
				enabled.parentElement.removeAttribute('disabled');

				let qualities = [];
				profiles.forEach(profile => {
					let option = document.createElement('option');
					let { id, name } = profile;

					option.value = id;
					option.textContent = name;
					qualities.push({ id, name });
					quality.appendChild(option);
				});

				$('[data-option="watcherQualities"i]').value = JSON.stringify(qualities);

				// Because the <select> was reset, the original value is lost.
				if(QualityProfileID)
					quality.value = QualityProfileID;

				storagepath.value = path || '[Default Location]';

				$('[data-option="watcherStoragePaths"i]').value = JSON.stringify(path || { path: '[Default Location]', id: 0 });
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });
		} catch(error) {
			LoadingAnimation();
			new Notification('error', error);
		}
	}

	if(refreshing)
		Get();
	else if(url && url.length)
		requestURLPermissions(url + '/*', allowed =>
			(allowed)?
				Get():
			new Notification('error', 'The user refused permission to access Watcher')
		);
}

function getRadarr(options, api = "profile") {
	if(!options.radarrToken)
		return new Notification('error', 'Invalid Radarr token');

	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.radarrToken
	};

	if(options.radarrBasicAuthUsername)
		headers.Authorization = `Basic ${ btoa(`${ options.radarrBasicAuthUsername }:${ options.radarrBasicAuthPassword }`) }`;

	return fetch(`${ options.radarrURLRoot }/api/${ api }`, { headers })
		.then(response => response.json())
		.catch(error => {
			return new Notification('error', 'Radarr failed to connect with error:' + String(error)),
				[];
		});
}

function performRadarrTest({ QualityProfileID, StoragePath, refreshing = false, event }) {
	let options = getOptionValues(),
		teststatus = $('#radarr_test_status'),
		path = $('[data-option="radarrURLRoot"]'),
		storagepath = __radarr_storagePath__,
		quality = __radarr_qualityProfile__,
		url,
		enabled = refreshing? $('#using-radarr'): $$('#using-radarr'),
		inusestatus = [...$('[using="radarr"]', true)];

	quality.innerHTML = '';
	teststatus.innerHTML = MARKERS.maybe;
	storagepath.textContent = '';
	options.radarrURLRoot = url = path.value = options.radarrURLRoot.replace(/^(\:\d+)/, 'localhost$1').replace(/^(?!^http(s)?:)/, 'http$1://').replace(/\/+$/, '');
	inusestatus.map(e => e.setAttribute('in-use', false));
	LoadingAnimation(true);

	let Get = () => {
		try {
			getRadarr(options, 'movie').then(movies => {
				movies.map(movie => {
					__caught.imdb.push(movie.imdbId);
					__caught.tmdb.push(movie.tmdbId);
				});
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });

			getRadarr(options, 'profile').then(profiles => {
				LoadingAnimation();
				if(!profiles) return new Notification('error', 'Failed to get Radarr configuration');

				teststatus.innerHTML = MARKERS[+!(teststatus.classList = enabled.checked = !!profiles.length)];
				inusestatus.map(e => e.setAttribute('in-use', enabled.checked));

				if(!profiles.length)
					return teststatus.title = 'Failed to communicate with Radarr';
				enabled.parentElement.removeAttribute('disabled');

				let qualities = [];
				profiles.forEach(profile => {
					let option = document.createElement('option');
					let { id, name } = profile;

					option.value = id;
					option.textContent = name;
					qualities.push({ id, name });
					quality.appendChild(option);
				});

				$('[data-option="radarrQualities"i]').value = JSON.stringify(qualities);

				// Because the <select> was reset, the original value is lost.
				if(QualityProfileID)
					$('[data-option="__radarrQuality"i]').value = quality.value = QualityProfileID;
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });

			let StoragePaths = [];
			getRadarr(options, 'rootfolder').then(storagepaths => {
				storagepaths.forEach(path => {
					let option = document.createElement('option');

					StoragePaths.push((option.value = option.textContent = path.path).replace(/\\/g, '/'));
					storagepath.appendChild(option);
				});

				$('[data-option="radarrStoragePaths"i]').value = JSON.stringify(storagepaths);

				// Because the <select> was reset, the original value is lost.
				if(StoragePath) {
					storagepath.value = StoragePath;
					$('[data-option="__radarrStoragePath"i]').value = StoragePaths.indexOf(StoragePath.replace(/\\/g, '/')) + 1;
				}
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });
		} catch(error) {
			LoadingAnimation();
			new Notification('error', error);
		}
	};

	if(refreshing)
		Get();
	else if(url && url.length)
		requestURLPermissions(url + '/*', allowed =>
			(allowed)?
				Get():
			new Notification('error', 'The user refused permission to access Radarr')
		);
}

function getSonarr(options, api = "profile") {
	if(!options.sonarrToken)
		return new Notification('error', 'Invalid Sonarr token');

	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.sonarrToken
	};

	if(options.sonarrBasicAuthUsername)
		headers.Authorization = `Basic ${ btoa(`${ options.sonarrBasicAuthUsername }:${ options.sonarrBasicAuthPassword }`) }`;

	return fetch(`${ options.sonarrURLRoot }/api/${ api }`, { headers })
		.then(response => response.json())
		.catch(error => {
			return new Notification('error', 'Sonarr failed to connect with error:' + String(error)),
				[];
		});
}

function performSonarrTest({ QualityProfileID, StoragePath, refreshing = false, event }) {
	let options = getOptionValues(),
		teststatus = $('#sonarr_test_status'),
		path = $('[data-option="sonarrURLRoot"]'),
		storagepath = __sonarr_storagePath__,
		quality = __sonarr_qualityProfile__,
		url,
		enabled = refreshing? $('#using-sonarr'): $$('#using-sonarr'),
		inusestatus = [...$('[using="sonarr"]', true)];

	quality.innerHTML = '';
	teststatus.innerHTML = MARKERS.maybe;
	storagepath.textContent = '';
	options.sonarrURLRoot = url = path.value = options.sonarrURLRoot.replace(/^(\:\d+)/, 'localhost$1').replace(/^(?!^http(s)?:)/, 'http$1://').replace(/\/+$/, '');
	inusestatus.map(e => e.setAttribute('in-use', false));
	LoadingAnimation(true);

	let Get = () => {
		try {
			getSonarr(options, 'series').then(shows => {
				shows.map(show => {
					__caught.tvdb.push(show.tvdbId);
				});
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });

			getSonarr(options, 'profile').then(profiles => {
				LoadingAnimation();
				if(!profiles) return new Notification('error', 'Failed to get Sonarr configuration');

				teststatus.innerHTML = MARKERS[+!(teststatus.classList = enabled.checked = !!profiles.length)];
				inusestatus.map(e => e.setAttribute('in-use', enabled.checked));

				if(!profiles.length)
					return teststatus.title = 'Failed to communicate with Sonarr';
				enabled.parentElement.removeAttribute('disabled');

				let qualities = [];
				profiles.forEach(profile => {
					let option = document.createElement('option');
					let { id, name } = profile;

					option.value = id;
					option.textContent = name;
					qualities.push({ id, name });
					quality.appendChild(option);
				});

				$('[data-option="sonarrQualities"i]').value = JSON.stringify(qualities);

				// Because the <select> was reset, the original value is lost.
				if(QualityProfileID)
					$('[data-option="__sonarrQuality"i]').value = quality.value = QualityProfileID;
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });

			let StoragePaths = [];
			getSonarr(options, 'rootfolder').then(storagepaths => {
				storagepaths.forEach(path => {
					let option = document.createElement('option');

					StoragePaths.push((option.value = option.textContent = path.path).replace(/\\/g, '/'));
					storagepath.appendChild(option);
				});

				$('[data-option="sonarrStoragePaths"i]').value = JSON.stringify(storagepaths);

				// Because the <select> was reset, the original value is lost.
				if(StoragePath) {
					storagepath.value = StoragePath;
					$('[data-option="__sonarrStoragePath"i]').value = StoragePaths.indexOf(StoragePath.replace(/\\/g, '/')) + 1;
				}
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });
		} catch(error) {
			LoadingAnimation();
			new Notification('error', error);
		}
	};

	if(refreshing)
		Get();
	else if(url && url.length)
		requestURLPermissions(url + '/*', allowed =>
			(allowed)?
				Get():
			new Notification('error', 'The user refused permission to access Sonarr')
		);
}

function getMedusa(options, api = 'config') {
	if(!options.medusaToken)
		return new Notification('error', 'Invalid Medusa token');

	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.medusaToken
	};

	if(options.medusaBasicAuthUsername)
		headers.Authorization = `Basic ${ btoa(`${ options.medusaBasicAuthUsername }:${ options.medusaBasicAuthPassword }`) }`;

	return fetch(`${ options.medusaURLRoot }/api/v2/${ api }`, { headers })
		.then(response => response.json())
		.catch(error => {
			return new Notification('error', 'Medusa failed to connect with error:' + String(error)),
				[];
		});
}

function performMedusaTest({ QualityProfileID, StoragePath, refreshing = false, event }) {
	let options = getOptionValues(),
		teststatus = $('#medusa_test_status'),
		path = $('[data-option="medusaURLRoot"]'),
		storagepath = __medusa_storagePath__,
		quality = __medusa_qualityProfile__,
		url,
		enabled = refreshing? $('#using-medusa'): $$('#using-medusa'),
		inusestatus = [...$('[using="medusa"]', true)];

	quality.innerHTML = '';
	teststatus.innerHTML = MARKERS.maybe;
	storagepath.textContent = '';
	options.medusaURLRoot = url = path.value = options.medusaURLRoot.replace(/^(\:\d+)/, 'localhost$1').replace(/^(?!^http(s)?:)/, 'http$1://').replace(/\/+$/, '');
	inusestatus.map(e => e.setAttribute('in-use', false));
	LoadingAnimation(true);

	let Get = () => {
		try {
			getMedusa(options, 'series').then(shows => {
				shows.map(show => {
					__caught.imdb.push(show.id.imdb)
					__caught.tvdb.push(show.id.tvdb);
				});
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });

			getMedusa(options, 'config').then(configuration => {
				LoadingAnimation();
				if(!configuration) return new Notification('error', 'Failed to get Medusa configuration');

				let { qualities } = configuration.consts,
					profileType = $('[data-option="medusaQualityProfileType"i]').selectedIndex,
					profiles = (profileType == 0? 'presets': profileType == 1? 'values': 'anySets');

				profiles = qualities[profiles];

				teststatus.innerHTML = MARKERS[+!(teststatus.classList = enabled.checked = !!profiles.length)];
				inusestatus.map(e => e.setAttribute('in-use', enabled.checked));

				if(!profiles.length)
					return teststatus.title = 'Failed to communicate with Medusa';
				enabled.parentElement.removeAttribute('disabled');

				profiles.forEach(profile => {
					let option = document.createElement('option');
					let { value, name } = profile;

					option.value = value;
					option.textContent = name;
					quality.appendChild(option);
				});

				$('[data-option="medusaQualities"i]').value = JSON.stringify(profiles);

				// Because the <select> was reset, the original value is lost.
				if(QualityProfileID)
					$('[data-option="__medusaQuality"i]').value = quality.value = QualityProfileID;
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });

			let StoragePaths = [];
			getMedusa(options, 'config').then(configuration => {
				let storagepaths = configuration.main.rootDirs.filter(d => d.length > 1);

				if(storagepaths.length < 1) return new Notification('error', 'Medusa has no usable storage paths');

				storagepaths.forEach(path => {
					let option = document.createElement('option');

					StoragePaths.push((option.value = option.textContent = path).replace(/\\/g, '/').replace(/\/+$/, ''));
					storagepath.appendChild(option);
				});

				$('[data-option="medusaStoragePaths"i]').value = JSON.stringify(storagepaths.map(path => ({ path, id: path })));

				// Because the <select> was reset, the original value is lost.
				if(StoragePath) {
					$('[data-option="__medusaStoragePath"i]').value = StoragePath;
					storagepath.selectedIndex = StoragePaths.indexOf(StoragePath.replace(/\\/g, '/').replace(/\/+$/, ''));
				}
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });
		} catch(error) {
			LoadingAnimation();
			new Notification('error', error);
		}
	};

	if(refreshing)
		Get();
	else if(url && url.length)
		requestURLPermissions(url + '/*', allowed =>
			(allowed)?
				Get():
			new Notification('error', 'The user refused permission to access Medusa')
		);
}

function getSickBeard(options, api = 'sb') {
	if(!options.sickBeardToken)
		return new Notification('error', 'Invalid Sick Beard token');

	let headers = {
		'Accept': 'application/json',
		'Content-Type': 'application/json',
		'X-Api-Key': options.sickBeardToken, // not really used, but just in case...
	};

	if(options.sickBeardBasicAuthUsername)
		headers.Authorization = `Basic ${ btoa(`${ options.sickBeardBasicAuthUsername }:${ options.sickBeardBasicAuthPassword }`) }`;

	return fetch(`${ options.sickBeardURLRoot }/api/${ options.sickBeardToken }/?cmd=${ api }`, { headers })
		.then(response => response.json())
		.catch(error => {
			return new Notification('error', 'Sick Beard failed to connect with error:' + String(error)),
				[];
		});
}

function performSickBeardTest({ QualityProfileID, StoragePath, refreshing = false, event }) {
	let options = getOptionValues(),
		teststatus = $('#sickBeard_test_status'),
		path = $('[data-option="sickBeardURLRoot"]'),
		storagepath = __sickBeard_storagePath__,
		quality = __sickBeard_qualityProfile__,
		url,
		enabled = refreshing? $('#using-sickBeard'): $$('#using-sickBeard'),
		inusestatus = [...$('[using="sickbeard"]', true)];

	quality.innerHTML = '';
	teststatus.innerHTML = MARKERS.maybe;
	storagepath.textContent = '';
	options.sickBeardURLRoot = url = path.value = options.sickBeardURLRoot.replace(/^(\:\d+)/, 'localhost$1').replace(/^(?!^http(s)?:)/, 'http$1://').replace(/\/+$/, '');
	inusestatus.map(e => e.setAttribute('in-use', false));
	LoadingAnimation(true);

	let Get = () => {
		try {
			getSickBeard(options, 'shows').then(shows => {
				let _shows = shows.data;

				shows = [];

				for(let _show in _shows)
					shows.push(_shows[_show]);

				shows.map(show => {
					__caught.tvdb.push(show.tvdbid);
				});
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });

			getSickBeard(options, 'sb.getdefaults').then(configuration => {
				LoadingAnimation();
				if(!configuration) return new Notification('error', 'Failed to get Sick Beard configuration');

				let qualities = configuration.data,
					profileType = $('[data-option="sickBeardQualityProfileType"i]').selectedIndex,
					profiles = (profileType == 0? 'initial': 'archive');

				profiles = qualities[profiles];

				teststatus.innerHTML = MARKERS[+!(teststatus.classList = enabled.checked = !!profiles.length)];
				inusestatus.map(e => e.setAttribute('in-use', enabled.checked));

				if(!profiles.length)
					return teststatus.title = 'Failed to communicate with Sick Beard';
				enabled.parentElement.removeAttribute('disabled');

				profiles = profiles.map((profile, index, array) => {
					let option = document.createElement('option');
					let name = profile;

					option.value = option.textContent = name;
					quality.appendChild(option);

					return { id: name, name };
				});

				$('[data-option="sickBeardQualities"i]').value = JSON.stringify(profiles);

				// Because the <select> was reset, the original value is lost.
				if(QualityProfileID)
					$('[data-option="__sickBeardQuality"i]').value = quality.value = QualityProfileID;
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });

			let StoragePaths = [];
			getSickBeard(options, 'sb.getrootdirs').then(configuration => {
				let storagepaths = configuration.data.filter(d => +d.valid > 0);

				if(storagepaths.length < 1) return new Notification('error', 'Sick Beard has no usable storage paths');

				storagepaths = storagepaths.map(path => {
					let option = document.createElement('option');

					StoragePaths.push((path = option.value = option.textContent = path.location).replace(/\\/g, '/').replace(/\/+$/, ''));
					storagepath.appendChild(option);

					return path;
				});

				$('[data-option="sickBeardStoragePaths"i]').value = JSON.stringify(storagepaths.map((path, index, array) => ({ path, id: index })));

				// Because the <select> was reset, the original value is lost.
				if(StoragePath) {
					$('[data-option="__sickBeardStoragePath"i]').value =
					storagepath.selectedIndex = StoragePaths.indexOf(StoragePath.replace(/\\/g, '/').replace(/\/+$/, ''));
				}
			})
			.catch(error => { LoadingAnimation(); new Notification('error', error); teststatus.innerHTML = MARKERS.no });
		} catch(error) {
			LoadingAnimation();
			new Notification('error', error);
		}
	};

	if(refreshing)
		Get();
	else if(url && url.length)
		requestURLPermissions(url + '/*', allowed =>
			(allowed)?
				Get():
			new Notification('error', 'The user refused permission to access Sick Beard')
		);
}

function enableCouchPotato() {
	$('#enable-couchpotato', true).forEach(e => e.setAttribute('disabled', ''));
	$('#using-couchpotato', true).forEach(e => e.parentElement.removeAttribute('disabled'));
}

function HandleProxySettings(data) {
	let { UseProxy, ProxyURL, ProxyHeaders } = data,
		R = RegExp;

	/* "All" secure URI schemes */
	if(UseProxy && ProxyURL && !/^(aaas|https|msrps|sftp|smtp|shttp|sips|ssh|wss)\:\/\//i.test(ProxyURL))
		throw new Notification('error', `Insecure URI scheme '${ ProxyURL.replace(/^(\w*?)(?:\:\/\/)/, '$1') }' detected. Please use a secure scheme.`);

	return {
		enabled: UseProxy,
		url: ProxyURL,
		headers: ProxyHeaders,
	};
}

function HandleProxyHeaders(Headers = "", URL = "") {
	let headers = {},
		R = RegExp;

	Headers.replace(/^[ \t]*([^\=\s]+)[ \t]*=[ \t]*((["'`])(?:[^\\\3]*|\\.)\3|[^\f\n\r\v]*)/gm, ($0, $1, $2, $3, $$, $_) => {
		let string = !!$3;

		if(string) {
			headers[$1] = $2.replace(RegExp(`^${ $3 }|${ $3 }$`, 'g'), '');
		} else {
			$2 = $2.replace(/@([\w\.]+)/g, (_0, _1, _$, __) => {
				let property = top;

				for(let path of _1.split('.'))
					if(/^(\w+)\(\s*\)$/.test(path))
						property = property[R.$1]();
					else
						property = property[path];

				headers[$1] = property;
			})
			.replace(/@\{b(ase-?)?64-url\}/gi, btoa(URL))
			.replace(/@\{enc(ode)?-url\}/gi, encodeURIComponent(URL))
			.replace(/@\{(raw-)?url\}/gi, URL);

			headers[$1] = $2;
		}
	});

	return headers;
}

function saveOptions() {
	if(RESETTING_SETTINGS)
		return saveOptionsWhileResetting();

	ServerID = [...__servers__.selectedOptions][0];

	if(!ServerID || !ServerID.value) {
		let withoutplex = confirm('Continue without a Plex server?');

		if(withoutplex)
			return saveOptionsWithoutPlex();
		else
			return new Notification('error', 'Select a server!');
	}
	ServerID = ServerID.value;

	let server = PlexServers.find(ID => ID.clientIdentifier === ServerID);

	// This should never happen, but can be useful for debugging.
	if(!server)
		return new Notification('error', `Could not find Plex server ${ ServerID }`),
			null;

	terminal.log('Selected server information:', server);

	// Important detail: we get the token from the selected server, NOT the token the user has entered before.
	let serverToken = server.accessToken,
		serverConnections = getPlexConnections(server);
	ClientID = server.clientIdentifier;

	if(!serverConnections.length)
		return new Notification('error', 'Could not locate Plex server URL'),
			null;
	terminal.log('Plex Server connections:', serverConnections);

	// With a "user token" you can access multiple servers. A "normal" token is just for one server.
	let options = getOptionValues(),
		endingSlash = ($0, $1, $$, $_) => ($1 + (/\\/.test($_)? '\\': '/'));

	options.IGNORE_PLEX = false;

	let r, R = 'Radarr',
		s, S = 'Sonarr',
		w, W = 'Watcher',
		c, C = 'CouchPotato',
		o, O = 'Ombi',
		m, M = 'Medusa',
		i, I = 'Sick Beard';

	let who = () => (r? R: s? S: w? W: c? C: o? O: m? M: i? I: 'manager');

	// Instead of having the user be so wordy, complete the URL ourselves here
	if((r = !options.radarrURLRoot && options.radarrToken) || (s = !options.sonarrURLRoot && options.sonarrToken) || (w = !options.watcherURLRoot && options.watcherToken) || (o = !options.ombiURLRoot && options.ombiToken) || (m = !options.medusaURLRoot && options.medusaToken) || (i = !options.sickBeardURLRoot && options.sickBeardToken)) {
		return new Notification('error', `Please enter a valid URL for ${ who() }`),
			null;
	} if((r = options.radarrURLRoot && !options.radarrStoragePath) && (s = options.sonarrURLRoot && !options.sonarrStoragePath) && (m = options.medusaURLRoot && !options.medusaStoragePath) && (i = options.sickBeardURLRoot && !options.sickBeardStoragePath)) {
		return new Notification('error', `Please enter a valid storage path for ${ who() }`),
			null;
	} if(options.watcherURLRoot && !options.watcherQualityProfileId) {
		return new Notification('error', 'Select a quality profile for Watcher'),
			null;
	} if(options.radarrURLRoot && !options.radarrQualityProfileId) {
		return new Notification('error', 'Select a quality profile for Radarr'),
			null;
	} if(options.sonarrURLRoot && !options.sonarrQualityProfileId) {
		return new Notification('error', 'Select a quality profile for Sonarr'),
			null;
	} if(options.medusaURLRoot && !options.medusaQualityProfileId) {
		return new Notification('error', 'Select a quality profile for Medusa'),
			null;
	} if(options.sickBeardURLRoot && !options.sickBeardQualityProfileId) {
		return new Notification('error', 'Select a quality profile for Sick Beard'),
			null;
	} if(!ClientID) {
		ClientID = window.crypto.getRandomValues(new Uint32Array(5))
			.join('-');
	}
	new Notification('update', 'Saving...', 1500);
	LoadingAnimation(true);
	storage.set({ ClientID });

	options.plexURL = options.plexURLRoot = (options.plexURL || "https://app.plex.tv/")
		.replace(/^(\:\d+)/, 'localhost$1')
		.replace(/([^\\\/])$/, endingSlash)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

	options.ombiURLRoot = (options.ombiURLRoot || "")
		.replace(/([^\\\/])$/, endingSlash)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

	options.medusaURLRoot = (options.medusaURLRoot || "")
		.replace(/([^\\\/])$/, endingSlash)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

	options.watcherURLRoot = (options.watcherURLRoot || "")
		.replace(/([^\\\/])$/, endingSlash)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

	options.radarrURLRoot = (options.radarrURLRoot || "")
		.replace(/([^\\\/])$/, endingSlash)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

	options.sonarrURLRoot = (options.sonarrURLRoot || "")
		.replace(/([^\\\/])$/, endingSlash)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

	options.sickBeardURLRoot = (options.sickBeardURLRoot || "")
		.replace(/([^\\\/])$/, endingSlash)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

	options.radarrStoragePath = options.radarrStoragePath
		.replace(/([^\\\/])$/, endingSlash);

	options.sonarrStoragePath = options.sonarrStoragePath
		.replace(/([^\\\/])$/, endingSlash);

	options.medusaStoragePath = options.medusaStoragePath
		.replace(/([^\\\/])$/, endingSlash);

	options.sickBeardStoragePath = options.sickBeardStoragePath
		.replace(/([^\\\/])$/, endingSlash);

	// icons for the popup page
	for(let index = 0, array = 'plex ombi medusa watcher radarr sonarr couchpotato sickBeard'.split(' '), item = save('URLs', array); index < array.length; index++)
		save(`${ item = array[index] }.url`, options[`${ item }URLRoot`]);

	// Dynamically asking permissions
	requestURLPermissions(options.couchpotatoURLRoot);
	requestURLPermissions(options.watcherURLRoot);
	requestURLPermissions(options.radarrURLRoot);
	requestURLPermissions(options.sonarrURLRoot);
	requestURLPermissions(options.medusaURLRoot);
	requestURLPermissions(options.ombiURLRoot);
	requestURLPermissions(options.sickBeardURLRoot);

	// Handle the proxy settings
	options.proxy = HandleProxySettings(options);

	function OptionsSavedMessage() {
		// Update status to let the user know the options were saved
		new Notification('update', 'Saved', 1500);
	}

	let data = {
		...options,
		servers: [
			{
				id: ClientID,
				token: serverToken,
				connections: serverConnections
			},
		]
	};

	save('builtin', []);
	save('plugin', []);
	for(let option in options)
		option.replace(/^(builtin|plugin)_(\w+)$/i, ($0, $1, $2, $$, $_) =>
			(!$1)?
				null:
			save($1, [...(load($1) || []), `${ $2 }:${ options[option] }`])
		);

	storage.set(data, () => {
		LoadingAnimation();

		if(browser.runtime.lastError) {
			new Notification('error', 'Error with saving: ' + browser.runtime.lastError.message);
			storage.set(data, OptionsSavedMessage);
		} else {
			terminal.log('Saved Options: ', options);
			OptionsSavedMessage();
		}

		browser.runtime.sendMessage({
			type: 'UPDATE_CONFIGURATION',
			options,
		}).then(response => {
			if(response === undefined) {
				console.warn(`Update response (UPDATE_CONFIGURATION): Invalid response...`, { response, options });
			} else {
				console.log(`Update response (UPDATE_CONFIGURATION):`, { response, options });
			}
		});
	});
}

function saveOptionsWithoutPlex() {
	if(RESETTING_SETTINGS)
		return saveOptionsWhileResetting();

	// See #4
	let options = getOptionValues(),
		endingSlash = ($0, $1, $$, $_) => ($1 + (/\\/.test($_)? '\\': '/'));

	options.IGNORE_PLEX = true;

	let r, R = 'Radarr',
		s, S = 'Sonarr',
		w, W = 'Watcher',
		c, C = 'CouchPotato',
		o, O = 'Ombi',
		m, M = 'Medusa',
		i, I = 'Sick Beard';

	let who = () => (r? R: s? S: w? W: c? C: o? O: m? M: i? I: 'manager');

	// Instead of having the user be so wordy, complete the URL ourselves here
	if((r = !options.radarrURLRoot && options.radarrToken) || (s = !options.sonarrURLRoot && options.sonarrToken) || (w = !options.watcherURLRoot && options.watcherToken) || (o = !options.ombiURLRoot && options.ombiToken) || (m = !options.medusaURLRoot && options.medusaToken) || (i = !options.sickBeardURLRoot && options.sickBeardToken)) {
		return new Notification('error', `Please enter a valid URL for ${ who() }`),
			null;
	} if((r = options.radarrURLRoot && !options.radarrStoragePath) && (s = options.sonarrURLRoot && !options.sonarrStoragePath) && (m = options.medusaURLRoot && !options.medusaStoragePath) && (i = options.sickBeardURLRoot && !options.sickBeardStoragePath)) {
		return new Notification('error', `Please enter a valid storage path for ${ who() }`),
			null;
	} if(options.watcherURLRoot && !options.watcherQualityProfileId) {
		return new Notification('error', 'Select a quality profile for Watcher'),
			null;
	} if(options.radarrURLRoot && !options.radarrQualityProfileId) {
		return new Notification('error', 'Select a quality profile for Radarr'),
			null;
	} if(options.sonarrURLRoot && !options.sonarrQualityProfileId) {
		return new Notification('error', 'Select a quality profile for Sonarr'),
			null;
	} if(options.medusaURLRoot && !options.medusaQualityProfileId) {
		return new Notification('error', 'Select a quality profile for Medusa'),
			null;
	} if(options.sickBeardURLRoot && !options.sickBeardQualityProfileId) {
		return new Notification('error', 'Select a quality profile for Sick Beard'),
			null;
	} if(!ClientID) {
		ClientID = 'web-to-plex:client';
		storage.set({ ClientID });
	}
	new Notification('update', 'Saving...', 1500);

	// Still need to set this
	options.plexURL = options.plexURLRoot = "https://webtoplex.github.io/web/no.server/";

	options.ombiURLRoot = (options.ombiURLRoot || "")
		.replace(/([^\\\/])$/, endingSlash)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

	options.medusaURLRoot = (options.medusaURLRoot || "")
		.replace(/([^\\\/])$/, endingSlash)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

	options.watcherURLRoot = (options.watcherURLRoot || "")
		.replace(/([^\\\/])$/, endingSlash)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

	options.radarrURLRoot = (options.radarrURLRoot || "")
		.replace(/([^\\\/])$/, endingSlash)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

	options.sonarrURLRoot = (options.sonarrURLRoot || "")
		.replace(/([^\\\/])$/, endingSlash)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

	options.sickBeardURLRoot = (options.sickBeardURLRoot || "")
		.replace(/([^\\\/])$/, endingSlash)
		.replace(/^(?!^http(s)?:\/\/)(.+)/, 'http$1://$2');

	options.radarrStoragePath = options.radarrStoragePath
		.replace(/([^\\\/])$/, endingSlash);

	options.sonarrStoragePath = options.sonarrStoragePath
		.replace(/([^\\\/])$/, endingSlash);

	options.medusaStoragePath = options.medusaStoragePath
		.replace(/([^\\\/])$/, endingSlash);

	options.sickBeardStoragePath = options.sickBeardStoragePath
		.replace(/([^\\\/])$/, endingSlash);

	// icons for the popup page
	for(let index = 0, array = 'ombi medusa watcher radarr sonarr couchpotato sickBeard'.split(' '), item = save('URLs', array); index < array.length; index++)
		save(`${ item = array[index] }.url`, options[`${ item }URLRoot`]);

	// Dynamically asking permissions
	requestURLPermissions(options.couchpotatoURLRoot);
	requestURLPermissions(options.watcherURLRoot);
	requestURLPermissions(options.radarrURLRoot);
	requestURLPermissions(options.sonarrURLRoot);
	requestURLPermissions(options.medusaURLRoot);
	requestURLPermissions(options.ombiURLRoot);
	requestURLPermissions(options.sickBeardURLRoot);

	// Handle the proxy settings
	options.proxy = HandleProxySettings(options);

	function OptionsSavedMessage() {
		// Update status to let the user know the options were saved
		new Notification('update', 'Saved', 1500);
	}

	let data = options;

	LoadingAnimation(true);

	save('builtin', []);
	save('plugin', []);
	for(let option in options)
		option.replace(/^(builtin|plugin)_(\w+)$/i, ($0, $1, $2, $$, $_) =>
			(!$1)?
				null:
			save($1, [...(load($1) || []), `${ $2 }:${ options[option] }`])
		);

	storage.set(data, () => {
		LoadingAnimation();

		if(browser.runtime.lastError) {
			new Notification('error', 'Error with saving: ' + browser.runtime.lastError.message);
			storage.set(data, OptionsSavedMessage);
		} else {
			terminal.log('Saved Options: ', options);
			OptionsSavedMessage();
		}

		browser.runtime.sendMessage({
			type: 'UPDATE_CONFIGURATION',
			options,
		}).then(response => {
			if(response === undefined) {
				console.warn(`Update response (UPDATE_CONFIGURATION): Invalid response...`, { response, options });
			} else {
				console.log(`Update response (UPDATE_CONFIGURATION):`, { response, options });
			}
		});
	});
}

function saveOptionsWhileResetting() {
	LoadingAnimation(true);

	let options = getOptionValues();

	storage.set(options, () => {
		LoadingAnimation();

		if(browser.runtime.lastError) {
			new Notification('error', 'Error with saving: ' + browser.runtime.lastError.message);
			storage.set(data, OptionsSavedMessage);
		} else {
			terminal.log('Saved Options: ', options);
			OptionsSavedMessage();
		}

		browser.runtime.sendMessage({
			type: 'UPDATE_CONFIGURATION',
			options,
		}).then(response => {
			if(response === undefined) {
				console.warn(`Update response (UPDATE_CONFIGURATION): Invalid response...`, { response, options });
			} else {
				console.log(`Update response (UPDATE_CONFIGURATION):`, { response, options });
			}
		});
	});
}

function requestURLPermissions(url, callback) {
	if(url && callback)
		return callback(true);
	else if(url)
		return true;
	else
		return false;

	/* DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE */
	/* DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE */
	/* DEAD CODE - DEAD CODE - BANANA 🍌 - DEAD CODE - DEAD CODE */
	/* DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE */
	/* DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE - DEAD CODE */

	/* Obsolete, but may be useful later? */
	if(!url || /^https?\:\/\/\*/i.test(url))
		return;

	// TODO: Firefox doesn't have support for the chrome.permissions API.
	if(browser.permissions) {
		// When asking permissions the URL needs to have a trailing slash.
		browser.permissions.request({ origins: [`${ url }`] }, callback);
	}
}

// Restores select box and checkbox state using the preferences
// stored in browser.storage.*
function restoreOptions(OPTIONS) {
	function setOptions(items) {
		if(!items) return;

		__options__.forEach(option => {
			let el = $(`[data-option="${ option }"]`);

			if(!el) return;

			if(el.type == 'checkbox')
				el.checked = items[option];
			else
				el.value = items[option] || '';

			if(el.value !== '' && !el.disabled) {
				if(el.type == 'checkbox')
					el.setAttribute('save', el.checked);
				else if(el.type == 'range')
					el.setAttribute('save', el.value),
					el.oninput({ target: el });
				else if(/password$/i.test(option))
					el.setAttribute('type', el.type = 'password');
				else if(/^code-/.test(el.getAttribute('type')))
					el.innerHTML = el.value;
				else
					el.placeholder = `Last save: ${ el.value }`,
					el.title = `Double-click to restore value ("${ el.value }")`,
					el.setAttribute('save', el.value),
					el.ondblclick = event => el.value = el.getAttribute('save');
			}
		});

		let refreshing = true;

		if(items.plexToken)
			performPlexTest({ ServerID: items.servers? items.servers[0].id: null });
		if(items.watcherURLRoot)
			performWatcherTest({ QualityProfileID: items.watcherQualityProfileId, refreshing });
		if(items.ombiURLRoot)
			performOmbiTest({ refreshing });
		if(items.medusaURLRoot)
			performMedusaTest({ QualityProfileID: items.medusaQualityProfileId, StoragePath: items.medusaStoragePath, refreshing });
		if(items.radarrURLRoot)
			performRadarrTest({ QualityProfileID: items.radarrQualityProfileId, StoragePath: items.radarrStoragePath, refreshing });
		if(items.sonarrURLRoot)
			performSonarrTest({ QualityProfileID: items.sonarrQualityProfileId, StoragePath: items.sonarrStoragePath, refreshing });
		if(items.sickBeardURLRoot)
			performSickBeardTest({ QualityProfileID: items.sickBeardQualityProfileId, StoragePath: items.sickBeardStoragePath, refreshing });
		if(items.couchpotatoURLRoot)
			enableCouchPotato();

		let __domains = (sites => {
			let array = [];

			for(let site in sites)
				array.push(site);

			return array;
		})({ ...builtin_sites, ...plugin_sites });

		$('[data-option="__domains"i]').value = __domains;
		$('[data-option="__defaults"i]').value = 'false';
	}

	if (OPTIONS && typeof OPTIONS == 'string') {
		OPTIONS = JSON.parse(OPTIONS);

		setOptions(OPTIONS);
	} else {
		storage.get(null, items => {
			// Sigh... This is a workaround for Firefox; newer versions have support for the `chrome.storage.sync` API,
			// BUT, it will throw an error if you haven't enabled it...
			if(browser.runtime.lastError)
				storage.get(null, setOptions);
			else
				setOptions(items);
		});
	}

	setTimeout(() => {
		$('.checkbox:not([disabled]) input:not([disabled])', true)
			.forEach((element, index, array) => {
				let options = getOptionValues(),
					name = element.dataset.option;

				if(!name || options[name] === undefined || options[name] === null)
					return;

				element.checked = options[name];
			})
	}, 250);
}

// Helpers
document.furnish = function furnish(name, attributes = {}, ...children) {
	let u = v => v && v.length, R = RegExp;

	if( !u(name) )
		throw TypeError(`TAGNAME cannot be ${ (name === '')? 'empty': name }`);

	let options = attributes.is === true? { is: true }: null;

	delete attributes.is;

	name = name.split(/([#\.][^#\.\[\]]+)/).filter( u );

	if(name.length <= 1)
		name = name[0].split(/^([^\[\]]+)(\[.+\])/).filter( u );

	if(name.length > 1)
		for(let n = name, i = 1, l = n.length, t, v; i < l; i++)
			if((v = n[i].slice(1, n[i].length)) && (t = n[i][0]) == '#')
				attributes.id = v;
			else if(t == '.')
				attributes.classList = [].slice.call(attributes.classList || []).concat(v);
			else if(/\[(.+)\]/.test(n[i]))
				R.$1.split('][').forEach(N => attributes[(N = N.split('=', 2))[0]] = N[1] || '');
	name = name[0];

	let element = document.createElement(name, options);

	if(attributes.classList instanceof Array)
		attributes.classList = attributes.classList.join(' ');

	Object.entries(attributes).forEach(
		([name, value]) => (/^(on|(?:inner|outer)(?:HTML|Text)|textContent|class(?:List|Name)$|value)/.test(name))?
				element[name] = value:
			element.setAttribute(name, value)
	);

	children
		.filter( child => child !== undefined && child !== null )
		.forEach(
			child =>
				child instanceof Element?
					element.append(child):
				child instanceof Node?
					element.appendChild(child):
				element.appendChild(document.createTextNode(child))
		);

	return element;
};

// Default sites and their links
let builtins = {
	"Netflix": "https://netflix.com/",
	"Verizon": "https://tv.verizon.com/",
	"Trakt": "https://trakt.tv/",
	"YouTube": "https://youtube.com/",
	"Rotten Tomatoes": "https://rottentomatoes.com/",
	"Fandango": "https://www.fandango.com/",
	"Amazon": "https://www.amazon.com/Amazon-Video/s/browse/ref=web_to_plex?node=2858778011",
	"IMDb": "https://imdb.com/",
	"Couch Potato": "http://couchpotato.life/",
	"VRV": "https://vrv.co/",
	"TMDb": "https://themoviedb.org/",
	"Letterboxd": "https://letterboxd.com/",
	"Hulu": "https://hulu.com/",
	"Flickmetrix": "https://flickmetrix.com/",
	"TVDb": "https://thetvdb.com/",
	"ShowRSS": "https://showrss.info/",
	"Vudu": "https://vudu.com/",
	"Movieo": "https://movieo.me/",
	"Vumoo": "https://vumoo.to/",
	"TV Maze": "https://tvmaze.com/",
	"Google Play": "https://play.google.com/store/movies",
	"Google": "https://google.com/",
	"iTunes": "https://itunes.apple.com/",
	"JustWatch": "https://justwatch.com/",
	"MovieMeter": "https://moviemeter.nl/",
	"GoStream": "https://gostream.site/",
	"Tubi": "https://tubitv.com/",
	"Web to Plex": ["https://webtoplex.github.io/web/", "https://ephellon.github.io/web.to.plex/"],
	"Allocine": "https://allocine.fr/",
	"Plex": "https://app.plex.tv/",
	"Shana Project": "https://www.shanaproject.com/",

	// Dont' forget to add to the __options__ array!
}, builtin_array = [], builtin_sites = {}, builtinElement = $('#builtin');

for(let builtin in builtins)
	builtin_array.push(builtin);
builtin_array = builtin_array.sort((a,b) => { let [x, y] = [a, b].map(v => v.toLowerCase()); return x < y? -1: 1; });

for(let index = 0, length = builtin_array.length; builtinElement && index < length; index++) {
	let builtin = builtins[builtin_array[index]];

	if(builtin instanceof Array) {
		for(let i = 0, l = builtin.length; i < l; i++) {
			let title = builtin_array[index],
				name  = 'builtin_' + title.toLowerCase().replace(/\s+/g, ''),
				url   = new URL(builtin[i]),
				js    = name.replace(/^builtin_/i, ''),
				o     = url.origin,
				r     = TLDHost(url.host);

			builtin_sites[r] = o;

			if(!i)
				builtinElement.innerHTML +=
`
<h3>${ title }</h3>
<div class="checkbox">
	<input id="${ name }" type="checkbox" data-option="${ name }" pid="${ r }" js="${ js }" checked default="true">
	<label for="${ name }"></label>
</div>
<div>
	Run on <a href="${ url.href }" title="${ r }" target="_blank">${ title }</a>
</div>

<hr>
`;
		}
	} else {
		let title = builtin_array[index],
			name  = 'builtin_' + title.toLowerCase().replace(/\s+/g, ''),
			url   = new URL(builtins[title]),
			js    = name.replace(/^builtin_/i, ''),
			o     = url.origin,
			r     = TLDHost(url.host);

		builtin_sites[r] = o;

		builtinElement.innerHTML +=
`
<h3>${ title }</h3>
<div class="checkbox">
	<input id="${ name }" type="checkbox" data-option="${ name }" bid="${ r }" js="${ js }" checked default="true">
	<label for="${ name }"></label>
</div>
<div>
	Run on <a href="${ url.href }" title="${ r }" target="_blank">${ title }</a>
</div>

<hr>
`;
	}

	// save(`permission:${ r }`, true);
	// save(`script:${ r }`, js);
	// save(`builtin:${ r }`, true);
}

save('builtin.sites', builtin_sites);

$('[id^="builtin_"]', true)
	.forEach(element => addListener(element, 'click', event => {
		let self = traverse(event.target, element => /^builtin_/.test(element.id), true),
			bid = self.getAttribute('bid'),
			js = self.getAttribute('js');

		if(self.checked) {
			terminal.log(bid, builtin_sites[bid]);
			requestURLPermissions(builtin_sites[bid].replace(/https?:\/\/(ww\w+\.)?/i, '*://*.').replace(/\/?$/, '/*'), granted => {
				save(`permission:${ bid }`, granted);
				save(`script:${ bid }`, granted? js: null);
			});
		} else {
			save(`permission:${ bid }`, false);
			save(`script:${ bid }`, null);
		}

		Recall.CountEnabledSites();

		save(`builtin:${ bid }`, true);
	})
);

addListener($('#all-builtin'), 'click', event => {
	let self = traverse(event.target, element => element == $('#all-builtin'), true),
		checked = self.checked;

	$(`[id^="builtin"]${ checked? ':not(:checked)': ':checked' }`, true)
		.forEach(element => element.checked = checked);

	Recall.CountEnabledSites();
});

// Plugins and their links
let plugins = {
	'Indomovie': ['https://indomovietv.club/', 'https://indomovietv.org/', 'https://indomovietv.net/'],
	'Toloka': 'https://toloka.to/',
	'My Anime List': 'https://myanimelist.net/',
	'My Shows': 'https://myshows.me/',
	'Redbox': 'https://www.redbox.com/',
	'Kitsu': 'https://kitsu.io/',
	'Go': 'https://freeform.go.com/',
	'SnagFilms': 'http://snagfilms.com/',
	'Free Movies Cinema': 'https://freemoviescinema.com/',
	'Fox Searchlight': 'http://foxsearchlight.com/',
	'Metacritic': 'https://www.metacritic.com/',

	// Don't forget to add to the __options__ array!
}, plugin_array = [], plugin_sites = {}, pluginElement = $('#plugins');

for(let plugin in plugins)
	plugin_array.push(plugin);
plugin_array = plugin_array.sort((a,b) => { let [x, y] = [a, b].map(v => v.toLowerCase()); return x < y? -1: 1; });

for(let index = 0, length = plugin_array.length; pluginElement && index < length; index++) {
	let plugin = plugins[plugin_array[index]];

	if(plugin instanceof Array) {
		for(let i = 0, l = plugin.length; i < l; i++) {
			let title = plugin_array[index],
				name  = 'plugin_' + title.toLowerCase().replace(/\s+/g, ''),
				url   = new URL(plugin[i]),
				js    = name.replace(/^plugin_/i, ''),
				o     = url.origin,
				r     = TLDHost(url.host);

			plugin_sites[r] = o;

			if(!i)
				pluginElement.innerHTML +=
`
<h3>${ title }</h3>
<div class="checkbox">
	<input id="${ name }" type="checkbox" data-option="${ name }" pid="${ r }" js="${ js }" default>
	<label for="${ name }"></label>
</div>
<div>
	Run on <a href="${ url.href }" title="${ r }" target="_blank">${ title }</a>
</div>

<hr>
`;
		}
	} else {
		let title = plugin_array[index],
			name  = 'plugin_' + title.toLowerCase().replace(/\s+/g, ''),
			url   = new URL(plugins[title]),
			js    = name.replace(/^plugin_/i, ''),
			o     = url.origin,
			r     = TLDHost(url.host);

		plugin_sites[r] = o;

		pluginElement.innerHTML +=
`
<h3>${ title }</h3>
<div class="checkbox">
	<input id="${ name }" type="checkbox" data-option="${ name }" pid="${ r }" js="${ js }" default>
	<label for="${ name }"></label>
</div>
<div>
	Run on <a href="${ url.href }" title="${ r }" target="_blank">${ title }</a>
</div>

<hr>
`;
	}
}

save('optional.sites', plugin_sites);

$('[id^="plugin_"]', true)
	.forEach(element => addListener(element, 'click', event => {
		let self = traverse(event.target, element => /^plugin_/.test(element.id), true),
			pid = self.getAttribute('pid'),
			js = self.getAttribute('js');

		if(self.checked) {
			terminal.log(pid, plugin_sites[pid]);
			requestURLPermissions(plugin_sites[pid].replace(/https?:\/\/(ww\w+\.)?/i, '*://*.').replace(/\/?$/, '/*'), granted => {
				save(`permission:${ pid }`, granted);
				save(`script:${ pid }`, granted? js: null);
			});
		} else {
			save(`permission:${ pid }`, false);
			save(`script:${ pid }`, null);
		}

		Recall.CountEnabledSites();

		save(`builtin:${ pid }`, false);
	})
);

addListener($('#all-plugin'), 'click', event => {
	let self = traverse(event.target, element => element == $('#all-plugin'), true),
		checked = self.checked;

	$(`[id^="plugin"]${ checked? ':not(:checked)': ':checked' }`, true)
		.forEach(element => element.checked = checked);

	Recall.CountEnabledSites();
});

let empty = () => {};

document.addEventListener('DOMContentLoaded', restoreOptions);
__save__.addEventListener('click', saveOptions);

addListener($('#plex_test'), 'mouseup', event => {
	let pt = $('#plex_token').value,
		pu = $('#plex_username').value,
		pp = $('#plex_password').value,
		ou = $('#ombi_url').value,
		oa = $('#ombi_api').value;

	if(pt)
		performPlexTest({ ServerID, event });
	else if(pu && pp)
		performPlexLogin({ event });
	else if(ou && oa)
		performOmbiLogin({ event });
});
$('#watcher_test', true).forEach(element => addListener(element, 'mouseup', event => performWatcherTest({ event })));
$('#radarr_test', true).forEach(element => addListener(element, 'mouseup', event => performRadarrTest({ event })));
$('#sonarr_test', true).forEach(element => addListener(element, 'mouseup', event => performSonarrTest({ event })));
$('#medusa_test', true).forEach(element => addListener(element, 'mouseup', event => performMedusaTest({ event })));
$('#ombi_test', true).forEach(element => addListener(element, 'mouseup', event => performOmbiTest({ event })));
$('#sickBeard_test', true).forEach(element => addListener(element, 'mouseup', event => performSickBeardTest({ event })));
$('#enable-couchpotato', true).forEach(element => addListener(element, 'mouseup', event => enableCouchPotato({ event })));

/* INPUT | Get the JSON data */
addListener($('#json_get'), 'mouseup', event => {
	let data_container = $('#json_data'),
		data = atob((data_container.value || data_container.textContent).replace(/\s*\[.+\]\s*/, ''));

	if(!data) return new Notification('warning', 'The data cannot be blank, null, or undefined');

	try {
		restoreOptions(data);

		new Notification('update', 'Restored configuration data', 3000);
	} catch(error) {
		new Notification('error', `Error restoring configuration data: ${ error }`);
	}
});

/* OUTPUT | Set the JSON data */
addListener($('#json_set'), 'mouseup', event => {
	let data_container = $('#json_data'),
		data = getOptionValues();

	data_container.value = data_container.textContent = `[${ (new Date).toString().slice(0, 24) }]${ btoa(JSON.stringify(data)) }`;

	new Notification('info', 'Copy the configuration data somewhere safe, use it to restore your options');
});

/* Erase Cached Searches */
addListener($('#erase_cache'), 'mouseup', event => {
	let options = JSON.stringify(getOptionValues());

	new Notification('info', 'Clearing...', 3000);
	storage.get(null, items => {
		for(let item in items)
			if(/^~\/cache\//i.test(item))
				storage.remove(item);
	});

	saveOptions();
});

/* Erase ALL Settings */
addListener($('#reset_settings'), 'mouseup', event => {
	let options = JSON.stringify(getOptionValues());

	$('[default]', true)
		.forEach(el => {
			let de = el.getAttribute('default');

			if(el.type == 'checkbox')
				el.checked = de === 'true';
			else if('contenteditable' in el.attributes)
				el.innerHTML = de || '';
			else
				el.value = de || '';
		});

	Recall.CountEnabledSites();

	new Notification('update', 'All settings have been reset');

	RESETTING_SETTINGS = true;
});

$('#version')
	.innerHTML = `v${ manifest.version }`;

$('[type="range"]', true)
	.forEach((element, index, array) => {
		let sibling = element.nextElementSibling,
			symbol = element.getAttribute('symbol') || '';

		sibling.value = element.value + symbol;

		element.oninput = (event, self) => (self = event.target).nextElementSibling.value = self.value + (self.getAttribute('symbol') || '');
	});

$('.checkbox', true)
	.forEach((element, index, array) => {
		addListener(element, 'mouseup', event => {
			let self = traverse(path(event), element => (element && element.type == 'checkbox'), true),
				isChecked = e => e.setAttribute('in-use', !self.checked);

			if(!self)
				return;

			if('disabled' in self.attributes || traverse(self, element => (element && 'disabled' in element.attributes), true))
				return event.preventDefault(true);
			/* Stop the event from further processing */

			/* Handle special checkboxes */
			switch(self.id.toLowerCase()) {
				/* Update the database when the option is toggled */
				case 'use-lzw':
					let eneabled;

					if(enabled = !self.checked)
						new Notification('update', 'Compressing data...', 3000, () => new Notification('update', 'Compressed', 3000), false);
					else
						new Notification('update', 'Decompressing data...', 3000, () => new Notification('update', 'Decompressed', 3000), false);

					let options = getOptionValues();

					Recall.ToggleConfigurationAvailability(enabled);

					for(let name in options)
						if(/^__/.test(name)) {
							if(!self.checked)
								options[name] = compress(zip(BWT(options[name])));
							else
								options[name] = iBWT(unzip(decompress(options[name])));
						}
					break;

				case 'extension-branch-type':
					[...$('[counter-for="devmode"]', true)].map(isChecked);
					Recall.ToggleDeveloprBadge(!self.checked);
					break;

				default:
					let R = RegExp;

					if(/^using-([\w\-]+)/.test(self.id))
						$(`[using="${ R.$1 }"i]`, true).map(isChecked);
					else if(/^use/i.test(self.dataset.option))
						$(`[using="${ self.id }"i]`, true).map(isChecked);
					break;
			}

			if(/(^theme:|using)/i.test(self.dataset.option))
				self.checked = !self.checked;
		});
	});

$('.test', true)
	.forEach((element, index, array) => {
		addListener(element, 'mouseup', async event => {
			let self = traverse(event.target, element => !!~[...element.classList].indexOf('test'));

			// await saveOptions();

			open(self.getAttribute('href'), self.getAttribute('target'));
		});
	});

$('[data-option^="theme:"i], [data-option^="theme:"i] + label', true)
	.forEach((element, index, array) => {
		let UpdateTheme;

		addListener(element, 'mouseup', UpdateTheme = async event => {
			let self = traverse(event.target, element => /^theme:/i.test(element.dataset.option), true),
				R = RegExp;

			let [a, b] = self.getAttribute('theme').split(/^([^]+):([^]+?)$/).filter(v => v),
				value = `${self.dataset.option.replace(/^theme:/i, '')}-${b}`;

			if(/^(get|read|for)$/i.test(a))
				__theme[value] = (self.value == 'true'? true: self.value == 'false'? false: self.value);
			else if(/^(checkbox)$/i.test(self.type) && (self.checked + '') != a)
			// backwards; fires late
				__theme[value] = JSON.parse(a);
			else if(/^(text|input|button|\B)$/i.test(self.type) && R(a, 'i').test(self.value))
				__theme[value] = self.value;
			else
				delete __theme[value];
		});

		setTimeout(() => UpdateTheme({ target: element }), 1000);
	});

let hold = document.createElement('summary'),
	/* swap(from, to[, ...new from children]) */
	swap = (a, b, ...c) => {
		let d = a.children;

		(c = c.flat(Infinity)).forEach(e => a.insertBefore(e, d[0]));

		for(let f = c.length; d.length > f;)
			b.appendChild(d[f]);
	},
	uuid = e => {
		let u = [];

		for(let _; e; e = e.parentElement) {
			_ = e.tagName.toLowerCase();

			if(/^html$/i.test(_))
				break;
			if(e.id)
				_ += '#' + (
					/\s/.test(e.id)?
						`[id="${ e.id }"]`:
					e.id
				);
			if(e.className)
				_ += '.' + e.className.replace(/ /g, '.');
			if(e.parentElement.querySelector(_) !== e)
				_ += `:nth-child(${( [...e.parentElement.children].indexOf(e) + 1 )})`;
			u.push(_);
		}
		u.reverse();

		return u.join('>');
	};

$('.bar > article > details', true)
	.forEach((element, index, array) => {
		addListener(element, 'mouseup', event => {
			let self = path(event).filter(e => /^details$/i.test(e.tagName))[0],
				head = path(event).filter(e => /\bbar\b/i.test(e.classList))[0].querySelector('header'),
				open = e => {try {e.setAttribute('open', true);} catch(r) {/* not actually an error */}},
				disp = $('display');

			if(uuid(self) == disp.value) {
				return;
			} else if(disp.value) {
				swap(disp, $(disp.value));
			}

			if(!('open' in self.attributes)) {
				hold.innerHTML = self.querySelector('summary').innerHTML;

				disp.setAttribute('_title_', head.innerText.toCaps());
				disp.setAttribute('_sub-title_', hold.innerText);
				disp.value = uuid(self);

				let checked = {};

				[...self.children].forEach(child => {
					let input = child.querySelector('.checkbox input');

					if(!input)
						return;

					checked[uuid(child)] = input.checked;
				});

				swap(self, disp, hold);

				[...self.children].forEach(child => {
					let input = child.querySelector('.checkbox input');

					if(!input)
						return;

					input.checked = checked[uuid(child)];
				});

				[...$('.bar > article > details[open]', true)].forEach(e => e.removeAttribute('open'));
				open(self);
			}
		})
	});

$('[href^="#!/"]', true)
	.forEach(element => {
		let path = element.getAttribute('href').toLowerCase().split('/'),
			root = path[1],
			file = path.slice(2, path.length).join('/'),
			windows = false,
			apple = false,
			linux = false,
			{ platform } = navigator;

		if(/^win(\d+|ce|dows)$/i.test(platform))
			windows = true;
		else if(/^(i(?:phone|p[ao]d)(?: simulator)?|mac(?:intosh|intel|ppc|68k)|pike)/i.test(platform))
			apple = true;
		else if(/^((?:free|open)bsd|linux)/i.test(platform))
			linux = true;

		let uri = '#';

		switch(root) {
			// Native URIs
			case 'native':
				switch(file) {
					case 'settings/network/proxy':
						uri =
							windows?
								'ms-settings:network-proxy':
							apple?
								'#':
							linux?
								'#':
							'#';
						break;

					default:
						uri = '#';
						break;
				}
				break;

			// Other URIs
			// ...
		}

		element.setAttribute('href', `#!/NaCl+${ btoa(uri).replace(/=+$/, '') }`);
		element.onclick = event => {
			let self = traverse(event.target, element => /^#!\/NaCl\+/.test(element.getAttribute('href'))),
				href = self.getAttribute('href').replace(/^#!\/NaCl\+/, '');

			// chrome - runs fine with `_self`
			// firefox - kills options page, use `_blank`
			// compromise - use an iframe...
			open(atob(href), 'native-frame');
		};
	});

$('[id$="_test_status"]', true)
	.forEach(element => {
		element.innerHTML = MARKERS.maybe;
	});

// CORS exception: SecurityError
// MUST be { window }, never { top }
let { hash } = window.location;

if(hash.length > 1)
	switch(hash = hash.replace(/^#!\//, '').toLowerCase()) {
		/* #!/~COMMAND[:PARAMETER|PARAMETER...]
		 * #!/~save
		 * #!/~clear:all
		 */
		case '~save':
			setTimeout(async() => {
				await saveOptions();

				window.postMessage({ type: 'INITIALIZE' });
			}, 1000);
			break;

		/* #!/SETTING[/SUB-SETTING]
		 * #!/radarr
		 * #!/advanced-settings/api-keys
		 */
		case '':
			break;

		default:
			terminal.log(`Unknown event "${ hash }"`);
			break;
	};

/* Functions that require some time */
let Recall = {
	'@auto': {}, // run at 100ms
	'@0sec': {}, // run at 1ms
	'@1sec': {}, // run at 1000ms
};

/* Counting sites that are in use */
Recall['@auto'].CountEnabledSites = () =>
	[...$('[counter-for="sites"i]', true)].map(e => {
		let b_all = $('[id^="builtin_"]', true),
			p_all = $('[id^="plugin_"]', true),
			b_on = b_all.filter(e => e.checked).length,
			p_on = p_all.filter(e => e.checked).length;

		e.innerHTML = `${ (b_on + p_on) }/${ (b_all.length + p_all.length) }`

		$('#all-builtin').checked = b_all.length == b_on;
		$('#all-plugin').checked = p_all.length == p_on;
	});

/* Setting the DEV badge */
Recall['@auto'].ToggleDeveloprBadge = (state = null) =>
	[...$('[counter-for="devmode"i]', true)].map(e => {
		if(state === null)
			state = getOptionValues().DeveloperMode;

		if(state)
			return e.style.display = 'inline-block';
		e.style.display = 'none';
	});

/* Set the version and color */
Recall['@0sec'].SetVersionInfo = async() => {
	let DM = getOptionValues().DeveloperMode;

	function useVer(version) {
		let remote = version.tag_name.slice(1, version.tag_name.length),
			local = manifest.version,
			verEl = $('#version'),
			status;

		switch(compareVer(remote, local)) {
			case -1:
				status = 'high';
				verEl.setAttribute('title', `The installed version (v${ local }) is ahead of GitHub. No update required`);
				break;

			case 0:
				status = 'same';
				verEl.setAttribute('title', `The installed version (v${ local }) is the most recent. No update required`);
				break;

			case 1:
				status = 'low';
				verEl.href += (DM? '': '/latest');
				verEl.setAttribute('title', `The installed version (v${ local }) is behind GitHub. Update to v${ remote } available`);
				break;

			default:
				verEl.setAttribute('title', `An error has occured comparing Web to Plex versions ([v${ local }] \u2194 [v${ remote }])`);
				verEl.setAttribute('status', 'low');
				verEl.innerHTML = 'ERROR';
				return;
		}

		verEl.innerHTML = `v${ local }`;
		verEl.setAttribute('status', status);
	}

	if(DM)
		await fetch('https://api.github.com/repos/webtoplex/browser-extension/releases')
			.then(response => response.json())
			.then(versions => useVer(versions[0]));
	else
		await fetch('https://api.github.com/repos/webtoplex/browser-extension/releases/latest')
			.then(response => response.json())
			.then(version => useVer(version));
};

/* Get the user's IP address */
Recall['@auto'].GetIPAddress = async() => {
	let self = $('#ip-address'),
		teststatus = $('#proxy_test_status'),
		options = getOptionValues();


	self.innerHTML = 'Loading...';
	teststatus.innerHTML = MARKERS.maybe;

	let proxy = HandleProxySettings(options);

	if(proxy.enabled) {
		let { url, headers } = proxy,
			tor = 'https://check.torproject.org';

		headers = HandleProxyHeaders(headers, tor);

		if(/(^https?:\/\/)(?!localhost|127\.0\.0\.1(?:\/8)?|::1(?:\/128)?|:\d+)\b/i.test(url)) {
			url = url
				.replace(/\{b(ase-?)?64-url\}/gi, btoa(tor))
				.replace(/\{enc(ode)?-url\}/gi, encodeURIComponent(tor))
				.replace(/\{(raw-)?url\}/gi, tor);
		} else {
			self.innerHTML = '';
			teststatus.innerHTML = MARKERS.no;

			throw new SyntaxError('Unable to proxy: The URL must be a public (HTTPS/HTTP) address');
		}

		await fetch(url, { mode: 'cors', headers })
			.then(results => results.text())
			.then(text => {
				let DOM = new DOMParser,
					html = DOM.parseFromString(text, 'text/html'),
					strong = $('.content strong', false, html),
					IPAddress;

				if(strong)
					IPAddress = strong.textContent;
				else if(/([\d\.]{7,15})/.test(html.body.textContent))
					IPAddress = RegExp.$1;
				else
					IPAddress = '';

				self.innerHTML = IPAddress;
				teststatus.innerHTML = MARKERS[+!IPAddress];
			})
			.catch(error => {
				self.innerHTML = '';
				teststatus.innerHTML = MARKERS.no;

				new Notification('error', error);
			});
	} else {
		await fetch('https://check.torproject.org', { mode: 'cors' })
			.then(results => results.text())
			.then(text => {
				let DOM = new DOMParser,
					html = DOM.parseFromString(text, 'text/html'),
					strong = $('.content strong', false, html),
					IPAddress;

				if(strong)
					IPAddress = strong.textContent;
				else if(/([\d\.]{7,15})/.test(html.body.textContent))
					IPAddress = RegExp.$1;
				else
					IPAddress = '';

				self.innerHTML = IPAddress;
				teststatus.innerHTML = MARKERS[+!IPAddress];
			})
			.catch(error => {
				self.innerHTML = '';
				teststatus.innerHTML = MARKERS.no;

				new Notification('error', error);
			});
	}

	self.setAttribute('notice', `Public${proxy.enabled?' (Proxy)':''}`);
};

let ToggleConfigurationAvailabilityListener = false;
/* Setting the Configuration Data disabled state */
Recall['@1sec'].ToggleConfigurationAvailability = (enabled = null) => {
	if(enabled === null)
		enabled = $('#use-lzw').checked;

	if(enabled) {
		let parent = $('#json_data').parentElement;

		parent.setAttribute('disabled', '');

		if(!ToggleConfigurationAvailabilityListener)
			$('*:not([data-option])', true, parent).forEach(element => {
			    addListener(element, 'mousedown', event => {
			        let disabled = traverse(element, () => 'disabled' in element.attributes, false);

			        if(disabled)
			            return event.preventDefault();
			    });
			});
		ToggleConfigurationAvailabilityListener = true;
	} else {
		$('#json_data').parentElement.removeAttribute('disabled');
	}
};

for(let func in Recall) {
	if(/^@/.test(func)) {
		let f;

		switch(func) {
			case '@auto':
				for(let fn in Recall[func]) {
					f = Recall[func][fn];

					Recall[fn] = f;
					setTimeout(f, 100);
				}
				break;

			case '@0sec':
				for(let fn in Recall[func]) {
					f = Recall[func][fn];

					Recall[fn] = f;
					setTimeout(f, 1);
				}
				break;

			default:
				/^@(\d+)sec$/i.test(func);

				let time = +RegExp.$1;

				for(let fn in Recall[func]) {
					f = Recall[func][fn];

					Recall[fn] = f;
					setTimeout(f, time * 1000);
				}
				break;
		}
	} else {
		/* Do nothing... */
	}
}

function xip(string) {
	return compress(zip(BWT(string)));
}

function unxip(string) {
	return iBWT(unzip(decompress(string)));
}

/* Zipping Algorithm */
function zip(string = '') {
	return string.replace(/(\w)(\1{4,})/g, ($0, $1, $2, $$, $_) => $1 + `{${$2.length.toString(36)}}`);
}

/* Un-Zipping Algorithm */
function unzip(string = '') {
	let from36 = (n, x = 0) => n.split('').reverse().map((v, i) => x += '0123456789abcdefghijklmnopqrstuvwxyz'.indexOf(v) * 36**i)[-1] || x;

	return string.replace(/(\w)\{([a-z\d]+)\}/gi, ($0, $1, $2, $$, $_) => $1.repeat(from36($2) + 1));
}

/* BWT Sorting Algorithm */
function BWT(string = '') {
    if(/^[\x32]*$/.test(string))
        return '';

    let _a = `\u0001${ string }`,
        _b = `\u0001${ string }\u0001${ string }`,
        p_ = [];

    for(let i = 0; i < _a.length; i++)
        p_.push(_b.slice(i, _a.length + i));

    p_ = p_.sort();

    return p_.map(P => P.slice(-1)[0]).join('');
}

/* BWT Desorting Algorithm */
function iBWT(string = '') {
    if(/^[\x32]*$/.test(string))
        return '';

    let a = string.split('');

    let O = q => {
        let x = 0;
        for(let i = 0; i < a.length; i++)
            if(a[i] < q)
                x++;
        return x;
    };

    let C = (n, q) => {
        let x = 0;
        for(let i = 0; i < n; i++)
            if(a[i] === q)
                x++;
        return x;
    };

    let b = 0,
        c = '',
        d = a.length + 1;

    while(a[b] !== '\u0001' && d--) {
        c = a[b] + c;
        b = O(a[b]) + C(b, a[b]);
    }

    return c;
}

/* LZW Compression Algorithm */
function compress(string = '') {
	let dictionary = {},
		phrases    = (string + ''),
		phrase     = phrases[0],
		medium     = [],
		output     = [],
		index      = 255,
		character;

	if(string.length < 1)
		return;

	let at = (w = phrase, d = dictionary) =>
		(w.length > 1)?
			d[`@${ w }`]:
		w.charCodeAt(0);

	for(let i = 1, l = phrases.length; i < l; i++)
		if(dictionary[`@${ phrase }${ character = phrases[i] }`] !== undefined) {
			phrase += character;
		} else {
			medium.push(at(phrase));
			dictionary[`@${ phrase }${ character }`] = index++;
			phrase = character;
		}
	medium.push(at(phrase));

	for(let i = 0, l = medium.length; i < l; i++)
		output.push(String.fromCharCode(medium[i]));

	return output.join('');
}

/* LZW Decompression Algorithm */
function decompress(string = '') {
	let dictionary = {},
		phrases    = (string + ''),
		character  = phrases[0],
		word       = {
			now:  '',
			last: character,
		},
		output     = [character],
		index      = 255;

	if(string.length < 1)
		return;

	for(let i = 1, l = phrases.length, code; i < l; i++) {
		code = phrases.charCodeAt(i);

		if(code < 255)
			word.now = phrases[i];
		else if((word.now = dictionary[`@${ code }`]) === undefined)
			word.now = word.last + character;

		output.push(word.now);
		character = word.now[0];
		dictionary[`@${ index++ }`] = word.last + character;
		word.last = word.now;
	}

	return output.join('');
}

String.prototype.toCaps = String.prototype.toCaps || function toCaps(all) {
	/** Titling Caplitalization
 	* Articles: a, an, & the
 	* Conjunctions: and, but, for, nor, or, so, & yet
 	* Prepositions: across, after, although, at, because, before, between, by, during, from, if, in, into, of, on, to, through, under, with, & without
 	*/
	let array = this.toLowerCase(),
		titles = /(?!^|(?:an?|the)\s+)\b(a([st]|nd?|cross|fter|lthough)?|b(e(cause|fore|tween)?|ut|y)|during|from|in(to)?|[io][fn]|[fn]?or|the|[st]o|through|under|with(out)?|yet)(?!\s*$)\b/gi,
		cap_exceptions = /([\|\"\(]\s*[a-z]|[\:\.\!\?]\s+[a-z]|(?:^\b|[^\'\-\+]\b)[^aeiouy\d\W]+\b)/gi, // Punctuation exceptions, e.g. "And not I"
		all_exceptions = /\b((?:ww)?(?:m{1,4}(?:c?d(?:c{0,3}(?:x?l(?:x{0,3}(?:i?vi{0,3})?)?)?)?)?|c?d(?:c{0,3}(?:x?l(?:x{0,3}(?:i?vi{0,3})?)?)?)?|c{1,3}(?:x?l(?:x{0,3}(?:i?vi{0,3})?)?)?|x?l(?:x{0,3}(?:i?vi{0,3})?)?|x{1,3}(?:i?vi{0,3})?|i?vi{0,3}|i{1,3}))\b/gi, // Roman Numberals
		cam_exceptions = /\b((?:mr?s|[sdjm]r|mx)|(?:adm|cm?dr?|chf|c[op][lmr]|cpt|gen|lt|mjr|sgt)|doc|hon|prof)(?:\.|\b)/gi, // Titles (Most Common?)
		low_exceptions = /'([\w]+)/gi; // Apostrphe cases

	array = array.split(/\s+/);

	let index, length, string, word;
	for(index = 0, length = array.length, string = [], word; index < length; index++) {
		word = array[index];

		if(word)
			string.push( word[0].toUpperCase() + word.slice(1, word.length) );
	}

	string = string.join(' ');

	if(!all)
		string = string
		.replace(titles, ($0, $1, $$, $_) => $1.toLowerCase())
		.replace(all_exceptions, ($0, $1, $$, $_) => $1.toUpperCase())
		.replace(cap_exceptions, ($0, $1, $$, $_) => $1.toUpperCase())
		.replace(low_exceptions, ($0, $1, $$, $_) => $0.toLowerCase())
		.replace(cam_exceptions, ($0, $1, $$, $_) => $1[0].toUpperCase() + $1.slice(1, $1.length).toLowerCase() + '.');

	return string;
};

Object.filter = Object.filter || function filter(object, prejudice) {
	if(!prejudice)
		return object;

	let results = {};

	for(let key in object)
		if(prejudice(key, object[key]))
			results[key] = object[key];

	return results;
};

function path(element) {
	if(element.path)
		return element.path;
	else if(element.composedPath)
		return element.composedPath();

	let path = [];

	while(element) {
		path.push(element);

		if(element.parentElement === undefined || element.parentElement === null) {
			path.push(document, top);

			return path;
		}

		element = element.parentElement;
	}
};

/* CodePen.io @brianmearns - https://codepen.io/brianmearns/pen/YVjZWw */
$('[type^="code"][contenteditable]', true).forEach(editor => {
	addListener(editor, 'keyup', event => updateEditor(event.target, event.keyCode));
	addListener(editor, 'mouseup', event => updateEditor(event.target));

	updateEditor(editor);
});

function updateEditor(editor, key) {
	let selection = window.getSelection(),
		text = getText(editor),
		content = text.map(({ text }) => text).join('') + (key == 13? '\f': '');

	let index = {
		anchor: null,
		focus: null,
		current: 0,
	};

	text.forEach(({ text, node }) => {
		if(node == selection.anchorNode)
			index.anchor = index.current + selection.anchorOffset;
		if(node == selection.focusNode)
			index.focus = index.current + selection.focusOffset;

		index.current += text.length;
	});

	editor.innerHTML = compileText(content, key);
	editor.value = content.replace(/[\f\u21b5\u200c]+/g, '\n').replace(/\n+$/g, '');
	restoreSelection(index, editor, key);
}

function getText(element) {
	let text = [];

	[...element.childNodes].forEach(node => {
		switch(node.nodeType) {
			case Node.TEXT_NODE:
				text.push({ text: node.nodeValue, node });
				break;

			case Node.ELEMENT_NODE:
				text.splice(text.length, 0, ...( getText(node) ));
				break;

			default:
				throw `Unexpected node ${ node.nodeType }`;
				break;
		}
	});

	return text;
}

function compileText(text, key) {
	let R = RegExp;

	text = text
	    .replace(/&([^#\w])?/g, '&amp;$1')
	    .replace(/</g, '&lt;')
	    .replace(/>/g, '&gt;')
		.replace(/^[ \t]*([^\=\s]+)[ \t]*=[ \t]*((["'`])(?:[^\\\3]*|\\.)\3|[^\f\n\r\v\u21b5\u200c]*)/gm,
			($0, $1, $2, $3, $$, $_) => `<code new>${ $1 }</code>=<code val>${ $2 }</code>`
		)
		.replace(/@\{(?:(b(?:ase-?)?64|enc(?:ode)?|(?:raw)?)-)?url\}/g,
			($0, $1, $$, $_) => `<code var>@</code>{<code new>${ $1? $1 + '-': '' }url</code>}`
		)
		.replace(/@([\w\.]+)/g,
			($0, $1, $$, $_) => `<code var>@</code>${ $1.split('.').map((v, i, a) => `<code ${ i? 'var': 'new' }>${ v }</code>`).join('.') }`
		)
		.replace(/\b(\d+)\b/g,
			($0, $1, $$, $_) => `<code num>${ $1 }</code>`
		)
		.split(/\f/)
		.join('\u21b5\n\u200c');

	return text;
}

function restoreSelection({ anchor, focus }, editor, key) {
	let selection = window.getSelection(),
		texts = getText(editor),
		nodes = { anchor: editor, focus: editor },
		index = { anchor, focus, current: 0 };

	texts.forEach(({ text, node }) => {
		let start = index.current,
			end = start + text.length;

		if(key == 13) {
			let { anchorNode, focusNode } = getSelection(editor),
				{ length } = editor.childNodes;

			nodes.anchor = anchorNode;
			nodes.focus = focusNode;

			if(start <= anchor && anchor <= end) {
				nodes.anchor = node;
				index.anchor = length;
			}

			if(start <= focus && focus <= end) {
				nodes.focus = node;
				index.focus = length;
			}
		} else {
			if(start <= anchor && anchor <= end) {
				nodes.anchor = node;
				index.anchor = anchor - start;
			}

			if(start <= focus && focus <= end) {
				nodes.focus = node;
				index.focus = focus - start;
			}
		}

		index.current += text.length;
	});

	selection.setBaseAndExtent(nodes.anchor, index.anchor, nodes.focus, index.focus);
}

addListener($('#test-proxy-settings'), 'click', Recall.GetIPAddress);

addListener($('#ip-address'), 'mouseup', async event => {
	let self = event.target;

	self.innerHTML = 'Loading...';

	await fetch('https://check.torproject.org', { mode: 'cors' })
		.then(results => results.text())
		.then(text => {
			let DOM = new DOMParser,
				html = DOM.parseFromString(text, 'text/html'),
				strong = $('.content strong', false, html),
				IPAddress;

			if(strong)
				IPAddress = strong.textContent;
			else if(/([\d\.]{7,15})/.test(html.body.textContent))
				IPAddress = RegExp.$1;
			else
				IPAddress = 'unknown';

			self.innerHTML = IPAddress;
		});
});
