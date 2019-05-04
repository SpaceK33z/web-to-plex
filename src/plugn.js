/* plugn.js (Plugin) - Web to Plex */
/* global config */

let DISABLE_DEBUGGER = false;

let scribe =
    DISABLE_DEBUGGER?
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

function RandomName(length = 16, symbol = '') {
    let values = [];

    window.crypto.getRandomValues(new Uint32Array(length)).forEach((value, index, array) => values.push(value.toString(36)));

    return values.join(symbol).replace(/^[^a-z]+/i, '');
};

let running = [], instance = RandomName(), TAB, cache = {};

let tabchange = tabs => {
   let tab = tabs[0];

    if(!tab) return;

    TAB = tab;

    let id  = tab.id,
        url = tab.url,
        org, ali, js,
        type, cached;

    if(!url || /^chrome/i.test(url) || (!!~running.indexOf(id) && !!~running.indexOf(instance)))
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

    scribe.log(ali, can, js);

    if(!can || !js) return;

    if(code) {
        chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
            // Sorry, but the instance needs to be callable multiple times
            chrome.tabs.executeScript(id, { code }, results => handle(results, id, instance, js, type))
        });

        return setTimeout(() => cache = {}, 1e6);
    }

    let name = (DISABLE_DEBUGGER? instance: `top.${ instance }`); // makes debugging easier

    fetch(`https://ephellon.github.io/web.to.plex/${ type }s/${ js }.js`, { mode: 'cors' })
        .then(response => response.text())
        .then(code => {
            chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
                // Sorry, but the instance needs to be callable multiple times
                chrome.tabs.executeScript(id, { code: (cache[ali] = `${ name } = (${ name } || (${ name }$=$=>{'use strict';\n${ code }\n;return RegExp(${ type }.url.replace(/\\|.*?(\\)|$)/g,'').replace(/^\\*\\:/,'\\\\w{3,}:').replace(/\\*\\./g,'([^\\\\.]+\\\\.)?'),'i').test("${ url.href }")?${ type }.ready?${ type }.ready()?${ type }.init(!0):setTimeout(${ name }$,1000):${ type }.init():console.warn("The domain '${ org }' ('${ url.href }') does not match the domain pattern '"+${ type }.url+"'");\n})(document.queryBy)); console.log('${ name } =', ${ name }); ${ name }`) }, results => handle(results, id, instance, js, type))
            })
        })
        .then(() => running.push(id, instance))
        .catch(error => { throw error });
};

window.onlocationchange = event => {
    instance = RandomName();
    tabchange([ TAB ]);
};

let handle = (results, tabID, instance, script, type) => {
    let InstanceWarning = `[${ type.toUpperCase() }] Instance failed to execute @${ tabID }#${ instance }`;

    if(!results || !results[0] || !instance)
        return scribe.warn(InstanceWarning);

    let data = results[0];

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
chrome.tabs.onUpdated.addListener((ID, change, tab) => {
    if(change.status == 'complete' && tab.active)
        tabchange([ tab ]);
});

// listen for a page load
chrome.runtime.onMessage.addListener((request, sender, callback) => {
    terminal.log('From: ' + sender);

    let options = request.options,
        tab     = TAB || {},
        id      = tab.id,
        url     = tab.url,
        org;

    if(!url || /^chrome/i.test(url) || (!!~running.indexOf(id) && !!~running.indexOf(instance)))
        return /*
            Stop if:
                a) There isn't a url
                b) The url is a chrome url
                c) The tab AND instance are accounted for
        */;

    url = new URL(url);
    org = url.origin;

    if(request && request.options)
        switch(request.type) {
            case 'PLUGIN':
                let plugin = options.plugin;

                fetch(`https://ephellon.github.io/web.to.plex/plugins/${ plugin }.js`, { mode: 'cors' })
                    .then(response => response.text())
                    .then(code => {
                        chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
                            // Sorry, but the instance needs to be callable multiple times
                            chrome.tabs.executeScript(id, { code: (cache[plugin] = `${ name } = (${ name } || (($)=>{'use strict';\n${ code }\n;return RegExp(plugin.url.replace(/\\|.*?(\\)|$)/g,'').replace(/^\\*\\:/,'\\\\w{3,}:').replace(/\\*\\./g,'([^\\\\.]+\\\\.)?'),'i').test("${ url.href }")?plugin.ready?plugin.ready()?plugin.init(!0):setTimeout(${ name },1000):plugin.init():console.warn("The domain '${ org }' ('${ url.href }') does not match the domain pattern '"+plugin.url+"'");\n})(document.queryBy)); console.log('${ name } =', ${ name }); ${ name }`) }, results => handle(results, id, instance, plugin, 'plugin'))
                        })
                    })
                    .then(() => running.push(id, instance))
                    .catch(error => { throw error });
                return true;

            case 'SCRIPT':
                let script = options.script;

                fetch(`https://ephellon.github.io/web.to.plex/scripts/${ script }.js`, { mode: 'cors' })
                    .then(response => response.text())
                    .then(code => {
                        chrome.tabs.executeScript(id, { file: 'helpers.js' }, () => {
                            // Sorry, but the instance needs to be callable multiple times
                            chrome.tabs.executeScript(id, { code: (cache[script] = `${ name } = (${ name } || (($)=>{'use strict';\n${ code }\n;return RegExp(script.url.replace(/\\|.*?(\\)|$)/g,'').replace(/^\\*\\:/,'\\\\w{3,}:').replace(/\\*\\./g,'([^\\\\.]+\\\\.)?'),'i').test("${ url.href }")?script.ready?script.ready()?script.init(!0):setTimeout(${ name },1000):script.init():console.warn("The domain '${ org }' ('${ url.href }') does not match the domain pattern '"+script.url+"'");\n})(document.queryBy)); console.log('${ name } =', ${ name }); ${ name }`) }, results => handle(results, id, instance, script, 'script'))
                        })
                    })
                    .then(() => running.push(id, instance))
                    .catch(error => { throw error });
                return true;

            default:
                return false;
        };
});
