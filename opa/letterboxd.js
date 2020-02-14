let script = {
	"url": "*://*.letterboxd.com/(?:\\w+/)?(film|list)/*",

	"ready": () => (script.getType('list')? true: !$('.js-watch-panel').empty),

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title, year, image, type = script.getType(), IMDbID;

		switch(type) {
			case 'movie':
				title  = $('#featured-film-header .headline-1, .headline-1[itemprop="name"]').first.textContent.trim();
				year   = +$('#featured-film-header [href*="/year/"], small[itemprop="datePublished"]').first.textContent.trim();
				image  = ($('.film-poster img, .image').first || {}).src;
				IMDbID = script.getIMDbID(type);

				return { type, title, year, image, IMDbID };
				break;

			case 'list':
				let items = $('.poster-list .poster-container, .poster-list .film-detail'),
					options = [];

				items.forEach((element, index, array) => {
					let option = script.process(element);

					if(option)
						options.push(option);
				});

				return options;
				break;

			default:
				/* Error */
				return {};
		}
	},

	"getType": (suspectedType) => {
		let type = /^\/(film)\//i.test(top.location.pathname)? 'movie': 'list';

		if(suspectedType)
			return type == suspectedType;

		return type;
	},

	"getIMDbID": (type) => {
		if(type == 'movie') {
			let link = $(
				'.track-event[href*="imdb.com/title/tt"i]'
			);

			if(!link.empty) {
				link = link.first.href.replace(/^.*imdb\.com\/title\//i, '');

				return link.replace(/\/(?:maindetails\/?)?$/, '');
			}
		}
	},

	"process": (element) => {
		let title = $('.frame-title', element).first,
			image = $('img', element).first,
			type = 'movie',
			year;

		title = title.textContent.replace(/\((\d+)\)/, '').trim();
		year  = +RegExp.$1;
		image = image.src;

		return { type, title, year, image };
	},

	"minions": () => {
		let actions = $('.actions-panel ul, .js-watch-panel .services, #watch').first,
			type = script.getType(),
			featured = (actions.id == 'watch');

		if(!actions)
			return;

		let minion, parent;

		if(type == 'list') {
			parent = furnish('li', {},
				furnish('span', {},
					furnish('span.has-icon.icon-16', {},
						furnish('img.web-to-plex-icon.icon', { style: 'background: none !important', src: IMAGES.icon_16, height: 16, width: 16 }),
						minion = furnish('a.web-to-plex-minion', {}, 'Web to Plex')
					)
				),
			);

			addMinions(minion);
			actions.appendChild(parent);
		} else if(featured) {
			parent = furnish('div.other', {},
				furnish('img.web-to-plex-icon', { src: IMAGES.icon_16, height: 16, width: 16 }),
				minion = furnish('a.web-to-plex-minion.label.more', {}, 'Web to Plex')
			);

			addMinions(minion);
			actions.appendChild(parent);
		} else {
			parent = furnish('p.service', { style: 'display: flex !important' },
				minion = furnish('a.web-to-plex-minion.label.tooltip', {},
					furnish('span.brand', {},
						furnish('img', { src: IMAGES.icon_32, height: 24, width: 24 })
					),
					furnish('span.title', {},
						furnish('span.name', {}, 'Web to Plex')
					)
				)
			);

			addMinions(minion);
			actions.appendChild(parent);
		}
	},
};
