let openedByUser = false,
	listenersSet = false,
	listenerInt;

let script = {
	"url": "*://www.youtube.com/.+",

	"timeout": 1000,

	"init": (ready, rerun = false) => {
		let _title, _year, _image, R = RegExp;

		let options, type,
			alternative = $('#offer-module-container[class*="movie-offer"], #offer-module-container[class*="unlimited-offer"]');

		if($('.more-button:not(span), .less-button').empty || !$('.opened').empty || !$('iron-dropdown[class*="ytd"][aria-hidden]').empty)
			return script.timeout;

		// open and close the meta-information
		// open
		$('.more-button:not(span)').first.click();
		// close
		setTimeout(() => $('.less-button').first.click(), script.timeout);

		// try to not bug the page content too much, use an alternative method first (if applicable)
		if(!alternative.empty && !rerun) {
			alternative = alternative.first;

			let title = $('#title', alternative).first,
				year  = $('#info p', alternative).child(2).lastElementChild,
				image = $('#img img', alternative).first,
				type  = /\bmovie-offer\b/i.test(alternative.classList)? 'movie': 'show';

			if(!title || !year)
				return -1;

			title = title.textContent;
			year  = year.textContent|0;
			image = image.src;

			title = title.replace(R(`\\s*(\\(\\s*)?${ year }\\s*(\\))?`), '');

			return { type, title, year, image };
		}

		type = script.getType();

		if(type == 'error')
			return -1;

		if(type == 'movie' || type == 'show') {
			let title = $((type == 'movie'? '.title': '#owner-container, #header #main-title')).first,
				year  = $('#content ytd-expander').first,
				image = $('#img img').first || { src: '' };

			if(!title)
				return -1;

			title = title.textContent.trim();
			year  = (year)?
				+year.textContent.replace(/[^]*(?:release|air) date\s+(?:(?:\d+\/\d+\/)?(\d{2,4}))[^]*/i, ($0, $1, $$, $_) => +$1 < 1000? 2000 + +$1: $1):
			YEAR;
			image = image.src;

			title = title.replace(R(`\\s*(\\(\\s*)?${ year }\\s*(\\))?`), '');

			options = { type, title, year, image };
		} else if(type == 'list') {
			let title = $('#title').first,
				year  = $('#stats *').child(2),
				image = $('#thumbnail #img').first;

			if(!title)
				return -1;

			title = title.textContent.trim();
			year  = parseInt(year.textContent);
			image = (image || {}).src;
			type  = 'show';

			options = { type, title, year, image };
		} else {
			return -1;
		}

		if(!listenersSet) {
			listenerInt = setInterval(() => {
				let closed = 'collapsed' in $('ytd-expander').first.attributes;

				if(closed && !openedByUser)
					script.init(true);
			}, 10);

			$('ytd-expander').first.addEventListener('mouseup', event => {
				let closed = 'collapsed' in $('ytd-expander').first.attributes;

				if(!closed)
					openedByUser = true;
				else
					openedByUser = false;
			});

			listenersSet = true;
		} else {
			clearInterval(listenerInt);
		}

		return options;
	},

	"getType": () => {
		let title = $('.super-title, #title, #header #main-title').filter(e => e.textContent)[0],
			subtitle = $('#header #main-title + #sub-title').filter(e => e.textContent)[0],
			owner = $('#owner-container, #upload-info [href^="/channel/"]');

		if(owner.empty)
			return 'error';
		else
			owner = owner.first.textContent.replace(/^\s+|\s+$/g, '');

		let R = {
			movie: /\byoutube movies\b/i,
			show : /\b(s\d+\b.+\be\d+|season \d+)\b/i,
			list : /\/playlist\b/,
		};

		return (R.movie.test(owner))?
			'movie':
		((title && R.show.test(title.textContent)) || (subtitle && R.show.test(subtitle.textContent)))?
			'show':
		(title && R.list.test(top.location.pathname))?
			'list':
		'error';
	},
};

// $('a[href*="/watch?v="]').forEach(element => element.onclick = event => open(event.target.href, '_self'));
