release:
	rm -f pkg.zip
	cd src; zip -r ../pkg.zip **

firefox:
	rm -rf build/firefox
	mkdir -p build
	cp -r src/. build/firefox
	rm build/firefox/manifest.json
	mv build/firefox/manifest_firefox.json build/firefox/manifest.json
