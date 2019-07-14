let SHOW = '[href*="thetvdb.com/"][href*="id="], [href*="thetvdb.com/series/"], [href*="themoviedb.org/tv/"], [href*="imdb.com/title/tt"][href$="externalsites"]',
    FILM = '[href*="themoviedb.org/tv/"], [href*="imdb.com/title/tt"]';
    // FILM = '#media_result_group, ...'

let script = {
    "url": "*://www.google.com/search",

    "init": (ready) => {
        let _title, _year, _image, R = RegExp;

        let type = script.getType();

        if(type == 'movie') {
            let _type = $('.kno-ecr-pt + *').first; // in case a tv show is incorrectly identified

            if(_type) {
                type = _type.textContent;

                type = /\b(tv|show|series)\b/i.test(type)? 'show': /\b(movie|film|cinema|(?:\d+h\s+)?\d+m)\b/i.test(type)? 'movie': 'error';
                _year = (type == 'show'? $('.kno-fv').first || _year: _year) || { textContent: '' };
            }

            _title = $('.kno-ecr-pt').first;
            _year  = $('.kno-fb-ctx:not([data-local-attribute]) span').first;
            _image = $('#media_result_group img').first;
        } else if(type == 'show') {
            _title = $(SHOW).first.querySelector('*');
            _year = { textContent: '' };
            _image = { src: '' };
        } else if(type == 'error') {
            return null;
        }

        (_year.textContent + '').replace(/(\d{4})/);

        let year  = +R.$1,
            title = _title.textContent.replace((type == 'movie'? /^(.+)$/: /(.+)(?:(?:\:\s*series\s+info|\-\s*(?:all\s+episodes|season)).+)$/i), '$1').trim(),
            image = (_image || {}).src;

        year = year > 999? year: 0;

        let IMDbID = script.getIMDbID();

        return { type, title, year, image, IMDbID };
    },

    "getIMDbID": () => {
        let link = $('a._hvg[href*="imdb.com/title/tt"]').first;

        if(link)
            return link.href.replace(/.*(tt\d+).*/, '$1');
    },

    "getType": () => (
        !$(FILM).empty?
            'movie':
        !$(SHOW).empty?
            'show':
        'error'
    ),
};
