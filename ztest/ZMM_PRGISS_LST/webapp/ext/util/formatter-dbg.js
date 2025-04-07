jQuery.sap.declare("ZMM.zmm_progissue_lst.ext.util.formatter");
jQuery.sap.require("sap.ui.core.format.NumberFormat");
jQuery.sap.require("sap.ui.core.format.DateFormat");

ZMM.zmm_progissue_lst.ext.util.formatter = {

	/***************************************************************************
	 * Returns formatted Quantity
	 * @param {string} sQuantity -
	 * @returns {object}
	****************************************************************************/
	formatQuantity : function(sQuantity) {
		if (!sQuantity) {
			return "";
		}

		// The parseFloat() function parses a string and returns a floating point number.
		var oQuantity = parseFloat(sQuantity);
		return sap.ui.core.format.NumberFormat.getFloatInstance().format(oQuantity);
	},



	/***************************************************************************
	 * Is called in S1 View
	 * Converts "Actual GI Date" to a short format e.g. "02.08.2017"
	 * @param {string} sDate --
	 * @returns {date} 
	****************************************************************************/
	formatDate : function(sDate) {
		if (!sDate) {
			return "";
		}

		var oDateFormatter = sap.ui.core.format.DateFormat.getInstance({
			style : "medium"
		});
		return oDateFormatter.format(sDate);
	},
	
	formatUoMCodeInput: function(bEditable, iPickedQuantity) {
		
		if (bEditable && parseInt(iPickedQuantity, 10) === 0) {
			return true;
		}
		
		return false;
	},
	
	/***************************************************************************
	 * @param {string} sMaterialName - name of material
	 * @param {string} sMaterialId - id of material
	 * @returns {string} formattedText - formatted text
	 ***************************************************************************/
	formatMaterial: function(sMaterialName, sMaterialId){
		var formattedText = "";
		if(sMaterialName && sMaterialId){
			formattedText = sMaterialName + " (" + sMaterialId + ")";
		}else if(sMaterialName && !sMaterialId){
			formattedText = sMaterialName;
		}
		
		return formattedText;
	},
	
	formatValWithName: function(sValue, sName) {
		if(sName && sValue) {
			return sName + " (" + sValue + ")";
		}
		if(sValue) {
			return sValue;
		}
		return "";
	}
};