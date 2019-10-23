let script = {
	"url": "*://*.thetvdb.com/series/*",

	"ready": () => !$('#series_basic_info').empty,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let title  = $('#series_title, .translated_title').first,
			image  = $('img[src*="/posters/"]').first,
			type   = 'show',
			TVDbID = script.getTVDbID(),
			Db = {}, year;

		title = title.textContent.trim();
		image = (image || {}).src;

		$('#series_basic_info').first.textContent
			.replace(/^\s+|\s+$/g, '')
			.replace(/^\s+$/gm, '<!---->')
			.replace(/^\s+(\S)/gm, '$1')
			.split(RegExp(`\\n*<!---->\\n*`))
			.forEach(value => {
				value = value.split(/\n+/, 2);

				let n = value[0], v = value[1];

				n = n.replace(/^([\w\s]+).*$/, '$1').replace(/\s+/g, '_').toLowerCase();

				Db[n] = /,/.test(v)? v.split(/\s*,\s*/): v;
			});

		year = +(((Db.first_aired || YEAR) + '').slice(0, 4));

		return { type, title, year, image, TVDbID };
	},

	"getTVDbID": () => {
		let { pathname } = top.location;

		if(/\/series\/(\d+)/.test(pathname))
			return RegExp.$1;
	},
};
