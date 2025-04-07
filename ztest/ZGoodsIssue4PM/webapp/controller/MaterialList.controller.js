sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/json/JSONModel",
		"sap/ui/model/Filter",
		"sap/ui/core/ValueState",
		"sap/m/Dialog",
		"sap/m/DialogType",
		"sap/m/Button",
		"sap/m/ButtonType",
		"sap/m/Text",
		"sap/m/MessageBox",
		"sap/m/MessageToast",
		"sap/ui/model/ValidateException"
	],
	function (Controller, JSONModel, Filter, ValueState, Dialog, DialogType, Button, ButtonType, Text, MessageBox, MessageToast,
		ValidateException) {
		"use strict";
		var _component;
		return Controller.extend("webapp.ZGoodsIssue4PM.controller.MaterialList", {

			onInit: function () {
				let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
				oRouter.getRoute("MaterialList").attachMatched(this._onObjectMatched, this);
				_component = this.getOwnerComponent();
				var testData = [];
				var oModel = new sap.ui.model.json.JSONModel({
					data: testData
				});
				this.getView().setModel(oModel);
			},
			_onObjectMatched: function (oEvent) {

			},
			_getDialog: function () {
				if (!this._oDialog) {
					this._oDialog = sap.ui.xmlfragment("webapp.ZGoodsIssue4PM.view.AddMaterialPopup", this);
					this.getView().addDependent(this._oDialog);
				}
				return this._oDialog;
			},
			setFocus: function () {
				var oTable = this.getView().byId("itemTable"),
					oItem = oTable.getItems()[0];
				if (oItem) {
					var oCell = oItem.getCells()[6];
					if (oCell) {
						jQuery.sap.delayedCall(500, this, function () {
							oCell.focus();	
						});
					}
				}
			},
			onAdd: function () {
				this._getDialog().open();
			},
			onAddMaterial: function () {
				var vMaterial = sap.ui.getCore().byId("idMaterial").getValue();
				var lvAufnr = this.getView().byId("idIO").getTitle();
				if (vMaterial) {
					var oModel = this.getView().byId("itemTable").getModel();
					var sURI = "/sap/opu/odata/sap/ZGOODSISSUE4PM_SRV";
					var oDataModel = new sap.ui.model.odata.ODataModel(sURI, true);
					var oCCModel = new JSONModel();
					oDataModel.read("/MaterialListSet(Matnr=" + "'" + vMaterial + "',Aufnr="+ "'" + lvAufnr + "')", null, null, true, function (oData, repsonse) {
						oCCModel.setData(oData);
						var itemData = oModel.getProperty("/data");
						var mData = oCCModel.getData();
						var itemRow = {
							Matnr: mData.Matnr,
							Maktx: mData.Maktx,
							Werks: mData.Werks,
							Lgort: mData.Lgort,
							Lgpbe: mData.Lgpbe,
							Labst: mData.Labst,
							//Wamng: mData.Wamng,
							Wamng: "",
							Meins: mData.Meins
						};
						// itemData.push(itemRow);
						itemData.splice(0, 0, itemRow);
						oModel.setData({
							data: itemData
						});
					});
				}
				// Clear popup input
				sap.ui.getCore().byId("idMaterial").setValue("");
				this._getDialog().close();
			},
			onDelete: function () {
				var oTable = this.getView().byId("itemTable");
				var oModel2 = oTable.getModel();
				var aRows = oModel2.getData().data;
				var aContexts = oTable.getSelectedContexts();
				// Loop backward from the Selected Rows

				for (var i = aContexts.length - 1; i >= 0; i--) {
					// Selected Row
					var oThisObj = aContexts[i].getObject();
					// Here we are trying to find the index of the selected row
					var index = $.map(aRows, function (obj, index) {
						if (obj === oThisObj) {
							return index;
						}
					});
					// Here we are deleting the selected index row
					aRows.splice(index, 1);
				}
				// Set the Model with the Updated Data after Deletion
				oModel2.setData({
					data: aRows
				});
				// Reset table selection in UI5
				oTable.removeSelections(true);
			},
			onCloseDialog: function () {
				this._getDialog().close();
			},
			onChangeQuant: function (oEvent) {
				var vSelectedline = oEvent.getSource().getBindingContext();
				var path = vSelectedline.sPath;
				var vIndex = path.slice(6);
				var oTable = this.getView().byId("itemTable");
				var oModel2 = oTable.getModel();
				var aRows = oModel2.getData().data;
				var totalQuant = aRows[vIndex].Labst;
				var issueQuant = oEvent.getSource().getValue();
				// Convert to Number
				var nTotal = totalQuant * 1;
				var nIssue = issueQuant * 1;
				if (nIssue > nTotal) {
					//oEvent.getSource().addStyleClass("myTimeErrorValueState");
					oEvent.getSource().setValueState("Error");
				} else {
					issueQuant = issueQuant.replaceAll(' ', '');
					oModel2.getData().data[vIndex].Wamng = issueQuant;
					//oEvent.getSource().removeStyleClass("myTimeErrorValueState");
					oEvent.getSource().setValueState("None");
				}
			},

			onBack: function () {
				this.onRefreshtable();
				var oModel = this.getOwnerComponent().getModel("app");
				oModel.refresh(true);
				_component.getRouter().navTo("CostCenter");
			},
			onRefreshtable: function () {
				var oTable = this.getView().byId("itemTable");
				var oModel2 = oTable.getModel();
				var aItems = oTable.getItems();
				var aRows = oModel2.getData().data;
				// var appModel = this.getOwnerComponent().getModel("app");
				for (var i = aItems.length - 1; i >= 0; i--) {
					aRows.splice(i, 1);
				}
				// Set the Model with the Updated Data after Deletion
				oModel2.setData({
					data: aRows
				});
			},
			onSubmit: function () {
				var oTable = this.getView().byId("itemTable");
				var oModel = oTable.getModel();
				var aItems = oTable.getItems();
				var sURI = "/sap/opu/odata/sap/ZGOODSISSUE4PM_SRV";
				var oModel1 = new sap.ui.model.odata.ODataModel(sURI, true);
				var lvKostl = this.getView().byId("idCostc").getTitle();
				var lvAufnr = this.getView().byId("idIO").getTitle();

				var itemData = [];
				var flagpop = "";
				var that = this;
				for (var iRowIndex = 0; iRowIndex < aItems.length; iRowIndex++) {
					var lvWamng = oModel.getProperty("Wamng", aItems[iRowIndex].getBindingContext());
					if (lvWamng > 0) {
						var lvMatnr = oModel.getProperty("Matnr", aItems[iRowIndex].getBindingContext());
						var lvMaktx = oModel.getProperty("Maktx", aItems[iRowIndex].getBindingContext());
						var lvWerks = oModel.getProperty("Werks", aItems[iRowIndex].getBindingContext());
						var lvLgort = oModel.getProperty("Lgort", aItems[iRowIndex].getBindingContext());
						var lvLgpbe = oModel.getProperty("Lgpbe", aItems[iRowIndex].getBindingContext());
						var lvMeins = oModel.getProperty("Meins", aItems[iRowIndex].getBindingContext());
						var lvLabst = oModel.getProperty("Labst", aItems[iRowIndex].getBindingContext());
						itemData.push({
							Matnr: lvMatnr,
							Maktx: lvMaktx,
							Werks: lvWerks,
							Lgort: lvLgort,
							Lgpbe: lvLgpbe,
							Labst: lvLabst,
							Wamng: lvWamng,
							Meins: lvMeins
						});
					} else {
						flagpop = "X";
					}
				}
				if (flagpop) {
					MessageBox.warning("Material have initial quantity, Do you want to continue?", {
						actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
						emphasizedAction: MessageBox.Action.OK,
						onClose: function (sAction) {
							if (sAction === "OK") {
								var oEntry = {};
								var spath;										//++ t_singhag1 02.08.2024
								if(lvAufnr){	
									spath = "/InternalOrdSet";					
									oEntry.Aufnr = lvAufnr;
								oEntry.InternalordToMaterialNav = itemData;
								
								}else{
									spath = "/CostCenterSet";
								oEntry.Kostl = lvKostl;
								oEntry.CostCenterToMaterialNav = itemData;
								}												//++ t_singhag1 02.08.2024
								oModel1.create(spath, oEntry, {
									async: true,
									success: function (oData, response) {
										if(lvAufnr){							//++ t_singhag1 02.08.2024
											var docno = oData.Aufnr;			
										
										}else{
											var docno = oData.Kostl;
										}										//++ t_singhag1 02.08.2024
										MessageBox.success("Updated Material Doc Number :" + docno, {
											icon: MessageBox.Icon.SUCCESS,
											title: "Success",
											onClose: function () {
												that.onBack();
											}
										});
									},
									error: function (oError) {
										MessageBox.show("Material Document not Created", MessageBox.Icon.ERROR, "Update Failed");
									}
								});
							}
						}
					});
				}

				// If no pop than post all material		
				else {
					var oEntry = {};
					var spath;										//++ t_singhag1 02.08.2024
					if(lvAufnr){	
						spath = "/InternalOrdSet";					
						oEntry.Aufnr = lvAufnr;
					oEntry.InternalordToMaterialNav = itemData;
					
					}else{
						spath = "/CostCenterSet";
					oEntry.Kostl = lvKostl;
					oEntry.CostCenterToMaterialNav = itemData;
					}												//++ t_singhag1 02.08.2024
					oModel1.create(spath, oEntry, {
						async: true,
						success: function (oData, response) {
							if(lvAufnr){							//++ t_singhag1 02.08.2024
								var docno = oData.Aufnr;			
							
							}else{
								var docno = oData.Kostl;
							}										//++ t_singhag1 02.08.2024
							MessageBox.success("Updated Material Doc Number :" + docno, {
								icon: MessageBox.Icon.SUCCESS,
								title: "Success",
								onClose: function () {
									that.onBack();
								}
							});
						},
						error: function (oError) {
							MessageBox.show("Material Document not Created", MessageBox.Icon.ERROR, "Update Failed");
						}
					});
				}
			}
		});
	});