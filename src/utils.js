/* eslint-disable no-unused-vars */
/* global config */
function wait(on, then) {
    if (on())
        then && then();
    else
        setTimeout(() => wait(on, then), 50);
}

let NO_DEBUGGER = false;

let date = (new Date),
    terminal =
        NO_DEBUGGER?
            { error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m }:
        console;

let YEAR = date.getFullYear(),
    MONTH = date.getMonth() + 1,
    DATE = date.getDate();

let getURL = url => chrome.extension.getURL(url);

let IMG_URL = {
    'i16': getURL('img/16.png'),
    'i48': getURL('img/48.png'),
    '_16': getURL('img/_16.png'),
    '_48': getURL('img/_48.png'),
    'o16': getURL('img/o16.png'),
    'o48': getURL('img/o48.png'),
    'h16': getURL('img/hide.16.png'),
    'h48': getURL('img/hide.48.png'),
    'j16': getURL('img/show.16.png'),
    'j48': getURL('img/show.48.png'),
    'p16': getURL('img/plexit.16.png'),
    'p48': getURL('img/plexit.48.png'),
    'r16': getURL('img/reload.16.png'),
    'r48': getURL('img/reload.48.png'),
    'x16': getURL('img/close.16.png'),
    'x48': getURL('img/close.48.png'),
    's16': getURL('img/settings.16.png'),
    's48': getURL('img/settings.48.png'),
    'noi': getURL('img/noise.png'),
    'nil': getURL('img/null.png'),
};

// the custom "on location change" event
let locationchangecallbacks = [];

function watchlocationchange(subject) {
    watchlocationchange[subject] = watchlocationchange[subject] || location[subject];

    if (watchlocationchange[subject] != location[subject]) {
        watchlocationchange[subject] = location[subject];

        for(let index = 0, length = locationchangecallbacks.length, callback; index < length; index++) {
            callback = locationchangecallbacks[index];

            if(callback && typeof callback == 'function')
                callback(new Event('locationchange', { bubbles: true }));
        }
    }
}

Object.defineProperty(window, 'onlocationchange', {
    set: callback => locationchangecallbacks.push(callback)
});

setInterval(() => watchlocationchange('pathname'), 1000); // at least 1s is needed to properly fire the event ._.

// the storage
const storage = chrome.storage.sync || chrome.storage.local;

async function load(name = '') {
    if(!name) return;

    name = 'Cache-Data/' + btoa(name.toLowerCase().replace(/\s+/g, ''));

    return new Promise((resolve, reject) => {
        function LOAD(DISK) {
            let data = JSON.parse(DISK[name] || null);

            return resolve(data);
        }

        storage.get(null, DISK => {
            if (chrome.runtime.lastError)
                chrome.storage.local.get(null, LOAD);
            else
                LOAD(DISK);
        });
    });
}

async function save(name = '', data) {
    if(!name) return;

    name = 'Cache-Data/' + btoa(name.toLowerCase().replace(/\s+/g, ''));
    data = JSON.stringify(data);

    await storage.set({[name]: data}, () => data);

    return name;
}

async function kill(name) {
  return storage.remove(['Cache-Data/' + btoa(name.toLowerCase().replace(/\s+/g, ''))]);
}

// Send an update query to background.js
function sendUpdate(type, options = {}) {
    terminal.log(`Requesting update: ${ type }`, options);

    chrome.runtime.sendMessage({
        type,
        options
    });
}

// get the saved options
function $getOptions() {
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
                `${ o.plexURL }web#!/server/${ o.server.id }/`:
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

            if (o.ombiURLRoot && o.ombiToken) {
                o.ombiURL = o.ombiURLRoot;
            } else {
                delete o.ombiURL; // prevent variable ghosting
            }

            if (o.couchpotatoURLRoot && o.couchpotatoToken) {
                o.couchpotatoURL = `${ items.couchpotatoURLRoot }/api/${encodeURIComponent(o.couchpotatoToken)}`;
            } else {
                delete o.couchpotatoURL; // prevent variable ghosting
            }

            if (o.watcherURLRoot && o.watcherToken) {
                o.watcherURL = o.watcherURLRoot;
            } else {
                delete o.watcherURL; // prevent variable ghosting
            }

            if (o.radarrURLRoot && o.radarrToken) {
                o.radarrURL = o.radarrURLRoot;
            } else {
                delete o.radarrURL; // prevent variable ghosting
            }

            if (o.sonarrURLRoot && o.sonarrToken) {
                o.sonarrURL = o.sonarrURLRoot;
            } else {
                delete o.sonarrURL; // prevent variable ghosting
            }

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

// self explanatory
function openOptionsPage() {
    chrome.runtime.sendMessage({
        type: 'OPEN_OPTIONS'
    });
}

// self explanatory, returns an object
function parseOptions() {
    return $getOptions()
        .then(
            options => (config = options),
            error => {
                new Notification(
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

// fetch/search for the item's media ID(s)
async function getIDs({ title, year, type, IMDbID, TMDbID, TVDbID, APIType, APIID, meta, rerun }) {
    let json = {}, // returned object
        data = {}, // mutated object
        promise, // query promise
        api = {
            tmdb: config.TMDbAPI || 'bcb95f026f9a01ffa707fcff71900e94',
            omdb: config.OMDbAPI || 'PlzBanMe',
            ombi: config.ombiToken,
        },
        apit = APIType || type, // api type (depends on "rqut")
        apid = APIID || null, // api id
        iid = IMDbID || null, // IMDbID
        mid = TMDbID || null, // TMDbID
        tid = TVDbID || null, // TVDbID
        rqut = apit, // request type: tmdb, imdb, or tvdb
        cors = 'https://cors-anywhere.herokuapp.com/', // if cors is requried and not uspported, proxy through this URL
        manable = config.ManagerSearch && !rerun; // is the user's "Manager Searches" option enabled?

    type = type || null;
    meta = { ...meta, mode: 'cors' };
    rqut =
    /(tv|show|series)/i.test(rqut)?
        'tvdb':
    /(movie|film)/i.test(rqut)?
        'tmdb':
    rqut || '*';
    title = (title? title.replace(/\s*[\:,]\s*Season\s+\d+.*$/i, '').toCaps(): "")
        .replace(/\u201a/g, ',') // fancy comma
        .replace(/[\u2019\u201b]/g, "'") // fancy apostrophe
        .replace(/[\u201c\u201d]/g, '"') // fancy quotation marks
        .replace(/[^\u0000-\u00ff]+/g, ''); // only accept UTF-8 characters
    year = year? (year + '').replace(/\D+/g, ''): year;

    let plus = (string, character = '+') => string.replace(/\s+/g, character);

    let local, savename;

    if(year) {
        savename = `${title.toLowerCase()} (${year}).${rqut}`,
        local = await load(savename);
    } else {
        year = await load(`${title}.${rqut}`) || year;
        `${title.toLowerCase()} (${year}).${rqut}`;
        local = await load(savename);
    }

    if(local) {
        terminal.log('[LOCAL] Search results', local);
        return local;
    }

    /* the rest of this function is a beautiful mess that will need to be dealt with later... but it works */
    let url =
        (manable && config.ombiURLRoot)?
            `${ config.ombiURLRoot }api/v1/Search/${ (rqut == 'imdb' || rqut == 'tmdb' || apit == 'movie')? 'movie': 'tv' }/${ plus(title, '%20') }/?apikey=${ api.ombi }`:
        (manable && (config.radarrURLRoot || config.sonarrURLRoot))?
            (config.radarrURLRoot && (rqut == 'imdb' || rqut == 'tmdb'))?
                (mid)?
                    `${ config.radarrURLRoot }api/movie/lookup/tmdb?tmdbId=${ mid }&apikey=${ config.radarrToken }`:
                (iid)?
                    `${ config.radarrURLRoot }api/movie/lookup/imdb?imdbId=${ iid }&apikey=${ config.radarrToken }`:
                `${ config.radarrURLRoot }api/movie/lookup?term=${ plus(title, '%20') }&apikey=${ config.radarrToken }`:
            (tid)?
                `${ config.sonarrURLRoot }api/series/lookup?term=tvdb:${ tid }&apikey=${ config.sonarrToken }`:
            `${ config.sonarrURLRoot }api/series/lookup?term=${ plus(title, '%20') }&apikey=${ config.sonarrToken }`:
        (rqut == 'imdb' || (rqut == '*' && !iid && title) || (rqut == 'tvdb' && !iid && title && rerun))?
            (iid)?
                `https://www.omdbapi.com/?i=${ iid }&apikey=${ api.omdb }`:
            (year)?
                `https://www.omdbapi.com/?t=${ plus(title) }&y=${ year }&apikey=${ api.omdb }`:
            `https://www.omdbapi.com/?t=${ plus(title) }&apikey=${ api.omdb }`:
        (rqut == 'tmdb' || (rqut == '*' && !mid && title && year) || apit == 'movie')?
            (apit && apid)?
                `https://api.themoviedb.org/3/${ apit }/${ apid }?api_key=${ api.tmdb }`:
            (iid)?
                `https://api.themoviedb.org/3/find/${ iid || mid || tid }?api_key=${ api.tmdb }&external_source=${ iid? 'imdb': mid? 'tmdb': 'tvdb' }_id`:
            `https://api.themoviedb.org/3/search/${ apit }?api_key=${ api.tmdb }&query=${ encodeURI(title) }${ year? '&year=' + year: '' }`:
        (rqut == 'tvdb' || (rqut == '*' && !tid && title) || (apid == tid))?
            (tid)?
                `https://api.tvmaze.com/shows/?thetvdb=${ tid }`:
            (iid)?
                `https://api.tvmaze.com/shows/?imdb=${ iid }`:
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
                    [/(?!^\s*)\b(show|series|a([st]|nd?|cross|fter|lthough)?|b(e(cause|fore|tween)|ut|y)|during|from|in(to)?|[io][fn]|[fn]?or|the|[st]o|through|under|with(out)?|yet)\b\s*/gi, ''],
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
        for(index = 0, found = false, $data, lastscore = 0; (title && year) && index < json.length && !found; index++) {
            $data = json[index];

            let altt = $data.alternativeTitles,
                $alt = (altt && altt.length? altt.filter(v => t(v) == t(title))[0]: null);

            // Radarr & Sonarr
            if(manable)
                found = ((t($data.title) == t(title) || $alt) && +year === +$data.year)?
                    $alt || $data:
                found;
            //api.tvmaze.com/
            else if(('externals' in ($data = $data.show || $data) || 'show' in $data) && $data.premiered)
                found = (iid == $data.externals.imdb || t($data.name) == t(title) && year == $data.premiered.slice(0, 4))?
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

                    let i, f, o, l;

                    for(i = 0, f = !1, o = DATA.movie_results, l = o.length | 0; i < l; i++)
                        f = (t(o.title) === t(title) && o.release_date.slice(0, 4) == year);

                    for(i = (+f * l), o = (f? o: DATA.tv_results), l = (f? l: o.length | 0); i < l; i++)
                        f = (t(o.name) === t(title) && o.first_air_date.slice(0, 4) == year);

                    return f? o: f = !!iid;
                })($data);
            //api.themoviedb.org/ \remote
            else if(('original_name' in $data || 'original_title' in $data) && $data.release_date)
                found = (tid == $data.id || (t($data.original_name || $data.original_title) == t(title) || t($data.name) == t(title)) && year == ($data || b).release_date.slice(0, 4))?
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
        for(index = 0; title && index < json.length && (!found || lastscore > 0); index++) {
            $data = json[index];

            let altt = $data.alternativeTitles,
                $alt = (altt && altt.length? altt.filter(v => c(v) == c(title)): null);

            // Radarr & Sonarr
            if(manable)
                found = (c($data.title) == c(title) || $alt)?
                    $alt || $data:
                found;
            //api.tvmaze.com/
            else if('externals' in ($data = $data.show || $data) || 'show' in $data)
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

//            terminal.log(`Title Matching: ${ !!found }`, !!found? found: null);
        }

        // Find an OK match (Loose Searching): Title ~ Title
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
        for(index = 0; config.UseLoose && title && index < json.length && (!found || lastscore > 0); index++) {
            $data = json[index];

            let altt = $data.alternativeTitles,
                $alt = (altt && altt.length? altt.filter(v => R(v, title)): null);

            // Radarr & Sonarr
            if(manable)
                found = (R($data.name, title) || $alt)?
                    $alt || $data:
                found;
            //api.tvmaze.com/
            else if('externals' in ($data = $data.show || $data) || 'show' in $data)
                found =
                    // ignore language barriers
                    (R($data.name, title) || terminal.log('Matching:', [$data.name, title], R($data.name, title)))?
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

    if((json === undefined || json === null || json === false) && !rerun)
        return json = getIDs({ title, year: YEAR, type, IMDbID, TMDbID, TVDbID, APIType, APIID, meta, rerun: true });
    else if((json === undefined || json === null))
        json = {};

    let ei = 'tt-',
        mr = 'movie_results',
        tr = 'tv_results';

    json = json && mr in json? json[mr].length > json[tr].length? json[mr]: json[tr]: json;

    if(json instanceof Array)
        json = json[0];

    if(!json)
        json = {};

    // Ombi, Radarr and Sonarr
    if(manable)
        data = {
            imdb: IMDbID || json.imdbId || ei,
            tmdb: TMDbID || json.tmdbId || json.theMovieDbId | 0,
            tvdb: TVDbID || json.tvdbId || json.theTvDbId    | 0,
            title: json.title || title,
            year: +(json.year || year)
        };
    //api.tvmaze.com/
    else if('externals' in (json = json.show || json))
        data = {
            imdb: IMDbID || json.externals.imdb || ei,
            tmdb: TMDbID || json.externals.themoviedb | 0,
            tvdb: TVDbID || json.externals.thetvdb | 0,
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
    else
        data = {
            imdb: iid || json.imdb || ei,
            tmdb: mid || json.id | 0,
            tvdb: tid || json.tvdb | 0,
            title,
            year
        };

    year = +((data.year + '').slice(0, 4)) || 0;
    data.year = year;

    let best = { title, year, data, type, rqut, score: json.score | 0 };

    terminal.log('Best match', best);

    if(best.data.imdb == ei && best.data.tmdb == 0 && best.data.tvdb == 0)
        return terminal.log(`No information was found for "${ title } (${ year })"`), {};

    save(savename, data); // e.g. "Coco (0)" on Netflix before correction / no repeat searches
    save(savename = `${title.toLowerCase()} (${year}).${rqut}`.toLowerCase(), data); // e.g. "Coco (2017)" on Netflix after correction / no repeat searches
    save(`${title.toLowerCase()}.${rqut}`.toLowerCase(), year);

    terminal.log(`Saved as "${ savename }"`, data);

    return data;
}

// create and/or queue a notification
// state = "error" - red
// state = "update" - blue
// state = "info" - grey
// anything else for state will show as orange
class Notification {
    constructor(state, text, timeout = 7000, callback, requiresClick = true) {
        let queue = (Notification.queue = Notification.queue || { list: [] }),
            last = queue.list[queue.list.length - 1];

        if (last && last.done === false)
            return (last => setTimeout(() => new Notification(state, text, timeout, callback), +(new Date) - last.start))(last);

        callback = callback || (() => {});

        let element = document.createElement('div');

        element.classList.add('web-to-plex-notification', state);
        element.addEventListener('onclick', element.onclick = event => {
            let notification = Notification.queue[event.target.id],
                element = notification.element;

            notification.done = true;
            Notification.queue.list.splice(notification.index, 1);
            clearTimeout(notification.job);
            element.remove();

            let removed = delete Notification.queue[notification.id];

            return (event.requiresClick)? null: notification.callback(removed);
        });

        element.innerHTML = text;
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

function $pushAddToCouchpotato(options) {
	// TODO: this does not work anymore!
	if (!options.IMDbID)
		return new Notification(
			'warning',
			'Stopped adding to CouchPotato: No IMDb ID'
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
				return new Notification(
					'warning',
					'CouchPotato request failed (see your console)'
				) ||
				(!response.silent && terminal.error('Error viewing CouchPotato: ' + String(response.error)));
			}
			if (!movieExists) {
				pushCouchPotatoRequest(options);
				return;
			}
			new Notification(
				'warning',
				`Movie is already in CouchPotato (status: ${response.status})`
			);
		}
	);
}

// Movies/TV Shows
function pushOmbiRequest(options) {
    new Notification('info', `Adding "${ options.title }" to Ombi`, 3000);

    if ((!options.IMDbID && !options.TMDbID) && !options.TVDbID) {
        return new Notification(
            'warning',
            'Stopped adding to Ombi: No content ID'
        );
    }

    let contentType = (/movies?|film/i.test(options.type)? 'movie': 'tv');

    chrome.runtime.sendMessage({
            type: 'ADD_OMBI',
            url: `${ config.ombiURL }api/v1/Request/${ contentType }`,
            token: config.ombiToken,
            title: options.title,
            year: options.year,
            imdbId: options.IMDbID,
            tmdbId: options.TMDbID,
            tvdbId: options.TVDbID,
            contentType,
        },
        response => {
            terminal.log('Pushing to Ombi', response);

            if (response && response.error) {
                return new Notification('warning', 'Could not add to Ombi: ' + response.error) ||
                    (!response.silent && terminal.error('Error adding to Ombi: ' + String(response.error), response.location, response.debug));
            } else if (response && response.success) {
                let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-{2,}/g, '-').toLowerCase();

                terminal.log('Successfully pushed');
                new Notification('update', `Added ${ (contentType == 'tv'? 'TV show': 'movie') } to Ombi`, 7000, () => window.open(config.ombiURL, '_blank'));
            } else {
                new Notification('warning', 'Could not add to Ombi: Unknown Error') ||
                (!response.silent && terminal.error('Error adding to Ombi: ' + String(response)));
            }
        }
    );
}

// Movies/TV Shows
function pushCouchPotatoRequest(options) {
    new Notification('info', `Adding "${ options.title }" to CouchPotato`, 3000);

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
				return new Notification(
					'warning',
					'Could not add to CouchPotato (see your console)'
				) ||
				(!response.silent && terminal.error('Error adding to CouchPotato: ' + String(response.error)));
			}
			if (response.success) {
                terminal.log('Successfully pushed');
				new Notification('update', 'Added movie to CouchPotato');
			} else {
				new Notification('warning', 'Could not add to CouchPotato');
			}
		}
	);
}

// Movies
function pushWatcherRequest(options) {
    new Notification('info', `Adding "${ options.title }" to Watcher`, 3000);

    if (!options.IMDbID && !options.TMDbID) {
        return new Notification(
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
                return new Notification('warning', 'Could not add to Watcher: ' + response.error) ||
                    (!response.silent && terminal.error('Error adding to Watcher: ' + String(response.error), response.location, response.debug));
            } else if (response && (response.success || (response.response + "") == "true")) {
                let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-{2,}/g, '-').toLowerCase(),
                    TMDbID = options.TMDbID || response.tmdbId;

                terminal.log('Successfully pushed');
                new Notification('update', 'Added movie to Watcher', 7000, () => window.open(`${config.watcherURL}library/status${TMDbID? `#${title}-${TMDbID}`: '' }`, '_blank'));
            } else {
                new Notification('warning', 'Could not add to Watcher: Unknown Error') ||
                (!response.silent && terminal.error('Error adding to Watcher: ' + String(response)));
            }
        }
    );
}

// Movies
function pushRadarrRequest(options) {
    new Notification('info', `Adding "${ options.title }" to Radarr`, 3000);

    if (!options.IMDbID && !options.TMDbID) {
        return new Notification(
            'warning',
            'Stopped adding to Radarr: No IMDb/TMDb ID'
        );
    }

    chrome.runtime.sendMessage({
            type: 'ADD_RADARR',
            url: `${ config.radarrURL }api/movie/`,
            token: config.radarrToken,
            StoragePath: config.radarrStoragePath,
            QualityID: config.radarrQualityProfileId,
            basicAuth: config.radarrBasicAuth,
            title: options.title,
            year: options.year,
            imdbId: options.IMDbID,
            tmdbId: options.TMDbID,
        },
        response => {
            terminal.log('Pushing to Radarr', response);

            if (response && response.error) {
                return new Notification('warning', 'Could not add to Radarr: ' + response.error) ||
                    (!response.silent && terminal.error('Error adding to Radarr: ' + String(response.error), response.location, response.debug));
            } else if (response && response.success) {
                let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-{2,}/g, '-').toLowerCase(),
                    TMDbID = options.TMDbID || response.tmdbId;

                terminal.log('Successfully pushed');
                new Notification('update', 'Added movie to Radarr', 7000, () => window.open(`${config.radarrURL}${TMDbID? `movies/${title}-${TMDbID}`: '' }`, '_blank'));
            } else {
                new Notification('warning', 'Could not add to Radarr: Unknown Error') ||
                (!response.silent && terminal.error('Error adding to Radarr: ' + String(response)));
            }
        }
    );
}

// TV Shows
function pushSonarrRequest(options) {
    new Notification('info', `Adding "${ options.title }" to Sonarr`, 3000);

    if (!options.TVDbID || options.TVDbID == "") {
        return new Notification(
            'warning',
            'Stopped adding to Sonarr: No TVDb ID'
        );
    }

    chrome.runtime.sendMessage({
            type: 'ADD_SONARR',
            url: `${ config.sonarrURL }api/series/`,
            token: config.sonarrToken,
            StoragePath: config.sonarrStoragePath,
            QualityID: config.sonarrQualityProfileId,
            basicAuth: config.sonarrBasicAuth,
            title: options.title,
            year: options.year,
            tvdbId: options.TVDbID,
        },
        response => {
            terminal.log('Pushing to Sonarr', response);

            if (response && response.error) {
                return new Notification('warning', 'Could not add to Sonarr: ' + response.error) ||
                    (!response.silent && terminal.error('Error adding to Sonarr: ' + String(response.error), response.location, response.debug));
            } else if (response && response.success) {
                let title = options.title.replace(/\&/g, 'and').replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-{2,}/g, '-').toLowerCase();

                terminal.log('Successfully pushed');
                new Notification('update', 'Added series to Sonarr', 7000, () => window.open(`${config.sonarrURL}series/${title}`, '_blank'));
            } else {
                new Notification('warning', 'Could not add to Sonarr: Unknown Error') ||
                (!response.silent && terminal.error('Error adding to Sonarr: ' + String(response)));
            }
        }
    );
}

// make the button
function renderPlexButton(persistent) {
	let existingButtons = document.querySelectorAll('.web-to-plex-button');

	if (existingButtons.length && !persistent)
		[].slice.call(existingButtons).forEach(button => button.remove());
    else if(persistent)
        return existingButtons[0];

    // <button>
    let button =
        furnish('button.show.closed.floating.web-to-plex-button', {
                tooltip: 'Loading...',
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
                style: `background-image: url(${ IMG_URL.noi })`
            },
            // <ul>
            furnish('ul', {},
                // <li>
                furnish('li#wtp-list-name.list-name', {},
                    furnish('a.list-action', {}, furnish(`img[alt=Web to Plex]`, { src: IMG_URL.i48 }))
                ),

                furnish('li#wtp-plexit.list-item', {
                    tooltip: 'Open Plex It!',
                    onclick: event => {
                        let self = event.target, parent = button;

                        (d=>{let s=d.createElement('script'),h=d.querySelector('head');s.type='text/javascript';s.src='//ephellon.github.io/plex.it.js';h.appendChild(s)})(document);
                    }
                },
                furnish('img[alt=Favorite]', { src: IMG_URL.p48, onclick: event => event.target.parentElement.click() }) // <img/>
                ),

                furnish('li#wtp-hide.list-item', {
                    tooltip: 'Hide Web to Plex',
                    onclick: event => {
                        let self = event.target, parent = button, state = self.getAttribute('state') || 'show';

                        parent.classList.remove(state);
                        self.setAttribute('tooltip', state.toCaps() + ' Web to Plex');

                        let img = self.querySelector('img');

                        img && (img.src = state == 'show'? IMG_URL.j48: IMG_URL.h48);

                        if(state == 'show') {
                            state = 'hide';
                        } else {
                            state = 'show';
                        }

                        parent.classList.add(state);
                        self.setAttribute('state', state);
                    }
                },
                furnish('img[alt=Hide]', { src: IMG_URL.h48, onclick: event => event.target.parentElement.click() }) // <img/>
                ),

                furnish('li#wtp-refresh.list-item', {
                    tooltip: 'Reload Web to Plex',
                    onclick: event => {
                        let self = event.target, parent = button;

                        if(init)
                            button.setAttribute('class', 'closed floating web-to-plex-button restarting'), button.onmouseenter = button.onmouseleave = null, button.setAttribute('tooltip', 'Restarting...'), button.querySelector('.list-action').setAttribute('tooltip', 'Restarting...'), setTimeout(init, 3000);
                        else
                            new Notification('warning', "Couldn't reload. Please refresh the page.");
                    }
                },
                furnish('img[alt=Reload]', { src: IMG_URL.r48, onclick: event => event.target.parentElement.click() }) // <img/>
                ),

                furnish('li#wtp-options.list-item', {
                    tooltip: 'Open settings',
                    onclick: event => {
                        let self = event.target, parent = button;

                        return openOptionsPage();
                    }
                },
                furnish('img[alt=Settings]', { src: IMG_URL.s48, onclick: event => event.target.parentElement.click() }) // <img/>
                )
                // </li>
            )
            // </ul>
        );
    // </button>

    document.body.appendChild(button);

    return button;
}

function modifyPlexButton(button, action, title, options = {}) {
    let multiple = (action == 'multiple' || options instanceof Array),
        element = button.querySelector('.w2p-action, .list-action'),
        delimeter = '<!---->',
        ty = 'Item', txt = 'title', hov = 'tooltip',
        em = /^(tt-?|0)?$/i,
        tv = /tv[\s-]?|shows?|series/i;

    if(!element) {
        element = button;
        button = element.parentElement;
    };

    sendUpdate('SEARCH_FOR', { ...options, button });

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
            if(!option || !option.type || !option.title) continue;

            // the action should be an array
            // we'll give the button a list of links to engage, so make it snappy!
            let url = `#${ option.imdb || 'tt-' }-${ option.tmdb | 0 }-${ option.tvdb | 0 }`;

            /* Failed */
            if(/#tt-+0-0/i.test(url))
                continue;

            saved_options.push(option);
            t.push(option.title);
        }

        t = t.join(', ');
        t = t.length > 24? t.slice(0, 21).replace(/\W+$/, '') + '...': t;

        button.setAttribute('saved_options', btoa(JSON.stringify(saved_options)));
        element.addEventListener('click', element.ON_CLICK = e => {
            e.preventDefault();

            let self = e.target, tv = /tv[\s-]?|shows?|series/i, fail = 0,
                options = JSON.parse(atob(button.getAttribute('saved_options')));

            for(let index = 0, length = options.length, option; index < length; index++) {
                option = options[index];

                try {
                    if(config.ombiURL)
                        pushOmbiRequest(option);
                    else if (config.watcherURL && !tv.test(option.type))
                        pushWatcherRequest(option);
                    else if (config.radarrURL && !tv.test(option.type))
                        pushRadarrRequest(option);
                    else if (config.sonarrURL && tv.test(option.type))
                        pushSonarrRequest(option);
                    else if(config.couchpotatoURL && tv.test(option.type))
                        $pushAddToCouchpotato(option);
                } catch(error) {
                    terminal.error(`Failed to get "${ option.title }" (Error #${ ++fail })`)
                }
            }

            if (fail)
                new Notification('error', `Failed to grab ${ fail } item${fail==1?'':'s'}`);
        });

        element.setAttribute(hov, `Grab ${len} new item${s}: ${ t }`);
        button.classList.add(saved_options.length? 'wtp--download': 'wtp--error');
    } else {
    /* Handle a single item */

        if(!options || !options.type || !options.title) return;

        let empty = (em.test(options.IMDbID) && em.test(options.TMDbID) && em.test(options.TVDbID)),
            nice_title = `${options.title.toCaps()}${options.year? ` (${options.year})`: ''}`;

        if(options) {
            ty = (options.type == 'movie'? 'Movie': 'TV Show');
            txt = options.txt || txt;
            hov = options.hov || hov;
        }

        if (action == 'found') {
            element.href = getPlexMediaURL(config.server.id, options.key);
            element.setAttribute(hov, `Watch "${options.title} (${options.year})" on Plex`);
            button.classList.add('wtp--found');
        } else if (action == 'downloader' || options.remote) {

            switch(options.remote) {
                /* GoStream */
                case 'oload':
                    let href = options.href, path = '';

                    if (config.ombiURL) {
                        path = '';
                    } else if (config.watcherURL && !tv.test(options.type)) {
                        path = '';
                    } else if (config.radarrURL && !tv.test(options.type)) {
                        path = config.radarrStoragePath;
                    } else if (config.sonarrURL && tv.test(options.type)) {
                        path = config.sonarrStoragePath;
                    } else if(config.couchpotatoURL && tv.test(options.type)) {
                        path = '';
                    }

                    element.href = `#${ options.IMDbID || 'tt' }-${ options.TMDbID | 0 }-${ options.TVDbID | 0 }`;
                    button.classList.add('wtp--download');
                    element.removeEventListener('click', element.ON_CLICK);
                    element.addEventListener('click', element.ON_DOWNLOAD = e => {
                        e.preventDefault();

                        sendUpdate('DOWNLOAD_FILE', { ...options, button, href, path });
                        new Notification('update', 'Opening prompt (may take a while)...');
                    });

                    element.setAttribute(hov, `Download "${ nice_title }" | ${ty}`);
                    sendUpdate('SAVE_AS', { ...options, button, href, path });
                    new Notification('update', `"${ nice_title }" can be downloaded`, 7000, e => element.click(e));
                    return;


                /* Default & Error */
                default:
                    let url = `#${ options.IMDbID || 'tt' }-${ options.TMDbID | 0 }-${ options.TVDbID | 0 }`;

                    /* Failed */
                    if(/#tt-+0-0/i.test(url))
                        return modifyPlexButton(button, 'notfound', title, options);

                    element.href = url;
                    button.classList.add('wtp--download');
                    element.addEventListener('click', element.ON_CLICK = e => {
                        e.preventDefault();
                        if (config.ombiURL) {
                            pushOmbiRequest(options);
                        } else if (config.watcherURL && !tv.test(options.type)) {
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

            element.setAttribute(hov, `Add "${ nice_title }" | ${ty}`);
            element.style.removeProperty('display');
        } else if (action == 'notfound' || action == 'error' || empty) {
            element.removeAttribute('href');

            empty = !(options && options.title);

            if(empty)
                element.setAttribute(hov, `${ty || 'Item'} not found`);
            else
                element.setAttribute(hov, `"${ nice_title }" was not found`);

            button.classList.remove('wtp--found');
            button.classList.add('wtp--error');
        }

        element.id = options? `${options.IMDbID || 'tt'}-${options.TMDbID | 0}-${options.TVDbID | 0}`: 'tt--0-0';
    }
}

async function squabblePlex(options, button) {
    if(!(options && options.length && button))
        return;

    let results = [];

    squabblePlex.OPTIONS = options;

    for(let index = 0, length = options.length, option, opt; index < length; index++) {
        let { IMDbID, TMDbID, TVDbID } = (option = await options[index]);


        opt = { name: option.title, title: option.title, year: option.year, image: options.image, type: option.type, imdb: IMDbID, IMDbID, tmdb: TMDbID, TMDbID, tvdb: TVDbID, TVDbID };

        try {
            await getPlexMediaRequest(option)
                .then(async({ found, key }) => {
                    if (found) {
                        // ignore found items, we only want new items
                    } else {
                        option.field = 'original_title';

                        return await getPlexMediaRequest(option)
                            .then(({ found, key }) => {
                                if (found) {
                                    // ignore found items, we only want new items
                                } else {
                                    let available = (config.ombiURL || config.watcherURL || config.radarrURL || config.sonarrURL || config.couchpotatoURL),
                                        action = (available ? 'downloader' : 'notfound'),
                                        title = available ?
                                            'Not on Plex (download available)':
                                        'Not on Plex (download not available)';

                                    results.push({ ...opt, found: false, status: action });
                                }
                            });
                    }
                })
        } catch(error) {
            terminal.error('Request to Plex failed: ' + String(error));
        }
    }

    results = results.filter(v => v.status == 'downloader');

    let img = furnish('img', { title: 'Add to Plex It!', src: IMG_URL.p48, onclick: event => {let frame = document.querySelector('#plexit-bookmarklet-frame'); frame.src = frame.src.replace(/(#plexit:.*)?$/, '#plexit:' + event.target.parentElement.getAttribute('data'))} }),
        po, pi = furnish('li#plexit.list-item', { data: btoa(JSON.stringify(results)) }, img),
        op  = document.querySelector('#wtp-plexit');

    if(po = button.querySelector('#plexit'))
        po.remove();
    button.querySelector('ul').insertBefore(pi, op);

    if (results.length)
        modifyPlexButton(button, 'multiple', 'Download these items', results);
}

function findPlexMedia(options) {
    if(!(options && options.title))
        return;

    let { IMDbID, TMDbID, TVDbID } = options;

    let opt = { name: options.title, year: options.year, image: options.image || IMG_URL.nil, type: options.type, imdb: IMDbID, IMDbID, tmdb: TMDbID, TMDbID, tvdb: TVDbID, TVDbID },
        op  = document.querySelector('#wtp-plexit'),
        img = (options.image)?
            furnish('div', { tooltip: 'Add to Plex It!', style: `background: url(${ IMG_URL.p16 }) top right/60% no-repeat, #0004 url(${ opt.image }) center/contain no-repeat; height: 48px; width: 34px;`, draggable: true, onclick: event => {let frame = document.querySelector('#plexit-bookmarklet-frame'); frame.src = frame.src.replace(/(#plexit:.*)?$/, '#plexit:' + event.target.parentElement.getAttribute('data'))} }):
        furnish('img', { title: 'Add to Plex It!', src: IMG_URL.p48, onclick: event => {let frame = document.querySelector('#plexit-bookmarklet-frame'); frame.src = frame.src.replace(/(#plexit:.*)?$/, '#plexit:' + event.target.parentElement.getAttribute('data'))} });

    findPlexMedia.OPTIONS = options;

    try {
        getPlexMediaRequest(options)
            .then(({ found, key }) => {
                if (found) {
                        modifyPlexButton(options.button, 'found', 'On Plex', { ...options, key });
                        opt = { ...opt, url: options.button.href, found: true, status: 'found' };

                        let po, pi = furnish('li#plexit.list-item', { data: btoa(JSON.stringify(opt)) }, img);

                        if(po = options.button.querySelector('#plexit'))
                            po.remove();
                        options.button.querySelector('ul').insertBefore(pi, op);
                } else {
                    options.field = 'original_title';

                    return getPlexMediaRequest(options)
                        .then(({ found, key }) => {
                            if (found) {
                                modifyPlexButton(options.button, 'found', 'On Plex', { ...options, key });
                                opt = { ...opt, url: options.button.href, found: true, status: 'found' };

                                let po, pi = furnish('li#plexit.list-item', { data: btoa(JSON.stringify(opt)) }, img);

                                if(po = options.button.querySelector('#plexit'))
                                    po.remove();
                                options.button.querySelector('ul').insertBefore(pi, op);
                            } else {
                                let available = (config.ombiURL || config.watcherURL || config.radarrURL || config.sonarrURL || config.couchpotatoURL),
                                    action = (available ? 'downloader' : 'notfound'),
                                    title = available ?
                                        'Not on Plex (download available)':
                                    'Not on Plex (download not available)';

                                modifyPlexButton(options.button, action, title, options);
                                opt = { ...opt, found: false, status: action };

                                let po, pi = furnish('li#plexit.list-item', { data: btoa(JSON.stringify(opt)) }, img);

                                if(po = options.button.querySelector('#plexit'))
                                    po.remove();
                                if(!!~[].slice.call(options.button.querySelector('ul').children).indexOf(op))
                                    options.button.querySelector('ul').insertBefore(pi, op);
                            }
                        });
                }
            })
        } catch(error) {
            return modifyPlexButton(
                    options.button,
                    'error',
                    'Request to Plex Media Server failed',
                    options
                ),
                terminal.error(`Request to Plex failed: ${ String(error) }`);
        }
}

function getPlexMediaRequest(options) {
    return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({
                type: 'SEARCH_PLEX',
                options,
                serverConfig: config.server
            },
            response =>
                (response && response.error)?
                    reject(response.error):
                (!response)?
                    reject(new Error('Unknown error')):
                resolve(response)
            );
        });
}

function getPlexMediaURL(PlexUIID, key) {
    return config.plexURL.replace(RegExp(`\/(${ config.server.id })?$`), `/web#!/server/` + PlexUIID) + `/details?key=${encodeURIComponent( key )}`;
}

/* Listen for Plugin events */
chrome.runtime.onMessage.addListener(async(request, sender) => {
    terminal.log(`Plugin event [${ request.plugin }]:`, request);

    switch(request.type) {
        case 'POPULATE':
            let button = renderPlexButton(), data = request.data;

            if(!button)
                return terminal.warn(`The button failed to render. ${ request.name } @ instance ${ request.instance }`);
            if(!data.title || !data.type)
                return terminal.error(`Can't parse missing information. ${ request.name } @ instance ${ request.instance }`);

            let { image, type, title, year, IMDbID, TMDbID, TVDbID } = data;
            let Db = await getIDs(data);

            IMDbID = IMDbID || Db.imdb || 'tt-';
            TMDbID = TMDbID || Db.tmdb || 0;
            TVDbID = TVDbID || Db.tvdb || 0;

            title = title || Db.title;
            year = +(year || Db.year || 0);

            findPlexMedia({ type, title, year, image, button, IMDbID, TMDbID, TVDbID });
            return true;

        default:
//            terminal.warn(`Unknown event [${ request.type }]`);
            return false;
    }
});

/* Listen for Window events - from iframes, etc. */
top.addEventListener('message', request => {
    try {
        request = request.data;

        switch(request.type) {
            case 'SEND_VIDEO_LINK':
                let options = { ...findPlexMedia.OPTIONS, href: request.href, remote: request.from };

                modifyPlexButton(options.button, 'downloader', 'Download', options);
                return true;

            default:
    //            terminal.warn(`Unknown event [${ request.type }]`);
                return false;
        }
    } catch(error) {
        new Notification('error', `Unable to use downloader: ${ String(error) }`);
        throw error
    }
});

String.prototype.toCaps = function toCaps(all) {
    /** Titling Caplitalization
     * Articles: a, an, & the
     * Conjunctions: and, but, for, nor, or, so, & yet
     * Prepositions: across, after, although, at, because, before, between, by, during, from, if, in, into, of, on, to, through, under, with, & without
     */
    let array = this.toLowerCase(),
        titles = /(?!^|(?:an?|the)\s+)\b(a([st]|nd?|cross|fter|lthough)?|b(e(cause|fore|tween)|ut|y)|during|from|in(to)?|[io][fn]|[fn]?or|the|[st]o|through|under|with(out)?|yet)(?!\s*$)\b/gi,
        cap_exceptions = /([\|\"\(]\s*[a-z]|[\:\.\!\?]\s+[a-z]|(?:^\b|[^\'\-\+]\b)[^aeiouy\d\W]+\b)/gi, // Punctuation exceptions, e.g. "And not I"
        all_exceptions = /\b((?:ww)?(?:m+[dclxvi]*|d+[clxvi]*|c+[lxvi]*|l+[xvi]*|x+[vi]*|v+i*|i+))\b/gi, // Roman Numberals
        cam_exceptions = /\b((?:mr?s|[sdjm]r|mx)|(?:adm|cm?dr?|chf|c[op][lmr]|cpt|gen|lt|mjr|sgt)|doc|hon|prof)\./gi; // Titles (Most Common?)

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
          .replace(cap_exceptions, ($0, $1, $$, $_) => $1.toUpperCase())
          .replace(all_exceptions, ($0, $1, $$, $_) => $1.toUpperCase())
          .replace(cam_exceptions, ($0, $1, $$, $_) => $0[0].toUpperCase() + $0.slice(1, $0.length).toLowerCase());

    return string;
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
    parent.queryBy = function queryBy(selectors, container = parent) {
        // Helpers
        let copy = array => [].slice.call(array),
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

        let order       = selectors.split(','),
            dummy       = copy(order),
            output      = [],
            generations = 0;

        // Replace those syntaxes (they were ignored)
        for(index = 0, length = dummy.length, order = [], regexp = /[\b]--(\d+)[\b]/g; index < length; index++)
          order.push(dummy[index].replace(regexp, ($0, $1, $$, $_) => pulled[+$1 - 1]));

        // Make sure to put the elements in order
        // Handle the :parent (pseudo) selector
        for(index = 0, length = order.length; index < length; generations = 0, index++) {
          let selector = order[index], ancestor;

          selector = selector
            .replace(/\:nth-parent\((\d+)\)/g, ($0, $1, $$, $_) => (generations -= +$1, ''))
            .replace(/(\:{1,2}parent\b|<\s*(\*|\s*(,|$)))/g, ($0, $$, $_) => (--generations, ''))
            .replace(/<([^<,]+)?/g, ($0, $1, $$, $_) => (ancestor = $1, --generations, ''));

          let elements = query(selector),
              parents = [], parent;

          for(; generations < 0; generations++)
            elements.forEach( element => {
              let P = element,
                  E = C => [].slice.call(query(ancestor, C)),
                  F;

              for(let I = 0, L = -generations; ancestor && !!P && I < L; I++)
                P = !!~E(P.parentElement).indexOf(P)? P: P.parentElement;

              parent = ancestor? !~E(P.parentElement).indexOf(P)? null: P: P.parentElement;

              if(!~parents.indexOf(parent))
                parents.push(parent);
            });
          media.push(parents.length? parents: elements);
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
            }
        });

        return media;
    };

/** Adopted from <https://github.com/crislin2046/createElement>
 * LICENSE: MIT (2018)
 */
    parent.furnish = function furnish(name, attributes = {}, ...children) {
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
        ([name, value]) => (/^(on|(?:inner|outer)(?:HTML|Text)|class(?:List|Name)$|value)/.test(name))?
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
            parent.createTextNode(child)
        );

      return element;
    }
})(document);

let PRIMITIVE = Symbol.toPrimitive,
    queryBy = document.queryBy,
    furnish = document.furnish;

queryBy[PRIMITIVE] = furnish[PRIMITIVE] = String.prototype.toCaps[PRIMITIVE] = () => 'function furnish() { [foreign code] }';
