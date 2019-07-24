let openedByUser = false,
    listenersSet = false;

let script = {
    "url": "*://www.youtube.com/*",

    "timeout": 5000,

    "init": (ready, rerun = false) => {
        let _title, _year, _image, R = RegExp;

        let open  = () => $('.more-button').first.click(),
            close = () => $('.less-button').first.click(),
            options, type,
            alternative = $('#offer-module-container[class*="movie-offer"], #offer-module-container[class*="unlimited-offer"]');

        if($('.more-button, .less-button').empty || !$('.opened').empty)
            return script.timeout;

        // try to not bug the page content too much, use an alternative method first (if applicable)
        if(!alternative.empty && !rerun) {
            alternative = alternative.first;

            let title = $('#title', alternative).first,
                year  = $('#info p', alternative).child(2).lastElementChild,
                image = $('#img img', alternative).first,
                type  = /\bmovie-offer\b/i.test(alternative.classList)? 'movie': 'show';

            if(!title || !year || !type)
                return script.init(ready, true);

            title = title.textContent;
            year  = year.textContent|0;
            image = image.src;

            return { type, title, year, image };
        }

        open(); // show the year and other information, fails otherwise

        type = script.getType();

        if(type == 'error')
            return close(), script.timeout;

        if(type == 'movie' || type == 'show') {
            let title = $((type == 'movie'? '.title': '#owner-container')).first,
                year  = $('#content ytd-expander').first;

            if(!title)
                return close(), null;

            title = title.textContent.trim();
            year  = +year.textContent.replace(/[^]*(?:release|air) date\s+(?:(?:\d+\/\d+\/)?(\d{2,4}))[^]*/i, ($0, $1, $$, $_) => +$1 < 1000? 2000 + +$1: $1);

            title = title.replace(RegExp(`\\s*(\\(\\s*)?${ year }\\s*(\\))?`), '');

            options = { type, title, year };
        } else if(type == 'list') {
            let title = $('#title').first,
                year  = $('#stats *').child(2),
                image = $('#thumbnail #img').first;

            if(!title)
                return close(), null;

            title = title.textContent.trim();
            year  = parseInt(year.textContent);
            image = (image || {}).src;
            type  = 'show';

            options = { type, title, year, image };
        }

        close(); // close the meta-information

        if(!listenersSet) {
            setInterval(() => {
                let closed = 'collapsed' in $('ytd-expander').first.attributes;

                if(closed && !openedByUser)
                    script.init(true);
            }, 10);

            $('ytd-expander').first.addEventListener('mouseup', event => {
                let closed = 'collapsed' in $('ytd-expander').first.attributes;

                if(!closed)
                    openedByUser = true;
                else
                    openedByUser = false;
            });

            listenersSet = true;
        }

        return options;
    },

    "getType": () => {
        let title = $('.super-title, #title').filter(e => e.textContent)[0],
            owner = $('#owner-container');

        if(owner.empty)
            return 'error';
        else
            owner = owner.first.textContent.replace(/^\s+|\s+$/g, '');

        return (/\byoutube movies\b/i.test(owner))?
            'movie':
        (title && /\bs\d+\b.+\be\d+\b/i.test(title.textContent))?
            'show':
        (title && /\/playlist\b/.test(top.location.pathname))?
            'list':
        'error';
    },
};

// $('a[href*="/watch?v="]').forEach(element => element.onclick = event => open(event.target.href, '_self'));
