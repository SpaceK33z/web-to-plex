let script = {
    "url": "*://*.hulu.com/*",

    "ready": () => !$('#content [class$="__meta"]').empty,

    "init": (ready) => {
        let _title, _year, _image, R = RegExp;

        let title  = $('#content [class$="__name"]').first,
            year   = $('#content [class$="__meta"] [class$="segment"]:last-child').first,
            image,
            type   = script.getType();

        title = title.textContent.replace(/^\s+|\s+$/g, '').toCaps();
        year  = +year.textContent.replace(/.*\((\d{4})\).*/, '$1');

        return { type, title, year, image };
    },

    "getType": () => {
        let { pathname } = top.location;

        return pathname.startsWith('/movie/')?
            'movie':
        pathname.startsWith('/series/')?
            'show':
        'error';
    },
};

window.onlocationchange = script.init;
