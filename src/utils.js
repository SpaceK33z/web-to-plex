/* eslint-disable no-unused-vars */
/* global config */
function wait(check, then) {
    if (check())
        then();
    else
        setTimeout(() => wait(check, then), 50);
}

let date = new Date(),
    terminal =
//                { error: m => m, info: m => m, log: m => m, warn: m => m } ||
                console;

let YEAR = date.getFullYear(),
    MONTH = date.getMonth() + 1,
    DATE = date.getDate();

function watchlocationchange() {
    watchlocationchange.pathname = watchlocationchange.pathname || location.pathname;

    if(watchlocationchange.pathname != location.pathname) {
        watchlocationchange.pathname = location.pathname;
        if(window.onlocationchange)
            return window.onlocationchange(new Event('locationchange', { bubbles: true }));
    }
}

setInterval(watchlocationchange, 1000); // at least 1s is needed to properly fire the event :/

function load(name) {
    return JSON.parse((sessionStorage || localStorage).getItem('Web-to-Plex@' + name));
}

function save(name, data) {
    return (sessionStorage || localStorage).setItem('Web-to-Plex@' + name, JSON.stringify(data));
}

function sendUpdate(type, options = {}) {
    terminal.log(`Requesting update: ${ type }`, options);

    chrome.runtime.sendMessage({
        type,
        options
    });
}

function $getOptions() {
    const storage = chrome.storage.sync || chrome.storage.local;

    return new Promise((resolve, reject) => {
        function handleOptions(options) {
            if (!options.plexToken || !options.servers)
                return reject(new Error('Options are undefined')),
                    null;

            // For now we support only one Plex server, but the options already
            // allow multiple for easy migration in the future.
            let server = options.servers[0],
                o = {
                    server: {
                        ...server,
                        // Compatibility for users who have not updated their settings yet.
                        connections: server.connections || [{ uri: server.url }]
                    },
                    ...options
                };

            options.plexURL = o.plexURL?
                `${ o.plexURL }web/#!/server/${ o.server.id }/`:
            `https://app.plex.tv/web/app#!/server/${ o.server.id }/`;

            if (o.couchpotatoBasicAuthUsername)
                o.couchpotatoBasicAuth = {
                    username: o.couchpotatoBasicAuthUsername,
                    password: o.couchpotatoBasicAuthPassword
                };

            // TODO: stupid copy/pasta
            if (o.watcherBasicAuthUsername)
                o.watcherBasicAuth = {
                    username: o.watcherBasicAuthUsername,
                    password: o.watcherBasicAuthPassword
                };

            if (o.radarrBasicAuthUsername)
                o.radarrBasicAuth = {
                    username: o.radarrBasicAuthUsername,
                    password: o.radarrBasicAuthPassword
                };

            if (o.sonarrBasicAuthUsername)
                o.sonarrBasicAuth = {
                    username: o.sonarrBasicAuthUsername,
                    password: o.sonarrBasicAuthPassword
                };

            if (o.couchpotatoURLRoot && o.couchpotatoToken) {
                o.couchpotatoURL = `${ items.couchpotatoURLRoot }/api/${encodeURIComponent(o.couchpotatoToken)}`;
            } else {
                o.couchpotatoURL = ""; // prevent variable ghosting
            }

            if (o.watcherURLRoot && o.watcherToken) {
                o.watcherURL = o.watcherURLRoot;
            } else {
                o.watcherURL = ""; // prevent variable ghosting
            }

            if (o.radarrURLRoot && o.radarrToken) {
                o.radarrURL = o.radarrURLRoot;
            } else {
                o.radarrURL = ""; // prevent variable ghosting
            }

            if (o.sonarrURLRoot && o.sonarrToken) {
                o.sonarrURL = o.sonarrURLRoot;
            } else {
                o.sonarrURL = ""; // prevent variable ghosting
            }

            o.radarrStoragePath = o.radarrStoragePath;
            o.radarrQualityProfileId = o.radarrQualityProfileId;
            o.sonarrStoragePath = o.sonarrStoragePath;
            o.sonarrQualityProfileId = o.sonarrQualityProfileId;

            resolve(o);
        }

        storage.get(null, options => {
            if (chrome.runtime.lastError)
                chrome.storage.local.get(null, handleOptions);
            else
                handleOptions(options);
        });
    });
}

function openOptionsPage() {
    chrome.runtime.sendMessage({
        type: 'OPEN_OPTIONS'
    });
}

function parseOptions() {
    return $getOptions()
        .then(
            options => (config = options),
            error => {
                showNotification(
                    'warning',
                    'Fill in missing Web to Plex options',
                    15000,
                    openOptionsPage
                );
                throw error;
            }
        );
}

let config = parseOptions();

async function getIDs({ title, year, type, IMDbID, TMDbID, TVDbID, APIType, APIID, meta, rerun }) {
    let json = {},
        data = {},
        promise,
        api = {
            tmdb: config.TMDbAPI || 'bcb95f026f9a01ffa707fcff71900e94',
            omdb: config.OMDbAPI || 'PlzBanMe'
        },
        apit = APIType || type,
        apid = APIID || null,
        iid = IMDbID || null,
        mid = TMDbID || null,
        tid = TVDbID || null,
        rqut = apit,
        cors = 'https://cors-anywhere.herokuapp.com/';

    type = type || null;
    meta = { ...meta, mode: 'no-cors' };
    rqut =
    /(tv|show|series)/i.test(rqut)?
        'tvdb':
    /(movie|film)/i.test(rqut)?
        'tmdb':
    rqut || '*';
    title = (title? title.replace(/\s*[\:,]\s*Season\s+\d+.*$/i, '').toCaps(): title)
        .replace(/\u201a/g, ',')
        .replace(/[\u2019\u201b]/g, "'")
        .replace(/[\u201c\u201d]/g, '"')
        .replace(/[^\u0000-\u00ff]+/g, '');
    year = year? (year + '').replace(/\D+/g, ''): load(`${title}.${rqut}`) || year;

    function plus(string) { return string.replace(/\s+/g, '+') }

    let savename = `${title} (${year}).${rqut}`,
        local = load(savename);

    if(local) {
        terminal.log('[LOCAL] Search results', local);
        return local;
    }

    let url =
        (rqut == 'imdb' || (rqut == '*' && !iid && title) || (rqut == 'tvdb' && !iid && title && rerun))?
            (year)?
                `https://www.omdbapi.com/?t=${ plus(title) }&y=${ year }&apikey=${ api.omdb }`:
            `https://www.omdbapi.com/?t=${ plus(title) }&apikey=${ api.omdb }`:
        (rqut == 'tmdb' || (rqut == '*' && !mid && title && year) || apit == 'movie')?
            (apit && apid)?
                `https://api.themoviedb.org/3/${ apit }/${ apid }?api_key=${ api.tmdb }`:
            `https://api.themoviedb.org/3/search/${ apit }?api_key=${ api.tmdb }&query=${ encodeURI(title) }${ year? '&year=' + year: '' }`:
        (rqut == 'tvdb' || (rqut == '*' && !tid && title) || apid)?
            (apid)?
                `https://api.tvmaze.com/shows/${ apid }`:
            `https://api.tvmaze.com/search/shows?q=${ encodeURI(title) }`:
        (title)?
            (apit && year)?
                `https://www.theimdbapi.org/api/find/${ apit }?title=${ encodeURI(title) }&year=${ year }`:
            `https://www.theimdbapi.org/api/find/movie?title=${ encodeURI(title) }${ year? '&year=' + year: '' }`:
        null;

    if(url === null) return 0;

    terminal.log(`Searching for "${ title } (${ year })" in ${ type || apit }/${ rqut } => ${ url.replace(cors, '') }`);

    await(meta? fetch(url/*, meta*/): fetch(url))
        .then(response => {
            return response.json();
        })
        .then(objects => {
            return json = objects;
        })
        .catch(error => {
            throw error;
        });

    terminal.log('Search results', { title, year, url, json });

    if('results' in json)
        json = json.results;

    if(json instanceof Array) {
        let b = { release_date: '', year: '' },
            t = (s = "") => s.toLowerCase(),
            c = (s = "") => t(s).replace(/\&/g, 'and').replace(/\W+/g, ''),
            k = (s = "") => {

                let r = [
                    [/\s*\b(show|series|a([st]|nd?|cross|fter|lthough)?|b(e(cause|fore|tween)|ut|y)|during|from|in(to)?|[io][fn]|[fn]?or|the|[st]o|through|under|with(out)?|yet)\b\s*/gi, ''],
                    // try replacing common words, e.g. Conjunctions, "Show," "Series," etc.
                    [/\s+/g, '|']
                ];

                for(let i = 0; i < r.length; i++) {
                    if(/^([\(\|\)]+)?$/.test(s)) return "";

                    s = s.replace(r[i][0], r[i][1]);
                }

                return c(s);
            },
            R = (s = "", S = "", n = !0) => {
                let score = 100 * ((S.match(RegExp(`\\b(${k(s)})\\b`, 'i')) || [null]).length / (S.split(' ').length || 1)),
                    passing = config.UseLooseScore | 0;

                return (S != '' && score >= passing) || (n? R(S, s, !n): n);
            },
            en = /^en(glish)?$/i;

        // Find an exact match: Title (Year) | #IMDbID
        let index, found, $data, lastscore;
        for(index = 0, found = false, $data, lastscore = 0; index < json.length && !found; index++) {
            $data = json[index];

            //api.tvmaze.com/
            if(('externals' in $data || 'show' in $data) && $data.premiered)
                found = (IMDbID == ($data = $data.show || $data).externals.imdb || t($data.name) === t(title) && year == $data.premiered.slice(0, 4))?
                    $data:
                found;
            //api.themoviedb.org/ \local
            else if(('movie_results' in $data || 'tv_results' in $data || 'results' in $data) && $data.release_date)
                found = (DATA => {
                    if(DATA.results)
                        if(rqut == 'tmdb')
                            DATA.movie_results = DATA.results;
                        else
                            DATA.tv_results = DATA.results;

                    for(let i = 0, f = !1, o = DATA.movie_results, l = o.length | 0; i < l; i++)
                        f = (t(o.title) === t(title) && o.release_date.slice(0, 4) == year);

                    for(i = (+f * l), o = (f? o: DATA.tv_results), l = (f? l: o.length | 0); i < l; i++)
                        f = (t(o.name) === t(title) && o.first_air_date.slice(0, 4) == year);

                    return f? o: f;
                })($data);
            //api.themoviedb.org/ \remote
            else if(('original_name' in $data || 'original_title' in $data) && $data.release_date)
                found = (TMDbID == $data.id || (t($data.original_name || $data.original_title) === t(title) || t($data.name) === t(title)) && year == ($data || b).release_date.slice(0, 4))?
                    $data:
                found;
            //theimdbapi.org/
            else if($data.release_date)
                found = (t($data.title) === t(title) && year == ($data.url || $data || b).release_date.slice(0, 4))?
                    $data:
                found;

//            terminal.log(`Strict Matching: ${ !!found }`, !!found? found: null);
        }

        // Find a close match: Title
        for(index = 0; index < json.length && (!found || lastscore > 0); index++) {
            $data = json[index];

            //api.tvmaze.com/
            if('externals' in $data || 'show' in $data)
                found =
                    // ignore language barriers
                    (c(($data = $data.show || $data).name) == c(title))?
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

//            terminal.log(`Title Matching: ${ !!found }`, !!found? found: null);
        }

        // Find an OK match: Title ~ Title
        // The examples below are correct
        // GOOD, found: VRV's "Bakemonogatari" vs. TVDb's "Monogatari Series"
            // /\b(monogatari)\b/i.test('bakemonogatari') === true
            // this is what this option is for
        // OK, found: "The Title of This is Bad" vs. "The Title of This is OK" (this is semi-errornous)
            // /\b(title|this|bad)\b/i.test('title this ok') === true
            // this may be a possible match, but it may also be an error: 'title' and 'this'
        // BAD, not found: "Gun Show Showdown" vs. "Gundarr"
            // /\b(gun|showdown)\b/i.test('gundarr') === false
            // this should not match; the '\b' (border between \w and \W) keeps them from matching
        for(index = 0; config.UseLoose && index < json.length && (!found || lastscore > 0); index++) {
            $data = json[index];

            //api.tvmaze.com/
            if('externals' in $data || 'show' in $data)
                found =
                    // ignore language barriers
                    (R(($data = $data.show || $data).name, title))?
                        $data:
                    // trust the api matching
                    ($data.score > lastscore)?
                        (lastscore = $data.score, $data):
                    found;
            //api.themoviedb.org/ \local
            else if('movie_results' in $data || 'tv_results' in $data)
                found = (DATA => {
                    let i, f, o, l;

                    for(i = 0, f = !1, o = DATA.movie_results, l = o.length | 0; i < l; i++)
                        f = R(o.title, title);

                    for(i = (+f * l), o = (f? o: DATA.tv_results), l = (f? l: o.length | 0); i < l; i++)
                        f = R(o.name, title);

                    return f? o: f;
                })($data);
            //api.themoviedb.org/ \remote
            else if('original_name' in $data || 'original_title' in $data)
                found = (R($data.original_name, title) || R($data.original_title, title) || R($data.name, title))?
                    $data:
                found;
            //theimdbapi.org/
            else if(en.test($data.language))
                found = (R($data.title, title))?
                    $data:
                found;

//            terminal.log(`Loose Matching: ${ !!found }`, !!found? found: null);
        }

        json = found;
    }

    if(!json && !rerun)
        return json = getIDs({ title, year: YEAR, type, IMDbID, TMDbID, TVDbID, APIType, APIID, meta, rerun: true });
    else if(!json)
        json = {};

    let ei = 'tt-';

    //api.tvmaze.com/
    if('externals' in (json = json.show || json))
        data = {
            imdb: IMDbID || json.externals.imdb || ei,
            tmdb: TMDbID || json.externals.themoviedb | 0,
            tvdb: TVDbID || json.externals.thetvdb | 0,
            title,
            year: ((json.premiered || json.first_aired_date || year) + '').slice(0, 4)
        };
    //api.themoviedb.org/
    else if('imdb_id' in json || 'original_name' in json || 'original_title' in json)
        data = {
            imdb: IMDbID || json.imdb_id || ei,
            tmdb: TMDbID || json.id | 0,
            tvdb: TVDbID || json.tvdb | 0,
            title,
            year: ((json.release_date || json.first_air_date || year) + '').slice(0, 4)
        };
    //omdbapi.com/
    else if('imdbID' in json)
        data = {
            imdb: IMDbID || json.imdbID || ei,
            tmdb: TMDbID || json.tmdbID | 0,
            tvdb: TVDbID || json.tvdbID | 0,
            title,
            year: json.Year || year
        };
    //theapache64.com/movie_db/
    else if('data' in json)
        data = {
            imdb: IMDbID || json.data.imdb_id || ei,
            tmdb: TMDbID || json.data.tmdb_id | 0,
            tvdb: TVDbID || json.data.tvdb_id | 0,
            title,
            year: json.data.year || year
        };
    //theimdbapi.org/
    else
        data = {
            imdb: IMDbID || json.imdb || ei,
            tmdb: TMDbID || json.id | 0,
            tvdb: TVDbID || json.tvdb | 0,
            title,
            year
        };

    year = +((data.year + '').slice(0, 4)) || 0;
    data.year = year;

    terminal.log('Best match', { title, year, data, type, rqut, score: json.score | 0 });

    save(savename, data); // e.g. "Coco (0)" on Netflix before correction / no repeat searches
    save(savename = `${title} (${year}).${rqut}`, data); // e.g. "Coco (2017)" on Netflix after correction / no repeat searches
    save(`${title}.${rqut}`, year);

    terminal.log(`Saved as "${ savename }"`, data);

    return data;
}

let lastNotification = 0;

function showNotification(state, text, timeout, callback) {
    if (lastNotification) {
        clearTimeout(lastNotification);
        lastNotification = null;
    }

    callback = callback? callback: () => {};

    let existingEl = document.querySelector('.web-to-plex-notification');
    if (existingEl) {
        document.body.removeChild(existingEl);
    }

    let el = document.createElement('div');
    el.classList.add('web-to-plex-notification');
    el.onclick = () => {
        clearTimeout(lastNotification);
        el.remove();
        return callback();
    };

    if (state == 'warning') {
        el.classList.add('web-to-plex-warning');
    }

    el.textContent = text;
    document.body.appendChild(el);
    lastNotification = setTimeout(() => {}, timeout || 7000);
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
			url: `${ config.couchpotatoURL }/media.get`,
            IMDbID: options.IMDbID,
            TMDbID: options.TMDbID,
            TVDbID: options.TVDbID,
			basicAuth: config.couchpotatoBasicAuth,
		},
		response => {
			let movieExists = response.success;
			if (response.error) {
				return showNotification(
					'warning',
					'CouchPotato request failed (see your terminal)'
				),
				terminal.error('Error viewing CouchPotato:', response.error);
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
			url: `${ config.couchpotatoURL }/movie.add`,
            IMDbID: options.IMDbID,
            TMDbID: options.TMDbID,
            TVDbID: options.TVDbID,
			basicAuth: config.couchpotatoBasicAuth,
		},
		response => {
            terminal.log('Pushing to CouchPotato', response);

			if (response.error) {
				return showNotification(
					'warning',
					'Could not add to CouchPotato (see your terminal)'
				),
				terminal.error('Error adding to CouchPotato:', response.error);
			}
			if (response.success) {
                terminal.log('Successfully pushed');
				showNotification('info', 'Added movie to CouchPotato');
			} else {
				showNotification('warning', 'Could not add to CouchPotato');
			}
		}
	);
}

// Movies
function pushWatcherRequest(options) {
    if (!options.IMDbID && !options.TMDbID) {
        return showNotification(
            'warning',
            'Stopped adding to Watcher: No IMDb/TMDb ID'
        );
    }

    chrome.runtime.sendMessage({
            type: 'ADD_WATCHER',
            url: `${ config.watcherURL }api/`,
            token: config.watcherToken,
            StoragePath: config.watcherStoragePath,
            basicAuth: config.watcherBasicAuth,
            title: options.title,
            year: options.year,
            imdbId: options.IMDbID,
            tmdbId: options.TMDbID,
        },
        response => {
        terminal.log('Pushing to Watcher', response);

            if (response && response.error) {
                return showNotification('warning', 'Could not add to Watcher: ' + response.error),
                    terminal.error('Error adding to Watcher:', response.error, response.location, response.debug);
            } else if (response && (response.success || (response.response + "") == "true")) {
                let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-{2,}/g, '-').toLowerCase(),
                    TMDbID = options.TMDbID || response.tmdbId;

                terminal.log('Successfully pushed');
                showNotification('info', 'Added movie to Watcher', 7000, () => window.open(`${config.watcherURL}library/status${TMDbID? `#${title}-${TMDbID}`: '' }`, '_blank'));
            } else {
                showNotification('warning', 'Could not add to Watcher: Unknown Error'),
                terminal.error('Error adding to Watcher:', response);
            }
        }
    );
}

// Movies
function pushRadarrRequest(options) {
    if (!options.IMDbID && !options.TMDbID) {
        return showNotification(
            'warning',
            'Stopped adding to Radarr: No IMDb/TMDb ID'
        );
    }

    chrome.runtime.sendMessage({
            type: 'ADD_RADARR',
            url: `${ config.radarrURL }api/movie/`,
            token: config.radarrToken,
            StoragePath: config.radarrStoragePath,
            QualityProfileId: config.radarrQualityProfileId,
            basicAuth: config.radarrBasicAuth,
            title: options.title,
            year: options.year,
            imdbId: options.IMDbID,
            tmdbId: options.TMDbID,
        },
        response => {
        terminal.log('Pushing to Radarr', response);

            if (response && response.error) {
                return showNotification('warning', 'Could not add to Radarr: ' + response.error),
                    terminal.error('Error adding to Radarr:', response.error, response.location, response.debug);
            } else if (response && response.success) {
                let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-{2,}/g, '-').toLowerCase(),
                    TMDbID = options.TMDbID || response.tmdbId;

                terminal.log('Successfully pushed');
                showNotification('info', 'Added movie to Radarr', 7000, () => window.open(`${config.radarrURL}${TMDbID? `movies/${title}-${TMDbID}`: '' }`, '_blank'));
            } else {
                showNotification('warning', 'Could not add to Radarr: Unknown Error'),
                terminal.error('Error adding to Radarr:', response);
            }
        }
    );
}

// TV Shows
function pushSonarrRequest(options) {
    if (!options.TVDbID || options.TVDbID == "") {
        return showNotification(
            'warning',
            'Stopped adding to Sonarr: No TVDb ID'
        );
    }

    chrome.runtime.sendMessage({
            type: 'ADD_SONARR',
            url: `${ config.sonarrURL }api/series/`,
            token: config.sonarrToken,
            StoragePath: config.sonarrStoragePath,
            QualityProfileId: config.sonarrQualityProfileId,
            basicAuth: config.sonarrBasicAuth,
            title: options.title,
            year: options.year,
            tvdbId: options.TVDbID,
        },
        response => {
        terminal.log('Pushing to Sonarr', response);

            if (response && response.error) {
                return showNotification('warning', 'Could not add to Sonarr: ' + response.error),
                    terminal.error('Error adding to Sonarr:', response.error, response.location, response.debug);
            } else if (response && response.success) {
                let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-{2,}/g, '-').toLowerCase();

                terminal.log('Successfully pushed');
                showNotification('info', 'Added series to Sonarr', 7000, () => window.open(`${config.sonarrURL}series/${title}`, '_blank'));
            } else {
                showNotification('warning', 'Could not add to Sonarr: Unknown Error'),
                terminal.error('Error adding to Sonarr:', response);
            }
        }
    );
}

function modifyPlexButton(el, action, title, options) {
    if (el instanceof Array) {
        return el.forEach(e => modifyPlexButton(e, action, title, options));
    }

    let pa = el.parentElement,
        ty = 'Item', txt = 'textContent', hov = 'title',
        em = /^(tt-?|0)?$/i,
        empty = (em.test(options.IMDbID) && em.test(options.TMDbID) && em.test(options.TVDbID));

    if(options) {
        ty = (options.type == 'movie'? 'Movie': 'TV Show');
        txt = options.txt || txt;
        hov = options.hov || hov;
    }

    options.fileonly = empty && options.remote;

    if (action == 'found') {
        el.href = getPlexMediaURL(config.server.id, options.key);
        el[txt] = 'Watch on Plex';
        el[hov] = `Watch "${options.title} (${options.year})" on Plex`;
        el.classList.add('web-to-plex-button--found');

        if(pa) pa.classList.replace('web-to-plex-wrapper', 'web-to-plex-wrapper--found');
    } else if (action == 'downloader' || options.fileonly) {
        if (options.remote) {
            let delimeter = '<!---->',
                xhr = new XMLHttpRequest(),
                data, head, body, foot, type;

            xhr.open('POST', options.remote);

            switch(options.locale) {

                /* Flenix */
                case 'flenix':
                    el.href = '#';
                    el[txt] = 'Save #0/0';
                    el.classList.add('web-to-plex-button--downloader');

                    let $data = document.querySelector('#videoplayer ~ script').innerText,
                        regx = {
                            file: /^\s*file\:\s*((["']).+?\2),?/m,
                            hash: /^\s*hash\:\s*((["']).+?\2),?/m
                        };

                    head = $data.replace(/[^]*?(\{.*\})[^]*/, '$1');
                    body = $data.replace(/[^]*\((\{[^]+?\})\);[^]+/, '$1');
                    $data = data = head;

                    try {
                        data = JSON.parse(data.replace(/(\w+)\:/g, '"$1":').replace(/([^\\])'/g, '$1"').replace(/\:\s*([a-z]+),/gi, ': null,'));
                    } catch(error) {
                        terminal.error(error);
                        data = $data;
                    }

                    if(typeof data == 'string') {
                        if(regx.file.test(data))
                            data.replace(regx.file),
                            data = RegExp.$1,
                            type = 'string';
                        else if(regx.hash.test(data))
                            data.replace(regx.hash),
                            data = RegExp.$1.replace(/(?:^|,)(\w+)\:/g, '&$1='),
                            type = 'url';
                    } else {
                        if(data.file)
                            data = data.file,
                            type = 'string';
                        else if(data.hash)
                            data = data.hash,
                            type = 'url';
                        else
                            type = 'url';
                    }

                    if(type == 'url') {
                        xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
                        $data = [];
                        for(let property in data)
                            $data.push(`${ property }=${ data[property] }`);
                        $data = data = $data.join('&');
                    }

                    data = encodeURI(data.replace(/^&|["']/g, ''));

                    xhr.callback = function(response) {
                        let ar = [], tl;

                        terminal.log('GOT:', typeof response, response);

                        response.split(',http')
                            .join(delimeter + 'http')
                            .split(delimeter)
                            .forEach(value => (/\.html?$/i.test(value)? null: ar.push(value)));

                        el.dataset.hrefs = ar.join(delimeter);
                        el.download = `${options.title.replace(/\s*\:\s*/g, ' - ')} (${options.year})`;
                        el.href = tl = ar[el.index = 0];
                        tl = (tl.replace(/.*(?:\.(\w+))?$/, '$1') || 'mp4');
                        el[txt] = el[txt].replace(/\d+\/.+?$/, `${++el.index}/${ar.length} (${tl.toUpperCase()})`);

                        sendUpdate('SAVE_AS', { ...options, href: el.href, tail: tl });
                    };

                    if(type == 'string')
                        xhr.callback(data);

                    el.addEventListener('click', e => {
                        e.preventDefault(true);

                        let el = e.target,
                            hs = el.dataset.hrefs.split(delimeter),
                            tl;

                        el.href = tl = hs[el.index++];
                        tl = (tl.replace(/.*(?:\.(\w+))?$/, '$1') || 'mp4');
                        el[txt] = el[txt].replace(/\d+\/.+?$/, `${el.index}/${hs.length} (${tl.toUpperCase()})`);

                        if(hs.length == 1 || el.index == hs.length)
                            el.index = 0;

                        sendUpdate('SAVE_AS', { ...options, href: el.href, tail: tl });
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

            if(type == 'url') {
                xhr.onload = function() {
                    if (xhr.status !== 200)
                        return modifyPlexButton(el, action, title, {
                            ...options,
                            locale: null,
                            remote: null
                        });

                    return xhr.callback(xhr.response);
                }

                xhr.send(data);
            }
        } else {
            el.href = '#';
            el[txt] = `Get this ${ty.toCaps()}`;
            el.classList.add('web-to-plex-button--downloader');
            el.addEventListener('click', e => {
                let tv = /tv[\s-]?|shows?|series/i;

                e.preventDefault();
                if (config.watcherURL && !tv.test(options.type)) {
                    pushWatcherRequest(options);
                } else if (config.radarrURL && !tv.test(options.type)) {
                    pushRadarrRequest(options);
                } else if (config.sonarrURL && tv.test(options.type)) {
                    pushSonarrRequest(options);
                } else if(config.couchpotatoURL && tv.test(options.type)) {
                    $pushAddToCouchpotato(options);
                }
            });
        }

        el[hov] = `Add "${options.title} (${options.year})" | ${ty + (options.fileonly? ` - No ${ty} ID`: '')}`;
        el.style.removeProperty('display');
    } else if (action == 'notfound' || action == 'error' || empty) {
        el.removeAttribute('href');
        el[txt] = action == 'notfound' ? ty + ' not available' : 'Web to Plex-';
        el[hov] = `${ty} was not found`;
        el.classList.remove('web-to-plex-button--found');

        if(pa) pa.classList.remove('web-to-plex-wrapper--found');
    }

    el.id = options? `${options.IMDbID || 'tt'}-${options.TMDbID | 0}-${options.TVDbID | 0}`: 'tt-0-0';
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
                            let available = (config.watcherURL || config.radarrURL || config.sonarrURL || config.couchpotatoURL),
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
                    'Request to Plex Media Server failed',
                    options
                ),
                terminal.error('Request to Plex failed', error);
        });
}

function getPlexMediaRequest(options) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
                type: 'SEARCH_PLEX',
                options,
                serverConfig: config.server
            },
            response =>
                (response.error)?
                    reject(response.error):
                resolve(response)
            );
        });
}

function getPlexMediaURL(PlexUIID, key) {
    return `${ config.plexURL.replace(config.server.id, PlexUIID) }details?key=${encodeURIComponent( key )}`;
}

String.prototype.toCaps = String.prototype.toCaps || function toCaps(all) {
    /** Titling Caplitalization
     * Articles: a, an, & the
     * Conjunctions: and, but, for, nor, or, so, & yet
     * Prepositions: across, after, although, at, because, before, between, by, during, from, if, in, into, of, on, to, through, under, with, & without
     */
    let array = this.toLowerCase(),
        titles = /(?!^|an?|the)\b(a([st]|nd?|cross|fter|lthough)?|b(e(cause|fore|tween)|ut|y)|during|from|in(to)?|[io][fn]|[fn]?or|the|[st]o|through|under|with(out)?|yet)(?!\s*$)\b/gi,
        exceptions = /([\:\|\.\!\?\"\(]\s*[a-z]|(?![\'\-\+])\b[^aeiouy\d\W]+\b)/gi;

    array = array.split(/\s+/);

    let index, length, string, word;
    for(index = 0, length = array.length, string = [], word; index < length; index++) {
        word = array[index];

        if(word)
            string.push( word[0].toUpperCase() + word.slice(1, word.length) );
    }

    string = string.join(' ');

    if(!all)
        string = string.replace(titles, ($0, $1, $$, $_) => $1.toLowerCase()).replace(exceptions, ($0, $1, $$, $_) => $1.toUpperCase());

    return string;
};
