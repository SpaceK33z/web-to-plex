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

		as(self.id);
	};
});

document.querySelectorAll('[target="frame"]').forEach(element => {
	let body = document.body,
		frame = $('#frame'),
		loading = $('#loading');

	element.onmouseup = event => {
		loading.setAttribute('loading', true);
		loading.removeAttribute('style');
	}

	frame.onload = frame.onerror = event => {
		loading.setAttribute('loading', false);
		setTimeout(() => loading.setAttribute('style', 'display:none'), 500);
	}
});

document.body.onload = event => /#(movie|tv-show)/i.test(location.hash)? as(`${ location.hash.replace('#', '') }`): as('movie');
