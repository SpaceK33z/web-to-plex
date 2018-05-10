/* eslint-disable no-unused-vars */
/* global config */
function wait(check, then) {
    if (check()) {
        then();
    } else {
        setTimeout(() => wait(check, then), 1000);
    }
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

async function getIDs({ title, year, type, IMDbID, APIID }) {
    let json = {},
        data = {},
        promise;

    type = type || '*';

    let url =
        (type === 'imdb' || (type === '*' && !IMDbID && title && year))?
            `https://www.theimdbapi.org/api/find/movie?title=${ title }&year=${ year }`:
        (type === 'thetvdb' || APIID || (type === '*' && (IMDbID || (title && year))))?
            (IMDbID)?
                `https://api.themoviedb.org/3/find/${IMDbID}?api_key=bcb95f026f9a01ffa707fcff71900e94&external_source=imdb_id`:
            `https://api.tvmaze.com/${ (APIID)? `shows/${APIID}`: `search/shows?q=${ title }`}`:
        null;

    if(url === null) return 0;

    await fetch(`${url}`)
        .then(response => {
            return response.json();
        })
        .catch(error => {
            throw error;
        })
        .then(objects => {
            return json = objects;
        });

    json = ('movie_results' in json)?
        json.movie_results:
    ('tv_results' in json)?
        json.tv_results:
    json;

    if(json instanceof Array) {
        let crush = (string) => string.toLowerCase().replace(/\&/g, 'and').replace(/\W+/g, '');

        // Find an exact match: Title (Year) | #IMDbID
        for(var index = 0, found = false, $data; index < json.length && !found; index++) {
            $data = json[index];

            //api.tvmaze.com/
            if('show' in $data)
                found = (IMDbID === $data.show.externals.imdb || ($data.show.name === title && year === $data.show.premiered.slice(0, 4)))?
                    $data:
                found;
            //api.themoviedb.org/
            else if('movie_results' in $data || 'tv_results' in $data)
                found = (DATA => {
                    for(var i = 0, f = !1, o = DATA.movie_results, l = o.length | 0; i < l; i++)
                        f = (o.title === title && o.release_date.slice(0, 4) == year);

                    for(i = (+f * l), o = (f? o: DATA.tv_results), l = (f? l: o.length | 0); i < l; i++)
                        f = (o.name === title && o.first_air_date.slice(0, 4) == year);

                    return f? o: f;
                })($data);
            //theimdbapi.org/
            else
                found = (IMDbID === $data.imdb_id || $data.title === title && year === $data.year)?
                    $data:
                found;
        }

        // Find a close match: Title
        for(index = 0; index < json.length && !found; index++) {
            $data = json[index];

            //api.tvmaze.com/
            if('show' in $data)
                found = (crush($data.show.name) == crush(title))?
                    $data:
                found;
            //api.themoviedb.org/
            else if('movie_results' in $data || 'tv_results' in $data)
                found = (DATA => {
                    for(var i = 0, f = !1, o = DATA.movie_results, l = o.length | 0; i < l; i++)
                        f = (crush(o.title) == crush(title));

                    for(i = (+f * l), o = (f? o: DATA.tv_results), l = (f? l: o.length | 0); i < l; i++)
                        f = (crush(o.name) == crush(title));

                    return f? o: f;
                })($data);
            //theimdbapi.org/
            else
                found = (crush($data.title) == crush(title))?
                    $data:
                found;
        }

        json = found;
    }

    if('show' in json)
        data = json.show.externals;
    else if('imdb_id' in json)
        data = {
            imdb: IMDbID || json.imdb_id,
            thetvdb: 0
        };
    else
        data = {
            imdb: IMDbID || 'tt-',
            thetvdb: json.id || 0
        };

    type = (type === '*')? null: type;

    return type ? data[type]: data;
}

var lastNotification = 0;

function showNotification(state, text, timeout, callback) {
    if (lastNotification) {
        clearTimeout(lastNotification);
        lastNotification = null;
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
    lastNotification = setTimeout(el.onclick, timeout || 7000);
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

// TV Shows
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

// Movies
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
                return showNotification('warning', 'Could not add to Radarr: ' + response.error),
                    console.error('Error adding to Radarr:', response.error, response.location);
            } else if (response && response.success) {
                let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').toLowerCase(),
                    TVDbID = options.TVDbID;

                showNotification('info', 'Added movie to Radarr', 0, () => window.open(`${config.radarrURL}movies/${title}-${TVDbID}`, '_blank'));
            } else {
                showNotification('warning', 'Could not add to Radarr: Unknown Error');
            }
        }
    );
}

// TV Shows
function pushSonarrRequest(options) {
    if (!options.TVDbID) {
        return showNotification(
            'warning',
            'Stopped adding to Sonarr: No TVDb ID'
        );
    }

    chrome.runtime.sendMessage({
            type: 'ADD_SONARR',
            url: `${ config.sonarrURL }api/series`,
            IMDbID: options.IMDbID,
            TVDbID: options.TVDbID,
            token: config.sonarrToken,
            StoragePath: config.sonarrStoragePath,
            QualityProfileId: config.sonarrQualityProfileId,
            basicAuth: config.sonarrBasicAuth
        },
        response => {
            if (response && response.error) {
                return showNotification('warning', 'Could not add to Sonarr: ' + response.error),
                    console.error('Error adding to Sonarr:', response.error, response.location);
            } else if (response && response.success) {
                let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').toLowerCase();

                showNotification('info', 'Added series to Sonarr', 0, () => window.open(`${config.sonarrURL}series/${title}`, '_blank'));
            } else {
                showNotification('warning', 'Could not add to Sonarr: Unknown Error');
            }
        }
    );
}

function modifyPlexButton(el, action, title, options) {
    if (el instanceof Array) {
        return el.forEach(e => modifyPlexButton(e, action, title, options));
    }

    let pa = null,
        ty = (options? (options.type === 'show'? 'TV Show': 'Movie'): 'Item');

    if (action === 'found') {
        el.href = getPlexMediaURL(config.server.id, options.key);
        el.textContent = 'Watch on Plex';
        el.title = `Watch "${options.title}" on Plex`;
        el.classList.add('web-to-plex-button--found');
        el.parentElement.classList.replace('web-to-plex-wrapper', 'web-to-plex-wrapper--found');
    } else if (action === 'notfound' || action === 'error') {
        el.removeAttribute('href');
        el.textContent = action === 'notfound' ? ty + ' not available' : 'Web to Plex+';
        el.title = `${ty} was not found`;
        el.classList.remove('web-to-plex-button--found');
        el.parentElement.classList.replace('web-to-plex-wrapper--found', 'web-to-plex-wrapper');
    } else if (action === 'downloader') {
        if (options.remote) {
            let delimeter = '<!---->',
                xhr = new XMLHttpRequest(),
                data;

            xhr.open('POST', options.remote);

            switch(options.locale) {

                /* Flenix */
                case 'flenix':
                    el.href = '#';
                    el.textContent = 'Save File #0/0';
                    el.classList.add('web-to-plex-button--downloader');

                    let $data = document.querySelector('#videoplayer ~ script').innerText;

                    data = $data
                        .replace(/[^]*\{\s*(hash.+?)\}[^]+/, '$1')
                        .replace(/\s+/g, '')
                        .replace(/(?:^|,)(\w+)\:/g, '&$1=')
                        .replace(/^&|["']/g, '');

                    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                    xhr.callback = function(response) {
                        let dum = [], tl;

                        el.hrefs = response.split(',http')
                            .join(delimeter + 'http')
                            .split(delimeter)
                            .forEach(value => (/\.html?$/i.test(value)? null: dum.push(value)));

                        el.hrefs = dum;
                        el.download = `${options.title} (${options.year})`;
                        el.href = el.hrefs.slice(0, el.index = 1);
                        tl = (el.href.replace(/.*(?:\.(\w+))$/, '$1') || 'mp3').toUpperCase();
                        el.textContent = el.textContent.replace(/\d+\/.+?$/, `${el.index}/${el.hrefs.length} (${tl})`);
                        el.hrefs = el.hrefs.join(delimeter);
                    };

                    el.addEventListener('click', e => {
                        e.preventDefault();
                        let el = e.target,
                            hs = el.hrefs.split(delimeter),
                            tl;

                        if (hs.length == 1 || el.index == hs.length) {
                            el.index = 0;
                        }
                        if (/\.html?$/i.test(hs[el.index])) {
                            hs.splice(index, 1);
                            el.click();
                        }

                        el.href = hs.slice(el.index, 1);
                        tl = (el.href.replace(/.*(?:\.(\w+))$/, '$1') || 'mp3').toUpperCase();
                        el.textContent = el.textContent.replace(/\d+\/.+?$/, `${++el.index}/${hs.length} (${tl})`);
                    });
                    break;


                /* Default & Error */
                default:
                    return modifyPlexButton(el, action, title, {
                        ...options,
                        locale: null,
                        remote: null
                    });
            }

            xhr.onload = function() {
                if (xhr.status !== 200) {
                    return modifyPlexButton(el, action, title, {
                        ...options,
                        locale: null,
                        remote: null
                    });
                }

                xhr.callback(xhr.response);
            }

            xhr.send(data);
        } else {
            el.href = '#';
            el.textContent = 'Download ' + ty;
            el.classList.add('web-to-plex-button--downloader');
            el.addEventListener('click', e => {
                e.preventDefault();
                if (config.radarrURL && options.type === 'movie') {
                    pushRadarrRequest(options);
                } else if (config.sonarrURL && options.type === 'show') {
                    pushSonarrRequest(options);
                } else if(config.couchpotatoURL && options.type === 'show') {
                    $pushAddToCouchpotato(options);
                }
            });
        }

        el.title = `Add "${options.title}" to your ${ty}s`;
        el.id = `${options.IMDbID || 'tt-'}-${options.TVDbID || 0}`;
        el.style.removeProperty('display');
    }
}

function findPlexMedia(options) {
    getPlexMediaRequest(options)
        .then(({ found, key }) => {
            if (found) {
                modifyPlexButton(options.button, 'found', 'On Plex', { ...options, key });
            } else {
                options.field = 'original_title';

                return getPlexMediaRequest(options)
                    .then(({ found, key }) => {
                        if (found) {
                            modifyPlexButton(options.button, 'found', 'On Plex', { ...options, key });
                        } else {
                            let available = (config.radarrURL || config.sonarrURL || config.couchpotatoURL),
                                action = available ? 'downloader' : 'notfound',
                                title = available ?
                                    'Not on Plex (download available)':
                                'Not on Plex (download not available)';

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

function getPlexMediaURL(plexMachineId, key) {
    return `https://app.plex.tv/web/app#!/server/${ plexMachineId }/details?key=${encodeURIComponent( key )}`;
}
