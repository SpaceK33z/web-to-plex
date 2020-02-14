let script = {
	"url": "*://app.plex.tv/desktop/?#!/(server/(?:[a-f\\d]+)|provider/(?:tv.plex.provider.vod))/(details|list)\\?*",

	"ready": () => $('.loading').empty,

	"timeout": 5000,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title = $('[data-qa-id$="maintitle"i] *').first,
			year = $('[data-qa-id$="secondtitle"i] *').first,
			type = script.getType();

		if(!title || !year || type == 'error')
			return 5000;

		title = title.textContent;
		year = year.textContent;

		year = +(year || YEAR);

		return { type, title, year };
	},

	"getType": () => {
		let cell = $('[data-qa-id$="celltitle"i]').first;

		if(!cell)
			return 'error';

		if(/seasons?/i.test(cell.textContent))
			return 'show';
		return 'movie';
	},
};
