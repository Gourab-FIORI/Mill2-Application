/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"comami/zdeliverypicking/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
