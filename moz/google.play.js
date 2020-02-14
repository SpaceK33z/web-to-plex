let script = {
	"url": "*://play.google.com/store/(movies|tv)/details/*",

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let type  = script.getType(),
			title = $('h1').first,
			year  = $(`h1 ~ div span:${ type == 'movie'? 'first': 'last' }-of-type`).first,
			image = $('img[alt="cover art" i]').first;

		title = title.textContent.replace(/\s*\(\s*(\d{4})\s*\).*?$/, '').trim();
		year = +(year.textContent || R.$1).replace(/^.*?(\d{4})/, '$1').trim();
		image = (image || {}).src;

		return { type, title, year, image };
	},

	"getType": () => (
		location.pathname.startsWith('/store/movies')?
			'movie':
		'show'
	),

	"minions": () => {
		let type = script.getType();

		let actions = $('wishlist-add, wishlist-added');

		if(actions.empty)
			return;


		actions.forEach(element => {
			while(/c-wiz/i.test(element.parentElement.tagName))
				element = element.parentElement;
			element = element.parentElement;

			let next, first, second;

			if(type == 'movie') {
				next = element.nextElementSibling.firstElementChild;
				first = next.firstChild;
				second = first.firstChild;
			} else {
				next = furnish('div', {},
					first = furnish('span.wtp-w', {},
						second = furnish('button.wtp-b')
					)
				);

				element.appendChild(next);
			}

			let minion;
			let parent = furnish(`span.${['wtp-w', ...first.classList].join('.')}`, {},
				furnish(`button.${['wtp-b', ...second.classList].join('.')}`, {},
					minion = furnish('a.web-to-plex-minion', {}, 'Web to Plex')
				)
			);

			addMinions(parent, minion);
			next.insertBefore(parent, first);
		});
	},
};
