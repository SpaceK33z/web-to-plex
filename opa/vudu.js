let script = {
	"url": "*://*.vudu.com/*",

	"ready": () => !$('img[src*="poster" i]').empty,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title = $('.head-big').first,
			year  = $('.container .row:first-child .row ~ * > .row span').first,
			image = $('img[src*="poster" i]').first,
			type  = script.getType();

		title = title.textContent.replace(/\((\d{4})\)/, '').trim();
		year  = year? year.textContent.split(/\s*\|\s*/): R.$1;
		image = (image || {}).src;

		if(!title)
			return 5000;

		year = +year[year.length - 1].slice(0, 4);
		year |= 0;

		return { type, title, year, image };
	},

	"getType": () => {
		return /(?:Season-\d+\/\d+)$/i.test(window.location.pathname)?
			'show':
		'movie';
	},

	"minions": () => {
		let actions = $('.container .row:nth-child(3) .row > *, .container .row:nth-child(3) ~ * .row > *');

		console.log({ actions })

		if(actions.empty)
			return;

		let element = actions.child(6),
			minion = furnish('a.web-to-plex-minion', {}, 'Web to Plex');

		addMinions(minion);
		element.appendChild(minion);
	},
};
