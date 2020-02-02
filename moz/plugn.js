/* plugn.js (Plugin) - Web to Plex */
/* global browser */

let PLUGN_DEVELOPER = false;

let PLUGN_TERMINAL =
	PLUGN_DEVELOPER?
		console:
	{ error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m };

let LAST, LAST_JS, LAST_INSTANCE, LAST_ID, LAST_TYPE, FOUND = {};

let PLUGN_STORAGE = browser.storage.sync || browser.storage.local;
let PLUGN_CONFIGURATION;

function load(name, private) {
	return JSON.parse((private && sessionStorage? sessionStorage: localStorage).getItem(btoa(name)));
}

function save(name, data, private) {
	return (private && sessionStorage? sessionStorage: localStorage).setItem(btoa(name), JSON.stringify(data));
}

async function Load(name = '') {
	if(!name)
		return /* invalid name */;

	name = '~/cache/' + (name.toLowerCase().replace(/\s+/g, '_'));

	return new Promise((resolve, reject) => {
		function LOAD(DISK) {
			let data = JSON.parse(DISK[name] || null);

			return resolve(data);
		}

		PLUGN_STORAGE.get(null, DISK => {
			if(browser.runtime.lastError)
				browser.storage.local.get(null, LOAD);
			else
				LOAD(DISK);
		});
	});
}

async function Save(name = '', data) {
	if(!name)
		return /* invalid name */;

	name = '~/cache/' + (name.toLowerCase().replace(/\s+/g, '_'));
	data = JSON.stringify(data);

	await PLUGN_STORAGE.set({[name]: data}, () => data);

	return name;
}

function GetConsent(name, builtin) {
	/* The configuration variable could fail to be initialized */
	if(!PLUGN_CONFIGURATION)
		throw 'Configuration not found, exiting prematurely';

	return PLUGN_CONFIGURATION[`${ (builtin? 'builtin': 'plugin') }_${ name }`];
}

async function GetAuthorization(name) {
	let authorized = await Load(`has/${ name }`),
		permissions = await Load(`get/${ name }`),
		Ausername, Apassword, Atoken,
		Aapi, Aserver, Aurl, Astorage,
		Acache, Anormie, Aquality,
		Aclient;

		if(!permissions)
			return {};

		function WriteOff(permission) {
			if(/^(usernames?)$/i.test(permission))
				Ausername = true;
			else if(/^(passwords?)$/i.test(permission))
				Apassword = true;
			else if(/^(tokens?)$/i.test(permission))
				Atoken = true;
			else if(/^(api)$/i.test(permission))
				Aapi = true;
			else if(/^(client(?:id)?)$/i.test(permission))
				Aclient = true;
			else if(/^(servers?)$/i.test(permission))
				Aserver = true;
			else if(/^(url(?:root)?|proxy)$/i.test(permission))
				Aurl = true;
			else if(/^(storage)$/i.test(permission))
				Astorage = true;
			else if(/^(cache)$/i.test(permission))
				Acache = true;
			else if(/^(builtin|plugin)$/i.test(permission))
				Anormie = true;
			else if(/^(qualit(?:y|ies))$/i.test(permission))
				Aquality = true;
		}

		if(permissions.constructor === Array)
			for(let permission of permissions)
				WriteOff(permission);
		else if(permissions.constructor === Object)
			for(let permission in permissions)
				WriteOff(permission);

	return { authorized, Ausername, Apassword, Atoken, Aapi, Aclient, Aserver, Aurl, Astorage, Acache, Anormie, Aquality };
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

				options.plexURL = o.plexURL?
					`${ o.plexURL }web#!/server/${ o.server.id }/`:
				`https://app.plex.tv/web/app#!/server/${ o.server.id }/`;
			} else {
				o = options;
			}

			if(o.couchpotatoBasicAuthUsername)
				o.couchpotatoBasicAuth = {
					username: o.couchpotatoBasicAuthUsername,
					password: o.couchpotatoBasicAuthPassword
				};

			// TODO: stupid copy/pasta
			if(o.watcherBasicAuthUsername)
				o.watcherBasicAuth = {
					username: o.watcherBasicAuthUsername,
					password: o.watcherBasicAuthPassword
				};

			if(o.radarrBasicAuthUsername)
				o.radarrBasicAuth = {
					username: o.radarrBasicAuthUsername,
					password: o.radarrBasicAuthPassword
				};

			if(o.sonarrBasicAuthUsername)
				o.sonarrBasicAuth = {
					username: o.sonarrBasicAuthUsername,
					password: o.sonarrBasicAuthPassword
				};

			if(o.usingOmbi && o.ombiURLRoot && o.ombiToken) {
				o.ombiURL = o.ombiURLRoot;
			} else {
				delete o.ombiURL; // prevent variable ghosting
			}

			if(o.usingCouchPotato && o.couchpotatoURLRoot && o.couchpotatoToken) {
				o.couchpotatoURL = `${ items.couchpotatoURLRoot }/api/${encodeURIComponent(o.couchpotatoToken)}`;
			} else {
				delete o.couchpotatoURL; // prevent variable ghosting
			}

			if(o.usingWatcher && o.watcherURLRoot && o.watcherToken) {
				o.watcherURL = o.watcherURLRoot;
			} else {
				delete o.watcherURL; // prevent variable ghosting
			}

			if(o.usingRadarr && o.radarrURLRoot && o.radarrToken) {
				o.radarrURL = o.radarrURLRoot;
			} else {
				delete o.radarrURL; // prevent variable ghosting
			}

			if(o.usingSonarr && o.sonarrURLRoot && o.sonarrToken) {
				o.sonarrURL = o.sonarrURLRoot;
			} else {
				delete o.sonarrURL; // prevent variable ghosting
			}

			resolve(o);
		}

		PLUGN_STORAGE.get(null, options => {
			if(browser.runtime.lastError)
				browser.storage.local.get(null, handleConfiguration);
			else
				handleConfiguration(options);
		});
	});
}

// self explanatory, returns an object; sets the configuration variable
function parseConfiguration() {
	return getConfiguration().then(options => {
		PLUGN_CONFIGURATION = options;

		if((PLUGN_DEVELOPER = options.DeveloperMode) && !parseConfiguration.gotConfig) {
			parseConfiguration.gotConfig = true;
			PLUGN_TERMINAL =
				PLUGN_DEVELOPER?
					console:
				{ error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m };

			PLUGN_TERMINAL.warn(`PLUGN_DEVELOPER: ${PLUGN_DEVELOPER}`);
		}

		return options;
	}, error => { throw error });
}

browser.storage.onChanged.addListener(async(changes, namespace) => {
	await parseConfiguration();
});

(async() => {
	await parseConfiguration();
})();

function RandomName(length = 16, symbol = '') {
	let values = [];

	window.crypto.getRandomValues(new Uint32Array(length)).forEach((value, index, array) => values.push(value.toString(36)));

	return values.join(symbol).replace(/^[^a-z]+/i, '');
};

function TLDHost(host) {
	return host.replace(/^(ww\w+|\w{2})\./, '');
}

async function prepare({ code, alias, type, allowed, url }) {

	let DATE = (new Date),
		YEAR = DATE.getFullYear(),
		MONT = DATE.getMonth(),
		DAY  = DATE.getDate();

	let name = (!PLUGN_DEVELOPER? instance: `top.${ instance }`), // makes debugging easier
		topmost = !/^top\./.test(name),
		Type = type.replace(/^\w/, ($0, $$, $_) => $0.toUpperCase());

	let org = url.origin,
		ali = TLDHost(url.host);

	let { authorized, ...A } = await GetAuthorization(alias);

return `/* ${ type } (${ (!PLUGN_DEVELOPER? 'on':'off') }line) - "${ url.href }" @ ${ DATE } */

${ topmost? 'var ': '' }${ name } = (${ name } || (${ name }$ = $ => {
'use strict';

let DATE = (new Date),
	YEAR = ${YEAR},
	MONT = ${MONT},
	DAY  = ${DAY};

/* Required permissions */
if(${ allowed } === false)
	return '<allowed>';
if(${ authorized } === false)
	return '<authorized>';
${
(() => {
	let o = [];

	for(let a in A)
		o.push(
`if(${ A[a] } === false)
	return '<${ a.slice(1) }>';
`
		);

	return o.join('');
})()
}
/* Start Injected ${ Type } */
${
	code
		.replace(/\/\/+\s*"([^\"\n\f\r\v]+?)"\s*requires?\:?\s*(.+)/i, ($0, $1, $2, $$, $_) =>
			`;(async() => await Require("${ $2 }", "${ alias }", "${ $1 }", "${ instance }"))();`
		)
		.replace(/\b(chrome|browser)\.storage\.(sync|local|managed)\.?/g, ($0, $1, $2, $$, $_) =>
			`;console.warn("This ${ type } attempted to access <${ $1 }.storage.${ $2 }>; use <async function save>, <async function load>, and <async function kill> instead.");`
		)
}
/* End Injected ${ Type } */

let ${ Type }ReadyState;

top.addEventListener('popstate', ${ type }.init);
top.addEventListener('pushstate-changed', ${ type }.init);

return (
	${ type }.RegExp = RegExp(
		${ type }.url
			.replace(/^\\*\\:/,'\\\\w{3,}:')
				// *://
			.replace(/\\*\\./g,'(?:[^\\\\.]+\\\\.)?')
				// *.
			.replace(/\\.\\*/g,'(?:\\\\.[^\\\\/\\\\.]+)?')
				// .*
			.replace(/([\\/\\?\\&\\#])\\*/g,'\\\\$1[^$]*')
				// /* OR ?* OR &* OR #*
	, 'i')
).test
/* URL matches pattern */
(location.href)?
	/* Injected ${ type } is properly structured */
	(typeof ${ type }.init == "function")?
		/* Injected ${ type } has the "ready" property */
		${ type }.ready?
			/* Injected ${ type } is ready */
			(${ Type }ReadyState =
				/* "ready" is an async function */
				${ type }.ready.constructor.name == 'AsyncFunction'?
					${ type }.ready():
				/* "ready" is a sync (normal) function */
				${ type }.ready()
			)?
				${ type }.init( ${ Type }ReadyState ):
			/* Injected ${ type } isn't ready */
			(${ type }.timeout || 1000):
		/* Injected ${ type } doesn't have the "ready" property */
		${ type }.init():
	/* Injected ${ type } isn't properly structured */
	(console.warn("The ${ type } (${ alias }) is incorrectly structured. Could not find required function ${ type }.init"), -1):
/* URL doesn't match pattern */
(console.warn("The domain '${ org }' (" + location.href + ") does not match the domain pattern '" + ${ type }.url + "' (" + ${ type }.RegExp + ")"), -1);
})(document.queryBy));

console.log('[${ name.replace(/^(top\.)?(\w{7}).*$/i, '$1$2') }]', ${ name });

top.onlocationchange = (event) => browser.runtime.sendMessage({ type: '$INIT$', options: { ${ type }: '${ alias }' } });

;${ name };`
}

let handle = async(results, tabID, instance, script, type) => {
	let InstanceWarning = `[${ type.toUpperCase() }:${ script }] Instance failed to execute @${ tabID }#${ instance }`,
		InstanceType = type;

	results = await results;

	/* Always display a pretty button */
	browser.tabs.insertCSS(tabID, { file: 'common.css' });

	if((!results || !results[0] || !instance) && !FOUND[instance])
		try {
			instance = RandomName();
			tabchange([ TAB ]);
			return;
		} catch(error) {
			return PLUGN_TERMINAL.warn(InstanceWarning);
		}

	let data = await results[0];

	if(typeof data == 'number') {
		if(handle.timeout)
			return /* already running */;
		if(data < 0)
			return browser.tabs.sendMessage(tabID, { data, instance, [InstanceType.toLowerCase()]: script, instance_type: InstanceType, type: 'NO_RENDER' })
			/* stop execution and timeouts/intervals */;

		return handle.timeout = setTimeout(() => { let { request, sender, callback } = (processMessage.properties || {}); handle.timeout = null; processMessage(request, sender, callback) }, data);
	} else if(typeof data == 'string') {
		let R = RegExp;

		if(/^<([^<>]+)>$/.test(data))
			return PLUGN_TERMINAL.warn(`The instance requires the "${ R.$1 }" permission: ${ instance }`);

		data.replace(/^([^]+?)\s*\((\d{4})\):([\w\-]+)$/);

		let title = R.$1,
			year  = R.$2,
			type  = R.$3;

		data = { type, title, year };
	}

	if(typeof data == 'number')
		return setTimeout(() => { let { request, sender, callback } = (processMessage.properties || {}); processMessage(request, sender, callback) }, data);
	if(typeof data != 'object')
		return /* setTimeout */;

	try {
		if(data instanceof Array) {
			data = data.filter(d => d);

			if(data.length > 1) {
				browser.tabs.sendMessage(tabID, { data, instance, [InstanceType.toLowerCase()]: script, instance_type: InstanceType, type: 'POPULATE' });
				return /* done */;
			}

			/* the array is too small to parse, set it as a single item */
			data = data[0];
		}

		let { type, title, year } = data;

		title = title
			.replace(/[\u2010-\u2015]/g, '-') // fancy hyphen
			.replace(/[\u201a\u275f]/g, ',') // fancy comma
			.replace(/[\u2018\u2019\u201b\u275b\u275c]/g, "'") // fancy apostrophe
			.replace(/[\u201c-\u201f\u275d\u275e]/g, '"'); // fancy quotation marks
		year = +year;

		data = { ...data, type, title, year };

		browser.tabs.sendMessage(tabID, { data, instance, [InstanceType.toLowerCase()]: script, instance_type: InstanceType, type: 'POPULATE' })
			.then(response => {
				if(browser.runtime.lastError)
					browser.runtime.lastError.message;

				PLUGN_TERMINAL.warn('Response [plugn]: ' + JSON.stringify(response));

				if(!response)
					PLUGN_TERMINAL.warn(`Terminated execution, response: ${ JSON.stringify(response) }`);
			});
	} catch(error) {
		throw new Error(`${ InstanceWarning } - ${ String(error) }`);
	}
};

let running = [], instance = RandomName(), TAB, cache = {};

/* Handle script/plugin events */
let tabchange = async tabs => {
	let tab = tabs[0];

	if(!tab || FOUND[instance]) return;

	TAB = tab;

	let id  = tab.id,
		url = tab.url,
		org, ali, js,
		type, cached,
		allowed;

	if(
		!url
		|| /^(?:about|debugger|view-source)/i.test(url)
		// || (!!~running.indexOf(id) && !!~running.indexOf(instance))
	)
		return /*
			Stop if:
				a) There isn't a url
				b) The url is an about url
				c) The tab AND instance are accounted for
		*/;

	url  = new URL(url);
	org  = url.origin;
	ali  = TLDHost(url.host);
	type = (load(`builtin:${ ali }`) + '') == 'true'? 'script': 'plugin';
	js   = load(`${ type }:${ ali }`);
	code = cache[ali];
	allowed = await GetConsent(ali, type == 'script');

	if(!allowed || !js) return;

	let { authorized, ...A } = await GetAuthorization(js);

	if(code) {
		browser.tabs.executeScript(id, { file: 'helpers.js' }, () => {
			// Sorry, but the instance needs to be callable multiple times
			browser.tabs.executeScript(id, { code }, results => handle(results, id, instance, js, type));
		});

		return setTimeout(() => cache = {}, 1e6);
	}

	let file = (PLUGN_DEVELOPER)?
		(type === 'script')?
			browser.runtime.getURL(`${ js }.js`):
		browser.runtime.getURL(`plugin.${ js }.js`):
	`https://webtoplex.github.io/web/${ type }s/${ js }.js`;

	await fetch(file, { mode: 'cors' })
		.then(response => response.text())
		.then(async code => {
			await browser.tabs.executeScript(id, { file: 'helpers.js' }, async() => {
				// Sorry, but the instance needs to be callable multiple times
				await browser.tabs.executeScript(id, {
					code: (LAST = cache[ali] = await prepare({ code, alias: js, type, allowed, url })),
				}, results => handle(results, LAST_ID = id, LAST_INSTANCE = instance, LAST_JS = js, LAST_TYPE = type))
			})
		})
		.then(() => running.push(id, instance))
		.catch(error => { throw error });
};

// listen for message event
let processMessage;

browser.runtime.onMessage.addListener(processMessage = async(request = {}, sender, callback = () => {}) => {
	let { options } = request,
		tab = TAB || {},
		{ id, url, href } = tab,
		org;

	processMessage.properties = { request, sender, callback };

	if(
		!url
		|| /^(?:about|debugger|view-source)/i.test(url)
		// || (!!~running.indexOf(id) && !!~running.indexOf(instance))
	)
		return callback(null) /*
			Stop if:
				a) There isn't a url
				b) The url is an about url
				c) The tab AND instance are accounted for
		*/;

	url = new URL(url);
	org = url.origin;

	let name = (!PLUGN_DEVELOPER? instance: `top.${ instance }`), // makes debugging easier
		topmost = !/^top\./.test(name);

	if(request.options) {
		let { type } = request,
			{ plugin, script } = options,
			_type = type.toLowerCase(),
			allowed;

		type = type.toUpperCase();

		let file = (PLUGN_DEVELOPER)?
			(_type === 'script')?
				browser.runtime.getURL(`${ script }.js`):
			browser.runtime.getURL(`plugin.${ plugin }.js`):
		`https://webtoplex.github.io/web/${ _type }s/${ options[_type] }.js`;

		let { authorized, ...A } = await GetAuthorization(options[_type]);

		try {
			switch(type) {
				case 'PLUGIN':
					allowed = await GetConsent(plugin, false);

					await fetch(file, { mode: 'cors' })
						.then(response => response.text())
						.then(async code => {
							await browser.tabs.executeScript(id, { file: 'helpers.js' }, async() => {
								// Sorry, but the instance needs to be callable multiple times
								await browser.tabs.executeScript(id, {
									code: (LAST = cache[plugin] = await prepare({ code, alias: plugin, type: 'plugin', allowed, url }))
								}, results => handle(results, LAST_ID = id, LAST_INSTANCE = instance, LAST_JS = plugin, LAST_TYPE = type))
							})
						})
						.then(() => running.push(id, instance))
						.catch(error => { throw error });
					break;

				case 'SCRIPT':
					allowed = await GetConsent(script, true);

					await fetch(file, { mode: 'cors' })
						.then(response => response.text())
						.then(async code => {
							await browser.tabs.executeScript(id, { file: 'helpers.js' }, async() => {
								// Sorry, but the instance needs to be callable multiple times
								await browser.tabs.executeScript(id, {
									code: (LAST = cache[plugin] = await prepare({ code, alias: plugin, type: 'script', allowed, url }))
								}, results => handle(results, LAST_ID = id, LAST_INSTANCE = instance, LAST_JS = script, LAST_TYPE = type))
							})
						})
						.then(() => running.push(id, instance))
						.catch(error => { throw error });
					break;

				// Soft reset (button reset)
				case '_INIT_':
					browser.tabs.executeScript(id, { code: LAST }, results => handle(results, LAST_ID, LAST_INSTANCE, LAST_JS, LAST_TYPE));
					break;

				// Hard reset (program reset)
				case '$INIT$':
					let t = type.toLowerCase(),
						data = {};

					browser.tabs.sendMessage(tab.id, { data, instance, [t]: script, instance_type: t, type: 'INITIALIZE' });
					// browser.tabs.getCurrent(tab => {
					//     instance = RandomName();
					//
					//     setTimeout(() => tabchange([ tab ]), 5000);
					// });
					break;

				case 'FOUND':
					FOUND[request.instance] = request.found;
					// chrome.tabs.sendMessage(tab.id, { data: {}, instance, found: request.found, instance_type: type.toLowerCase(), type: 'POSTED' });
					break;

				case 'GRANT_PERMISSION':
					await Save(`has/${ options[_type] }`, options.allowed);
					await Save(`get/${ options[_type] }`, options.permissions);
					break;

				case 'SEARCH_PLEX':
				case 'VIEW_COUCHPOTATO':
				case 'PUSH_COUCHPOTATO':
				case 'PUSH_RADARR':
				case 'PUSH_SONARR':
				case 'PUSH_MEDUSA':
				case 'PUSH_WATCHER':
				case 'PUSH_OMBI':
				case 'PUSH_SICKBEARD':
				case 'OPEN_OPTIONS':
				case 'SEARCH_FOR':
				case 'SAVE_AS':
				case 'DOWNLOAD_FILE':
				case 'UPDATE_CONFIGURATION':
					/* Meant to be handled by background.js */
					break;

				default:
					PLUGN_TERMINAL.warn(`Unable to find type "${ type }"`);
					instance = RandomName();
					return false;
			}

			return true;
		} catch(error) {
			PLUGN_TERMINAL.error(error);
			// callback(String(error));
			return false;
		}
	} else {
		return true;
	}
});

// this doesn't actually work...
// browser.tabs.onActiveChanged.addListener(tabchange);

// workaround for the above
browser.tabs.onActivated.addListener(change => {
	instance = RandomName();

	browser.tabs.get(change.tabId, tab => tabchange([ tab ]));
});

let refresh;

browser.tabs.onUpdated.addListener(refresh = (ID, change, tab) => {
	instance = RandomName();

	if(change.status == 'complete' && !tab.discarded)
		tabchange([ tab ]);
	else if(!tab.discarded)
		setTimeout(() => refresh(ID, change, tab), 1000);
});
