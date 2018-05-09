/* eslint-disable no-unused-vars */
/* global config */
function wait(check, then) {
    if (check()) {
        then();
    } else {
        setTimeout(() => wait(check, then), 5000);
    }
}

function getPlexMediaRequest({ button, ...mediaOption }) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
                type: 'SEARCH_PLEX',
                options: mediaOption,
                serverConfig: config.server,
            },
            response => {
                if (response.error) {
                    reject(response.error);
                }
                resolve(response);
            });
    });
}

function $getOptions() {
    const storage = chrome.storage.sync || chrome.storage.local;

    return new Promise((resolve, reject) => {
        function handleOptions(items) {
            if (!items.plexToken || !items.servers)
                return reject(new Error('Options are undefined')),
                    null;

            // For now we support only one Plex server, but the options already
            // allow multiple for easy migration in the future.
            let server = items.servers[0],
                options = {
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
            if (items.radarrBasicAuthUsername)
                options.radarrBasicAuth = {
                    username: items.radarrBasicAuthUsername,
                    password: items.radarrBasicAuthPassword,
                };

            if (items.sonarrBasicAuthUsername)
                options.sonarrBasicAuth = {
                    username: items.sonarrBasicAuthUsername,
                    password: items.sonarrBasicAuthPassword,
                };

            if (items.couchpotatoURLRoot && items.couchpotatoToken) {
                options.couchpotatoURL = `${ items.couchpotatoURLRoot }/api/${encodeURIComponent(items.couchpotatoToken)}`;
            }

            if (items.radarrURLRoot && items.radarrToken) {
                options.radarrURL = items.radarrURLRoot;
                options.radarrToken = items.radarrToken;
            }

            if (items.sonarrURLRoot && items.sonarrToken) {
                options.sonarrURL = items.sonarrURLRoot;
                options.sonarrToken = items.sonarrToken;
            }

            options.radarrStoragePath = items.radarrStoragePath;
            options.radarrQualityProfileId = items.radarrQualityProfileId;
            options.sonarrStoragePath = items.sonarrStoragePath;
            options.sonarrQualityProfileId = items.sonarrQualityProfileId;

            resolve(options);
        }
        storage.get(null, items => {
            if (chrome.runtime.lastError) {
                chrome.storage.local.get(null, handleOptions);
            } else {
                handleOptions(items);
            }
        });
    });
}

function openOptionsPage() {
    chrome.runtime.sendMessage({
        type: 'OPEN_OPTIONS'
    });
}

var config = null;

function parseOptions() {
    return $getOptions()
        .then(
            options => config = options,
            error => {
                showNotification(
                    'warning',
                    'Fill in missing Web to Plex+ options',
                    15000,
                    openOptionsPage
                );
                throw error;
            }
        );
}

function getPlexMediaURL(plexMachineId, key) {
    return `https://app.plex.tv/web/app#!/server/${ plexMachineId }/details?key=${encodeURIComponent( key )}`;
}

let notificationTimeout = 0;

function showNotification(state, text, timeout, callback) {
    if (notificationTimeout) {
        clearTimeout(notificationTimeout);
        notificationTimeout = null;
    }

    let existingEl = document.querySelector('.web-to-plex-notification');
    if (existingEl) {
        document.body.removeChild(existingEl);
    }

    let el = document.createElement('div');
    el.classList.add('web-to-plex-notification');
    el.onclick = () => {
        el.remove();
        callback && callback();
    };

    if (state === 'warning') {
        el.classList.add('web-to-plex-warning');
    }

    el.textContent = text;
    document.body.appendChild(el);
    notificationTimeout = setTimeout(el.onclick, timeout || 5000);
}

function $pushAddToCouchpotato(options) {
	// TODO: this does not work anymore!
	if (!options.IMDbID)
		return showNotification(
			'warning',
			'Stopped adding to CouchPotato: No IMDb ID.'
		);

	chrome.runtime.sendMessage(
		{
			type: 'VIEW_COUCHPOTATO',
			url: config.couchpotatoURL + '/media.get',
			IMDbID: options.IMDbID,
			basicAuth: config.couchpotatoBasicAuth,
		},
		response => {
			let movieExists = response.success;
			if (response.error) {
				return showNotification(
					'warning',
					'CouchPotato request failed (see your console)'
				),
				console.error('Error with viewing on CouchPotato:', response.error);
			}
			if (!movieExists) {
				pushCouchPotatoRequest(options);
				return;
			}
			showNotification(
				'info',
				`Movie is already in CouchPotato (status: ${response.status})`
			);
		}
	);
}

function pushCouchPotatoRequest(options) {
	chrome.runtime.sendMessage(
		{
			type: 'ADD_COUCHPOTATO',
			url: `${config.couchpotatoURL}/movie.add`,
			IMDbID: options.IMDbID,
			basicAuth: config.couchpotatoBasicAuth,
		},
		response => {
			if (response.error) {
				return showNotification(
					'warning',
					'Could not add to CouchPotato (see your console)'
				),
				console.error('Error with adding on CouchPotato:', response.error);
			}
			if (response.success) {
				showNotification('info', 'Added movie on CouchPotato.');
			} else {
				showNotification('warning', 'Could not add to CouchPotato.');
			}
		}
	);
}

function pushRadarrRequest(options) {
    if (!options.IMDbID) {
        return showNotification(
            'warning',
            'Stopped adding to Radarr: No IMDb ID'
        );
    }

    chrome.runtime.sendMessage({
            type: 'ADD_RADARR',
            url: `${ config.radarrURL }api/movie`,
            IMDbID: options.IMDbID,
            token: config.radarrToken,
            StoragePath: config.radarrStoragePath,
            QualityProfileId: config.radarrQualityProfileId,
            basicAuth: config.radarrBasicAuth
        },
        response => {
            if (response && response.error) {
                return showNotification('warning', 'Could not add to Radarr\n' + response.error),
                    console.error('Error adding to Radarr:', response.error, response.location);
            } else if (response && response.success) {
                showNotification('info', 'Added movie to Radarr');
            } else {
                showNotification('warning', 'Could not add to Radarr: Unknown Error');
            }
        }
    );
}

function pushSonarrRequest(options) {
    if (!options.IMDbID) {
        return showNotification(
            'warning',
            'Stopped adding to Sonarr: No IMDb ID'
        );
    }

    chrome.runtime.sendMessage({
            type: 'ADD_SONARR',
            url: `${ config.sonarrURL }api/series`,
            IMDbID: options.IMDbID,
            token: config.sonarrToken,
            StoragePath: config.sonarrStoragePath,
            QualityProfileId: config.sonarrQualityProfileId,
            basicAuth: config.sonarrBasicAuth
        },
        response => {
            if (response && response.error) {
                return showNotification('warning', 'Could not add to Sonarr\n' + response.error),
                    console.error('Error adding to Sonarr:', response.error, response.location);
            } else if (response && response.success) {
                showNotification('info', 'Added series to Sonarr');
            } else {
                showNotification('warning', 'Could not add to Sonarr: Unknown Error');
            }
        }
    );
}

function modifyPlexButton(els, action, title, options) {
    if (els instanceof Array) {
        return els.forEach(e => modifyPlexButton(e, action, title, options));
    }

    let pa = null,
        el = els;

    if (action === 'found') {
        el.href = getPlexMediaURL(config.server.id, options.key);
        el.textContent = 'On Plex';
        el.classList.add('web-to-plex-button--found');
        el.parentElement.classList.replace('web-to-plex-wrapper', 'web-to-plex-wrapper--found');
    } else if (action === 'notfound' || action === 'error') {
        el.removeAttribute('href');
        el.textContent = action === 'notfound' ? 'Not on Plex' : 'Web to Plex+';
        el.title = 'The Movie/TV Show was not found';
        el.classList.remove('web-to-plex-button--found');
        el.parentElement.classList.replace('web-to-plex-wrapper--found', 'web-to-plex-wrapper');
    } else if (action === 'downloader') {
        if (options.locale === 'flenix' && options.remote) {
            el.href = '#';
            el.textContent = 'Save File #0/0';
            el.classList.add('web-to-plex-button--downloader');

            let $data = document.querySelector('#videoplayer ~ script')
                .innerText;

            let data = $data
                .replace(/[^]*\{(hash.+?)\}[^]+/, '$1')
                .replace(/\s+/g, '')
                .replace(/(?:^|,)(\w+)\:/g, '&$1=')
                .replace(/^&|["']/g, '');

            let xhr = new XMLHttpRequest(),
                dum = [];

            xhr.open('POST', options.remote);
            xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
            xhr.onload = function() {
                if (xhr.status !== 200) {
                    return modifyPlexButton(el, action, title, { ...options,
                        locale: null,
                        remote: null
                    });
                }

                el.hrefs = xhr.responseText.split(',http')
                    .join('<!---->http')
                    .split('<!---->')
                    .forEach(value => (/\.html?$/i.test(value)? null: dum.push(value)));

                el.hrefs = dum;
                el.download = `${options.title} (${options.year})`;
                el.href = el.hrefs.slice(0, el.index = 1);
                el.textContent = el.textContent.replace(/\d+\/\d+/, `${el.index}/${el.hrefs.length}`);
                el.hrefs = el.hrefs.join('<!---->');
            }

            xhr.send(data);
            el.addEventListener('click', e => {
                e.preventDefault();
                let el = e.target,
                    hs = el.hrefs.split('<!---->');

                if (hs.length == 1 || el.index == hs.length) {
                    el.index = 0;
                }
                if (/\.html?$/i.test(hs[el.index])) {
                    hs.splice(index, 1);
                    el.click();
                }

                el.href = hs.slice(el.index, 1);
                el.textContent = el.textContent.replace(/\d+\/\d+/, `${++el.index}/${hs.length}`);
            });
        } else {
            el.href = '#';
            el.textContent = 'Download';
            el.classList.add('web-to-plex-button--downloader');
            el.addEventListener('click', e => {
                e.preventDefault();
                if (config.radarrURL) {
                    pushRadarrRequest(options);
                } else if (config.sonarrURL) {
                    pushSonarrRequest(options);
                } else {
                    $pushAddToCouchpotato(options);
                }
            });
        }

        if (title) {
            el.title = title;
        }

        el.style.removeProperty('display');
    }
}

function findPlexMedia(options) {
    getPlexMediaRequest(options)
        .then(({ found, key }) => {
            if (found) {
                modifyPlexButton(options.button, 'found', 'Found on Plex', { key });
            } else {
                options.field = 'original_title';
                return getPlexMediaRequest(options)
                    .then(({ found, key }) => {
                        if (found) {
                            modifyPlexButton(options.button, 'found', 'Found on Plex', key);
                        } else {
                            let available = (config.radarrURL || config.sonarrURL || config.couchpotatoURL),
                                action = available ? 'downloader' : 'notfound',
                                title = available ?
                                'Not on Plex (available)' :
                                'Not on Plex (not available)';
                            modifyPlexButton(options.button, action, title, options);
                        }
                    });
            }
        })
        .catch(error => {
            return modifyPlexButton(
                    options.button,
                    'error',
                    'Request to Plex Media Server failed'
                ),
                console.error('Request to Plex failed', error);
        });
}
