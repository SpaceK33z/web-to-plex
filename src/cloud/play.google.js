let script = {
    "url": "*://play.google.com/store/(movies|tv)/details/*",

    "init": (ready) => {
        let _title, _year, _image, R = RegExp;

        let type   = script.getType(),
            title  = $('h1').first,
            year   = $(`h1 ~ div span:${ type == 'movie'? 'first': 'last' }-of-type`).first,
            image  = $('img[alt="cover art" i]').first;

        title = title.textContent.replace(/\(\s*(\d{4})\s*\).*?$/, '').trim();
        year = (R.$1 || year.textContent).replace(/^.*?(\d+)/, '$1').trim();
        image = (image || {}).src;

        return { type, title, year, image };
    },

    "getType": () => (
        location.pathname.startsWith('store/movies/')?
            'movie':
        'show'
    ),
};

addEventListener('popstate', script.init);
addEventListener('pushstate-changed', script.init);
