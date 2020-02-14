let script = {
	"url": "*://*.vrv.co/(series|watch(list)?)\\b",

	"ready": () => {
		let img = $('.h-thumbnail > img').first,
			pre = $('#content .content .card').first;

		return (script.getType('list')? pre && pre.textContent: img && img.src) || $('.erc-spinner').empty;
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
				let items = $('#content .content [class$="card"]');

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
		let title = $('[class*="content-title"]', element).first,
			image = $('[class*="image-poster"]', element).first,
			type  = $('[class*="meta-tags"][class*="type"]', element).first;

		title = title.textContent.trim();
		image = image.src;
		type  = type.textContent.trim().replace(/[^]*(movie|series)[^]*/i, '$1').toLowerCase();

		return { type, title, image };
	},

	"minions": () => {
		let actions = $('.action-buttons, .watchlist-card .c-watchlist-card__actions-wrapper'),
			list = script.getType('list');

		if(actions.empty)
			return;

		let processed;

		if(!list)
			processed = script.init();

		actions.forEach(element => {
			if(list)
				processed = script.process($(element).parent('.watchlist-card')[0]);

			let { type, title } = processed,
				uuid = UUID.from({ type, title });

			let minion = furnish(`a.web-to-plex-minion.${(list? 'c-watchlist-card__icon': 'action-button.c-button')}`, { uuid },
				(
					list?
						furnish('img', { src: IMAGES.icon_16 }):
					'Web to Plex'
				)
			);

			if(list) {
				addMinions(minion).stayUnique(true);
				element.insertBefore(minion, element.firstElementChild);
			} else {
				addMinions(minion);
				setTimeout(() => element.appendChild(minion), 5000);
			}
		});
	},
};
