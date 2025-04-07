sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/ui/core/ValueState",
	"sap/m/Dialog",
	"sap/m/DialogType",
	"sap/m/Button",
	"sap/m/ButtonType",
	"sap/m/Text"
], function (Controller, Filter, FilterOperator, JSONModel, ValueState, Dialog, DialogType, Button, ButtonType, Text) {
	"use strict";

	return Controller.extend("webapp.ZGoodsIssue4PM.controller.CostCenter", {
		onInit: function () {
			this.applyInitialFocusTo();
		},
		applyInitialFocusTo: function () {
			jQuery.sap.delayedCall(500, this, function () {
				this.getView().byId("idCC").focus();
			});
		},
		onNext: function () {
			this.getOwnerComponent().getRouter().navTo("MaterialList");
			
		},

		_getDialog: function () {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment("webapp.ZGoodsIssue4PM.view.CostcenterHelp", this);
				this.getView().addDependent(this._oDialog);
			}
			return this._oDialog;
		},
		//adding Internal order fragment to view T_singhag1 01.08.2024
		_getDialog2: function () {
			if (!this._oDialog2) {
				this._oDialog2 = sap.ui.xmlfragment("webapp.ZGoodsIssue4PM.view.InternalOrdHelp", this);
				this.getView().addDependent(this._oDialog2);
			}
			return this._oDialog2;
		},
		onInternalOrdHelp: function () {
			this._getDialog2().open();
		},
		onCloseDialogIO: function () {
			this._getDialog2().close();
		},
		//End of adding Internal order fragment to view T_singhag1 01.08.2024
		onCostcenterHelp: function () {
			this._getDialog().open();
		},
		onCloseDialog: function () {
			this._getDialog().close();
		},
		onRowSelect: function (oEvent) {
			var oModel = this.getOwnerComponent().getModel("app");
			var Selectedrow = oEvent.getParameter("listItem").getBindingContext().getObject();
			oModel.setProperty("/CostCenter", Object.assign({}, Selectedrow));
			oModel.setProperty("/InternalOrder", "");   //++t_gsinghag1
			this._getDialog().close();
			this.getView().byId("idCC").setValue("");
			this.getOwnerComponent().getRouter().navTo("MaterialList");
			
		},
		//Start of code :For Internal order selection ading logic t_singhag1 01.08.2024
		onRowSelectIO: function (oEvent) {
			var oModel = this.getOwnerComponent().getModel("app");
			var Selectedrow = oEvent.getParameter("listItem").getBindingContext().getObject();
			//  // Assign new key
			//  Selectedrow['Kostl'] = Selectedrow['Aufnr'] ; 

			//  // Delete old key
			//  delete Selectedrow['Aufnr']; 
			oModel.setProperty("/InternalOrder", Object.assign({}, Selectedrow));
			oModel.setProperty("/CostCenter","");
			this._getDialog().close();
			this.getView().byId("idIO").setValue("");
			this.getOwnerComponent().getRouter().navTo("MaterialList");
			
		},

		//End of code :For Internal order selection ading logic t_singhag1 01.08.2024

		onCostcenterGet: function () {
			var vcostc = this.getView().byId("idCC").getValue();
			this.getView().byId("idCC").setValue("");
			//Start of code :For Internal order selection ading logic t_singhag1 28.08.2024
			var vintO = this.getView().byId("idIO").getValue();
			this.getView().byId("idIO").setValue("");
			// Check if exactly one of the fields is filled
			if (vcostc && vintO) {
				// Both fields are filled
				this.showErrorMessage("Please enter data in only one field.");
				return;
			} else if (!vcostc && !vintO) {
				// Neither field is filled
				this.showErrorMessage("Please enter either Cost Center or Internal Order.");
				return;
			}
			//End of code :For Internal order selection ading logic t_singhag1 28.08.2024
			if (vcostc) {
				var appModel = this.getOwnerComponent().getModel("app");
				var sURI = "/sap/opu/odata/sap/ZGOODSISSUE4PM_SRV";
				var oDataModel = new sap.ui.model.odata.ODataModel(sURI, true);
				var oCCModel = new sap.ui.model.json.JSONModel();
				var vThis = this.getOwnerComponent();
				oDataModel.read("/CostCenterSet(" + "'" + vcostc + "'" + ")", null, null, true, function (oData, repsonse) {
					oCCModel.setData(oData);
					var ccData = oCCModel.getData();
					appModel.setProperty("/CostCenter", Object.assign({}, ccData));
					appModel.setProperty("/InternalOrder", "");   //++t_gsinghag1
					vThis.getRouter().navTo("MaterialList");
				});			//Start of code :For Internal order selection ading logic t_singhag1 28.08.2024
			} else if (vintO) {
				var appModel = this.getOwnerComponent().getModel("app");
				var sURI = "/sap/opu/odata/sap/ZGOODSISSUE4PM_SRV";
				var oDataModel = new sap.ui.model.odata.ODataModel(sURI, true);
				var oCCModel = new sap.ui.model.json.JSONModel();
				var vThis = this.getOwnerComponent();
				oDataModel.read("/InternalOrdSet(" + "'" + vintO + "'" + ")", null, null, true, function (oData, repsonse) {
					oCCModel.setData(oData);
					var ccData = oCCModel.getData();
					appModel.setProperty("/InternalOrder", Object.assign({}, ccData));
					appModel.setProperty("/CostCenter","");
					vThis.getRouter().navTo("MaterialList");
				});
			}					//End of code :For Internal order selection ading logic t_singhag1 28.08.2024
			 else {
				this.oErrorMessageDialog = new Dialog({
					type: DialogType.Message,
					title: "Error",
					state: ValueState.Error,
					content: new Text({
						text: "Please enter Cost Center"
					}),
					beginButton: new Button({
						type: ButtonType.Emphasized,
						text: "OK",
						press: function () {
							this.oErrorMessageDialog.close();
						}.bind(this)
					})
				});
				this.oErrorMessageDialog.open();
			}

		},
		showErrorMessage: function (message) {
			this.oErrorMessageDialog = new sap.m.Dialog({
				type: sap.m.DialogType.Message,
				title: "Error",
				state: sap.ui.core.ValueState.Error,
				content: new sap.m.Text({ text: message }),
				beginButton: new sap.m.Button({
					type: sap.m.ButtonType.Emphasized,
					text: "OK",
					press: function () {
						this.oErrorMessageDialog.close();
					}.bind(this)
				})
			});
			this.oErrorMessageDialog.open();
		}

	});

});