let script = {
	"url": "*://*.hulu.com/(watch|series|movie)/*",

	"ready": () => !$('[class$="__meta"]').empty,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;
		let { pathname } = top.location;
		let type, title, year, image;

		if(/^\/(series|movie)\//.test(pathname)) {
			type = R.$1;
			title = $('[class~="masthead__title"i]').first;
			year  = $('[class~="masthead__meta"i]').child(type == 'series'? 4: 3);
			image = $('[class~="masthead__artwork"i]').first;

			title = title.textContent;
			year  = +year.textContent;
			type  = /\b(tv|show|season|series)\b/i.test(type)? 'show': 'movie';
			image = image? image.src: null;
		} else {
			title = $('[class$="__second-line"]').first;
			year  = (new Date).getFullYear();
			type  = script.getType();

			title = title.textContent;
		}

		if(!title)
			return 5000;

		return { type, title, year, image };
	},

	"getType": () => {
		let { pathname } = top.location;

		if(/^\/series\//.test(pathname)) {
			return 'show';
		} else {
			let tl = $('[class$="__third-line"]').first;

			return /^\s*$/.test(tl.textContent)?
				'movie':
			'show';
		}
	},

	"minions": () => {
		let actions = $('.Details > .SimpleModalNav');

		if(actions.empty)
			return;

		actions.forEach(element => {
			let minion,
				sibling = $('.Nav__spacer ~ .Nav__item', element).last;

			let parent = furnish('div.Nav__item', {},
				minion = furnish('button.web-to-plex-minion', {},
					furnish('img', { src: IMAGES.icon_32 })
				)
			);

			addMinions(minion);
			element.insertBefore(parent, sibling);
		});
	},
};
