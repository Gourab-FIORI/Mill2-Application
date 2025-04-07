sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageBox"
], function (Controller, Filter, FilterOperator, MessageBox) {
	"use strict";
	var _component;
	return Controller.extend("webapp.zgoodsissue.controller.Object", {

		onInit: function () {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("Object").attachMatched(this._onObjectMatched, this);
			_component = this.getOwnerComponent();
			
		},

		_onObjectMatched: function (oEvent) {
			var appModel = this.getOwnerComponent().getModel("app");
			var vPONumber = appModel.getProperty("/GIheadSet/Ebeln");
			var vDate = appModel.getProperty("/GIheadSet/Eindt");
			var vAufnr = appModel.getProperty("/GIheadSet/Aufnr"); 		//++ T-singhag1
			var aFilters = new Filter({
				and: true,
				aFilters: [
					new Filter("Ebeln", FilterOperator.EQ, vPONumber),
					new Filter("Eindt", FilterOperator.EQ, vDate),
					new Filter("Aufnr", FilterOperator.EQ, vAufnr)
				]
			});
			var oBinding = this.getView().byId("idTable").getBinding("items");
			oBinding.filter(aFilters);
		},

		onBack: function () {
			var oTable = this.getView().byId("idTable");
			this.getView().byId("idTable").removeSelections();
			var oModel = oTable.getModel();
			oModel.resetChanges();
			_component.getRouter().navTo("List");
		},
		onChangeQuant: function (oEvent) {
			var vNewQuant = oEvent.getSource().getValue();
			var vSelectedline = oEvent.getSource().getBindingContext();
			var vItem = vSelectedline.getObject();
			var oTable = this.getView().byId("idTable");
			var oModel = oTable.getModel();
			
			var aItems = oTable.getItems();

			for (var iRowIndex = 0; iRowIndex < aItems.length; iRowIndex++) {
				var vItemNo = oModel.getProperty("Ebelp", aItems[iRowIndex].getBindingContext());
				if (vItemNo === vItem.Ebelp) {
					if (vNewQuant !== "") {
						oModel.setProperty("Obmng", vNewQuant, aItems[iRowIndex].getBindingContext());
						aItems[iRowIndex].setSelected(true);
					}
				}
			}
		},
		onChangeStorloc: function (oEvent) {

			var vNewLgort = oEvent.getSource().getValue();
			var vSelectedline = oEvent.getSource().getBindingContext();
			var vItem = vSelectedline.getObject();
			var oTable = this.getView().byId("idTable");
			var oModel = oTable.getModel();
			var aItems = oTable.getItems();
			for (var iRowIndex = 0; iRowIndex < aItems.length; iRowIndex++) {
				var vItemNo = oModel.getProperty("Ebelp", aItems[iRowIndex].getBindingContext());
				if (vItemNo === vItem.Ebelp) {
					if (vNewLgort !== "") {
						oModel.setProperty("Lgort", vNewLgort, aItems[iRowIndex].getBindingContext());
						aItems[iRowIndex].setSelected(true);
					}

				}
			}
		},

		onChangeBatch: function (oEvent) {
			var vNewBatch = oEvent.getSource().getValue();
			var vSelectedline = oEvent.getSource().getBindingContext();
			var vItem = vSelectedline.getObject();
			var oTable = this.getView().byId("idTable");
			var oModel = oTable.getModel();
			var aItems = oTable.getItems();
			for (var iRowIndex = 0; iRowIndex < aItems.length; iRowIndex++) {
				var vItemNo = oModel.getProperty("Ebelp", aItems[iRowIndex].getBindingContext());
				if (vItemNo === vItem.Ebelp) {
					if (vNewBatch !== "") {
						oModel.setProperty("Batch", vNewBatch, aItems[iRowIndex].getBindingContext());
						aItems[iRowIndex].setSelected(true);
					}

				}
			}
		},
		onSubmit: function (oEvent) {
			var oTable = this.getView().byId("idTable");
			var oModel = oTable.getModel();
			var contexts = oTable.getSelectedContexts();
			var items = contexts.map(function (c) {
				return c.getObject();
			});
			
			var itemData = [];
			var vEbeln = this.getView().byId("idPO").getTitle();
			
			//var oChangedData = oModel.getPendingChanges();
			
			for ( var iRowIndex = 0; iRowIndex < items.length; iRowIndex++) {
				var vEbelp = items[iRowIndex].Ebelp;
				var vEmatn = items[iRowIndex].Ematn;
				var vTxz01 = items[iRowIndex].Txz01;
				var vWerks = items[iRowIndex].Werks;
				var vLgort = items[iRowIndex].Lgort;
				var vLgpbe = items[iRowIndex].Lgpbe;
				var vMenge = items[iRowIndex].Menge;
				var vWamng = items[iRowIndex].Wamng;
				var vBatch = items[iRowIndex].Batch;
				var vObmng = items[iRowIndex].Obmng;
				var vMeins = items[iRowIndex].Meins;
				var vXchpf = items[iRowIndex].Xchpf;
				
				itemData.push({
					Ebeln: vEbeln,
					Ebelp: vEbelp,
					Ematn: vEmatn,
					Txz01: vTxz01,
					Werks: vWerks,
					Lgort: vLgort,
					Lgpbe: vLgpbe,
					Menge: vMenge,
					Wamng: vWamng,
					Batch: vBatch,
					Obmng: vObmng,
					Meins: vMeins,
					Xchpf: vXchpf
				});
			}
			var oEntry1 = {};
			oEntry1.Ebeln = vEbeln;
			oEntry1.HeadtoItemNav = itemData;

			oModel.create("/GIheadSet", oEntry1, {
				async: true,
				success: function (oData, response) {

					// MessageBox.show("Updated Material Doc Number :" + oData.Ebeln, MessageBox.Icon.SUCCESS, "Success"
					MessageBox.success("Updated Material Doc Number :" + oData.Ebeln, {
						icon: MessageBox.Icon.SUCCESS,
						title: "Success",
						onClose: function () {
							oTable.removeSelections();
							oModel.resetChanges();
							_component.getRouter().navTo("List");
						}
					});
				},
				error: function (oError) {
					if (oError.responseText) {
						var oErrorMessage = JSON.parse(oError.responseText);
						MessageBox.show("Error: " +
							oErrorMessage.error.message.value, MessageBox.Icon.ERROR, "Not Updated");
					}

				}
			});
		}
	});

});