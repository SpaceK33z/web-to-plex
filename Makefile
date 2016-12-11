release:
	rm -f pkg.zip
	cd src; zip -r ../pkg.zip **
