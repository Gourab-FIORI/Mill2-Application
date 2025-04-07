sap.ui.define([
		"sap/ui/core/mvc/Controller",
		"sap/ui/model/Filter",
		"sap/m/MessageToast",
		"sap/m/MessageBox",
		"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
		"sap/ui/core/Element",
		"sap/ui/model/resource/ResourceModel",
		"sap/ui/model/FilterOperator",
		"sap/ui/model/json/JSONModel",
		"sap/ui/core/BusyIndicator"
	],
	function (Controller, Filter, MessageToast, MessageBox, ValueHelpDialog, JSONModel, BusyIndicator) {
		"use strict";
		var name;
		var mandt;
		var sPlant, sStorage, sMatnr, sTotCapacity, sRemCapacity, sUsedCapacity;

		//var oModell = new sap.ui.model.odata.ODataModel("/sap/opu/odata/sap/ZMM_MOBGRPO_N_SRV/");
		return Controller.extend("com.ami.zmobgrpo.controller.View1", {
			onInit: function () {
				this.Filter = sap.ui.xmlfragment("com/ami/zmobgrpo/Fragments/FileUpload", this);
				this.getView().addDependent(this.Filter);
				this.BinFilter = sap.ui.xmlfragment("com/ami/zmobgrpo/Fragments/Bin", this);
				this.getView().addDependent(this.BinFilter);
				this.PreviewFilter = sap.ui.xmlfragment("com/ami/zmobgrpo/Fragments/Preview", this);
				this.getView().addDependent(this.PreviewFilter);
				var oView = this.getView();
				this._initFrontEndModel(oView);


				var oWizard = oView.byId("GRWizard");
				// disable clicking on the wizard navigation bar
				oWizard._getProgressNavigator().ontap = function () {};
				this.AddBatch = [];

			},
			onAfterRendering: function () {
				this._wizardJumpToPOSelect(this.getView());
			},
			onValueHelpRequest: function () {
				// Apply filter to the bindingconst 
				var oTable = sap.ui.getCore().byId("idTableIO");
				var oBinding = oTable.getBinding("items");
				var oFilter = new sap.ui.model.Filter("Storagelocation", sap.ui.model.FilterOperator.Contains, sStorage);
				oBinding.filter([oFilter]);
				this.BinFilter.open();
			},
			onCanceBinFrag: function () {
				this.BinFilter.close();
			},
			onListItemPress: function (oEvent) {
				var oListItem = oEvent.getSource().getSelectedItem().getBindingContext().getObject().Storagebin;
				this.getView().byId("idSearchBin").setValue(oListItem);
				this.getView().byId("BatchDetailsFinish").setEnabled(true);
				//this._transfersAddTransfer(this.getView()); //++ T_mitraan removing next button direct 
				this.BinFilter.close();

			},
			_initFrontEndModel: function (oView) {
				var oTransfersModel = new sap.ui.model.json.JSONModel({
					PurchaseOrder: "",
					PurchaseOrderValueState: null,
					PurchaseOrderValueStateText: null,
					PurchaseOrderItem: "",
					Material: "",
					StorageLocation: "",
					Plant: "",
					StockType: "",
					Supplier: "",
					DeliveryNote: "",
					BatchUnit: "",
					BatchQuantity: "",
					BatchQuantityValueState: null,
					BatchQuantityValueStateText: null,
					SupplierBatch: "",
					NewTransfersCount: null,
					NewTransfers: [],
					MaterialDocument: null,
					MaterialDocumentYear: null
				});
				oView.setModel(oTransfersModel, "Transfers");

				var oWizardUIModel = new sap.ui.model.json.JSONModel({
					POSelectStepActive: true,
					POItemsSelectStepActive: false,
					EntriesCommonStepActive: false,
					BatchDetailsStepActive: false,
					MovementSuccessStepActive: false,
					GoToPOSelectBtnVisible: false,
					GoToPOItemsSelectBtnVisible: false,
					GoToBatchDetailsBtnVisible: false,
					GoToBatchDetailsBtnEnabled: false,
					BatchDetailsBackBtnVisible: false,
					NextBatchDetailsBtnVisible: false,
					NextBatchDetailsBtnEnabled: false,
					FinishBatchDetailsBtnVisible: false,
					FinishBatchDetailsBtnEnabled: false,
					ResetToPOSelectBtnVisible: false,
					ResetToPOItemsBtnVisible: false
				});
				oView.setModel(oWizardUIModel, "WizardUI");
			},
			onPOValueHelpRequest: function () {
				var oView = this.getView();
				var oModel = oView.getModel();

				var oDialog = new ValueHelpDialog({
					supportMultiselect: false,
					key: "PurchaseOrder",
					descriptionKey: "PurchaseOrder",
					ok: this.onPOValueHelpResultSelect.bind(this),
					cancel: function () {
						this.close();
					},
					afterClose: function () {
						this.destroy();
					}
				});
				var oSearchField = new sap.m.SearchField({
					placeholder: "Search...",
					liveChange: function (oEvent) {
						var sQuery = oEvent.getParameter("newValue");
						var oBinding = oDialog.getTable().getBinding("rows") || oDialog.getTable().getBinding("items");
						var aFilters = [];

						if (sQuery) {
							aFilters.push(new sap.ui.model.Filter({
								filters: [
									new sap.ui.model.Filter("PurchaseOrder", sap.ui.model.FilterOperator.Contains, sQuery),
									new sap.ui.model.Filter("Supplier", sap.ui.model.FilterOperator.Contains, sQuery)
								],
								and: false
							}));
						}

						oBinding.filter(aFilters);
					}
				});

				// Set model and directly bind data from /ZC_PURORDVH
				oDialog.setModel(oModel);
				// oDialog.setFilterBar(new sap.m.Toolbar({
				// 	content: [oSearchField]
				// }));
				var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
					advancedMode: true,
					filterBarExpanded: true,
					search: function () {
						oSearchField.fireSearch();
					},
					filterGroupItems: []
				});

				// Add SearchField to FilterBar's BasicSearch
				oFilterBar.setBasicSearch(oSearchField);

				// Attach FilterBar to ValueHelpDialog
				oDialog.setFilterBar(oFilterBar);
				oDialog.getTableAsync().then(function (oTable) {
					oTable.setBusy(true);

					// Define columns for sap.ui.table.Table
					//if (oTable instanceof sap.ui.table.Table) {
					if (oTable.bindRows) {
						oTable.addColumn(new sap.ui.table.Column({
							label: new sap.m.Label({
								text: "Purchase Order"
							}),
							template: new sap.m.Text({
								text: "{PurchaseOrder}"
							})
						}));
						oTable.addColumn(new sap.ui.table.Column({
							label: new sap.m.Label({
								text: "Supplier"
							}),
							template: new sap.m.Text({
								text: "{Supplier}"
							})
						}));

						// Bind rows for sap.ui.table.Table
						oTable.bindRows({
							path: "/ZC_PURORDVH",
							events: {
								dataReceived: function () {
									oTable.setBusy(false);
								}
							}
						});
					}
					// Define columns for sap.m.Table in else if condition
					// else if (oTable instanceof sap.m.Table) {
					else if (oTable.bindItems) {
						oTable.addColumn(new sap.m.Column({
							header: new sap.m.Label({
								text: "Purchase Order"
							})
						}));
						oTable.addColumn(new sap.m.Column({
							header: new sap.m.Label({
								text: "Supplier"
							})
						}));

						// Define items for sap.m.Table
						oTable.bindItems({
							path: "/ZC_PURORDVH",
							template: new sap.m.ColumnListItem({
								cells: [
									new sap.m.Text({
										text: "{PurchaseOrder}"
									}),
									new sap.m.Text({
										text: "{Supplier}"
									})
								]
							}),
							events: {
								dataReceived: function () {
									oTable.setBusy(false);
								}
							}
						});
					}
				});

				oDialog.open();
			},


			onPOValueHelpRequest1: function (oEvt) {
				var oView = this.getView();
				var oModel = oView.getModel();
				var oDialog = new ValueHelpDialog({
					// modal : true,
					supportRangesOnly: false,
					supportMultiselect: false,
					supportRanges: false,
					title: "",
					key: "PurchaseOrder",
					keys: [],
					descriptionKey: "PurchaseOrder",
					ok: jQuery.proxy(this.onPOValueHelpResultSelect, this),
					cancel: function () {
						this.close();
					},
					afterClose: function () {
						this.setModel(null);
						oDialog.destroy();
					},
					beforeOpen: function () {
						this.oSelectionTitle.setText("");
					}
				});

				var aCols = [];
				aCols.push({
					label: oModel.getProperty("/#ZC_PURORDVHType/PurchaseOrder/@sap:label"),
					tooltip: oModel.getProperty("/#ZC_PURORDVHType/PurchaseOrder/@sap:label"),
					template: "PurchaseOrder",
					type: "string"
				});
				aCols.push({
					label: oModel.getProperty("/#ZC_PURORDVHType/Supplier/@sap:label"),
					tooltip: oModel.getProperty("/#ZC_PURORDVHType/Supplier/@sap:label"),
					template: "Supplier",
					type: "string"
				});

				oDialog.setModel(oModel);
				oDialog.setTokens([]);

				var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
					advancedMode: true,
					filterBarExpanded: false,
					showGoOnFB: !sap.ui.Device.system.phone,
					filterGroupItems: [new sap.ui.comp.filterbar.FilterGroupItem({
						groupTitle: oModel.getProperty("/#ZC_PURORDVHType/PurchaseOrder/@sap:label"),
						groupName: oModel.getProperty("/#ZC_PURORDVHType/PurchaseOrder/@sap:label"),
						name: "PurchaseOrder",
						label: oModel.getProperty("/#ZC_PURORDVHType/PurchaseOrder/@sap:label"),
						control: new sap.m.Input()
					})],
					search: function (oEvt1) {
						var oSrc = oEvt1.getSource();
						var sBasicSearchValue = oSrc.getBasicSearchValue();
						oDialog.getTableAsync().then(function (oTable) {
							oTable.setBusy(true);
							var oBinding = oTable.getBinding("items");
							if (oBinding) {
								oBinding.filter([new Filter("PurchaseOrder", sap.ui.model.FilterOperator.Contains, sBasicSearchValue)]);
							} else {
								oBinding = oTable.getBinding("rows");
								if (oBinding) {
									oBinding.filter([new Filter("PurchaseOrder", sap.ui.model.FilterOperator.Contains, sBasicSearchValue)]);
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
					var columns = {
						cols: [{
								"label": "Purchase Order",
								"tooltip": "Purchase Order",
								"template": "PurchaseOrder",
								"type": "string"
							},
							{
								"label": "Supplier",
								"tooltip": "Supplier",
								"template": "Supplier",
								"type": "string"
							}
						]
					};
					var data = new JSONModel(columns);
					oTable.setModel(data);
					if (oTable.bindRows) {
						oTable.bindAggregation("rows", {
							path: "/ZC_PURORDVH",
							filters: [],
							sorter: new sap.ui.model.Sorter("PurchaseOrder"),
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
									text: "{PurchaseOrder}"
								})
							]
						});
						oTable.bindAggregation("items", {
							path: "/ZC_PURORDVH",
							filters: [],
							sorter: new sap.ui.model.Sorter("PurchaseOrderDate", true),
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
			onPOValueHelpResultSelect: function (oEvt) {
				var aTokens = oEvt.getParameter("tokens");
				if (aTokens) {
					var oToken = aTokens.find(() => true);
					if (oToken && oToken.getProperty("key")) {
						var oDialog = oEvt.getSource();
						var sTokenKey = oToken.getProperty("key");
						if (sTokenKey !== "") {
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
								oSelectedContext.getObject();
								this._stepToPoItems(this.getView(), oSelectedContext.getObject(), oDialog);
							}.bind(this));
						}
					}
				}
			},

			handlePOSelectChange: function (oEvt) {
				var oView = this.getView();
				var oModel = oView.getModel();
				var sPurchaseOrder = oEvt.getParameter("value");

				var aFilters = [
					new Filter("PurchaseOrder", "EQ", sPurchaseOrder)
				];

				oModel.read("/ZC_PURORDVH", {
					method: "GET",
					filters: aFilters,
					success: function (oData) {
						var aPurchaseOrders = oData.results;
						if (!aPurchaseOrders.length || aPurchaseOrders.length === 0) {
							var sValueStateErrorText = this._i18nText("errorPurchaseOrderNotFound");
							this._transfersSync(oView, {
									PurchaseOrder: sPurchaseOrder,
									PurchaseOrderValueState: sap.ui.core.ValueState.Error,
									PurchaseOrderValueStateText: sValueStateErrorText
								},
								true, true);

							var oInput = oView.byId("POSelectInput");
							if (oInput) {
								jQuery.sap.delayedCall(200, this, function () {
									oInput.focus();
									oInput.selectText(0, 99);
								});
							}
							return;
						}

						var oPurchaseOrder = aPurchaseOrders[0];
						this._stepToPoItems(oView, oPurchaseOrder);
					}.bind(this),
					error: function () {

						var oInput = oView.byId("POSelectInput");
						if (oInput) {
							jQuery.sap.delayedCall(200, this, function () {
								oInput.focus();
								oInput.selectText(0, 99);
							});
						}
					}.bind(this)
				});
			},

			handlePOItemsListSelect: function (oEvt) {
				var oItemsList = oEvt.getSource();
				this.getView().byId("usedcap").setText("");				//++T_Singhag1
					this.getView().byId("totalcap").setText("");		//++T_Singhag1
					this.getView().byId("idSearchBin").setValue("");		
				var aSelectedContexts = oItemsList.getSelectedContexts();
				if (aSelectedContexts && aSelectedContexts.length && aSelectedContexts.length > 0) {
					var oPOItem = aSelectedContexts[0].getObject();
					sMatnr = oPOItem.Material;
					var fOpenQty = parseFloat(oPOItem.ScheduleLineOpenQty);
					if (fOpenQty > 0) {
						this._stepToCommonValues(this.getView(), oPOItem);
					}
					oItemsList.removeSelections(true);
				}
			},

			handleDeliveryNoteChange: function (oEvt) {
				var oView = this.getView();
				var sValue = oEvt.getParameter("value");
				var oTransfersData = this._transfersSync(oView, {
					DeliveryNote: sValue
				}, true);
				var bDisableNext = !oTransfersData.DeliveryNote;
				this._wizardUIActivate(oView, {
					GoToBatchDetailsBtnEnabled: !bDisableNext
				}, true, true);
			},
			onCheckBarcode: function (sBarcode) {
				if (typeof sBarcode !== "string") {
					if (sBarcode.getParameter("value") !== "" && sBarcode.getParameter("value") !== undefined) {
						// 	sBarcode = this.getView().byId("barcodeInput").getValue();
						// }else{
						sBarcode = sBarcode.getParameter("value");
						sBarcode = this.getView().byId("barcodeInput").getValue().replace(/\n/g, '\r\n');
					} else if (sBarcode.getParameter("value") === undefined) {
						sBarcode = this.getView().byId("barcodeInput").getValue().replace(/\n/g, '\r\n');
					}
				}
				
				var oModel = this.getView().getModel();
				var aFilters = [new Filter("Grade", sap.ui.model.FilterOperator.EQ, sBarcode)];
				var sPath = "/CheckBarSet";
				var that = this;
				sap.ui.core.BusyIndicator.show(0);
				oModel.read(sPath, {
					filters: aFilters,
					success: function (Data) {
						sap.ui.core.BusyIndicator.hide();
						that.getView().byId("barcodeInput").setValue("");
						var oData = Data.results[0];
						that.getView().byId("DiameterInput").setValue(oData.Diameter);
						that.getView().byId("GradeInput").setValue(oData.Grade);
						that.getView().byId("WeightInput").setValue(oData.Weight);
						that.getView().byId("SupplierBatchInput").setValue(oData.SupplierBatch);
						that.getView().byId("heatnumberInput").setValue(oData.HeatNumber);
						//that.getView().byId("idSearchBin").setValue(oData.Bin);

						MessageToast.show("Barcode is Valid!");
						that.getView().byId("DiameterInput").setEnabled(false);
						that.getView().byId("GradeInput").setEnabled(false);
						that.getView().byId("WeightInput").setEnabled(false);
						that.getView().byId("SupplierBatchInput").setEnabled(false);
						that.getView().byId("heatnumberInput").setEnabled(false);

						// Handle successful barcode check here
						console.log(oData);
					},
					error: function (oError) {
						sap.ui.core.BusyIndicator.hide();
						that.getView().byId("barcodeInput").setValue("");
						var sErrorMessage = "An error occurred,Please try again!";

						try {
							var oResponse = JSON.parse(oError.responseText);
							if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
								sErrorMessage = oResponse.error.message.value;
							}
						} catch (e) {
							console.error("Failed to parse error response", e);
						}

						MessageBox.error(sErrorMessage);
						that.byId("barcodeInput").setValue("");
						console.error(oError);
					}
				});
			},
			// Code was coomented because we will not be using camera module
			onScanSuccess: function (oEvent) {
				if (oEvent.getParameter("cancelled")) {
					MessageToast.show("Scan cancelled", {
						duration: 1000
					});
				} else {
					if (oEvent.getParameter("text")) {
						this.getView().byId("barcodeInput").setValue(oEvent.getParameter("text"));
						this.onCheckBarcode(oEvent.getParameter("text"));
					} else {
						MessageToast.show("Scan failed, Please try again!");
					}
				}
			},

			onScanError: function (oEvent) {
				MessageToast.show("Scan failed: " + oEvent, {
					duration: 1000
				});
			},

			onScanLiveupdate: function (oEvent) {
				// User can implement the validation about inputting value
			},
			onFilterInputSearch: function () {

			},

			handleUnitListItemSelect: function (oEvt) {
				var oView = this.getView();
				var oSource = oEvt.getSource();
				var oUnitsList = oView.byId("UnitsList");

				if (oSource.getId() === oUnitsList.getId()) {
					var sUnit = oEvt.getParameters("listItem").listItem.getTitle();

					var oTransfersData = this._transfersSync(oView, {
						BatchUnit: sUnit
					}, true);
					var bDisableNext = !oTransfersData.BatchUnit || !oTransfersData.DeliveryNote;
					this._wizardUIActivate(oView, {
						GoToBatchDetailsBtnEnabled: !bDisableNext
					}, true, true);
				}
			},

			handleSupplierBatchChange: function (oEvt) {
				var oView = oEvt.getSource().getValue();
				var oTransfersData = this._getTransfersData(this.getView());
				var fQuantity = !oTransfersData.BatchQuantity ? NaN : sap.ui.core.format.NumberFormat.getFloatInstance().parse(oTransfersData.BatchQuantity);
				var bDisableNext = !oTransfersData.SupplierBatch || isNaN(fQuantity);
				var bEnableFinish = oTransfersData.NewTransfersCount > 0 && !oTransfersData.SupplierBatch && !oTransfersData.BatchQuantity;
				this._wizardUIActivate(oView, {
					NextBatchDetailsBtnEnabled: !bDisableNext,
					FinishBatchDetailsBtnEnabled: bEnableFinish
				}, true, true);
			},

			handleSupplierBatchInputClear: function (oEvt) {
				var oView = this.getView();
				var oTransfersData = this._transfersSync(oView, {
					SupplierBatch: ""
				}, true);
				// Enable finish button if both fields are empty and there are transfers
				var bEnableFinish = oTransfersData.NewTransfersCount > 0 && !oTransfersData.SupplierBatch && !oTransfersData.BatchQuantity;
				this._wizardUIActivate(oView, {
					NextBatchDetailsBtnEnabled: false,
					FinishBatchDetailsBtnEnabled: bEnableFinish
				}, true, true);
			},
			handleDiameterChange: function (oEvt) {
				var oView = oEvt.getSource().getValue();
				var oTransfersData = this._getTransfersData(this.getView());
				var fQuantity = !oTransfersData.BatchQuantity ? NaN : sap.ui.core.format.NumberFormat.getFloatInstance().parse(oTransfersData.BatchQuantity);
				var bDisableNext = !oTransfersData.SupplierBatch || isNaN(fQuantity);
				var bEnableFinish = oTransfersData.NewTransfersCount > 0 && !oTransfersData.SupplierBatch && !oTransfersData.BatchQuantity;
				this._wizardUIActivate(oView, {
					NextBatchDetailsBtnEnabled: !bDisableNext,
					FinishBatchDetailsBtnEnabled: bEnableFinish
				}, true, true);
			},
			handleDiameterInputClear: function () {
				this.byId("DiameterInput").setValue("");
			},
			handleGradeChange: function (oEvt) {
				var oView = oEvt.getSource().getValue();
				var oTransfersData = this._getTransfersData(this.getView());
				var fQuantity = !oTransfersData.BatchQuantity ? NaN : sap.ui.core.format.NumberFormat.getFloatInstance().parse(oTransfersData.BatchQuantity);
				var bDisableNext = !oTransfersData.SupplierBatch || isNaN(fQuantity);
				var bEnableFinish = oTransfersData.NewTransfersCount > 0 && !oTransfersData.SupplierBatch && !oTransfersData.BatchQuantity;
				this._wizardUIActivate(oView, {
					NextBatchDetailsBtnEnabled: !bDisableNext,
					FinishBatchDetailsBtnEnabled: bEnableFinish
				}, true, true);
			},
			handleGradeInputClear: function () {
				this.byId("GradeInput").setValue("");
			},
			handleWeightChange: function (oEvt) {
				var oView = oEvt.getSource().getValue();
				var oTransfersData = this._getTransfersData(this.getView());
				var fQuantity = !oTransfersData.BatchQuantity ? NaN : sap.ui.core.format.NumberFormat.getFloatInstance().parse(oTransfersData.BatchQuantity);
				var bDisableNext = !oTransfersData.SupplierBatch || isNaN(fQuantity);
				var bEnableFinish = oTransfersData.NewTransfersCount > 0 && !oTransfersData.SupplierBatch && !oTransfersData.BatchQuantity;
				this._wizardUIActivate(oView, {
					NextBatchDetailsBtnEnabled: !bDisableNext,
					FinishBatchDetailsBtnEnabled: bEnableFinish
				}, true, true);
			},
			handleWeightInputClear: function () {
				this.byId("WeightInput").setValue("");
			},
			handleQuantityChange: function (oEvt) {
				var oView = this.getView();
				var oTransfersData = this._getTransfersData(this.getView());

				var fQuantity = !oTransfersData.BatchQuantity ? NaN : sap.ui.core.format.NumberFormat.getFloatInstance().parse(oTransfersData.BatchQuantity);

				var bDisableNext = !oTransfersData.SupplierBatch || isNaN(fQuantity);
				var bEnableFinish = oTransfersData.NewTransfersCount > 0 && !oTransfersData.SupplierBatch && !oTransfersData.BatchQuantity;

				if (isNaN(fQuantity)) {
					oTransfersData.BatchQuantityValueState = sap.ui.core.ValueState.Error;
					oTransfersData.BatchQuantityValueStateText = this._i18nText("errorInvalidNumber");

					jQuery.sap.delayedCall(50, this, function () {
						var oQuantityInput = oView.byId("QuantityInput");
						if (oQuantityInput) {
							oQuantityInput.focus();
							oQuantityInput.selectText(0, 99);
						}
					});
				} else {
					oTransfersData.BatchQuantityValueState = null;
					oTransfersData.BatchQuantityValueStateText = null;
				}
				oView.getModel("Transfers").updateBindings(true);
				this._wizardUIActivate(oView, {
					NextBatchDetailsBtnEnabled: !bDisableNext,
					FinishBatchDetailsBtnEnabled: bEnableFinish
				}, true, true);
			},

			handleQuantityInputClear: function (oEvt) {
				var oView = this.getView();
				var oTransfersData = this._transfersSync(oView, {
					BatchQuantity: null
				}, true);
				// Enable finish button if both fields are empty and there are transfers
				var bEnableFinish = oTransfersData.NewTransfersCount > 0 && !oTransfersData.SupplierBatch && !oTransfersData.BatchQuantity;
				this._wizardUIActivate(oView, {
					NextBatchDetailsBtnEnabled: false,
					FinishBatchDetailsBtnEnabled: bEnableFinish
				}, true, true);
			},
			handleAddBatchDetails: function () {
				var that = this;
				if (!that.getView().byId("idSearchBin").getValue()) {
					MessageBox.error("Please Input BIN before proceed further!")
					return;
				}
				MessageBox.warning("Do you want to save these details and proceed further?", {
					actions: ["Save", "Exit"],
					emphasizedAction: "Save",
					onClose: function (sAction) {
						if (sAction === "Save") {
							// var barCodeArray = {
							// 	diameter: '',
							// 	grade: '',
							// 	weight: '',
							// 	supplier : '',
							// 	heat :'',
							// 	bin :''
							// };
							// that.AddBatch.push(barCodeArray);
							// that.AddBatch[that.AddBatch.length-1]['diameter']=that.getView().byId("DiameterInput").getValue();
							// that.AddBatch[that.AddBatch.length-1]['grade']=that.getView().byId("GradeInput").getValue();
							// that.AddBatch[that.AddBatch.length-1]['weight']=that.getView().byId("WeightInput").getValue();
							// that.AddBatch[that.AddBatch.length-1]['supplier']=that.getView().byId("SupplierBatchInput").getValue();
							// that.AddBatch[that.AddBatch.length-1]['heat']=that.getView().byId("heatnumberInput").getValue();
							// that.AddBatch[that.AddBatch.length-1]['bin']=that.getView().byId("idSearchBin").getValue();
							// that.fnBinCheck(that.getView().byId("idSearchBin").getValue()); //++T-singhag1 imapct gap144
							that._transfersAddTransfer(that.getView());

							that.getView().byId("barcodeInput").setValue("");
							that.getView().byId("DiameterInput").setValue("");
							that.getView().byId("GradeInput").setValue("");
							that.getView().byId("WeightInput").setValue("");
							that.getView().byId("SupplierBatchInput").setValue("");
							that.getView().byId("heatnumberInput").setValue("");
							that.getView().byId("barcodeInput").focus();
							//that.getView().byId("idSearchBin").setValue("");
							// jQuery.sap.delayedCall(100, this, function () {
							// 	var oPOSelectInput = that.getView().byId("barcodeInput");
							// 	if (oPOSelectInput) {
							// 		oPOSelectInput.focus();
							// 		//oPOSelectInput.selectText(0, 99);
							// 	}
							// });

						} else {
							that.onExit();
						}

					},
					dependentOn: this.getView()
				});
			},
			onExit: function () {

			},
			handleheatnumberInputClear: function () {
				this.byId("heatnumberInput").setValue("");
			},

			handleGoToPOSelect: function (oEvt) {
				this._wizardJumpToPOSelect(this.getView());
			},

			handleGoToPOItems: function (oEvt) {
				this._wizardJumpToPOItems(this.getView());
			},

			handleGoToBatchDetails: function (oEvt) {
				this._wizardJumpToBatchDetails(this.getView());
			},
			//clearing Input fields
			handleInputClear: function (oEvent) {
				var oSource = oEvent.getSource(); // Get the input field that triggered the event
				var oModel = this.getView().getModel("Transfers"); // Get the model
				var sBindingPath = oSource.getBinding("value").getPath(); // Get the bound property path
			
				// Clear the value of the corresponding model property
				oModel.setProperty(sBindingPath, "");
			},
			//set property of values on Enter 
			handleLiveChange: function (oEvent) {
				var oSource = oEvent.getSource(); // Get the input field that triggered the event
				var oModel = this.getView().getModel("Transfers"); // Get the model
				var sBindingPath = oSource.getBinding("value").getPath(); // Get the bound property path
				var sNewValue = oSource.getValue(); // Get the new value typed by the user
			
				// Set the value in the model immediately
				oModel.setProperty(sBindingPath, sNewValue);
			},
			
			

			handleBatchDetailsBack: function (oEvt) {
				this.getView().byId("DeliveryNoteInput").setValue("");
				this.getView().byId("barcodeInput").setValue("");
				this.getView().byId("DiameterInput").setValue("");
				this.getView().byId("GradeInput").setValue("");
				this.getView().byId("WeightInput").setValue("");
				this.getView().byId("SupplierBatchInput").setValue("");
				this.getView().byId("heatnumberInput").setValue("");
				this.getView().byId("idSearchBin").setValue("");
				this.getView().byId("usedcap").setText("");
					this.getView().byId("totalcap").setText("");
				this._transfersClear(this.getView(), {
					NewTransfers: true
				});
				this._wizardJumpToCommonValues(this.getView());
			},

			handleBatchDetailsNext: function (oEvt) {
				this._transfersAddTransfer(this.getView());
			},
			onManual: function () {
				// this.getView().byId("DiameterInput").setEnabled(true);
				// this.getView().byId("GradeInput").setEnabled(true);
				// this.getView().byId("WeightInput").setEnabled(true);
				// this.getView().byId("SupplierBatchInput").setEnabled(true);
				// this.getView().byId("heatnumberInput").setEnabled(true);
				// this.getView().byId("idSearchBin").setEnabled(true);
				var oView = this.getView();
				var aInputIds = [
					"DiameterInput",
					"GradeInput",
					"WeightInput",
					"SupplierBatchInput",
					"heatnumberInput"
					//"idSearchBin"
				];
				
				// Get the current state of any one field (assuming they all have the same state)
				var bEnabled = oView.byId(aInputIds[0]).getEnabled();
				
				// Toggle the enabled state for all inputs
				aInputIds.forEach(function (sId) {
					oView.byId(sId).setEnabled(!bEnabled);
				});	
			},
			/*For Preview of Barcode*/
			onPreview: function () {
				var oView = this.getView();
				var oTransfersModel = oView.getModel("Transfers");
				var oTransfers = oTransfersModel.getData();
				var oPreviewList = sap.ui.getCore().byId("previewList");
				var oPreviewJsonModel = new sap.ui.model.json.JSONModel(oTransfers.NewTransfers); // Only set data here.
				oPreviewList.setModel(oPreviewJsonModel);
				this.PreviewFilter.open();

			},
			/*To Delete Scanned Barcodes*/
			onClearAll: function () {
				this.getView().byId("barcodeInput").setValue("");
				this.getView().byId("DiameterInput").setValue("");
				this.getView().byId("GradeInput").setValue("");
				this.getView().byId("WeightInput").setValue("");
				this.getView().byId("SupplierBatchInput").setValue("");
				this.getView().byId("heatnumberInput").setValue("");
				this.getView().byId("idSearchBin").setValue("");
				this.getView().byId("usedcap").setText("");
				this.getView().byId("totalcap").setText("");
			},
			/*Deletion of Scanned Barcodes*/
			onDeleteBarcode: function (e) {
				//var oItem = oEvent.getSource().getParent();

				// var sPath = e.getSource().getSelectedItem().getBindingContext().getObject();
				// var oModel = sap.ui.getCore().byId("previewList").getModel();
				// var aBarcodes = oModel.getProperty("/barcodes");
				// var iIndex = sPath.split("/").pop();
				// aBarcodes.splice(iIndex, 1);
				// oModel.setProperty("/barcodes", aBarcodes);

				var path = e.getParameter('listItem').getBindingContext().getPath();
				var idx = parseInt(path.substring(path.lastIndexOf('/') + 1));
				var m = sap.ui.getCore().byId("previewList").getModel();
				var d = m.getData();
				d.splice(idx, 1);
				m.setData(d);
			},
			/*For Preview of Barcode*/
			onClosePreview: function () {
				this.PreviewFilter.close();
			},
			handleBatchDetailsFinish: function (oEvt) {
				this._transfersFinishTransfer(this.getView());
			},

			handleResetToPOSelect: function (oEvt) {
				this._transfersReset(this.getView(), true);
				this._wizardResetToPOSelect(this.getView());
				//this.getView().byId("idSearchBin").setValue('');
				this.getView().byId("barcodeInput").setValue('');
			},
			handleResetToPOItems: function (oEvt) {
				this._resetToPoItems(this.getView());
				//this.getView().byId("idSearchBin").setValue('');
				this.getView().byId("barcodeInput").setValue('');

			},
			handleUploadPress: function () {
				// Get the PurchaseOrder and Item values (You may need to adjust based on your UI structure)
				var sPurchaseOrder = this.getView().getModel('Transfers').getData().PurchaseOrder;

				var sItem = this.getView().getModel('Transfers').getData().PurchaseOrderItem;
				var sDelNote = this.getView().getModel('Transfers').getData().DeliveryNote;
				// Reference to the list
				var oFileList = sap.ui.getCore().byId("itemlist");

				// Define filter criteria for the OData service call
				var aFilters = [];
				if (sPurchaseOrder) {
					aFilters.push(new sap.ui.model.Filter("PurDoc", sap.ui.model.FilterOperator.EQ, sPurchaseOrder));
				}
				if (sItem) {
					aFilters.push(new sap.ui.model.Filter("PurItem", sap.ui.model.FilterOperator.EQ, sItem));
				}
				if (sDelNote) {
					aFilters.push(new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, sDelNote));
				}
				oFileList.setBusy(true);
				var oModel = this.getView().getModel();
				oModel.read("/zfileset", {
					filters: aFilters,
					success: function (oData) {
						// Bind the returned data to the table
						var oListModel = new sap.ui.model.json.JSONModel(oData.results);
						oFileList.setModel(oListModel, "Data");

						// Turn off busy indicator
						oFileList.setBusy(false);

						// Show success message
						sap.m.MessageToast.show("File list refreshed");
					},
					error: function (oError) {
						// Turn off busy indicator
						oFileList.setBusy(false);

						// Show error message
						sap.m.MessageToast.show("Error refreshing file list");
					}
				});

				// Open the filter dialog
				this.Filter.open();
				//this.Filter.open()
			},
			onCancelFilter: function () {
				this.Filter.close()
			},
			onCloseDialog: function () {
				this._getDialog.close();
			},
			_getDialog: function () {

				if (!this._oDialog1) {
					this._oDialog1 = sap.ui.xmlfragment("com.ami.zmobgrpo.view.Fragments.FileUploader", this);
					this.getView().addDependent(this._oDialog1);
				}
				this._oDialog1.open();
			},
			_stepToPoItems: function (oView, oPurchaseOrder, oFromDialog) {
				this._transfersSync(oView, oPurchaseOrder, true, true);

				var oItemsList = oView.byId("POItemsList");
				var oItemsListItem = oView.byId("POItemsListItem").clone();
				oItemsListItem.setVisible(true);
				var aFilters = [new Filter("PurchaseOrder", sap.ui.model.FilterOperator.EQ, oPurchaseOrder.PurchaseOrder)];

				oView.setBusy(true);
				oItemsList.bindAggregation("items", {
					path: "/C_PurchaseOrderItemMoni(P_DisplayCurrency='EUR')/Results",
					filters: aFilters,
					template: oItemsListItem,
					templateShareble: false,
					events: {
						change: function (oEvt1) {},
						dataReceived: function (oEvt1) {
							sPlant = oEvt1.getParameters().data.results[0].Plant;
							sStorage = oEvt1.getParameters().data.results[0].StorageLocation;

							if (oFromDialog) {
								oFromDialog.close();
							}
							oView.setBusy(false);
							this._wizardJumpToPOItems(oView);
						}.bind(this)
					}
				});
			},

			_resetToPoItems: function (oView) {
				var oTransfersModel = oView.getModel("Transfers");
				var oTransfersData = oTransfersModel.getData();
				var sCurrentPO = oTransfersData.PurchaseOrder;
				this._transfersReset(this.getView(), false);
				oTransfersData.PurchaseOrder = sCurrentPO;
				oTransfersModel.updateBindings(true);


				// we need to rebind the list so new values are refreshed
				var oItemsList = oView.byId("POItemsList");
				var oItemsListItem = oView.byId("POItemsListItem").clone();
				oItemsListItem.setVisible(true);
				var aFilters = [new Filter("PurchaseOrder", sap.ui.model.FilterOperator.EQ, sCurrentPO)];

				oView.setBusy(true);
				oItemsList.bindAggregation("items", {
					path: "/C_PurchaseOrderItemMoni(P_DisplayCurrency='EUR')/Results",
					filters: aFilters,
					template: oItemsListItem,
					templateShareble: false,
					events: {
						change: function (oEvt1) {},
						dataReceived: function (oEvt1) {
							oView.setBusy(false);
							this._wizardResetToPOItems(oView);
						}.bind(this)
					}
				});
			},

			_stepToCommonValues: function (oView, oPurchaseOrderItem) {
				this._transfersSync(oView, oPurchaseOrderItem, true, true);
				this._wizardJumpToCommonValues(oView);
			},

			_wizardResetToPOSelect: function (oView) {
				var oWizard = oView.byId("GRWizard");
				this._wizardUIActivate(oView, {
					POSelectStepActive: true
				}, true);

				var oPOSelectStep = oView.byId("POSelect");
				oWizard.goToStep(oPOSelectStep);
				oWizard.discardProgress(oPOSelectStep, false);

				jQuery.sap.delayedCall(100, this, function () {
					var oPOSelectInput = oView.byId("POSelectInput");
					if (oPOSelectInput) {
						oPOSelectInput.focus();
						oPOSelectInput.selectText(0, 99);
					}
				});
			},

			_wizardJumpToPOSelect: function (oView) {
				var oWizard = oView.byId("GRWizard");
				this._wizardUIActivate(oView, {
					POSelectStepActive: true
				}, true);

				var oPOSelectStep = oView.byId("POSelect");
				oWizard.goToStep(oPOSelectStep);
				oWizard.discardProgress(oPOSelectStep, false);

				jQuery.sap.delayedCall(100, this, function () {
					var oPOSelectInput = oView.byId("POSelectInput");
					if (oPOSelectInput) {
						oPOSelectInput.focus();
						oPOSelectInput.selectText(0, 99);
					}
				});
			},

			_wizardJumpToPOItems: function (oView) {
				var oWizard = oView.byId("GRWizard");
				var sCurrentStepId = oWizard.getCurrentStep();
				var oPOSelectStep = oView.byId("POSelect");
				this._wizardUIActivate(oView, {
					POItemsSelectStepActive: true,
					GoToPOSelectBtnVisible: true
				}, true);

				if (sCurrentStepId === oPOSelectStep.getId()) {
					oPOSelectStep.setValidated();
					oWizard.nextStep();
				} else {
					var oPOItemSelectStep = oView.byId("POItemSelect");
					oWizard.goToStep(oPOItemSelectStep);
					oWizard.discardProgress(oPOItemSelectStep, false);
				}
			},

			_wizardResetToPOItems: function (oView) {
				var oWizard = oView.byId("GRWizard");
				this._wizardUIActivate(oView, {
					POItemsSelectStepActive: true,
					GoToPOSelectBtnVisible: true
				}, true);
				var oPOItemSelectStep = oView.byId("POItemSelect");
				oWizard.goToStep(oPOItemSelectStep);
				oWizard.discardProgress(oPOItemSelectStep, false);
			},

			_wizardJumpToCommonValues: function (oView) {
				var oWizard = oView.byId("GRWizard");
				var sCurrentStepId = oWizard.getCurrentStep();
				var oPOItemSelectStep = oView.byId("POItemSelect");
				this._wizardUIActivate(oView, {
					EntriesCommonStepActive: true,
					GoToPOItemsSelectBtnVisible: true,
					GoToBatchDetailsBtnVisible: true
				}, true);

				if (sCurrentStepId === oPOItemSelectStep.getId()) {
					oPOItemSelectStep.setValidated();
					oWizard.nextStep();
				} else {
					var oCommonValuesStep = oView.byId("EntriesCommon");
					oWizard.goToStep(oCommonValuesStep);
					oWizard.discardProgress(oCommonValuesStep, false);
				}

				jQuery.sap.delayedCall(100, this, function () {
					var oPOSelectInput = oView.byId("DeliveryNoteInput");
					if (oPOSelectInput) {
						oPOSelectInput.focus();
						oPOSelectInput.selectText(0, 99);
					}
				});
			},

			_wizardJumpToBatchDetails: function (oView) {
				var oWizard = oView.byId("GRWizard");
				var sCurrentStepId = oWizard.getCurrentStep();
				var oEntriesCommonStep = oView.byId("EntriesCommon");
				this._wizardUIActivate(oView, {
					BatchDetailsStepActive: true,
					BatchDetailsBackBtnVisible: true,
					NextBatchDetailsBtnVisible: true,
					FinishBatchDetailsBtnVisible: true
				}, true);

				if (sCurrentStepId === oEntriesCommonStep.getId()) {
					oEntriesCommonStep.setValidated();
					oWizard.nextStep();
				} else {
					var oBatchDetailsStep = oView.byId("BatchDetails");
					oWizard.goToStep(oBatchDetailsStep);
					oWizard.discardProgress(oBatchDetailsStep, false);
				}

				jQuery.sap.delayedCall(100, this, function () {
					var oPOSelectInput = oView.byId("SupplierBatchInput");
					if (oPOSelectInput) {
						oPOSelectInput.focus();
						oPOSelectInput.selectText(0, 99);
					}
				});
				jQuery.sap.delayedCall(100, this, function () {
					var oPOSelectInput = oView.byId("barcodeInput");
					if (oPOSelectInput) {
						oPOSelectInput.focus();
						//oPOSelectInput.selectText(0, 99);
					}
				});
			},

			_wizardJumpToSuccess: function (oView) {
				var oWizard = oView.byId("GRWizard");
				var sCurrentStepId = oWizard.getCurrentStep();
				var oBatchDetailsStep = oView.byId("BatchDetails");

				this._wizardUIActivate(oView, {
					MovementSuccessStepActive: true,
					ResetToPOSelectBtnVisible: true,
					ResetToPOItemsBtnVisible: true
				}, true);

				if (sCurrentStepId === oBatchDetailsStep.getId()) {
					oBatchDetailsStep.setValidated();
					oWizard.nextStep();
				} else {
					var oSuccessStep = oView.byId("MovementSuccess");
					oWizard.goToStep(oSuccessStep);
				}


			},

			_wizardUIActivate: function (oView, oProps, bUpdateBindings, bKeep) {
				var oWizardUIModel = oView.getModel("WizardUI");
				var oWizardUI = oWizardUIModel.getData();
				for (var k in oWizardUI) {
					if (oWizardUI.hasOwnProperty(k)) {
						var bVal = bKeep && oWizardUI[k] ? oWizardUI[k] : false;
						oWizardUI[k] = oProps.hasOwnProperty(k) ? oProps[k] : bVal;
					}
				}
				if (bUpdateBindings) {
					oWizardUIModel.updateBindings(true);
				}
				return oWizardUI;
			},

			_getTransfersData: function (oView) {
				var oTransfersModel = oView.getModel("Transfers");
				return oTransfersModel.getData();
			},

			_transfersSync: function (oView, oProps, bUpdateBindings, bClear) {
				var oTransfersModel = oView.getModel("Transfers");
				var oTransfers = oTransfersModel.getData();
				for (var k in oTransfers) {
					if (oTransfers.hasOwnProperty(k)) {
						oTransfers[k] = bClear ? null : oTransfers[k];
						oTransfers[k] = oProps.hasOwnProperty(k) ? oProps[k] : oTransfers[k];
					}
				}
				if (bUpdateBindings) {
					oTransfersModel.updateBindings(true);
				}
				return oTransfers;
			},

			_transfersClear: function (oView, oProps, bUpdateBindings) {
				var oTransfersModel = oView.getModel("Transfers");
				var oTransfers = oTransfersModel.getData();
				for (var k in oTransfers) {
					if (oProps.hasOwnProperty(k)) {
						oTransfers[k] = null;
					}
				}
				if (bUpdateBindings) {
					oTransfersModel.updateBindings(true);
				}
				return oTransfers;
			},

			_transfersReset: function (oView, bUpdateBindings) {
				var oTransfersModel = oView.getModel("Transfers");
				var oTransfers = oTransfersModel.getData();
				oTransfers.PurchaseOrder = "";
				oTransfers.PurchaseOrderItem = "";
				oTransfers.Material = "";
				oTransfers.StorageLocation = "";
				oTransfers.Plant = "";
				oTransfers.StockType = "";
				oTransfers.Supplier = "";
				oTransfers.DeliveryNote = "";
				oTransfers.BatchUnit = "";
				oTransfers.BatchQuantity = "";
				oTransfers.SupplierBatch = "";
				oTransfers.NewTransfersCount = null;
				oTransfers.NewTransfers = [];
				oTransfers.MaterialDocument = null;
				oTransfers.MaterialDocumentYear = null;
				oTransfers.Bin = null; //++T_mItraan
				if (bUpdateBindings) {
					oTransfersModel.updateBindings(true);
				}
				return oTransfers;
			},

			_transfersFinishTransfer: function (oView) {

				this._transfersPostModel(oView);
			},

			_transfersAddTransfer: function (oView, oProps) {
				var oTransfersModel = oView.getModel("Transfers");
				var oTransfers = oTransfersModel.getData();

				var fQuantity = !oTransfers.BatchQuantity ? NaN : sap.ui.core.format.NumberFormat.getFloatInstance().parse(oTransfers.BatchQuantity);

				if (!oTransfers.Weight || oTransfers.Weight === 0 || oTransfers.Weight.trim() === "" || Number(oTransfers.Weight) <= 0) {
					MessageToast.show("Weight cannot be null, zero, or blank!");
					return;
				}
				this.fnBinCheck(this.getView().byId("idSearchBin").getValue()); //++T-singhag1 imapct gap144	
				oTransfersModel.updateBindings(true);

				if (oTransfers.NewTransfers && oTransfers.NewTransfers.push) {
					oTransfers.NewTransfers.push({
						BatchSubItem: oTransfers.NewTransfers.length + 1,
						BatchQuantity: oTransfers.BatchQuantity,
						BatchUnit: oTransfers.BatchUnit,
						SupplierBatch: oTransfers.SupplierBatch,
						Diameter: oTransfers.Diameter,
						Grade: oTransfers.Grade,
						HeatNumber: oTransfers.HeatNumber,
						Weight: oTransfers.Weight,
						Bin: oTransfers.Bin,
						ValueState: null,
						ValueStateText: null
					});
				} else {
					oTransfers.NewTransfers = [{
						BatchSubItem: 1,
						BatchQuantity: oTransfers.BatchQuantity,
						BatchUnit: oTransfers.BatchUnit,
						SupplierBatch: oTransfers.SupplierBatch,
						Diameter: oTransfers.Diameter,
						Grade: oTransfers.Grade,
						HeatNumber: oTransfers.HeatNumber,
						Weight: oTransfers.Weight,
						Bin: oTransfers.Bin,
						ValueState: null,
						ValueStateText: null
					}];
				}

				oTransfers.NewTransfersCount = oTransfers.NewTransfers.length;

				this._wizardUIActivate(oView, {
					NextBatchDetailsBtnEnabled: false,
					FinishBatchDetailsBtnEnabled: oTransfers.NewTransfersCount > 0
				}, true, true);

				// jQuery.sap.delayedCall(100, this, function () {
				// 	var oSupplierBatchInput = oView.byId("SupplierBatchInput");
				// 	if (oSupplierBatchInput) {
				// 		oSupplierBatchInput.focus();
				// 		oSupplierBatchInput.selectText(0, 99);
				// 	}
				// });
			},

			_transfersPostModel: function (oView) {

				var dia = this.getView().byId("DiameterInput").getValue();
				var grade = this.getView().byId("GradeInput").getValue();
				var weight = this.getView().byId("WeightInput").getValue();
				var batch = this.getView().byId("SupplierBatchInput").getValue();
				var heat = this.getView().byId("heatnumberInput").getValue();
				// if (!dia || !grade || !weight || !batch || !heat) {
				// 	MessageBox.error("Please Input all the details before proceed further!")
				// }
				if (dia || grade || weight || batch || heat) {
					if (!this.getView().byId("idSearchBin").getValue()) {
						MessageBox.error("Please Input BIN before proceed further!")
						return;
					}
					// this._transfersAddTransfer(this.getView()); //++ T_mitraan removing next button direct 
				}
				
				var sFilenames;
				var oModel = oView.getModel();
				// Get the model data from "itemlist"
				// if (sap.ui.getCore().byId("itemlist").getModel("Data").getData()) {
				// 	var Attachset = sap.ui.getCore().byId("itemlist").getModel("Data").getData();

				// 	// Join filenames if data is an array
				// 	var sFilenames = Attachset.reduce((acc, item) => item.Filename ? acc.concat(item.Filename) : acc, []).join(", ");
				// }
				// Check if data exists and is a non-empty array
				if (sap.ui.getCore().byId("itemlist").getModel("Data") === undefined) {
					MessageBox.error("Please upload an attachment to proceed further.");
					return;
				}else{
				var data = sap.ui.getCore().byId("itemlist").getModel("Data").getData();
				}
				if (Array.isArray(data) && data.length > 0) {
					// Specify the property to join (e.g., 'propertyName')
					var propertyValues = data.map(function (item) {
						return item.Filename; // Replace 'propertyName' with your actual property key
					});

					// Join the values with a comma
					var sFilenames = propertyValues.join(", ");
				} else {
					MessageBox.error("Please upload an attachment to proceed further.");
					return;
				}
				if(!sFilenames){
					MessageBox.error("Please upload an attachment to proceed further.");
					return;
				}
				if (dia || grade || weight || batch || heat) { 
					// If at least one value is entered, ensure all fields are filled
					if (!weight || weight === 0 || weight.trim() === "" || Number(weight) <= 0) {
						MessageToast.show("Weight cannot be null, zero, or blank!");
						return;
					}
					if (!dia || !grade || !weight || !batch || !heat) {
						MessageBox.error("Please input all the details before proceeding further!");
						return;
					} else {
						// If all fields are filled, proceed with the function
						this._transfersAddTransfer(this.getView());
					}
				} 
				//this._transfersAddTransfer(this.getView()); //++ T_mitraan removing next button direct 
				var oTransfersModel = oView.getModel("Transfers");
				var oTransfers = oTransfersModel.getData();
				// if (!oTransfers.Bin) {
				// 	MessageBox.error("Please Input BIN before proceed further!")
				// 	return;
				// }
				var aGRItems = [];
				oTransfers.NewTransfers.forEach(function (oNewTransfer) {
					// var fQuantity =  sap.ui.core.format.NumberFormat.getFloatInstance().parse(oNewTransfer.BatchQuantity);
					// var sQuantity = fQuantity.toString();
					aGRItems.push({
						PurchaseOrder: oTransfers.PurchaseOrder,
						PurchaseOrderItem: oTransfers.PurchaseOrderItem,
						SubItem: "" + (oNewTransfer.BatchSubItem - 1),
						//Quantity: sQuantity,
						//QuantityUnit: oNewTransfer.BatchUnit,
						Plant: oTransfers.Plant,
						StockType: !oTransfers.StockType ? "" : oTransfers.StockType,
						Supplier: oTransfers.Supplier,
						StorageLocation: oTransfers.StorageLocation,
						Material: oTransfers.Material,
						SupplierBatch: oNewTransfer.SupplierBatch,
						Diameter: oNewTransfer.Diameter,
						Grade: oNewTransfer.Grade,
						HeatNumber: oNewTransfer.HeatNumber,
						Weight: oNewTransfer.Weight,
						Bin: oNewTransfer.Bin

					});
				});

				var oGRHeader = {
					PurchaseOrder: oTransfers.PurchaseOrder,
					DeliveryNote: oTransfers.DeliveryNote,
					Filename: sFilenames,
					"to_GRItems": aGRItems
				};

				oView.setBusy(true);
				oModel.create("/GRHeaders", oGRHeader, {
					success: jQuery.proxy(this._handleGRSuccess, this),
					error: jQuery.proxy(this._handleGRError, this)
				});



				var oList = this.getView().byId("batchList");
				var oJsonModel = new sap.ui.model.json.JSONModel(aGRItems); // Only set data here.
				oList.setModel(oJsonModel); // set the alias here

			},

			_handleGRSuccess: function (oData, oResponse) {
				var oView = this.getView();
				oView.setBusy(false);
				var oTransfersModel = oView.getModel("Transfers");
				var oTransfersData = oTransfersModel.getData();
				this.getView().byId("usedcap").setText("");				//++T_Singhag1
					this.getView().byId("totalcap").setText("");		//++T_Singhag1
					this.getView().byId("idSearchBin").setValue("");
				if (oData.MaterialDocument && oData.MaterialDocumentYear) {
					oTransfersData.MaterialDocument = oData.MaterialDocument;
					oTransfersData.MaterialDocumentYear = oData.MaterialDocumentYear;
					oTransfersModel.updateBindings(true);
					this._wizardJumpToSuccess(oView);
					return;
				}

				if (oData.to_GRItems && oData.to_GRItems.results) {
					var aGRItems = oData.to_GRItems.results;
					if (aGRItems.forEach) {
						aGRItems.forEach(function (oGRItem) {
							var iTransferIndex = oTransfersData.NewTransfers.findIndex(oItem => oItem.BatchSubItem == oGRItem.SubItem + 1); // by intent we use ==
							if (iTransferIndex >= 0) {
								switch (oGRItem.ItemState) {
									case "A":
									case "E":
									case "X":
										oTransfersData.NewTransfers[iTransferIndex].ValueState = sap.ui.core.ValueState.Error;
										oTransfersData.NewTransfers[iTransferIndex].ValueStateText = oGRItem.ItemStateText;
										break;
									case "S":
										oTransfersData.NewTransfers[iTransferIndex].ValueState = sap.ui.core.ValueState.Success;
										oTransfersData.NewTransfers[iTransferIndex].ValueStateText = null;
										break;
									default:
										oTransfersData.NewTransfers[iTransferIndex].ValueState = null;
										oTransfersData.NewTransfers[iTransferIndex].ValueStateText = null;
								}
							}
						});
					}
				}

				oTransfersModel.updateBindings(true);

				var oHeader = oResponse.headers["sap-message"];
				if (oHeader) {
					var oJson = JSON.parse(oHeader);
					this._showErrorMessageWithTransfers(oView, this._i18nText("errorCodeMsg", oJson.code, oJson.message));
				}
			},

			_handleGRError: function (oError) {
				var oView = this.getView();
				//++T_singhag1 BOC
				oView.getModel("Transfers").getData().NewTransfers.pop();
				this.getView().byId("barcodeInput").setValue("");
				this.getView().byId("DiameterInput").setValue("");
				this.getView().byId("GradeInput").setValue("");
				this.getView().byId("WeightInput").setValue("");
				this.getView().byId("SupplierBatchInput").setValue("");
				this.getView().byId("heatnumberInput").setValue("");
					this.getView().byId("usedcap").setText("");				//++T_Singhag1
					this.getView().byId("totalcap").setText("");		//++T_Singhag1
					this.getView().byId("idSearchBin").setValue("");		
				//++T_singhag1 EOC removing last occuring object on multiple finish button touch.
				oView.setBusy(false);
				if (oError.responseText) {
					var oJson = JSON.parse(oError.responseText);
					if (oJson.error) {
						var oSrvError = oJson.error;
						if (oSrvError.code && oSrvError.message) {
							this._showErrorMessage(oView, oError.message, "<p><strong>" + oSrvError.code + "</strong> - " + oSrvError.message.value + "</p>");
						} else {
							this._showErrorMessage(oView, oError.message);
						}
					}
				} else {
					this._showErrorMessage(oView, oError.message);
				}
			},

			_showErrorMessage: function (oView, sMessageText, sDetails) {
				MessageBox.error(sMessageText, {
					title: this._i18nText("errorMessageDialogTitle"),
					id: "messageBoxId2",
					details: sDetails,
					styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer"
				});
			},

			_showErrorMessageWithTransfers: function (oView, sMessageText) {
				var oTransfersData = this._getTransfersData(oView);
				var sDetails = "<p><strong>" + this._i18nText("errorAffectedItems") + "</strong></p>\n<ul>";

				oTransfersData.NewTransfers.forEach(function (oTransfer) {
					if (oTransfer.ValueState === sap.ui.core.ValueState.Error) {
						sDetails += "<li>" + oTransfer.BatchSubItem + " - ";
						sDetails += !oTransfer.ValueStateText ? this._i18nText("errorAffectedItems") : oTransfer.ValueStateText;
						sDetails += "</li>\n";
					}
				}.bind(this));

				sDetails += "</ul>\n";

				MessageBox.error(sMessageText, {
					title: this._i18nText("errorMessageDialogTitle"),
					id: "messageBoxId2",
					details: sDetails,
					styleClass: "sapUiResponsivePadding--header sapUiResponsivePadding--content sapUiResponsivePadding--footer"
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
			},
			handleUploadComplete: function (oEvent) {
				sap.m.MessageToast.show("File Uploaded");
				var oFileUploader = sap.ui.getCore().byId("fileUploader1");
				oFileUploader.setValue("");

				// Get the PurchaseOrder and Item values (You may need to adjust based on your UI structure)
				var sPurchaseOrder = this.getView().getModel('Transfers').getData().PurchaseOrder;

				var sItem = this.getView().getModel('Transfers').getData().PurchaseOrderItem;
				var sDelNote = this.getView().getModel('Transfers').getData().DeliveryNote;
				// Reference to the list
				var oFileList = sap.ui.getCore().byId("itemlist");

				// Define filter criteria for the OData service call
				var aFilters = [];
				if (sPurchaseOrder) {
					aFilters.push(new sap.ui.model.Filter("PurDoc", sap.ui.model.FilterOperator.EQ, sPurchaseOrder));
				}
				if (sItem) {
					aFilters.push(new sap.ui.model.Filter("PurItem", sap.ui.model.FilterOperator.EQ, sItem));
				}
				if (sDelNote) {
					aFilters.push(new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, sDelNote));
				}

				// Set busy indicator for the list before making the OData call
				oFileList.setBusy(true);
				// Call the OData service to fetch data from ZFILESET
				var oModel = this.getView().getModel(); // Assumes 'Data' model is bound to the OData service
				oModel.read("/zfileset", {
					filters: aFilters,
					success: function (oData) {
						// Update the list with the filtered data
						var oListModel = new sap.ui.model.json.JSONModel(oData.results);
						oFileList.setModel(oListModel, "Data");
						// Turn off busy indicator after success
						oFileList.setBusy(false);
						sap.m.MessageToast.show("File list refreshed");
					},
					error: function (oError) {
						// Turn off busy indicator after success
						oFileList.setBusy(false);
						sap.m.MessageToast.show("Error refreshing file list");
					}
				});
			},

			handleUploadPress1: function () {
				var oFileUploader = sap.ui.getCore().byId("fileUploader1");
				var PO = this.getView().getModel('Transfers').getData().PurchaseOrder;
				var POItem = this.getView().getModel('Transfers').getData().PurchaseOrderItem;
				var DelNote = this.getView().getModel('Transfers').getData().DeliveryNote;

				if (oFileUploader.getValue() === "") {
					MessageToast.show("Please Choose any File");
				}
				oFileUploader.removeAllHeaderParameters();
				oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
					name: "SLUG",
					value: oFileUploader.getValue() + "|" + PO + "|" + POItem + "|" + DelNote
				}));
				oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
					name: "PO",
					value: "12234"
				}));
				var oModell = this.getOwnerComponent().getModel();
				oFileUploader.addHeaderParameter(new sap.ui.unified.FileUploaderParameter({
					name: "x-csrf-token",
					value: oModell.getSecurityToken()
				}));
				oFileUploader.setSendXHR(true);

				oFileUploader.upload();
			},
			fun: function (oEvent) {
				var ctx = oEvent.getSource().getBindingContext("Data");
				var name = ctx.getObject().Filename;
				var sPurchaseOrder = this.getView().getModel('Transfers').getData().PurchaseOrder;
				var sItem = this.getView().getModel('Transfers').getData().PurchaseOrderItem;
				var sDelNote = this.getView().getModel('Transfers').getData().DeliveryNote;
				var mandt = '010';
				//  var oModel = new sap.ui.model.odata.ODataModel("Put path of Odata with destination Here");
				var oModel = this.getOwnerComponent().getModel();
				oModel.getData("/Data");
				var surl = oModel._getServerUrl() + "imageSet(Mandt='" + mandt + "',PurchaseOrder='" + sPurchaseOrder + "',Vbeln='" + sDelNote + "',PurchaseOrderItem='" + sItem + "',Filename='" + name + "')/$value";
				this.onPressButton(surl);
			},
			onPressButton(sURL) {
				//const sURL = 'https://i.imgur.com/q6E7b9d.png';
				fetch(sURL)
					.then((oResponse) => oResponse.blob())
					.then((oBlob) => {
						const sBlobURL = URL.createObjectURL(oBlob);
						const oLink = document.createElement('a');
						oLink.href = sBlobURL;
						oLink.download = sURL.split('/').pop();
						oLink.target = '_blank';
						document.body.appendChild(oLink);
						oLink.click();
						document.body.removeChild(oLink);
					});
			},
			onUploadFile: function () {
				var oFileUpload =
					sap.ui.getCore().byId("fileUploaderFS");
				if (oFileUpload.getValue() === "") {
					MessageToast.show("Please Choose any File");
				}
				var domRef = oFileUpload.getFocusDomRef();
				var file = domRef.files[0];
				var that = this;

				//This code is used for uploading image or document file

				this.fileName =
					sap.ui.getCore().byId("fileUploaderFS").getValue();
				this.fileType = file.type;

				var reader = new FileReader();
				reader.onload = function (e) {
					var vContent = e.currentTarget.result

					that.uploadFile(that.fileName, that.fileType, vContent);

					reader.readAsDataURL(file);
				}

				reader.onerror = function (ex) {
					console.log(ex);
				};

				reader.readAsBinaryString(file);

			},
			updateFile: function (fileName, fileType, vContent) {
				debugger
				var payLoad = {
					Filename: fileName,
					Mimetype: fileType,
					Value: vContent,
					PurchaseOrder: this.getView().getModel('Transfers').getData().PurchaseOrder,
					PurchaseOrderItem: this.getView().getModel('Transfers').getData().PurchaseOrderItem

				}
				var that = this;
				var serviceurl = "/sap/opu/odata/sap/ZMM_MOBGRPO_N_SRV/";

				var oModel =
					new sap.ui.model.odata.ODataModel(serviceurl);
				oModel.update("/imageSet('" + payLoad.Filename + "')/$value",
					payLoad, {
						method: "PUT",
						success: function (data) {

							sap.m.MessageToast.show("FILE UPDATED SUCCESSFULLY");

						},
						error: function (e) {
							alert("error");
						}
					})
			},
			uploadFile: function (fileName, fileType, vContent) {
				debugger
				var payLoad = {
					Filename: fileName,
					Mimetype: fileType,
					Value: vContent,
					PurchaseOrder: this.getView().getModel('Transfers').getData().PurchaseOrder,
					PurchaseOrderItem: this.getView().getModel('Transfers').getData().PurchaseOrderItem

				}
				var that = this;
				var serviceurl = "/sap/opu/odata/sap/ZMM_MOBGRPO_N_SRV/";

				var oModel =
					new sap.ui.model.odata.ODataModel(serviceurl);
				oModel.create("/imageSet",
					payLoad, {

						success: function (data) {

							sap.m.MessageToast.show("FILE Uploaded SUCCESSFULLY");

						},
						error: function (e) {
							alert("error");
						}
					})
			},
			//For Bin valuhelp imact of GAP 144 
			onBinValueHelpRequest: function () {
				var oView = this.getView();
				var oModel = oView.getModel();

				var oDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
					supportMultiselect: false,
					key: "Bin",
					descriptionKey: "Bin",
					ok: this.onBinValueHelpResultSelect.bind(this),
					cancel: function () {
						this.close();
					},
					afterClose: function () {
						this.destroy();
					}
				});

				// Create a FilterBar with a SearchField
				var oSearchField = new sap.m.SearchField({
					placeholder: "Search...",
					liveChange: function (oEvent) {
						var sQuery = oEvent.getParameter("newValue");
						var oBinding = oDialog.getTable().getBinding("rows") || oDialog.getTable().getBinding("items");
						var aFilters = [];

						if (sQuery) {
							aFilters.push(new sap.ui.model.Filter({
								filters: [
									new sap.ui.model.Filter("Bin", sap.ui.model.FilterOperator.Contains, sQuery)

								],
								and: false
							}));
						}

						oBinding.filter(aFilters);
					}
				});

				var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
					advancedMode: true,
					filterBarExpanded: true,
					search: function () {
						oSearchField.fireSearch();
					},
					filterGroupItems: []
				});

				// Add SearchField to FilterBar's BasicSearch
				oFilterBar.setBasicSearch(oSearchField);

				// Attach FilterBar to ValueHelpDialog
				oDialog.setFilterBar(oFilterBar);

				// Attach Model and Bind Table
				oDialog.setModel(oModel);

				oDialog.getTableAsync().then(function (oTable) {
					oTable.setBusy(true);

					// Define the hardcoded filter query
					var sFilter = encodeURIComponent("(Werks eq 'A300' and Lgort eq 'A311' and Matnr eq '1683')");

					// For sap.ui.table.Table (Desktop)
					if (oTable.bindRows) {
						oTable.addColumn(new sap.ui.table.Column({
							label: new sap.m.Label({
								text: "Storage Bin"
							}),
							template: new sap.m.Text({
								text: "{Bin}"
							})
						}));
						// oTable.addColumn(new sap.ui.table.Column({
						// 	label: new sap.m.Label({ text: "Capacity(Used/Total)" }),
						// 	template: new sap.m.Text({ text: "{Used_capacity}/{Tot_capacity}" })
						// }));

						// Bind rows for sap.ui.table.Table with hardcoded filters
						oTable.bindRows({
							path: "/GETBINSet",
							filters: [
								new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, sPlant),
								new sap.ui.model.Filter("Lgort", sap.ui.model.FilterOperator.EQ, sStorage),
								new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, sMatnr)
							],
							events: {
								dataReceived: function () {
									oTable.setBusy(false);
								}
							}
						});
					}
					// For sap.m.Table (Mobile)
					else if (oTable.bindItems) {
						oTable.addColumn(new sap.m.Column({
							header: new sap.m.Label({
								text: "Storage Bin"
							})
						}));
						// oTable.addColumn(new sap.m.Column({
						// 	header: new sap.m.Label({ text: "Capacity(Used/Total)" })
						// }));

						// Bind items for sap.m.Table with hardcoded filters
						oTable.bindItems({
							path: "/GETBINSet",
							filters: [
								new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, sPlant),
								new sap.ui.model.Filter("Lgort", sap.ui.model.FilterOperator.EQ, sStorage),
								new sap.ui.model.Filter("Matnr", sap.ui.model.FilterOperator.EQ, sMatnr)
							],
							template: new sap.m.ColumnListItem({
								cells: [
									new sap.m.Text({
										text: "{Bin}"
									})
									//new sap.m.Text({ text: "{Used_capacity}/{Tot_capacity}" })
								]
							}),
							events: {
								dataReceived: function () {
									oTable.setBusy(false);
								}
							}
						});
					}
				});

				oDialog.open();
			},

			onBinValueHelpResultSelect: function (oEvent) {
				if (oEvent.getSource().getTable().bindRows) {
					//var aSelectedTokens = JSON.parse(oEvent.getSource().getTable().getBinding().aLastContextData[0]);
					var aSelectedTokens = oEvent.getSource().getTable().getContextByIndex(oEvent.getSource().getTable().getSelectedIndex()).getObject();
				} else if (oEvent.getSource().getTable().bindItems) {
					var aSelectedTokens = oEvent.getSource().getTable().getSelectedItem().getBindingContext().getObject();
				}
				if (aSelectedTokens) {




					var sBin = aSelectedTokens.Bin;
					sUsedCapacity = aSelectedTokens.Used_capacity;
					sRemCapacity = aSelectedTokens.Rem_capacity;
					sTotCapacity = aSelectedTokens.Tot_capacity;

					// Example: Display Selected Values
					sap.m.MessageToast.show("Selected Bin: " + sBin + "\nCapacity: " + sUsedCapacity + "/" + sTotCapacity);

					// Example: Set Values to Input Fields
					this.getView().byId("idSearchBin").setValue(sBin);
					this.getView().byId("usedcap").setText(sUsedCapacity);
					this.getView().byId("totalcap").setText(sTotCapacity);
					this.getView().byId("BatchDetailsFinish").setEnabled(true);
					oEvent.getSource().close();

				};



			},
			onLiveChangeValidateFloat: function (oEvent) {
				var oInput = oEvent.getSource(); // Get the input field
				var sValue = oInput.getValue().trim(); // Get the entered value and remove spaces
				var oModel = this.getView().getModel("Transfers"); // Get the model
				var sBindingPath = oInput.getBinding("value").getPath(); // Get the bound property path
			
				// Regular expression to validate float numbers (allows decimals but not just ".")
				var floatRegex = /^[-+]?\d*\.?\d+$/;
			
				// Check if the value is a valid float
				if (sValue && !floatRegex.test(sValue)) {
					oInput.setValueState("Error");
					oInput.setValueStateText("Please enter a valid decimal number.");
				} else {
					oInput.setValueState("None"); // Reset error state if valid
			
					// Update the model immediately to reflect changes in real-time
					oModel.setProperty(sBindingPath, sValue);
				}
			},

			fnBinCheck: function (bin) {
				// Define the payload
				// var oPayload = {
				//     Bin: bin,
				//     Werks: sPlant,
				//     Lgort: sStorage,
				//     Rem_capacity: sRemCapacity,
				// 	Used_capacity:sUsedCapacity,
				//     Tot_capacity: sTotCapacity
				// };
				// var sPath = "/GETBINSet(Rem_capacity='" + sRemCapacity + 
				// "',Used_capacity='" + sUsedCapacity + 
				// "',Tot_capacity='" + sTotCapacity + 
				// "',Bin='" + bin + "')";
				// Get the OData model
				var oModel = this.getView().getModel(); // Ensure your view has the OData model set

				// // Define the entity set path
				// var sEntitySetPath = "/GETBINSet";

				// // Call the OData create method
				// oModel.create(sEntitySetPath, oPayload, {
				//     success: function (oData, response) {
				//         // Success handler
				//         //sap.m.MessageToast.show("Entity created successfully!");
				//         console.log("Response Data: ", oData);
				//     },
				//     error: function (oError) {
				//         // Error handler
				//         sap.m.MessageBox.error("Failed to check Bin Capacity. Please try again.");
				//         console.error("Error: ", oError);
				//     }
				// });
				var aFilters = [
					new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, sPlant),
					new sap.ui.model.Filter("Lgort", sap.ui.model.FilterOperator.EQ, sStorage),
					new sap.ui.model.Filter("Rem_capacity", sap.ui.model.FilterOperator.EQ, sRemCapacity),
					new sap.ui.model.Filter("Used_capacity", sap.ui.model.FilterOperator.EQ, sUsedCapacity),
					new sap.ui.model.Filter("Tot_capacity", sap.ui.model.FilterOperator.EQ, sTotCapacity)
				];

				var sPath = "/GETBINSet('" + bin + "')"; // 'Bin' is the key
				sap.ui.core.BusyIndicator.show(0);
				oModel.read(sPath, {
					filters: aFilters,
					success: function (oData) {
						sap.ui.core.BusyIndicator.hide();
						console.log("Success", oData);
						//sap.m.MessageToast.show("Data retrieved successfully!");

						// Setting values to respective UI elements
						var oView = this.getView();
						//sBin=oData.Bin;
						sUsedCapacity=oData.Used_capacity;
						sTotCapacity=oData.Tot_capacity;
						sRemCapacity=oData.Rem_capacity
						oView.byId("idSearchBin").setValue(oData.Bin);
						oView.byId("usedcap").setText(oData.Used_capacity);
						oView.byId("totalcap").setText(oData.Tot_capacity);
						
						this.getView().byId("barcodeInput").focus();
							
					}.bind(this), // Bind 'this' to maintain context

					error: function (oError) {
						sap.ui.core.BusyIndicator.hide();
						var sErrorMessage = "An error occurred,Please try again!";

						try {
							var oResponse = JSON.parse(oError.responseText);
							if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
								sErrorMessage = oResponse.error.message.value;
							}
						} catch (e) {
							console.error("Failed to parse error response", e);
						}

						MessageBox.error(sErrorMessage);
						
						console.error(oError);
					}
				});

			}



		});
	});