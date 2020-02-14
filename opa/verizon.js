let script = {
	"url": "*://*.verizon.com/*/(movie|show)s?/*",

	"ready": () => !$('.container .btn-with-play, .moredetails, .more-like, #more_like_this').empty,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let image = $('.cover img').first,
			type  = script.getType(),
			title, year;

		if(script.ondemand) {
			if(type == 'movie') {
				title = $('.detail *').first;
				year  = $('.rating *').first;
			} else if(type == 'show') {
				title = { textContent: top.location.pathname.replace(/\/ondemand\/tvshows?\/([^\/]+?)\/.*/i) };
				year  = $('#showDetails > * > *:nth-child(4) *:last-child').first;

				title.textContent = decodeURL(title.textContent).toCpas();
			} else {
				return null;
			}
		} else if(script.watch) {
			title = $('[class*="title__"]').first;
			year  = $('[class*="subtitle__"]').first;
		} else {
			title = $('.copy > .title').first;
			year  = (type == 'movie')?
				$('.copy > .details').first:
			$('.summary ~ .title ~ *').first;
		}

		if(!title)
			return 1000;

		year  = +year.textContent.slice(0, 4).trim();
		title = title.textContent.replace(RegExp(`\\s*\\(${ year }\\).*`), '').trim();
		image = (image || {}).src;

		return { type, title, year, image };
	},

	"getType": () => {
		let { pathname } = top.location;

		return /\bmovies?\b/i.test(pathname)?
			'movie':
		/\bseries\b/i.test(pathname)?
			'show':
		'error'
	},

	"minions": () => {
		let actions = $('.container .content-holder, .detail .fl, [class^="primaryButtons"]');

		if(actions.empty)
			return;

		actions.forEach(element => {
			let minion = furnish('a.web-to-plex-minion.button.btn.detail-btn', { style: 'padding-top: 3% !important' }, 'Web to Plex');

			addMinions(minion);
			element.appendChild(minion);
		});
	},

	ondemand: /\bondemand\b/i.test(top.location.pathname),

	watch: /\bwatch\b/i.test(top.location.pathname),
};
