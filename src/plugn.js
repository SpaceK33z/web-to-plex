/* Plugn.js (Plugin) - Web to Plex */
/* global config */

let KILL_DEBUGGER = false;

let logger =
    KILL_DEBUGGER?
        { error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m }:
    console;

function load(name) {
    return JSON.parse(localStorage.getItem(btoa(name)));
}

function save(name, data) {
    return localStorage.setItem(btoa(name), JSON.stringify(data));
}

function GetConsent(origin) {
    return load('permission:' + origin);
}

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

setInterval(() => watchlocationchange('pathname'), 1000);

function RandomName(length = 16, symbol = '') {
    let values = [];

    window.crypto.getRandomValues(new Uint32Array(length)).forEach((value, index, array) => values.push(value.toString(36)));

    return values.join(symbol).replace(/^[^a-z]+/i, '');
};

let running = [], instance = RandomName(), TAB;

let tabchange = tabs => {
   let tab = tabs[0];

    if(!tab) return;

    TAB = tab;

    let id  = tab.id,
        url = tab.url,
        can, org, ali, js;

    if(!url || /^chrome/i.test(url) || (!!~running.indexOf(id) && !!~running.indexOf(instance)))
        return /*
            Stop if:
                a) There isn't a url
                b) The url is a chrome url
                c) The tab AND instance are accounted for
        */;

    url = new URL(url);
    org = url.origin;
    ali = url.host.replace(/^(ww\w+\.|\w{2}\.)/i, '');
    can = GetConsent(ali);
    js  = load(`script:${ ali }`);

    if(!can || !js) return;

    let name = (KILL_DEBUGGER? instance: `top.${instance }`); // makes debugging easier

    fetch(`https://ephellon.github.io/web.to.plex/plugins/${ js }.js`, { mode: 'cors' })
        .then(response => response.text())
        .then(code => {
            chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
                // Sorry, but the instance needs to be callable multiple times
                chrome.tabs.executeScript(id, { code: `${ name } = (${ name } || (()=>{'use strict';\n${ code }\n;return RegExp(plugin.url.replace(/\\|.*?(\\)|$)/g, '').replace(/^\\*\\:/, '\\\\w{3,}:').replace(/\\*\\./g, '([^\\\\.]+\\\\.)?'), 'i').test("${ url.href }")?plugin.init():console.warn("The domain '${ org }' ('${ url.href }') does not match the domain pattern '"+plugin.url+"'")\n})()); ${ name }` }, results => handle(results, id, instance, js))
            })
        })
        .then(() => running.push(id, instance))
        .catch(error => { throw error });
};

window.onlocationchange = event => {
    instance = RandomName();
    tabchange([TAB]);
};

let handle = (results, tabID, instance, plugin) => {
    let InstanceWarning = `Instance @${ tabID } [${ instance }] failed to execute`;

    if(!results || !results[0] || !instance)
        return logger.warn(InstanceWarning);

    let data = results[0];

    try {
        chrome.tabs.executeScript(tabID, { file: 'utils.js' }, () => {
            chrome.tabs.insertCSS(tabID, { file: 'sites/common.css' });
            chrome.tabs.sendMessage(tabID, { data, plugin, instance, type: 'POPULATE' });
        });
    } catch(error) {
        throw new Error(InstanceWarning + ': ' + String(error));
    }
};

// this doesn't actually work...
//chrome.tabs.onActiveChanged.addListener(tabchange);

// workaround for the above
setInterval(() =>
    chrome.tabs.query({
        active: true,
        currentWindow: true,
    }, tabchange)
, 1000);
