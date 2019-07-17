let script = {
    // required
    "url": "*://ephellon.github.io/web.to.plex/(?!test|login)",
    // Example: *://*.amazon.com/*/video/(detail|buy)/*
    // *://         - match any protocol (http, https, etc.)
    // *.amazon.com - match any sub-domain (www, ww5, etc.)
    // /*           - match any path
    // (detail|buy) - match one of the items

    // optional
    "ready": () => location.search && location.search.length > 1 && $('#tmdb').first.textContent,

    // optional
    "timeout": 1000, // if the script fails to complete, retry after ... milliseconds

    // required
    "init": (ready) => {
        let _title, _year, _image, R = RegExp;

        let title = $('#title').first,
            year  = $('#year').first,
            image = $('#body').first,
            type  = script.getType(), // described below
            IMDbID = script.getID('imdb')||"",
            TMDbID = script.getID('tmdb')|0,
            TVDbID = script.getID('tvdb')|0;

        title = title.textContent;
        year  = year.textContent|0;
        image = image.style.backgroundImage.replace(/url\("([^]+?)"\)/, '$1');

        return { type, title, year, image, IMDbID, TMDbID, TVDbID };
    },

    // optional | functioanlity only
    "getType": () => ($('#info').first.getAttribute('type') == 'movie'? 'movie': 'show'),

    "getID": (provider) => $(`#${provider}`).first.textContent,
};
