// optional
// "Web to Plex" requires: api, token
// 'Friendly Name' requires permissions...

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
	"timeout": 5000, // if the script fails to complete, retry after ... milliseconds

	// required
	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title = $('#title').first,
			year  = $('#year').first,
			image = $('#poster').first,
			type  = script.getType(), // described below
			IMDbID = script.getID('imdb')||"",
			TMDbID = script.getID('tmdb')|0;

		title = title.textContent;
		year  = year.textContent|0;
		image = image.src;

		return { type, title, year, image, IMDbID, TMDbID };
	},

	// optional | functioanlity only
	"getType": () => ($('#info').first.getAttribute('type') == 'movie'? 'movie': 'show'),

	"getID": (provider) => $(`#${provider}`).first.textContent,
};

setTimeout(() => {
	let login = /\blogin\b/.test(location.pathname),
		apikey = $('#apikey').first;

	if(login && configuration.TMDbAPI && !apikey.value) {
		apikey.value = configuration.TMDbAPI;

		return -1;
		// no longer needed to run
	} else if(login) {
		return -1;
		// don't run on the login page
	}
}, 100);
