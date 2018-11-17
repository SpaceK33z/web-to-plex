/* Plugn.js (Plugin) - Web to Plex */
/* global config */

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

function RandomName(length = 8, symbol = '') {
    let values = [];

    window.crypto.getRandomValues(new Uint32Array(16)).forEach((value, index, array) => values.push(value.toString(36)));

    return this.length = length, this.value = values.join(symbol);
};

let running = [], instance, TAB;

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
    ali = url.host.replace(/^(ww\w\.)/, '');
    can = GetConsent(ali);
    js  = load(`script:${ ali }`);

    if(!can || !js) return;

    let name = js + '_' + instance;

    fetch(`https://ephellon.github.io/web.to.plex/plugins/${ js }.js`, { mode: 'cors' })
        .then(response => response.text())
        .then(code => {
            chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
                chrome.tabs.executeScript(id, { code: `const ${ name } = (()=>{'use strict';\n${ code }\n;return RegExp(plugin.url.replace(/\\|.*/, '').replace(/^\\*\\:/, '\\\\w{3,}:').replace(/\\*\\./g, '([^\\\\.]+\\\\.)?'), 'i').test("${ url.href }")?plugin.init():console.warn("The domain '${ org }' ('${ url.href }') does not match the domain pattern '"+plugin.url+"'")\n})(); ${ name }` }, results => handle(results, id, instance, js))
            })
        })
        .then(() => running.push(id, instance))
        .catch(error => { throw error });
};

window.onlocationchange = window.onload = event => {
    instance = RandomName().replace(/^\d+/, '');

    tabchange([TAB]);
};

let handle = (results, tabID, instance, plugin) => {
    if(!results)
        return console.warn(`Instance @${ tabID } [${ instance }] failed to execute`);

    let data = results[0];

    if(!data)
        return console.warn(`Instance @${ tabID } [${ instance }] failed to execute`);

    chrome.tabs.executeScript(tabID, { file: 'utils.js' }, () => {
        chrome.tabs.insertCSS(tabID, { file: 'sites/common.css' });
        chrome.tabs.sendMessage(tabID, { data, plugin, instance, type: 'POPULATE' });
    });
};

//chrome.tabs.onActiveChanged.addListener(tabchange);
setInterval(() =>
    chrome.tabs.query({
        active: true,
        currentWindow: true,
    }, tabchange)
, 1000);
