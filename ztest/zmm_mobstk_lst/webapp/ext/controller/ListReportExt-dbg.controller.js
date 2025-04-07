sap.ui.define(["sap/m/ColumnListItem", "sap/m/Label", "sap/ui/model/Filter", "sap/m/MessageToast", "sap/m/MessageBox",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog", "sap/ui/model/json/JSONModel"
], function (ColumnListItem, Label, Filter, MessageToast, MessageBox,
	ValueHelpDialog, JSONModel) {
	return sap.ui.controller("ZMM.zmm_mobstock_lst.ext.controller.ListReportExt", {
		onInit: function () {
			var oView = this.getView();

			var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
			var oComponentData = sap.ui.component(sComponentId).getComponentData();

			var bEnableTransfers = false;

			if (oComponentData && oComponentData.startupParameters && oComponentData.startupParameters.EnableTransfers) {
				bEnableTransfers = oComponentData.startupParameters.EnableTransfers[0];
			} else {
				bEnableTransfers = jQuery.sap.getUriParameters().get("EnableTransfers");
			}

			this._oTransfersModel = this._initFrontEndModel(oView);

			if (!this._oTransferDialog) { //Distribution item values
				this._oTransferDialog = sap.ui.xmlfragment({
					fragmentName: "ZMM.zmm_mobstock_lst.ext.fragment.TransferDialog",
					type: "XML",
					id: "ZMM.zmm_mobstock_lst.ext.TransferDialog"
				}, this);
				this._oTransferDialog.setModel(oView.getModel());
				oView.addDependent(this._oTransferDialog);
			}
		},

		_initFrontEndModel: function (oView) {
			var oTransfersModel = new sap.ui.model.json.JSONModel({
				"NewTransfer": this._getEmptyTransfer()
			});
			oView.setModel(oTransfersModel, "Transfers");
			return oTransfersModel;
		},

		_getEmptyTransfer: function () {
			return {
				TransferType: "",
				Material: "",
				Plant: "",
				StorageLocation: "",
				Batch: "",
				BatchManaged: "",
				SupplierBatch: "",
				SpecialStock: "",
				StockType: "",
				StockTypeText: "",
				AvailableQuantity: "",
				AvailableQuantityUnit: "",
				Quantity: "",
				Unit: "",
				WMLBin: "",
				SalesOrder: "",
				SalesOrderItem: "",
				Vendor: "",
				DstStorageLocation: "",
				DstStorageLocationEditable: true,
				DstWMLBin: "",
				DstSalesOrderVisible: false,
				DstSalesOrder: "",
				DstSalesOrderItem: "",
				DstVendor: "",
				ValidTransfer: false,
				TransferTypeState: sap.ui.core.ValueState.Error,
				TransferTypeStateText: null,
				QuantityState: sap.ui.core.ValueState.Error,
				QuantityStateText: null,
				DstStorageLocationState: null,
				DstStorageLocationStateText: null,
				DstSalesOrderState: null,
				DstSalesOrderStateText: null,
				DstVendorState: null,
				DstVendorStateText: null,
				WMLBinVisible: false,
				DstWMLBinVisible: false,
				DstStorageBinState: null,
				DstStorageBinStateText: null,
				StorageBinState: null,
				StorageBinStateText: null,
				StorageLocationWMLEnabled: false
			};
		},

		_initNewTransfer: function (oTransfersModel, oStockEntry) {
			var oNewTransfer = oTransfersModel.getObject("/NewTransfer");

			var fAutoQ = 0.0;

			if (oStockEntry) {
				fAutoQ = parseFloat(oStockEntry.Quantity);
				if (isNaN(fAutoQ)) {
					fAutoQ = 0.0;
				}
			}

			var sQuantity = sap.ui.core.format.NumberFormat.getFloatInstance().format(fAutoQ);

			oNewTransfer.TransferType = "";
			oNewTransfer.Material = oStockEntry ? oStockEntry.Material : "";
			oNewTransfer.Plant = oStockEntry ? oStockEntry.Plant : "";
			oNewTransfer.StorageLocation = oStockEntry ? oStockEntry.StorageLocation : "";
			oNewTransfer.Batch = oStockEntry ? oStockEntry.Batch : "";
			oNewTransfer.BatchManaged = oStockEntry ? oStockEntry.BatchManaged : false;
			oNewTransfer.SupplierBatch = oStockEntry ? oStockEntry.BatchBySupplier : "";
			oNewTransfer.StockType = oStockEntry ? oStockEntry.InventoryStockType : "";
			oNewTransfer.StockTypeText = oStockEntry ? oStockEntry.InventoryStockTypeText : "";
			oNewTransfer.SpecialStock = oStockEntry ? oStockEntry.InventorySpecialStockType : "";
			oNewTransfer.AvailableQuantity = sap.ui.core.format.NumberFormat.getFloatInstance().parse(sQuantity);
			oNewTransfer.AvailableQuantityUnit = oStockEntry ? oStockEntry.Unit : "";
			oNewTransfer.Quantity = sQuantity;
			oNewTransfer.Unit = oStockEntry ? oStockEntry.Unit : "";
			oNewTransfer.WMLBin = this._getStockEntryWMLBin(oStockEntry);
			oNewTransfer.SalesOrder = this._getStockEntrySalesOrder(oStockEntry);
			oNewTransfer.SalesOrderItem = this._getStockEntrySalesOrderItem(oStockEntry);
			oNewTransfer.Vendor = this._getStockEntryVendor(oStockEntry);
			oNewTransfer.DstStorageLocation = "";
			oNewTransfer.DstStorageLocationEditable = true;
			oNewTransfer.DstWMLBin = "";
			oNewTransfer.DstSalesOrder = "";
			oNewTransfer.DstSalesOrderItem = "";
			oNewTransfer.DstVendor = "";
			oNewTransfer.ValidTransfer = false;
			oNewTransfer.TransferTypeState = sap.ui.core.ValueState.Error;
			oNewTransfer.TransferTypeStateText = "";
			oNewTransfer.QuantityState = sap.ui.core.ValueState.Information;
			oNewTransfer.QuantityStateText = "Quantity is maximum.";
			oNewTransfer.DstStorageLocationState = null;
			oNewTransfer.DstSalesOrderVisible = false;
			oNewTransfer.DstVendorVisible = false;
			oNewTransfer.DstSalesOrderState = null;
			oNewTransfer.DstSalesOrderStateText = null;
			oNewTransfer.DstVendorState = null;
			oNewTransfer.DstVendorStateText = null;
			oNewTransfer.WMLBinVisible = false;
			oNewTransfer.DstWMLBinVisible = false;
			oNewTransfer.StorageLocationWMLEnabled = oStockEntry ? oStockEntry.StorageLocationWMLEnabled === "X" : false;

			oTransfersModel.updateBindings(true);
			return oNewTransfer;
		},

		_getStockEntrySalesOrder: function (oStockEntry) {
			if (oStockEntry) {
				if (oStockEntry.InventorySpecialStockType !== "E") {
					return "";
				}

				var aStockSegment = oStockEntry.StockSegment.split("/");
				if (aStockSegment.length === 0) {
					return "";
				}
				return aStockSegment[0].trim();
			}
			return "";
		},

		_getStockEntrySalesOrderItem: function (oStockEntry) {
			if (oStockEntry) {
				if (oStockEntry.InventorySpecialStockType !== "E") {
					return "";
				}

				var aStockSegment = oStockEntry.StockSegment.split("/");
				if (aStockSegment.length === 0) {
					return "";
				}
				return aStockSegment[1].trim();
			}
			return "";
		},
		
		_getStockEntryVendor: function(oStockEntry) {
			if (oStockEntry) {
				if (oStockEntry.InventorySpecialStockType !== "K") {
					return "";
				}
				return oStockEntry.StockSegment;
			}
			return "";
		},

		_getStockEntryWMLBin: function (oStockEntry) {
			if (oStockEntry && oStockEntry.DefaultWMLBin) {
				return oStockEntry.DefaultWMLBin;
			}
			return "";
		},

		onStorageLocationValueHelpRequest: function (oEvt) {
			var oTransfersModel = this.getView().getModel("Transfers");
			var oNewTransfer = oTransfersModel.getObject("/NewTransfer");
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
				ok: jQuery.proxy(this._oStorageLocationValueHelpResultSelect, this),
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

			var aFilters = [
				new Filter("Plant", "EQ", oNewTransfer.Plant)
			];

			oDialog.setTokens([]);
			oDialog.getTableAsync().then(function (oTable) {
				oTable.setBusy(true);
				if (oTable.bindRows) {
					oTable.bindAggregation("rows", {
						path: "/ZC_STLOC_WWML",
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
						path: "/ZC_STLOC_WWML",
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

		_oStorageLocationValueHelpResultSelect: function (oEvt) {
			var oDialog = oEvt.getSource();
			var oTransfersModel = this.getView().getModel("Transfers");
			var oNewTransfer = oTransfersModel.getObject("/NewTransfer");
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
				var oStorageLocation = oSelectedContext.getObject();
				oNewTransfer.DstStorageLocation = oStorageLocation.StorageLocation ? oStorageLocation.StorageLocation : "";
				oNewTransfer.DstWMLBinVisible = oStorageLocation.WMLEnabled && oStorageLocation.WMLEnabled === "X" ? true : false;
				oNewTransfer.DstWMLBin = "";
				this._validateNewTransfer(oTransfersModel);
				oTransfersModel.updateBindings(true);
				oDialog.close();
			}.bind(this));
		},

		onUoMValueHelpRequest: function (oEvt) {
			var oTransfersModel = this.getView().getModel("Transfers");
			var oNewTransfer = oTransfersModel.getObject("/NewTransfer");
			var sTitle = "Desired Value";

			var oDialog = new ValueHelpDialog({
				// modal : true,
				supportRangesOnly: false,
				supportMultiselect: false,
				title: sTitle,
				supportRanges: false,
				key: "UnitOfMeasure",
				keys: ["Material"],
				descriptionKey: "UnitOfMeasureName",
				ok: jQuery.proxy(this._oUoMValueHelpResultSelect, this),
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
				label: "Unit Of Measure",
				tooltip: "Unit Of Measure",
				template: "UnitOfMeasure",
				type: "string"
			});
			aCols.push({
				label: "Unit Of Measure Name",
				tooltip: "Unit Of Measure Name",
				template: "UnitOfMeasureName",
				type: "string"
			});

			oDialog.setModel(this.getView().getModel());
			oDialog.setModel(new JSONModel({
				cols: aCols
			}), "columns");

			var aFilters = [
				new Filter("Material", "EQ", oNewTransfer.Material),
				new Filter("UnitOfMeasure", "NE", oNewTransfer.Unit)
			];

			oDialog.setTokens([]);
			oDialog.getTableAsync().then(function (oTable) {
				oTable.setBusy(true);
				if (oTable.bindRows) {
					oTable.bindAggregation("rows", {
						path: "/ZC_MATUOM_VH",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("UnitOfMeasure"),
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
								text: "{UnitOfMeasure}"
							}),
							new sap.m.Text({
								text: "{UnitOfMeasureName}"
							})
						]
					});
					oTable.bindAggregation("items", {
						path: "/ZC_MATUOM_VH",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("UnitOfMeasure"),
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

			// var oTable = oDialog.getTable();
			// oTable.setBusy(true);
			// oTable.bindRows({
			// 	path: "/ZC_MATUOM_VH",
			// 	filters: aFilters,
			// 	// parameters: oEv.getSource().getParameters(),
			// 	sorter: new sap.ui.model.Sorter("UnitOfMeasure"),
			// 	events: {
			// 		dataReceived: jQuery.proxy(function (oEvt1) {
			// 			oTable.setBusy(false);
			// 			var oBinding = oEvt1.getSource(),
			// 				iBindingLength;
			// 			if (oBinding && this && this.isOpen()) {
			// 				iBindingLength = oBinding.getLength();
			// 				if (iBindingLength) {
			// 					this.update();
			// 				}
			// 			}
			// 		}, oDialog)
			// 	}
			// });
			// oDialog.setTokens([]);
			// oDialog.update();
			oDialog.open();
		},

		onWmlBinValueHelpRequest: function (oEvt) {
			var oTransfersModel = this.getView().getModel("Transfers");
			var oNewTransfer = oTransfersModel.getObject("/NewTransfer");
			var oValueBinding = oEvt.getSource().getBinding("value");
			var sValueBindingPath = oValueBinding.getPath();

			var sTitle = "Desired Value";
			var oDialog = new ValueHelpDialog({
				// modal : true,
				supportRangesOnly: false,
				supportMultiselect: false,
				title: sTitle,
				supportRanges: false,
				key: "StorageBin",
				keys: ["Plant", "StorageLocation"],
				descriptionKey: "StorageLocation",
				ok: jQuery.proxy(this._oWmlBinValueHelpResultSelect, this),
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

			oDialog.data("sInputPath", sValueBindingPath);

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
				type: "string"
			});
			aCols.push({
				label: "Quantity",
				tooltip: "Quantity",
				template: "AlternativeUnitQuantity",
				//template: { path:"AlternativeUnitQuantity", type:"sap.ui.model.type.Float", formatOptions : {maxFractionDigits:3, minFractionDigits:3, maxIntegerDigits:10, minIntegerDigits:1} },
				//				template: function(sId, oContext) { console.log(sId); },
				type: "number"
			});
			aCols.push({
				label: "Unit of Measure",
				tooltip: "Unit of Measure",
				template: "AlternativeUnit",
				type: "string"
			});
			// aCols.push({
			// 	label: "Stock Type",
			// 	tooltip: "Stock Type",
			// 	template: "StockType",
			// 	type: "string"
			// });

			oDialog.setModel(this.getView().getModel());

			var aFilters = [
				new Filter("Material", "EQ", oNewTransfer.Material),
				new Filter("Plant", "EQ", oNewTransfer.Plant),
				new Filter("AlternativeUnit", "EQ", oNewTransfer.Unit)
			];

			if (oNewTransfer.Batch !== "") {
				aFilters.push(new Filter("Batch", "EQ", oNewTransfer.Batch));
			}

			if (oNewTransfer.StorageLocation !== "") {
				aFilters.push(new Filter("StorageLocation", "EQ", oNewTransfer.StorageLocation));
			}

			if (oNewTransfer.TransferType === "343") {
				aFilters.push(new Filter("StockType", "EQ", "07"));
			}

			if (oNewTransfer.TransferType === "344") {
				aFilters.push(new Filter("StockType", "EQ", "01"));
			}

			if (oNewTransfer.TransferType === "311") {
				aFilters.push(new Filter("StockType", "EQ", oNewTransfer.StockType));
			}

			if (oNewTransfer.SpecialStock === "E") {
				aFilters.push(new Filter("SalesOrder", "EQ", oNewTransfer.SalesOrder));
				aFilters.push(new Filter("SalesOrderItem", "EQ", oNewTransfer.SalesOrderItem));
			} else {
				aFilters.push(new Filter("SalesOrder", "EQ", ""));
			}

			oDialog.setTokens([]);

			oDialog.getTableAsync().then(function (oTable) {
				oTable.setBusy(true);
				oTable.setModel(new JSONModel({
					cols: aCols
				}), "columns");
				if (oTable.bindRows) {
					oTable.removeColumn(2);
					oTable.insertColumn(new sap.ui.table.Column({
						label: new sap.m.Label({
							text: "Quantity"
						}),
						template: new sap.m.Text({
							text: "{ path:'AlternativeUnitQuantity', type:'sap.ui.model.type.Float', formatOptions : {maxFractionDigits:3, minFractionDigits:3, maxIntegerDigits:10, minIntegerDigits:1} }"
						})
					}), 2);
					oTable.bindAggregation("rows", {
						path: "/ZC_WMLNZSTKAU",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("StorageBin"),
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
								text: "{path:'AlternativeUnitQuantity', type:'sap.ui.model.type.Float', formatOptions : { maxFractionDigits:3, minFractionDigits:3, maxIntegerDigits:10, minIntegerDigits:1, groupingEnabled:true}}"
							}),
							new sap.m.Text({
								text: "{AlternativeUnit}"
							})
						]
					});
					oTable.bindAggregation("items", {
						path: "/ZC_WMLNZSTKAU",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("StorageBin"),
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

			// oDialog.getTableAsync().then(function (oTable) {
			// 	oTable.setBusy(true);
			// 	oTable.bindRows({
			// 		path: "/ZC_WMLSTO_VH",
			// 		filters: aFilters,
			// 		// parameters: oEv.getSource().getParameters(),
			// 		sorter: new sap.ui.model.Sorter("StorageBin"),
			// 		events: {
			// 			dataReceived: jQuery.proxy(function (oEvt1) {
			// 				oTable.setBusy(false);
			// 				var oBinding = oEvt1.getSource(),
			// 					iBindingLength;
			// 				if (oBinding && this && this.isOpen()) {
			// 					iBindingLength = oBinding.getLength();
			// 					if (iBindingLength) {
			// 						this.update();
			// 					}
			// 				}
			// 			}, oDialog)
			// 		}
			// 	});
			// });
			oDialog.open();
		},

		onDstWmlBinValueHelpRequest: function (oEvt) {
			var oTransfersModel = this.getView().getModel("Transfers");
			var oNewTransfer = oTransfersModel.getObject("/NewTransfer");

			var oValueBinding = oEvt.getSource().getBinding("value");
			var sValueBindingPath = oValueBinding.getPath();

			var sTitle = "Desired Value";
			var oDialog = new ValueHelpDialog({
				// modal : true,
				supportRangesOnly: false,
				supportMultiselect: false,
				title: sTitle,
				supportRanges: false,
				key: "StorageBin",
				keys: ["Plant", "StorageLocation"],
				descriptionKey: "StorageLocation",
				ok: jQuery.proxy(this._oWmlBinValueHelpResultSelect, this),
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

			oDialog.data("sInputPath", sValueBindingPath);

			var aCols = [];
			aCols.push({
				label: "Bin",
				tooltip: "Bin",
				template: "StorageBin",
				type: "string"
			});
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

			var aFilters = [
				new Filter("Plant", "EQ", oNewTransfer.Plant)
			];

			if (oNewTransfer.DstStorageLocation !== "") {
				aFilters.push(new Filter("StorageLocation", "EQ", oNewTransfer.DstStorageLocation));
			}

			if (sValueBindingPath === "/NewTransfer/DstWMLBin") {
				if (oNewTransfer.WMLBin !== "") {
					aFilters.push(new Filter("StorageBin", "NE", oNewTransfer.WMLBin));
				}
			}

			oDialog.setTokens([]);
			
			var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
				advancedMode: true,
				filterBarExpanded: false,
				showGoOnFB: !sap.ui.Device.system.phone,
				filterGroupItems: [new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: "Bin",
						groupName: "Bin",
						name: "Bin",
						label: "Bin",
						control: new sap.m.Input()
					})
				],
				search: function (oEvt1) {
					var oSrc = oEvt1.getSource();
					var sBasicSearchValue = oSrc.getBasicSearchValue();
					oDialog.getTableAsync().then(function (oTable) {
						oTable.setBusy(true);
						var oBinding = oTable.getBinding("items");
						if (oBinding) {
							oBinding.filter([new Filter("StorageBin", sap.ui.model.FilterOperator.Contains, sBasicSearchValue)]);
						} else {
							oBinding = oTable.getBinding("rows");
							if (oBinding) {
								oBinding.filter([new Filter("StorageBin", sap.ui.model.FilterOperator.Contains, sBasicSearchValue)]);
							}
						}
						oTable.setBusy(false);
					});
				}
			});

			if (oFilterBar.setBasicSearch) {
				oFilterBar.setBasicSearch(new sap.m.SearchField({
					showSearchButton: sap.ui.Device.system.phone,
					placeholder: "Search",
					search: function (event) {
						oDialog.getFilterBar().search();
					}
				}));
			}

			oDialog.setFilterBar(oFilterBar);
			
			
			oDialog.getTableAsync().then(function (oTable) {
				oTable.setBusy(true);
				if (oTable.bindRows) {
					oTable.bindAggregation("rows", {
						path: "/ZC_WMLBIN_VH",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("StorageBin"),
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
							})
						]
					});
					oTable.bindAggregation("items", {
						path: "/ZC_WMLBIN_VH",
						filters: aFilters,
						// parameters: oEv.getSource().getParameters(),
						sorter: new sap.ui.model.Sorter("StorageBin"),
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

		_oWmlBinValueHelpResultSelect: function (oEvt) {
			var aTokens = oEvt.getParameter("tokens");
			if (aTokens) {
				var oToken = aTokens.find(() => true);
				if (oToken && oToken.getProperty("key")) {
					var oDialog = oEvt.getSource();
					var oData = oDialog.data();
					var sTokenKey = oToken.getProperty("key");
					if (oData.sInputPath && sTokenKey !== "") {
						var sPath = oData.sInputPath;
						var oTransfersModel = this.getView().getModel("Transfers");
						var oNewTransfer = oTransfersModel.getObject("/NewTransfer");
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

							var oItem = oSelectedContext.getObject();
							if (oItem) {
								if (sPath === "/NewTransfer/WMLBin") {
									oNewTransfer.WMLBin = sTokenKey;
									var fAutoQ = parseFloat(oItem.AlternativeUnitQuantity);
									if (isNaN(fAutoQ)) {
										fAutoQ = 0.0;
									}
									oNewTransfer.Quantity = sap.ui.core.format.NumberFormat.getFloatInstance().format(fAutoQ);
								} else if (sPath === "/NewTransfer/DstWMLBin") {
									oNewTransfer.DstWMLBin = sTokenKey;
									oNewTransfer.DstStorageLocation = oItem.StorageLocation;
								}
								this._validateNewTransfer(oTransfersModel);
								oTransfersModel.updateBindings(true);
							}
							oDialog.close();
						}.bind(this));
					}
				}
			}
		},

		_oUoMValueHelpResultSelect: function (oEvt) {
			var aTokens = oEvt.getParameter("tokens");
			if (aTokens) {
				var oToken = aTokens.find(() => true);
				if (oToken && oToken.getProperty("key")) {
					var oDialog = oEvt.getSource();
					var oModel = this.getView().getModel();
					var oTransfersModel = this.getView().getModel("Transfers");
					var oNewTransfer = oTransfersModel.getObject("/NewTransfer");
					oNewTransfer.Unit = oToken.getProperty("key");
					oDialog.setBusy(true);
					this._onNewTransferUoMChange(oModel, oTransfersModel, oDialog);
				}
			}
		},

		handleUoMChange: function (oEvt) {
			var oModel = this.getView().getModel();
			var oTransfersModel = this.getView().getModel("Transfers");
			this._onNewTransferUoMChange(oModel, oTransfersModel);
			this._validateNewTransfer(oTransfersModel);
		},

		_onNewTransferUoMChange: function (oModel, oTransfersModel, oDialog) {
			var oNewTransfer = oTransfersModel.getObject("/NewTransfer");
			var sMaterial = oNewTransfer.Material;
			var sNewUnit = oNewTransfer.Unit;
			var sToUnit = oNewTransfer.AvailableQuantityUnit;
			var aFilters = [
				new Filter("Material", "EQ", sMaterial)
			];
			var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance();

			oModel.read("/ZC_MATUOM_VH", {
				method: "GET",
				filters: aFilters,
				success: function (oData) {
					var aUnits = oData.results;
					if (aUnits !== undefined && aUnits.length > 0) {
						//var oBaseUnit = aUnits.find((x) => x.UnitOfMeasure && x.IsBaseUnit === "X");
						var oNewUnit = aUnits.find((x) => x.UnitOfMeasure && x.UnitOfMeasure === sNewUnit);
						var oToUnit = aUnits.find((x) => x.UnitOfMeasure && x.UnitOfMeasure === sToUnit);

						if (oNewUnit && oToUnit && oNewUnit.UnitOfMeasure !== oToUnit.UnitOfMeasure) {
							var fU1Num = oFormat.parse(oToUnit.QuantityNumerator);
							var fU1Den = oFormat.parse(oToUnit.QuantityDenominator);
							var fU2Num = oFormat.parse(oNewUnit.QuantityNumerator);
							var fU2Den = oFormat.parse(oNewUnit.QuantityDenominator);
							var fConvNum = fU1Num * fU2Den;
							var fConvDen = fU1Den * fU2Num;
							var fConvRatio = fConvNum / fConvDen;
							if (oNewTransfer.Quantity !== "") {
								var fConvQuant = oFormat.parse(oNewTransfer.Quantity);
								fConvQuant *= fConvRatio;
							}
							var fAvailConvQuant = parseFloat(oNewTransfer.AvailableQuantity);
							fAvailConvQuant *= fConvRatio;

							oNewTransfer.Quantity = oFormat.format(fConvQuant);
							oNewTransfer.AvailableQuantity = fAvailConvQuant;
							oNewTransfer.AvailableQuantityUnit = oNewUnit.UnitOfMeasure;
							oTransfersModel.updateBindings(true);
							if (oDialog) {
								oDialog.setBusy(false);
								oDialog.close();
							}
							return;
						}
					}
					oNewTransfer.Quantity = 0;
					oTransfersModel.updateBindings(true);

					if (oDialog) {
						oDialog.setBusy(false);
						oDialog.close();
					}
				},
				error: function () {
					//oNewTransfer.Quantity = oFormat.format(0);
					oNewTransfer.Quantity = 0;
					oTransfersModel.updateBindings(true);

					if (oDialog) {
						oDialog.setBusy(false);
						oDialog.close();
					}
				}
			});
		},

		handleDstStorageLocationChange: function (oEvt) {
			var oModel = this.getView().getModel();
			var oTransfersModel = this.getView().getModel("Transfers");
			var oNewTransfer = oTransfersModel.getObject("/NewTransfer");

			var sPlant = oNewTransfer.Plant;
			var sStorageLocation = oNewTransfer.DstStorageLocation;

			var aFilters = [
				new Filter("Plant", "EQ", sPlant),
				new Filter("StorageLocation", "EQ", sStorageLocation)
			];

			oModel.read("/ZC_STLOC_WWML", {
				method: "GET",
				filters: aFilters,
				success: function (oData) {
					var aStorageLocations = oData.results;
					if (!aStorageLocations.length || aStorageLocations.length === 0) {
						oNewTransfer.DstStorageLocationState = sap.ui.core.ValueState.Error;
						oNewTransfer.DstStorageLocationStateText = "Storage location '" + sStorageLocation + "' not found.";
						oNewTransfer.DstStorageLocation = "";
						oNewTransfer.DstWMLBinVisible = false;
						oNewTransfer.DstWMLBin = "";
						this._validateNewTransfer(this._oTransfersModel, oEvt.getSource());
						oTransfersModel.updateBindings(true);
						return;
					}

					var oStorageLocation = aStorageLocations[0];
					oNewTransfer.DstStorageLocationState = null;
					oNewTransfer.DstStorageLocationStateText = null;
					oNewTransfer.DstStorageLocation = oStorageLocation.StorageLocation ? oStorageLocation.StorageLocation : "";
					oNewTransfer.DstWMLBinVisible = oStorageLocation.WMLEnabled && oStorageLocation.WMLEnabled === "X" ? true : false;
					oNewTransfer.DstWMLBin = "";
					this._validateNewTransfer(oTransfersModel);
					oTransfersModel.updateBindings(true);
				}.bind(this),
				error: function () {
					oNewTransfer.DstStorageLocationState = sap.ui.core.ValueState.Error;
					oNewTransfer.DstStorageLocationStateText = "Storage location '" + sStorageLocation + "' not found due to error.";
					oNewTransfer.DstStorageLocation = "";
					oNewTransfer.DstWMLBinVisible = false;
					oNewTransfer.DstWMLBin = "";
					this._validateNewTransfer(oTransfersModel);
					oTransfersModel.updateBindings(true);
				}.bind(this)
			});
		},

		_validateNewTransfer: function (oTransfersModel, oSource) {
			var oNewTransfer = oTransfersModel.getObject("/NewTransfer");
			var bValid = true;
			var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				"groupingEnabled": true,
				"groupingSize": 3,
				"decimals": 3
			});

			if (oNewTransfer.TransferType === "") {
				oNewTransfer.TransferTypeState = sap.ui.core.ValueState.Error;
				oNewTransfer.TransferTypeStateText = null;
				bValid = false;
			} else {
				if (oNewTransfer.TransferType === "414" && (oNewTransfer.SalesOrder === "" || oNewTransfer.SalesOrderItem === "")) {
					oNewTransfer.TransferTypeState = sap.ui.core.ValueState.Error;
					oNewTransfer.TransferTypeStateText = "Only available for entries with Sales Order.";
					bValid = false;
				} else if (oNewTransfer.TransferType === "343" && oNewTransfer.StockType !== "07") {
					oNewTransfer.TransferTypeState = sap.ui.core.ValueState.Error;
					oNewTransfer.TransferTypeStateText = "Only available for blocked stock.";
					bValid = false;
				} else if (oNewTransfer.TransferType === "344" && oNewTransfer.StockType !== "01") {
					oNewTransfer.TransferTypeState = sap.ui.core.ValueState.Error;
					oNewTransfer.TransferTypeStateText = "Only available for unrestricted stock.";
					bValid = false;
				} else {
					oNewTransfer.TransferTypeState = null;
					oNewTransfer.TransferTypeStateText = null;
				}
			}

			if (oNewTransfer.DstStorageLocation === "") {
				oNewTransfer.DstStorageLocationState = sap.ui.core.ValueState.Error;
				oNewTransfer.DstStorageLocationStateText = "Storage location cannot be empty.";
				bValid = false;
			} else {
				oNewTransfer.DstStorageLocationState = null;
				oNewTransfer.DstStorageLocationStateText = null;
			}

			if (oNewTransfer.DstSalesOrderVisible === true) {
				if (oNewTransfer.DstSalesOrder !== "" && oNewTransfer.DstSalesOrderItem !== "" && (oNewTransfer.DstSalesOrder !== oNewTransfer.SalesOrder ||
						oNewTransfer.DstSalesOrderItem !== oNewTransfer.SalesOrderItem)) {
					oNewTransfer.DstSalesOrderState = null;
					oNewTransfer.DstSalesOrderStateText = null;
				} else {
					oNewTransfer.DstSalesOrderState = sap.ui.core.ValueState.Error;
					oNewTransfer.DstSalesOrderStateText = null;
					bValid = false;
				}
			}
			
			if (oNewTransfer.DstVendorVisible === true) {
				if(!oNewTransfer.DstVendor) {
					oNewTransfer.DstVendorState = sap.ui.core.ValueState.Error;
					oNewTransfer.DstVendorStateText = null;
					bValid = false;
				} else {
					oNewTransfer.DstVendorState = null;
					oNewTransfer.DstVendorStateText = null;
				}
			}

			if (oNewTransfer.Quantity === "") {
				oNewTransfer.QuantityState = sap.ui.core.ValueState.Error;
				oNewTransfer.QuantityStateText = null;
				bValid = false;
			} else {
				//var fAvaliQuant = oFormat.parse(oNewTransfer.AvailableQuantity);
				//var fQuantity = oFormat.parse(oNewTransfer.Quantity);
				var fAvaliQuant = oNewTransfer.AvailableQuantity;
				var fQuantity = oNewTransfer.Quantity;
				if (fQuantity > fAvaliQuant) {
					oNewTransfer.QuantityState = sap.ui.core.ValueState.Error;
					oNewTransfer.QuantityStateText = "Greater than available quantity.";
					bValid = false;
				} else if (fQuantity === fAvaliQuant) {
					oNewTransfer.QuantityState = sap.ui.core.ValueState.Information;
					oNewTransfer.QuantityStateText = "Quantity is maximum.";
				} else {
					oNewTransfer.QuantityState = null;
					oNewTransfer.QuantityStateText = null;
				}
			}

			if (oNewTransfer.WMLBinVisible && oNewTransfer.WMLBin === "") {
				oNewTransfer.StorageBinState = sap.ui.core.ValueState.Error;
				oNewTransfer.StorageBinStateText = "Storage Bin cannot be empty.";
				bValid = false;
			} else {
				oNewTransfer.StorageBinState = null;
				oNewTransfer.StorageBinStateText = null;
			}

			if (oNewTransfer.DstWMLBinVisible && oNewTransfer.DstWMLBin === "") {
				oNewTransfer.DstStorageBinState = sap.ui.core.ValueState.Error;
				oNewTransfer.DstStorageBinStateText = "Storage Bin cannot be empty.";
				bValid = false;
			} else {
				oNewTransfer.DstStorageBinState = null;
				oNewTransfer.DstStorageBinStateText = null;
			}

			oNewTransfer.ValidTransfer = bValid;
			return bValid;
		},

		handleScanSuccess: function (oEvent) {
			if (oEvent.getParameter("cancelled")) {
				MessageToast.show("Scan cancelled", {
					duration: 1000
				});
			} else {
				var oSearchField = this.byId("listReportFilter-btnBasicSearch");
				var oGoBtn = this.byId("listReportFilter-btnGo");
				if (oEvent.getParameter("text")) {
					oSearchField.setValue(oEvent.getParameter("text"));
					oGoBtn.firePress();
				} else {
					oSearchField.setValue("");
				}
			}
		},

		handleScanError: function (oEvent) {
			MessageToast.show("Scan failed: " + oEvent, {
				duration: 1000
			});
		},

		handleScanLiveupdate: function (oEvent) {
			// User can implement the validation about inputting value
		},

		handleTransferCellButton: function (oEvt) {
			var oBindingContext = oEvt.getSource().getBindingContext();
			var oStockEntry = oBindingContext.getObject();

			this._initNewTransfer(this._oTransfersModel, oStockEntry);

			var oDialog = this._oTransferDialog;

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
			oDialog.open();
		},

		handleTransferDialogOk: function (oEvt) {
			var oDialog = oEvt.getSource().getParent();
			var oModel = oDialog.getParent().getModel();
			//var oBindingContext = oEvt.getSource().getBindingContext();
			//var oStockEntry = oBindingContext.getObject();
			var oNewTransfer = this._oTransfersModel.getObject("/NewTransfer");

			if (oNewTransfer.ValidTransfer === true) {
				this._doTransfer(oModel, oNewTransfer);
			}
		},

		handleTransferDialogCancel: function (oEvt) {
			var oDialog = oEvt.getSource().getParent();
			this._initNewTransfer(this._oTransfersModel);
			oDialog.close();
		},

		handleTransferTypeChange: function (oEvt) {
			var sMovementType = oEvt.getSource().getSelectedKey();
			var oBindingContext = oEvt.getSource().getBindingContext();
			var oModel = this.getView().getModel();
			var oTransfersModel = this.getView().getModel("Transfers");
			var oNewTransfer = oTransfersModel.getObject("/NewTransfer");
			var oStockEntry = oBindingContext.getObject();
			oNewTransfer.TransferType = sMovementType;

			oNewTransfer.DstStorageLocationEditable = true;
			oNewTransfer.DstStorageLocation = "";
			oNewTransfer.DstSalesOrderVisible = false;
			oNewTransfer.DstVendorVisible = false;
			oNewTransfer.DstSalesOrderState = null;
			oNewTransfer.DstSalesOrderStateText = null;
			oNewTransfer.DstVendorState = null;
			oNewTransfer.DstVendorStateText = null;

			// if (oNewTransfer.TransferType === "311") {
			oNewTransfer.WMLBinVisible = oNewTransfer.StorageLocationWMLEnabled;
			oNewTransfer.DstWMLBinVisible = false;

			if (oNewTransfer.WMLBinVisible) {
				var aFilters = [
					new Filter("Material", "EQ", oNewTransfer.Material),
					new Filter("Plant", "EQ", oNewTransfer.Plant),
					new Filter("AlternativeUnit", "EQ", oNewTransfer.Unit)
				];

				aFilters.push(new Filter("Batch", "EQ", oNewTransfer.Batch));

				aFilters.push(new Filter("StorageLocation", "EQ", oNewTransfer.StorageLocation));

				aFilters.push(new Filter("StockType", "EQ", oNewTransfer.StockType));

				if (oNewTransfer.SpecialStock === "E") {
					aFilters.push(new Filter("SalesOrder", "EQ", oNewTransfer.SalesOrder));
					aFilters.push(new Filter("SalesOrderItem", "EQ", oNewTransfer.SalesOrderItem));
				} else {
					aFilters.push(new Filter("SalesOrder", "EQ", ""));
				}

				oModel.read("/ZC_WMLNZSTKAU", {
					method: "GET",
					filters: aFilters,
					success: function (oData) {
						var aBins = oData.results;
						if (aBins !== undefined && aBins.length > 0) {
							var oBin = aBins[0];
							oNewTransfer.WMLBin = oBin.StorageBin;
							var fAutoQ = parseFloat(oBin.AlternativeUnitQuantity);
							if (isNaN(fAutoQ)) {
								fAutoQ = 0.0;
							}
							oNewTransfer.Quantity = sap.ui.core.format.NumberFormat.getFloatInstance().format(fAutoQ);
							this._validateNewTransfer(this._oTransfersModel, oEvt.getSource());
							oTransfersModel.updateBindings(true);
							return;
						}
					}.bind(this),
					error: function () {
						// Do nothing
					}
				});

			}
			// } else {
			// 	oNewTransfer.WMLBinVisible = false;
			// 	oNewTransfer.DstWMLBinVisible = false;
			// }

			if (oNewTransfer.TransferType === "311") {
				oNewTransfer.DstStorageLocation = oStockEntry.StorageLocation;
				oNewTransfer.DstWMLBinVisible = oNewTransfer.StorageLocationWMLEnabled;
			}

			if (oNewTransfer.TransferType === "343" || oNewTransfer.TransferType === "344") {
				oNewTransfer.WMLBinVisible = oNewTransfer.StorageLocationWMLEnabled;
				oNewTransfer.DstWMLBinVisible = false;
			}

			if (oNewTransfer.TransferType === "413") {
				oNewTransfer.DstStorageLocation = oStockEntry.StorageLocation;
				oNewTransfer.DstStorageLocationEditable = false;
				oNewTransfer.DstSalesOrder = this._getStockEntrySalesOrder(oStockEntry);
				oNewTransfer.DstSalesOrderItem = this._getStockEntrySalesOrderItem(oStockEntry);
				oNewTransfer.DstSalesOrderVisible = true;
				oNewTransfer.DstSalesOrderState = sap.ui.core.ValueState.Error;
				oNewTransfer.DstSalesOrderStateText = null;
			}

			if (oNewTransfer.TransferType === "343" || oNewTransfer.TransferType === "344" || oNewTransfer.TransferType === "413" ||
				oNewTransfer.TransferType === "414") {
				oNewTransfer.DstStorageLocation = oStockEntry.StorageLocation;
				oNewTransfer.DstStorageLocationEditable = false;
			}

			this._validateNewTransfer(this._oTransfersModel, oEvt.getSource());
			this._oTransfersModel.updateBindings(true);
		},

		handleQuantityChange: function (oEvt) {
			var sValue = oEvt.getParameter("value");
			var oNewTransfer = this._oTransfersModel.getObject("/NewTransfer");

			var fValue = sap.ui.core.format.NumberFormat.getFloatInstance().parse(sValue);
			oNewTransfer.Quantity = sap.ui.core.format.NumberFormat.getFloatInstance().format(fValue);
			this._validateNewTransfer(this._oTransfersModel, oEvt.getSource());
			this._oTransfersModel.updateBindings(true);
		},

		handleUOMChange: function (oEvt) {
			var sValue = oEvt.getParameter("value");
			var oNewTransfer = this._oTransfersModel.getObject("/NewTransfer");
			oNewTransfer.Unit = sValue;
		},

		handleDstSalesOrderChange: function (oEvt) {
			var sValue = oEvt.getParameter("value");
			var oNewTransfer = this._oTransfersModel.getObject("/NewTransfer");
			var iValue = parseInt(sValue, 10);
			if (!isNaN(iValue)) {
				oNewTransfer.DstSalesOrder = String(iValue);
			} else {
				oNewTransfer.DstSalesOrder = "";
			}
			this._validateNewTransfer(this._oTransfersModel, oEvt.getSource());
			this._oTransfersModel.updateBindings(true);
		},

		handleDstSalesOrderItemChange: function (oEvt) {
			var sValue = oEvt.getParameter("value");
			var oNewTransfer = this._oTransfersModel.getObject("/NewTransfer");
			var iValue = parseInt(sValue, 10);
			if (!isNaN(iValue)) {
				oNewTransfer.DstSalesOrderItem = String(iValue);
			} else {
				oNewTransfer.DstSalesOrderItem = "";
			}
			this._validateNewTransfer(this._oTransfersModel, oEvt.getSource());
			this._oTransfersModel.updateBindings(true);
		},
		
		handleDstVendorChange: function (oEvt) {
			this._validateNewTransfer(this._oTransfersModel, oEvt.getSource());
			this._oTransfersModel.updateBindings(true);
		},

		handleDstWmlBinChange: function (oEvt) {
			var sBin = oEvt.getParameter("value");

			var oModel = this.getView().getModel();
			var oTransfersModel = this.getView().getModel("Transfers");
			var oNewTransfer = oTransfersModel.getObject("/NewTransfer");

			var sPlant = oNewTransfer.Plant;
			var sStorageLocation = oNewTransfer.DstStorageLocation;

			var aFilters = [
				new Filter("StorageBin", "EQ", sBin),
				new Filter("StorageLocation", "EQ", sStorageLocation),
				new Filter("Plant", "EQ", sPlant)
			];

			oModel.read("/ZC_WMLBIN_VH", {
				method: "GET",
				filters: aFilters,
				success: function (oData) {
					var aBins = oData.results;
					if (!aBins.length || aBins.length === 0) {
						oNewTransfer.DstStorageBinState = sap.ui.core.ValueState.Error;
						oNewTransfer.DstStorageBinStateText = this._i18nText("MSG_STORAGEBIN_NOT_FOUND", sBin);
						oNewTransfer.DstWMLBin = "";
						oNewTransfer.ValidTransfer = false;
						oTransfersModel.updateBindings(true);
						return;
					}

					var oBin = aBins[0];
					oNewTransfer.DstWMLBin = oBin.StorageBin;
					oNewTransfer.DstStorageBinState = null;
					oNewTransfer.DstStorageBinStateText = "";
					oNewTransfer.DstStorageLocation = oBin.StorageLocation;
					oNewTransfer.DstStorageLocationState = null;
					oNewTransfer.DstStorageLocationStateText = null;
					this._validateNewTransfer(oTransfersModel);
					oTransfersModel.updateBindings(true);
				}.bind(this),
				error: function () {
					oNewTransfer.DstStorageBinState = sap.ui.core.ValueState.Error;
					oNewTransfer.DstStorageBinStateText = this._i18nText("MSG_STORAGEBIN_NOT_FOUND", sBin);
					oNewTransfer.DstWMLBin = "";
					oNewTransfer.ValidTransfer = false;
					oTransfersModel.updateBindings(true);
				}.bind(this)
			});
		},

		_doTransfer: function (oModel, oNewTransfer) {

			//var oFormat = sap.ui.core.format.NumberFormat.getFloatInstance();
			//var fQuantity = oFormat.parse(oNewTransfer.Quantity);

			var fQuantity = sap.ui.core.format.NumberFormat.getFloatInstance().parse(oNewTransfer.Quantity);

			var mParameters = {
				method: "POST",
				urlParameters: {
					"TransferType": oNewTransfer.TransferType,
					"Material": oNewTransfer.Material,
					"Plant": oNewTransfer.Plant,
					"StorageLocation": oNewTransfer.StorageLocation,
					"Batch": oNewTransfer.Batch,
					"SupplierBatch": oNewTransfer.SupplierBatch ? oNewTransfer.SupplierBatch : "",
					"StockType": oNewTransfer.StockType ? oNewTransfer.StockType : "",
					"SpecialStock": oNewTransfer.SpecialStock ? oNewTransfer.SpecialStock : "",
					"SalesOrder": oNewTransfer.SalesOrder ? oNewTransfer.SalesOrder : "",
					"SalesOrderItem": oNewTransfer.SalesOrderItem ? oNewTransfer.SalesOrderItem : "",
					"Vendor": !oNewTransfer.Vendor ? "" : oNewTransfer.Vendor, 
					"WMLBin": oNewTransfer.WMLBin ? oNewTransfer.WMLBin : "",
					"Quantity": fQuantity,
					"UnitOfMeasure": oNewTransfer.Unit,
					"DstBatch": "",
					"DstStorageLocation": oNewTransfer.DstStorageLocation,
					"DstSalesOrder": oNewTransfer.DstSalesOrder ? oNewTransfer.DstSalesOrder : "",
					"DstSalesOrderItem": oNewTransfer.DstSalesOrder ? oNewTransfer.DstSalesOrderItem : "",
					"DstVendor": !oNewTransfer.DstVendor ? "" : oNewTransfer.DstVendor,
					"DstWMLBin": oNewTransfer.DstWMLBin ? oNewTransfer.DstWMLBin : ""
				},
				context: null,
				success: jQuery.proxy(this._handleTransferStockSuccess, this),
				error: jQuery.proxy(this._handleTransferStockError, this),
				async: true
			};
			oModel.callFunction("/TransferStock", mParameters);
		},

		_handleTransferStockSuccess: function (oData, oResponse, oThis) {
			if (!oThis) {
				oThis = this;
			}

			if (oData.TransferStock) {
				MessageToast.show("Transfer completed ok with " + oData.TransferStock.MaterialDocument + "/" + oData.TransferStock.DocumentYear);
			}
			oThis._initNewTransfer(oThis.getView().getModel("Transfers"));
			oThis.getView().getModel("Transfers").updateBindings(true);
			oThis.getView().getModel().refresh(true);
			oThis._oTransferDialog.close();
		},

		_handleTransferStockError: function (oError, oThis) {
			if (!oThis) {
				oThis = this;
			}
			oThis._showTransferStockErrorMsgBox(oError, oThis);
		},

		_showTransferStockErrorMsgBox: function (oError) {
			var parsedJSError = null;

			if (oError.response) {
				try {
					parsedJSError = jQuery.sap.parseJS(oError.response.body);
				} catch (err) {
					return false;
				}
			}

			if (oError.responseText) {
				try {
					parsedJSError = jQuery.sap.parseJS(oError.responseText);
				} catch (err) {
					return false;
				}
			}

			if (parsedJSError && parsedJSError.error && parsedJSError.error.code) {
				MessageBox.show(
					parsedJSError.error.message.value, {
						icon: MessageBox.Icon.ERROR,
						title: "Transfer stock error",
						actions: [MessageBox.Action.OK],
						emphasizedAction: MessageBox.Action.OK,
						onClose: function (oAction) {}
					}
				);
			}
			return true;
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