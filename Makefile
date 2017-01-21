# Empty rule to force other rules to be updated.
FORCE:

release: FORCE commit-version release-chrome release-firefox

commit-version: FORCE
	test $(version)
	sed -i '/"version"/c\ \ \ "version": "$(version)",' src/manifest.json src/manifest_firefox.json
	git commit -am "Release version $(version)"
	git tag "$(version)"

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
	find build/firefox -name '.DS_Store' -type f -delete
	cd build/firefox; zip -r ../../pkg-firefox.zip **
