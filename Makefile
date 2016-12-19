# Empty rule to force other rules to be updated.
FORCE:

release: FORCE release-chrome release-firefox

firefox: FORCE
	rm -rf build/firefox
	mkdir -p build
	cp -r src/. build/firefox
	rm build/firefox/manifest.json
	mv build/firefox/manifest_firefox.json build/firefox/manifest.json

release-chrome: FORCE
	rm -f pkg-chrome.zip
	cd src; zip -r ../pkg-chrome.zip **

release-firefox: FORCE firefox
	rm -f pkg-firefox.zip
	cd build/firefox; zip -r ../../pkg-firefox.zip **
