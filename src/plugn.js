/* plugn.js (Plugin) - Web to Plex */
/* global config */

let DISABLE_DEBUGGER = false;

let scribe =
    DISABLE_DEBUGGER?
        { error: m => m, info: m => m, log: m => m, warn: m => m, group: m => m, groupEnd: m => m }:
    console;

let LAST, LAST_JS, LAST_INSTANCE, LAST_ID, LAST_TYPE, FOUND = {};

function load(name) {
    return JSON.parse(localStorage.getItem(btoa(name)));
}

function save(name, data) {
    return localStorage.setItem(btoa(name), JSON.stringify(data));
}

function GetConsent(origin) {
    return load('permission:' + origin);
}

function RandomName(length = 16, symbol = '') {
    let values = [];

    window.crypto.getRandomValues(new Uint32Array(length)).forEach((value, index, array) => values.push(value.toString(36)));

    return values.join(symbol).replace(/^[^a-z]+/i, '');
};

let running = [], instance = RandomName(), TAB, cache = {};

let tabchange = tabs => {
   let tab = tabs[0];

    if(!tab || FOUND[instance]) return;

    TAB = tab;

    let id  = tab.id,
        url = tab.url,
        org, ali, js,
        type, cached;

    if(
        !url
        || /^(?:chrome|debugger|view-source)/i.test(url)
        // || (!!~running.indexOf(id) && !!~running.indexOf(instance))
    )
        return /*
            Stop if:
                a) There isn't a url
                b) The url is a chrome url
                c) The tab AND instance are accounted for
        */;

    url  = new URL(url);
    org  = url.origin;
    ali  = url.host.replace(/^(ww\w+\.|\w{2}\.)/i, '');
    can  = GetConsent(ali);
    type = (load(`builtin:${ ali }`) + '') == 'true'? 'script': 'plugin';
    js   = load(`${ type }:${ ali }`);
    code = cache[ali];

    if(!can || !js) return;

    if(code) {
        chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
            // Sorry, but the instance needs to be callable multiple times
            chrome.tabs.executeScript(id, { code }, results => handle(results, id, instance, js, type))
        });

        return setTimeout(() => cache = {}, 1e6);
    }

    let name = (DISABLE_DEBUGGER? instance: `top.${ instance }`); // makes debugging easier

    fetch(
        (
            !DISABLE_DEBUGGER && type === 'script'?
                chrome.runtime.getURL(`cloud/${ js }.js`):
            `https://ephellon.github.io/web.to.plex/${ type }s/${ js }.js`
        )
        , { mode: 'cors' })
        .then(response => response.text())
        .then(code => {
            chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
                // Sorry, but the instance needs to be callable multiple times
                chrome.tabs.executeScript(id, { code: (LAST = cache[ali] = `${ name } = (${ name } || (${ name }$=$=>{'use strict';\n${ code }\n;onlocationchange=event=>${ type }.init();return RegExp(${ type }.url/*.replace(/\\|.*?(\\)|$)/g,'')*/.replace(/^\\*\\:/,'\\\\w{3,}:').replace(/\\*\\./g,'([^\\\\.]+\\\\.)?').replace(/\\/\\*/g,'/[^$]*'),'i').test("${ url.href }")?${ type }.ready?${ type }.ready()?${ type }.init(!0):null:${ type }.init():console.warn("The domain '${ org }' ('${ url.href }') does not match the domain pattern '"+${ type }.url+"'");\n})(document.queryBy)); console.log('[${ instance }]', ${ name }); (${ name })`) }, results => handle(results, LAST_ID = id, LAST_INSTANCE = instance, LAST_JS = js, LAST_TYPE = type))
            })
        })
        .then(() => running.push(id, instance))
        .catch(error => { throw error });
};

let handle = (results, tabID, instance, script, type) => {
    let InstanceWarning = `[${ type.toUpperCase() }] Instance failed to execute @${ tabID }#${ instance }`;

    if((!results || !results[0] || !instance) && !FOUND[instance])
        try {
            instance = RandomName();
            tabchange([ TAB ]);
            return;
        } catch(error) {
            return scribe.warn(InstanceWarning);
        }

    let data = results[0];

    if(typeof data != 'object')
        return /* setTimeout */;

    try {
        chrome.tabs.insertCSS(tabID, { file: 'sites/common.css' });
        chrome.tabs.sendMessage(tabID, { data, script, instance, instance_type: 'script', type: 'POPULATE' });
    } catch(error) {
        throw new Error(InstanceWarning + ' - ' + String(error));
    }
};

// this doesn't actually work...
//chrome.tabs.onActiveChanged.addListener(tabchange);

// workaround for the above
chrome.tabs.onActivated.addListener(change => {
    instance = RandomName();

    chrome.tabs.get(change.tabId, tab => tabchange([ tab ]));
});

chrome.tabs.onUpdated.addListener((ID, change, tab) => {
    instance = RandomName();

    if(change.status == 'complete' && !tab.discarded)
        tabchange([ tab ]);
    else if(!tab.discarded)
        setTimeout(() => tabchange([ tab ]), 1000);
});

// listen for a page load
chrome.runtime.onMessage.addListener((request, sender, callback) => {
    terminal.log('From: ' + sender);

    let options = request.options,
        tab     = TAB || {},
        id      = tab.id,
        url     = tab.url,
        org;

    if(
        !url
        || /^(?:chrome|debugger|view-source)/i.test(url)
        // || (!!~running.indexOf(id) && !!~running.indexOf(instance))
    )
        return /*
            Stop if:
                a) There isn't a url
                b) The url is a chrome url
                c) The tab AND instance are accounted for
        */;

    url = new URL(url);
    org = url.origin;

    let name = (DISABLE_DEBUGGER? instance: `top.${ instance }`); // makes debugging easier

    if(request && request.options)
        switch(request.type) {
            case 'PLUGIN':
                let plugin = options.plugin;

                fetch(`https://ephellon.github.io/web.to.plex/plugins/${ plugin }.js`, { mode: 'cors' })
                    .then(response => response.text())
                    .then(code => {
                        chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
                            // Sorry, but the instance needs to be callable multiple times
                            chrome.tabs.executeScript(id, { code: (LAST = cache[plugin] = `${ name } = (${ name } || (${ name }$=$=>{'use strict';\n${ code }\n;onlocationchange=event=>plugin.init();return RegExp(plugin.url/*.replace(/\\|.*?(\\)|$)/g,'')*/.replace(/^\\*\\:/,'\\\\w{3,}:').replace(/\\*\\./g,'([^\\\\.]+\\\\.)?').replace(/\\/\\*/g,'/[^$]*'),'i').test("${ url.href }")?plugin.ready?plugin.ready()?plugin.init(!0):null:plugin.init():console.warn("The domain '${ org }' ('${ url.href }') does not match the domain pattern '"+plugin.url+"'");\n})(document.queryBy)); console.log('[${ instance }]', ${ name }); (${ name })`) }, results => handle(results, LAST_ID = id, LAST_INSTANCE = instance, LAST_JS = plugin, LAST_TYPE = 'plugin'))
                        })
                    })
                    .then(() => running.push(id, instance))
                    .catch(error => { throw error });
                break;

            case 'SCRIPT':
                let script = options.script;

                fetch(
                    (
                        !DISABLE_DEBUGGER?
                            chrome.runtime.getURL(`cloud/${ script }.js`):
                        `https://ephellon.github.io/web.to.plex/scripts/${ script }.js`
                    )
                    , { mode: 'cors' })
                    .then(response => response.text())
                    .then(code => {
                        chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
                            // Sorry, but the instance needs to be callable multiple times
                            chrome.tabs.executeScript(id, { code: (LAST = cache[script] = `${ name } = (${ name } || (${ name }$=$=>{'use strict';\n${ code }\n;onlocationchange=event=>script.init();return RegExp(script.url/*.replace(/\\|.*?(\\)|$)/g,'')*/.replace(/^\\*\\:/,'\\\\w{3,}:').replace(/\\*\\./g,'([^\\\\.]+\\\\.)?').replace(/\\/\\*/g,'/[^$]*'),'i').test("${ url.href }")?script.ready?script.ready()?script.init(!0):null:script.init():console.warn("The domain '${ org }' ('${ url.href }') does not match the domain pattern '"+script.url+"'");\n})(document.queryBy)); console.log('[${ instance }]', ${ name }); (${ name })`) }, results => handle(results, LAST_ID = id, LAST_INSTANCE = instance, LAST_JS = script, LAST_TYPE = 'script'))
                        })
                    })
                    .then(() => running.push(id, instance))
                    .catch(error => { throw error });
                break;

            case '_INIT_':
                chrome.tabs.executeScript(id, { code: LAST }, results => handle(results, LAST_ID, LAST_INSTANCE, LAST_JS, LAST_TYPE));
                break;

            case 'FOUND':
                FOUND[request.instance] = request.found;
                break;

            default:
                return false;
        };

    instance = RandomName();

    return true;
});
