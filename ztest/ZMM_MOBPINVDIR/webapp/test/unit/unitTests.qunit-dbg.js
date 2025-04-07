/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"zmm/zmm_mobpinvn/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});