sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/UIComponent",
	"../model/formatter"
], function (Controller, Filter, FilterOperator, JSONModel, UIComponent, formatter) {
	"use strict";

	return Controller.extend("ordina.zmmphysicalinvn.controller.List", {

		formatter: formatter,

		onInit: function () {
		
		},
		onPressListItem: function(oEvent){
			var oItem = oEvent.getParameter("listItem");
			var sPath = oItem.getBindingContext();
			var oSelectedItem = sPath.getObject();
			if(oSelectedItem){
				var oModel = this.getOwnerComponent().getModel("app");
				oModel.setProperty("/PhyinvHeadSet", Object.assign({}, oSelectedItem));	
				this.getOwnerComponent().getRouter().navTo("object");
			}
		},
		
		onFilterInv: function (oEvent) {
			// build filter array
			var aFilter = [];
			var sQuery = oEvent.getParameter("query");
			if (sQuery) {
				aFilter.push(new Filter("Physinventory", FilterOperator.Contains, sQuery));
			}

			// filter binding
			var oList = this.getView().byId("idList");
			var oBinding = oList.getBinding("items");
			oBinding.filter(aFilter);
		}
		
	});

});