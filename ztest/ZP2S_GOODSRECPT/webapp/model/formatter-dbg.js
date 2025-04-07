sap.ui.define([], function() {
	"use strict";
	return {
		convertDate: function(sValue) {
			if (!sValue) {
				return sValue;
			} else {
				var arr = sValue.split("/");
				var date = arr[2] + "-" + arr[1] + "-" + arr[0] + "T00:00:00";
				return date;
			}
		},
		datechange: function(sValue) {
			if (!sValue) {
				return sValue;
			} else {
				var arr = sValue.split("T00:00:00");
				var date = arr[0].split("-");

				var convertedDate = date[2] + "/" + date[1] + "/" + date[0];
				return convertedDate;
			}
		},
		_weightUnit: function(weight, uom) {
			if (uom === undefined || uom === "") {
				return weight;
			} else {

				return (weight + "(" + uom + ")");

			}
		},
		_netWeightUnit: function(netweight, Outweight, Inweight, uom) {
			if (Outweight) {
				if (Outweight === "0.000" || Outweight === "0") {
					netweight = Inweight;

				} else {
					netweight = Outweight - Inweight;
				}
			} else {
				netweight = Inweight;
			}

			if (uom === undefined || uom === "") {
				return netweight;
			} else {
				return (netweight + "(" + uom + ")");

			}

		},
		_datechange: function(sValue, dPattern) {
			if (!sValue) {
				return sValue;
			} else {

				var convertedDate;
				var oDateFormat = sap.ui.core.format.DateFormat
					.getDateTimeInstance({
						pattern: dPattern.replace(/D/gi, 'd')
					});
				convertedDate = oDateFormat.format(new Date(sValue));
				return convertedDate;
			}
		},
		timechange: function(sValue) {
			if (!sValue) {
				return sValue;
			} else {
				//PT08H00M00S
				var time = sValue.charAt(2) + sValue.charAt(3) + ":" + sValue.charAt(5) + sValue.charAt(6) + ":" + sValue.charAt(8) + sValue.charAt(
					9);
				return time;
			}
		},
		dateToText: function(date) {
			var oDateFormat = sap.ui.core.format.DateFormat.getDateInstance({
				pattern: "dd-MM-yyyy"
			});
			if (date) {
				return oDateFormat.format(new Date(date));
			} else {
				return date;
			}
		}

	};
});