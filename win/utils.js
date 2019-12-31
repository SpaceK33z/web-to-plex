/* eslint-disable no-unused-vars */
/* global configuration, init, Update, "Helpers" */

let configuration, init, Update;

(async date => {

	// default date items
	let YEAR  = date.getFullYear(),
		MONTH = date.getMonth() + 1,
		DATE  = date.getDate(),
	// Notification items
		NOTIFIED = false,
		RUNNING  = false,
	// Other items
	/* Items that the user has already asked for */
		CAUGHT, COMPRESS;

	// simple helpers
	let extURL = url => chrome.extension.getURL(url),
		$ = (selector, container) => queryBy(selector, container),
		// DO NOT EXPOSE
		__CONFIG__, ALLOWED, PERMISS;

	let IMG_URL = {
		'nil':				extURL('img/null.png'),
		'icon_16':			extURL('img/16.png'),
		'icon_48':			extURL('img/48.png'),
		'background': 		extURL('img/background.png'),
		'hide_icon_16':		extURL('img/hide.16.png'),
		'hide_icon_48':		extURL('img/hide.48.png'),
		'show_icon_16':		extURL('img/show.16.png'),
		'show_icon_48':		extURL('img/show.48.png'),
		'close_icon_16':	extURL('img/close.16.png'),
		'close_icon_48':	extURL('img/close.48.png'),
		'icon_white_16':	extURL('img/_16.png'),
		'icon_white_48':	extURL('img/_48.png'),
		'plexit_icon_16':   extURL('img/plexit.16.png'),
		'plexit_icon_48':   extURL('img/plexit.48.png'),
		'reload_icon_16':   extURL('img/reload.16.png'),
		'reload_icon_48':   extURL('img/reload.48.png'),
		'icon_outline_16':  extURL('img/o16.png'),
		'icon_outline_48':  extURL('img/o48.png'),
		'noise_background': extURL('img/noise.png'),
		'settings_icon_16': extURL('img/settings.16.png'),
		'settings_icon_48': extURL('img/settings.48.png'),
	};

	// the storage - priority to sync
	const UTILS_STORAGE = chrome.storage.sync || chrome.storage.local;

	async function load(name = '') {
		if(!name)
			return /* invalid name */;

		name = '~/cache/' + (name.toLowerCase().replace(/\s+/g, '_'));

		return new Promise((resolve, reject) => {
			function LOAD(DISK) {
				let data = JSON.parse(DISK[name] || null);

				return resolve(data);
			}

			UTILS_STORAGE.get(null, DISK => {
				if(chrome.runtime.lastError)
					chrome.storage.local.get(null, LOAD);
				else
					LOAD(DISK);
			});
		});
	}

	async function save(name = '', data) {
		if(!name)
			return /* invalid name */;

		name = '~/cache/' + (name.toLowerCase().replace(/\s+/g, '_'));
		data = JSON.stringify(data);

		// erase entries after 400-500 have been made
		UTILS_STORAGE.get(null, items => {
			let array = [], bytes = 0;

			for(let item in items) {
				let object = items[item];

				array.push(item);
				bytes += (typeof object == 'string'? object.length * 8: typeof object == 'boolean'? 8: JSON.stringify(object).length * 8)|0;
			}

			if((UTILS_STORAGE.MAX_ITEMS && array.length >= UTILS_STORAGE.MAX_ITEMS) || bytes >= UTILS_STORAGE.QUOTA_BYTES) {
				UTILS_TERMINAL.WARN('Exceeded quota. Erasing cache...');

				for(let item in items)
					if(/^~\/cache\/(?!get|has)/i.test(item))
						UTILS_STORAGE.remove(item);

				UTILS_TERMINAL.LOG('Cache erased');
			}
		});

		await UTILS_STORAGE.set({[name]: data}, () => data);

		return name;
	}

	async function remove(name) {
		if(!name)
			return /* invalid name */;

		return await UTILS_STORAGE.remove(['~/cache/' + (name.toLowerCase().replace(/\s+/g, '_'))]);
	}

	function encode(data) {
		if(/^[\u0000-\u00ff]+$/.test(data))
			return btoa(data);
		else
			return data;
	}

	function decode(data) {
		if(/^[a-z\d\+\/\=]+$/i.test(data))
			return atob(data);
		else
			return data;
	}

	/* Notifications */
	// create and/or queue a notification
	// state = "warning" - red
	// state = "error"
	// state = "update"  - blue
	// state = "info"	 - grey
	// anything else for state will show as orange
	class Notification {
		constructor(state, text, timeout = 7000, callback = () => {}, requiresClick = true) {
			let queue = (Notification.queue = Notification.queue || { list: [] }),
				last = queue.list[queue.list.length - 1] || document.queryBy('.web-to-plex-notification').first;

			if(!__CONFIG__) {
				Options();

				throw 'No configuration saved...';
			}

			if(((state == 'error' || state == 'warning') && __CONFIG__.NotifyNewOnly && /\balready\s+(exists?|(been\s+)?added)\b/.test(text)) || (__CONFIG__.NotifyOnlyOnce && NOTIFIED && state === 'info'))
				return /* Don't match /.../i as to not match item titles */;
			NOTIFIED = true;

			if(last && !last.done)
				return (last => setTimeout(() => new Notification(state, text, timeout, callback, requiresClick), +(new Date) - last.start))(last);

			let element = furnish(`div.web-to-plex-notification.${state}`, {
				onmouseup: event => {
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
				job:   setTimeout(() => element.onmouseup({ target: element, requiresClick }), timeout),
				id:    +element.id,
				callback, element
			};
			queue.list.push(queue[element.id]);

			document.body.appendChild(element);

			return queue[element.id];
		}
	}

	class Prompt {
		constructor(prompt_type, options, callback = () => {}, container = document.body) {
			let prompt, remove,
				array = (options instanceof Array? options: [].slice.call(options)),
				data = [...array],
				manager = {
					movie: (
						__CONFIG__.usingOmbi?
							'Ombi':
						__CONFIG__.usingRadarr?
							'Radarr':
						__CONFIG__.usingWatcher?
							'Watcher':
						__CONFIG__.usingCouchPotato?
							'CouchPotato':
						'???'
					),
					show: (
						__CONFIG__.usingOmbi?
							'Ombi':
						__CONFIG__.usingSonarr?
							'Sonarr':
						__CONFIG__.usingSickBeard?
							'SickBeard':
						__CONFIG__.usingMedusa?
							'Medusa':
						'???'
					)
				},
				profiles = {
					movie: JSON.parse(
						__CONFIG__.usingRadarr?
							__CONFIG__.radarrQualities:
						__CONFIG__.usingWatcher?
							__CONFIG__.watcherQualities:
						'[]'
					),
					show: JSON.parse(
						__CONFIG__.usingSonarr?
							__CONFIG__.sonarrQualities:
						__CONFIG__.usingMedusa?
							__CONFIG__.medusaQualities:
						__CONFIG__.usingSickBeard?
							__CONFIG__.sickBeardQualities:
						'[]'
					)
				},
				locations = {
					movie: JSON.parse(
						__CONFIG__.usingRadarr?
							__CONFIG__.radarrStoragePaths:
						__CONFIG__.usingWatcher?
							__CONFIG__.watcherStoragePaths:
						'[]'
					),
					show: JSON.parse(
						__CONFIG__.usingSonarr?
							__CONFIG__.sonarrStoragePaths:
						__CONFIG__.usingMedusa?
							__CONFIG__.medusaStoragePaths:
						__CONFIG__.usingSickBeard?
							__CONFIG__.sickBeardStoragePaths:
						'[]'
					)
				},
				defaults = {
					movie: (
						__CONFIG__.usingRadarr?
							{ quality: __CONFIG__.__radarrQuality, location: __CONFIG__.__radarrStoragePath }:
						{}
					),
					show: (
						__CONFIG__.usingSonarr?
							{ quality: __CONFIG__.__sonarrQuality, location: __CONFIG__.__sonarrStoragePath }:
						__CONFIG__.usingMedusa?
							{ quality: __CONFIG__.__medusaQuality, location: __CONFIG__.__medusaStoragePath }:
						__CONFIG__.usingSickBeard?
							{ quality: __CONFIG__.__sickBeardQuality, location: __CONFIG__.__sickBeardStoragePath }:
						{}
					)
				},
				slugs = {
					movie: (
						__CONFIG__.usingOmbi?
							`${ __CONFIG__.ombiURL }`:
						__CONFIG__.usingRadarr?
							`${__CONFIG__.radarrURL}movies/%title%-%TMDbID%`:
						__CONFIG__.usingWatcher?
							`${__CONFIG__.watcherURL}library/status#%title%-%TMDbID%`:
						__CONFIG__.usingCouchPotato?
							`${ __CONFIG__.couchpotatoURL }`:
						'#'
					),
					show: (
						__CONFIG__.usingOmbi?
							`${ __CONFIG__.ombiURL }`:
						__CONFIG__.usingSonarr?
							`${__CONFIG__.sonarrURL}series/%title%`:
						__CONFIG__.usingSickBeard?
							`${__CONFIG__.sickBeardURL}home/displayShow?show=%TVDbID%`:
						__CONFIG__.usingMedusa?
							`${__CONFIG__.medusaURL}home/displayShow?indexername=tvdb&seriesid=%TVDbID%`:
						'#'
					)
				},
				slugify = type => slugs[type].replace(
					/%([\w\-]+)%/gi, ($0, $1, $$, $_) => (typeof options[$1] != 'string')?
						options[$1]:
					options[$1]
						.replace(/\&/g, 'and')
						.replace(/\s+/g, '-')
						.replace(/[^\w\-]+/g, '')
						.replace(/\-{2,}/g, '-')
						.toLowerCase()
				);

			let preX = document.queryBy('.web-to-plex-prompt').first;

			if(preX)
				return /* Ignore while another prompt is open, prevents double prompts */;

			options.imdb = options.IMDbID;
			options.tmdb = options.TMDbID;
			options.tvdb = options.TVDbID;

			switch(prompt_type) {
				/* Allows the user to add and remove items from a list */
				case 'prompt':
				case 'input':
					remove = element => {
						let prompter = $('.web-to-plex-prompt').first,
							header = $('.web-to-plex-prompt-header').first,
							counter = $('.web-to-plex-prompt-options').first;

						if(element === true)
							return prompter.remove();
						else
							element.remove();

						data.splice(+element.value, 1, null);
						header.innerText = 'Approve ' + counter.children.length + (counter.children.length == 1?' item': ' items');
					};

					prompt = furnish('div.web-to-plex-prompt', {},
						furnish('div.web-to-plex-prompt-body', { style: `background-image: url(${ IMG_URL.noise_background }), url(${ IMG_URL.background }); background-size: auto, cover;` },
							// The prompt's title
							furnish('h1.web-to-plex-prompt-header', {}, 'Approve ' + array.length + (array.length == 1? ' item': ' items')),

							// The prompt's items
							furnish('div.web-to-plex-prompt-options', {},
								...(ITEMS => {
									let elements = [];

									for(let index = 0, length = ITEMS.length, ITEM, P_QUA, P_LOC; index < length; index++) {
										ITEM = ITEMS[index];

										elements.push(
											furnish('li.web-to-plex-prompt-option.mutable', { value: index, innerHTML: `<h2>${ index + 1 } \u00b7 ${ ITEM.title }${ ITEM.year? ` (${ ITEM.year })`: '' } <em>\u2014 ${ ITEM.type }</em></h2>` },
												furnish('button.remove', { title: `Remove "${ ITEM.title }"`, onmouseup: event => { remove(event.target.parentElement); event.target.remove() } }),
												(
													__CONFIG__.PromptQuality?
														P_QUA = furnish('select.quality', { index, onchange: event => data[event.target.getAttribute('index')].quality = event.target.value }, ...profiles[/(movie|film|cinema)/i.test(ITEM.type)?'movie':'show'].map(Q => furnish('option', { value: Q.id }, Q.name))):
													''
												),(
													__CONFIG__.PromptLocation?
														P_LOC = furnish('select.location', { index, onchange: event => data[event.target.getAttribute('index')].location = event.target.value }, ...locations[/(movie|film|cinema)/i.test(ITEM.type)?'movie':'show'].map(Q => furnish('option', { value: Q.id }, Q.path))):
													''
												)
											)
										);

										if(P_QUA) P_QUA.value = defaults[ITEM.type].quality;
										if(P_LOC) P_LOC.value = defaults[ITEM.type].location;

										P_QUA = P_LOC = null;
									}

									return elements
								})(array)
							),

							// The engagers
							furnish('div.web-to-plex-prompt-footer', {},
								furnish('input.web-to-plex-prompt-input[type=text]', { placeholder: 'Add an item (enter to add): Title (Year) Type / ID Type', title: 'Solo: A Star Wars Story (2018) movie / tt3778644 m', onkeydown: async event => {
									if(event.keyCode == 13) {
										let title, year, type, self = event.target, R = RegExp,
											movie = /^(m(?:ovies?)?|f(?:ilms?)?|c(?:inemas?)?)/i,
											Db, IMDbID, TMDbID, TVDbID, value = self.value;

										self.setAttribute('disabled', self.disabled = true);
										self.value = `Searching for "${ value }"...`;
										data = data.filter(value => value !== null && value !== undefined);

										if(/^\s*((?:tt)?\d+)(?:\s+(\w+)|\s*)?$/i.test(value)) {
											let APIID = R.$1,
												type = R.$2 || (data.length? data[0].type: 'movie'),
												APIType = movie.test(type)? /^tt/i.test(APIID)? 'imdb': 'tmdb': 'tvdb';

											type = movie.test(type)? 'movie': 'show';

											Db = await Identify({ type, APIID, APIType });
											IMDbID = Db.imdb;
											TMDbID = Db.tmdb;
											TVDbID = Db.tvdb;

											title = Db.title;
											year = Db.year;
										} else if(/^([^]+)(\s*\(\d{2,4}\)\s*|\s+\d{2,4}\s+)([\w\s\-]+)$/.test(value)) {
											title = R.$1;
											year  = R.$2 || YEAR + '';
											type  = R.$3 || (data.length? data[0].type: 'movie');

											year = +year.replace(/\D/g, '').replace(/^\d{2}$/, '20$&');
											type = movie.test(type)? 'movie': 'show';

											Db = await Identify({ type, title, year });
											IMDbID = Db.imdb;
											TMDbID = Db.tmdb;
											TVDbID = Db.tvdb;
										}

										event.preventDefault();
										if(type && title && !(/^(?:tt)?$/i.test(IMDbID || '') && /^0?$/.test(+TMDbID | 0) && /^0?$/.test(+TVDbID | 0))) {
											remove(true);
											new Prompt(prompt_type, [{ ...Db, type, IMDbID, TMDbID, TVDbID }, ...data], callback, container);
										} else {
											self.disabled = self.removeAttribute('disabled');
											self.value = value;
											new Notification('error', `Couldn't find "${ value }"`);
										}
									}
								} }),
								furnish('button.web-to-plex-prompt-decline', { onmouseup: event => { remove(true); callback([]) }, title: 'Close' }, '\u2718'),
								furnish('button.web-to-plex-prompt-accept', { onmouseup: event => { remove(true); new Prompt(prompt_type, options, callback, container) }, title: 'Reset' }, '\u21BA'),
								furnish('button.web-to-plex-prompt-accept', { onmouseup: event => { remove(true); callback(data.filter(value => value !== null && value !== undefined)) }, title: 'Continue' }, '\u2714')
							)
						)
					);
					break;

				/* Allows the user to remove predetermined items */
				case 'select':
					remove = element => {
						let prompter = $('.web-to-plex-prompt').first,
							header = $('.web-to-plex-prompt-header').first,
							counter = $('.web-to-plex-prompt-options').first;

						if(element === true)
							return prompter.remove();
						else
							element.remove();

						data.splice(+element.value, 1, null);
						header.innerText = 'Approve ' + counter.children.length + (counter.children.length == 1?' item': ' items');
					};

					prompt = furnish('div.web-to-plex-prompt', {},
						furnish('div.web-to-plex-prompt-body', { style: `background-image: url(${ IMG_URL.noise_background }), url(${ IMG_URL.background }); background-size: auto, cover;` },
							// The prompt's title
							furnish('h1.web-to-plex-prompt-header', {}, 'Approve ' + array.length + (array.length == 1? ' item': ' items')),

							// The prompt's items
							furnish('div.web-to-plex-prompt-options', {},
								...(ITEMS => {
									let elements = [];

									for(let index = 0, length = ITEMS.length, ITEM, P_QUA, P_LOC; index < length; index++) {
										ITEM = ITEMS[index];

										elements.push(
											furnish('li.web-to-plex-prompt-option.mutable', { value: index, innerHTML: `<h2>${ index + 1 } \u00b7 ${ ITEM.title }${ ITEM.year? ` (${ ITEM.year })`: '' } <em>\u2014 ${ ITEM.type }</em></h2>` },
												furnish('button.remove', { title: `Remove "${ ITEM.title }"`, onmouseup: event => { remove(event.target.parentElement); event.target.remove() } }),
												(
													__CONFIG__.PromptQuality?
														P_QUA = furnish('select.quality', { index, onchange: event => data[event.target.getAttribute('index')].quality = event.target.value }, ...profiles[/(movie|film|cinema)/i.test(ITEM.type)?'movie':'show'].map(Q => furnish('option', { value: Q.id }, Q.name))):
													''
												),(
													__CONFIG__.PromptLocation?
														P_LOC = furnish('select.location', { index, onchange: event => data[event.target.getAttribute('index')].location = event.target.value }, ...locations[/(movie|film|cinema)/i.test(ITEM.type)?'movie':'show'].map(Q => furnish('option', { value: Q.id }, Q.path))):
													''
												)
											)
										);

										if(P_QUA) P_QUA.value = defaults[ITEM.type].quality;
										if(P_LOC) P_LOC.value = defaults[ITEM.type].location;

										P_QUA = P_LOC = null;
									}

									return elements
								})(array)
							),

							// The engagers
							furnish('div.web-to-plex-prompt-footer', {},
								furnish('button.web-to-plex-prompt-decline', { onmouseup: event => { remove(true); callback([]) }, title: 'Close' }, '\u2718'),
								furnish('button.web-to-plex-prompt-accept', { onmouseup: event => { remove(true); new Prompt(prompt_type, options, callback, container) }, title: 'Reset' }, '\u21BA'),
								furnish('button.web-to-plex-prompt-accept', { onmouseup: event => { remove(true); callback(data.filter(value => value !== null && value !== undefined)) }, title: 'Continue' }, '\u2714')
							)
						)
					);
					break;

				/* Allows the user to modify a single item (before being pushed) */
				case 'modify':
					let { title, year, type, IMDbID, TMDbID, TVDbID } = options,
						P_QUA, P_LOC;

					let i = IMDbID,
						t = TMDbID,
						v = TVDbID,
						s = 'style="text-decoration: none !important; color: #cc7b19 !important; font-style: italic !important;" target="_blank"';

					i = /^tt-?$/.test(i)? '': i;
					t = /^0?$/.test(t)? '': t;
					v = /^0?$/.test(v)? '': v;

					remove = element => {
						let prompter = $('.web-to-plex-prompt').first,
							header = $('.web-to-plex-prompt-header').first,
							counter = $('.web-to-plex-prompt-options').first;

						if(element === true)
							return prompter.remove();
						else
							element.remove();
					};

					type = /(movie|film|cinema)/i.test(type)?'movie':'show';

					prompt = furnish('div.web-to-plex-prompt', {},
						furnish('div.web-to-plex-prompt-body', { style: `background-image: url(${ IMG_URL.noise_background }), url(${ IMG_URL.background }); background-size: auto, cover;` },
							// The prompt's title
							furnish('h1.web-to-plex-prompt-header', { innerHTML: `${ title }${ year? ` (${ year })`: '' }` }),

							// The prompt's items
							furnish('div.web-to-plex-prompt-options', {},
								furnish('div.web-to-plex-prompt-option', { innerHTML: `${ type } \u2014 ${ i? `<a href="https://imdb.com/title/${i}/?ref=web_to_plex" ${s}>${i}</a>`: '/' } \u2014 ${ t? `<a href="https://themoviedb.org/${type=='show'?'tv':type}/${t}" ${s}>${t}</a>`: '/' } \u2014 ${ v? `<a href="https://thetvdb.com/series/${title.replace(/\s+/g,'-').replace(/&/g,'and').replace(/[^\w\-]+/g,'')}#${v}" ${s}>${v}</a>`: '/' }` }),
								(
									__CONFIG__.PromptQuality?
										P_QUA = furnish('select.quality', { onchange: event => options.quality = event.target.value }, ...profiles[type].map(Q => furnish('option', { value: Q.id }, Q.name))):
									''
								),
								furnish('br'),
								(
									__CONFIG__.PromptLocation?
										P_LOC = furnish('select.location', { onchange: event => options.location = event.target.value }, ...locations[type].map(Q => furnish('option', { value: Q.id }, Q.path))):
									''
								)
							),

							// The engagers
							furnish('div.web-to-plex-prompt-footer', {},
								furnish('button.web-to-plex-prompt-decline', { onmouseup: event => { remove(true); callback([]) }, title: 'Close' }, '\u2718'),
								furnish('button.web-to-plex-prompt-accept', { onmouseup: event => { remove(true); new Prompt(prompt_type, options, callback, container) }, title: 'Reset' }, '\u21BA'),
								furnish('button.web-to-plex-prompt-accept', { onmouseup: event => { remove(true); callback(options) }, title: 'Continue' }, '\u2714'),
								furnish('button.web-to-plex-prompt-accept', { onmouseup: event => { let self = event.target; open(self.getAttribute('href'), '_blank') }, href: slugify(type), title: `Open on ${ manager[type] }` }, manager[type])
							)
						)
					);

					if(P_QUA) P_QUA.value = defaults[type].quality;
					if(P_LOC) P_LOC.value = defaults[type].location;

					P_QUA = P_LOC = null;
					break;

				case 'permission':
					let { permission, name, alias } = options;
					let existing, permissions;

					/* Only one permission prompt allowed */
					if(!(existing = $('.web-to-plex-prompt[type=permission]')).empty)
						return existing.first;

					UTILS_TERMINAL.LOG(`Asking for permission(s):`, options);

					remove = element => {
						let prompter = $('.web-to-plex-prompt').first,
							header = $('.web-to-plex-prompt-header').first,
							counter = $('.web-to-plex-prompt-options').first;

						if(element === true)
							return prompter.remove();
						else
							element.remove();
					};

					callback = (allowed, permissions) => {
						save(`has/${ name }`, allowed);
						save(`get/${ name }`, permissions);

						ALLOWED = allowed;
						PERMISS = permissions;

						ParsedOptions();

						return Update(`GRANT_PERMISSION`, { allowed, permissions }, true),
							(init && !RUNNING? (init(), RUNNING = true): RUNNING = false);
					};

					prompt = furnish('div.web-to-plex-prompt', {},
						furnish('div.web-to-plex-prompt-body', { style: `background-image: url(${ IMG_URL.noise_background }), url(${ IMG_URL.background }); background-size: auto, cover;` },
							// The prompt's title
							furnish('h1.web-to-plex-prompt-header', { innerHTML: `${ alias || name } (${ location.host }) would like:` }),

							// The prompt's items
							furnish('div.web-to-plex-prompt-options', {},
								...((permissions = permission.split(/\s*,\s*/).filter(v=>v&&v.length)).map(
									__permission =>
										furnish('div.web-to-plex-prompt-option', { innerHTML: `Access to your ${ __permission } information` })
									)
								)
							),


							// The engagers
							furnish('div.web-to-plex-prompt-footer', {},
								furnish('button.web-to-plex-prompt-decline', { onmouseup: event => { remove(true); callback(false, {}) }, title: 'Deny' }, '\u2718'),
								furnish('button.web-to-plex-prompt-accept', { onmouseup: event => { remove(true); callback(true, permissions) }, title: 'Allow' }, '\u2714')
							)
						)
					);
					break;

				default:
					return UTILS_TERMINAL.ERROR(`Unknown prompt type "${ prompt_type }"`);
					break;
			}

			prompt.setAttribute('type', prompt_type);

			return container.append(prompt), prompt;
		}
	}

	// open up the options page
	function Options() {
		chrome.runtime.sendMessage({
			type: 'OPEN_OPTIONS'
		});
	}

	// "secret frame"
	function sFrame(url, callbacks) {
		let { success, error } = callbacks;

		let frame = document.furnish('iframe#web-to-plex-sframe', {
			src: url,
			style: `
				display:	none   !important;
				opacity:	0	  !important;
				visibility: hidden !important;
			`,

			onload:  success,
			onerror: error,
		});

		// todo: make iframe, load, delete
		document.body.append(frame);
	}

	function TLDHost(host) {
		return host.replace(/^(ww\w+|\w{2})\./, '');
	}

	// Send an update query to background.js
	Update = (type, options = {}, postToo) => {
		if(configuration)
			console.log(`Requesting update (${ type } [post-to-top=${ !!postToo }])`, options);
		else if(!Update.retry)
			try {
				configuration = ParsedOptions();

				Update.retry = true;

				Update(type, options, postToo);

				return;
			} catch(error) {
				console.warn(`Update failed... "${ error }" Attempting to save configuration...`);

				return sFrame(extURL(`options/index.html#!/~save`), {
					success: async event => {
						let self = event.target;

						await ParsedOptions();

						Update(type, options, postToo);

						self.remove();

						return;
					},

					error: async event => {
						let self = event.target;
						self.remove();

						new Notification('error', `Fill in missing Web to Plex options`, 15000, Options, false);

						throw `Unable to set configuration variable: ${ JSON.stringify(configuration) }`;
					}
				});
			}
		else
			return Update.retry = false;

		let message = JSON.stringify({ type, options }),
			index = -1;

		Update.messages = Update.messages || [];

		if(!~Update.messages.indexOf(message)) {
			Update.messages.push(message);

			chrome.runtime.sendMessage({
				type,
				options
			}, response => {
				if(response === undefined) {
					console.warn(`Update response (${ type } [post-to-top=${ !!postToo }]): Invalid response...`, { response, options });
				} else {
					console.log(`Update response (${ type } [post-to-top=${ !!postToo }]):`, { response, options });
				}
			});
		} else {
			// the message was already sent, block it
		}

		// the message has only 1s to "live"
		setTimeout(() => Update.messages.splice(index, 1), 1000);

		if(postToo)
			top.postMessage(options);
	};

	// get the saved options
	function options() {
		return new Promise((resolve, reject) => {
			function handleOptions(options) {
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

				if(o.medusaBasicAuthUsername)
					o.medusaBasicAuth = {
						username: o.medusaBasicAuthUsername,
						password: o.medusaBasicAuthPassword
					};

				if(o.sickBeardBasicAuthUsername)
					o.sickBeardBasicAuth = {
						username: o.sickBeardBasicAuthUsername,
						password: o.sickBeardBasicAuthPassword
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

				if(o.usingMedusa && o.medusaURLRoot && o.medusaToken) {
					o.medusaURL = o.medusaURLRoot;
				} else {
					delete o.medusaURL; // prevent variable ghosting
				}

				if(o.usingSickBeard && o.sickBeardURLRoot && o.sickBeardToken) {
					o.sickBeardURL = o.sickBeardURLRoot;
				} else {
					delete o.sickBeardURL; // prevent variable ghosting
				}

				resolve(o);
			}

			UTILS_STORAGE.get(null, options => {
				if(chrome.runtime.lastError)
					chrome.storage.local.get(null, handleOptions);
				else
					handleOptions(options);
			});
		});
	}

	// self explanatory, returns an object; sets the configuration variable
	async function ParsedOptions() {
		return await options()
			.then(
				options => {
					configuration = {};

					/* Don't expose the user's authentication information to sites */
					for(let key in options)
						if(/username|password|token|api|server|url|storage|cache|proxy|client|builtin|plugin|qualit/i.test(key))
							if(ALLOWED && RegExp(PERMISS.join('|'),'i').test(key))
								configuration[key] = options[key];
							else
								/* Do nothing */;
						// else if(/(^cache-data|paths|qualities)/i.test(key))
						//	 /* Pre-parse JSON - make sure anything accessing thedata handles objects too */
						//	 configuration[key] = JSON.parse(options[key] || null);
						else
							/* Simple copy */
							configuration[key] = options[key];

					COMPRESS = options.UseLZW;
					CAUGHT = options.__caught;
					CAUGHT = JSON.parse(COMPRESS? decompress(CAUGHT): CAUGHT);
					CAUGHT.bump = async(ids) => {
						bumping:
						for(let id in ids) {
							let ID = id.toLowerCase().slice(0, 4),
								MAX = (COMPRESS? 200: 100);

							if(!!~CAUGHT[ID].indexOf(ids[id]))
								continue bumping;

							if(CAUGHT[ID].length >= MAX)
								CAUGHT[ID].splice(0, 1 + (CAUGHT[ID].length - MAX));

							CAUGHT[ID].push(ids[id]);
							CAUGHT[ID].filter(v => typeof v == 'number'? v: null);
							CAUGHT[ID] = CAUGHT[ID].slice(0, MAX);
						}

						let __caught = JSON.stringify(CAUGHT);

						__caught = (COMPRESS? compress(__caught): __caught);

						await UTILS_STORAGE.set({ __caught }, () => configuration.__caught = __caught);
					};

					return __CONFIG__ = options;
				},
				error => {
					new Notification(
						'warning',
						'Fill in missing Web to Plex options',
						15000,
						Options
					);
					throw error;
				}
			);
	}

	await ParsedOptions();

	let AUTO_GRAB = {
			ENABLED: __CONFIG__.UseAutoGrab,
			LIMIT:   __CONFIG__.AutoGrabLimit,
		},
		UTILS_DEVELOPER = __CONFIG__.DeveloperMode, // = { true: Developer Mode, fase: Standard Mode }
		UTILS_TERMINAL =
			UTILS_DEVELOPER?
				console:
			{ error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m, LOG: m => m, ERROR: m => m, WARN: m => m };

		UTILS_TERMINAL.LOG = UTILS_TERMINAL.LOG?
			UTILS_TERMINAL.LOG:
		(...messages) => {
			if(messages.length == 1) {
				let message = messages[0],
					type = typeof message == 'object'? 'o': 'c';

				(type == 'o')?
					UTILS_TERMINAL.log(message):
				UTILS_TERMINAL.log(
					`%${ type }\u22b3 ${ message } `,
					`
						background-color: #00332b;
						border-bottom: 1px solid #0000;
						border-top: 1px solid #065;
						box-sizing: border-box;
						clear: right;
						color: #f5f5f5;
						display: block !important;
						line-height: 2;
						user-select: text;

						flex-basis: 1;
						flex-shrink: 1;

						margin: 0;
						overflow-wrap: break-word;
						pading: 3px 22px 1px 0;
						position: fixed;
						z-index: -1;

						min-height: 0;
						min-width: 100%;
						height: 100%;
						width: 100%;
					`
				);
			} else {
				messages.forEach(message => UTILS_TERMINAL.LOG(message));
			}
		};

		UTILS_TERMINAL.ERROR = UTILS_TERMINAL.ERROR?
			UTILS_TERMINAL.ERROR:
		(...messages) => {
			if(messages.length == 1) {
				let message = messages[0],
					type = typeof message == 'object'? 'o': 'c';

				(type == 'o')?
					UTILS_TERMINAL.error(message):
				UTILS_TERMINAL.log(
					`%${ type }\u2298 ${ message } `,
					`
				        background-color: #290000;
				        border-bottom: 1px solid #0000;
				        border-top: 1px solid #5c0000;
				        box-sizing: border-box;
				        clear: right;
				        color: #f5f5f5;
				        display: block !important;
				        line-height: 2;
				        user-select: text;

				        flex-basis: 1;
				        flex-shrink: 1;

				        margin: 0;
				        overflow-wrap: break-word;
				        pading: 3px 22px 1px 0;
				        position: fixed;
				        z-index: -1;

				        min-height: 0;
				        min-width: 100%;
				        height: 100%;
				        width: 100%;
				    `
				);
			} else {
				messages.forEach(message => UTILS_TERMINAL.ERROR(message));
			}
		};

		UTILS_TERMINAL.WARN = UTILS_TERMINAL.WARN?
			UTILS_TERMINAL.WARN:
		(...messages) => {
			if(messages.length == 1) {
				let message = messages[0],
					type = typeof message == 'object'? 'o': 'c';

				(type == 'o')?
					UTILS_TERMINAL.warn(message):
				UTILS_TERMINAL.log(
					`%${ type }\u26a0 ${ message } `,
					`
				        background-color: #332b00;
				        border-bottom: 1px solid #0000;
				        border-top: 1px solid #650;
				        box-sizing: border-box;
				        clear: right;
				        color: #f5f5f5;
				        display: block !important;
				        line-height: 2;
				        user-select: text;

				        flex-basis: 1;
				        flex-shrink: 1;

				        margin: 0;
				        overflow-wrap: break-word;
				        pading: 3px 22px 1px 0;
				        position: fixed;
				        z-index: -1;

				        min-height: 0;
				        min-width: 100%;
				        height: 100%;
				        width: 100%;
				    `
				);
			} else {
				messages.forEach(message => UTILS_TERMINAL.WARN(message));
			}
		};

	if(configuration) {
		let host = TLDHost(location.host),
			doms = configuration.__domains.split(',');

		if(!~doms.indexOf(host))
			return;
	}

	UTILS_TERMINAL.log('UTILS_DEVELOPER:', UTILS_DEVELOPER, configuration);

	// parse the formatted headers and URL
	function HandleProxyHeaders(Headers = "", URL = "") {
		let headers = {};

		Headers.replace(/^[ \t]*([^\=\s]+)[ \t]*=[ \t]*((["'`])(?:[^\\\3]*|\\.)\3|[^\f\n\r\v]*)/gm, ($0, $1, $2, $3, $$, $_) => {
			let string = !!$3;

			if(string) {
				headers[$1] = $2.replace(RegExp(`^${ $3 }|${ $3 }$`, 'g'), '');
			} else {
				$2 = $2.replace(/@([\w\.]+)/g, (_0, _1, _$, __) => {
					let path = _1.split('.'), property = top;

					for(let index = 0, length = path.length; index < length; index++)
						property = property[path[index]];

					headers[$1] = property;
				})
				.replace(/@\{b(ase-?)?64-url\}/gi, btoa(URL))
				.replace(/@\{enc(ode)?-url\}/gi, encodeURIComponent(URL))
				.replace(/@\{(raw-)?url\}/gi, URL);
			}
		});

		return headers;
	}

	// fetch/search for the item's media ID(s)
	// rerun enum - [0bWXYZ] - [Tried Different URL | Tried Matching Title | Tried Loose Searching | Tried Rerunning Altogether]
	async function Identify({ title, alttitle, year, type, IMDbID, TMDbID, TVDbID, APIType, APIID, meta, rerun }) {
		let json = {}, // returned object
			data = {}, // mutated object
			promise,   // query promise
			api = {
				tmdb: __CONFIG__.TMDbAPI || '37930f472ee15263f0b1ef5cc72e181a',
				omdb: __CONFIG__.OMDbAPI || 'PlzBanMe',
				ombi: __CONFIG__.ombiToken,
			},
			apit = APIType || type, // api type (depends on "rqut")
			apid = APIID   || null, // api id
			iid  = IMDbID  || null, // IMDbID
			mid  = TMDbID  || null, // TMDbID
			tid  = TVDbID  || null, // TVDbID
			rqut = apit, // request type: tmdb, imdb, or tvdb
			manable = __CONFIG__.ManagerSearch && !(rerun & 0b1000), // is the user's "Manager Searches" option enabled?
			UTF_16 = /[^0\u0020-\u007e, 1\u00a1\u00bf-\u00ff, 2\u0100-\u017f, 3\u0180-\u024f, 4\u0300-\u036f, 5\u0370-\u03ff, 6\u0400-\u04ff, 7\u0500-\u052f, 8\u20a0-\u20bf]+/g,
			MV = /^(movies?|films?|cinemas?)$/i.test(apit),
			TV = /^(tv[\s\-]*(?:shows?|series)?)$/i.test(apit);

		type = type || null;
		meta = { ...meta, mode: 'cors' };
		rqut =
		/(tv|show|series)/i.test(rqut)?
			'tvdb':
		/(movie|film|cinema)s?/i.test(rqut)?
			'tmdb':
		rqut || '*';
		manable = manable && (__CONFIG__.usingOmbi || (__CONFIG__.usingRadarr && rqut == 'tmdb') || ((__CONFIG__.usingSonarr || __CONFIG__.usingMedusa /*|| __CONFIG__.usingSickBeard*/) && rqut == 'tvdb'));
		title = (title? title.replace(/\s*[\:,]\s*seasons?\s+\d+.*$/i, '').toCaps(): "")
			.replace(/[\u2010-\u2015]/g, '-') // fancy hyphen
			.replace(/[\u201a\u275f]/g, ',') // fancy comma
			.replace(/[\u2018\u2019\u201b\u275b\u275c`]/g, "'") // fancy apostrophe (tilde from anime results by TMDb)
			.replace(/[\u201c-\u201f\u275d\u275e]/g, '"') // fancy quotation marks
			.replace(UTF_16, ''); // only accept "usable" characters
			/* 0[ -~], 1[¡¿-ÿ], 2[Ā-ſ], 3[ƀ-ɏ], 4[ò-oͯ], 5[Ͱ-Ͽ], 6[Ѐ-ӿ], 7[Ԁ-ԯ], 8[₠-₿] */
			/** Symbol Classes
		 	0) Basic Latin, and standard characters
		 	1) Latin (Supplement)
		 	2) Latin Extended I
		 	3) Latin Extended II
		 	4) Diatrical Marks
		 	5) Greek & Coptic
		 	6) Basic Cyrillic
		 	7) Cyrillic (Supplement)
		 	8) Currency Symbols
		 	*/
		year = year? (year + '').replace(/\D+/g, ''): year;

		let plus = (string, character = '+') => string.replace(/\s+/g, character);

		let local, savename;

		if(year) {
			savename = `${title} (${year}).${rqut}`.toLowerCase(),
			local = await load(savename);
		} else {
			year = await load(`${title}.${rqut}`.toLowerCase()) || year;
			savename = `${title} (${year}).${rqut}`.toLowerCase();
			local = await load(savename);
		}

		if(local) {
			UTILS_TERMINAL.LOG('[LOCAL] Search results', local);
			return local;
		}

		/* the rest of this function is a beautiful mess that will need to be dealt with later... but it works */
		let url =
			(manable && title && __CONFIG__.usingOmbi && __CONFIG__.ombiURLRoot)?
				`${ __CONFIG__.ombiURLRoot }api/v1/Search/${ (/^[it]mdb$/i.test(rqut) || MV)? 'movie': 'tv' }/${ plus(title, '%20') }/?apikey=${ api.ombi }`:
			(manable && (__CONFIG__.usingRadarr || __CONFIG__.usingSonarr || __CONFIG__.usingMedusa /*|| __CONFIG__.usingSickBeard*/))?
				(__CONFIG__.usingRadarr && /^[it]mdb$/i.test(rqut) && __CONFIG__.radarrURLRoot)?
					(mid)?
						`${ __CONFIG__.radarrURLRoot }api/movie/lookup/tmdb?tmdbId=${ mid }&apikey=${ __CONFIG__.radarrToken }`:
					(iid)?
						`${ __CONFIG__.radarrURLRoot }api/movie/lookup/imdb?imdbId=${ iid }&apikey=${ __CONFIG__.radarrToken }`:
					`${ __CONFIG__.radarrURLRoot }api/movie/lookup?term=${ plus(title, '%20') }&apikey=${ __CONFIG__.radarrToken }`:
				(__CONFIG__.usingSonarr && __CONFIG__.sonarrURLRoot)?
					(tid)?
						`${ __CONFIG__.sonarrURLRoot }api/series/lookup?term=tvdb:${ tid }&apikey=${ __CONFIG__.sonarrToken }`:
					`${ __CONFIG__.sonarrURLRoot }api/series/lookup?term=${ plus(title, '%20') }&apikey=${ __CONFIG__.sonarrToken }`:
				(__CONFIG__.usingMedusa && __CONFIG__.medusaURLRoot)?
					(tid)?
						`${ __CONFIG__.medusaURLRoot }api/v2/series/tvdb${ tid }?detailed=true&api_key=${ __CONFIG__.medusaToken }`:
					`${ __CONFIG__.medusaURLRoot }api/v2/internal/searchIndexersForShowName?query=${ plus(title) }&indexerId=0&api_key=${ __CONFIG__.medusaToken }`:
				/* TODO: find a way to get CORS to work on Sick Beard URLs (localhost) */
				// (__CONFIG__.usingSickBeard)?
				//	 (tid)?
				//		 `${ __CONFIG__.sickBeardURLRoot }api/${ __CONFIG__.sickBeardToken }/?cmd=sb.searchtvdb&tvdbid=${ tid }`:
				//	 `${ __CONFIG__.sickBeardURLRoot }api/${ __CONFIG__.sickBeardToken }/?cmd=sb.searchtvdb&name=${ encodeURIComponent(title) }`:
				null:
			(rqut == 'imdb' || (rqut == '*' && !iid && title) || (rqut == 'tvdb' && !iid && title && !(rerun & 0b1000)) && (rerun |= 0b1000))?
				(iid)?
					`https://www.omdbapi.com/?i=${ iid }&apikey=${ api.omdb }`:
				(year)?
					`https://www.omdbapi.com/?t=${ plus(title) }&y=${ year }&apikey=${ api.omdb }`:
				`https://www.omdbapi.com/?t=${ plus(title) }&apikey=${ api.omdb }`:
			(rqut == 'tmdb' || (rqut == '*' && !mid && title && year) || MV)?
				(apit && apid)?
					`https://api.themoviedb.org/3/${ MV? 'movie': 'tv' }/${ apid }?api_key=${ api.tmdb }`:
				(iid || mid || tid)?
					`https://api.themoviedb.org/3/find/${ iid || mid || tid }?api_key=${ api.tmdb }&external_source=${ iid? 'imdb': mid? 'tmdb': 'tvdb' }_id`:
				`https://api.themoviedb.org/3/search/${ MV? 'movie': 'tv' }?api_key=${ api.tmdb }&query=${ encodeURI(title) }${ year? '&year=' + year: '' }`:
			(rqut == 'tvdb' || (rqut == '*' && !tid && title) || (apid == tid))?
				(tid)?
					`https://api.tvmaze.com/shows/?thetvdb=${ tid }`:
				(iid)?
					`https://api.tvmaze.com/shows/?imdb=${ iid }`:
				`https://api.tvmaze.com/search/shows?q=${ encodeURI(title) }`:
			(title)?
				(apit && year)?
					`https://www.theimdbapi.org/api/find/${ MV? 'movie': 'show' }?title=${ encodeURI(title) }&year=${ year }`:
				`https://www.theimdbapi.org/api/find/movie?title=${ encodeURI(title) }${ year? '&year=' + year: '' }`:
			null;

		if(url === null) return null;

		let proxy = __CONFIG__.proxy,
			cors = proxy.url, // if cors is requried and not uspported, proxy through this URL
			headers = HandleProxyHeaders(proxy.headers, url);

		if(proxy.enabled && /(^http:\/\/)(?!localhost|127\.0\.0\.1(?:\/8)?|::1(?:\/128)?|:\d+)\b/i.test(url)) {
			url = cors
				.replace(/\{b(ase-?)?64-url\}/gi, btoa(url))
				.replace(/\{enc(ode)?-url\}/gi, encodeURIComponent(url))
				.replace(/\{(raw-)?url\}/gi, url);

			UTILS_TERMINAL.log({ proxy, url, headers });
		}

		UTILS_TERMINAL.LOG(`Searching for "${ title } (${ year })" in ${ type || apit }/${ rqut }${ proxy.enabled? '[PROXY]': '' } => ${ url }`, __CONFIG__);

		await(proxy.enabled? fetch(url, { mode: "cors", headers }): fetch(url))
			.then(response => response.text())
			.then(data => {
				try {
					if(data)
						json = JSON.parse(data);
				} catch(error) {
					UTILS_TERMINAL.error(`Failed to parse JSON: "${ data }"`);
				}
			})
			.catch(error => {
				throw error;
			});

		UTILS_TERMINAL.LOG('Search results', { title, year, url, json });

		/* DO NOT change to else-if, won't work with Sick Beard: { data: { results: ... } } */
		if('data' in json)
			json = json.data;
		if('results' in json)
			json = json.results;

		if(json instanceof Array) {
			let b = { release_date: '', year: '' },
				t = (s = "") => s.toLowerCase(),
				c = (s = "") => t(s).replace(/\&/g, 'and').replace(UTF_16, ''),
				k = (s = "") => {

					let r = [
						[/(?!^\s*)\b(show|series|a([st]|nd?|cross|fter|lthough)?|b(e(cause|fore|tween)|ut|y)|during|from|in(to)?|[io][fn]|[fn]?or|the|[st]o|through|under|with(out)?|yet)\b\s*/gi, ''],
						// try replacing common words, e.g. Conjunctions, "Show," "Series," etc.
						[/\^\s*|\s*$/g, ''],
						[/\s+/g, '|'],
						[/[\u2010-\u2015]/g, '-'], // fancy hyphen
						[/[\u201a\u275f]/g, ','], // fancy comma
						[/[\u2018\u2019\u201b\u275b\u275c`]/g, "'"], // fancy apostrophe (tilde from anime results by TMDb)
						[/[\u201c-\u201f\u275d\u275e]/g, '"'], // fancy quotation marks
						[/'(?=\B)|\B'/g, '']
					];

					for(let i = 0; i < r.length; i++) {
						if(/^([\(\|\)]+)?$/.test(s)) return "";

						s = s.replace(r[i][0], r[i][1]);
					}

					return c(s);
				},
				R = (s = "", S = "", n = !0) => {
					let l = s.split(' ').length, L = S.split(' ').length, E,
						score = 100 * (((S.match(E = RegExp(`\\b(${k(s)})\\b`, 'gi')) || [null]).length) / (L || 1)),
						passing = __CONFIG__.UseLooseScore | 0;

					UTILS_TERMINAL.LOG(`\tQuick Match => "${ s }"/"${ S }" = ${ score }% (${ E })`);
					score *= (l > L? (L||1)/l: L > l? (l||1)/L: 1);
					UTILS_TERMINAL.LOG(`\tActual Match (${ passing }% to pass) ~> ... = ${ score }%`);

					return (S != '' && score >= passing) || (n? R(S, s, !n): n);
				},
				en = /^(u[ks]-?|utf8-?)?en(glish)?$/i;

			// Find an exact match: Title (Year) | #IMDbID
			let index, found, $data, lastscore;
			for(index = 0, found = false, $data, lastscore = 0; (title && year) && index < json.length && !found; rerun |= 0b0100, index++) {
				$data = json[index];

				let altt = ($data || {}).alternativeTitles,
					$alt = (altt && altt.length? altt.filter(v => t(v) == t(title))[0]: null);

				// Managers
				if(manable) {
					// Medusa
					if(__CONFIG__.usingMedusa && $data instanceof Array)
						found = ((t($data[4]) == t(title) || $alt) && +year == +$data[5].slice(0, 4))?
							$alt || $data:
						found;
					// Radarr & Sonarr
					else if(__CONFIG__.usingRadarr || __CONFIG__.usingSonarr)
						found = ((t($data.title) == t(title) || $alt) && +year == +$data.year)?
							$alt || $data:
						found;
					// Sick Beard
					else if(__CONFIG__.usingSickBeard)
						found = ((t($data.name) == t(title) || $alt) && +year == parseInt($data.first_aired))?
							$alt || $data:
						found;
				}
				//api.tvmaze.com/
				else if($data && ('externals' in ($data = $data.show || $data) || 'show' in $data) && $data.premiered)
					found = (iid == $data.externals.imdb || t($data.name) == t(title) && year == $data.premiered.slice(0, 4))?
						$data:
					found;
				//api.themoviedb.org/ \local
				else if($data && ('movie_results' in $data || 'tv_results' in $data || 'results' in $data) && $data.release_date)
					found = (DATA => {
						if(DATA.results)
							if(rqut == 'tmdb')
								DATA.movie_results = DATA.results;
							else
								DATA.tv_results = DATA.results;

						let i, f, o, l;

						for(i = 0, f = !1, o = DATA.movie_results, l = o.length | 0; i < l; i++)
							f = (t(o.title) == t(title) && o.release_date.slice(0, 4) == year);

						for(i = (+f * l), o = (f? o: DATA.tv_results), l = (f? l: o.length | 0); i < l; i++)
							f = (t(o.name) == t(title) && o.first_air_date.slice(0, 4) == year);

						return f? o: f = !!iid;
					})($data);
				//api.themoviedb.org/ \remote
				else if($data && ('original_name' in $data || 'original_title' in $data) && $data.release_date)
					found = (tid == $data.id || (t($data.original_name || $data.original_title) == t(title) || t($data.name) == t(title)) && year == ($data || b).release_date.slice(0, 4))?
						$data:
					found;
				//theimdbapi.org/
				else if($data && $data.release_date)
					found = (t($data.title) == t(title) && year == ($data.url || $data || b).release_date.slice(0, 4))?
						$data:
					found;

				UTILS_TERMINAL.LOG(`Strict Matching: ${ !!found }`, !!found? found: null);
			}

			// Find a close match: Title
			for(index = 0; title && index < json.length && (!found || lastscore > 0); rerun |= 0b0100, index++) {
				$data = json[index];

				let altt = ($data || {}).alternativeTitles,
					$alt = (altt && altt.length? altt.filter(v => c(v) == c(title)): null);

				// Managers
				if(manable) {
					// Medusa
					if(__CONFIG__.usingMedusa && $data instanceof Array)
						found = (c($data[4]) == c(title) || $alt)?
							$alt || $data:
						found;
					// Radarr & Sonarr
					if(__CONFIG__.usingRadarr || __CONFIG__.usingSonarr)
						found = (c($data.title) == c(title) || $alt)?
							$alt || $data:
						found;
					// Sick Beard
					if(__CONFIG__.usingSickBeard)
						found = (c($data.name) == c(title) || $alt)?
							$alt || $data:
						found;
				}
				//api.tvmaze.com/
				else if($data && ('externals' in ($data = $data.show || $data) || 'show' in $data))
					found =
						// ignore language barriers
						(c($data.name) == c(title))?
							$data:
						// trust the api matching
						($data.score > lastscore)?
							(lastscore = $data.score || $data.vote_count, $data):
						found;
				//api.themoviedb.org/ \local
				else if('movie_results' in $data || 'tv_results' in $data || 'results' in $data)
					found = (DATA => {
						let i, f, o, l;

						if(DATA.results)
							if(rqut == 'tmdb')
								DATA.movie_results = DATA.results;
							else
								DATA.tv_results = DATA.results;

						for(i = 0, f = !1, o = DATA.movie_results, l = o.length | 0; i < l; i++)
							f = (c(o.title) == c(title));

						for(i = (+f * l), o = (f? o: DATA.tv_results), l = (f? l: o.length | 0); i < l; i++)
							f = (c(o.name) == c(title));

						return f? o: f;
					})($data);
				//api.themoviedb.org/ \remote
				else if('original_name' in $data || 'original_title' in $data || 'name' in $data)
					found = (c($data.original_name || $data.original_title || $data.name) == c(title))?
						$data:
					found;
				//theimdbapi.org/
				else if(en.test($data.language))
					found = (c($data.title) == c(title))?
						$data:
					found;

				UTILS_TERMINAL.LOG(`Title Matching: ${ !!found }`, !!found? found: null);
			}

			// Find an OK match (Loose Searching): Title ~ Title
			// The examples below are correct
			// GOOD, found: VRV's "Bakemonogatari" vs. TVDb's "Monogatari Series"
				// /\b(monogatari)\b/i.test('bakemonogatari') === true
				// this is what this option was designed for
			// OK, found: "The Title of This is Bad" vs. "The Title of This is OK" (this is semi-errornous)
				// /\b(title|this|bad)\b/i.test('title this ok') === true
				// this may be a possible match, but it may also be an error: 'title' and 'this'
				// the user's defined threshold is used in this case (above 65% would match these two items)
			// BAD, not found: "Gun Show Showdown" vs. "Gundarr"
				// /\b(gun|showdown)\b/i.test('gundarr') === false
				// this should not match; the '\b' (border between \w and \W) keeps them from matching
			for(index = 0; __CONFIG__.UseLoose && title && index < json.length && (!found || lastscore > 0); rerun |= 0b0010, index++) {
				$data = json[index];

				let altt = ($data || {}).alternativeTitles,
					$alt = (altt && altt.length? altt.filter(v => R(v, title)): null);

				// Managers
				if(manable) {
					// Medusa
					if(__CONFIG__.usingMedusa && $data instanceof Array)
						found = (R($data[4], title) || $alt)?
							$alt || $data:
						found;
					// Radarr & Sonarr
					if(__CONFIG__.usingRadarr || __CONFIG__.usingSonarr)
						found = (R($data.name || $data.title, title) || $alt)?
							$alt || $data:
						found;
					// Sick Beard
					if(__CONFIG__.usingSickBeard)
						found = (R($data.name, title) || $alt)?
							$alt || $data:
						found;
				}
				//api.tvmaze.com/
				else if($data && ('externals' in ($data = $data.show || $data) || 'show' in $data))
					found =
						// ignore language barriers
						(R($data.name, title) || UTILS_TERMINAL.LOG('Matching:', [$data.name, title], R($data.name, title)))?
							$data:
						// trust the api matching
						($data.score > lastscore)?
							(lastscore = $data.score, $data):
						found;
				//api.themoviedb.org/ \local
				else if($data && ('movie_results' in $data || 'tv_results' in $data))
					found = (DATA => {
						let i, f, o, l;

						for(i = 0, f = !1, o = DATA.movie_results, l = o.length | 0; i < l; i++)
							f = R(o.title, title);

						for(i = (+f * l), o = (f? o: DATA.tv_results), l = (f? l: o.length | 0); i < l; i++)
							f = R(o.name, title);

						return f? o: f;
					})($data);
				//api.themoviedb.org/ \remote
				else if($data && ('original_name' in $data || 'original_title' in $data))
					found = (R($data.original_name, title) || R($data.original_title, title) || R($data.name, title))?
						$data:
					found;
				//theimdbapi.org/
				else if($data && en.test($data.language))
					found = (R($data.title, title))?
						$data:
					found;

				UTILS_TERMINAL.LOG(`Loose Matching: ${ !!found }`, !!found? found: null);
			}

			json = found;
		}

		if((json === undefined || json === null || json === false) && !(rerun & 0b0001))
			return UTILS_TERMINAL.WARN(`Trying to find "${ title }" again (as "${ (alttitle || title) }")`), rerun |= 0b0001, json = Identify({ title: (alttitle || title), year: YEAR, type, IMDbID, TMDbID, TVDbID, APIType, APIID, meta, rerun });
		else if((json === undefined || json === null))
			json = { IMDbID, TMDbID, TVDbID };

		let ei = 'tt',
			mr = 'movie_results',
			tr = 'tv_results';

		json = json && mr in json? json[mr].length > json[tr].length? json[mr]: json[tr]: json;

		if(json instanceof Array && (!__CONFIG__.usingMedusa? true: (__CONFIG__.usingSonarr || __CONFIG__.usingOmbi || __CONFIG__.usingSickBeard)))
			json = json[0];

		if(!json)
			json = { IMDbID, TMDbID, TVDbID };

		// Ombi, Medusa, Radarr and Sonarr
		if(manable)
			data = (
				(__CONFIG__.usingMedusa && !(__CONFIG__.usingSonarr || __CONFIG__.usingOmbi || __CONFIG__.usingSickBeard))?
					{
						imdb: iid || ei,
						tmdb: mid |  0,
						tvdb: tid || json[3] || (json[8]? json[8][1]: 0),
						title: json.title || title,
						year: +(json.year || year)
					}:
				{
					imdb: iid || json.imdbId || ei,
					tmdb: mid || json.tmdbId || json.theMovieDbId | 0,
					tvdb: tid || json.tvdbId || json.theTvDbId | 0,
					title: json.title || title,
					year: +(json.year || year)
				}
			);
		//api.tvmaze.com/
		else if('externals' in (json = json.show || json))
			data = {
				imdb: iid || json.externals.imdb || ei,
				tmdb: mid || json.externals.themoviedb | 0,
				tvdb: tid || json.externals.thetvdb | 0,
				title: json.name || title,
				year: ((json.premiered || json.first_aired_date || year) + '').slice(0, 4)
			};
		//api.themoviedb.org/
		else if('imdb_id' in (json = mr in json? json[mr].length > json[tr].length? json[mr]: json[tr]: json) || 'original_name' in json || 'original_title' in json)
			data = {
				imdb: iid || json.imdb_id || ei,
				tmdb: mid || json.id | 0,
				tvdb: tid || json.tvdb | 0,
				title: json.title || json.name || title,
				year: ((json.release_date || json.first_air_date || year) + '').slice(0, 4)
			};
		//omdbapi.com/
		else if('imdbID' in json)
			data = {
				imdb: iid || json.imdbID || ei,
				tmdb: mid || json.tmdbID | 0,
				tvdb: tid || json.tvdbID | 0,
				title: json.Title || json.Name || title,
				year: json.Year || year
			};
		//theapache64.com/movie_db/
		else if('data' in json)
			data = {
				imdb: iid || json.data.imdb_id || ei,
				tmdb: mid || json.data.tmdb_id | 0,
				tvdb: tid || json.data.tvdb_id | 0,
				title: json.data.name || json.data.title || title,
				year: json.data.year || year
			};
		//theimdbapi.org/
		else if('imdb' in json)
			data = {
				imdb: iid || json.imdb || ei,
				tmdb: mid || json.id   | 0,
				tvdb: tid || json.tvdb | 0,
				title,
				year
			};
		// given by the requesting service
		else
			data = {
				imdb: iid || ei,
				tmdb: mid | 0,
				tvdb: tid | 0,
				title,
				year
			};

		year = +((data.year + '').slice(0, 4)) || 0;
		data.year = year;

		let best = { title, year, data, type, rqut, score: json.score | 0 };

		UTILS_TERMINAL.LOG(`Best match: ${ url }`, { best, json });

		if(best.data.imdb == ei && best.data.tmdb == 0 && best.data.tvdb == 0)
			return UTILS_TERMINAL.ERROR(`No information was found for "${ title } (${ year })"`), {};

		save(savename, data); // e.g. "Coco (0)" on Netflix before correction / no repeat searches
		save(savename = `${title} (${year}).${rqut}`.toLowerCase(), data); // e.g. "Coco (2017)" on Netflix after correction / no repeat searches
		save(`${title}.${rqut}`.toLowerCase(), year);

		UTILS_TERMINAL.LOG(`Saved as "${ savename }"`, data);

		rerun |= 0b00001;

		return data;
	}

	function Request_CouchPotato(options) {
		// TODO: this does not work anymore!
		if(!options.IMDbID)
			return new Notification(
				'warning',
				'Stopped adding to CouchPotato: No IMDb ID'
			);

		chrome.runtime.sendMessage(
			{
				type: 'VIEW_COUCHPOTATO',
				url: `${ __CONFIG__.couchpotatoURL }/media.get`,
				IMDbID: options.IMDbID,
				TMDbID: options.TMDbID,
				TVDbID: options.TVDbID,
				basicAuth: __CONFIG__.couchpotatoBasicAuth,
			},
			response => {
				let movieExists = response.success;
				if(response.error) {
					new Notification(
						'warning',
						'CouchPotato request failed (see your console)'
					);
					return (!response.silent && UTILS_TERMINAL.error('Error viewing CouchPotato: ' + String(response.error)));
				}
				if(!movieExists) {
					__Request_CouchPotato__(options);
					return;
				}
				new Notification(
					'warning',
					`Movie already exists in CouchPotato (status: ${response.status})`
				);
			}
		);
	}

	// Movies/TV Shows
	function Request_Ombi(options) {
		new Notification('info', `Sending "${ options.title }" to Ombi`, 3000);

		if((!options.IMDbID && !options.TMDbID) && !options.TVDbID) {
			return new Notification(
				'warning',
				'Stopped adding to Ombi: No content ID'
			);
		}

		let contentType = (/movies?|film/i.test(options.type)? 'movie': 'tv');

		chrome.runtime.sendMessage({
				type: 'PUSH_OMBI',
				url: `${ __CONFIG__.ombiURL }api/v1/Request/${ contentType }`,
				token: __CONFIG__.ombiToken,
				title: options.title,
				year: options.year,
				imdbId: options.IMDbID,
				tmdbId: options.TMDbID,
				tvdbId: options.TVDbID,
				contentType,
			},
			response => {
				UTILS_TERMINAL.log('Pushing to Ombi', response);

				if(response && response.error) {
					new Notification('warning', `Could not add "${ options.title }" to Ombi: ${ response.error }`);
					return (!response.silent && UTILS_TERMINAL.error('Error adding to Ombi: ' + String(response.error), response.location, response.debug));
				} else if(response && response.success) {
					let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-{2,}/g, '-').toLowerCase(),
						{ IMDbID, TMDbID, TVDbID } = options;

					CAUGHT.bump({ IMDbID, TMDbID, TVDbID });

					UTILS_TERMINAL.LOG('Successfully pushed', options);
					new Notification('update', `Added "${ options.title }" to Ombi`, 7000, () => window.open(__CONFIG__.ombiURL, '_blank'));
				} else {
					new Notification('warning', `Could not add "${ options.title }" to Ombi: Unknown Error`);
					(!(response && response.silent) && UTILS_TERMINAL.error('Error adding to Ombi: ' + String(response)));
				}
			}
		);
	}

	// Movies/TV Shows
	function __Request_CouchPotato__(options) {
		new Notification('info', `Sending "${ options.title }" to CouchPotato`, 3000);

		chrome.runtime.sendMessage(
			{
				type: 'PUSH_COUCHPOTATO',
				url: `${ __CONFIG__.couchpotatoURL }/movie.add`,
				IMDbID: options.IMDbID,
				TMDbID: options.TMDbID,
				TVDbID: options.TVDbID,
				basicAuth: __CONFIG__.couchpotatoBasicAuth,
			},
			response => {
				UTILS_TERMINAL.log('Pushing to CouchPotato', response);

				if(response.error) {
					new Notification(
						'warning',
						`Could not add "${ options.title }" to CouchPotato (see your console)`
					);
					return (!response.silent && UTILS_TERMINAL.error('Error adding to CouchPotato: ' + String(response.error), response.location, response.debug));
				}
				if(response.success) {
					let { IMDbID, TMDbID, TVDbID } = options;

					CAUGHT.bump({ IMDbID, TMDbID, TVDbID });

					UTILS_TERMINAL.LOG('Successfully pushed', options);
					new Notification('update', `Added "${ options.title }" to CouchPotato`);
				} else {
					new Notification('warning', `Could not add "${ options.title }" to CouchPotato`);
				}
			}
		);
	}

	// Movies
	function Request_Watcher(options) {
		new Notification('info', `Sending "${ options.title }" to Watcher`, 3000);

		if(!options.IMDbID && !options.TMDbID) {
			return new Notification(
				'warning',
				'Stopped adding to Watcher: No IMDb/TMDb ID'
			);
		}

		chrome.runtime.sendMessage({
				type: 'PUSH_WATCHER',
				url: `${ __CONFIG__.watcherURL }api/`,
				token: __CONFIG__.watcherToken,
				StoragePath: __CONFIG__.watcherStoragePath,
				basicAuth: __CONFIG__.watcherBasicAuth,
				title: options.title,
				year: options.year,
				imdbId: options.IMDbID,
				tmdbId: options.TMDbID,
			},
			response => {
				UTILS_TERMINAL.log('Pushing to Watcher', response);

				if(response && response.error) {
					new Notification('warning', `Could not add "${ options.title }" to Watcher: ${ response.error }`);
					return (!response.silent && UTILS_TERMINAL.error('Error adding to Watcher: ' + String(response.error), response.location, response.debug));
				} else if(response && (response.success || (response.response + "") == "true")) {
					let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-{2,}/g, '-').toLowerCase(),
						TMDbID = options.TMDbID || response.tmdbId,
						IMDbID = options.IMDbID || response.imdbId;

					CAUGHT.bump({ IMDbID, TMDbID });

					UTILS_TERMINAL.LOG('Successfully pushed', options);
					new Notification('update', `Added "${ options.title }" to Watcher`, 7000, () => window.open(`${__CONFIG__.watcherURL}library/status${TMDbID? `#${title}-${TMDbID}`: '' }`, '_blank'));
				} else {
					new Notification('warning', `Could not add "${ options.title }" to Watcher: Unknown Error`);
					(!(response && response.silent) && UTILS_TERMINAL.error('Error adding to Watcher: ' + String(response)));
				}
			}
		);
	}

	// Movies
	function Request_Radarr(options, prompted) {
		if(!options.IMDbID && !options.TMDbID)
			return (!prompted)? new Notification(
				'warning',
				'Stopped adding to Radarr: No IMDb/TMDb ID'
			): null;

		let PromptValues = {},
			{ PromptQuality, PromptLocation } = __CONFIG__;

		if(!prompted && (PromptQuality || PromptLocation))
			return new Prompt('modify', options, refined => Request_Radarr(refined, true));

		if(PromptQuality && +options.quality > 0)
			PromptValues.QualityID = +options.quality;
		if(PromptLocation && options.location)
			PromptValues.StoragePath = JSON.parse(__CONFIG__.radarrStoragePaths).map(item => item.id == options.location? item: null).filter(n => n)[0].path.replace(/\\/g, '\\\\');

		new Notification('info', `Sending "${ options.title }" to Radarr`, 3000);

		chrome.runtime.sendMessage({
				type: 'PUSH_RADARR',
				url: `${ __CONFIG__.radarrURL }api/movie/`,
				token: __CONFIG__.radarrToken,
				StoragePath: __CONFIG__.radarrStoragePath,
				QualityID: __CONFIG__.radarrQualityProfileId,
				basicAuth: __CONFIG__.radarrBasicAuth,
				title: options.title,
				year: options.year,
				imdbId: options.IMDbID,
				tmdbId: options.TMDbID,
				...PromptValues
			},
			response => {
				UTILS_TERMINAL.log('Pushing to Radarr', response);

				if(response && response.error) {
					new Notification('warning', `Could not add "${ options.title }" to Radarr: ${ response.error }`);
					return (!response.silent && UTILS_TERMINAL.error('Error adding to Radarr: ' + String(response.error), response.location, response.debug));
				} else if(response && response.success) {
					let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-{2,}/g, '-').toLowerCase(),
						TMDbID = options.TMDbID || response.tmdbId,
						IMDbID = options.IMDbID || response.imdbId;

					CAUGHT.bump({ IMDbID, TMDbID });

					UTILS_TERMINAL.LOG('Successfully pushed', options);
					new Notification('update', `Added "${ options.title }" to Radarr`, 7000, () => window.open(`${__CONFIG__.radarrURL}${TMDbID? `movies/${title}-${TMDbID}`: '' }`, '_blank'));
				} else {
					new Notification('warning', `Could not add "${ options.title }" to Radarr: Unknown Error`);
					(!(response && response.silent) && UTILS_TERMINAL.error('Error adding to Radarr: ' + String(response)));
				}
			}
		);
	}

	// TV Shows
	function Request_Sonarr(options, prompted) {
		if(!options.TVDbID)
			return (!prompted)? new Notification(
				'warning',
				'Stopped adding to Sonarr: No TVDb ID'
			): null;

		let PromptValues = {},
			{ PromptQuality, PromptLocation } = __CONFIG__;

		if(!prompted && (PromptQuality || PromptLocation))
			return new Prompt('modify', options, refined => Request_Sonarr(refined, true));

		if(PromptQuality && +options.quality > 0)
			PromptValues.QualityID = +options.quality;
		if(PromptLocation && options.location)
			PromptValues.StoragePath = JSON.parse(__CONFIG__.sonarrStoragePaths).map(item => item.id == options.location? item: null).filter(n => n)[0].path.replace(/\\/g, '\\\\');

		new Notification('info', `Sending "${ options.title }" to Sonarr`, 3000);

		chrome.runtime.sendMessage({
				type: 'PUSH_SONARR',
				url: `${ __CONFIG__.sonarrURL }api/series/`,
				token: __CONFIG__.sonarrToken,
				StoragePath: __CONFIG__.sonarrStoragePath,
				QualityID: __CONFIG__.sonarrQualityProfileId,
				basicAuth: __CONFIG__.sonarrBasicAuth,
				title: options.title,
				year: options.year,
				tvdbId: options.TVDbID,
				...PromptValues
			},
			response => {
				UTILS_TERMINAL.log('Pushing to Sonarr', response);

				if(response && response.error) {
					new Notification('warning', `Could not add "${ options.title }" to Sonarr: ${ response.error }`);
					return (!response.silent && UTILS_TERMINAL.error('Error adding to Sonarr: ' + String(response.error), response.location, response.debug));
				} else if(response && response.success) {
					let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-{2,}/g, '-').toLowerCase(),
						TVDbID = options.TVDbID || response.tvdbId;

					CAUGHT.bump({ TVDbID });

					UTILS_TERMINAL.LOG('Successfully pushed', options);
					new Notification('update', `Added "${ options.title }" to Sonarr`, 7000, () => window.open(`${__CONFIG__.sonarrURL}series/${title}`, '_blank'));
				} else {
					new Notification('warning', `Could not add "${ options.title }" to Sonarr: Unknown Error`);
					(!(response && response.silent) && UTILS_TERMINAL.error('Error adding to Sonarr: ' + String(response)));
				}
			}
		);
	}

	// TV Shows
	function Request_Medusa(options, prompted) {
		if(!options.TVDbID)
			return (!prompted)? new Notification(
				'warning',
				'Stopped adding to Medusa: No TVDb ID'
			): null;

		let PromptValues = {},
			{ PromptQuality, PromptLocation } = __CONFIG__;

		if(!prompted && (PromptQuality || PromptLocation))
			return new Prompt('modify', options, refined => Request_Medusa(refined, true));

		if(PromptQuality && +options.quality > 0)
			PromptValues.QualityID = +options.quality;
		if(PromptLocation && options.location)
			PromptValues.StoragePath = JSON.parse(__CONFIG__.medusaStoragePaths).map(item => item.id == options.location? item: null).filter(n => n)[0].path.replace(/\\/g, '\\\\');

		new Notification('info', `Sending "${ options.title }" to Medusa`, 3000);

		chrome.runtime.sendMessage({
				type: 'PUSH_MEDUSA',
				url: `${ __CONFIG__.medusaURL }api/v2/series`,
				root: `${ __CONFIG__.medusaURL }api/v2/`,
				token: __CONFIG__.medusaToken,
				StoragePath: __CONFIG__.medusaStoragePath,
				QualityID: __CONFIG__.medusaQualityProfileId,
				basicAuth: __CONFIG__.medusaBasicAuth,
				title: options.title,
				year: options.year,
				tvdbId: options.TVDbID,
				...PromptValues
			},
			response => {
				UTILS_TERMINAL.log('Pushing to Medusa', response);

				if(response && response.error) {
					new Notification('warning', `Could not add "${ options.title }" to Medusa: ${ response.error }`);
					return (!response.silent && UTILS_TERMINAL.error('Error adding to Medusa: ' + String(response.error), response.location, response.debug));
				} else if(response && response.success) {
					let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-{2,}/g, '-').toLowerCase(),
						TVDbID = options.TVDbID || response.tvdbId;

					CAUGHT.bump({ TVDbID });

					UTILS_TERMINAL.LOG('Successfully pushed', options);
					new Notification('update', `Added "${ options.title }" to Medusa`, 7000, () => window.open(`${__CONFIG__.medusaURL}home/displayShow?indexername=tvdb&seriesid=${options.TVDbID}`, '_blank'));
				} else {
					new Notification('warning', `Could not add "${ options.title }" to Medusa: Unknown Error`);
					(!(response && response.silent) && UTILS_TERMINAL.error('Error adding to Medusa: ' + String(response)));
				}
			}
		);
	}

	// TV Shows
	function Request_SickBeard(options, prompted) {
		if(!options.TVDbID)
			return (!prompted)? new Notification(
				'warning',
				'Stopped adding to Sick Beard: No TVDb ID'
			): null;

		let PromptValues = {},
			{ PromptQuality, PromptLocation } = __CONFIG__;

		if(!prompted && (PromptQuality || PromptLocation))
			return new Prompt('modify', options, refined => Request_SickBeard(refined, true));

		if(PromptQuality && +options.quality > 0)
			PromptValues.QualityID = +options.quality;
		if(PromptLocation && +options.location >= 0)
			PromptValues.StoragePath = JSON.parse(__CONFIG__.sickBeardStoragePaths)[+options.location].path.replace(/\\/g, '\\\\');

		new Notification('info', `Sending "${ options.title }" to Sick Beard`, 3000);

		COMPRESS = options.UseLZW;
		CAUGHT = __CONFIG__.__caught;
		CAUGHT = JSON.parse(COMPRESS? decompress(CAUGHT): CAUGHT);

		chrome.runtime.sendMessage({
				type: 'PUSH_SICKBEARD',
				url: `${ __CONFIG__.sickBeardURL }api/${ __CONFIG__.sickBeardToken }/`,
				token: __CONFIG__.sickBeardToken,
				StoragePath: __CONFIG__.sickBeardStoragePath,
				QualityID: __CONFIG__.sickBeardQualityProfileId,
				basicAuth: __CONFIG__.sickBeardBasicAuth,
				title: options.title,
				year: options.year,
				tvdbId: options.TVDbID,
				exists: !!~CAUGHT.tvdb.indexOf(options.TVDbID),
				...PromptValues
			},
			response => {
				UTILS_TERMINAL.log('Pushing to Sick Beard', response);

				if(response && response.error) {
					new Notification('warning', `Could not add "${ options.title }" to Sick Beard: ${ response.error }`);
					return (!response.silent && UTILS_TERMINAL.error('Error adding to Sick Beard: ' + String(response.error), response.location, response.debug));
				} else if(response && response.success) {
					let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-{2,}/g, '-').toLowerCase(),
						TVDbID = options.TVDbID || response.tvdbId;

					CAUGHT.bump({ TVDbID });

					UTILS_TERMINAL.LOG('Successfully pushed', options);
					new Notification('update', `Added "${ options.title }" to Sick Beard`, 7000, () => window.open(`${__CONFIG__.sickBeardURL}home/displayShow?show=${ TVDbID }`, '_blank'));
				} else {
					new Notification('warning', `Could not add "${ options.title }" to Sick Beard: Unknown Error`);
					(!(response && response.silent) && UTILS_TERMINAL.error('Error adding to Sick Beard: ' + String(response)));
				}
			}
		);
	}

	// make the button
	// ( PERSISTENT, { HEADER_CLASSES } )
	let MASTER_BUTTON;
	function RenderButton(persistent, headers = {}) {
		let existingButtons = document.queryBy('.web-to-plex-button'),
			firstButton = existingButtons.first;

		if(existingButtons.length && !persistent)
			[].slice.call(existingButtons).forEach(button => button.remove());
		else if(persistent && firstButton !== null && firstButton !== undefined)
			return firstButton;

		let { __theme } = __CONFIG__;

		let ThemeClasses = JSON.parse(COMPRESS? decompress(__theme): __theme),
			HeaderClasses = [],
			ParsedAttributes = {};

		// Theme(s)
		if(!ThemeClasses.length)
			ThemeClasses = '';
		else
			ThemeClasses = '.' + ThemeClasses.join('.');

		ThemeClasses = ThemeClasses.split('.').filter(v => {
			let R = RegExp;

			if(/([^=]+?)=([^.]+?)/.test(v)) {
				ParsedAttributes[R.$1] = R.$2;

				return false;
			}

			return true;
		}).join('.');

		// Header(s)
		for(let header in headers)
			if(headers[header])
				HeaderClasses.push( header );

		if(!HeaderClasses.length)
			HeaderClasses = '';
		else
			HeaderClasses = '.' + HeaderClasses.join('.');

		// <button>
		let button =
			furnish(`button.show.closed.floating.web-to-plex-button${HeaderClasses}${ThemeClasses}`, {
				...ParsedAttributes,
				onmouseenter: event => {
					let self = event.target;

					self.classList.remove('closed');
					self.classList.add('open', 'animate');
				},
				onmouseleave: event => {
					let self = event.target;

					self.classList.remove('open', 'animate');
					self.classList.add('closed');
				},
				style: `background-image: url(${ IMG_URL.noise_background }), url(${ IMG_URL.background }); background-size: auto, cover;`
			},
			// <ul>
			furnish('ul', {},
				// <li>
				furnish('li#wtp-list-name.list-name', {},
					furnish('a.list-action', { tooltip: 'Web to Plex' }, furnish(`img[alt=Web to Plex]`, { src: IMG_URL.icon_48 }))
				),

				furnish('li#wtp-plexit.list-item', {
					tooltip: 'Open Plex It!',
					onmouseup: event => {
						let self = event.target, parent = button;

						(d=>{let s=d.createElement('script'),h=d.querySelector('head');s.type='text/javascript';s.src='//ephellon.github.io/plex.it.js';h.appendChild(s)})(document);
					}
				},
				furnish('img[alt=Favorite]', { src: IMG_URL.plexit_icon_48, onmouseup: event => event.target.parentElement.click() }) // <img/>
				),

				furnish('li#wtp-hide.list-item', {
					tooltip: 'Hide Web to Plex',
					onmouseup: event => {
						let self = $('#wtp-hide').first, state = self.getAttribute('state') || 'show';

						button.classList.remove(state);

						self.setAttribute('tooltip', state.toCaps() + ' Web to Plex');

						let img = self.querySelector('img');

						img && (img.src = state == 'show'? IMG_URL.show_icon_48: IMG_URL.hide_icon_48);

						if(state == 'show') {
							state = 'hide';
						} else {
							state = 'show';
						}

						button.classList.add(state);
						self.setAttribute('state', state);
					}
				},
				furnish('img[alt=Hide]', { src: IMG_URL.hide_icon_48, onmouseup: event => event.target.parentElement.click() }) // <img/>
				),

				furnish('li#wtp-refresh.list-item', {
					tooltip: 'Reload Web to Plex',
					onmouseup: event => {
						let self = event.target, parent = button;

						if(init instanceof Function)
							button.setAttribute('class', 'closed floating web-to-plex-button restarting'), button.onmouseenter = button.onmouseleave = null, button.querySelector('.list-action').setAttribute('tooltip', 'Restarting...'), setTimeout(() => (init && !RUNNING? (init(), RUNNING = true): RUNNING = false), 500);
						else
							new Notification('warning', "Couldn't reload. Please refresh the page.");
					}
				},
				furnish('img[alt=Reload]', { src: IMG_URL.reload_icon_48, onmouseup: event => event.target.parentElement.click() }) // <img/>
				),

				furnish('li#wtp-options.list-item', {
					tooltip: 'Open settings',
					onmouseup: event => {
						let self = event.target, parent = button;

						return Options();
					}
				},
				furnish('img[alt=Settings]', { src: IMG_URL.settings_icon_48, onmouseup: event => event.target.parentElement.click() }) // <img/>
				)
				// </li>
			)
			// </ul>
		);
		// </button>

		document.body.appendChild(button);

		return MASTER_BUTTON = button;
	}

	function UpdateButton(button, action, title, options = {}) {
		if(!button)
			return /* Rare, but happens: especially on failed download links sent */;

		let multiple = (action == 'multiple' || options instanceof Array),
			element = button.querySelector('.w2p-action, .list-action'),
			delimeter = '<!---->',
			ty = 'Item', txt = 'title', hov = 'tooltip',
			em = /^(tt|0)?$/i,
			tv = /tv[\s-]?|shows?|series/i;

		if(!element) {
			element = button;
			button = element.parentElement;
		};

		Update('SEARCH_FOR', { ...options, button });

		/* Handle a list of items */
		if(multiple) {
			options = [].slice.call(options);

			let saved_options = [], // a list of successful searches (not on Plex)
				len = options.length,
				s = (len == 1? '': 's'),
				t = [];

			for(let index = 0; index < len; index++) {
				let option = options[index];

				// Skip empty entries
				if(!option || !option.type || !option.title)
					continue;

				// Skip queued entries
				if(
					!!~CAUGHT.imdb.indexOf(option.IMDbID) ||
					!!~CAUGHT.tmdb.indexOf(option.TMDbID) ||
					!!~CAUGHT.tvdb.indexOf(option.TVDbID)
				)
					continue;

				// the action should be an array
				// we'll give the button a list of links to engage, so make it snappy!
				let url = `#${ option.IMDbID || 'tt' }-${ option.TMDbID | 0 }-${ option.TVDbID | 0 }`;

				/* Failed */
				if(/#tt-0-0/i.test(url))
					continue;

				saved_options.push(option);
				t.push(option.title);
			}

			t = t.join(', ');
			t = t.length > 24? t.slice(0, 21).replace(/\W+$/, '') + '...': t;

			element.ON_CLICK = e => {
				e.preventDefault();

				let self = e.target, tv = /tv[\s-]?|shows?|series/i, fail = 0,
					options = JSON.parse(decode(button.getAttribute('saved_options')));

				for(let index = 0, length = options.length, option; index < length; index++) {
					option = options[index];

					try {
						if(__CONFIG__.usingOmbi)
							Request_Ombi(option, true);
						else if(__CONFIG__.usingWatcher && !tv.test(option.type))
							Request_Watcher(option, true);
						else if(__CONFIG__.usingRadarr && !tv.test(option.type))
							Request_Radarr(option, true);
						else if(__CONFIG__.usingCouchPotato && !tv.test(option.type))
							Request_CouchPotato(option, true);
						else if(__CONFIG__.usingSonarr && tv.test(option.type))
							Request_Sonarr(option, true);
						else if(__CONFIG__.usingMedusa && tv.test(option.type))
							Request_Medusa(option, true);
						else if(__CONFIG__.usingSickBeard && tv.test(option.type))
							Request_SickBeard(option, true);

						button.classList.replace('wtp--download', 'wtp--queued');
					} catch(error) {
						UTILS_TERMINAL.error(`Failed to get "${ option.title }" (Error #${ ++fail })`)
					}
				}
				NOTIFIED = false;

				if(fail)
					new Notification('error', `Failed to grab ${ fail } item${fail==1?'':'s'}`);
			};

			button.setAttribute('saved_options', encode(JSON.stringify(saved_options)));
			element.addEventListener('click', e => (AUTO_GRAB.ENABLED && AUTO_GRAB.LIMIT > options.length)? element.ON_CLICK(e): new Prompt('select', options, o => { button.setAttribute('saved_options', encode(JSON.stringify(o))); element.ON_CLICK(e) }));

			element.setAttribute(hov, `Grab ${len} new item${s}: ${ t }`);
			button.classList.add(saved_options.length || len? 'wtp--download': 'wtp--error');
		} else {
		/* Handle a single item */

			if(!options || !options.type || !options.title)
				return;

			let empty = (em.test(options.IMDbID) && em.test(options.TMDbID) && em.test(options.TVDbID)),
				nice_title = `${options.title.toCaps()}${options.year? ` (${options.year})`: ''}`;

			if(options) {
				ty = (/^(cine(ma)?|films?|movies?|theat[re]{2})$/i.test(options.type)? 'Movie': 'TV Show');
				txt = options.txt || txt;
				hov = options.hov || hov;
			}

			if(action == 'found') {
				element.href = Request_PlexURL(__CONFIG__.server.id, options.key);
				element.setAttribute(hov, `Watch "${options.title} (${options.year})" on Plex`);
				button.classList.add('wtp--found');

				new Notification('success', `Watch "${ nice_title }"`, 7000, e => element.click(e));
			} else if(action == 'downloader' || options.remote) {

				switch(options.remote) {
					/* Vumoo & GoStream */
					case 'plex':
					case 'oload':
					case 'fembed':
					case 'consistent':
					case 'gounlimited':
						let href = options.href, path = '';

						if(__CONFIG__.usingOmbi) {
							path = '';
						} else if(__CONFIG__.usingWatcher && !tv.test(options.type)) {
							path = '';
						} else if(__CONFIG__.usingRadarr && !tv.test(options.type)) {
							path = __CONFIG__.radarrStoragePath;
						} else if(__CONFIG__.usingSonarr && tv.test(options.type)) {
							path = __CONFIG__.sonarrStoragePath;
						} else if(__CONFIG__.usingMedusa && tv.test(options.type)) {
							path = __CONFIG__.medusaStoragePath;
						} else if(__CONFIG__.usingSickBeard && tv.test(options.type)) {
							path = __CONFIG__.sickBeardStoragePath;
						} else if(__CONFIG__.usingCouchPotato) {
							path = '';
						}

						element.href = `#${ options.IMDbID || 'tt' }-${ options.TMDbID | 0 }-${ options.TVDbID | 0 }`;

						button.classList.remove('wtp--queued');
						button.classList.add('wtp--download');

						element.removeEventListener('click', element.ON_CLICK);
						element.addEventListener('click', element.ON_DOWNLOAD = e => {
							e.preventDefault();

							Update('DOWNLOAD_FILE', { ...options, button, href, path });
							new Notification('update', 'Opening prompt (may take a while)...');
						});

						element.setAttribute(hov, `Download "${ nice_title }" | ${ty}`);
						Update('SAVE_AS', { ...options, button, href, path });
						new Notification('update', `"${ nice_title }" can be downloaded`, 7000, e => element.click(e));
						return;


					/* Default & Error */
					default:
						let url = `#${ options.IMDbID || 'tt' }-${ options.TMDbID | 0 }-${ options.TVDbID | 0 }`;

						/* Failed */
						if(/#tt-0-0/i.test(url))
							return UpdateButton(button, 'notfound', title, options);

						element.href = url;
						button.classList.add('wtp--download');
						element.addEventListener('click', element.ON_CLICK = e => {
							e.preventDefault();
							try {
								if(__CONFIG__.usingOmbi)
									Request_Ombi(options);
								else if(__CONFIG__.usingWatcher && !tv.test(options.type))
									Request_Watcher(options);
								else if(__CONFIG__.usingRadarr && !tv.test(options.type))
									Request_Radarr(options);
								else if(__CONFIG__.usingCouchPotato && !tv.test(options.type))
									Request_CouchPotato(options);
								else if(__CONFIG__.usingSonarr && tv.test(options.type))
									Request_Sonarr(options);
								else if(__CONFIG__.usingMedusa && tv.test(options.type))
									Request_Medusa(options);
								else if(__CONFIG__.usingSickBeard && tv.test(options.type))
									Request_SickBeard(options);

								button.classList.replace('wtp--download', 'wtp--queued');
							} catch(error) {
								throw error;
							}

						});
				}
				NOTIFIED = false;

				element.setAttribute(hov, `Add "${ nice_title }" | ${ty}`);
				element.style.removeProperty('display');
			} else if(action == 'notfound' || action == 'error' || empty) {
				element.removeAttribute('href');

				empty = !(options && options.title);

				if(empty)
					element.setAttribute(hov, `${ty || 'Item'} not found`);
				else
					element.setAttribute(hov, `"${ nice_title }" was not found`);

				button.classList.remove('wtp--found');
				button.classList.add('wtp--error');
			}

			if((action == 'downloader') && (!!~CAUGHT.imdb.indexOf(options.IMDbID) || !!~CAUGHT.tmdb.indexOf(options.TMDbID) || !!~CAUGHT.tvdb.indexOf(options.TVDbID))) {
				element.setAttribute(hov, `Modify "${ nice_title }" | ${ty}`);

				button.classList.remove('wtp--found');
				button.classList.add('wtp--queued');
			}

			element.id = options? `${options.IMDbID || 'tt'}-${options.TMDbID | 0}-${options.TVDbID | 0}`: 'tt-0-0';
		}
	}

	// Find media on Plex
	async function FindMediaItems(options = [], button) {
		if(!(options.length && button))
			return;

		let results = [],
			length = options.length,
			queries = (FindMediaItems.queries = FindMediaItems.queries || {});

		FindMediaItems.OPTIONS = options;

		let query = JSON.stringify(options);

		query = (queries[query] = queries[query] || {});

		if(query.running === true)
			return;
		else if(query.results) {
			let { results, multiple, items } = query;

			new Notification('update', `Welcome back. ${ multiple } new ${ items } can be grabbed`, 7000, (event, target = button.querySelector('.list-action')) => target.click({ ...event, target }));

			if(multiple)
				UpdateButton(button, 'multiple', `Download ${ multiple } ${ items }`, results);

			return;
		}

		query.running = true;

		new Notification('info', `Processing ${ length } item${ 's'[+(length === 1)] || '' }...`);

		for(let index = 0, option, opt; index < length; index++) {
			let { IMDbID, TMDbID, TVDbID } = (option = await options[index]);

			opt = { name: option.title, title: option.title, year: option.year, image: options.image, type: option.type, imdb: IMDbID, IMDbID, tmdb: TMDbID, TMDbID, tvdb: TVDbID, TVDbID };

			try {
				await Request_Plex(option)
					.then(async({ found, key }) => {
						if(found) {
							// ignore found items, we only want new items
						} else {
							option.field = 'original_title';

							return await Request_Plex(option)
								.then(({ found, key }) => {
									if(found) {
										// ignore found items, we only want new items
									} else {
										let available = (__CONFIG__.usingOmbi || __CONFIG__.usingWatcher || __CONFIG__.usingRadarr || __CONFIG__.usingSonarr || __CONFIG__.usingMedusa || __CONFIG__.usingSickBeard || __CONFIG__.usingCouchPotato),
											action = (available? 'downloader': 'notfound'),
											title = available?
												'Not on Plex (download available)':
											'Not on Plex (download not available)';

										results.push({ ...opt, found: false, status: action });
									}
								});
						}
					})
					.catch(error => { throw error });
			} catch(error) {
				UTILS_TERMINAL.error('Request to Plex failed: ' + String(error));
				// new Notification('error', 'Failed to query item #' + (index + 1));
			}
		}

		results = results.filter(v => v.status == 'downloader');

		let img = furnish('img', { title: 'Add to Plex It!', src: IMG_URL.plexit_icon_48, onmouseup: event => {let frame = document.querySelector('#plexit-bookmarklet-frame'); frame.src = frame.src.replace(/(#plexit:.*)?$/, '#plexit:' + event.target.parentElement.getAttribute('data'))} }),
			po, pi = furnish('li#plexit.list-item', { data: encode(JSON.stringify(results)) }, img),
			op  = document.querySelector('#wtp-plexit');

		if(po = button.querySelector('#plexit'))
			po.remove();
		try {
			button.querySelector('ul').insertBefore(pi, op);
		} catch(e) { /* Don't do anything */ }

		let multiple = results.length,
			items = multiple == 1? 'item': 'items';

		new Notification('update', `Done. ${ multiple } new ${ items } can be grabbed`, 7000, (event, target = button.querySelector('.list-action')) => target.click({ ...event, target }));

		query.running = false;
		query.results = results;
		query.multiple = multiple;
		query.items = items;

		if(multiple)
			UpdateButton(button, 'multiple', `Download ${ multiple } ${ items }`, results);
	}

	async function FindMediaItem(options = {}) {
		if(!(options.title))
			return;

		let { IMDbID, TMDbID, TVDbID } = options;

		TMDbID = +TMDbID;
		TVDbID = +TVDbID;

		let opt = { name: options.title, year: options.year, image: options.image || IMG_URL.nil, type: options.type, imdb: IMDbID, IMDbID, tmdb: TMDbID, TMDbID, tvdb: TVDbID, TVDbID },
			op  = document.querySelector('#wtp-plexit'),
			img = (options.image)?
				furnish('div', { tooltip: 'Add to Plex It!', style: `background: url(${ IMG_URL.plexit_icon_16 }) top right/60% no-repeat, #0004 url(${ opt.image }) center/contain no-repeat; height: 48px; width: 34px;`, draggable: true, onmouseup: event => {let frame = document.querySelector('#plexit-bookmarklet-frame'); frame.src = frame.src.replace(/(#plexit:.*)?$/, '#plexit:' + event.target.parentElement.getAttribute('data'))} }):
			furnish('img', { title: 'Add to Plex It!', src: IMG_URL.plexit_icon_48, onmouseup: event => {let frame = document.querySelector('#plexit-bookmarklet-frame'); frame.src = frame.src.replace(/(#plexit:.*)?$/, '#plexit:' + event.target.parentElement.getAttribute('data'))} });

		FindMediaItem.OPTIONS = options;

		try {
			return Request_Plex(options).then(({ found, key }) => {
				if(found) {
					UpdateButton(options.button, 'found', 'On Plex', { ...options, key });
					opt = { ...opt, url: options.button.href, found: true, status: 'found' };

					let po, pi = furnish('li#plexit.list-item', { data: encode(JSON.stringify(opt)) }, img);

					if(po = options.button.querySelector('#plexit'))
						po.remove();
					try {
						options.button.querySelector('ul').insertBefore(pi, op);
					} catch(e) { /* Don't do anything */ }
				} else {
					options.field = 'original_title';

					return Request_Plex(options).then(({ found, key }) => {
						if(found) {
							UpdateButton(options.button, 'found', 'On Plex', { ...options, key });
							opt = { ...opt, url: options.button.href, found: true, status: 'found' };

							let po, pi = furnish('li#plexit.list-item', { data: encode(JSON.stringify(opt)) }, img);

							if(po = options.button.querySelector('#plexit'))
								po.remove();
							try {
								options.button.querySelector('ul').insertBefore(pi, op);
							} catch(e) { /* Don't do anything */ }
						} else {
							let available = (__CONFIG__.usingOmbi || __CONFIG__.usingWatcher || __CONFIG__.usingRadarr || __CONFIG__.usingSonarr || __CONFIG__.usingMedusa || __CONFIG__.usingSickBeard || __CONFIG__.usingCouchPotato),
								action = (available ? 'downloader' : 'notfound'),
								title = available ?
									'Not on Plex (download available)':
								'Not on Plex (download not available)';

							UpdateButton(options.button, action, title, options);
							opt = { ...opt, found: false, status: action };

							let po, pi = furnish('li#plexit.list-item', { data: encode(JSON.stringify(opt)) }, img);

							if(po = options.button.querySelector('#plexit'))
								po.remove();
							if(!!~[].slice.call(options.button.querySelector('ul').children).indexOf(op))
								try {
									options.button.querySelector('ul').insertBefore(pi, op);
								} catch(e) { /* Don't do anything */ }
						}

						return found;
					});
				}

				return found;
			})
			.catch(error => { throw error });
		} catch(error) {
			return UpdateButton(
					options.button,
					'error',
					'Request to Plex Media Server failed',
					options
				),
				UTILS_TERMINAL.error(`Request to Plex failed: ${ String(error) }`),
				false;
				// new Notification('Failed to communicate with Plex');
		}
	}

	function Request_Plex(options) {
		if(!(__CONFIG__.plexURL && __CONFIG__.plexToken) || __CONFIG__.IGNORE_PLEX)
			return new Promise((resolve, reject) => resolve({ found: false, key: null }));

		return new Promise((resolve, reject) => {
			// Sanitize the object
			options = JSON.parse( JSON.stringify(options) );

			UTILS_TERMINAL.LOG('Searching for item on Plex', options);

			chrome.runtime.sendMessage({
					type: 'SEARCH_PLEX',
					options,
					serverConfig: __CONFIG__.server
				},
				response =>
					(response && response.error)?
						reject(response.error):
					(!response)?
						reject(new Error(`Unknown error: ${ response }`)):
					resolve(response)
				);
			});
	}

	function Request_PlexURL(PlexUIID, key) {
		return __CONFIG__.plexURL.replace(RegExp(`\/(${ __CONFIG__.server.id })?$`), `/web#!/server/` + PlexUIID) + `/details?key=${encodeURIComponent( key )}`;
	}

	/* Listen for events */
	chrome.runtime.onMessage.addListener(async(request, sender) => {
		UTILS_TERMINAL.LOG(`Listener event [${ request.instance_type }#${ request[request.instance_type.toLowerCase()] }]:`, request);

		let data = request.data,
			LOCATION = `${ request.name || 'anonymous' } @ instance ${ request.instance }`,
			PARSING_ERROR = `Can't parse missing information. ${ LOCATION }`,
			BUTTON_ERROR  = `The button failed to render. ${ LOCATION }`,
			EMPTY_REQUEST = `The given request is empty. ${ LOCATION }`;

		if(!data)
			return UTILS_TERMINAL.WARN(EMPTY_REQUEST);
		let button = RenderButton();

		if(!button)
			return UTILS_TERMINAL.WARN(BUTTON_ERROR);
		button.classList.remove('sleeper');

		switch(request.type) {
			case 'POPULATE':
				if(data instanceof Array) {
					for(let index = 0, length = data.length, item; index < length; index++)
						if(!(item = data[index]) || !item.type)
							data.splice(index, 1, null);

					data = data.filter(value => value !== null && value !== undefined);

					for(let index = 0, length = data.length, item; index < length; index++) {
						let { image, type, title, year, IMDbID, TMDbID, TVDbID } = (item = data[index]);

						if(!item.title || !item.type)
							continue;

						let Db = await Identify(item);

						IMDbID = IMDbID || Db.imdb || 'tt';
						TMDbID = TMDbID || Db.tmdb || 0;
						TVDbID = TVDbID || Db.tvdb || 0;

						title = title || Db.title;
						year = +(year || Db.year || 0);

						data.splice(index, 1, { type, title, year, image, button, IMDbID, TMDbID, TVDbID });
					}

					if(!data.length)
						return UTILS_TERMINAL.ERROR(PARSING_ERROR);
					else
						FindMediaItems(data, button);
				} else {
					if(!data || !data.title || !data.type)
						return UTILS_TERMINAL.ERROR(PARSING_ERROR);

					let { image, type, title, year, IMDbID, TMDbID, TVDbID } = data;
					let Db = await Identify(data);

					IMDbID = IMDbID || Db.imdb || 'tt';
					TMDbID = TMDbID || Db.tmdb || 0;
					TVDbID = TVDbID || Db.tvdb || 0;

					title = title || Db.title;
					year = +(year || Db.year || 0);

					let found = await FindMediaItem({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
					Update('FOUND', { ...request, found }, true);
				}
				return true;

			case 'INITIALIZE':
				UTILS_TERMINAL.LOG('Told to reinitialize...');
				init && init();
				return true;

			case 'NO_RENDER':
				UTILS_TERMINAL.WARN('Told to stop rendering...');
				document.queryBy('.web-to-plex-button').map(e => e.remove());
				return true;

			default:
	//			UTILS_TERMINAL.WARN(`Unknown utils event [${ request.type }]`);
				return false;
		}
	});

	/* Listen for Window events - from iframes, etc. */
	top.addEventListener('message', async request => {
		try {
			request = request.data;

			switch(request.type) {
				case 'SEND_VIDEO_LINK':
					let options = { ...FindMediaItem.OPTIONS, href: request.href, remote: request.from };

					UTILS_TERMINAL.LOG(`Download Event [${ options.remote }]:`, options);

					UpdateButton(MASTER_BUTTON, 'downloader', 'Download', options);
					return true;

				case 'NOTIFICATION':
					let { state, text, timeout = 7000, callback = () => {}, requiresClick = true } = request.data;
					new Notification(state, text, timeout, callback, requiresClick);
					return true;

				case 'PERMISSION':
					let { data } = request,
						{ instance } = data;

					if(typeof instance != 'string' || !/[\da-z]{64,}/i.test(instance))
						throw `Incorrect instance [${ instance.slice(0, 7) }]`;

					if(typeof data.allowed == 'boolean') {
						ALLOWED = data.allowed;
						PERMISS = data.allotted;

						await ParsedOptions();

						(init && !RUNNING? (init(), RUNNING = true): RUNNING = false);
					} else {
						UTILS_TERMINAL.WARN('Permission Request:', data);
						new Prompt('permission', data);
					}
					return true;

				default:
		//			UTILS_TERMINAL.WARN(`Unknown utils event [${ request.type }]`);
					return false;
			}
		} catch(error) {
			new Notification('error', `Unable to use downloader: ${ String(error) }`);
			throw error
		}
	});

	// create the sleeping button
	wait(() => document.readyState === 'complete', () => RenderButton(null, { sleeper: true }));

})(new Date);

/* Helpers */

/* LZW Compression Algorithm */
function compress(string = '') {
	let dictionary = {},
		phrases    = (string + ''),
		phrase     = phrases[0],
		medium     = [],
		output     = [],
		index      = 255,
		character;

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

function wait(on, then) {
	if(on && ((on instanceof Function && on()) || true))
		then && then();
	else
		setTimeout(() => wait(on, then), 50);
}

// the custom "on location change" event
function watchlocationchange(subject) {
	let locationchangecallbacks = watchlocationchange.locationchangecallbacks;

	watchlocationchange[subject] = watchlocationchange[subject] || location[subject];

	if(watchlocationchange[subject] != location[subject]) {
		let from = watchlocationchange[subject],
			to = location[subject],
			properties = { from, to },
			sign = code => (code + '').replace(/\W+/g, '').toLowerCase();

		watchlocationchange[subject] = location[subject];

		for(let index = 0, length = locationchangecallbacks.length, callback, exists, signature; length > 0 && index < length; index++) {
			callback = locationchangecallbacks[index];
			exists = locationchangecallbacks.exists[signature = sign(callback)];

			let event = new Event('locationchange', { bubbles: true });

			if(!exists && typeof callback == 'function') {
				/* The eventlistener does not exist */
				window.addEventListener('beforeunload', event => {
					event.preventDefault(false);
					callback({ event, ...properties });
				});
			} else {
				/* The eventlistener already exists */
				callback({ event, ...properties });
			}

			open(to, '_self');
		}
	}
}
watchlocationchange.locationchangecallbacks = watchlocationchange.locationchangecallbacks || [];
watchlocationchange.locationchangecallbacks.exists = watchlocationchange.locationchangecallbacks.exists || {};

if(!('onlocationchange' in window))
	Object.defineProperty(window, 'onlocationchange', {
		set: callback => {
			if(typeof callback != 'function')
				return null;

			let signature = (callback + '').replace(/\W+/g, '').toLowerCase();

			if(!watchlocationchange.locationchangecallbacks.exists[signature]) {
				watchlocationchange.locationchangecallbacks.exists[signature] = true;

				return watchlocationchange.locationchangecallbacks.push(callback);
			}
			return null;
		},
		get: () => watchlocationchange.locationchangecallbacks
	});

watchlocationchange.onlocationchangeinterval = watchlocationchange.onlocationchangeinterval || setInterval(() => watchlocationchange('href'), 1000);
// at least 1s is needed to properly fire the event ._.

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

(function(parent) {
/* SortBy.js */
/** Usage + Example
 // document.queryBy( selectors )...

 let index = 0;
 // the order given is the order handled
 document.queryBy("div:last-child, div:nth-child(2), div:first-child")
	.forEach((element, index, array) => element.innerHTML = index + 1);

 // output w/sortBySelector:
 <div>3</div>
 <div>2</div>
 <div>1</div> <!-- handles the last div first, like the selector -->

 // output w/o sortBySelector:
 <div>1</div>
 <div>2</div>
 <div>3</div>
 */
	parent.queryBy = parent.queryBy || function queryBy(selectors, container = document) {
		// Helpers
		let copy  = array => [...array],
			query = (SELECTORS, CONTAINER = container) => CONTAINER.querySelectorAll(SELECTORS);

		// Get rid of enclosing syntaxes: [...] and (...)
		let regexp = /(\([^\(\)]+?\)|\[[^\[\]]+?\])/g,
			pulled = [],
			media  = [],
			index, length;

		// The index shouldn't be longer than the length of the selector's string
		// Keep this to prevent infinite loops
		for(index = 0, length = selectors.length; index++ < length && regexp.test(selectors);)
			selectors = selectors.replace(regexp, ($0, $1, $$, $_) => '\b--' + pulled.push($1) + '\b');

		let order	   = selectors.split(','),
			dummy	   = copy(order),
			output	  = [],
			generations = 0,
			cousins		= 0;

		// Replace those syntaxes (they were ignored)
		for(index = 0, length = dummy.length, order = [], regexp = /[\b]--(\d+)[\b]/g; index < length; index++)
			order.push(dummy[index].replace(regexp, ($0, $1, $$, $_) => pulled[+$1 - 1]));

		// Make sure to put the elements in order
		// Handle the :parent (pseudo) selector
		for(index = 0, length = order.length; index < length; generations = 0, cousins = 0, index++) {
			let selector = order[index], ancestor, cousin;

			selector = selector
			// siblings
			.replace(/\:nth-sibling\((\d+)\)/g, ($0, $1, $$, $_) => (cousins += +$1, ''))
			.replace(/(\:{1,2}(next-|previous-)?sibling)/g, ($0, $1, $2, $$, $_) => (cousins += ($2 == 'next'? 1: -1), ''))
			// parents
			.replace(/\:nth-parent\((\d+)\)/g, ($0, $1, $$, $_) => (generations -= +$1, ''))
			.replace(/(\:{1,2}parent\b|<\s*(\s*(,|$)))/g, ($0, $$, $_) => (--generations, ''))
			.replace(/<([^<,]+)?/g, ($0, $1, $$, $_) => (ancestor = $1, --generations, ''))
			// miscellaneous
			.replace(/^\s+|\s+$/g, '');

			let elements = [].slice.call(query(selector)),
				parents = [], parent,
				siblings = [], sibling;

			// Parents
			for(; generations < 0; generations++)
				elements = elements.map(element => {
					let P = element, Q = (P? P.parentElement: {}), R = (Q? Q.parentElement: {}),
						E = C => [...query(ancestor, C)],
						F, G;

					for(let I = 0, L = -generations; ancestor && !!R && !!Q && !!P && I < L; I++)
						parent = !!~E(R).indexOf(Q)? Q: G;

					for(let I = 0, L = -generations; !ancestor && !!Q && !!P && I < L; I++)
						Q = (parent = P = Q).parentElement;

					if((generations === 0 || /\*$/.test(ancestor)) && !~parents.indexOf(parent))
						parents.push(parent);

					return parent;
				});

			// Siblings
			if(cousins === 0)
				/* Do nothing */;
			else if(cousins < 0)
				for(; cousins < 0; cousins++)
					elements = elements.map(element => {
						let P = element, Q = (P? P.previousElementSibling: {}),
							F, G;

						for(let I = 0, L = -cousins; !!Q && !!P && I < L; I++)
							Q = (sibling = P = Q).previousElementSibling;

						if(cousins === 0 && !~siblings.indexOf(sibling))
							siblings.push(sibling);

						return sibling;
					});
			else
				for(; cousins > 0; cousins--)
					elements = elements.map(element => {
						let P = element, Q = (P? P.nextElementSibling: {}),
							F, G;

						for(let I = 0, L = -cousins; !!Q && !!P && I > L; I--)
							Q = (sibling = P = Q).nextElementSibling;

						if(cousins === 0 && !~siblings.indexOf(sibling))
							siblings.push(sibling);

						return sibling;
					});

			media.push(parents.length? parents: elements);
			media.push(siblings.length? siblings: elements);
			order.splice(index, 1, selector);
		}

		// Create a continuous array from the sub-arrays
		for(index = 1, length = media.length; index < length; index++)
			media.splice(0, 1, copy(media[0]).concat( copy(media[index]) ));
		output = [].slice.call(media[0]).filter( value => value );

		// Remove repeats
		for(index = 0, length = output.length, media = []; index < length; index++)
			if(!~media.indexOf(output[index]))
			media.push(output[index]);

		let properties = { writable: false, enumerable: false, configurable: false };

		Object.defineProperties(media, {
			first: {
				value: media[0],
				...properties
			},
			last: {
				value: media[media.length - 1],
				...properties
			},
			child: {
				value: index => media[index - 1],
				...properties
			},
			empty: {
				value: !media.length,
				...properties
			},
		});

		return media;
	};

/** Adopted from <https://github.com/crislin2046/createElement>
 * LICENSE: MIT (2018)
 */
	parent.furnish = parent.furnish || function furnish(TAGNAME, ATTRIBUTES = {}, ...CHILDREN) {
		let u = v => v && v.length, R = RegExp, name = TAGNAME, attributes = ATTRIBUTES, children = CHILDREN;

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
					R.$1.split('][').forEach(N => attributes[(N = N.replace(/\s*=\s*(?:("?)([^]*)\1)?/, '=$2').split('=', 2))[0]] = N[1] || '');
		name = name[0];

		let element = document.createElement(name, options);

		if(attributes.classList instanceof Array)
			attributes.classList = attributes.classList.join(' ');

		Object.entries(attributes).forEach(
			([name, value]) => (/^(on|(?:(?:inner|outer)(?:HTML|Text)|textContent|class(?:List|Name)|value)$)/.test(name))?
				(typeof value == 'string' && /^on/.test(name))?
					(() => {
						try {
							/* Can't make a new function(eval) */
							element[name] = new Function('', value);
						} catch (__error) {
							try {
								/* Not a Chrome (extension) state */
								chrome.tabs.getCurrent(tab => chrome.tabs.executeScript(tab.id, { code: `document.furnish.__cache__ = () => {${ value }}` }, __cache__ => element[name] = __cache__[0] || parent.furnish.__cache__ || value));
							} catch (_error) {
								throw __error, _error;
							}
						}
					})():
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
					element.appendChild(
						parent.createTextNode(child)
					)
			);

		return element;
	}
})(document);

let PRIMITIVE = Symbol.toPrimitive,
	queryBy = document.queryBy,
	furnish = document.furnish;

queryBy[PRIMITIVE] = furnish[PRIMITIVE] = String.prototype.toCaps[PRIMITIVE] = () => "function <foreign>() { [foreign code] }";

if(chrome.runtime.lastError)
	chrome.runtime.lastError.message;
