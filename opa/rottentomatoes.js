let script = {
	"url": "*://*.rottentomatoes.com/([mt]|browse)/*",

	"ready": () => {
		let element = $('#reviews').first;

		return !!element;
	},

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title, type, year, image;

		type = script.getType();

		switch(type) {
			case 'movie':
			case 'show':
				title = $('.playButton + .title, [itemprop="name"], [class*="wrap__title" i]').first;
				year  = $('time').first;
				image = $('[class*="posterimage" i]').first;

				if(!title)
					return 1000;

				title = title.textContent.trim().replace(/(.+)\:[^]*$/, type == 'movie'? '$&': '$1');
				year  = +year.textContent.replace(/[^]*(\d{4})/, '').trim();
				image = (image || {}).srcset;

				if(image)
					image = image.replace(/([^\s]+)[^]*/, '$1');

				return { type, title, year, image };
				break;

			case 'list':
				let options = [],
					elements = $('.mb-movie');

				elements.forEach((element, index, array) => {
					let option = script.process(element);

					if(option)
						options.push(option);
				});

				return options;
				break;

			default:
				return 1000;
				break;
		}
	},

	"getType": () => {
		let { pathname } = top.location;

		return (/^\/browse\/i/.test(pathname))?
			'list':
		(/^\/m/.test(pathname))?
			'movie':
		(/^\/t/.test(pathname))?
			'show':
		'error';
	},

	"process": (element) => {
		let title = $('.movieTitle').first,
			image = $('.poster').first,
			type  = $('[href^="/m/"], [href^="/t/"]').first;

		title = title.textContent.trim();
		image = image.src;
		type  = /\/([mt])\//i.test(type.href)? RegExp.$1 == 'm'? 'movie': 'show': null;

		if(!type)
			return {};

		if(type == 'show')
			title = title.replace(/\s*\:\s*seasons?\s+\d+\s*/i, '');

		return { type, title, image };
	},
};
