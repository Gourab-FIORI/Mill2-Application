/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"ordina/zmm_physical_inv/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});
