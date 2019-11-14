let script = {
	"url": "*://*.vumoo.to/(movies|tv-series)/*",

	"ready": () => !$('[role="presentation"i]').empty,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title = $('.film-box h1').first,
			year  = $('.film-box > * span').filter(e => /\b\d{4}\b/.test(e.textContent))[0],
			image = $('.poster').first,
			type  = script.getType();

		title = title.textContent.replace(/\s*season\s+\d+\s*$/i, '').replace(/\s*\((\d{4})\)/, '').trim();
		year  = +(type == 'movie')?
			R.$1:
		year.textContent.replace(/[^]*(\d{4})[^]*/, '$1');
		image = (image? image.src: null);

		// auto-prompt downloading for the user
		let servers = $('.play'),
			roles = $('[role="presentation"i] a');

		if(servers.length > 1 && type != 'show') {
			OLOAD_EVENTS.push(setTimeout(
				() => Notify('update', 'Finding download links...', 3000),
				500
			));

			servers.forEach((server, index, array) => OLOAD_EVENTS.push(setTimeout(
				() => {
					roles[index].click();
					server.click();

					if(index == servers.length -1)
						OLOAD_EVENTS.push(setTimeout(
							() => Notify('update', 'No download links found'),
							7000
						));
				},
				index * 4500
			)));
		}

		return { type, title, year, image };
	},

	"getType": () => {
		let { pathname } = top.location;

		return pathname.startsWith('/movies')?
			'movie':
		'show';
	},
},
	OLOAD_EVENTS = [];

top.addEventListener('message', request => {
	try {
		request = request.data;

		if(request)
			if(request.from == 'oload' || request.found == true)
				OLOAD_EVENTS.forEach(timeout => clearTimeout(timeout));
	} catch(error) {
		throw error;
	}
});
