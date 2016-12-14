
function doPlexRequest(options) {
	return fetch(`${options.url}?title=${options.title}&year=${options.year}`, {
		headers: {
			'X-Plex-Token': options.token,
			'Accept': 'application/json',
		}
	})
	.then((res) => res.json())
	.then((res) => {
		const size = res.MediaContainer && res.MediaContainer.size;
		let key = null;
		if (size) {
			key = res.MediaContainer.Metadata[0].key;
		}
		return { size, key };
	});
}

function plexRequest(options) {
	return doPlexRequest(options)
	.then(({ size, key }) => {
		if (!size) {
			// This is fucked up, but Plex' definition of a year is year when it was available,
			// not when it was released (which is Movieo's definition).
			// For examples, see Bone Tomahawk, The Big Short, The Hateful Eight.
			const newOptions = Object.assign({}, options, {
				year: options.year + 1
			});
			return doPlexRequest(newOptions);
		}
		return { size, key };
	});
}

function getOptions() {
	const storage = chrome.storage.sync || chrome.storage.local;
	return new Promise(function (resolve, reject) {
		storage.get(null, function (items) {
			const options = {
				plexUrl: `${items.plexUrlRoot}/library/sections/${items.plexLibraryId}/all`,
				plexToken: items.plexToken,
				plexMachineId: items.plexMachineId,
			};
			if (items.couchpotatoBasicAuthUsername) {
				options.couchpotatoBasicAuth = {
					username: items.couchpotatoBasicAuthUsername,
					password: items.couchpotatoBasicAuthPassword,
				};
			}
			if (items.couchpotatoUrlRoot && items.couchpotatoToken) {
				options.couchpotatoUrl = `${items.couchpotatoUrlRoot}/api/${encodeURIComponent(items.couchpotatoToken)}`;
			}

			if (!options.plexToken || !options.plexMachineId || !items.plexLibraryId || !items.plexUrlRoot) {
				reject(new Error('Unset options.'));
				return;
			}
			resolve(options);
		});
	});
}

function getPlexMediaUrl(plexMachineId, key) {
	return `https://app.plex.tv/web/app#!/server/${plexMachineId}/details/${encodeURIComponent(key)}`;
}
