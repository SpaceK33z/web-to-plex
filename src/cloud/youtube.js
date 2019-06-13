let script = {
    "url": "*://www.youtube.com/*",

    "init": (ready) => {
        let _title, _year, _image, R = RegExp;

        let open  = () => $('.more-button').first.click(),
            close = () => $('.less-button').first.click(),
            options, type;

        if($('.more-button, .less-button').empty)
            return 1000;

        open(); // show the year and other information, fails otherwise

        type = script.getType();

        if(type == 'error')
            return close(), 1000;

        if(type == 'movie' || type == 'show') {
            let title = $((type == 'movie'? '.title': '#owner-container')).first,
                year  = $('#content ytd-expander').first;

            if(!title)
                return close(), null;

            title = title.textContent.trim();
            year  = +year.textContent.replace(/[^]*(?:release|air) date\s+(?:(?:\d+\/\d+\/)?(\d{2,4}))[^]*/i, ($0, $1, $$, $_) => +$1 < 1000? 2000 + +$1: $1);

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

        return options;
    },

    "getType": () => {
        let title = $('.super-title, #title').first,
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

top.addEventListener('popstate', script.init);
top.addEventListener('pushstate-changed', script.init);
