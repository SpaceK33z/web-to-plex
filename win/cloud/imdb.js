let script = {
	"url": "*://*.imdb.com/(title|list)/(tt|ls)\\d+/(#*|?*)?$",

	"ready": () => !$('#servertime').empty,

	"init": (ready) => {
		let _title, _year, _image, R = RegExp;

		let type   = script.getType(),
			IMDbID = script.getIMDbID(),
			title, year, image;

		let usa   = /\b(USA?|United\s+States)\b/i,
			date, country, reldate, regdate, alttitle, options;

		switch(type) {
			case 'movie':
				title = $('.originalTitle, .title_wrapper h1');
				alttitle = title.first;
				reldate = $('.title_wrapper [href*="/releaseinfo"]').first;
				year = $('.title_wrapper #titleYear').first;
				image = $('img[alt$="poster"i]').first;

				// TODO: Less risky way to accompilsh this?
				title = title.last.childNodes[0].textContent.trim();
				alttitle = (alttitle == title? title: alttitle.childNodes[0].textContent.trim());
				title = usa.test(country)? title: alttitle;
				country = reldate.textContent.replace(/[^]+\((\w+)\)[^]*?$/, '$1');
				year = +script.clean(year.textContent);
				image = (image || {}).src;
				options = { type, title, alttitle, year, image, IMDbID };
				break;

			case 'show':
				title = $('.originalTitle, .title_wrapper h1');
				alttitle = title.first;
				reldate = $('.title_wrapper [href*="/releaseinfo"]').first;
				date = $('title').first.textContent.trim();
				regdate = date.match(/Series\s*\(?(\d{4})(?:[^\)]+\))?/i);
				image = $('img[alt$="poster"i]').first;

				// TODO: Less risky way to accompilsh this?
				title = title.last.textContent.trim();
				alttitle = (alttitle == title? title: alttitle.childNodes[0].textContent.trim());
				title = usa.test(country)? title: alttitle;
				country = reldate.textContent.replace(/[^]+\((\w+)\)[^]*?$/, '$1');
				year = parseInt(regdate[1]);
				image = (image || {}).src;
				options = { type, title, alttitle, year, image, IMDbID };
				break;

			case 'list':
				let items = $('#main .lister-item');

				options = [];

				if(!/[\?\&]mode=simple\b/i.test(top.location.search))
					top.open(location.href.replace(/([\?\&]|\/$)(?:mode=\w+&*)?/, '$1mode=simple&'), '_self');

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
		let tag  = $('meta[property="og:type"]').first,
			type = 'error';

		if(tag) {
			switch(tag.content) {
				case 'video.movie':
					type = 'movie';
					break;

				case 'video.tv_show':
					type = 'show';
					break;
			};
		} else if(top.location.pathname.startsWith('/list/')) {
			type = 'list';
		}

		return type;
	},

	"getIMDbID": () => {
		let tag = $('meta[property="pageId"]');

		return tag? tag.content: null;
	},

	"process": (element) => {
		let title  = $('.col-title a', element).first,
			year   = $('.col-title a + *', element).first,
			image  = $('img.loadlate, img[data-tconst]', element).first,
			IMDbID = title.href.replace(/^[^]*\/(tt\d+)\b[^]*$/, '$1'),
			type;

		title = title.textContent.trim();
		year  = script.clean(year.textContent);
		image = image.src;
		type  = (/[\-\u2010-\u2015]/.test(year)? 'show': 'movie');

		year = +year;

		return { type, title, year, image, IMDbID };
	},

	"clean": year => (year + '').replace(/^\(|\)$/g, '').trim(),
};
