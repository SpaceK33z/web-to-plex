// FireFox doesn't support sync storage.
const storage = chrome.storage.sync || chrome.storage.local;

function saveOptions() {
	var plexToken = document.getElementById('plex_token').value;
	var plexMachineId = document.getElementById('plex_machine_id').value;
	var plexUrlRoot = document.getElementById('plex_url_root').value;
	var plexLibraryId = document.getElementById('plex_library_id').value;
	var couchpotatoUrlRoot = document.getElementById('couchpotato_url_root').value;
	var couchpotatoToken = document.getElementById('couchpotato_token').value;
	var couchpotatoBasicAuthUsername = document.getElementById('couchpotato_basic_auth_username').value;
	var couchpotatoBasicAuthPassword = document.getElementById('couchpotato_basic_auth_password').value;
	var status = document.getElementById('status');

	// Validations
	if (plexUrlRoot && (!plexUrlRoot.startsWith('http') || plexUrlRoot.endsWith('/'))) {
		status.textContent = 'Plex URL should start with "http" and end without a slash!';
		return;
	}

	if (couchpotatoUrlRoot && (!couchpotatoUrlRoot.startsWith('http') || couchpotatoUrlRoot.endsWith('/'))) {
		status.textContent = 'CouchPotato URL should start with "http" and end without a slash!';
		return;
	}

	// Dynamically asking permissions
	// TODO: FireFox doesn't have support for chrome.permissions API.
	if (couchpotatoUrlRoot && chrome.permissions) {
		// When asking permissions the URL needs to have a trailing slash.
		chrome.permissions.request({
			origins: [`${couchpotatoUrlRoot}/`]
		});
	}

	storage.set({
		plexToken,
		plexMachineId,
		plexUrlRoot,
		plexLibraryId,
		couchpotatoUrlRoot,
		couchpotatoToken,
		couchpotatoBasicAuthUsername,
		couchpotatoBasicAuthPassword,
	}, function() {
		// Update status to let user know options were saved.
		status.textContent = 'Options saved.';
		setTimeout(function() {
			status.textContent = '';
		}, 750);
	});
}

// Restores select box and checkbox state using the preferences
// stored in chrome.storage.
function restoreOptions() {
	// Use default value color = 'red' and likesColor = true.
	storage.get(null, function(items) {
		document.getElementById('plex_token').value = items.plexToken || '';
		document.getElementById('plex_machine_id').value = items.plexMachineId || '';
		document.getElementById('plex_url_root').value = items.plexUrlRoot || '';
		document.getElementById('plex_library_id').value = items.plexLibraryId || '';
		document.getElementById('couchpotato_url_root').value = items.couchpotatoUrlRoot || '';
		document.getElementById('couchpotato_token').value = items.couchpotatoToken || '';
		document.getElementById('couchpotato_basic_auth_username').value = items.couchpotatoBasicAuthUsername || '';
		document.getElementById('couchpotato_basic_auth_password').value = items.couchpotatoBasicAuthPassword || '';
	});
}
document.addEventListener('DOMContentLoaded', restoreOptions);
document.getElementById('save').addEventListener('click', saveOptions);
