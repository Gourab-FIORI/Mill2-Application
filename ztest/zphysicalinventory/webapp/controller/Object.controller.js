sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/MessageToast",
	"../model/formatter",
	"sap/ui/core/Fragment"

], function (Controller, Filter, FilterOperator, JSONModel, MessageBox, MessageToast, formatter, Fragment) {
	"use strict";
	var _component;
	return Controller.extend("ordina.zmmphysicalinvn.controller.Object", {

		formatter: formatter,

		onInit: function () {

			var oBinDataVH = {
				data: [{
					CompanyCode: "",
					Plant: "",
					StorageLocation: "",
					Bin: "",
					Description: ""
				}]
			};
			var oBinVHModel = new JSONModel(oBinDataVH);
			this.getView().setModel(oBinVHModel, "bindatavh");

			let oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.getRoute("object").attachMatched(this._onObjectMatched, this);
			_component = this.getOwnerComponent();
			var oModel = new JSONModel();
			sap.ui.getCore().setModel(oModel, "oFlagModel");

			this._i18nBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();

			this._SelectedTableIndex = null;
			this._SelectedTablePath = null;
			this._Next = null;
		},

		_onObjectMatched: function (oEvent) {

			var vInvDoc = this.getView().byId("idInvDoc").getTitle();
			var vFiscalYear = this.getView().byId("idFiscalYear").getText();

			var aFilters = new Filter({
				and: true,
				aFilters: [
					new sap.ui.model.Filter("Physinventory", FilterOperator.EQ, vInvDoc),
					new sap.ui.model.Filter("Fiscalyear", FilterOperator.EQ, vFiscalYear)
				]
			});
			var oBinding = this.getView().byId("idTable").getBinding("items");
			oBinding.filter(aFilters);

			var sPlant = this.getView().byId("idPlant").getText();
			this._onCheckCountry(sPlant);

		},
		onLiveChange: function (oEvent) {
			var vQuantity = oEvent.getSource().getValue();
			var vSelectedline = oEvent.getSource().getBindingContext();
			var vItem = vSelectedline.getObject();
			var oTable = this.getView().byId("idTable");
			var oModel = oTable.getModel();
			var aItems = oTable.getItems();
			for (var iRowIndex = 0; iRowIndex < aItems.length; iRowIndex++) {
				var vItemNo = oModel.getProperty("Item", aItems[iRowIndex].getBindingContext());
				if (vItemNo === vItem.Item) {
					oModel.setProperty("Quantity", vQuantity, aItems[iRowIndex].getBindingContext());
					aItems[iRowIndex].setSelected(true);
				}
			}
		},
		onCheckBox: function (oEvent) {

			var vSelectedline = oEvent.getSource().getBindingContext();
			var vItem = vSelectedline.getObject();
			var checkbox = oEvent.getParameter("selected");

			if (checkbox === true) {
				var oTable = this.getView().byId("idTable");
				var oModel = oTable.getModel();
				var aItems = oTable.getItems();

				for (var iRowIndex = 0; iRowIndex < aItems.length; iRowIndex++) {
					var vItemNo = oModel.getProperty("Item", aItems[iRowIndex].getBindingContext());
					if (vItemNo === vItem.Item) {
						oModel.getProperty("ZeroCount", aItems[iRowIndex].getBindingContext());
						oModel.setProperty("ZeroCount", true, aItems[iRowIndex].getBindingContext());
						oModel.setProperty("Quantity", "0.000", aItems[iRowIndex].getBindingContext());
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

			for (var iRowIndex = 0; iRowIndex < items.length; iRowIndex++) {
				if(items[iRowIndex].Counted) {
					continue;
				}
				var vItem = items[iRowIndex].Item;
				var vMaterial = items[iRowIndex].Material;
				var vDescription = items[iRowIndex].Description;
				var vPlant = items[iRowIndex].Plant;
				var vStgeLoc = items[iRowIndex].StgeLoc;
				var vStgeBin = items[iRowIndex].StgeBin;
				var vBatch = items[iRowIndex].Batch;
				var vStockType = items[iRowIndex].StockType;
				var vZeroCount = items[iRowIndex].ZeroCount;
				var vQuantity = items[iRowIndex].Quantity;
				var vBaseUom = items[iRowIndex].BaseUom;

				itemData.push({
					Item: vItem,
					Material: vMaterial,
					Batch: vBatch,
					Description: vDescription,
					Plant: vPlant,
					StgeLoc: vStgeLoc,
					StgeBin: vStgeBin,
					StockType: vStockType,
					ZeroCount: vZeroCount,
					Quantity: vQuantity,
					BaseUom: vBaseUom
				});
			}

			var vPhyinv = this.getView().byId("idInvDoc").getTitle();
			var vFyear = this.getView().byId("idFiscalYear").getText();

			var oEntry1 = {};
			oEntry1.Physinventory = vPhyinv;
			oEntry1.Fiscalyear = vFyear;
			oEntry1.HdrToItemNav = itemData;
			oModel.create("/PhyinvHeadSet", oEntry1, {
				async: true,
				success: function (oData, response) {
					// MessageBox.show("Item Updated", MessageBox.Icon.SUCCESS, "updated");
					oModel.refresh(true);
					oModel.updateBindings(true);
					var sDocNum = response.data && response.data.Physinventory ? " " + response.data.Physinventory + "/" + response.data.Fiscalyear + "." : ".";
					MessageBox.success("Updated Material Doc Number" + sDocNum, {
						icon: MessageBox.Icon.SUCCESS,
						title: "Success",
						onClose: function () {
							oTable.removeSelections();
							oModel.resetChanges();
							_component.getRouter().navTo("list");
						}
					});
				},
				error: function (oError) {
					// MessageBox.show("Item not Updated", MessageBox.Icon.ERROR, "Not Updated");
					if (oError.responseText) {
						var oErrorMessage = JSON.parse(oError.responseText);
						MessageBox.show("Error: " +
							oErrorMessage.error.message.value, MessageBox.Icon.ERROR, "Not Updated");
					}
				}
			});
		},
		back: function () {
			var oTable = this.getView().byId("idTable");
			this.getView().byId("idTable").removeSelections();
			var oModel = oTable.getModel();
			oModel.resetChanges();
			_component.getRouter().navTo("list");
		},
		
		handleBatchSearchChange : function(oEvent) {
			var sValue = oEvent.getParameter("value");
			if(!sValue.trim) { return; }
			sValue = sValue.trim();
			if(sValue !== "") {
				this._sSuppBatch = sValue;
				this._Next = false;
				this._processSuppBatch();
			} else {
				this.iLastMatchedIndex = -1;
				this._sSuppBatch = "";
				this._Next = false;
			}
		},        

		onScanSuccess: function (oEvent) {
			if (oEvent.getParameter("cancelled")) {
				MessageToast.show("Scan cancelled", { duration: 1000 });
			} else {
				if (oEvent.getParameter("text")) {
					var sValue = oEvent.getParameter("text").trim();
					this.getView().byId("BatchSearchInput").setValue(sValue);
					this._sSuppBatch = sValue;
					this._Next = false;
					this._processSuppBatch();

				} else {
					this._sSuppBatch = "";
					this.getView().byId("BatchSearchInput").setValue("");
					this.iLastMatchedIndex = -1;
					this._Next = false;
				}
			}
		},
		onScanError: function (oEvent) {
			MessageToast.show("Scan failed: " + oEvent, { duration: 1000 });
		},

		onScanLiveupdate: function (oEvent) {
			// User can implement the validation about inputting value
		},

		handleInputSupplierBatch: function (oEvent) {

			var sPath = oEvent.getSource().getBindingContext().sPath;
			var sData = this.getView().getModel().getProperty(sPath);
			this._SelectedTablePath = this._getSelectedItemInModel(oEvent);

			var oTable = this.byId("idTable");
			var aSelectedItens = oTable.getSelectedContexts();
			var aItems = aSelectedItens.map(function (oItem) {
				return oItem.getPath();
			});

			var sMaterial = sData.Material,
				sPlant = sData.Plant,
				sStorageLocation = sData.StgeLoc;

			var oRow = oEvent.oSource.getParent();
			var oCells = oRow.getCells();
			var oSuppBatch = oCells[4];

			var oBatchData = {
				Material: sMaterial,
				Plant: sPlant,
				SupplierBatch: oEvent.getParameter("text")
			};

			//this._getSAPBatch(oBatchData, oSuppBatch);

		},

		_getSAPBatch: function (oBatchData, aCells) {

			var aTableFilter = [];
			this._addFilter(aTableFilter, oBatchData.Material, "Material");
			this._addFilter(aTableFilter, oBatchData.Batch, "Batch");
			this._addFilter(aTableFilter, oBatchData.SupplierBatch, "SupplierBatchId");
			/*if (oBatchData.Next){
				this._addFilter(aTableFilter, oBatchData.Next, "Next");
			}*/

			var oModel = this.getView().getModel();
			var mParameters = {
				filters: aTableFilter,
				success: function (oData, response) {
					if (oData.results.length !== 0) {
						if (oData.results[0].Batch === oBatchData.Batch) {
							oModel.setProperty(this._SelectedTablePath + "/SupplierBatch", oData.results[0].SupplierBatchId);
							aCells[8].focus();
						}
					}
					this._sSuppBatch = "";
				}.bind(this),
				error: function (oError) {
					var vMsg = this._i18nBundle.getText("SuppBatchFailed");
					MessageToast.show(vMsg);
				}.bind(this)
			};

			var sPath = "/SupplierBatchSet";
			oModel.read(sPath, mParameters);

		},

		handleNext: function (oEvent) {
			
			this._processSuppBatch();
			return;
			// var oBtn = oEvent.getSource();
			// var oView = this.getView();
			// var oTable = oView.byId("idTable");
			// var aItems = oTable.getAggregation("items");
			// var aCells = [];
			
			// var oBatchInput = oView.byId("BatchSearchInput");

			// if(!this.iLastMatchedIndex) {
			// 	this.iLastMatchedIndex = 0;
			// }
			
			// if(this.iLastMatchedIndex >= aItems.length - 1) {
			// 	this.iLastMatchedIndex = -1;
			// }
			
			// for (var i = this.iLastMatchedIndex + 1; i < aItems.length; i++) {
			// 	//var oObject = aItems[i].getBindingContext().getObject();
			// 	// var fQuantity = parseFloat(oObject.Quantity, 10);
			// 	// if (fQuantity === 0) {
			// 		aCells = aItems[i].getCells();
			// 		this.iLastMatchedIndex = i;
			// 		break;				
			// 	//}
			// }
			// if(aCells.length) {
			// 	//aCells[7].focus();
			// 	var sId = aCells[8].getId();
			// 	oBtn.setEnabled(false);
			// 	oBatchInput.setEnabled(false);
			// 	jQuery.sap.delayedCall(300, this, function() {
			// 		var oCtrl = oView.byId(sId);
			// 		if(oCtrl && oCtrl.focus) {
			// 			oCtrl.focus();
			// 		}
			// 		oBtn.setEnabled(true);
			// 		oBatchInput.setEnabled(true);
			// 	});
			// }

			// this._Next = true;
			// this._processSuppBatch();

		},

		handleAssignStoBin: function (sData) {

			var oModel = this.getView().getModel("oData");

			var sMaterial = sData.Material,
				sPlant = sData.Plant,
				sStorageLocation = sData.StgeLoc,
				sBatch = sData.Batch;

			var aTableFilter = [];
			this._addFilter(aTableFilter, sPlant, "Plant");
			this._addFilter(aTableFilter, sStorageLocation, "StorageLocation");
			this._addFilter(aTableFilter, sBatch, "Batch");


			var mParameters = {
				filters: aTableFilter,
				success: function (oData, response) {
					this.getView().getModel("bindatavh").setProperty("/data", oData.results);

				}.bind(this),
				error: function (oError) {
				}.bind(this)
			};

			var sPath = "/BinVHSet";
			oModel.read(sPath, mParameters);

		},

		handleSearchBin: function (oEvent) {

			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("StorageBin", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);

		},

		handleCloseBin: function (oEvent) {

			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var sObject = aContexts.map(function (oContext) {
					return oContext.getObject();
				});

			}

			var oModel = this.getView().getModel();
			oModel.setProperty(this._SelectedTablePath + "/StgeBin", sObject[0].Bin);
			oModel.refresh();

		},

		handleValueHelpBin: function (oEvent) {

			var sPath = oEvent.getSource().getBindingContext().sPath;
			var sData = this.getView().getModel().getProperty(sPath);
			this._SelectedTablePath = this._getSelectedItemInModel(oEvent);

			var oButton = oEvent.getSource(),
				oView = this.getView();

			if (!this._pDialog) {
				this._pDialog = Fragment.load({
					id: oView.getId(),
					name: "ordina.zmmphysicalinvn.fragment.BinDialog",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog;
				});
			}

			this._pDialog.then(function (oDialog) {
				this._configDialog(oButton, oDialog, sData);
				oDialog.open();
			}.bind(this));

		},

		_configDialog: function (oButton, oDialog, sData) {


			// Set draggable property
			var bDraggable = oButton.data("draggable");
			oDialog.setDraggable(bDraggable == "true");

			// Set resizable property
			var bResizable = oButton.data("resizable");
			oDialog.setResizable(bResizable == "true");

			// Multi-select if required
			var bMultiSelect = !!oButton.data("multi");
			oDialog.setMultiSelect(bMultiSelect);

			// Remember selections if required
			var bRemember = !!oButton.data("remember");
			oDialog.setRememberSelections(bRemember);

			var sResponsivePadding = oButton.data("responsivePadding");
			var sResponsiveStyleClasses = "sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer";

			if (sResponsivePadding) {
				oDialog.addStyleClass(sResponsiveStyleClasses);
			} else {
				oDialog.removeStyleClass(sResponsiveStyleClasses);
			}

			// Set custom text for the confirmation button
			var sCustomConfirmButtonText = oButton.data("confirmButtonText");
			oDialog.setConfirmButtonText(sCustomConfirmButtonText);

			this.handleAssignStoBin(sData);

		},

		_processSuppBatch: function () {
			var oView = this.getView();
			var oTable = oView.byId("idTable");
			var aItems = oTable.getAggregation("items");
			var aCells = [];
			
			var oBatchInput = oView.byId("BatchSearchInput");
			var sBatch = oBatchInput.getValue();
			
			if(!sBatch.trim) { return; }
			sBatch = sBatch.trim();

			for (var i = !this.iLastMatchedIndex ? 0 : this.iLastMatchedIndex+1 ; i < aItems.length; i++) {

				// var oObject = aItems[i].getBindingContext().getObject();
				// var fQuantity = parseFloat(oObject.Quantity, 10);
				// if ((oObject.SupplierBatch === sBatch || oObject.Batch === sBatch) && fQuantity === 0) {
				// 	aCells = aItems[i].getCells();
				// 	this.iLastMatchedIndex = i;
				// 	break;				
				// }
				var oObject = aItems[i].getBindingContext().getObject();
				if ((oObject.SupplierBatch === sBatch || oObject.Batch === sBatch)) {
					aCells = aItems[i].getCells();
					this.iLastMatchedIndex = i;
					break;
				}

			}
			if(aCells.length) {
				//aCells[7].focus();
				var sId = aCells[8].getId();
				jQuery.sap.delayedCall(500, this, function() {
					var oCtrl = oView.byId(sId);
					if(oCtrl && oCtrl.focus) {
						oCtrl.focus();
					}
				});
			} else {
				if(this.iLastMatchedIndex !== undefined && this.iLastMatchedIndex >= 0) {
					// it should start from begining if at least one was matched
					this.iLastMatchedIndex = undefined;
					this._processSuppBatch();
				}
			}
		},

		_getSelectedItemInModel: function (oEvent) {
			/*var sPath = oEvent.getSource().getBindingContext("items").getPath();
			return parseInt(sPath.substring(7, sPath.length));*/
			var sPath = oEvent.getSource().getBindingContext().getPath();
			return sPath;
		},

		_addFilter: function (aTableSearchState, field_screen, field_filter) {

			var pos = 0;
			var schar = field_screen.indexOf(",");

			if (schar !== -1) {

				var fField = field_screen.split(',');

				for (pos = 0; pos < 10; pos++) {
					var field = fField[pos];
					if (field !== undefined) {
						aTableSearchState.push(new Filter(field_filter, FilterOperator.EQ, field));
					}
				}

			} else {

				schar = field_screen.indexOf("/");

				if (schar !== -1) {
					fField = field_screen.split('/');
					var from = field_screen;
					var to = field_screen;
					aTableSearchState.push(new Filter(field_filter, FilterOperator.BT, from, to));
				} else {
					aTableSearchState.push(new Filter(field_filter, FilterOperator.EQ, field_screen));
				}

			}

		},

		_onCheckCountry: function (sValue) {

			var oModel = this.getView().getModel(),
				sPath = "/CheckCountrySet";

			var aTableFilter = [];
			this._addFilter(aTableFilter, sValue, "Plant");
			var mParameters = {
				filters: aTableFilter,
				success: function (oData, response) {
					var oCountry = oData.results[0];
					var oCountryModel = new JSONModel(oCountry);
					this.getView().setModel(oCountryModel, "country");
				}.bind(this),
				error: function (oError) {
				}.bind(this)
			};

			oModel.read(sPath, mParameters);

		},

		_callBinVH: function () {

		}

	});

});