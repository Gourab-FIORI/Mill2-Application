/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comami/zmobgrpo/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
