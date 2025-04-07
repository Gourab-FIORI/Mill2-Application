sap.ui.define(["sap/m/ColumnListItem", "sap/m/Label", "sap/ui/model/Filter", "sap/m/MessageToast", "sap/m/MessageBox",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog", "sap/ui/model/json/JSONModel", "sap/ui/model/resource/ResourceModel"
], function (ColumnListItem, Label, Filter, MessageToast, MessageBox,
	ValueHelpDialog, JSONModel,ResourceModel) {
	return sap.ui.controller("ZMM.zmm_progissue_lst.ext.controller.ListReportExt", {
		onInit: function () {
			this.oView = this.getView();
			this.oModel = this.oView.getModel();
			
			// if(!this.oModel){
			// 	var url = "/sap/opu/odata/sap/ZMM_PROGISSUE_SRV/";
			// 	this.oModel = new sap.ui.model.odata.ODataModel(url);
			// }
			  // Detect logon language
			   //++T_singhaG1 for GAP82A 07.02.2025
			  var sLanguage = sap.ui.getCore().getConfiguration().getLanguage();

			  // Default to English
			  //var sI18nPath = "ZMM.zmm_progissue_lst.ext.i18n.i18n.properties";
  
			  // If French, set the French translation file
			  if (sLanguage.toLowerCase().startsWith("fr")) {
				//sap.ui.getCore().byId("SplitDialogColumnStrandLabel").setText("Brin");
				//sap.ui.getCore().byId("SplitDialogColumnRoadLabel").setText("Route");
			  }
  
			//   // Set the i18n Model
			//   var oResourceModel = new ResourceModel({
			// 	  bundleUrl: sI18nPath
			//   });
			//   this.oView.setModel(oResourceModel, "i18n");
			  //++T_singhaG1 for GAP82A 07.02.2025
			this.oSplitDataModel = this.getOwnerComponent().getModel("splitData");
			this.oView.setModel(this.oSplitDataModel, "splitData");

			if (!this._oSplitDialog) { //Distribution item values
				this._oSplitDialog = sap.ui.xmlfragment({
					fragmentName: "ZMM.zmm_progissue_lst.ext.view.SplitDialog",
					type: "XML",
					id: "ZMM.zmm_progissue_lst.ext.SplitDialog"
				}, this);
				this._oSplitDialog.setModel(this.oModel);
				this.oView.addDependent(this._oSplitDialog);
			}

			if (!this._oUnplannedDialog) {
				this._oUnplannedDialog = sap.ui.xmlfragment({
					fragmentName: "ZMM.zmm_progissue_lst.ext.view.UnplannedDialog",
					type: "XML",
					id: "ZMM.zmm_progissue_lst.ext.SplitDialog"
				}, this);
				this._oUnplannedDialog.setModel(this.oModel);
				this.oView.addDependent(this._oUnplannedDialog);
			}

			if (!this._oItemMessagesDialog) {
				this._oItemMessagesDialog = sap.ui.xmlfragment({
					fragmentName: "ZMM.zmm_progissue_lst.ext.view.ItemMessagesDialog",
					type: "XML",
					id: "ZMM.zmm_progissue_lst.ext.ItemMessagesDialog"
				}, this);
				this._oItemMessagesDialog.setModel(this.oModel);
				this.oView.addDependent(this._oItemMessagesDialog);
			}

			var sTitle = "Desired Value";

			if (!this._oPlantValueHelpDialog) {
				this._oPlantValueHelpDialog = new ValueHelpDialog({
					// modal : true,
					supportRangesOnly: false,
					supportMultiselect: false,
					title: sTitle,
					supportRanges: false,
					key: "Plant",
					keys: ["PlantName"],
					descriptionKey: "PlantName",
					ok: jQuery.proxy(this.onPlantValueHelpResultSelect, this),
					cancel: function () {
						this.close();
					},
					afterClose: function () {
						this.setModel(null);
					},
					beforeOpen: function () {
						this.oSelectionTitle.setText(sTitle);
					}
				});
			}
		},
		
		onAfterRendering: function (oEvt) {
			jQuery.sap.delayedCall(200, this, function () {
				var oSearchField = this.byId("listReportFilter-btnBasicSearch");
				if (oSearchField) {
						oSearchField.focus();
				}
			}.bind(this));
		},

		handleProductionOrderScanSuccess: function (oEvt) {
			if (oEvt.getParameter("cancelled")) {
				MessageToast.show("Scan cancelled", {
					duration: 1000
				});
			} else {
				var oSearchField = this.byId("listReportFilter-btnBasicSearch");
				var oGoBtn = this.byId("listReportFilter-btnGo");
				if (oEvt.getParameter("text")) {
					oSearchField.setValue(oEvt.getParameter("text"));
					oGoBtn.firePress();
				} else {
					oSearchField.setValue("");
				}
			}
		},

		handleProductionOrderScanError: function (oEvt) {},

		handleProductionOrderScanLiveupdate: function (oEvt) {},

		handleSplitButton: function (oEvt) {
			var oView = this.oView ? this.oView : oEvt.getSource().getParent();
			var oBindingContext = oEvt.getSource().getBindingContext();
			var oSplitDataModel = oView.getModel("splitData");

			var oNewSplitCommon = oSplitDataModel.getObject("/NewSplitCommon");
			var oOrderEntry = oBindingContext.getObject();

			oNewSplitCommon.Quantity = oOrderEntry.OpenedQuantity;
			oNewSplitCommon.OrderOpenedQuantity = oOrderEntry.OpenedQuantity;
			oNewSplitCommon.Batch = oOrderEntry.Batch;
			oNewSplitCommon.MaterialBatchManaged = oOrderEntry.MaterialBatchManaged;

			var oDialog = this._oSplitDialog;

			oDialog.bindElement({
				path: oBindingContext.getPath(),
				events: {
					change: function (oEvent) {},
					dataRequested: function () {
						oDialog.setBusy(true);
					},
					dataReceived: function (oData) {
						oDialog.setBusy(false);
					}
				}
			});
			oSplitDataModel.updateBindings(true);
// 			//++t_singhag1 for strand and road field visibility
// 			var oItemTemplate = Object.assign({}, oSplitDataModel.getObject("/SplitTemplate"));
// 			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
// 			var sPath = "/ZC_PROORDC_LST";
// var aFilters = [
//     new sap.ui.model.Filter("ProductionOrder", sap.ui.model.FilterOperator.EQ, oOrderEntry.ProductionOrder)
// ];

// oView.getModel().read(sPath, {
//     method: "GET",
//     filters: aFilters,
//     urlParameters: {
//         "$select": "FieldsActive"
//     },
//     success: function (oData) {
//         var oEntry = oData.results.find(() => true); // Get the first entry if available
//         if (oEntry !== undefined) {
//             // Set FieldsActive based on the value retrieved
//             oItemTemplate.FieldsActive = (oEntry.FieldsActive === 'X');

//             // Continue with any other logic as needed, e.g., adding to a collection
//             aSplitItems.push(oItemTemplate);
//             // this.updateOpenQuantity(oSplitDataModel);
//             // oSplitDataModel.updateBindings(true);
//             // oDialog.open();
//            // return;
//         }
//         sap.m.MessageToast.show(this._i18nText("MSG_ORDER_NOT_FOUND"));
//     }.bind(this),
//     error: function () {
//         sap.m.MessageToast.show(this._i18nText("MSG_ORDER_SRV_ERROR"));
//         oItemTemplate.FieldsActive = false;
//         n.updateBindings(true);
//     }.bind(this)
// });
// //end of adding code  //++t_singhag1 for strand and road field visibility
			if(!oOrderEntry.Batch) {
				oDialog.open();
				return;
			}

			var oModel = oView.getModel();
			var oItemTemplate = Object.assign({}, oSplitDataModel.getObject("/SplitTemplate"));
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			
			if (aSplitItems.length > 0) {
				var iMaxIdx = Math.max.apply(Math, aSplitItems.map(function (o) {
					return o.Index;
				}));
				oItemTemplate.Index = (iMaxIdx + 1) + "";
			} else {
				oItemTemplate.Index = "1";
			}
			
			oItemTemplate.Material = oOrderEntry.Material;
			oItemTemplate.Plant = oOrderEntry.Plant;
			oItemTemplate.ProductionOrder = oOrderEntry.ProductionOrder;
			oItemTemplate.Reservation = oOrderEntry.Reservation;
			oItemTemplate.ReservationItem = oOrderEntry.ReservationItem;
			oItemTemplate.Unit = oOrderEntry.BaseUnit;
			oItemTemplate.WMLEnabled = false;
			
			var aFilters = [
				new Filter("Material", "EQ", oOrderEntry.Material),
				new Filter("Batch", "EQ", oOrderEntry.Batch)
			];

			if (oOrderEntry.StorageLocation !== "") {
				aFilters.push(new Filter("StorageLocation", "EQ", oOrderEntry.StorageLocation));
			}

			oModel.read("/ZI_MATBATCH_VH", {
				method: "GET",
				filters: aFilters,
				urlParameters: {
					"$expand": "to_WmlStock"
				},
				success: function (oData) {
					var oBatchVH = oData.results.find(() => true);
					if (oBatchVH !== undefined) {
						oItemTemplate.StorageLocation = oBatchVH.StorageLocation;
						oItemTemplate.Batch = oBatchVH.Batch;
						oItemTemplate.SupplierBatch = oBatchVH.BatchBySupplier;
						var fBatchQuantity = parseFloat(oBatchVH.BaseUnitQuantity);
						oItemTemplate.Quantity = fBatchQuantity;
						oItemTemplate.WMLEnabled = oBatchVH.WMLEnabled !== "";
						if (oBatchVH.to_WmlStock && oBatchVH.to_WmlStock.results) {
							var oWmlStockEntry = oBatchVH.to_WmlStock.results.find(() => true);
							if (oWmlStockEntry) {
								oItemTemplate.WMLBin = oWmlStockEntry.StorageBin;
								var fBinQuantity = parseFloat(oWmlStockEntry.Quantity, 10);
								oItemTemplate.Quantity = fBatchQuantity > fBinQuantity && oItemTemplate.AutoQuantity ? fBinQuantity : fBatchQuantity;
							}
						}
						aSplitItems.push(oItemTemplate);
						this.updateOpenQuantity(oSplitDataModel);
						oSplitDataModel.updateBindings(true);
						oDialog.open();
						return;
					}
					sap.m.MessageToast.show(this._i18nText("MSG_BATCH_NOT_FOUND"));
				}.bind(this),
				error: function () {
					sap.m.MessageToast.show(this._i18nText("MSG_BATCH_SRV_ERROR"));
					oItemTemplate.StorageLocation = "";
					oItemTemplate.Batch = "";
					oItemTemplate.SupplierBatch = "";
					oItemTemplate.WMLBin = "";
					oItemTemplate.Quantity = 0;
					oSplitDataModel.updateBindings(true);
				}.bind(this)
			});
		},
		// ++ t-singhaG1 GAP 082a, Strand and road field visibility
		// Function to fetch FieldsActive for a specific ProductionOrder and return it as a boolean
	
		fetchFieldsActive:function(sProductionOrder) {
    var oSplitDataModel = oView.getModel("splitData");

    // Construct the path with the dynamic ProductionOrder filter and selecting only FieldsActive
    var sPath = "/ZC_PROORDC_LST?$filter=ProductionOrder eq '" + encodeURIComponent(sProductionOrder) + "'&$select=FieldsActive";

    // Return a Promise to handle the asynchronous data fetch
    return new Promise(function(resolve, reject) {
        oSplitDataModel.read(sPath, {
            success: function(oData) {
                if (oData.results && oData.results.length > 0) {
                    // Return FieldsActive as true if 'X', otherwise false
                    var isActive = (oData.results[0].FieldsActive === 'X');
                    resolve(isActive);
                } else {
                    // Resolve with null if no data was found
                    resolve(null);
                }
            },
            error: function(oError) {
                // Reject the Promise in case of an error
                reject(oError);
            }
        });
    });
},

		handleUnplannedButton: function (oEvt) {
			var oView = this.oView ? this.oView : oEvt.getSource().getParent();
			var oOrderEntry = null;
			
			var oBindingContext = this.extensionAPI.getSelectedContexts()[0];
			
			if(!oBindingContext) {
				oBindingContext = oEvt.getSource().getBindingContext();
				if(oBindingContext) {
					oOrderEntry = oBindingContext.getObject();
					if(!oOrderEntry.Material) {
						oOrderEntry = null;
					}
				}
			} else {
				oOrderEntry = oBindingContext.getObject();
			}

			if (!oOrderEntry) {
				MessageToast.show("Production order item must be selected.");
				return;
			}
			
			var oSplitDataModel = oView.getModel("splitData");

			var oUnplannedCommon = oSplitDataModel.getObject("/UnplannedCommon");
			oUnplannedCommon.Material = oOrderEntry.Material;
			oUnplannedCommon.MaterialBatchManaged = oOrderEntry.MaterialBatchManaged;
			oUnplannedCommon.Plant = oOrderEntry.Plant;
			oUnplannedCommon.Qunatity = 0;
			oUnplannedCommon.Unit = oOrderEntry.BaseUnit;

			var oDialog = this._oUnplannedDialog;

			oDialog.bindElement({
				path: oBindingContext.getPath(),
				events: {
					change: function (oEvent) {},
					dataRequested: function () {
						oDialog.setBusy(true);
					},
					dataReceived: function (oData) {
						oDialog.setBusy(false);
					}
				}
			});
			oSplitDataModel.updateBindings(true);
			oDialog.open();
		},

		handleShowMessagesButton: function (oEvt) {
			var oView = this.oView ? this.oView : oEvt.getSource().getParent();
			var oBindingContext = oEvt.getSource().getBindingContext();
			var oSplitDataModel = oView.getModel("splitData");

			var oDialog = this._oItemMessagesDialog;

			oDialog.bindElement({
				path: oBindingContext.getPath(),
				events: {
					change: function (oEvent) {},
					dataRequested: function () {
						oDialog.setBusy(true);
					},
					dataReceived: function (oData) {
						oDialog.setBusy(false);
					}
				}
			});
			oSplitDataModel.updateBindings(true);
			oDialog.open();
		},

		handleAddSplitButton: function (oEvt) {
			var oView = this.oView;
			var oBindingContext = oEvt.getSource().getBindingContext();
			var oOrderEntry = oBindingContext.getObject();
			var oSplitDataModel = oView.getModel("splitData");
			var oItemTemplate = Object.assign({}, oSplitDataModel.getObject("/SplitTemplate"));
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			if (aSplitItems.length > 0) {
				var iMaxIdx = Math.max.apply(Math, aSplitItems.map(function (o) {
					return o.Index;
				}));
				oItemTemplate.Index = (iMaxIdx + 1) + "";
			} else {
				oItemTemplate.Index = "1";
			}

			var oUnplannedCommon = oSplitDataModel.getObject("/UnplannedCommon");

			oItemTemplate.IsUnplanned = oUnplannedCommon.Material !== "";
			oItemTemplate.Material = oUnplannedCommon.Material !== "" ? oUnplannedCommon.Material : oOrderEntry.Material;
			oItemTemplate.Plant = oUnplannedCommon.Plant !== "" ? oUnplannedCommon.Plant : oOrderEntry.Plant;
			oItemTemplate.ProductionOrder = oOrderEntry.ProductionOrder;
			oItemTemplate.Reservation = oOrderEntry.Reservation;
			oItemTemplate.ReservationItem = oOrderEntry.ReservationItem;
			oItemTemplate.Unit = oUnplannedCommon.Material !== "" ? oUnplannedCommon.Unit : oOrderEntry.BaseUnit;
			oItemTemplate.WMLEnabled = false;
			//++t_singhag1 for strand and road field visibility
			
			var sPath = "/ZC_PROORDC_LST";
var aFilters = [
    new sap.ui.model.Filter("ProductionOrder", sap.ui.model.FilterOperator.EQ, oOrderEntry.ProductionOrder)
];

oView.getModel().read(sPath, {
    method: "GET",
    filters: aFilters,
    urlParameters: {
        "$select": "FieldsActive"
    },
    success: function (oData) {
        var oEntry = oData.results.find(() => true); // Get the first entry if available
        if (oEntry !== undefined) {
            // Set FieldsActive based on the value retrieved
            oItemTemplate.FieldsActive = (oEntry.FieldsActive === 'X');

            // Continue with any other logic as needed, e.g., adding to a collection
            aSplitItems.push(oItemTemplate);
			
			oSplitDataModel.updateBindings(true);
            // this.updateOpenQuantity(oSplitDataModel);
            // oSplitDataModel.updateBindings(true);
            // oDialog.open();
           // return;
        }
        //sap.m.MessageToast.show(this._i18nText("MSG_ORDER_NOT_FOUND"));
    }.bind(this),
    error: function () {
        //sap.m.MessageToast.show(this._i18nText("MSG_ORDER_SRV_ERROR"));
        oItemTemplate.FieldsActive = false;
        aSplitItems.push(oItemTemplate);
			oSplitDataModel.updateBindings(true);
    }.bind(this)
});
//end of adding code  //++t_singhag1 for strand and road field visibility
			// aSplitItems.push(oItemTemplate);
			// oSplitDataModel.updateBindings(true);
		},

		handleAddSplitScanSuccess: function (oEvt) {
			debugger;
			var oView = this.oView;
			var oModel = oView.getModel();
			var oBindingContext = oEvt.getSource().getBindingContext();
			var oOrderEntry = oBindingContext.getObject();
			var oSplitDataModel = oView.getModel("splitData");
			var oItemTemplate = Object.assign({}, oSplitDataModel.getObject("/SplitTemplate"));
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var sScanValue = oEvt.getParameter("text");
			if (oEvt.getParameters().cancelled === false && sScanValue !== "") {
				if (aSplitItems.length > 0) {
					var iMaxIdx = Math.max.apply(Math, aSplitItems.map(function (o) {
						return o.Index;
					}));
					oItemTemplate.Index = (iMaxIdx + 1) + "";
				} else {
					oItemTemplate.Index = "1";
				}

				var oUnplannedCommon = oSplitDataModel.getObject("/UnplannedCommon");

				oItemTemplate.IsUnplanned = oUnplannedCommon.Material !== "";
				oItemTemplate.Material = oUnplannedCommon.Material !== "" ? oUnplannedCommon.Material : oOrderEntry.Material;
				oItemTemplate.Plant = oUnplannedCommon.Plant !== "" ? oUnplannedCommon.Plant : oOrderEntry.Plant;
				oItemTemplate.ProductionOrder = oOrderEntry.ProductionOrder;
				oItemTemplate.Reservation = oOrderEntry.Reservation;
				oItemTemplate.ReservationItem = oOrderEntry.ReservationItem;
				oItemTemplate.Unit = oOrderEntry.BaseUnit;
				oItemTemplate.Batch = sScanValue;

				var aFilters = [
					new Filter("Material", "EQ", oItemTemplate.Material),
					new Filter("Plant", "EQ", oItemTemplate.Plant),
					new Filter({
						filters: [
							new Filter("Batch", "EQ", sScanValue),
							new Filter("BatchBySupplier", "EQ", sScanValue)
						],
						and: false
					})
				];

				oModel.read("/ZI_MATBATCH_VH", {
					method: "GET",
					filters: aFilters,
					urlParameters: {
						"$expand": "to_WmlStock"
					},
					success: function (oData) {
						var oBatchVH = oData.results.find(() => true);
						if (oBatchVH !== undefined) {
							oItemTemplate.StorageLocation = oBatchVH.StorageLocation;
							oItemTemplate.Batch = oBatchVH.Batch;
							oItemTemplate.SupplierBatch = oBatchVH.BatchBySupplier;
							var fBatchQuantity = parseFloat(oBatchVH.BaseUnitQuantity);
							oItemTemplate.Quantity = fBatchQuantity;
							oItemTemplate.WMLEnabled = oBatchVH.WMLEnabled !== "";
							if (oBatchVH.to_WmlStock && oBatchVH.to_WmlStock.results) {
								var oWmlStockEntry = oBatchVH.to_WmlStock.results.find(() => true);
								if (oWmlStockEntry) {
									oItemTemplate.WMLBin = oWmlStockEntry.StorageBin;
									var fBinQuantity = parseFloat(oWmlStockEntry.Quantity, 10);
									oItemTemplate.Quantity = fBatchQuantity > fBinQuantity ? fBinQuantity : fBatchQuantity;
								}
							}
						}
						aSplitItems.push(oItemTemplate);
						this.updateOpenQuantity(oSplitDataModel);
						oSplitDataModel.updateBindings(true);
					}.bind(this),
					error: function () {
						sap.m.MessageToast.show("Failed to retrieve batch information.");
						oItemTemplate.Batch = sScanValue;
						aSplitItems.push(oItemTemplate);
						oSplitDataModel.updateBindings(true);
					}
				});
				//BOC T_singhag1 14.02.2025
				//++t_singhag1 for strand and road field visibility
			
			var sPath = "/ZC_PROORDC_LST";
			var aFilters = [
				new sap.ui.model.Filter("ProductionOrder", sap.ui.model.FilterOperator.EQ, oOrderEntry.ProductionOrder)
			];
			
			oView.getModel().read(sPath, {
				method: "GET",
				filters: aFilters,
				urlParameters: {
					"$select": "FieldsActive"
				},
				success: function (oData) {
					var oEntry = oData.results.find(() => true); // Get the first entry if available
					if (oEntry !== undefined) {
						// Set FieldsActive based on the value retrieved
						oItemTemplate.FieldsActive = (oEntry.FieldsActive === 'X');
			
						// Continue with any other logic as needed, e.g., adding to a collection
						//aSplitItems.push(oItemTemplate);
						
						oSplitDataModel.updateBindings(true);
						// this.updateOpenQuantity(oSplitDataModel);
						// oSplitDataModel.updateBindings(true);
						// oDialog.open();
					   // return;
					}
					//sap.m.MessageToast.show(this._i18nText("MSG_ORDER_NOT_FOUND"));
				}.bind(this),
				error: function () {
					//sap.m.MessageToast.show(this._i18nText("MSG_ORDER_SRV_ERROR"));
					oItemTemplate.FieldsActive = false;
					//aSplitItems.push(oItemTemplate);
						oSplitDataModel.updateBindings(true);
				}.bind(this)
			});
			//end of adding code  //++t_singhag1 for strand and road field visibility
				//EOC T_singhag1 14.02.2025
			}
		},

		handleAddSplitScanError: function (oEvt) {

		},

		handleAddSplitLiveUpdate: function (oEvt) {

		},

		handleDelSplitButton: function (oEvt) {
			if (oEvt.getSource().getCustomData().length === 0) {
				return;
			}
			var oView = this.oView;
			var oSplitDataModel = oView.getModel("splitData");
			var sIdx = oEvt.getSource().getCustomData()[0].getValue();
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			aSplitItems.splice(aSplitItems.findIndex(item => item.Index === sIdx), 1);
			this.updateOpenQuantity(oSplitDataModel);
			oSplitDataModel.updateBindings(true);
		},

		handleDistributionDialogOk: function (oEvt) {
			var oDialog = oEvt.getSource().getParent();
			var oView = this.oView;
			var oModel = oView.getModel();
			var oSplitDataModel = oView.getModel("splitData");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var sBatchId = (Math.random() * 1e32).toString(36);
			this.createAddDistributionsBatch(oModel, aSplitItems, sBatchId);
			this.submitDistributionsBatch(oDialog, oModel, sBatchId);
		},

		handleDistributionDialogCancel: function (oEvt) {
			var oDialog = oEvt.getSource().getParent();
			oDialog.close();
		},

		handleDistributionDialogClose: function (oEvt) {
			var oView = this.oView;
			var oSplitDataModel = oView.getModel("splitData");
			var oUnplannedCommon = oSplitDataModel.getObject("/UnplannedCommon");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var oNewSplitCommon = oSplitDataModel.getObject("/NewSplitCommon");

			oNewSplitCommon.Quantity = 0;
			oNewSplitCommon.Batch = "";
			aSplitItems.splice(0, aSplitItems.length);
			oUnplannedCommon.Material = "";
			oUnplannedCommon.MaterialBatchManaged = false;
			oUnplannedCommon.Plant = "";
			oUnplannedCommon.Quantity = 0;
			oUnplannedCommon.Unit = "";
			oSplitDataModel.updateBindings(true);
		},

		handleItemMessagesDialogClose: function (oEvt) {
			var oDialog = oEvt.getSource().getParent();
			oDialog.close();
		},

		handleStockTypeChange: function (oEvt) {
			if (oEvt.getSource().getCustomData().length === 0) {
				return;
			}
			var sStockType = oEvt.getSource().getSelectedKey();
			var oView = this.oView;
			var oSplitDataModel = oView.getModel("splitData");
			var sIdx = oEvt.getSource().getCustomData()[0].getValue();
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var oSplitItem = aSplitItems.findIndex(item => item.Index === sIdx);
			if (oSplitItem) {
				oSplitItem.StockType = sStockType;
				oSplitDataModel.updateBindings(true);
			}
			console.log(oSplitItem);
		},

		onStorageLocationValueHelpRequest: function (oEvt) {
			if (oEvt.getSource().getCustomData().length === 0) {
				return;
			}
			var oView = this.oView;
			var sIdx = oEvt.getSource().getCustomData()[0].getValue();
			var oSplitDataModel = oView.getModel("splitData");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var oSplitItem = aSplitItems.find(item => item.Index === sIdx);
			var sTitle = "Desired Value";
			var oDialog = new ValueHelpDialog({
				// modal : true,
				supportRangesOnly: false,
				supportMultiselect: false,
				title: sTitle,
				supportRanges: false,
				key: "StorageLocation",
				keys: ["Plant"],
				descriptionKey: "StorageLocationName",
				ok: jQuery.proxy(this.onStorageLocationValueHelpResultSelect, this),
				cancel: function () {
					this.close();
				},
				afterClose: function () {
					this.setModel(null);
				},
				beforeOpen: function () {
					this.oSelectionTitle.setText(sTitle);
				}
			});

			var aCols = [];
			aCols.push({
				label: "Storage Location",
				tooltip: "Storage Location",
				template: "StorageLocation",
				type: "string"
			});
			aCols.push({
				label: "Storage Location Name",
				tooltip: "Storage Location Name",
				template: "StorageLocationName",
				type: "string"
			});

			oDialog.setModel(this.getView().getModel());
			oDialog.setModel(new JSONModel({
				cols: aCols
			}), "columns");

			oDialog.data("sSplitItemIdx", sIdx);

			var aFilters = [
				new Filter("Plant", "EQ", oSplitItem.Plant)
			];

			oDialog.setTokens([]);
			oDialog.getTableAsync().then(function (oTable) {
				oTable.setBusy(true);
				if (oTable.bindRows) {
					oTable.bindAggregation("rows", {
						path: "/C_ProdStorageLocationVH",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("StorageLocation"),
						events: {
							dataReceived: jQuery.proxy(function (oEvt1) {
								oTable.setBusy(false);
								var oBinding = oEvt1.getSource(),
									iBindingLength;
								if (oBinding && this && this.isOpen()) {
									iBindingLength = oBinding.getLength();
									if (iBindingLength) {
										this.update();
									}
								}
							}, oDialog)
						}
					});
				}

				if (oTable.bindItems) {
					var oTemplate = new sap.m.ColumnListItem({
						cells: [
							new sap.m.Text({
								text: "{StorageLocation}"
							}),
							new sap.m.Text({
								text: "{StorageLocationName}"
							})
						]
					});
					oTable.bindAggregation("items", {
						path: "/C_ProdStorageLocationVH",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("StorageLocation"),
						events: {
							dataReceived: jQuery.proxy(function (oEvt1) {
								oTable.setBusy(false);
								var oBinding = oEvt1.getSource(),
									iBindingLength;
								if (oBinding && this && this.isOpen()) {
									iBindingLength = oBinding.getLength();
									if (iBindingLength) {
										this.update();
									}
								}
							}, oDialog)
						},
						template: oTemplate,
						templateShareable: false
					});
				}
			});
			oDialog.open();
		},

		onStorageLocationValueHelpResultSelect: function (oEvt) {
			var aTokens = oEvt.getParameter("tokens");
			if (aTokens) {
				var oToken = aTokens.find(() => true);
				if (oToken && oToken.getProperty("key")) {
					var oDialog = oEvt.getSource();
					var oView = this.oView;
					var oModel = oView.getModel();
					var oSplitDataModel = oView.getModel("splitData");
					var sIdx = oDialog.data("sSplitItemIdx") + "";
					var oSplitItem = oSplitDataModel.getObject("/NewSplitItems").find(item => item.Index === sIdx);
					if (oSplitItem) {
						oSplitItem.StorageLocation = oToken.getProperty("key");

						var aFilters = [
							new Filter("Plant", "EQ", oSplitItem.Plant),
							new Filter("StorageLocation", "EQ", oSplitItem.StorageLocation)
						];

						oModel.read("/ZC_WML_STLOC", {
							method: "GET",
							filters: aFilters,
							success: function (oData) {
								var oStorageLocation = oData.results.find(() => true);
								oSplitItem.Batch = "";
								oSplitItem.SupplierBatch = "";
								oSplitItem.WMLBin = "";
								oSplitItem.WMLEnabled = oStorageLocation !== undefined && ( oStorageLocation.WMLEnabled === "X" || oStorageLocation.WMLEnabled === true );
								oSplitItem.SalesOrder = "";
								oSplitItem.SalesOrderItem = "";
								oSplitItem.SalesOrderVisible = oSplitItem.SalesOrder !== "";

								oSplitItem.Quantity = oSplitItem.AutoQuantity ? 0 : oSplitItem.Quantity;
								oSplitDataModel.updateBindings(true);
							},
							error: function () {
								sap.m.MessageToast.show("Failed to retrieve storage location information all options are enabled.");
								oSplitItem.Batch = "";
								oSplitItem.SupplierBatch = "";
								oSplitItem.WMLBin = "";
								oSplitItem.WMLEnabled = true;
								oSplitItem.SalesOrder = "";
								oSplitItem.SalesOrderItem = "";
								oSplitItem.SalesOrderVisible = true;
								oSplitItem.Quantity = oSplitItem.AutoQuantity ? 0 : oSplitItem.Quantity;
								oSplitDataModel.updateBindings(true);
							}
						});
					}
					oDialog.close();
				}
			}
		},

		onBatchValueHelpRequest: function (oEvt) {
			if (oEvt.getSource().getCustomData().length === 0) {
				return;
			}
			var oView = this.oView;
			var sIdx = oEvt.getSource().getCustomData()[0].getValue();
			var oSplitDataModel = oView.getModel("splitData");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var oSplitItem = aSplitItems.find(item => item.Index === sIdx);
			var sTitle = "Desired Value";

			var oDialog = new ValueHelpDialog({
				// modal : true,
				supportRangesOnly: false,
				supportMultiselect: false,
				title: sTitle,
				supportRanges: false,
				key: "Batch",
				keys: ["Material", "Plant"],
				descriptionKey: "Batch",
				ok: jQuery.proxy(this.onBatchValueHelpResultSelect, this),
				cancel: function () {
					this.close();
				},
				afterClose: function () {
					this.setModel(null);
				},
				beforeOpen: function () {
					this.oSelectionTitle.setText(sTitle);
				}
			});

			var aCols = [];
			aCols.push({
				label: "Batch",
				tooltip: "Batch",
				template: "Batch",
				type: "string"
			});
			aCols.push({
				label: "Supplier Batch",
				tooltip: "Supplier Batch",
				template: "BatchBySupplier",
				type: "string"
			});
			aCols.push({
				label: "Storage Location",
				tooltip: "Storage Location",
				template: "StorageLocation",
				type: "string"
			});
			aCols.push({
				label: "Quantity",
				tooltip: "Quantity",
				template: "BaseUnitQuantity",
				type: "string"
			});
			aCols.push({
				label: "Unit",
				tooltip: "Unit",
				template: "BaseUnit",
				type: "string"
			});

			oDialog.setModel(this.getView().getModel());
			oDialog.setModel(new JSONModel({
				cols: aCols
			}), "columns");

			oDialog.data("sSplitItemIdx", sIdx);

			var aFilters = [
				new Filter({
					path: "Material",
					operator: "EQ",
					value1: oSplitItem.Material,
					and: true
				}),
				new Filter({
					path: "Plant",
					operator: "EQ",
					value1: oSplitItem.Plant,
					and: true
				}),
				new Filter({
					path: "AlternativeUnit",
					operator: "EQ",
					value1: oSplitItem.Unit,
					and: true
				})
			];

			// aSplitItems.forEach(item => {
			// 	if (item.Batch && item.Batch !== "") {
			// 		aFilters.push(new Filter({ path : "Batch", operator : "NE", value1 : item.Batch, and : true }));
			// 	}
			// });

			oDialog.setTokens([]);
			oDialog.getTableAsync().then(function (oTable) {
				oTable.setBusy(true);
				if (oTable.bindRows) {
					oTable.bindAggregation("rows", {
						path: "/ZI_MATBATCH_VH",
						filters: aFilters,
						parameters: {
							expand: "to_WmlStock"
						},
						sorter: new sap.ui.model.Sorter("Batch"),
						events: {
							dataReceived: jQuery.proxy(function (oEvt1) {
								oTable.setBusy(false);
								var oBinding = oEvt1.getSource(),
									iBindingLength;
								if (oBinding && this && this.isOpen()) {
									iBindingLength = oBinding.getLength();
									if (iBindingLength) {
										this.update();
									}
								}
							}, oDialog)
						}
					});
				}

				if (oTable.bindItems) {
					var oTemplate = new sap.m.ColumnListItem({
						cells: [
							new sap.m.Text({
								text: "{Batch}"
							}),
							new sap.m.Text({
								text: "{BatchBySupplier}"
							}),
							new sap.m.Text({
								text: "{StorageLocation}"
							}),
							new sap.m.Text({
								text: "{BaseUnitQuantity}"
							}),
							new sap.m.Text({
								text: "{BaseUnit}"
							})
						]
					});
					oTable.bindAggregation("items", {
						path: "/ZI_MATBATCH_VH",
						filters: aFilters,
						parameters: {
							expand: "to_WmlStock"
						},
						sorter: new sap.ui.model.Sorter("Batch"),
						events: {
							dataReceived: jQuery.proxy(function (oEvt1) {
								oTable.setBusy(false);
								var oBinding = oEvt1.getSource(),
									iBindingLength;
								if (oBinding && this && this.isOpen()) {
									iBindingLength = oBinding.getLength();
									if (iBindingLength) {
										this.update();
									}
								}
							}, oDialog)
						},
						template: oTemplate,
						templateShareable: false
					});
				}
			});
			oDialog.open();
		},

		onBatchValueHelpResultSelect: function (oEvt) {
			var aTokens = oEvt.getParameter("tokens");
			if (aTokens === undefined || !aTokens) {
				return;
			}
			var oToken = aTokens.find(() => true);
			if (oToken && oToken.getProperty("key")) {
				var oDialog = oEvt.getSource();
				var oView = this.oView;
				var oModel = oView.getModel();
				var oSplitDataModel = oView.getModel("splitData");
				var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
				var sIdx = oDialog.data("sSplitItemIdx") + "";
				var oSplitItem = aSplitItems.find(item => item.Index === sIdx);
				if (oSplitItem) {
					oDialog.getTableAsync().then(function (oTable) {
						var oSelectedContext;

						if (oTable.getSelectedIndex) {
							oSelectedContext = oTable.getContextByIndex(oTable.getSelectedIndex());
						}
						if (!oSelectedContext && oTable.getSelectedContexts) {
							oSelectedContext = oTable.getSelectedContexts().find(() => true);
						}
						if (!oSelectedContext) {
							oDialog.close();
							return;
						}

						var oBatch = oSelectedContext.getObject();
						oSplitItem.StorageLocation = oBatch.StorageLocation;
						oSplitItem.Batch = oBatch.Batch;
						oSplitItem.SupplierBatch = oBatch.BatchBySupplier;
						var fBatchQuantity = parseFloat(oBatch.BaseUnitQuantity);
						oSplitItem.Quantity = oBatch.BaseUnitQuantity;
						oSplitItem.SpecialStock = oBatch.SpecialStock;
						oSplitItem.WMLEnabled = oBatch.WMLEnabled !== "";

						if (oBatch.to_WmlStock && oBatch.to_WmlStock.__list) {
							var oWmlStockEntryKey = oBatch.to_WmlStock.__list.find(() => true);
							var oWmlStockEntry = oModel.getObject("/" + oWmlStockEntryKey);
							if (oWmlStockEntry) {
								oSplitItem.WMLBin = oWmlStockEntry.StorageBin;
								oSplitItem.SalesOrder = oWmlStockEntry.SalesOrder;
								oSplitItem.SalesOrderItem = oWmlStockEntry.SalesOrderItem;
								oSplitItem.SalesOrderVisible = oSplitItem.SalesOrder !== "";
								var fBinQuantity = parseFloat(oWmlStockEntry.Quantity, 10);

								var fItemQuantity = (fBatchQuantity > fBinQuantity) ? fBinQuantity : fBatchQuantity;
								oSplitItem.Quantity = oSplitItem.AutoQuantity ? fItemQuantity : oSplitItem.Quantity;
								oSplitItem.Quantity = !oSplitItem.AutoQuantity && oSplitItem.Quantity > fItemQuantity ? fItemQuantity : oSplitItem.Quantity;
							}

							this.updateOpenQuantity(oSplitDataModel);
							oSplitDataModel.updateBindings(true);
						}
						oDialog.close();
					}.bind(this));
				}
			}
		},

		onSupplierBatchValueHelpRequest: function (oEvt) {
			if (oEvt.getSource().getCustomData().length === 0) {
				return;
			}
			var oView = this.oView;
			var sIdx = oEvt.getSource().getCustomData()[0].getValue();
			var oSplitDataModel = oView.getModel("splitData");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var oSplitItem = aSplitItems.find(item => item.Index === sIdx);
			var sTitle = "Desired Value";

			var oDialog = new ValueHelpDialog({
				// modal : true,
				supportRangesOnly: false,
				supportMultiselect: false,
				title: sTitle,
				supportRanges: false,
				key: "BatchBySupplier",
				keys: ["Material", "Plant"],
				descriptionKey: "BatchBySupplier",
				ok: jQuery.proxy(this.onSupplierBatchValueHelpResultSelect, this),
				cancel: function () {
					this.close();
				},
				afterClose: function () {
					this.setModel(null);
				},
				beforeOpen: function () {
					this.oSelectionTitle.setText(sTitle);
				}
			});

			var aCols = [];
			aCols.push({
				label: "Supplier Batch",
				tooltip: "Supplier Batch",
				template: "BatchBySupplier",
				type: "string"
			});
			aCols.push({
				label: "Batch",
				tooltip: "Batch",
				template: "Batch",
				type: "string"
			});
			aCols.push({
				label: "Storage Location",
				tooltip: "Storage Location",
				template: "StorageLocation",
				type: "string"
			});
			aCols.push({
				label: "Quantity",
				tooltip: "Quantity",
				template: "BaseUnitQuantity",
				type: "string"
			});
			aCols.push({
				label: "Unit",
				tooltip: "Unit",
				template: "BaseUnit",
				type: "string"
			});

			oDialog.setModel(this.getView().getModel());
			oDialog.setModel(new JSONModel({
				cols: aCols
			}), "columns");

			oDialog.data("sSplitItemIdx", sIdx);

			var aFilters = [
				new Filter({
					path: "Material",
					operator: "EQ",
					value1: oSplitItem.Material,
					and: true
				}),
				new Filter({
					path: "Plant",
					operator: "EQ",
					value1: oSplitItem.Plant,
					and: true
				}),
				new Filter({
					path: "AlternativeUnit",
					operator: "EQ",
					value1: oSplitItem.Unit,
					and: true
				}),
				new Filter({
					path: "BatchBySupplier",
					operator: "NE",
					value1: "",
					and: true
				}),
			];

			// aSplitItems.forEach(item => {
			// 	if (item.Batch && item.Batch !== "") {
			// 		aFilters.push(new Filter({ path : "Batch", operator : "NE", value1 : item.Batch, and : true }));
			// 	}
			// });

			oDialog.setTokens([]);
			oDialog.getTableAsync().then(function (oTable) {
				oTable.setBusy(true);
				if (oTable.bindRows) {
					oTable.bindAggregation("rows", {
						path: "/ZI_MATBATCH_VH",
						filters: aFilters,
						parameters: {
							expand: "to_WmlStock"
						},
						sorter: new sap.ui.model.Sorter("BatchBySupplier"),
						events: {
							dataReceived: jQuery.proxy(function (oEvt1) {
								oTable.setBusy(false);
								var oBinding = oEvt1.getSource(),
									iBindingLength;
								if (oBinding && this && this.isOpen()) {
									iBindingLength = oBinding.getLength();
									if (iBindingLength) {
										this.update();
									}
								}
							}, oDialog)
						}
					});
				}

				if (oTable.bindItems) {
					var oTemplate = new sap.m.ColumnListItem({
						cells: [
							new sap.m.Text({
								text: "{BatchBySupplier}"
							}),
							new sap.m.Text({
								text: "{Batch}"
							}),
							new sap.m.Text({
								text: "{StorageLocation}"
							}),
							new sap.m.Text({
								text: "{BaseUnitQuantity}"
							}),
							new sap.m.Text({
								text: "{BaseUnit}"
							})
						]
					});
					oTable.bindAggregation("items", {
						path: "/ZI_MATBATCH_VH",
						filters: aFilters,
						parameters: {
							expand: "to_WmlStock"
						},
						sorter: new sap.ui.model.Sorter("Batch"),
						events: {
							dataReceived: jQuery.proxy(function (oEvt1) {
								oTable.setBusy(false);
								var oBinding = oEvt1.getSource(),
									iBindingLength;
								if (oBinding && this && this.isOpen()) {
									iBindingLength = oBinding.getLength();
									if (iBindingLength) {
										this.update();
									}
								}
							}, oDialog)
						},
						template: oTemplate,
						templateShareable: false
					});
				}
			});

			oDialog.open();
		},

		onSupplierBatchValueHelpResultSelect: function (oEvt) {
			var aTokens = oEvt.getParameter("tokens");
			if (aTokens === undefined || !aTokens) {
				return;
			}
			var oToken = aTokens.find(() => true);
			if (oToken && oToken.getProperty("key")) {
				var oDialog = oEvt.getSource();
				var oView = this.oView;
				var oModel = oView.getModel();
				var oSplitDataModel = oView.getModel("splitData");
				var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
				var sIdx = oDialog.data("sSplitItemIdx") + "";
				var oSplitItem = aSplitItems.find(item => item.Index === sIdx);
				if (oSplitItem) {
					oDialog.getTableAsync().then(function (oTable) {
						var oSelectedContext;

						if (oTable.getSelectedIndex) {
							oSelectedContext = oTable.getContextByIndex(oTable.getSelectedIndex());
						}
						if (!oSelectedContext && oTable.getSelectedContexts) {
							oSelectedContext = oTable.getSelectedContexts().find(() => true);
						}
						if (!oSelectedContext) {
							oDialog.close();
							return;
						}

						var oBatch = oSelectedContext.getObject();
						oSplitItem.StorageLocation = oBatch.StorageLocation;
						oSplitItem.Batch = oBatch.Batch;
						oSplitItem.SupplierBatch = oBatch.BatchBySupplier;
						var fBatchQuantity = parseFloat(oBatch.BaseUnitQuantity);
						oSplitItem.Quantity = oBatch.BaseUnitQuantity;
						oSplitItem.SpecialStock = oBatch.SpecialStock;
						oSplitItem.WMLEnabled = oBatch.WMLEnabled !== "";

						if (oBatch.to_WmlStock && oBatch.to_WmlStock.__list) {
							var oWmlStockEntryKey = oBatch.to_WmlStock.__list.find(() => true);
							var oWmlStockEntry = oModel.getObject("/" + oWmlStockEntryKey);
							if (oWmlStockEntry) {
								oSplitItem.WMLBin = oWmlStockEntry.StorageBin;
								oSplitItem.SalesOrder = oWmlStockEntry.SalesOrder;
								oSplitItem.SalesOrderItem = oWmlStockEntry.SalesOrderItem;
								oSplitItem.SalesOrderVisible = oSplitItem.SalesOrder !== "";
								var fBinQuantity = parseFloat(oWmlStockEntry.Quantity, 10);

								var fItemQuantity = (fBatchQuantity > fBinQuantity) ? fBinQuantity : fBatchQuantity;
								oSplitItem.Quantity = oSplitItem.AutoQuantity ? fItemQuantity : oSplitItem.Quantity;
								oSplitItem.Quantity = !oSplitItem.AutoQuantity && oSplitItem.Quantity > fItemQuantity ? fItemQuantity : oSplitItem.Quantity;
							}

							this.updateOpenQuantity(oSplitDataModel);
							oSplitDataModel.updateBindings(true);
						}
						oDialog.close();
					}.bind(this));
				}
			}
		},

		onWMLBinValueHelpRequest: function (oEvt) {
			if (oEvt.getSource().getCustomData().length === 0) {
				return;
			}
			var oView = this.oView;
			var sIdx = oEvt.getSource().getCustomData()[0].getValue();
			var oSplitDataModel = oView.getModel("splitData");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var oSplitItem = aSplitItems.find(item => item.Index === sIdx);
			var sTitle = "Desired Value";
			var oDialog = new ValueHelpDialog({
				// modal : true,
				supportRangesOnly: false,
				supportMultiselect: false,
				title: sTitle,
				supportRanges: false,
				key: "StorageBin",
				keys: ["StorageBin"],
				descriptionKey: "StorageBin",
				ok: jQuery.proxy(this.onWMLBinValueHelpResultSelect, this),
				cancel: function () {
					this.close();
				},
				afterClose: function () {
					this.setModel(null);
				},
				beforeOpen: function () {
					this.oSelectionTitle.setText(sTitle);
				}
			});

			var aCols = [];
			aCols.push({
				label: "Bin",
				tooltip: "Bin",
				template: "StorageBin",
				type: "string"
			});
			aCols.push({
				label: "Batch",
				tooltip: "Batch",
				template: "Batch",
				type: "number"
			});
			aCols.push({
				label: "Storage Location",
				tooltip: "Storage Location",
				template: "StorageLocation",
				type: "string"
			});
			aCols.push({
				label: "Quantity",
				tooltip: "Quantity",
				template: "Quantity",
				type: "number"
			});
			aCols.push({
				label: "Unit",
				tooltip: "Unit",
				template: "UnitMeasure",
				type: "string"
			});

			oDialog.data("sSplitItemIdx", sIdx);

			oDialog.setModel(this.getView().getModel());
			oDialog.setModel(new JSONModel({
				cols: aCols
			}), "columns");

			var aFilters = [
				new Filter({
					path: "Material",
					operator: "EQ",
					value1: oSplitItem.Material,
					and: true
				}),
				new Filter({
					path: "Plant",
					operator: "EQ",
					value1: oSplitItem.Plant,
					and: true
				}),
				new Filter({
					path: "Quantity",
					operator: "GT",
					value1: 0,
					and: true
				}),
				new Filter({
					path: "UnitMeasure",
					operator: "NE",
					value1: "",
					and: true
				}),
				new Filter({
					path: "StockType",
					operator: "EQ",
					value1: "01",
					and: true
				})
			];

			oDialog.setTokens([]);
			oDialog.getTableAsync().then(function (oTable) {
				oTable.setBusy(true);
				if (oTable.bindRows) {
					oTable.bindAggregation("rows", {
						path: "/ZI_WMLSTOCK",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("Batch"),
						events: {
							dataReceived: jQuery.proxy(function (oEvt1) {
								oTable.setBusy(false);
								var oBinding = oEvt1.getSource(),
									iBindingLength;
								if (oBinding && this && this.isOpen()) {
									iBindingLength = oBinding.getLength();
									if (iBindingLength) {
										this.update();
									}
								}
							}, oDialog)
						}
					});
				}

				if (oTable.bindItems) {
					var oTemplate = new sap.m.ColumnListItem({
						cells: [
							new sap.m.Text({
								text: "{StorageBin}"
							}),
							new sap.m.Text({
								text: "{Batch}"
							}),
							new sap.m.Text({
								text: "{StorageLocation}"
							}),
							new sap.m.Text({
								text: "{Quantity}"
							}),
							new sap.m.Text({
								text: "{UnitMeasure}"
							})
						]
					});
					oTable.bindAggregation("items", {
						path: "/ZI_WMLSTOCK",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("Batch"),
						events: {
							dataReceived: jQuery.proxy(function (oEvt1) {
								oTable.setBusy(false);
								var oBinding = oEvt1.getSource(),
									iBindingLength;
								if (oBinding && this && this.isOpen()) {
									iBindingLength = oBinding.getLength();
									if (iBindingLength) {
										this.update();
									}
								}
							}, oDialog)
						},
						template: oTemplate,
						templateShareable: false
					});
				}
			});
			oDialog.open();
		},

		onWMLBinValueHelpResultSelect: function (oEvt) {
			var aTokens = oEvt.getParameter("tokens");
			if (aTokens) {
				var oToken = aTokens.find(() => true);
				if (oToken && oToken.getProperty("key")) {
					var oDialog = oEvt.getSource();
					var oView = this.oView;
					var oModel = oView.getModel();
					var oSplitDataModel = oView.getModel("splitData");
					var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
					var sIdx = oDialog.data("sSplitItemIdx") + "";
					var oSplitItem = aSplitItems.find(item => item.Index === sIdx);
					if (oSplitItem) {
						oDialog.getTableAsync().then(function (oTable) {
							var oSelectedContext;

							if (oTable.getSelectedIndex) {
								oSelectedContext = oTable.getContextByIndex(oTable.getSelectedIndex());
							}
							if (!oSelectedContext && oTable.getSelectedContexts) {
								oSelectedContext = oTable.getSelectedContexts().find(() => true);
							}
							if (!oSelectedContext) {
								oDialog.close();
								return;
							}
							var oWMLStockEntry = oSelectedContext.getObject();
							oSplitItem.WMLBin = oWMLStockEntry.StorageBin;
							oSplitItem.StorageLocation = oWMLStockEntry.StorageLocation;
							oSplitItem.Batch = oWMLStockEntry.Batch;
							oSplitItem.SupplierBatch = oWMLStockEntry.BatchBySupplier;
							oSplitItem.SalesOrder = oWMLStockEntry.SalesOrder;
							oSplitItem.SalesOrderItem = oWMLStockEntry.SalesOrderItem;
							oSplitItem.SalesOrderVisible = oSplitItem.SalesOrder !== "";

							var aFilters = [
								new Filter("Material", "EQ", oSplitItem.Material),
								new Filter("Batch", "EQ", oSplitItem.Batch)
							];

							oModel.read("/ZI_MATBATCH_VH", {
								method: "GET",
								filters: aFilters,
								success: function (oData) {
									var oBatchVH = oData.results.find(() => true);
									if (oBatchVH !== undefined) {
										var fBatchQuantity = parseFloat(oBatchVH.BaseUnitQuantity, 10);
										var fBinQuantity = parseFloat(oWMLStockEntry.Quantity, 10);
										var fItemQuantity = (fBatchQuantity > fBinQuantity) ? fBinQuantity : fBatchQuantity;
										oSplitItem.Quantity = oSplitItem.AutoQuantity ? fItemQuantity : oSplitItem.Quantity;
										oSplitItem.Quantity = !oSplitItem.AutoQuantity && oSplitItem.Quantity > fItemQuantity ? fItemQuantity : oSplitItem.Quantity;
									} else {
										// this should not happen
										oSplitItem.Quantity = 0;
									}
									this.updateOpenQuantity(oSplitDataModel);
									oSplitDataModel.updateBindings(true);
									oDialog.close();
								}.bind(this),
								error: function () {
									// this should not happen unless server connection errors
									sap.m.MessageToast.show("Quantity set to zero due to failure to get batch information.");
									oSplitItem.Quantity = 0;
									this.updateOpenQuantity(oSplitDataModel);
									oSplitDataModel.updateBindings(true);
									oDialog.close();
								}.bind(this)
							});
						}.bind(this));
					}
				}
			}
		},

		onPlantValueHelpRequest: function (oEvt) {
			var oDialog = this._oPlantValueHelpDialog;
			var aCols = [];
			aCols.push({
				label: "Plant",
				tooltip: "Plant",
				template: "Plant",
				type: "string"
			});
			aCols.push({
				label: "Plant Name",
				tooltip: "Plant Name",
				template: "PlantName",
				type: "string"
			});

			oDialog.setModel(this.getView().getModel());
			oDialog.setModel(new JSONModel({
				cols: aCols
			}), "columns");

			var aFilters = [];

			var oTable = oDialog.getTable();
			oTable.setBusy(true);
			oTable.bindRows({
				path: "/C_MM_PlantBasicValueHelp",
				filters: aFilters,
				// parameters: oEv.getSource().getParameters(),
				sorter: new sap.ui.model.Sorter("Plant"),
				events: {
					dataReceived: jQuery.proxy(function (oEvt1) {
						oTable.setBusy(false);
						var oBinding = oEvt1.getSource(),
							iBindingLength;
						if (oBinding && this && this.isOpen()) {
							iBindingLength = oBinding.getLength();
							if (iBindingLength) {
								this.update();
							}
						}
					}, oDialog)
				}
			});
			oDialog.setTokens([]);
			oDialog.update();
			oDialog.open();
		},

		onPlantValueHelpResultSelect: function (oEvt) {
			var aTokens = oEvt.getParameter("tokens");
			if (aTokens) {
				var oToken = aTokens.find(() => true);
				if (oToken && oToken.getProperty("key")) {
					var oDialog = this._oPlantValueHelpDialog;
					var oView = this.oView;
					var oSplitDataModel = oView.getModel("splitData");
					var oUnplannedCommon = oSplitDataModel.getObject("/UnplannedCommon");
					oUnplannedCommon.Plant = oToken.getProperty("key");
					oSplitDataModel.updateBindings(true);
					oDialog.close();
				}
			}
		},

		onMaterialValueHelpRequest: function (oEvt) {
			var sTitle = "Select desired value.";

			var oDialog = new ValueHelpDialog({
				// modal : true,
				supportRangesOnly: false,
				supportMultiselect: false,
				title: sTitle,
				supportRanges: false,
				key: "Material",
				//keys: ["MaterialBaseUnit"],
				descriptionKey: "Material_Text",
				ok: jQuery.proxy(this.onMaterialValueHelpResultSelect, this),
				cancel: function () {
					this.close();
				},
				afterClose: function () {
					this.setModel(null);
					this.destroy();
				},
				beforeOpen: function () {
					this.oSelectionTitle.setText(sTitle);
				}
			});
			var oSmartFilterBarConfig = new sap.ui.comp.smartfilterbar.ControlConfiguration({});
			var smartFilterBarConfiguration = {
				entityType: "F_Mmim_I_Material_VhType", //"C_MaterialvhType",
				basicSearchFieldName: "Material",
				enableBasicSearch: true,
				advancedMode: true,
				expandAdvancedArea: false,
				search: jQuery.proxy(this.onMaterialValueHelpSearch, this),
				controlConfiguration: oSmartFilterBarConfig,
				customData: [
					new sap.ui.core.CustomData({
						key: "dateFormatSettings",
						value: {
							"UTC": true
						}
					}),
					new sap.ui.core.CustomData({
						key: "parentDialog",
						value: oDialog
					})
				],
				filterChange: function () {
					oDialog.getTable().setShowOverlay(true);
				}.bind(this)
			};

			var oSmartFilterBar = new sap.ui.comp.smartfilterbar.SmartFilterBar(smartFilterBarConfiguration);
			oSmartFilterBar.setModel(this.oModel);
			oDialog.setFilterBar(oSmartFilterBar);

			var aCols = [];
			aCols.push({
				label: "Material",
				tooltip: "Material",
				template: "Material",
				type: "string"
			});
			aCols.push({
				label: "Material Name",
				tooltip: "Material Name",
				template: "Material_Text",
				type: "string"
			});

			oDialog.setModel(this.getView().getModel());
			oDialog.setModel(new JSONModel({
				cols: aCols
			}), "columns");

			var aFilters = [];
			oDialog.setTokens([]);
			oDialog.getTableAsync().then(function (oTable) {
				oTable.setBusy(true);
				if (oTable.bindRows) {
					oTable.bindAggregation("rows", {
						path: "/ZC_FMMIMMat_Vh",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("Material"),
						events: {
							dataReceived: jQuery.proxy(function (oEvt1) {
								oTable.setBusy(false);
								oDialog.update();
								var oBinding = oEvt1.getSource(),
									iBindingLength;
								if (oBinding && this && this.isOpen()) {
									iBindingLength = oBinding.getLength();
									if (iBindingLength) {
										this.update();
									}
								}
							}, oDialog)
						}
					});
				}

				if (oTable.bindItems) {
					var oTemplate = new sap.m.ColumnListItem({
						cells: [
							new sap.m.Text({
								text: "{Material}"
							}),
							new sap.m.Text({
								text: "{Material_Text}"
							})
						]
					});
					oTable.bindAggregation("items", {
						path: "/ZC_FMMIMMat_Vh",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("Material"),
						events: {
							dataReceived: jQuery.proxy(function (oEvt1) {
								oTable.setBusy(false);
								oDialog.update();
								var oBinding = oEvt1.getSource(),
									iBindingLength;
								if (oBinding && this && this.isOpen()) {
									iBindingLength = oBinding.getLength();
									if (iBindingLength) {
										this.update();
									}
								}
							}, oDialog)
						},
						template: oTemplate,
						templateShareable: false
					});
				}
			});

			oDialog.open();

		},

		onMaterialValueHelpResultSelect: function (oEvt) {
			var aTokens = oEvt.getParameter("tokens");
			if (aTokens) {
				var oToken = aTokens.find(() => true);
				if (oToken && oToken.getProperty("key")) {
					var oDialog = oEvt.getSource();
					var oView = this.oView;
					var oSplitDataModel = oView.getModel("splitData");
					var oUnplannedCommon = oSplitDataModel.getObject("/UnplannedCommon");

					oDialog.getTableAsync().then(function (oTable) {
						var oSelectedContext;

						if (oTable.getSelectedIndex) {
							oSelectedContext = oTable.getContextByIndex(oTable.getSelectedIndex());
						}
						if (!oSelectedContext && oTable.getSelectedContexts) {
							oSelectedContext = oTable.getSelectedContexts().find(() => true);
						}
						if (!oSelectedContext) {
							oDialog.close();
							return;
						}
						var oMaterial = oSelectedContext.getObject();
						var sMaterialBaseUnit = oMaterial.MaterialBaseUnit;
						var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
						oUnplannedCommon.Material = oMaterial.Material;
						oUnplannedCommon.Unit = sMaterialBaseUnit;
						oUnplannedCommon.MaterialBatchManaged = oMaterial.IsBatchManagementRequired;
						aSplitItems.forEach(oSplitItem => {
							if (oSplitItem.Material !== oMaterial.Material) {
								oSplitItem.Material = oMaterial.Material;
								oSplitItem.StorageLocation = "";
								oSplitItem.Unit = sMaterialBaseUnit;
								oSplitItem.Batch = "";
								oSplitItem.SupplierBatch = "";
								oSplitItem.WMLBin = "";
								oSplitItem.WMLEnabled = false;
							}
						});
						oSplitDataModel.updateBindings(true);
						oDialog.close();
					});
				}
			}
		},

		onMaterialValueHelpSearch: function (oEvt) {
			var oDialog = oEvt.getSource().getCustomData()[1].getValue();
			var aFilters = oEvt.getSource().getFilters();
			var sValue = oEvt.getSource().getBasicSearchValue();

			aFilters.push(
				new Filter({
					filters: [
						new Filter("Material", "Contains", sValue),
						new Filter("Material_Text", "Contains", sValue)
					],
					and: false
				})
			);

			oDialog.getTableAsync().then(function (oTable) {
				oTable.setShowOverlay(false);
				oTable.setBusy(true);
				if (oTable.bindRows) {
					oTable.bindAggregation("rows", {
						path: "/ZC_FMMIMMat_Vh",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("Material"),
						events: {
							dataReceived: jQuery.proxy(function (oEvt1) {
								oTable.setBusy(false);
								oDialog.update();
								var oBinding = oEvt1.getSource(),
									iBindingLength;
								if (oBinding && this && this.isOpen()) {
									iBindingLength = oBinding.getLength();
									if (iBindingLength) {
										this.update();
									}
								}
							}, oDialog)
						}
					});
				}

				if (oTable.bindItems) {
					var oTemplate = new sap.m.ColumnListItem({
						cells: [
							new sap.m.Text({
								text: "{Material}"
							}),
							new sap.m.Text({
								text: "{Material_Text}"
							})
						]
					});
					oTable.bindAggregation("items", {
						path: "/ZC_FMMIMMat_Vh",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("Material"),
						events: {
							dataReceived: jQuery.proxy(function (oEvt1) {
								oTable.setBusy(false);
								oDialog.update();
								var oBinding = oEvt1.getSource(),
									iBindingLength;
								if (oBinding && this && this.isOpen()) {
									iBindingLength = oBinding.getLength();
									if (iBindingLength) {
										this.update();
									}
								}
							}, oDialog)
						},
						template: oTemplate,
						templateShareable: false
					});
				}
			});
		},

		handlePlantChange: function (oEvt) {
			var oView = this.oView;
			var oSplitDataModel = oView.getModel("splitData");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var sPlant = oEvt.getParameter("value");
			aSplitItems.forEach(oSplitItem => {
				if (oSplitItem.Plant !== sPlant) {
					oSplitItem.Plant = sPlant;
				}
			});
		},

		handleUnplannedMaterialChange: function (oEvt) {
			var oView = this.oView;
			var oModel = oView.getModel();
			var oSplitDataModel = oView.getModel("splitData");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var oUnplannedCommon = oSplitDataModel.getObject("/UnplannedCommon");

			var sMaterial = oEvt.getParameter("value");
			var aFilters = [
				new Filter({
					path: "Material",
					operator: "EQ",
					value1: sMaterial,
					and: true
				}),
				new Filter({
					path: "Plant",
					operator: "EQ",
					value1: oUnplannedCommon.Plant,
					and: true
				})
			];

			oModel.read("/ZC_FMMIMMat_Vh", {
				method: "GET",
				filters: aFilters,
				success: function (oData) {
					var oMaterial = oData.results.find(() => true);
					if (oMaterial !== undefined) {
						var sMaterialBaseUnit = oMaterial.MaterialBaseUnit;
						oUnplannedCommon.Material = oMaterial.Material;
						oUnplannedCommon.Unit = sMaterialBaseUnit;
						oUnplannedCommon.MaterialBatchManaged = oMaterial.IsBatchManagementRequired;
						aSplitItems.forEach(oSplitItem => {
							if (oSplitItem.Material !== oMaterial.Material) {
								oSplitItem.Material = oMaterial.Material;
								oSplitItem.StorageLocation = "";
								oSplitItem.Unit = sMaterialBaseUnit;
								oSplitItem.Batch = "";
								oSplitItem.SupplierBatch = "";
								oSplitItem.WMLBin = "";
								oSplitItem.WMLEnabled = false;
							}
						});
						oSplitDataModel.updateBindings(true);
					}
					oSplitDataModel.updateBindings(true);
				},
				error: function () {
					sap.m.MessageToast.show("Failed to retrieve material information.");
					oSplitDataModel.updateBindings(true);
				}
			});
		},

		handleSplitQuantityChange: function (oEvt) {
			if (oEvt.getSource().getCustomData().length === 0) {
				return;
			}

			var sValue = oEvt.getParameter("value");
			if (sValue === "") {
				return;
			}

			var oBindingContext = oEvt.getSource().getBindingContext();
			var oOrderEntry = oBindingContext.getObject();

			var sIdx = oEvt.getSource().getCustomData()[0].getValue();
			var oView = this.oView;
			var oSplitDataModel = oView.getModel("splitData");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var oSplitItem = aSplitItems.find(item => item.Index === sIdx);
			var fTotal = 0;
			aSplitItems.forEach(item => {
				fTotal += parseFloat(item.Quantity, 10);
			});

			var fItemQuantity = parseFloat(oSplitItem.Quantity, 10);
			var oNewSplitCommon = oSplitDataModel.getObject("/NewSplitCommon");

			var fOpenQuantity = parseFloat(oNewSplitCommon.OrderOpenedQuantity, 10);

			// if(fTotal > fOpenQuantity)  {
			// 	fTotal -= fItemQuantity;
			// 	fItemQuantity = fOpenQuantity - fTotal;
			// 	fTotal = fOpenQuantity;
			// }
			//oNewSplitCommon.Quantity = fTotal;

			fOpenQuantity -= fTotal;
			oNewSplitCommon.Quantity = fOpenQuantity;

			// var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
			// 	"groupingEnabled": true,
			// 	"groupingSize": 3,
			// 	"decimals": 3
			// });

			oSplitItem.Quantity = fItemQuantity;
			oSplitItem.AutoQuantity = fItemQuantity === 0;

			oSplitDataModel.updateBindings(true);
		},

		handleUnplannedQuantityChange: function (oEvt) {
			if (oEvt.getSource().getCustomData().length === 0) {
				return;
			}
			var sValue = oEvt.getParameter("value");
			if (sValue === "") {
				return;
			}
			var sIdx = oEvt.getSource().getCustomData()[0].getValue();
			var oView = this.oView;
			var oSplitDataModel = oView.getModel("splitData");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var oSplitItem = aSplitItems.find(item => item.Index === sIdx);
			var fTotal = 0;
			aSplitItems.forEach(item => {
				fTotal += parseFloat(item.Quantity, 10);
			});

			var oUnplannedCommon = oSplitDataModel.getObject("/UnplannedCommon");

			var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				"groupingEnabled": true,
				"groupingSize": 3,
				"decimals": 3
			});

			var fValue = oFormat.parse(sValue);
			oSplitItem.Quantity = fValue;
			oSplitItem.AutoQuantity = fValue === 0;

			oUnplannedCommon.Quantity = fTotal;
			oSplitDataModel.updateBindings(true);
		},

		handleBatchChange: function (oEvt) {
			if (oEvt.getSource().getCustomData().length === 0) {
				return;
			}
			var sIdx = oEvt.getSource().getCustomData()[0].getValue();
			var oView = this.oView;
			var oModel = oView.getModel();
			var oSplitDataModel = oView.getModel("splitData");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var oSplitItem = aSplitItems.find(item => item.Index === sIdx);

			var aFilters = [
				new Filter("Material", "EQ", oSplitItem.Material),
				new Filter("Batch", "EQ", oSplitItem.Batch)
			];

			if (oSplitItem.StorageLocation !== "") {
				aFilters.push(new Filter("StorageLocation", "EQ", oSplitItem.StorageLocation));
			}

			oModel.read("/ZI_MATBATCH_VH", {
				method: "GET",
				filters: aFilters,
				urlParameters: {
					"$expand": "to_WmlStock"
				},
				success: function (oData) {
					var oBatchVH = oData.results.find(() => true);
					if (oBatchVH !== undefined) {
						oSplitItem.StorageLocation = oBatchVH.StorageLocation;
						oSplitItem.Batch = oBatchVH.Batch;
						oSplitItem.SupplierBatch = oBatchVH.BatchBySupplier;
						var fBatchQuantity = parseFloat(oBatchVH.BaseUnitQuantity);
						oSplitItem.Quantity = fBatchQuantity;
						oSplitItem.WMLEnabled = oBatchVH.WMLEnabled !== "";
						if (oBatchVH.to_WmlStock && oBatchVH.to_WmlStock.results) {
							var oWmlStockEntry = oBatchVH.to_WmlStock.results.find(() => true);
							if (oWmlStockEntry) {
								oSplitItem.WMLBin = oWmlStockEntry.StorageBin;
								var fBinQuantity = parseFloat(oWmlStockEntry.Quantity, 10);
								oSplitItem.Quantity = fBatchQuantity > fBinQuantity && oSplitItem.AutoQuantity ? fBinQuantity : fBatchQuantity;
							}
						}
					}
					this.updateOpenQuantity(oSplitDataModel);
					oSplitDataModel.updateBindings(true);
				}.bind(this),
				error: function () {
					sap.m.MessageToast.show(this._i18nText("MSG_BATCH_SRV_ERROR"));
					oSplitItem.StorageLocation = "";
					oSplitItem.Batch = "";
					oSplitItem.SupplierBatch = "";
					oSplitItem.WMLBin = "";
					oSplitItem.Quantity = 0;
					oSplitDataModel.updateBindings(true);
				}.bind(this)
			});
		},

		handleSupplierBatchChange: function (oEvt) {
			if (oEvt.getSource().getCustomData().length === 0) {
				return;
			}
			var sIdx = oEvt.getSource().getCustomData()[0].getValue();
			var oView = this.oView;
			var oModel = oView.getModel();
			var oSplitDataModel = oView.getModel("splitData");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var oSplitItem = aSplitItems.find(item => item.Index === sIdx);

			var aFilters = [
				new Filter("Material", "EQ", oSplitItem.Material),
				new Filter("BatchBySupplier", "EQ", oSplitItem.SupplierBatch)
			];

			if (oSplitItem.StorageLocation !== "") {
				aFilters.push(new Filter("StorageLocation", "EQ", oSplitItem.StorageLocation));
			}

			oModel.read("/ZI_MATBATCH_VH", {
				method: "GET",
				filters: aFilters,
				urlParameters: {
					"$expand": "to_WmlStock"
				},
				success: function (oData) {
					var oBatchVH = oData.results.find(() => true);
					if (oBatchVH !== undefined) {
						oSplitItem.StorageLocation = oBatchVH.StorageLocation;
						oSplitItem.Batch = oBatchVH.Batch;
						oSplitItem.SupplierBatch = oBatchVH.BatchBySupplier;
						var fBatchQuantity = parseFloat(oBatchVH.BaseUnitQuantity);
						oSplitItem.Quantity = fBatchQuantity;
						oSplitItem.WMLEnabled = oBatchVH.WMLEnabled !== "";
						if (oBatchVH.to_WmlStock && oBatchVH.to_WmlStock.results) {
							var oWmlStockEntry = oBatchVH.to_WmlStock.results.find(() => true);
							if (oWmlStockEntry) {
								oSplitItem.WMLBin = oWmlStockEntry.StorageBin;
								var fBinQuantity = parseFloat(oWmlStockEntry.Quantity, 10);
								oSplitItem.Quantity = fBatchQuantity > fBinQuantity && oSplitItem.AutoQuantity ? fBinQuantity : fBatchQuantity;
							}
						}
					}
					this.updateOpenQuantity(oSplitDataModel);
					oSplitDataModel.updateBindings(true);
				}.bind(this),
				error: function () {
					sap.m.MessageToast.show(this._i18nText("MSG_BATCH_SRV_ERROR"));
					oSplitItem.StorageLocation = "";
					oSplitItem.Batch = "";
					oSplitItem.SupplierBatch = "";
					oSplitItem.WMLBin = "";
					oSplitItem.Quantity = 0;
					oSplitDataModel.updateBindings(true);
				}.bind(this)
			});
		},

		handleStorageLocationChange: function (oEvt) {
			if (oEvt.getSource().getCustomData().length === 0) {
				return;
			}
			var sIdx = oEvt.getSource().getCustomData()[0].getValue();
			var oView = this.oView;
			var oModel = oView.getModel();
			var oSplitDataModel = oView.getModel("splitData");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var oSplitItem = aSplitItems.find(item => item.Index === sIdx);

			var aFilters = [
				new Filter("Plant", "EQ", oSplitItem.Plant),
				new Filter("StorageLocation", "EQ", oSplitItem.StorageLocation)
			];

			oModel.read("/ZC_WML_STLOC", {
				method: "GET",
				filters: aFilters,
				success: function (oData) {
					var oStorageLocation = oData.results.find(() => true);
					oSplitItem.Batch = "";
					oSplitItem.SupplierBatch = "";
					oSplitItem.WMLBin = "";
					oSplitItem.WMLEnabled = oStorageLocation !== undefined && ( oStorageLocation.WMLEnabled === "X" || oStorageLocation.WMLEnabled === true );
					oSplitItem.SalesOrder = "";
					oSplitItem.SalesOrderItem = "";
					oSplitItem.SalesOrderVisible = oSplitItem.SalesOrder !== "";

					oSplitItem.Quantity = oSplitItem.AutoQuantity ? 0 : oSplitItem.Quantity;
					oSplitDataModel.updateBindings(true);
				},
				error: function () {
					sap.m.MessageToast.show("Failed to retrieve storage location information all options are enabled.");
					oSplitItem.Batch = "";
					oSplitItem.SupplierBatch = "";
					oSplitItem.WMLBin = "";
					oSplitItem.WMLEnabled = true;
					oSplitItem.SalesOrder = "";
					oSplitItem.SalesOrderItem = "";
					oSplitItem.SalesOrderVisible = true;
					oSplitItem.Quantity = oSplitItem.AutoQuantity ? 0 : oSplitItem.Quantity;
					oSplitDataModel.updateBindings(true);
				}
			});
		},

		handleBinChange: function (oEvt) {
			if (oEvt.getSource().getCustomData().length === 0) {
				return;
			}
			var sIdx = oEvt.getSource().getCustomData()[0].getValue();
			var oView = this.oView;
			var oModel = oView.getModel();
			var oSplitDataModel = oView.getModel("splitData");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var oSplitItem = aSplitItems.find(item => item.Index === sIdx);

			var aFilters = [
				new Filter("Material", "EQ", oSplitItem.Material),
				new Filter("Plant", "EQ", oSplitItem.Plant),
				new Filter("StorageLocation", "EQ", oSplitItem.StorageLocation),
				new Filter("StorageBin", "EQ", oSplitItem.WMLBin),
				new Filter("Quantity", "GT", 0)
			];

			oModel.read("/ZI_WMLSTOCK", {
				method: "GET",
				filters: aFilters,
				success: function (oData) {
					var oWMLStockEntry = oData.results.find((oItem) => oItem.Quantity > 0);
					oSplitItem.StorageLocation = oWMLStockEntry.StorageLocation;
					oSplitItem.Batch = oWMLStockEntry.Batch;
					oSplitItem.SupplierBatch = oWMLStockEntry.BatchBySupplier;
					oSplitItem.WMLBin = oWMLStockEntry.StorageBin;
					oSplitItem.SalesOrder = oWMLStockEntry.SalesOrder;
					oSplitItem.SalesOrderItem = oWMLStockEntry.SalesOrderItem;
					oSplitItem.SalesOrderVisible = oSplitItem.SalesOrder !== "";

					var aFilters1 = [
						new Filter("Material", "EQ", oSplitItem.Material),
						new Filter("Batch", "EQ", oSplitItem.Batch)
					];

					oModel.read("/ZI_MATBATCH_VH", {
						method: "GET",
						filters: aFilters1,
						urlParameters: {
							"$expand": "to_WmlStock"
						},
						success: function (oData1) {
							var oBatchVH = oData.results.find(() => true);
							if (oBatchVH !== undefined) {
								var fBatchQuantity = parseFloat(oBatchVH.Quantity, 10);
								var fBinQuantity = parseFloat(oWMLStockEntry.Quantity, 10);
								var fItemQuantity = (fBatchQuantity > fBinQuantity) ? fBinQuantity : fBatchQuantity;
								oSplitItem.Quantity = oSplitItem.AutoQuantity ? fItemQuantity : oSplitItem.Quantity;
								oSplitItem.Quantity = !oSplitItem.AutoQuantity && oSplitItem.Quantity > fItemQuantity ? fItemQuantity : oSplitItem.Quantity;
							} else {
								// this should not happen
								oSplitItem.Quantity = 0;
							}
							this.updateOpenQuantity(oSplitDataModel);
							oSplitDataModel.updateBindings(true);
						}.bind(this),
						error: function () {
							// this should not happen unless server connection errors
							sap.m.MessageToast.show("Quantity set to zero due to failure to get batch information.");
							oSplitItem.Quantity = 0;
							this.updateOpenQuantity(oSplitDataModel);
							oSplitDataModel.updateBindings(true);
						}
					});
				}.bind(this),
				error: function () {
					sap.m.MessageToast.show("Failed to retrieve batch information.");
					oSplitItem.StorageLocation = "";
					oSplitItem.Batch = "";
					oSplitItem.WMLBin = "";
					oSplitItem.Quantity = 0;
					oSplitDataModel.updateBindings(true);
				}
			});
		},

		updateOpenQuantity: function (oSplitDataModel) {
			var oUnplannedCommon = oSplitDataModel.getObject("/UnplannedCommon");
			var oNewSplitCommon = oSplitDataModel.getObject("/NewSplitCommon");
			var aSplitItems = oSplitDataModel.getObject("/NewSplitItems");
			var fTotal = 0;
			if (oUnplannedCommon.Material && oUnplannedCommon.Material !== "") {
				aSplitItems.forEach(item => {
					fTotal += parseFloat(item.Quantity, 10);
				});
				oUnplannedCommon.Quantity = fTotal;
			} else {
				fTotal = 0;
				aSplitItems.forEach(item => {
					fTotal += parseFloat(item.Quantity, 10);
				});
				var fOpenQuantity = parseFloat(oNewSplitCommon.OrderOpenedQuantity, 10);
				fOpenQuantity -= fTotal;
				oNewSplitCommon.Quantity = fOpenQuantity;
			}
		},

		createAddDistributionsBatch: function (oModel, aAddDistributionItems, sBatchGroup) {
			var sPath = "/AddDistribution";
			var sMethod = "POST";
			debugger;
			if (aAddDistributionItems.length > 0) {
				oModel.setDeferredGroups([sBatchGroup]);
				jQuery.each(aAddDistributionItems, function (i, oItem) {
					if (oItem.Unsaved) {
						var oUrlParams = {
							"Batch": oItem.Batch,
							"Index": oItem.Index,
							"ProductionOrder": oItem.ProductionOrder,
							"Quantity": oItem.Quantity,
							"Reservation": oItem.IsUnplanned === false ? oItem.Reservation : "",
							"ReservationItem": oItem.IsUnplanned === false ? oItem.ReservationItem : "",
							"StockType": oItem.StockType,
							"SpecialStock": oItem.SpecialStock,
							"StorageLocation": oItem.StorageLocation,
							"UnitOfMeasure": oItem.Unit,
							"Material": oItem.Material,
							"Plant": oItem.Plant,
							"SalesOrder": oItem.SalesOrder,
							"SalesOrderItem": oItem.SalesOrderItem,
							"WMLBin": oItem.WMLBin !== "" ? oItem.WMLBin : "",
							"Strand": oItem.Strand !== undefined ? oItem.Strand : "na",	//oItem.Strand,		//++tsinghag1
							"Road" : oItem.Road !== undefined ? oItem.Road : "na"		//oItem.Road			//++tsinghag1
						};
						//sap.ui.core.BusyIndicator.show(0);
						oModel.callFunction(sPath, {
							method: sMethod,
							urlParameters: oUrlParams,
							batchGroupId: sBatchGroup,
							changeSetId: sBatchGroup
						});
					}
				});
			}
		},
		//++T_singhag1 GAP 82a
		onLiveChangeCheck: function(oEvent) {
			var oInput = oEvent.getSource();
			var sValue = oInput.getValue();
		
			if (sValue.length > 2) {
				// Clear the field and show an error message
				oInput.setValue("");
				sap.m.MessageToast.show("Maximum 2 characters allowed!");
			}
		},
		//++T_singhag1 GAP 82a
		submitDistributionsBatch: function (oDialog, oModel, sBatchGroup) {
			var that = this;
			var oView = this.oView;
			var oSplitDataModel = oView.getModel("splitData");
			var fnError = function (oError) {
				//sap.ui.core.BusyIndicator.hide();
				   //++T_singhag1 GAP 82a
				  
				var sErrorMessage = "An error occurred, Please try again!";

				try {
					var oResponse = JSON.parse(oError.responseText);
					if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
						sErrorMessage = oResponse.error.message.value;
					}
				} catch (e) {
					console.error("Failed to parse error response", e);
				}

				sap.m.MessageBox.error(sErrorMessage);
				   //++T_singhag1 GAP 82a
				//console.log(oError);
				oModel.setRefreshAfterChange(true);
			};

			var fnSuccess = function (oData) {
				var bRefresh = false;
				 //++T_singhag1 GAP 82a
				if (oData.__batchResponses && oData.__batchResponses.length > 0) {
					if(e.__batchResponses[0].response !== undefined){
					if(oData.__batchResponses[0].response.statusCode === '400'){
						var msg = JSON.parse(oData.__batchResponses[0].response.body).error.message.value;
						sap.m.MessageBox.error(msg);
						return;
					}	
					}	
				}
				 //++T_singhag1 GAP 82a
				if (oData.__batchResponses && oData.__batchResponses.length > 0) {
					oData.__batchResponses.forEach(oBatchResponse => {
						if (oBatchResponse.__changeResponses && oBatchResponse.__changeResponses.length > 0) {
							oBatchResponse.__changeResponses.forEach(oChangeResponse => {
								if (oChangeResponse.data) {
									var oAddDistributionResp = oChangeResponse.data.AddDistribution;
									var oSplitItem = oSplitDataModel.getObject("/NewSplitItems").find(item => item.Index === oAddDistributionResp.Index +
										"");
									bRefresh = true;

									if (oAddDistributionResp.ErrorCode === 0) {
										oSplitItem.Editable = false;
										oSplitItem.Unsaved = false;
										oSplitItem.SplitStatus = "Success";
										oSplitItem.SplitStatusIcon = "sap-icon://sys-enter-2";
										var sMsg = "Distribution success";
										sMsg += oAddDistributionResp.MaterialDocument !== undefined ? " - Material document " + oAddDistributionResp.MaterialDocument + "/" + oAddDistributionResp.DocumentYear : "";
										sMsg += ".";
										oSplitItem.SplitStatusTooltip = sMsg;
									} else {
										oSplitItem.Editable = oAddDistributionResp.ErrorType === "E";
										oSplitItem.Unsaved = oSplitItem.Editable;
										oSplitItem.SplitStatus = "Error";
										oSplitItem.SplitStatusIcon = "sap-icon://error";
										oSplitItem.SplitStatusTooltip = oAddDistributionResp.ErrorMessage;
									}
								}
							});
						}
					});

				}
				if (bRefresh) {
					oSplitDataModel.updateBindings(true);
					oModel.refresh(true);
				}
			};

			oModel.setRefreshAfterChange(false);

			/*submit batch*/
			oModel.submitChanges({
				batchGroupId: sBatchGroup,
				success: jQuery.proxy(fnSuccess, this),
				error: jQuery.proxy(fnError, this)
			});
		},

		_i18nText: function (sProp) {
			if (!this.getView()) {
				return sProp;
			}
			var oI18NModel = this.getView().getModel("i18n");
			if (arguments.length > 1) {
				var sText = oI18NModel.getProperty(arguments[0]);
				if (sText) {
					for (var i = 1; i < arguments.length; ++i) {
						sText = sText.replace("{" + i + "}", arguments[i]);
					}
				}
				return sText;
			} else {
				return oI18NModel.getProperty(sProp);
			}
		}
	});
});