sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"sap/m/MessageToast",
	"sap/m/MessageBox",
	"sap/ui/comp/valuehelpdialog/ValueHelpDialog",
	"sap/ui/model/json/JSONModel",
	"sap/ui/model/resource/ResourceModel"
], function (Controller, Filter, FilterOperator, MessageToast, MessageBox, ValueHelpDialog, JSONModel,ResourceModel) {
	"use strict";

	return Controller.extend("zmm.zmm_mobpinvn.controller.Main", {
		onInit: function () {
			var oView = this.getView();
			var oModel = oView.getModel();
			this._initFrontEndModel(oView);

			oView.addStyleClass(this.getOwnerComponent().getContentDensityClass());

			// disable clicking on the wizard navigation bar
			this._getWizard(oView)._getProgressNavigator().ontap = function () {};

			oModel.attachMetadataFailed(this.handleMetadataError, this);
			oModel.attachRequestFailed(this.handleRequestFailed, this);
			var sDefaultLanguage = sap.ui.getCore().getConfiguration().getLanguage();
                this._setLanguage(sDefaultLanguage);
		},
		_setLanguage: function (sLanguage) {
			var i18nModel = new ResourceModel({
				bundleName: "zmm.zmm_mobpinvn.i18n.i18n",
				bundleLocale: sLanguage
			});
			this.getView().setModel(i18nModel, "i18n");
		},

		_initFrontEndModel: function (oView) {
			var oFuncModel = new sap.ui.model.json.JSONModel({
				Plant: null,
				StorageLocation: null,
				StorageLocationName: null,
				UnitOfMeasure: null,
				StorageBin: null,
				ReferenceText: null,
				FilteredBinsPath: null,
				CurrentBinExtra: null,
				CurrentBatchDetails: null,
				UnprocessedBinsCount: null,
				PendingBins: null,
				PendingInventoryEntries: null,
				PostedInventoryEntries: null,
				PostedCummulativeQuantity: null,
				MultiBatch: null
			});
			oView.setModel(oFuncModel, "Functional");

			var oWizardUIModel = new sap.ui.model.json.JSONModel({
				GoToBinBtnVisible: true,
				GoToBinBtnEnabled: false,
				BinBackBtnVisible: false,
				BinNextBtnVisible: false,
				BinNextBtnEnabled: false,
				BinInputValueState: null,
				BinInputValueStateText: null,
				BinExtraBackBtnVisible: false,
				BinExtraValidateBtnVisible: false,
				BinExtraValidateBtnEnabled: false,
				BinExtraFinishBtnVisible: false,
				BinExtraFinishBtnEnabled: false,
				BinExtraInputsVisible: false,
				BinExtraNoMoreInputsVisible: false,
				BatchDetailsBackBtnVisible: false,
				BatchDetailsValidateBtnVisible: false,
				BatchDetailsValidateBtnEnabled: false,
				BatchDetailsResetBtnVisible: false,
				BatchDetailsFinishBtnVisible: false,
				BatchDetailsFinishBtnEnabled: false,
				BatchDetailsOverviewBtnVisible: false,
				BatchDetailsOverviewBtnEnabled: false,
				ResultsRestartBtnVisible: false,
				ResultsNewBinBtnVisible: false,
				BatchInputVisible: false,
				BatchInputValueState: null,
				BatchInputValueStateText: null,
				BatchDetailsValidatedQuantityState: null,
				BatchDetailsValidatedQuantityStateText: null,
				SupplierBatchInputVisible: false,
				SupplierBatchEditable: false,
				SupplierBatchInputValueState: null,
				SupplierBatchInputValueStateText: null,
			});
			oView.setModel(oWizardUIModel, "WizardUI");
		},

		handleMetadataError: function (oEvent) {
			var oView = this.getView();
			var oParams = oEvent.getParameters();
			this._uiClearBusy(oView);

			this._showMetadataError(oParams.response);
		},

		handleRequestFailed: function (oEvent) {
			var oView = this.getView();
			var oParams = oEvent.getParameters();

			this._uiClearBusy(oView);

			if (oParams.response.statusCode !== "404" || (oParams.response.statusCode === 404 && oParams.response.responseText.indexOf(
					"Cannot POST") === 0)) {
				this._showServiceError(oParams.response);
			}
		},

		handleStorageLocationSelectionChange: function (oEvt) {
			var oView = this.getView();
			var oItem = oEvt.getParameter("selectedItem");

			if (!oItem) {
				oItem = oEvt.getParameter("listItem");
			}

			if (!oItem) {
				return;
			}

			var oBindingContext = oItem.getBindingContext();
			var oObj = oBindingContext.getObject();

			this._funcSync(oView, oObj, true);
			this._storageLocationStepValidate(this.getView());
		},

		_storageLocationStepValidate: function (oView) {
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			var bDisableNextBtn = !oFunc.StorageLocation || !oFunc.UnitOfMeasure;
			this._wizardUIActivate({
				GoToBinBtnVisible: true,
				GoToBinBtnEnabled: !bDisableNextBtn
			}, true, false);
		},

		handleGoToBin: function (oEvt) {
			var oView = this.getView();
			var oWizard = this._getWizard(oView);
			var oStorageLocationStep = oView.byId("StorageLocationStep");
			var sCurrentStepId = oWizard.getCurrentStep();

			this._wizardSyncBinBranching(oView);

			if (sCurrentStepId === oStorageLocationStep.getId()) {
				oStorageLocationStep.setValidated();
				oWizard.nextStep();
			} else {
				console.log("######################### FIX ME ##############################");
				this._wizardResetToBinStep(oView);
			}

			this._uiFocus(oView, "BinInput", true);
			this._wizardUIActivate({
				BinBackBtnVisible: true
			}, true, false);
		},

		handleBinChange: function (oEvt) {
			var oView = this.getView();
			var oModel = oView.getModel();
			var oFuncModel = this._getFuncModel();
			var oFuncData = oFuncModel.getData();

			var aFilters = [
				new Filter("Plant", "EQ", oFuncData.Plant),
				new Filter("StorageLocation", "EQ", oFuncData.StorageLocation),
				new Filter("StorageBin", "EQ", oFuncData.StorageBin),
				new Filter("AlternativeUnitSAP", "EQ", oFuncData.UnitOfMeasure)
			];

			this._uiSetBusy(oView, {
				BinInput: true,
				ReferenceTextInput: true
			});

			oModel.read("/ZC_WMLSTOG_PINVDAU", {
				method: "GET",
				filters: aFilters,
				success: function (oData) {
					var aStorageBins = oData.results;
					if (!aStorageBins.length || aStorageBins.length === 0) {
						// TODO: add warning message
						this._funcSync(oView, {
							ReferenceText: null
						}, true);
					} else {
						aStorageBins.sort((a, b) => a.Material.localeCompare(b.Material));
						var aFilteredBinsPath = [];

						aStorageBins.forEach(oStorageBin => {
							var sFilteredBinPath = "/ZC_WMLSTOG_PINVDAU(Plant='" + encodeURIComponent(oStorageBin.Plant) + "',StorageLocation='" + encodeURIComponent(oStorageBin.StorageLocation) +
								"',StorageBin='" + encodeURIComponent(oStorageBin.StorageBin) + "',Material='" + encodeURIComponent(oStorageBin.Material)
								+ "',Vendor='" + encodeURIComponent(oStorageBin.Vendor) + "',BaseUnit='" + encodeURIComponent(oStorageBin.BaseUnit) +
								"',AlternativeUnitSAP='" + encodeURIComponent(oStorageBin.AlternativeUnitSAP) + "',HeatNumber='" + encodeURIComponent(oStorageBin.HeatNumber) + "')";
							aFilteredBinsPath.push(sFilteredBinPath);
						});

						this._funcSync(oView, {
							UnprocessedBinsCount: aFilteredBinsPath.length,
							FilteredBinsPath: aFilteredBinsPath.length > 0 ? aFilteredBinsPath : null,
							ReferenceText: oFuncData.StorageBin
						}, true);
					}
					this._binStepValidate(oView);
					this._uiSetBusy(oView, {
						BinInput: false,
						ReferenceTextInput: false
					});
				}.bind(this),
				error: function () {
					this._binStepValidate(oView);
					this._uiSetBusy(oView, {
						BinInput: false,
						ReferenceTextInput: false
					});
				}.bind(this)
			});
		},

		handleReferenceTextChange: function (oEvt) {
			var oView = this.getView();
			this._binStepValidate(oView);
		},

		handleBinBack: function (oEvt) {
			this._resetToStorageLocation(this.getView());
		},

		_binStepValidate: function (oView) {
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			var bDisableNextBtn = !oFunc.StorageBin || !oFunc.ReferenceText;
			this._wizardUIActivate({
				BinNextBtnVisible: true,
				BinNextBtnEnabled: !bDisableNextBtn,
				BinInputValueState: bDisableNextBtn ? "Error" : "",
				BinInputValueStateText: bDisableNextBtn ? this._i18nText("msgNoBinFound") : ""
			}, true, true);
		},

		handleBinConfirm: function (oEvt) {
			var oView = this.getView();

			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			//Commented and added logic For All except A610 and A331 GAP 062 t_singhag1 27.02.2025
			// if (oFunc.StorageLocation === "A620") {
				if (oFunc.StorageLocation !== "A610" && oFunc.StorageLocation !== "A331" && oFunc.StorageLocation !== "A311" && oFunc.StorageLocation !== "A312" && oFunc.StorageLocation !== "A323" && oFunc.StorageLocation !== "A336" && oFunc.StorageLocation !== "A337" && oFunc.StorageLocation !== "A343" && oFunc.StorageLocation !== "A34N") {			
				oFunc.CurrentBinExtra = {
					Plant: oFunc.Plant,
					StorageLocation: oFunc.StorageLocation,
					StorageBin: oFunc.StorageBin
				};
				oFunc.CurrentBatchDetails = {};
				oFuncModel.updateBindings(true);
				this._gotoBatchDetails(oView, false);
				return;
			}

			if (!oFunc.FilteredBinsPath || !oFunc.FilteredBinsPath.length || !oFunc.FilteredBinsPath.length === 0) {
				console.log("######################### FIX ME ##############################");
				return;
			}

			var oModel = oView.getModel();
			var sBinPath = oFunc.FilteredBinsPath.shift();
			var oBin = oModel.getObject(sBinPath);

			oFunc.CurrentBinExtra = Object.assign({
				BinPath: sBinPath,
				ValidatedQuantity: ""
			}, oBin);
			delete oFunc.CurrentBinExtra.__metadata;
			oFuncModel.updateBindings(true);
			
			this._gotoBinExtra(oView);
		},

		handleBinEmpty: function (oEvt) {
			var oView = this.getView();
			var oModel = oView.getModel();
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();

			oFunc.PostedInventoryEntries = [];
			oFunc.PostedCummulativeQuantity = 0;

			var sBatchId = (Math.random() * 1e32).toString(36);
			oModel.setDeferredGroups([sBatchId]);
			oModel.callFunction("/EmptyBin", {
				method: "POST",
				urlParameters: {
					Plant: oFunc.Plant,
					StorageLocation: oFunc.StorageLocation,
					StorageBin: oFunc.StorageBin,
					ReferenceText: oFunc.ReferenceText,
					UnitOfMeasure: oFunc.UnitOfMeasure
				},
				batchGroupId: sBatchId,
				changeSetId: sBatchId
			});

			/*submit batch*/
			oModel.submitChanges({
				batchGroupId: sBatchId,
				success: function (oData, oResponse) {
					if (!oData.__batchResponses || !oData.__batchResponses.length || oData.__batchResponses.length === 0) {
						return;
					}
					var oBatchResponse = oData.__batchResponses.shift();
					if (!oBatchResponse || !oBatchResponse.__changeResponses || !oBatchResponse.__changeResponses.length || !oBatchResponse.__changeResponses
						.length === 0) {
						return;
					}
					var oChangeResponse = oBatchResponse.__changeResponses.shift();
					if (!oChangeResponse) {
						return;
					}
					var oResponseData = oChangeResponse.data;

					if (!oResponseData) {
						return;
					}

					var aResults = oResponseData.results;

					if (!aResults) {
						return;
					}
					aResults.forEach(function (oResult) {
						var oInventoryEntry = Object.assign({}, oResult);
						delete oInventoryEntry.__metadata;
						if (!oInventoryEntry.ErrorCode || oInventoryEntry.ErrorCode == "0") {
							oInventoryEntry.EntryStatus = "Success";
							oInventoryEntry.EntryStatusText = oInventoryEntry.ErrorMessage;
							oInventoryEntry.EntryStatusIcon = "sap-icon://sys-enter-2";
						} else {
							oInventoryEntry.EntryStatus = oInventoryEntry.ErrorType === "E" ? "Error" : "Information";
							oInventoryEntry.EntryStatusText = oInventoryEntry.ErrorMessage;
							oInventoryEntry.EntryStatusIcon = oInventoryEntry.ErrorType === "E" ? "sap-icon://error" : "sap-icon://information";
						}
						oFunc.PostedInventoryEntries.push(oInventoryEntry);
						var fQuantity = parseFloat(oInventoryEntry.Quantity);
						oFunc.PostedCummulativeQuantity += fQuantity;
					});
					oFuncModel.updateBindings(true);
					this._gotoPostResults(oView);
				}.bind(this),
				error: function (oError) {
					this._showServiceError(oError);
				}.bind(this)
			});
		},

		handleBinExtraBack: function (oEvt) {
			this._resetToBin(this.getView());
		},

		handleBinExtraQuantityChange: function (oEvt) {
			var oView = this.getView();
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();

			var fQuantity = sap.ui.core.format.NumberFormat.getFloatInstance().parse(oFunc.CurrentBinExtra.ValidatedQuantity);

			if (isNaN(fQuantity)) {
				// TODO: add not a number handling
			}

			var fAvailQuantity = parseFloat(oFunc.CurrentBinExtra.AlternativeUnitQuantity);

			oFunc.CurrentBinExtra.QuantityComplete = fAvailQuantity === fQuantity;
			oFunc.CurrentBinExtra.RemaningQuantity = fAvailQuantity - fQuantity;

			console.log(oFunc.CurrentBinExtra);
			// TODO: add button enabling
		},

		handleBatchCountInputChange: function (oEvt) {
			var oView = this.getView();
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();

			var fCount = sap.ui.core.format.NumberFormat.getFloatInstance().parse(oFunc.CurrentBinExtra.ValidatedBatchCount);

			var fRefCount = parseFloat(oFunc.CurrentBinExtra.BatchCount);

			oFunc.CurrentBinExtra.CountComplete = fRefCount === fCount;
			oFunc.CurrentBinExtra.RemaningCount = fRefCount - fCount;

			this._wizardUIActivate({
				BinExtraBackBtnVisible: true,
				BinExtraValidateBtnVisible: true,
				BinExtraFinishBtnVisible: true,
				BinExtraValidateBtnEnabled: oFunc.CurrentBinExtra.ValidatedBatchCount > 0,
				BinExtraFinishBtnEnabled: true,
				BinExtraInputsVisible: oFunc.UnprocessedBinsCount > 0,
				BinExtraNoMoreInputsVisible: oFunc.UnprocessedBinsCount === 0
			}, true, false);
		},

		handleBinExtraValidate: function (oEvt) {
			var oView = this.getView();
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			var oModel = oView.getModel();

			if (!oFunc.PendingBins || !oFunc.PendingBins.length) {
				oFunc.PendingBins = [];
			}

			if (!oFunc.CurrentBinExtra.QuantityComplete && !oFunc.CurrentBinExtra.CountComplete) {
				oFunc.CurrentBatchDetails = {};
				oFuncModel.updateBindings(true);
				//Commented and added logic For A610 and A331 GAP 062 t_singhag1 17.03.2025
				// this._gotoBatchDetails(oView, true);
				if (oFunc.StorageLocation === "A610" || oFunc.StorageLocation === "A331"){			
				this._gotoBatchDetails(oView, true);
				}else{
					this._gotoBatchDetails(oView, false);
				}
				//Commented and added logic For A610 and A331 GAP 062 t_singhag1 17.03.2025
				MessageToast.show(this._i18nText("msgBinValidatedMaterialIncomplete"));
				return;
			}

			this._uiSetBusy(oView, {
				BatchCountInput: true
			});
			this._currentBinQuantityCompletePopulatePendingBins(oView, function (aStorageBins, aInventoryEntries) {
					oFunc.UnprocessedBinsCount = oFunc.FilteredBinsPath.length;
					if(oFunc.UnprocessedBinsCount > 0) {
						var sBinPath = oFunc.FilteredBinsPath.shift();
						var oBin = oModel.getObject(sBinPath);
						oFunc.CurrentBinExtra = Object.assign({
							BinPath: sBinPath,
							ValidatedQuantity: ""
						}, oBin);
						delete oFunc.CurrentBinExtra.__metadata;
					}
					oFuncModel.updateBindings(true);
					MessageToast.show(this._i18nText("msgBinValidatedMaterial", aInventoryEntries.length));
					this._wizardUIActivate({
						BinExtraBackBtnVisible: true,
						BinExtraValidateBtnVisible: true,
						BinExtraFinishBtnVisible: true,
						BinExtraValidateBtnEnabled: false,
						BinExtraFinishBtnEnabled: true,
						BinExtraInputsVisible: oFunc.UnprocessedBinsCount > 0,
						BinExtraNoMoreInputsVisible: oFunc.UnprocessedBinsCount === 0
					}, true, false);
					this._uiFocus(oView, "BatchCountInput", true);
					this._uiClearBusy(oView);
				}.bind(this),
				function (oError) {
					var sMsg = !oError.Message ? "" : oError.Message;
					MessageToast.show(this._i18nText("msgBinValidatedMaterialError", sMsg));
					this._uiFocus(oView, "BatchCountInput", true);
					this._uiClearBusy(oView);
				}.bind(this));
		},

		handleBinExtraFinish: function (oEvt) {
			var oView = this.getView();
			this._postPendingInventoryEntries(oView);
		},

		handleBatchDetailsBack: function (oEvt) {
			this._resetToBin(this.getView());
		},

		handleBatchChange: function (oEvt) {
			var oView = this.getView();
			var oSource = oEvt.getSource();
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			var oModel = oView.getModel();

			var sBatch = "";

			var oBatchDetailsBatchInput = oView.byId("BatchDetailsBatchInput");
			var oBatchDetailsSupplierBatchInput = oView.byId("BatchDetailsSupplierBatchInput");

			var aFilters = [
				new Filter("Plant", "EQ", oFunc.Plant),
				new Filter("StorageLocation", "EQ", oFunc.StorageLocation),
				new Filter("AlternativeUnitSAP", "EQ", oFunc.UnitOfMeasure)
			];

			if (oSource === oBatchDetailsBatchInput) {
				sBatch = oFunc.CurrentBatchDetails.Batch;
				aFilters.push(new Filter("Batch", "EQ", sBatch));
			}

			if (oSource === oBatchDetailsSupplierBatchInput) {
				sBatch = oFunc.CurrentBatchDetails.SupplierBatch;
				aFilters.push(new Filter("SupplierBatch", "EQ", sBatch));
			}
			
			// empty input after delete - just clear states
			if(!sBatch) {
				this._wizardUIActivate({
								BatchInputValueState: null,
								BatchInputValueStateText: null,
								SupplierBatchInputValueState: null,
								SupplierBatchInputValueStateText: null
							}, true, true);
				return;
			}

			oModel.read("/ZC_BATCH_PINVD", {
				method: "GET",
				filters: aFilters,
				success: function (oData) {
					var aBatches = oData.results;
					if (!aBatches.length || aBatches.length === 0) {
						this._wizardUIActivate({
							BatchDetailsValidateBtnEnabled: false
						}, false, true);
						if (oSource === oBatchDetailsBatchInput) {
							this._wizardUIActivate({
								BatchInputValueState: "Error",
								BatchInputValueStateText: this._i18nText("msgNoBatchesFound")
							}, true, true);
						}

						if (oSource === oBatchDetailsSupplierBatchInput) {
							this._wizardUIActivate({
								SupplierBatchInputValueState: "Error",
								SupplierBatchInputValueStateText: this._i18nText("msgNoBatchesFound")
							}, true, true);
						}
					} else {
						if (aBatches.length > 1) {
							oFunc.MultiBatch = aBatches;
							oFuncModel.updateBindings(true);

							var oDialog = oView.getDependents().find(oDep => oDep.getId() === "BatchSelectDialog");

							if (!oDialog) {
								oDialog = sap.ui.xmlfragment({
									fragmentName: "zmm.zmm_mobpinvn.view.BatchSelectDialog",
									type: "XML"
								}, this);
								oDialog.attachSearch(function (oEvt1) {
									var sValue = oEvt1.getParameter("value");
									var oBinding = oEvt1.getParameter("itemsBinding");
									oBinding.filter(new Filter([
										new Filter("Batch", FilterOperator.Contains, sValue),
										new Filter("SupplierBatch", FilterOperator.Contains, sValue)
									], false));
								});
								oDialog.setModel(oModel);
								oView.addDependent(oDialog);
							}

							var fnConfirm = function (oEvt1) {
								var aSelectedContexts = oEvt1.getParameter("selectedContexts");
								oDialog.detachConfirm(fnConfirm);
								if (!aSelectedContexts || !aSelectedContexts.length) {
									return;
								}
								var oSelectedContext = aSelectedContexts.shift();
								var oBatch = oSelectedContext.getObject();
								this._syncCurrentBatchDetails(oView, oBatch, true);

								this._wizardUIActivate({
									BatchDetailsValidateBtnEnabled: true,
									BatchInputValueState: null,
									BatchInputValueStateText: null,
									BatchDetailsFinishBtnVisible: true,
									BatchDetailsFinishBtnEnabled: false,
									BatchDetailsOverviewBtnVisible: true,
									BatchDetailsOverviewBtnEnabled: false,
									SupplierBatchInputValueState: null,
									SupplierBatchInputValueStateText: null
								}, true, true);
								this._uiClearBusy(oView);
							}.bind(this);

							oDialog.attachConfirm(fnConfirm);

							oDialog.open();

						} else {
							var oBatch = aBatches.shift();
							this._syncCurrentBatchDetails(oView, oBatch, true);

							this._wizardUIActivate({
								BatchDetailsValidateBtnEnabled: true,
								BatchInputValueState: null,
								BatchInputValueStateText: null,
								BatchDetailsFinishBtnVisible: true,
								BatchDetailsFinishBtnEnabled: false,
								BatchDetailsOverviewBtnVisible: true,
								BatchDetailsOverviewBtnEnabled: false,
								SupplierBatchInputValueState: null,
								SupplierBatchInputValueStateText: null
							}, true, true);
						}
					}
					this._uiClearBusy(oView);
				}.bind(this),
				error: function () {
					this._wizardUIActivate({
						BatchDetailsValidateBtnEnabled: false
					}, false, true);
					if (oSource === oBatchDetailsBatchInput) {
						this._wizardUIActivate({
							BatchInputValueState: "Error",
							BatchInputValueStateText: this._i18nText("msgErrorSearchingBatches")
						}, true, true);
					}

					if (oSource === oBatchDetailsSupplierBatchInput) {
						this._wizardUIActivate({
							SupplierBatchInputValueState: "Error",
							SupplierBatchInputValueStateText: this._i18nText("msgErrorSearchingBatches")
						}, true, true);
					}
					this._uiClearBusy(oView);
				}.bind(this)
			});
		},

		handleBatchDetailsQuantityChange: function (oEvent) {
			var oView = this.getView();
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();

			var oCurrentBatchDetails = oFunc.CurrentBatchDetails;
			var sValue = oEvent.getParameter("value");

			if (!sValue) {
				this._wizardUIActivate({
					BatchDetailsValidateBtnVisible: true,
					BatchDetailsValidateBtnEnabled: false,
					BatchDetailsValidatedQuantityState: "Error",
					BatchDetailsValidatedQuantityStateText: this._i18nText("msgNotNumber")
				}, true, true);
				return;
			}

			var fQuantity = sap.ui.core.format.NumberFormat.getFloatInstance().parse(sValue);
			if (isNaN(fQuantity)) {
				this._wizardUIActivate({
					BatchDetailsValidateBtnVisible: true,
					BatchDetailsValidateBtnEnabled: false,
					BatchDetailsValidatedQuantityState: "Error",
					BatchDetailsValidatedQuantityStateText: this._i18nText("msgNotNumber")
				}, true, true);
				return;
			}

			oCurrentBatchDetails.ValidatedQuantity = fQuantity;
			this._wizardUIActivate({
				BatchDetailsValidateBtnVisible: true,
				BatchDetailsValidateBtnEnabled: true,
				BatchDetailsValidatedQuantityState: null,
				BatchDetailsValidatedQuantityStateText: null
			}, true, true);
		},

		handleBatchDetailsValidate: function (oEvt) {
			var oView = this.getView();
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();

			var oCurrentBatchDetails = oFunc.CurrentBatchDetails;

			var oInventoryEntry = this._createInventoryEntry(oFunc);
			this._syncInventoryEntry(oInventoryEntry, oCurrentBatchDetails);

			//	var fQuantity = parseFloat();
			//	var sQuantity = sap.ui.core.format.NumberFormat.getFloatInstance().format(fQuantity);

			this._syncInventoryEntry(oInventoryEntry, {
				ReferenceText: oFunc.ReferenceText,
				Quantity: oCurrentBatchDetails.ValidatedQuantity
			});
			var aPendingInventoryEntries = this._addPendingInventoryEntry(oView, oInventoryEntry, true);

			var oBatchDetailsSupplierBatchInput = oView.byId("BatchDetailsSupplierBatchInput");
			var bWithSupplierBatch = oBatchDetailsSupplierBatchInput.getEditable();

			var bDisableTerminateOverview = !aPendingInventoryEntries.length || aPendingInventoryEntries.length < 1;

			this._resetCurrentBatchDetails(oView, true);

			if (!bWithSupplierBatch) {
				this._uiFocus(oView, "BatchDetailsBatchInput", true);
			} else {
				this._uiFocus(oView, "BatchDetailsSupplierBatchInput", true);
			}
			
			MessageToast.show(this._i18nText("msgValidatedBatchAdded", 
					!oCurrentBatchDetails.SupplierBatch ? 
						oCurrentBatchDetails.Batch : oCurrentBatchDetails.Batch + " / " + oCurrentBatchDetails.SupplierBatch));
			
			/*
			if(!oFunc.CurrentBinExtra.RemaningCount || oFunc.CurrentBinExtra.RemaningCount <= 0) {
			
			} else {
				oFunc.CurrentBinExtra.RemaningCount--;
				if(oFunc.CurrentBinExtra.RemaningCount <= 0) {
					var oModel = oView.getModel();
					var sBinPath = oFunc.FilteredBinsPath.shift();
					if(sBinPath) {
						var oBin = oModel.getObject(sBinPath);
			
						oFunc.CurrentBinExtra = Object.assign({
							BinPath: sBinPath,
							ValidatedQuantity: ""
						}, oBin);
						delete oFunc.CurrentBinExtra.__metadata;
						oFuncModel.updateBindings(true);
					}
					this._returnToBinExtra(oView);
					MessageToast.show(this._i18nText("msgBinValidatedMaterialDetail"));
					return;
				}
				MessageToast.show(this._i18nText("msgValidatedBatchAddedRemaining", 
					!oCurrentBatchDetails.SupplierBatch ? 
						oCurrentBatchDetails.Batch : oCurrentBatchDetails.Batch + " / " + oCurrentBatchDetails.SupplierBatch, 
					oFunc.CurrentBinExtra.RemaningCount));
			}
			*/
			
			this._wizardUIActivate({
				BatchDetailsBackBtnVisible: true,
				BatchDetailsValidateBtnVisible: true,
				BatchDetailsValidateBtnEnabled: false,
				BatchDetailsResetBtnVisible: true,
				BatchDetailsFinishBtnVisible: true,
				BatchDetailsFinishBtnEnabled: !bDisableTerminateOverview,
				BatchDetailsOverviewBtnVisible: true,
				BatchDetailsOverviewBtnEnabled: !bDisableTerminateOverview,
				BatchInputVisible: !bWithSupplierBatch,
				SupplierBatchInputVisible: !bWithSupplierBatch ? false : true,
				SupplierBatchEditable: !bWithSupplierBatch ? false : true
			}, true, false);
		},

		handleBatchDetailsReset: function (oEvt) {
			var oView = this.getView();

			//var oBatchDetailsBatchInput = oView.byId("BatchDetailsBatchInput");
			var oBatchDetailsSupplierBatchInput = oView.byId("BatchDetailsSupplierBatchInput");
			var bWithSupplierBatch = oBatchDetailsSupplierBatchInput.getEditable();

			this._resetCurrentBatchDetails(oView, true);

			if (!bWithSupplierBatch) {
				this._uiFocus(oView, "BatchDetailsBatchInput", true);
			} else {
				this._uiFocus(oView, "BatchDetailsSupplierBatchInput", true);
			}
			
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			var aPendingInventoryEntries = oFunc.PendingInventoryEntries;
			var bDisableTerminateOverview = !aPendingInventoryEntries.length || aPendingInventoryEntries.length < 1;
			this._wizardUIActivate({
				BatchDetailsBackBtnVisible: true,
				BatchDetailsValidateBtnVisible: true,
				BatchDetailsValidateBtnEnabled: false,
				BatchDetailsResetBtnVisible: true,
				BatchDetailsFinishBtnVisible: true,
				BatchDetailsFinishBtnEnabled: !bDisableTerminateOverview,
				BatchDetailsOverviewBtnVisible: true,
				BatchDetailsOverviewBtnEnabled: !bDisableTerminateOverview,
				BatchInputVisible: !bWithSupplierBatch,
				SupplierBatchInputVisible: !bWithSupplierBatch ? false : true,
				SupplierBatchEditable: !bWithSupplierBatch ? false : true
			}, true, false);
		},

		handleBatchDetailsFinish: function (oEvt) {
			var oView = this.getView();
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			
			oFunc.UnprocessedBinsCount = oFunc.FilteredBinsPath.length;
			
			if(!oFunc.UnprocessedBinsCount || oFunc.UnprocessedBinsCount === 0) {
				this._postPendingInventoryEntries(oView);
				return;
			}
			
			// this means we have come from bin extra we should return to the next
			// and we still have pending materials
			var oModel = oView.getModel();
			var sBinPath = oFunc.FilteredBinsPath.shift();
			
			var oBin = oModel.getObject(sBinPath);

			oFunc.CurrentBinExtra = Object.assign({
				BinPath: sBinPath,
				ValidatedQuantity: ""
			}, oBin);
			delete oFunc.CurrentBinExtra.__metadata;
			oFuncModel.updateBindings(true);
			
			this._returnToBinExtra(oView);
			MessageToast.show(this._i18nText("msgBinValidatedMaterialDetail"));
		},

		handleBatchDetailsOverview: function (oEvt) {
			var oView = this.getView();
			var oModel = oView.getModel();

			var oDialog = oView.getDependents().find(oDep => oDep.getId() === "InventoryEntriesOverviewDialog");

			if (!oDialog) {
				oDialog = sap.ui.xmlfragment({
					fragmentName: "zmm.zmm_mobpinvn.view.InventoryEntriesOverviewDialog",
					type: "XML"
				}, this);
				oDialog.setModel(oModel);
				oView.addDependent(oDialog);

				oDialog.attachAfterClose(function (oEvt1) {});
			}

			oDialog.open();
		},

		handleOverviewDialogBack: function (oEvt) {
			var oDialog = oEvt.getSource().getParent();
			oDialog.close();
		},

		handleOverviewDialogValidate: function (oEvt) {

		},

		handleOverviewDialogCancelAll: function (oEvt) {
			var oDialog = oEvt.getSource().getParent();
			var oView = this.getView();
			this._resetToBin(oView);
			oDialog.close();
		},

		handleOverviewDialogFinish: function (oEvt) {
			var oDialog = oEvt.getSource().getParent();
			var oView = this.getView();
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
	
			oFunc.UnprocessedBinsCount = oFunc.FilteredBinsPath.length;
	
			if(!oFunc.UnprocessedBinsCount || oFunc.UnprocessedBinsCount === 0) {
				this._postPendingInventoryEntries(oView);
				oDialog.close();
				return;
			}
			
			// this means we have come from bin extra we should return to the next
			// and we still have pending materials
			var oModel = oView.getModel();
			var sBinPath = oFunc.FilteredBinsPath.shift();
			var oBin = oModel.getObject(sBinPath);

			oFunc.CurrentBinExtra = Object.assign({
				BinPath: sBinPath,
				ValidatedQuantity: ""
			}, oBin);
			delete oFunc.CurrentBinExtra.__metadata;
			oFuncModel.updateBindings(true);
			oDialog.close();
			this._returnToBinExtra(oView);
			MessageToast.show(this._i18nText("msgBinValidatedMaterialDetail"));
		},

		handleResultsRestart: function (oEvt) {
			this._resetToStorageLocation(this.getView());
		},

		handleResultsNewBin: function (oEvt) {
			this._resetToBin(this.getView());
		},

		_currentBinQuantityCompletePopulatePendingBins: function (oView, fnSuccess, fnError) {
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			var oModel = oView.getModel();

			var oCurrentBinExtra = oFunc.CurrentBinExtra;

			var aFilters = [
				new Filter("Plant", "EQ", oCurrentBinExtra.Plant),
				new Filter("Material", "EQ", oCurrentBinExtra.Material),
				new Filter("StorageLocation", "EQ", oCurrentBinExtra.StorageLocation),
				new Filter("StorageBin", "EQ", oCurrentBinExtra.StorageBin),
				new Filter("AlternativeUnitSAP", "EQ", oCurrentBinExtra.AlternativeUnitSAP)
			];
			
			if(!oCurrentBinExtra.HeatNumber) {
				aFilters.push(new Filter("HeatNumber", "EQ", null));
			} else {
				aFilters.push(new Filter("HeatNumber", "EQ", oCurrentBinExtra.HeatNumber));
			}

			this._uiSetBusy(oView, {
				MainPage: true
			});

			oModel.read("/ZC_WMLB_PINVDAU", {
				method: "GET",
				filters: aFilters,
				success: function (oData) {
					var aStorageBins = oData.results;
					if (!aStorageBins.length || aStorageBins.length === 0) {
						if (fnSuccess) {
							fnSuccess([], []);
						}
					} else {
						aStorageBins.sort((a, b) => a.Batch - b.Batch);
						var aInventoryEntries = [];
						aStorageBins.forEach(function (oStorageBin) {
							var oInventoryEntry = this._createInventoryEntry(oFunc);
							this._syncInventoryEntry(oInventoryEntry, oStorageBin);
							this._syncInventoryEntry(oInventoryEntry, {
								ReferenceText: oFunc.ReferenceText,
								Quantity: oStorageBin.AlternativeUnitQuantity
							});
							aInventoryEntries.push(oInventoryEntry);
							this._addPendingInventoryEntry(oView, oInventoryEntry, true);
						}.bind(this));
						oFuncModel.updateBindings(true);
						if (fnSuccess) {
							fnSuccess(aStorageBins, aInventoryEntries);
						}
					}
					this._uiClearBusy(oView);
				}.bind(this),
				error: function (oError) {
					if (fnError) {
						fnError(oError);
					}
					this._uiClearBusy(oView);
				}.bind(this)
			});

		},

		_createInventoryEntry: function (oProps) {
			var oInventoryEntry = {
				Index: null,
				Plant: null,
				ReferenceText: null,
				StorageLocation: null,
				Material: null,
				MaterialName: null,
				StorageBin: null,
				StockType: null,
				SupplierBatch: null,
				Batch: null,
				Quantity: null,
				UnitOfMeasure: null,
				SalesOrder: null,
				SalesOrderItem: null,
				Vendor: null
			};

			if (!oProps) {
				return oInventoryEntry;
			}
			for (var k in oProps) {
				if (oInventoryEntry.hasOwnProperty(k) && oProps.hasOwnProperty(k)) {
					oInventoryEntry[k] = oProps[k];
				}
			}

			return oInventoryEntry;
		},

		_syncInventoryEntry: function (oInventoryEntry, oProps, bKeep) {
			for (var k in oInventoryEntry) {
				if (oInventoryEntry.hasOwnProperty(k) && oProps.hasOwnProperty(k)) {
					if (!bKeep) {
						oInventoryEntry[k] = oProps[k];
						continue;
					}
					oInventoryEntry[k] = !oInventoryEntry[k] ? oProps[k] : oInventoryEntry[k];
				}
			}

			return oInventoryEntry;
		},

		_addPendingInventoryEntry: function (oView, oInventoryEntry, bUpdateBindings) {
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();

			if (!oFunc.PendingInventoryEntries || !oFunc.PendingInventoryEntries.length) {
				oFunc.PendingInventoryEntries = [];
			}
			oInventoryEntry.Index = oFunc.PendingInventoryEntries.length + 1;
			oFunc.PendingInventoryEntries.push(oInventoryEntry);
			var fCummulativeQuantity = 0;
			oFunc.PendingInventoryEntries.forEach(function (oEntry) {
				var fQuantity = parseFloat(oEntry.Quantity);
				fCummulativeQuantity += fQuantity;
			});

			oFunc.CummulativeQuantity = fCummulativeQuantity;
			if (bUpdateBindings) {
				oFuncModel.updateBindings(true);
			}
			return oFunc.PendingInventoryEntries;
		},

		_resetCurrentBatchDetails: function (oView, bUpdateBindings) {
			var oFunc = this._funcSync(oView, {
				CurrentBatchDetails: {}
			}, bUpdateBindings);
			return oFunc.CurrentBatchDetails;
		},

		_syncCurrentBatchDetails: function (oView, oBatch, bUpdateBindings) {
			var oCurrentBatchDetails = {
				Plant: oBatch.Plant,
				StorageLocation: oBatch.StorageLocation,
				Batch: oBatch.Batch,
				SupplierBatch: oBatch.SupplierBatch,
				Material: oBatch.Material,
				MaterialName: oBatch.MaterialName,
				HeatNumber: oBatch.HeatNumber,
				ValidatedQuantity: oBatch.AlternativeUnitQuantity,
				UnitOfMeasure: oBatch.AlternativeUnitSAP,
				StockType: oBatch.StockType,
				SalesOrder: oBatch.SalesOrder,
				SalesOrderItem: oBatch.SalesOrderItem,
				Vendor: oBatch.Vendor
			};
			var oFunc = this._funcSync(oView, {
				CurrentBatchDetails: oCurrentBatchDetails
			}, bUpdateBindings);
			return oFunc.CurrentBatchDetails;
		},

		_funcSync: function (oView, oProps, bUpdateBindings, bClear) {
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			for (var k in oFunc) {
				if (oFunc.hasOwnProperty(k)) {
					oFunc[k] = bClear ? null : oFunc[k];
					oFunc[k] = oProps.hasOwnProperty(k) ? oProps[k] : oFunc[k];
				}
			}
			if (bUpdateBindings) {
				oFuncModel.updateBindings(true);
			}
			return oFunc;
		},

		_funcClear: function (oView, oProps, bUpdateBindings) {
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			for (var k in oFunc) {
				if (oProps.hasOwnProperty(k)) {
					oFunc[k] = null;
				}
			}
			if (bUpdateBindings) {
				oFuncModel.updateBindings(true);
			}
			return oFunc;
		},

		_funcReset: function (oView, bUpdateBindings) {
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			for (var k in oFunc) {
				if (oFunc.hasOwnProperty(k)) {
					oFunc[k] = null;
				}
			}
			if (bUpdateBindings) {
				oFuncModel.updateBindings(true);
			}
			return oFunc;
		},

		_resetToStorageLocation: function (oView) {
			this._funcReset(oView, true);
			var oUnitsList = oView.byId("UnitsList");
			oUnitsList.removeSelections(true);
			this._storageLocationStepValidate(oView);
			this._wizardResetToStorageLocationSelect(oView);
		},

		_resetToBin: function (oView) {
			this._funcClear(oView, {
				StorageBin: true,
				ReferenceText: true,
				CurrentBinExtra: true,
				PendingInventoryEntries: true,
				CummulativeQuantity: true,
				FilteredBinsPath: true
			}, true);
			this._wizardResetToBinStep(oView);
			this._wizardSyncBinBranching(oView);
			this._uiFocus(oView, "BinInput", true);

			this._wizardUIActivate({
				BinBackBtnVisible: true
			}, true, false);
		},

		_postPendingInventoryEntries: function (oView) {
			var oModel = oView.getModel();
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			var sBatchId = (Math.random() * 1e32).toString(36);
			oFunc.PostedInventoryEntries = [];
			oFunc.PostedCummulativeQuantity = 0;
			this._createInventoryEntriesBatch(oModel, oFunc.PendingInventoryEntries, sBatchId);
			this._submitInventoryEntriesBatch(oFuncModel, oModel, sBatchId, function (oResponse, oError) {
				if (!oError) {
					oFuncModel.updateBindings(true);
					this._gotoPostResults(oView);
				}
			}.bind(this));
		},
		
		_gotoBinExtra: function(oView) {
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			this._wizardJumpToBinExtraStep(oView);
			this._uiFocus(oView, "BatchCountInput", true);
			this._wizardUIActivate({
				BinExtraBackBtnVisible: true,
				BinExtraValidateBtnVisible: true,
				BinExtraFinishBtnVisible: true,
				BinExtraValidateBtnEnabled: false,
				BinExtraFinishBtnEnabled: true,
				BinExtraInputsVisible: oFunc.UnprocessedBinsCount > 0,
				BinExtraNoMoreInputsVisible : oFunc.UnprocessedBinsCount <= 0
			}, true, false);
		},
		
		_returnToBinExtra: function(oView) {
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			this._wizardResetToBinExtraStep(oView);
			this._uiFocus(oView, "BatchCountInput", true);
			this._wizardUIActivate({
				BinExtraBackBtnVisible: true,
				BinExtraValidateBtnVisible: true,
				BinExtraFinishBtnVisible: true,
				BinExtraValidateBtnEnabled: false,
				BinExtraFinishBtnEnabled: true,
				BinExtraInputsVisible: oFunc.UnprocessedBinsCount > 0,
				BinExtraNoMoreInputsVisible : oFunc.UnprocessedBinsCount <= 0
			}, true, false);
		},

		_gotoBatchDetails: function (oView, bWithSupplierBatch) {
			this._wizardJumpToBatchDetailsStep(oView);
			if (!bWithSupplierBatch) {
				this._uiFocus(oView, "BatchDetailsBatchInput", true);
			} else {
				this._uiFocus(oView, "BatchDetailsSupplierBatchInput", true);
			}
			this._wizardUIActivate({
				BatchDetailsBackBtnVisible: true,
				BatchDetailsValidateBtnVisible: true,
				BatchDetailsValidateBtnEnabled: false,
				BatchDetailsResetBtnVisible: true,
				BatchDetailsFinishBtnVisible: true,
				BatchDetailsFinishBtnEnabled: false,
				BatchDetailsOverviewBtnVisible: true,
				BatchDetailsOverviewBtnEnabled: false,
				BatchInputVisible: !bWithSupplierBatch,
				SupplierBatchInputVisible: !bWithSupplierBatch ? false : true,
				SupplierBatchEditable: !bWithSupplierBatch ? false : true
			}, true, false);
		},

		_gotoPostResults: function (oView) {
			this._wizardUIActivate({
				ResultsRestartBtnVisible: true,
				ResultsNewBinBtnVisible: true
			}, true, false);
			this._wizardJumpToPostResults(oView);
		},

		_wizardResetToStorageLocationSelect: function (oView) {
			var oWizard = this._getWizard(oView);
			var oStorageLocationStep = oView.byId("StorageLocationStep");
			oWizard.discardProgress(oStorageLocationStep, false);
		},

		_wizardResetToBinStep: function (oView) {
			var oWizard = this._getWizard(oView);
			var oBinStep = oView.byId("BinStep");
			oWizard.discardProgress(oBinStep, false);
		},

		_wizardJumpToBatchDetailsStep: function (oView) {
			var oWizard = this._getWizard(oView);
			var oBatchDetailsStep = oView.byId("BatchDetailsStep");
			var sCurrentStepId = oWizard.getCurrentStep();
			var oCurrentStep = oView.byId(sCurrentStepId);

			oCurrentStep.setValidated();
			oCurrentStep.setNextStep(oBatchDetailsStep);
			oWizard.nextStep();
		},
		
		_wizardJumpToBinExtraStep: function(oView) {
			var oWizard = this._getWizard(oView);
			var oBinExtraStep = oView.byId("BinExtraStep");
			var sCurrentStepId = oWizard.getCurrentStep();
			var oCurrentStep = oView.byId(sCurrentStepId);
			
			oCurrentStep.setValidated();
			oCurrentStep.setNextStep(oBinExtraStep);
			oWizard.nextStep();
		},
		
		_wizardResetToBinExtraStep: function(oView) {
			var oWizard = this._getWizard(oView);
			var oBinExtraStep = oView.byId("BinExtraStep");
			oWizard.discardProgress(oBinExtraStep, false);
		},

		_wizardJumpToPostResults: function (oView) {
			var oWizard = this._getWizard(oView);
			var oBatchDetailsStep = oView.byId("ResultsStep");
			var sCurrentStepId = oWizard.getCurrentStep();
			var oCurrentStep = oView.byId(sCurrentStepId);

			oCurrentStep.setValidated();
			oCurrentStep.setNextStep(oBatchDetailsStep);
			oWizard.nextStep();
		},

		_wizardSyncBinBranching: function (oView) {
			var oFuncModel = this._getFuncModel(oView);
			var oFunc = oFuncModel.getData();
			var oBinStep = oView.byId("BinStep");
			var oBinExtraStep = oView.byId("BinExtraStep");
			var oBatchDetailsStep = oView.byId("BatchDetailsStep");

			// if (oFunc.StorageLocation === "A620") {								//Commented and added logic For All except A610 and A331 GAP 062 t_singhag1 27.02.2025
			// 	oBinExtraStep.setVisible(false);
			// 	oBinStep.setNextStep(oBatchDetailsStep);
			// } else {								
			// 	oBinExtraStep.setVisible(true);
			// 	oBinStep.setNextStep(oBinExtraStep);
			// }
			if (oFunc.StorageLocation !== "A610" && oFunc.StorageLocation !== "A331" && oFunc.StorageLocation !== "A311" && oFunc.StorageLocation !== "A312" && oFunc.StorageLocation !== "A323" && oFunc.StorageLocation !== "A336" && oFunc.StorageLocation !== "A337" && oFunc.StorageLocation !== "A343" && oFunc.StorageLocation !== "A34N") {								 
				oBinExtraStep.setVisible(false);
				oBinStep.setNextStep(oBatchDetailsStep);
			} else {								
				oBinExtraStep.setVisible(true);
				oBinStep.setNextStep(oBinExtraStep);
			}
			
		},

		_wizardUIActivate: function (oProps, bUpdateBindings, bKeep) {
			var oWizardUIModel = this._getWizardUIModel();
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

		_getFuncModel: function (oView) {
			if (!oView) {
				return this.getView().getModel("Functional");
			}
			return oView.getModel("Functional");
		},

		_getWizardUIModel: function (oView) {
			if (!oView) {
				return this.getView().getModel("WizardUI");
			}
			return oView.getModel("WizardUI");
		},

		_getWizard: function (oView) {
			if (!oView) {
				return this.getView().byId("MainWizard");
			}
			return oView.byId("MainWizard");
		},

		_uiClearBusy: function (oView) {
			this._uiSetBusy(oView, {
				MainPage: false,
				BinInput: false,
				ReferenceTextInput: false,
				BatchCountInput: false
			});
		},

		_uiSetBusy: function (oView, oIds) {
			for (var k in oIds) {
				if (oIds.hasOwnProperty(k)) {
					var oCtrl = oView.byId(k);
					if (oCtrl && oCtrl.setBusy) {
						oCtrl.setBusy(oIds[k]);
					}
				}
			}
		},

		_uiFocus: function (oView, sId, bAutoSelect) {
			jQuery.sap.delayedCall(50, this, function () {
				var oInput = oView.byId(sId);
				if (oInput) {
					oInput.focus();
					if (bAutoSelect === true) {
						oInput.selectText(0, 99);
					}
				}
			});
		},

		_createInventoryEntriesBatch: function (oModel, aInventoryEntries, sBatchGroup) {
			var sPath = "/AddInventoryEntry";
			var sMethod = "POST";

			if (!aInventoryEntries || !aInventoryEntries.length || aInventoryEntries.length < 1) {
				return;
			}

			oModel.setDeferredGroups([sBatchGroup]);
			aInventoryEntries.forEach(function (oItem) {
				var oUrlParams = {
					Batch: oItem.Batch,
					Index: oItem.Index,
					Material: oItem.Material,
					ReferenceText: oItem.ReferenceText,
					Plant: oItem.Plant,
					Quantity: oItem.Quantity,
					SalesOrder: oItem.SalesOrder ? oItem.SalesOrder : "",
					SalesOrderItem: oItem.SalesOrder ? oItem.SalesOrderItem : "",
					Vendor: oItem.Vendor ? oItem.Vendor : "",
					StockType: oItem.StockType,
					StorageBin: oItem.StorageBin,
					StorageLocation: oItem.StorageLocation,
					UnitOfMeasure: oItem.UnitOfMeasure
				};
				oModel.callFunction(sPath, {
					method: sMethod,
					urlParameters: oUrlParams,
					batchGroupId: sBatchGroup,
					changeSetId: sBatchGroup
				});
			});
		},

		_submitInventoryEntriesBatch: function (oFuncModel, oModel, sBatchGroup, fnAfterSubmit) {

			var fnError = function (oError) {
				fnAfterSubmit(null, oError);
			};

			var oFunc = oFuncModel.getData();

			var fnSuccess = function (oData) {
				if (oData.__batchResponses && oData.__batchResponses.length > 0) {
					oData.__batchResponses.forEach(oBatchResponse => {
						if (oBatchResponse.__changeResponses && oBatchResponse.__changeResponses.length > 0) {
							oBatchResponse.__changeResponses.forEach(oChangeResponse => {
								if (oChangeResponse.data && oChangeResponse.data.results) {
									oChangeResponse.data.results.forEach(oResult => {
										var oInventoryEntry = Object.assign({}, oResult);
										delete oInventoryEntry.__metadata;
										if (!oInventoryEntry.ErrorCode || oInventoryEntry.ErrorCode == "0") {
											oInventoryEntry.EntryStatus = "Success";
											oInventoryEntry.EntryStatusText = oInventoryEntry.ErrorMessage;
											oInventoryEntry.EntryStatusIcon = "sap-icon://sys-enter-2";
										} else {
											oInventoryEntry.EntryStatus = oInventoryEntry.ErrorType === "E" ? "Error" : "Information";
											oInventoryEntry.EntryStatusText = oInventoryEntry.ErrorMessage;
											oInventoryEntry.EntryStatusIcon = oInventoryEntry.ErrorType === "E" ? "sap-icon://error" : "sap-icon://information";
										}
										oFunc.PostedInventoryEntries.push(oInventoryEntry);
										var fQuantity = parseFloat(oInventoryEntry.Quantity);
										oFunc.PostedCummulativeQuantity += fQuantity;
									});
								}
							});
							if (fnAfterSubmit) {
								fnAfterSubmit(oBatchResponse.__changeResponses);
							}
						}
					});
				}
			};

			oModel.setRefreshAfterChange(false);

			/*submit batch*/
			oModel.submitChanges({
				batchGroupId: sBatchGroup,
				success: fnSuccess,
				error: fnError
			});
		},

		_showMetadataError: function (sDetails) {
			MessageBox.error(
				this._i18nText("msgErrorServiceMetadata"), {
					id: "metadataErrorMessageBox",
					details: sDetails,
					styleClass: this.getOwnerComponent().getContentDensityClass(),
					actions: [MessageBox.Action.RETRY, MessageBox.Action.CLOSE],
					onClose: function (sAction) {
						if (sAction === MessageBox.Action.RETRY) {
							this._oModel.refreshMetadata();
						}
					}.bind(this)
				}
			);
		},

		_showServiceError: function (oError) {
			if (this._bMessageOpen) {
				return;
			}
			if (oError.responseText) {
				try {
					var oJson = JSON.parse(oError.responseText);
					if (oJson.error) {
						var oSrvError = oJson.error;
						if (oSrvError.code && oSrvError.message) {
							this._bMessageOpen = true;
							MessageBox.error(
								oError.message, {
									id: "serviceErrorMessageBox",
									details: "<p><strong>" + oSrvError.code + "</strong> - " + oSrvError.message.value + "</p>",
									styleClass: this.getOwnerComponent().getContentDensityClass(),
									actions: [MessageBox.Action.CLOSE],
									onClose: function () {
										this._bMessageOpen = false;
									}.bind(this)
								}
							);
							return;
						}
					}
				} catch(oEx) {
					this._bMessageOpen = true;
					MessageBox.error(
						oError.message, {
							id: "serviceErrorMessageBox",
							details: oError.responseText,
							styleClass: this.getOwnerComponent().getContentDensityClass(),
							actions: [MessageBox.Action.CLOSE],
							onClose: function () {
								this._bMessageOpen = false;
							}.bind(this)
						}
					);
					return;
				}
			}

			this._bMessageOpen = true;
			MessageBox.error(
				oError.message, {
					id: "serviceErrorMessageBox",
					details: oError.message,
					styleClass: this.getOwnerComponent().getContentDensityClass(),
					actions: [MessageBox.Action.CLOSE],
					onClose: function () {
						this._bMessageOpen = false;
					}.bind(this)
				}
			);
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