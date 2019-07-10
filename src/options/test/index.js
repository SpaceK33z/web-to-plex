let $ = selector => document.querySelector(selector);

function modify({ type, title, year, info }) {
    let object = { title, year, ...info };

    $('#example').setAttribute('type', type);

    $('#movie').removeAttribute('active');
    $('#tv-show').removeAttribute('active');

    $(`#${ type }`).setAttribute('active', true);

    let element;
    for(let key in object)
        if(element = $(`#${ key }`))
            element.innerHTML = object[key] || "";

    $('#body').setAttribute('style', `background-image: url("${ type }.poster.jpg")`);
    $('#poster').setAttribute('src', `${ type }.poster.jpg`);

    let { imdb, tmdb, tvdb } = object,
        ids = { imdb, tmdb, tvdb };

    for(let id in ids)
        $(`#${ id }`).setAttribute('href', (
            ids[id]?
                id == 'imdb'?
                    `https://www.imdb.com/videoembed/${ object[id.toUpperCase()] }/`:
                id == 'tmdb'?
                    `https://www.youtube.com/embed/${ object[id.toUpperCase()] }`:
                `https://www.youtube.com/embed/${ object[id.toUpperCase()] }`:
            'blank.html'
        ));
}

function as(type) {
    open('blank.html', 'frame');

    return modify({
        "movie": {
            'type':  "movie",
            'title': "Being John Malkovich",
            'year':  1999,
            'info': {
                'rating':       "R",
                'runtime':      "1:53",
                'genre':        "Comedy, Drama, Fantasy",
                'release-date': "December 3, 1999 (USA)",
                'description':  `One day at work, unsuccessful puppeteer Craig finds a portal into the head of actor John Malkovich. The portal soon becomes a passion for anybody who enters it's mad and controlling world of overtaking another human body.`,

                'imdb': "tt0120601",
                'IMDB': "vi3568894233",
                'tmdb': 492,
                'TMDB': "HdVvjvW_OEo",
                'tvdb': null,
                'TVDB': null,
            },
        },

        "tv-show": {
            'type': "tv-show",
            'title': "Love, Death & Robots",
            'year':  2019,
            'info': {
                'rating':       "TV-MA",
                'runtime':      "0:15",
                'genre':        "Animation, Comedy, Fantasy, Horror, Science-Fiction",
                'release-date': "May 15, 2019 (USA)",
                'description':  `Terrifying creatures, wicked surprises and dark comedy converge in this NSFW anthology of animated stories presented by Tim Miller and David Fincher.`,

                'imdb': "tt9561862",
                'IMDB': "vi1035648281",
                'tmdb': 86831,
                'TMDB': "wUFwunMKa4E",
                'tvdb': 357888,
                'TVDB': "wUFwunMKa4E",
            },
        },
    }[type]);
}

document.querySelectorAll('#movie, #tv-show').forEach(element => {
    element.onmouseup = event => {
        let self = event.target;

        $('#frame').setAttribute('content', false);

        as(self.id);
    };
});

document.querySelectorAll('[target="frame"]').forEach(element => {
    let body = document.body,
        frame = $('#frame'),
        loading = $('#loading'),
        description = $('#description');

    element.onmouseup = event => {
        frame.setAttribute('content', true);

        [loading, description]
            .forEach(element => {
                element.setAttribute('loading', true);
                element.removeAttribute('style');
            });
    }

    frame.onload = frame.onerror = event => {

        [loading]
            .forEach(element => {
                element.setAttribute('loading', false);
                setTimeout(() => element.setAttribute('style', 'display:none'), 500);
            });
    }
});

document.body.onload = event => /#(movie|tv-show)/i.test(location.hash)? as(`${ location.hash.replace('#', '') }`): as('movie');
