let script = {
	"url": "*://*.themoviedb.org/(movie|tv)/\\d+([\\w\\-]+)?$",

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let type   = script.getType(),
			TMDbID = script.getTMDbID(),
			title, year, image;

		let options;

		switch(type) {
			case 'movie':
			case 'tv':
				title = $('.title > span > *:not(.release_date)').first;
				year  = $('.title .release_date').first;
				image = $('img.poster').first;

				title = title.textContent.trim();
				year  = +year.textContent.replace(/\(|\)/g, '').trim();
				image = (image || {}).src;

				if(type != 'movie')
					type = 'show';

				options = { type, title, year, image, TMDbID };
				break;

			case 'list':
				let items = $('.item.card');

				options = [];

				items.forEach(element => {
					let option = script.process(element);

					if(option)
						options.push(option);
				});
				break;

			default: return null;
		}

		return options;
	},

	"getType": () => {
		let { pathname } = top.location;

		return (/\/(movie|tv)\/\d+/.test(pathname))?
			RegExp.$1:
		(/(^\/discover\/|\/(movie|tv)\/([^\d]+|\B))/i.test(pathname))?
			'list':
		'error';
	},

	"getTMDbID": () => {
		return +top.location.pathname.replace(/\/(?:movie|tv)\/(\d+).*/, '$1');
	},

	"process": (element) => {
		let title  = $('.title').first,
			year   = $('.title + *').first,
			image  = $('.poster').first,
			type   = title.id.split('_'),
			TMDbID = +type[1];

		title = title.textContent.trim();
		year  = year.textContent;
		image = image.src;
		type  = (type[0] == 'movie'? 'movie': 'show');

		year = +year;

		return { type, title, year, image, TMDbID };
	},

	"minions": () => {
		let actions = $('.header .actions');

		if(actions.empty)
			return;

		actions.forEach(element => {
			let minion;

			let parent = furnish('li.tooltip.use_tooltip', { title: 'Web to Plex' },
				minion = furnish('a.web-to-plex-minion', { style: `background: url("${ IMAGES.icon_32 }") center/50% no-repeat !important` })
			);

			addMinions(minion);
			element.insertBefore(parent, element.lastElementChild);
		});
	},
};
