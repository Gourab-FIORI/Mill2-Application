/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"webapp/ZGoodsIssue4PM/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});