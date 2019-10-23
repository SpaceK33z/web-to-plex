let script = {
	"url": "*://*.vrv.co/(series|watch)/",

	"ready": () => {
		let img = $('.h-thumbnail > img').first,
			pre = $('#content .content .card').first;

		return script.getType('list')? pre && pre.textContent: img && img.src;
	},

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let type = script.getType(),
			title, year, image, options;

		switch(type) {
			case 'movie':
			case 'show':
				title = $('.series, .series-title, .video-title, [class*="series"] .title, [class*="video"] .title').first;
				year  = $('.additional-information-item').first;
				image = $('.series-poster img').first;

				title = title.textContent.replace(/(unrated|mature|tv-?\d{1,2})\s*$/i, '').trim();
				year  = year? +year.textContent.replace(/.+(\d{4}).*/, '$1').trim(): 0;
				image = (image || {}).src;

				options = { type, title, year, image };
				break;

			case 'list':
				let items = $('#content .content .card');

				options = [];

				items.forEach(element => {
					let option = script.process(element);

					if(option)
						options.push(option);
				});
				break;

			default:
				return 5000;
		}

		return options;
	},

	"getType": (expected) => {
		let type = 'error',
			{ pathname } = top.location;

		type = (/^\/(?:series)\//.test(pathname) || (/^\/(?:watch)\//.test(pathname) && !$('.content .series').empty))?
			'show':
		(/^\/(?:watch)\//.test(pathname) && $('.content .series').empty)?
			'movie':
		(/\/(watchlist)\b/i.test(pathname))?
			'list':
		type;

		if(expected)
			return type == expected;

		return type;
	},

	"process": (element) => {
		let title = $('.info > *', element).first,
			image = $('.poster-image img', element).first,
			type  = $('.info [class*="series"], .info [class*="movie"]', element).first;

		title = title.textContent.trim();
		image = image.src;
		type  = type.getAttribute('class').replace(/[^]*(movie|series)[^]*/, '$1');

		return { type, title, image };
	},
};
