sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator"
], function (Controller, JSONModel, Filter, FilterOperator) {
	"use strict";

	return Controller.extend("webapp.zgoodsissue.controller.List", {
		onInit: function (oEvent) {
		},
		onPressListItem: function (oEvent) {
			var oItem = oEvent.getParameter("listItem");
			var sPath = oItem.getBindingContext();
			var oSelectedItem = sPath.getObject();

			if (oSelectedItem) {
				var oModel = this.getOwnerComponent().getModel("app");
				oModel.setProperty("/GIheadSet", Object.assign({}, oSelectedItem));
				this.getOwnerComponent().getRouter().navTo("Object");
			}
		},
		
		
		onFilter: function (oEvent) {
			// build filter array
			var aFilter = [];
			var vPlant = this.getView().byId("idfplant").getValue();
			var vDelDate = this.getView().byId("idfdeldate")._lastValue;
			var vRequest = this.getView().byId("idfrequester").getValue();
			var vCostCenter = this.getView().byId("idfcostcenter").getValue();
			//Start of code t_singhag1 01.08.2024
			var vinternalOrd = this.getView().byId("idfinternalord").getValue();
			//End of code t_singhag1 01.08.2024

			if (vPlant) {
				aFilter.push(new Filter("Werks", FilterOperator.Contains, vPlant));
			}
			if (vDelDate) {
				aFilter.push(new Filter("Eindt", FilterOperator.EQ, vDelDate));
			}
			if (vRequest) {
				aFilter.push(new Filter("Afnam", FilterOperator.Contains, vRequest));
			}
			if (vCostCenter) {
				aFilter.push(new Filter("Kostl", FilterOperator.Contains, vCostCenter));
			}
			//Start of code t_singhag1 01.08.2024
			if (vinternalOrd) {
				aFilter.push(new Filter("Aufnr", FilterOperator.Contains, vinternalOrd));
			}
			//End of code t_singhag1 01.08.2024
			// filter binding

			var oList = this.getView().byId("idList");
			var oBinding = oList.getBinding("items");
			oBinding.filter(aFilter);
		}

	});

});