sap.ui.define([
	"s2p/mm/im/goodsreceipt/purchaseorder/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"s2p/mm/im/goodsreceipt/purchaseorder/model/formatter",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
	"ui/s2p/mm/im/lib/materialmaster/controller/ValueHelpController",
	"sap/m/MessageToast",
	"sap/ui/generic/app/navigation/service/NavigationHandler",
	"sap/ui/Device",
	// 'sap/m/MessageToast',
	"sap/m/MessageBox",
	"sap/ui/core/MessageType",
	"sap/ui/core/message/Message",
	"sap/ui/model/BindingMode",
	"sap/ui/core/IconColor",
	"s2p/mm/im/goodsreceipt/purchaseorder/controller/utils/SubItemController"
], function (BaseController, JSONModel, formatter, Filter, FilterOperator, ValueHelp, MessageToast, NavigationHandler, Device, MessageBox,
	MessageType, Message, BindingMode, IconColor, SubItemController) {
	"use strict";

	return sap.ui.controller("s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.controller.S1Custom", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		/**
		 * Called when the worklist controller is instantiated.
		 * @public
		 */
		onInit: function () {

			var oBinData = {
				Bin: [{
					CompanyCode: "",
					MatDocPos: "",
					Country: "",
					Quantity: "",
					Plant: "",
					StorageLocation: "",
					StorageBin: "",
					Material: "",
					Batch: "",
					SupplierBatch: "",
					Order: "",
					Item: "",
					Customer: "",
					QuantitySO: "",
					Unit: ""
				}]
			};

			var oBinModel = new JSONModel(oBinData);
			this.getView().setModel(oBinModel, "bindata");

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

			var that = this;
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			//both views
			///cross navigation service
			/**
			 * @property {objectl} _oNavigationService reference to generic navigation handler
			 */
			this._oNavigationService = new sap.ui.generic.app.navigation.service.NavigationHandler(this);
			this._oCopilotActive = false;
			//Dateformat 
			this._oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "dd.MM.yyyy",
				strictParsing: "true"
			});
			this._aSemanticChartColors = ["sapUiChart1", "sapUiChart2", "sapUiChart3", "sapUiChart4", "sapUiChart5", "sapUiChart6",
				"sapUiChart7", "sapUiChart8", "sapUiChart9", "sapUiChart10"
			];

			//setting mode of App
			var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
			var oComponentData = sap.ui.component(sComponentId).getComponentData();
			//presetting the PONumber by intent based navigation
			/**
			 * @property {String this._SourceOfGR} fixed value to distinguish the different start up options
			 */
			this._SourceOfGR = "";
			this._SourceOfGRIsPurchaseOrder = "PURORD";
			this._SourceOfGRIsInboundDelivery = "INBDELIV";
			this._SourceOfGRIsProductionOrder = "PRODORD"; //Production Order
			this._SourceOfGRIsNoReference = "NOREF"; //No Reference
			if (oComponentData && oComponentData.startupParameters && oComponentData.startupParameters.SourceOfGR) { //Launch Pad
				this._SourceOfGR = oComponentData.startupParameters.SourceOfGR[0];
			} else { // Local 
				this._SourceOfGR = jQuery.sap.getUriParameters().get("SourceOfGR");
			}
			if (this._SourceOfGR === null) {
				this._SourceOfGR = this._SourceOfGRIsPurchaseOrder;
			}
			Device.orientation.attachHandler(this._devicehandling(), this);
			// These 3 lines should be commented before deployement
			//this._SourceOfGR = this._SourceOfGRIsInboundDelivery;
			//this._SourceOfGR = this._SourceOfGRIsPurchaseOrder;
			//this._SourceOfGR = this._SourceOfGRIsProductionOrder;

			// share button is not available in No Reference App
			if (this._SourceOfGR !== this._SourceOfGRIsNoReference && this.getView().byId("shareTile")) {
				this.getView().byId("shareTile").setBeforePressHandler(jQuery.proxy(this.handleBookmarkBeforePress, this));
			}
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
				this._toggleBusy(true);
				//init all private properties of the controller: fixed Values for printing, personalisation preset
				this._initController();
				// Congfiguration

				//add application settings
				var sAPPL_SETTINGS_ID = "idApplSettingsBtn";

				var oControllingAreaButton = sap.ui.getCore().byId(sAPPL_SETTINGS_ID);
				if (oControllingAreaButton !== undefined) {
					oControllingAreaButton.destroy();
				}

				if (sap.ushell) {
					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
						sap.ushell.services.AppConfiguration.addApplicationSettingsButtons([new sap.m.Button({
							id: sAPPL_SETTINGS_ID,
							text: this.getResourceBundle().getText("SETTINGS_TITLE"),
							press: jQuery.proxy(function () {
								this._showSettingsDialog({});
							}, this)
						})]);
					}
				}

				/**
				 * @property {oData Model} oData link to backend odata model for reading and posting
				 */

				// /**
				//  * @property {JSON Model} oFrontend holding all data from backend and controlling UI functions
				//  */
				// this.getView().setModel(oFrontendModel, "oFrontend");

				var oData = this.getOwnerComponent().getModel("oData");
				oData.setRefreshAfterChange(false); //Prevent update of model after post
				oData.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline); //Inline count
				this.getView().setModel(oData, "oData");
				/**
				 * @property {oData Model} oDataHelp link to backend odata model for help function
				 */
				var oModelHelp = this.getOwnerComponent().getModel("oDataHelp") || {};

				// FrontEndModel init
				var oFrontendModel = new sap.ui.model.json.JSONModel();
				oFrontendModel.setData(this._getInitFrontend());

				/**
				 * @property {JSON Model} oFrontend holding all data from backend and controlling UI functions
				 */
				this.getView().setModel(oFrontendModel, "oFrontend");
				//No Reference	
				this.getOwnerComponent().getModel("oData2").read("/MMIMInventSpecialStockTypeVH", {
					success: jQuery.proxy(this._successSpecialStockLoad, this),
					error: jQuery.proxy(this._handleOdataError, this)
				});
				if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
					this._getInitialItem(0);
				}

				this._ResetStorageLocationBuffer = false; //needed to reset Buffer value help
				this._ResetBatchBuffer = false; //needed to reset Buffer value help
				//back navigation handler

				oRouter.attachRoutePatternMatched(this, this._handleRouteMatched);

				// post dialog fragment
				if (!this._oPostDialog) { //Material Document
					this._oPostDialog = sap.ui.xmlfragment({
						fragmentName: "s2p.mm.im.goodsreceipt.purchaseorder.view.successPost",
						type: "XML",
						id: "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.successPost"
					}, this);
					this.getView().addDependent(this._oPostDialog);
				}

				//Personalisation
				var oPersId = {
					container: "s2p.mm.im.goodsreceipt.purchaseorder",
					item: "app"
				};

				/**
				 * @property {objectl} _oPersonalizer reference to personalisation service
				 */
				if (sap.ushell && sap.ushell.Container) { //check if not in local test mode
					this._oPersonalizer = sap.ushell.Container.getService("Personalization").getPersonalizer(oPersId);
				}

				//fixed values in initController

				// check for stored personalisation and try load
				if (this._oPersonalizer) {
					var oPersonalizerReadAttempt = this._oPersonalizer.getPersData().done(function (oPersData) {
						if (oPersData) {
							that._oPersonalizedDataContainer = oPersData;
							if (!that._oPersonalizedDataContainer.PresetDocumentItemTextFromPO) {
								that._oPersonalizedDataContainer.PresetDocumentItemTextFromPO = false;
							}
							if (!that._oPersonalizedDataContainer.SelectPROD) {
								that._oPersonalizedDataContainer.SelectPROD = false;
							}
							if (!that._oPersonalizedDataContainer.EnableBarcodeScanning) {
								that._oPersonalizedDataContainer.EnableBarcodeScanning = false;
							}
							if (!that._oPersonalizedDataContainer.VersionForPrintingSlip || that._oPersonalizedDataContainer.VersionForPrintingSlip ===
								"none") { //v2788600
								that._oPersonalizedDataContainer.VersionForPrintingSlip = "none";
							}
							//set frontend object
							that._setScanButtonVisibility();
							that._setSearchPlaceholderText(); //setting the text
						}
					}).
					fail(function () {
						jQuery.sap.log.error("Reading personalization data failed.");
					});
				}

				//test mode handling & start up parameter
				var sSAPMMIMTestmode = jQuery.sap.getUriParameters().get("sap-mmim-testmode");
				//not found in URL -> try parameters form launchpad
				if (!(sSAPMMIMTestmode && parseInt(sSAPMMIMTestmode) > 0)) {

					if (oComponentData && oComponentData.startupParameters && oComponentData.startupParameters.sap_mmim_testmode) {
						sSAPMMIMTestmode = oComponentData.startupParameters.sap_mmim_testmode[0];
					}
				}

				if (sSAPMMIMTestmode && parseInt(sSAPMMIMTestmode) > 0) {
					//test mode

					var sBaseURI_testmode = "/sap/opu/odata/sap/MMIM_EXTERNALTEST_SRV";
					var oTestModel = new sap.ui.model.odata.ODataModel(sBaseURI_testmode, true);
					var oTestMode = {};
					oTestMode.AverageProcessingDuration = "" + parseInt(sSAPMMIMTestmode);
					oTestMode.CreatedByUser = ""; //default sy-uname

					var sTestUrl = "/TestModeSet";
					oTestModel.create(sTestUrl, oTestMode, null, function (oData, oResponse) {

							//no success required
						}, this._handleOdataError.bind(this) //error Handling
					);

				} //testmode

				// controll arrays in initController

				//checking if Navigationtargets are allowed --> initController

				if (sap.ushell && sap.ushell.Container) { //not during local testing
					var aIntents = new Array();
					var oIntentFactSheet = "#MaterialMovement-displayFactSheet?MaterialDocument=123&MaterialDocumentYear=2016"; //Intent-action
					aIntents.push(oIntentFactSheet); //0
					var oIntentSupplier = "#Supplier-displayFactSheet";
					aIntents.push(oIntentSupplier); //1
					if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
						var oIntentPurchaseOrder = "#PurchaseOrder-displayFactSheet";
						aIntents.push(oIntentPurchaseOrder); //2
					} else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
						var oIntentProductionOrder = "#ProductionOrder-displayFactSheet";
						aIntents.push(oIntentProductionOrder); //2 //Production Order  
					} else {
						var oIntentInboundDeliveryCreate = "#InboundDelivery-displayFactSheet";
						aIntents.push(oIntentInboundDeliveryCreate); //2
					}
					var oIntentMaterialDisplay = "#Material-displayFactSheet";
					aIntents.push(oIntentMaterialDisplay); //3
					var oIntentBatchCreate = "#Batch-create";
					aIntents.push(oIntentBatchCreate); //4

					var oIntentOutboundDeliveryDisplay = "#OutboundDelivery-displayFactSheet";
					aIntents.push(oIntentOutboundDeliveryDisplay); //5

					var oIntentInboundDeliveryDisplay = "#InboundDelivery-displayFactSheet";
					aIntents.push(oIntentInboundDeliveryDisplay); //6

					var oService = sap.ushell.Container.getService("CrossApplicationNavigation");
					var checkedIntents = oService.isNavigationSupported(aIntents).done(function (oCheck) {
						if (oCheck) {
							that._isIntentSupported.MaterialMovementDisplay = oCheck[0].supported || false;
							that._isIntentSupported.SupplierDisplay = oCheck[1].supported || false;
							that._isIntentSupported.PurchaseOrderDisplay = oCheck[2].supported || false;
							that._isIntentSupported.MaterialDisplay = oCheck[3].supported || false;
							that._isIntentSupported.BatchCreate = oCheck[4].supported || false;
							that._isIntentSupported.OutboundDeliveryDisplay = oCheck[5].supported || false;
							that._isIntentSupported.InboundDeliveryDisplay = oCheck[6].supported || false;
							// TODO: 
							//production order
							that._isIntentSupported.ProductionOrderDisplay = oCheck[2].supported || false;
							//set intent in model directly due to asynchronicity when navigation back SupplierDisplayActive
							if (that.getView().getModel("oFrontend")) { //support asynchronous call back
								that.getView().getModel("oFrontend").setProperty("/SupplierDisplayActive", that._isIntentSupported.SupplierDisplay);
								that.getView().getModel("oFrontend").setProperty("/PurchaseOrderDisplayActive", that._isIntentSupported.PurchaseOrderDisplay);
								that.getView().getModel("oFrontend").setProperty("/MaterialDisplayActive", that._isIntentSupported.MaterialDisplay);
								that.getView().getModel("oFrontend").setProperty("/CreateBatchActive", that._isIntentSupported.BatchCreate);
								that.getView().getModel("oFrontend").setProperty("/ProductionOrderDisplayActive", that._isIntentSupported.ProductionOrderDisplay);
								// need to avoid data loss during async load
								if (that._initialDataLoaded) {
									that._initialDataLoaded.SupplierDisplayActive = that._isIntentSupported.SupplierDisplay;
									that._initialDataLoaded.PurchaseOrderDisplayActive = that._isIntentSupported.PurchaseOrderDisplay;
									that._initialDataLoaded.MaterialDisplayActive = that._isIntentSupported.MaterialDisplay;
									that._initialDataLoaded.CreateBatchActive = that._isIntentSupported.BatchCreate;
									that._initialDataLoaded.ProductionOrderDisplayActive = that._isIntentSupported.ProductionOrderDisplay;
								}
							}
						}
					}).
					fail(function () {
						jQuery.sap.log.error("Reading intent data failed.");
					});
				}

				var sPurchaseOrderNumberOrInboundDelivery; //PurchaseOrder or InboundDelivery or Production Order

				var oPOInput;
				if (oComponentData && oComponentData.startupParameters && oComponentData.startupParameters.PurchaseOrder && (this._SourceOfGR ===
						this._SourceOfGRIsPurchaseOrder)) { //Launch Pad
					sPurchaseOrderNumberOrInboundDelivery = oComponentData.startupParameters.PurchaseOrder[0];
					// } else { // Local 
					// 	sPurchaseOrderNumberOrInboundDelivery = jQuery.sap.getUriParameters().get("PurchaseOrder");
				}

				if (oComponentData && oComponentData.startupParameters && oComponentData.startupParameters.InboundDelivery && (this._SourceOfGR ===
						this._SourceOfGRIsInboundDelivery)) { //Launch Pad
					sPurchaseOrderNumberOrInboundDelivery = oComponentData.startupParameters.InboundDelivery[0];
					//remove leading zeros in case of navigation bei ESH
					if (sPurchaseOrderNumberOrInboundDelivery) {
						sPurchaseOrderNumberOrInboundDelivery = "" + parseInt(sPurchaseOrderNumberOrInboundDelivery, 10);
					}
				}

				if (oComponentData && oComponentData.startupParameters && oComponentData.startupParameters.ProductionOrder && (this._SourceOfGR ===
						this._SourceOfGRIsProductionOrder)) { //Launch Pad
					sPurchaseOrderNumberOrInboundDelivery = oComponentData.startupParameters.ProductionOrder[0];
					// } else { // Local 
					// 	sPurchaseOrderNumberOrInboundDelivery = jQuery.sap.getUriParameters().get("InboundDelivery");
				} //Production Order

				if (sPurchaseOrderNumberOrInboundDelivery) { //setting the PO&disabling further input
					oPOInput = this.getView().byId("POInput");
					oPOInput.setValue(sPurchaseOrderNumberOrInboundDelivery);
					oPOInput.setEditable(false);
					// oPOInput.fireSuggestionItemSelected({selectedItem:new sap.ui.core.Item( {text:sPurchaseOrderNumber})});
					oPOInput.fireChangeEvent(sPurchaseOrderNumberOrInboundDelivery);
				} else {
					this._oNavigationService.parseNavigation().done(function (oAppData, oStartupParameters, sNavType) {
						// save the app inbetween state
						if (that._SourceOfGR !== that._SourceOfGRIsNoReference) { // Delivery, Purchase Order, Production order
							if (oAppData && oAppData.customData && oAppData.customData.Ebeln) {
								//Convert Date from internal formal to Output Format
								// var oDateInputFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
								// 	pattern: "yyyy-MM-dd"
								// });
								if (that.getView().byId("POInput")) {
									that.getView().byId("POInput").setValue(oAppData.customData.Ebeln);
								}

								that._readPO(oAppData.customData.Ebeln, oAppData.customData);
							}
						} else { //goods receipt without reference --> restore state
							if (oAppData && oAppData.customData && !oAppData.customData.successPostDialog) {
								that._restoreInnerAppStateSourceOfGRIsNoReference(oAppData.customData);
							}
						}

						// save the success post dialog state
						if (oAppData && oAppData.customData && oAppData.customData.successPostDialog) {
							var oPostMessageModel = new sap.ui.model.json.JSONModel(oAppData.customData.successPostDialog);
							that._oPostDialog.setModel(oPostMessageModel);
							that._oPostDialog.open();
							sap.ui.getCore().getMessageManager().removeAllMessages();
						}

						var oInput = that.getView().byId("POInput");
						if (oInput) {
							jQuery.sap.delayedCall(200, this, function () {
								oInput.focus();
								oInput.selectText(0, 99);
							});
						}
					});

					this._toggleBusy(false);

				}

				//addressing the lib
				//jQuery.sap.require("ui.s2p.mm.im.lib.materialmaster.controller.ValueHelpController");
				/**
				 * @property {objectl} _oValueHelpController reference to library controller
				 */
				if (ValueHelp) {
					this._oValueHelpController = new ValueHelp();
					this._oValueHelpController.init(oModelHelp);
				}

				//end get fixed values for stock type from backend	
				this._setSearchPlaceholderText();

				/** Extensibility **/
				this._aExtendedFields = [];
				var oMetamodel = oData.getMetaModel().loaded().then(function (oData) {

					var aGR4POItemsProperties = that.getOwnerComponent().getModel("oData").getMetaModel().getODataEntityType(
						"Z_MMIM_GR4PO_DL_SRV.GR4PO_DL_Item").property;
					for (var j = 0; j < aGR4POItemsProperties.length; j++) {
						if (aGR4POItemsProperties[j]["sap:is-extension-field"]) {
							if (JSON.parse(aGR4POItemsProperties[j]["sap:is-extension-field"]) === true) {
								that._aExtendedFields.push(aGR4POItemsProperties[j]);
							}
						}
					}

					if (that._aExtendedFields.length === 0) { // adapt oDataModel
						that.getOwnerComponent().getModel("oData").setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
					}
				});

				if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
					if (that._oPersonalizer) {
						that._oPersonalizedDataContainer.EnableBarcodeScanning = true;
						that._setScanButtonVisibility();
						that._setSearchPlaceholderText(); //setting the text
					}
				}

				/* Begin Scale Change */
				this.getModel("oFrontend").setProperty("/ScaleButtonVisible", true);
				if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
					this.getScalelist();
				} /* End Scale Change */

			} //S1 View

			if (this.getView().sViewName == "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {

				if (oRouter.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType.XML).getController() === undefined) { //refresh
					this.getRouter().getTargets().display("notFound", {
						fromTarget: "home"
					});
				} else { //no refresh

					if (!jQuery.support.touch) { //setting compact on non touch devices
						this.getView().addStyleClass("sapUiSizeCompact");
					}

					var oItemModel = new sap.ui.model.json.JSONModel();

					//copy properties to second controller instance
					this._oValueHelpController = oRouter.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType.XML).getController()
						._oValueHelpController;
					this._aValidStockTypes = oRouter.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType.XML).getController()
						._aValidStockTypes;
					this._oNavigationServiceFields = {};
					this._oNavigationServiceFields.aHeaderFields = oRouter.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType
							.XML).getController()
						._oNavigationServiceFields.aHeaderFields;
					this._oNavigationServiceFields.aItemFields = oRouter.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType
							.XML).getController()
						._oNavigationServiceFields.aItemFields;

					this._aExtendedFields = oRouter.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType.XML).getController()
						._aExtendedFields;
					this.getView().setModel(oItemModel, "oItem");

					//originally in handleRouteMatched was moved her in 1.45
					this.getView().setModel(oRouter.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType
						.XML).getModel("oFrontend"), "oFrontend");
					//ValueHelp of Reason Code				 
					//this.getView().setModel("oData", this.getOwnerComponent().getModel("oData"));

					this.getView().byId("idGoodsMovementReasonCodeSelect").setModel("oData", this.getOwnerComponent().getModel("oData"));
					// this.getView().byId("idInventorySpecialStockSelection").setModel("oData", this.getOwnerComponent().getModel("oData"));

					if (this._aExtendedFields.length) { //extended fields --> 
						this.getView().getModel("oFrontend").setProperty("/ExtensionSectionVisible", true);
						this.getView().byId("idExtensionForm").setModel(this.getOwnerComponent().getModel("oData"));
						this.getView().byId("idExtensionForm").getModel().setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
						this.getView().byId("idExtensionForm").getModel().setDeferredGroups(["edititems"]);
						this.getView().byId("idExtensionForm").getModel().setChangeBatchGroups({
							"GR4PO_DL_Header": {
								batchGroupId: "edititems"
							},
							"GR4PO_DL_Item": {
								batchGroupId: "edititems"
							}
						});
					}
				}
			} //S2 View

			//both views

			this._oQuantFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
				maxFractionDigits: 3,
				minIntegerDigits: 1,
				maxIntegerDigits: 10,
				groupingEnabled: true
			});
			/**
			 * @property {objectl} _oBatchHelp Map for Batch help requests
			 */
			this._oBatchHelp = {};
			/**
			 * @property {object} _NumberFormatter formatter for numbers
			 */
			this._NumberFormatter = sap.ui.core.format.NumberFormat.getFloatInstance({
				style: "short"
			});

			//Message Manager
			this._oMessagePopover = new sap.m.MessagePopover({
				items: {
					path: "message>/",
					template: new sap.m.MessagePopoverItem({
						longtextUrl: "{message>descriptionUrl}",
						type: "{message>type}",
						markupDescription: true,
						title: "{message>message}",
						subtitle: "{message>additionalText}",
						description: "{message>description}"
					})
				}
			});
			this.getView().setModel(sap.ui.getCore().getMessageManager().getMessageModel(), "message");
			this.getView().addDependent(this._oMessagePopover);
			sap.ui.getCore().getMessageManager().registerObject(this.getView(), true);
			this.getView().getModel("message").attachMessageChange(null, this._onMessageChange, this);
		},

		/**
		 * @function private method for handling oData errors from backend.
		 * @param {object} oError - oData error object
		 * @param {object} oThis - current controller / required due to closesure of oData call
		 */
		//central error functions for oData calls
		_handleOdataError: function (oError, oThis) {
			if (!oThis) {
				oThis = this;
			}
			oThis._toggleBusy(false);
			if (oThis.getView().getModel("message")) {
				oThis.getView().getModel("message").fireMessageChange();
			}
			// if (this._SourceOfGR == this._SourceOfGRIsNoReference) {
			// 	var sValueState = sap.ui.core.ValueState.Error;
			// 	var oModel = oThis.getView().getModel("oFrontend");
			// 	oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", sValueState);
			// 	oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueStateText", this.getResourceBundle().getText(
			// 		"MATERIAL_VALUE_STATE_TEXT"));
			// }
		}, //central error functions for oData calls 
		/**
		 *Sets the busy indicator
		 * @private
		 * @param {boolean} bIsBusy state of busy indicator
		 */
		_toggleBusy: function (bIsBusy) {
			if (this.getView().byId("idProductsTable")) {
				this.getView().byId("idProductsTable").setBusy(bIsBusy);
				this.getView().byId("idProductsTable").setBusyIndicatorDelay(0);
			}
		},
		/**
		 * @function releases assigned resources in library
		 */
		onExit: function () {

			if (this._oValueHelpController) {
				this._oValueHelpController.exit();
			}

			// close open popovers
			if (sap.m.InstanceManager.hasOpenPopover()) {
				sap.m.InstanceManager.closeAllPopovers();
			}
			// close open dialogs
			if (sap.m.InstanceManager.hasOpenDialog()) {
				sap.m.InstanceManager.closeAllDialogs();
			}

			//deregister MessageModel
			this.getView().getModel("message").detachMessageChange(this._onMessageChange, this);

		},

		onMessagesButtonPress: function (oEvent) {

			var oMessagesButton = oEvent.getSource();
			this._oMessagePopover.toggle(oMessagesButton);
		},

		onAfterRendering: function () { //rerendering checks for new messages
			if ((this._MessageShown !== undefined) && (this._MessageShown === false)) {
				this._oMessagePopover.openBy(this.getView().byId("idMessageIndicator"));
				this._MessageShown = true;
			}

			//copilot check for GR without Reference
			if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
				if (sap.cp && sap.cp.ui.services && sap.cp.ui.services.CopilotApi) {
					sap.cp.ui.services.CopilotApi.getChats().then(function (aChats) {
						this._aCopilotChats = aChats;
					}.bind(this));
					this._oCopilotActive = true;
					this.getView().getModel("oFrontend").setProperty("/CopilotActive", this._oCopilotActive); //Copilot active on system
				}
			}
		},

		/**
		 * Event handler for message model changes, fired if message models is changed
		 * @param {sap.ui.base.Event}  oControlEvent
		 * @private
		 */
		_onMessageChange: function (oControlEvent) {
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom" && this.getView().byId(
					"idPage").getMessagesIndicator()
				.getDomRef() !== null) { //allready con
				this._oMessagePopover.openBy(this.getView().byId("idMessageIndicator"));
			} else {
				this._MessageShown = false;
			}
		},

		_devicehandling: function (mparams) {
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
				if (Device.resize.width >= 1900) {
					this.getView().addStyleClass("sapUiSizeCompact");
				} else if (Device.resize.width >= 450) {
					this.getView().byId("POInput").setWidth("100%");
				} else {
					this.getView().byId("POInput").setWidth("100%");
					this.getView().byId("idPOItemsCountTableHeader").setWidth("4rem");
				}
			}
		},

		/* =========================================================== */
		/* Attachment                                                  */
		/* =========================================================== */

		/**
		 * Load attachment component
		 * @param {string} sKey the key from app state to show attachment
		 * @private
		 */
		_loadAttachmentComponent: function (sKey) {
			try {
				var oModel = this.getView().getModel("oFrontend");
				var Pur_order = oModel.getProperty("/Ebeln");
				if (Pur_order) {
					var tempkey = this.getUniqueKey();
					var asMode = "I";
					var objectType = "BUS2017";
					var that = this;
					if (sKey) { // apply key from app state when back navigation
						this.temp_objectKey = sKey;
					} else {
						this.temp_objectKey = Pur_order + "GR" + tempkey;
					}

					if (!this.oCompAttachProj) {
						//check if app runs with mock data
						if (this.getOwnerComponent().getModel("oDataHelp").getServiceMetadata().dataServices.schema[0].entityType.length >= 15) {
							this.oCompAttachProj = this.getOwnerComponent().createComponent({
								usage: "attachmentReuseComponent",
								settings: {
									mode: asMode,
									objectKey: this.temp_objectKey,
									objectType: objectType
								}
								//semanticObject: owner._semanticObject,
								//onupload: [that.handleUpload, that]}
							});
							this.oCompAttachProj.then(function (successValue) {
								that.byId("idastestcompContainer").setComponent(successValue);
							});
						} else { //app runs with mock data --> hide the attachment section
							oModel.setProperty("/AttachmentVisible", false);
						}
					}
				}

			} catch (err) { //attachment service could not be load --> hide the section
				oModel.setProperty("/AttachmentVisible", false);
			}
		}, //_loadAttachmentComponent

		getUniqueKey: function () {

			var oDateformat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "ddMMYYYYHHmmss"
			});
			var oDate = new Date();
			return oDateformat.format(oDate);

		},

		/* =========================================================== */
		/* private methods                                             */
		/* =========================================================== */
		/**
		 * @function creates initial frontend before any input
		 * @return {object} inital frontend configuration
		 */
		_getInitFrontend: function () {
			var sMaxSuggestionWidth = "50%";
			if (!jQuery.support.touch) { //setting compact on non touch devices
				sMaxSuggestionWidth = "35%";
			}

			var oInitFrontend = {
				saveAsTileTitle: "",
				saveAsTileSubtitle: "",
				saveAsTileURL: "",
				shareOnJamTitle: "",

				searchPlaceholderText: "",
				fullscreenTitle: "",
				searchFieldLabel: "",

				visible: false,
				DocumentInputVisible: true, //no reference
				BillOfLadingVisible: true, //no reference
				HeaderContentVisible: true, //no reference
				ColumnOpenQuantityVisible: true, //no reference
				Objectheader: "",
				Objectheadertext: "",
				CopyButtonVisible: false,
				DeleteButtonVisible: false,
				PostButtonEnabled: false,
				PostButtonVisible: false,
				ScanButtonVisible: false,
				DocumentDate: this._oDateFormat.format(new Date()),
				PostingDate: this._oDateFormat.format(new Date()),
				DocumentDate_valueState: sap.ui.core.ValueState.None,
				PostingDate_valueState: sap.ui.core.ValueState.None,
				ColumnBatchVisible: false, //opt in
				ColumnManufactureDateVisible: false,
				ColumnShelfLifeExpirationDateVisible: false,
				ColumnStorageBinVisible: false,
				DeliveredQuantityEditable: true,
				StockTypeNOREFEnabled: true,
				DeliveredUnitEditable: true,
				ManufactureDateMandatory_valueState: sap.ui.core.ValueState.None,
				ShelfLifeExpirationDateMandatory_valueState: sap.ui.core.ValueState.None,
				Items: [],
				VersionForPrintingSlipAppSetting: this._aVersionForPrintingSlipAppSetting, // used in personalization setting
				VersionForPrintingSlip: this._aVersionForPrintingSlip,
				VersionForPrintingSlip_selectedKey: "0",
				SourceOfGR: this._SourceOfGR,
				ExtensionSectionVisible: false, //==> controls visibility of extension section on detail page
				maxSuggestionWidth: sMaxSuggestionWidth,
				CopilotActive: this._oCopilotActive //true --> Copilot is active in system
			};

			if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
				oInitFrontend.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PO");
				oInitFrontend.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PO");
				oInitFrontend.searchFieldLabel = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PO");
				oInitFrontend.Ebeln_label = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PO");
				oInitFrontend.Ebeln_maxLength = 10; //max Length used in UI
				oInitFrontend.Ebeln_possibleLength = [10]; //possible other lengh to be supported, filled dynamically from value helps
			} else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) { //Production Order
				oInitFrontend.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PROD");
				oInitFrontend.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PROD");
				oInitFrontend.searchFieldLabel = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PROD");
				oInitFrontend.Ebeln_label = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PROD");
				oInitFrontend.Ebeln_maxLength = 12; //max Length used in UI
				oInitFrontend.Ebeln_possibleLength = [12]; //possible other lengh to be supported, filled dynamically from value helps
				oInitFrontend.BillOfLadingVisible = false;
			} else if (this._SourceOfGR === this._SourceOfGRIsNoReference) { //No Reference
				oInitFrontend.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_NOREF");
				oInitFrontend.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_NOREF");
				oInitFrontend.Objectheader = this.getResourceBundle().getText("OBJECT_HEADER_NOREF");
				oInitFrontend.DocumentInputVisible = false;
				oInitFrontend.visible = true;
				oInitFrontend.BillOfLadingVisible = false;
				oInitFrontend.PostButtonVisible = true;
				oInitFrontend.ColumnNonVltdGRBlockedStockQty = false;
				oInitFrontend.ColumnOpenQuantityVisible = false;
				oInitFrontend.ColumnSplitVisible = false;
				oInitFrontend.ColumnIsReturnsItemVisible = false;
				oInitFrontend.ColumnAccountAssignmentVisible = false;
				oInitFrontend.CopyButtonVisible = true;
				oInitFrontend.DeleteButtonVisible = true;
				oInitFrontend.saveShareEmailActive = false;
				oInitFrontend.shareTileActive = false;
			} else {
				oInitFrontend.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_DL");
				oInitFrontend.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_DL");
				oInitFrontend.searchFieldLabel = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_DL");
				oInitFrontend.Ebeln_label = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_DL");
				oInitFrontend.Ebeln_maxLength = 10; //max Length used in UI
				oInitFrontend.Ebeln_possibleLength = [9, 10]; //possible other lengh to be supported, filled dynamically from value helps
			}

			return oInitFrontend;

		},
		/**
		 * @function creates initial private properties of the controller
		 */
		_initController: function () {
			//Fixed values for printing
			this._aVersionForPrintingSlip = [];
			this._aVersionForPrintingSlip.push({
				key: "0",
				text: this.getResourceBundle().getText("SELECT_ITEM_OUTPUT_NO")
			});
			this._aVersionForPrintingSlip.push({
				key: "1",
				text: this.getResourceBundle().getText("SELECT_ITEM_OUTPUT_IS")
			});
			this._aVersionForPrintingSlip.push({
				key: "2",
				text: this.getResourceBundle().getText("SELECT_ITEM_OUTPUT_ISIT")
			});
			this._aVersionForPrintingSlip.push({
				key: "3",
				text: this.getResourceBundle().getText("SELECT_ITEM_OUTPUT_CS")
			});

			this._aVersionForPrintingSlipAppSetting = [{
				key: "0",
				text: this.getResourceBundle().getText("SELECT_ITEM_OUTPUT_NO")
			}, {
				key: "1",
				text: this.getResourceBundle().getText("SELECT_ITEM_OUTPUT_IS")
			}, {
				key: "2",
				text: this.getResourceBundle().getText("SELECT_ITEM_OUTPUT_ISIT")
			}, {
				key: "3",
				text: this.getResourceBundle().getText("SELECT_ITEM_OUTPUT_CS")
			}, {
				key: "none",
				text: this.getResourceBundle().getText("SELECT_ITEM_OUTPUT_NONE") // allow user to set none, so that cloud BAdI could work
			}];

			//set local hard coded default in any case
			this._oPersonalizedDataContainer = {
				deliveredQuantityDefault2open: true,
				deliveredQuantityDefault20: false,
				PresetDocumentItemTextFromPO: false,
				SelectPROD: true, //Value Help control  --> Select Production Orders
				EnableBarcodeScanning: false, //BarcodeScanning Button
				VersionForPrintingSlip: "0" //2788600
			};

			//defines what is stored in innerAppState
			if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
				this._oNavigationServiceFields = {
					aHeaderFields: ["DocumentDate", "PostingDate", "Ebeln", "DeliveryDocumentByVendor", "MaterialDocumentHeaderText",
						"BillOfLading", "VersionForPrintingSlip_selectedKey"
					],
					aItemFields: ["DocumentItem", "ItemCounter", "DocumentItemText", "DeliveredQuantity_input", "DeliveredUnit_input",
						"OpenQuantity",
						"Unit", "Plant", "StorageLocation", "StockType_selectedKey", "DeliveryCompleted", "NonVltdGRBlockedStockQty",
						"StorageLocation_input", "ReasonCode",
						"ShelfLifeExpirationDate", "ManufactureDate", "Selected"
					]
				};
			} else { // GR without reference
				this._oNavigationServiceFields = {
					aHeaderFields: ["DocumentDate", "PostingDate",
						"VersionForPrintingSlip_selectedKey"
					],
					aItemFields: ["DocumentItem", "ItemCounter", "Material_Input", "MaterialText", "Material_Name", "POItemsCountTableHeader",
						"OpenQuantity",
						"Unit", "Plant", "Plant_Input", "StorageLocation", "StockType_selectedKey", "InventorySpecialStockTypeName",
						"StorageLocation_input", "ReasonCode",
						"ShelfLifeExpirationDate", "ManufactureDate", "Selected"
					]
				};
			}

			/**
			 * @property {objectl} _isIntentSupported reference to supported intents
			 */
			this._isIntentSupported = {
				MaterialMovementDisplay: false, //Controller wide store
				SupplierDisplay: false,
				MaterialDisplay: false,
				PurchaseOrderDisplay: false,
				BatchCreate: false,
				ProductionOrderDisplay: false,
				OutboundDeliveryDisplay: false,
				InboundDeliveryDisplay: false
			};

			this._aCopilotChats = []; //List of copilot chats

		},

		// Formatter 
		/**
		 * @function formatter to put name + key in brackets
		 * @param {string} iValueName name of value
		 * @param {string} iValue key of value
		 * @retrun {string} formatted string
		 */
		concatenateNameIdFormatter: function (iValueName, iValueId) {
			if (iValueName) {
				if (iValueId !== "") {
					iValueName = iValueName + " (" + iValueId + ")";
				}
				return iValueName;
			} else {
				//provide id if name is not supplied
				if (iValueId) {
					return iValueId;
				} else { //no name and id
					return null;
				}
			}
		}, //End Formatter adds field Id with brackets

		/**
		 * formatter to merge string document number and year
		 * @param {string} sDocumentNr document number
		 * @param {string} sDocumentYear document year
		 * @retrun {string} formatted string
		 */
		concatenateDocumentNumberYear: function (sDocumentNr, sDocumentYear) {
			if (sDocumentYear && (sDocumentYear !== "0000")) {
				return sDocumentNr + "/" + sDocumentYear;
			}
			return sDocumentNr;
		},

		/**
		 * formatter to show the number of components
		 * @param {string} sText components text
		 * @param {int} iNumber the number of components
		 * @retrun {string} formatted string
		 */
		concatenateNumberOfComponents: function (sText, iNumber) {
			return sText + " (" + iNumber + ")";
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Navigates back in the browser history, if the entry was created by this app.
		 * If not, it navigates to the Fiori Launchpad home page.
		 * @public
		 */
		onNavBack: function () {

			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			var that = this;
			var resourceBundle = that.getResourceBundle();
			var ChangeOK = true;

			this.oModel = this.getOwnerComponent().getModel("oData");
			this.aBinData = this.getView().getModel("bindata").getData();

			// Check data loss
			var sCurrentModel = JSON.stringify(this._getInnerAppState());
			if (sCurrentModel && this._initialDataLoaded && (this._initialDataLoaded != null)) {

				var sOldModel = JSON.stringify(this._getInnerAppState(this._initialDataLoaded));
				if (sOldModel !== sCurrentModel) {
					// Warning for Data Loss
					var ChangeOK = false;
					sap.m.MessageBox.confirm(resourceBundle.getText("MESSAGE_DATA_LOSS"), {
						icon: sap.m.MessageBox.Icon.QUESTION,
						title: resourceBundle.getText("MESSAGE_DATA_LOSS_TITLE"),
						onClose: fnCallbackConfirm,
						styleClass: "sapUiSizeCompact",
						initialFocus: sap.m.MessageBox.Action.CANCEL
					});
				}
			}

			if (ChangeOK === true) {
				//if (this.getView().byId("POInput").getEditable() === false) { //supplying a PO will set Editable = false //2831669
				// The history contains a previous entry due to navigation event
				oCrossAppNavigator.backToPreviousApp();
				//} else {                                                                                                 //2831669
				// Navigate back to FLP home
				//	oCrossAppNavigator.toExternal({                                                                        //2831669
				//		target: {                                                                                          //2831669
				//			shellHash: "#"                                                                                 //2831669
				//		}                                                                                                  //2831669
				//	});                                                                                                    //2831669
				//}                                                                                                        //2831669
			}
			//local callback
			function fnCallbackConfirm(sResult) {
				if (sResult === "OK") {

					if (this.aBinData && this.aBinData.Bin) {
						var aData = this.aBinData.Bin;

						for (var i = 0; i < aData.length; i++) {
							this.oModel.remove(aData[i], {
								success: function (oData, response) {}.bind(this),
								error: function (oError) {
									console.error(oError);
								}.bind(this)
							});
						}
					}

					//if (that.getView().byId("POInput").getEditable() === false) { //supplying a PO will set Editable = false //2831669
					// The history contains a previous entry
					oCrossAppNavigator.backToPreviousApp();
					//} else {                                                                                                 //2831669
					// Navigate back to FLP home
					//	oCrossAppNavigator.toExternal({                                                                        //2831669
					//		target: {                                                                                          //2831669
					//			shellHash: "#"                                                                                 //2831669
					//		}                                                                                                  //2831669
					//	});                                                                                                    //2831669
					//}                                                                                                        //2831669
				}
			}

		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function () {
			var ext_href_For_start_app;
			var aUrls = (new URI()).toString().split("#");
			if (aUrls[0]) {
				ext_href_For_start_app = aUrls[0] + this._generateAppStateExternalUrl();
			}

			var oViewModel = this.getModel("oFrontend");
			var oShareDialog = sap.ui.getCore().createComponent({
				name: "sap.collaboration.components.fiori.sharing.dialog",
				settings: {
					object: {
						id: ext_href_For_start_app,
						share: oViewModel.getProperty("/shareOnJamTitle")
					}
				}
			});
			oShareDialog.open();
		},

		/**
		 * @function type ahead event handler of PO entry field
		 * @param {sap.ui.base.Event} oEvent object supplied by the UI
		 */
		handleSuggest: function (oEvent) {
			var sTerm = oEvent.getParameter("suggestValue").trim(); //Remove spaces of the imported string
			if (sTerm) {
				var oFilter = {};
				var aFilters = [];
				var aFilterComplete = [];
				var oFilterComplete = {};
				// search for PO after 4 digits
				if (sTerm.length > 3) {
					aFilters.push(new sap.ui.model.Filter("InboundDelivery", sap.ui.model.FilterOperator.Contains, sTerm));
				}
				// search for Supplier
				if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder || this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
					aFilters.push(new sap.ui.model.Filter("VendorName", sap.ui.model.FilterOperator.Contains, sTerm));
				}
				// search for external delivery id
				if (this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
					aFilters.push(new sap.ui.model.Filter("DeliveryDocumentBySupplier", sap.ui.model.FilterOperator.Contains, sTerm));
				}
				// search for SupplyingPlant
				if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
					aFilters.push(new sap.ui.model.Filter("SupplyingPlant", sap.ui.model.FilterOperator.Contains, sTerm));
					aFilters.push(new sap.ui.model.Filter("SupplyingPlantName", sap.ui.model.FilterOperator.Contains, sTerm));
				}
				//Production Order  
				oFilter = new sap.ui.model.Filter(aFilters, false);

				//Source of GR as filter criteria
				aFilterComplete.push(oFilter);
				aFilterComplete.push(new sap.ui.model.Filter("SourceOfGR", sap.ui.model.FilterOperator.EQ, this._SourceOfGR));

				oFilterComplete = new sap.ui.model.Filter(aFilterComplete, true);

				this.getView().byId("POInput").removeAllSuggestionColumns();
				var oTemplate = new sap.m.ColumnListItem({
					cells: [new sap.m.Label({
						text: "{oData>InboundDelivery}"
					})]
				});

				if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
					this.getView().byId("POInput").addSuggestionColumn(
						new sap.m.Column({
							header: new sap.m.Label({
								text: this.getResourceBundle().getText("PO_SEARCH_FIELD_LABEL")
							})
						})
					);
				} else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) { //Production Order
					this.getView().byId("POInput").addSuggestionColumn(
						new sap.m.Column({
							header: new sap.m.Label({
								text: this.getResourceBundle().getText("PROD_SEARCH_FIELD_LABEL")
							})
						})
					);
				} else { // Inbound Delivery
					this.getView().byId("POInput").addSuggestionColumn(
						new sap.m.Column({
							header: new sap.m.Label({
								text: this.getResourceBundle().getText("DL_SEARCH_FIELD_LABEL")
							})
						})
					);
					//  column for external delivery id
					this.getView().byId("POInput").addSuggestionColumn(
						new sap.m.Column({
							header: new sap.m.Label({
								text: this.getResourceBundle().getText("EXT_DL_SEARCH_FIELD_LABEL")
							})
						})
					);
					oTemplate.addCell(
						new sap.m.Label({
							text: "{oData>DeliveryDocumentBySupplier}"
						})
					);
				}
				if (this._oPersonalizedDataContainer.SelectPROD === true && this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
					//Production Order 
					oTemplate.addCell(
						new sap.m.Label({
							//	text: "{oData>OrderType}"
							text: "{parts:[{path: 'oData>OrderTypeName'},{path: 'oData>OrderType'}], formatter: '.formatter.concatenateNameIdFormatter'}"
						}));

					this.getView().byId("POInput").addSuggestionColumn(
						new sap.m.Column({
							header: new sap.m.Label({
								text: this.getResourceBundle().getText("ORDERTYPE_SEARCH_FIELD_LABEL")
							})
						}));
					oTemplate.addCell(
						new sap.m.Label({
							//text: "{oData>MfgOrderPlannedStartDate}"
							text: "{path: 'oData>MfgOrderPlannedStartDate', type:'sap.ui.model.type.Date', pattern: 'yyyy/MM/dd' }"
						}));

					this.getView().byId("POInput").addSuggestionColumn(
						new sap.m.Column({
							header: new sap.m.Label({
								text: this.getResourceBundle().getText("STARTDATE_SEARCH_FIELD_LABEL")
							})
						}));

					oTemplate.addCell(
						new sap.m.Label({
							//text: "{oData>MfgOrderPlannedStartDate}"
							text: "{path: 'oData>MfgOrderPlannedEndDate', type:'sap.ui.model.type.Date', pattern: 'yyyy/MM/dd' }"
						}));

					this.getView().byId("POInput").addSuggestionColumn(
						new sap.m.Column({
							header: new sap.m.Label({
								text: this.getResourceBundle().getText("ENDDATE_SEARCH_FIELD_LABEL")
							})
						}));

				} else {

					if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder || this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
						oTemplate.addCell(
							new sap.m.Label({
								text: "{oData>VendorName}"
							}));

						this.getView().byId("POInput").addSuggestionColumn(
							new sap.m.Column({
								header: new sap.m.Label({
									text: this.getResourceBundle().getText("SUPPLIER_SEARCH_FIELD_LABEL")
								})
							})
						);

					}

					if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
						oTemplate.addCell(
							new sap.m.Label({
								//	text: "{parts:[{path:'oData>SupplyingPlantName'}, {path:'oData>SupplyingPlant'}], formatter: 'this.concatenateNameIdFormatter' }"
								text: "{oData>SupplyingPlant}"
							}));

						this.getView().byId("POInput").addSuggestionColumn(
							new sap.m.Column({
								header: new sap.m.Label({
									text: this.getResourceBundle().getText("SUPPLYINGPLANT_SEARCH_FIELD_LABEL")
								})
							})
						);

					}
				}

				this.getView().byId("POInput").bindAggregation("suggestionRows", {
					path: "/GR4PO_DL_Headers",
					model: "oData",
					filters: aFilterComplete,
					template: oTemplate
				});

				if (this.getView().byId("POInput").getBinding("suggestionRows")) { // only if exists
					this.getView().byId("POInput").getBinding("suggestionRows").attachDataReceived(
						this._setEbelnPossibleLength, this);
				}

			}
		}, //end handleSuggest

		/**
		 * @function private call back to calculate possible length of purchaseorder/inbound delivery key
		 * @param {sap.ui.base.Event} oEvent object supplied by the oData Service DataReceived EVent
		 */
		_setEbelnPossibleLength: function (oEvent) {
			if (oEvent.getParameter("data") && oEvent.getParameter("data").results.length > 0) {
				var aEbeln_possibleLength = this.getView().getModel("oFrontend").getProperty("/Ebeln_possibleLength");
				var sEbeln;
				for (var i = 0; i < oEvent.getParameter("data").results.length; i++) {
					if (oEvent.getParameter("data").results[i].InboundDelivery || oEvent.getParameter("data").results[i].DeliveryDocument) { //dynamic call, also from value help
						sEbeln = oEvent.getParameter("data").results[i].InboundDelivery || oEvent.getParameter("data").results[i].DeliveryDocument;
					} else {
						if (oEvent.getParameter("data").results[i].PurchaseOrder) {
							sEbeln = oEvent.getParameter("data").results[i].PurchaseOrder;
						} else { //Production Order
							sEbeln = oEvent.getParameter("data").results[i].OrderID;
						}
					}
					if (aEbeln_possibleLength.indexOf(parseInt(sEbeln.length, 10)) === -1) { //new length ?
						aEbeln_possibleLength.push(parseInt(sEbeln.length, 10));
						if (this.getView().getModel("oFrontend").getProperty("/Ebeln_maxLength") < parseInt(sEbeln.length, 10)) {
							this.getView().getModel("oFrontend").setProperty("/Ebeln_maxLength", parseInt(sEbeln.length, 10));
						}
					}
				}
				this.getView().getModel("oFrontend").setProperty("/Ebeln_possibleLength", aEbeln_possibleLength); //Write Back
			}
		},

		/**
		 * @function value Help of PO entry field based on ValueHelpDialog and Entity /PoHelpSet
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handlePOHelp: function (oEvent) {
			var resourceBundle = this.getResourceBundle();
			var that = this;
			var sTitle = "";
			if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
				sTitle = resourceBundle.getText("TITLE_PO_HELP");
			} else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) { //Production Order
				sTitle = resourceBundle.getText("TITLE_PROD_HELP");
			} else {
				sTitle = resourceBundle.getText("TITLE_DL_HELP");
			}
			//Presetting a search term from main windwo
			var oPOInput = this.getView().byId("POInput");
			var sFilterTerm = "";
			if (oPOInput.getValue().length > 0) {
				sFilterTerm = oPOInput.getValue();
			}
			var oPOValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
				basicSearchText: sFilterTerm,
				id: "idValueHelpDialog",
				title: sTitle,
				supportMultiselect: false,
				supportRanges: false,
				supportRangesOnly: false,

				ok: function (oControlEvent) {
					var aTokens = oControlEvent.getParameter("tokens");

					var oRow = aTokens[0].data(); //oRow.row.PurchaseOrder
					var sPurchaseOrderNumber = "";
					oPOValueHelpDialog.close();

					// write selected value back
					if (that._SourceOfGR === that._SourceOfGRIsPurchaseOrder) {
						sPurchaseOrderNumber = oRow.row.PurchaseOrder;
					} else if (that._SourceOfGR === that._SourceOfGRIsProductionOrder) { //Production Order
						sPurchaseOrderNumber = oRow.row.OrderID;
					} else {
						sPurchaseOrderNumber = oRow.row.DeliveryDocument;
					}
					if (sPurchaseOrderNumber) {
						var oPOInput = that.getView().byId("POInput");
						oPOInput.setValue(sPurchaseOrderNumber);
						//oPOInput.fireSuggestionItemSelected({selectedItem:new sap.ui.core.Item( {text:sPurchaseOrderNumber})});
						oPOInput.fireChangeEvent(sPurchaseOrderNumber);
					}
				},

				cancel: function (oControlEvent) {
					oPOValueHelpDialog.close();
				},

				afterClose: function () {
					oPOValueHelpDialog.destroy();
				}
			});

			var sAggregation = ""; //Aggregation depends on device !
			var oTemplate = {}; //Used on Mobil Devices as sap.m.table template
			var bControlIsSAPmTable;
			if (oPOValueHelpDialog.getTable().getMetadata().getElementName() !== "sap.m.Table") {
				sAggregation = "rows";
				bControlIsSAPmTable = false;
			} else {
				sAggregation = "items";
				bControlIsSAPmTable = true;
			}

			var sPath = "";
			var aCols = [];
			var sSelect = "";
			if (that._SourceOfGR === that._SourceOfGRIsPurchaseOrder) { //Purchase Order
				sPath = "/PoHelpSet";

				aCols = [{
					label: resourceBundle.getText("LABEL_PO_COL"),
					template: "PurchaseOrder"
				}, {
					label: resourceBundle.getText("LABEL_PO_CATEGORY_TEXT"),
					template: "PurchasingDocumentCategoryName"
				}, {
					label: resourceBundle.getText("LABEL_PO_TYPE_TEXT"),
					template: "PurchasingDocumentTypeName"
				}];

				sSelect = "PurchaseOrder,PurchasingDocumentCategoryName,PurchasingDocumentTypeName";

				//Purchasing Document
				aCols.push({
					label: resourceBundle.getText("LABEL_SUP_COL"),
					template: "Supplier"
				});
				aCols.push({
					label: resourceBundle.getText("LABEL_SUP_NAME_COL"),
					template: "SupplierName"
				});
				aCols.push({
					label: resourceBundle.getText("LABEL_CITY_COL"),
					template: "SupplierCityName"
				});

				sSelect += ",Supplier,SupplierName,SupplierCityName";

				aCols.push({
					label: resourceBundle.getText("SUPPLYINGPLANT_SEARCH_FIELD_LABEL"),
					template: "SupplyingPlant"
				});
				aCols.push({
					label: resourceBundle.getText("SUPPLYINGPLANTNAME_SEARCH_FIELD_LABEL"),
					template: "SupplyingPlantName"
				});
				sSelect += ",SupplyingPlant,SupplyingPlantName";

				//Material
				aCols.push({
					label: resourceBundle.getText("LABEL_MATERIAL_COL"),
					template: "Material"
				});
				aCols.push({
					label: resourceBundle.getText("LABEL_MATERIAL_TXT_COL"),
					template: "PurchaseOrderItemText" //can also be from the PO
				});

				sSelect += ",Material,PurchaseOrderItemText";

			} else if (that._SourceOfGR === that._SourceOfGRIsProductionOrder) { //Production Order
				sPath = "/MMIMProductionOrderVH";
				aCols = [{
					label: resourceBundle.getText("LABEL_PROD_COL"),
					template: "OrderID"
				}, {
					label: resourceBundle.getText("LABEL_MATERIAL_COL"),
					template: "Material"
				}, {
					label: resourceBundle.getText("LABEL_MATERIAL_PROD_TXT_COL"),
					template: "MaterialName"
				}, {
					label: resourceBundle.getText("PRODUCTION_PLANT_LABEL"),
					template: "ProductionPlant"
				}, {
					label: resourceBundle.getText("PLANNING_PLANT_LABEL"),
					template: "PlannedPlant"
				}, {
					label: resourceBundle.getText("PROD_TYPE_LABEL"),
					template: "OrderTypeName"
				}];
				sSelect =
					"OrderID,Material,MaterialName,ProductionPlant,PlannedPlant,OrderTypeName";

			} else { // Inbound Delivery
				sPath = "/HMmimGr4inbdelSet";

				aCols = [{
					label: resourceBundle.getText("LABEL_DL_COL"),
					template: "DeliveryDocument"
				}, {
					label: resourceBundle.getText("LABEL_DL_ITEM_TEXT"),
					template: "DeliveryDocumentItem"
				}, {
					label: resourceBundle.getText("LABEL_DL_EXT_ID_TEXT"),
					tooltip: resourceBundle.getText("LABEL_DL_EXT_ID_TEXT"),
					template: "DeliveryDocumentBySupplier"
				}, {
					label: resourceBundle.getText("LABEL_MATERIAL_TXT_COL"),
					template: "DeliveryDocumentItemText"
				}, {
					label: resourceBundle.getText("LABEL_SUP_COL"),
					template: "Supplier"
				}, {
					label: resourceBundle.getText("LABEL_SUP_NAME_COL"),
					template: "SupplierName"
				}, {
					label: resourceBundle.getText("LABEL_CITY_COL"),
					template: "SupplierCityName"
				}, {
					label: resourceBundle.getText("LABEL_PO_COL"),
					template: "PurchaseOrder"
				}, {
					label: resourceBundle.getText("LABEL_PO_ITEMTYPE_TEXT"),
					template: "PurchaseOrderItem"
				}];
				sSelect =
					"DeliveryDocument,DeliveryDocumentItem,DeliveryDocumentBySupplier,DeliveryDocumentItemText,PurchaseOrder,PurchaseOrderItem,Supplier,SupplierName,SupplierCityName";
			}

			var oColModel = new sap.ui.model.json.JSONModel({
				cols: aCols
			});
			oPOValueHelpDialog.setModel(oColModel, "columns");

			//on Phone create ColumnListItem Template based on Cols Content
			if (bControlIsSAPmTable === true) {
				oTemplate = new sap.m.ColumnListItem({
					cells: []
				});
				for (var j = 0; j < aCols.length; j++) {
					oTemplate.addCell(
						new sap.m.Label({
							text: "{" + aCols[j].template + "}"
						})
					); // addCell
				} // for
			} //bControlIsSAPmTable

			oPOValueHelpDialog.setModel(this.getView().getModel("oData2"));
			switch (that._SourceOfGR) {
			case that._SourceOfGRIsPurchaseOrder:
				oPOValueHelpDialog.setKey("PurchaseOrder");
				break;
			case that._SourceOfGRIsInboundDelivery:
				oPOValueHelpDialog.setKey("DeliveryDocument");
				break;
			default: //ProductionOrder
				oPOValueHelpDialog.setKey("OrderID");
				break;
			}

			//FilterBar
			var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
				advancedMode: true,
				expandAdvancedArea: true,

				//Search Event Handler
				search: function (oEvent) {
					var oSearchField = sap.ui.getCore().byId("idSearch");
					var sSearch = oSearchField.getValue();
					var aSelectionSet = oEvent.getParameter("selectionSet");
					var aFilters = aSelectionSet.reduce(function (aResult, oControl) {
						if (oControl.getSelectedItem() && oControl.getSelectedItem().getKey()) {
							aResult.push(new Filter({
								path: oControl.getName(),
								operator: FilterOperator.Contains,
								value1: oControl.getSelectedItem().getKey()
							}));
						}

						return aResult;
					}, []);
					var oFilter = new sap.ui.model.Filter(aFilters, true);
					if (sSearch.length > 0) {
						var mParams = {
							custom: {
								"search": sSearch
							},
							select: sSelect
						};
						if (bControlIsSAPmTable === false) { //no Phone?
							oPOValueHelpDialog.getTable().bindAggregation(sAggregation, {
								path: sPath,
								parameters: mParams,
								filters: oFilter

							});
						} else { //sap.m.Table needs template
							oPOValueHelpDialog.getTable().bindAggregation(sAggregation, {
								path: sPath,
								template: oTemplate,
								parameters: mParams,
								filters: oFilter
							});
						}
						oPOValueHelpDialog.getTable().setBusy(true);
					} else { // reset search
						if (bControlIsSAPmTable === false) { //no Phone?
							oPOValueHelpDialog.getTable().bindAggregation(sAggregation, {
								path: sPath,
								parameters: {
									select: sSelect
								},
								filters: oFilter
							});
						} else { //sap.m.Table needs template
							oPOValueHelpDialog.getTable().bindAggregation(sAggregation, {
								path: sPath,
								template: oTemplate,
								parameters: {
									select: sSelect
								},
								filters: oFilter
							});
						}

						oPOValueHelpDialog.getTable().setBusy(true);
					}

					oPOValueHelpDialog.getTable().getBinding(sAggregation).attachDataReceived(
						function (oDataEvent) {
							if (oDataEvent.getParameter("data") && oDataEvent.getParameter("data").results.length === 0) { // shows No matching items found
								oPOValueHelpDialog.TableStateDataFilled();
							}
							oPOValueHelpDialog.getTable().setBusy(false);
							that._setEbelnPossibleLength(oDataEvent);
						}, this);
				}
			});
			var oFilterGroupItem = new sap.ui.comp.filterbar.FilterGroupItem({
				groupName: "PD01",
				name: "PurchasingDocumentCategoryName",
				label: this.getResourceBundle().getText("LABEL_PO_CATEGORY_TEXT"),
				visibleInFilterBar: true
			});

			// add advance search fields only for Purchasing Document App
			if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
				var aSelectItem = [new sap.ui.core.Item({
					key: "",
					text: this.getResourceBundle().getText("TEXT_ALL_CATERGORIES")
				}), new sap.ui.core.Item({
					key: "F",
					text: this.getResourceBundle().getText("TEXT_PURCHASE_ORDERS")
				}), new sap.ui.core.Item({
					key: "L",
					text: this.getResourceBundle().getText("TEXT_SCHEDULING_AGREEMENT")
				})];
				oFilterGroupItem.setControl(new sap.m.Select({
					name: "PurchasingDocumentCategory",
					items: aSelectItem
				}));
				oFilterBar.addFilterGroupItem(oFilterGroupItem);
			}

			//trigger the search event handler
			oFilterBar.setBasicSearch(new sap.m.SearchField({
				id: "idSearch",
				value: sFilterTerm,
				tooltip: this.getResourceBundle().getText("SEARCH_FIELD_TOOLTIP"),
				showSearchButton: false,
				search: function (oEvent) {
					if (!oEvent.getParameter("clearButtonPressed")) {
						oPOValueHelpDialog.getFilterBar().search();
					}
				}.bind(this)
			}));
			oPOValueHelpDialog.setFilterBar(oFilterBar);

			//Model binding to value help table depends on filter text
			if (sFilterTerm) {
				var mParams2 = {
					custom: {
						"search": sFilterTerm
					},
					select: sSelect
				};
				if (bControlIsSAPmTable === false) { // noPhone ?
					oPOValueHelpDialog.getTable().bindAggregation(sAggregation, {
						path: sPath,
						parameters: mParams2
					});
				} else { //sap.m.Table needs template
					oPOValueHelpDialog.getTable().bindAggregation(sAggregation, {
						path: sPath,
						template: oTemplate,
						parameters: mParams2
					});
				}
				oPOValueHelpDialog.getTable().setBusy(true);
				oPOValueHelpDialog.getTable().getBinding(sAggregation).attachDataReceived(
					function (oDataEvent) {
						if (oDataEvent.getParameter("data") && oDataEvent.getParameter("data").results.length === 0) { // shows No matching items found
							oPOValueHelpDialog.TableStateDataFilled();
						}
						oPOValueHelpDialog.getTable().setBusy(false);
						that._setEbelnPossibleLength(oDataEvent);
					}, this);
			}
			oPOValueHelpDialog.open();
		},

		/**
		 * @function value help of Storage Location based on included library
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleStorageLocationHelp: function (oEvent) {
			var aValidStockTypesPerItem = [];
			var aValidStockTypes = [];
			var sMaterial = "";
			var sPlant = "";
			var sStockType_selectedKey = "";
			var sStorLocAutoCreationIsAllowed = false;
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
				var oSource = oEvent.getSource();
				var oParent = oSource.getParent();
				var aCells = oParent.getCells();
				if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
					sMaterial = aCells[2].getText();
					sMaterial = sMaterial.substr(1, sMaterial.length - 1);

					//getting the index of the table item and storing it in controller
					this._SelectedTableIndex = this._getSelectedItemInModel(oEvent);

					var oModel = this.getView().getModel("oFrontend");
					var aItems = oModel.getProperty("/Items");
					sPlant = aItems[this._SelectedTableIndex].Plant;
					sStockType_selectedKey = aItems[this._SelectedTableIndex].StockType_selectedKey;
					aValidStockTypesPerItem = aItems[this._SelectedTableIndex].StockType_input;
				} else {
					// sMaterial = aCells[3]._lastValue;
					this._SelectedTableIndex = this._getSelectedItemInModel(oEvent);
					var oModel = this.getView().getModel("oFrontend");
					var aItems = oModel.getProperty("/Items");
					sMaterial = aItems[this._SelectedTableIndex].Material_Input;
					sPlant = aItems[this._SelectedTableIndex].Plant;
					sStockType_selectedKey = aItems[this._SelectedTableIndex].StockType_selectedKey;
					aValidStockTypesPerItem = aItems[this._SelectedTableIndex].StockType_input;

				}
			} //S1 view
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
				var oItem = this.getModel("oItem");
				if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
					sMaterial = oItem.getProperty("/Material");
				} else {
					sMaterial = oItem.getProperty("/Material_Input");
				}
				sPlant = oItem.getProperty("/Plant");
				sStockType_selectedKey = oItem.getProperty("/StockType_selectedKey");
				aValidStockTypesPerItem = oItem.getProperty("/StockType_input");
			} //S2 view

			for (var i = 0; i < aValidStockTypesPerItem.length; i++) {
				// set the flag for the enhanced value help of storage location for the selected stock type (movement type) 
				if (aValidStockTypesPerItem[i].key === sStockType_selectedKey || (aValidStockTypesPerItem[i].key === "" &&
						sStockType_selectedKey === undefined)) {
					sStorLocAutoCreationIsAllowed = aValidStockTypesPerItem[i].StorLocAutoCreationIsAllowed;
				}
				// set the different stock types for movement type 101
				switch (aValidStockTypesPerItem[i].key) {
				case " ":
					aValidStockTypes.push("CurrentStock");
					break;
				case "":
					aValidStockTypes.push("CurrentStock");
					break;
				case "2":
					aValidStockTypes.push("QualityInspectionStockQuantity");
					break;
				case "3":
					aValidStockTypes.push("BlockedStockQuantity");
				}
			}

			var that = this;
			var oParams = {};
			oParams.Material = sMaterial;
			oParams.Plant = sPlant;
			oParams.StorLocAutoCreationIsAllowed = sStorLocAutoCreationIsAllowed;
			oParams.DisplayedStockTypes = aValidStockTypes;
			if (this._ResetStorageLocationBuffer === true && this._SourceOfGR !== this._SourceOfGRIsNoReference) {
				oParams.resetBuffer = true;
				this._ResetStorageLocationBuffer = false; //resetting the buffer
			}
			this._oValueHelpController.displayValueHelpStorageLocation4Material(oParams, function (oReturn) {
				that._handleValueHelpStorageLocationCallback(oReturn);
			}, that);

		},

		/**
		 * @function checks if any item has storage bin
		 * @param aItems all the purchase order items
		 * @return {boolean} true or false
		 */
		_isStorageBinInItems: function (aItems) {
			for (var i = 0; i < aItems.length; i++) {
				if (aItems[i].WarehouseStorageBin) {
					return true;
				}
			}
			return false;
		},

		/**
		 * @function call back function of Storage Location value Help
		 * @param oReturn Provided by Value Help containing selected values/or no selection
		 */
		_handleValueHelpStorageLocationCallback: function (oReturn) {
			var bSelectEnabled = false;
			var sMaterial;
			var sPlant;
			var sUoM;
			var sStorageLocation;
			var sStockTypekey;

			if (oReturn.selected === true) {
				var oModel = this.getModel("oFrontend");
				var aWMLStorageLocations = oModel.getProperty("/WMLStorageLocations");

				if (!aWMLStorageLocations) {
					var oDataModel = this.getOwnerComponent().getModel("oData");

					oDataModel.read("/WMLStorageLocations", {
						method: "GET",
						success: function (oData) {
							aWMLStorageLocations = [];
							if (oData.results) {
								oData.results.forEach(oResult => {
									var oWMLStorageLocation = Object.assign({}, oResult);
									delete oWMLStorageLocation.__metadata;
									aWMLStorageLocations.push(oWMLStorageLocation);
								});
							}
							oModel.setProperty("/WMLStorageLocations", aWMLStorageLocations);
							this._handleValueHelpStorageLocationCallback(oReturn);
						}.bind(this),
						error: function () {
							oModel.setProperty("/WMLStorageLocations", []);
						}
					});
					return;
				}
				var oWMLStorageLocation = aWMLStorageLocations.find(oItem => oItem.StorageLocation === oReturn.StorageLocation && oItem.WMLEnabled ===
					true);
				var bStorageLocationWMLEnabled = oWMLStorageLocation !== undefined;

				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
					//var oModel = this.getView().getModel("oFrontend");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation", oReturn.StorageLocation);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/WMLInScope", bStorageLocationWMLEnabled);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/WarehouseStorageBin", oReturn.StorageBin);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation_input", oReturn.StorageLocationName);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation_valueState", sap.ui.core.ValueState.None);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation_valueStateText", "");

					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) { // App "GR without Reference" has different behaviour
						bSelectEnabled = this._ItemConsistent(oModel.getProperty("/Items/" + this._SelectedTableIndex));
						if (bSelectEnabled === true) {
							oModel.setProperty("/Items/" + this._SelectedTableIndex + "/SelectEnabled", bSelectEnabled);
							oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Selected", bSelectEnabled);
						}
						//take care of select for (sub)items
						this._setSelectEnabled(oModel.getProperty("/Items/" + this._SelectedTableIndex));
						this._controlSelectAllAndPostButton(); //update buttons
						this._updateHiglightProperty(); //update highlight
					}

					// get actual material and material related master data in item
					sMaterial = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Material_Input");
					sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
					sUoM = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
					sStorageLocation = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation");
					sStockTypekey = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/StockType_selectedKey");
				}
				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
					var oItem = this.getView().getModel("oItem");
					oItem.setProperty("/StorageLocation", oReturn.StorageLocation);
					oItem.setProperty("/WMLInScope", bStorageLocationWMLEnabled);
					oItem.setProperty("/StorageLocation_input", oReturn.StorageLocationName);
					oItem.setProperty("/WarehouseStorageBin", oReturn.StorageBin);
					oItem.setProperty("/StorageLocation_valueState", sap.ui.core.ValueState.None);
					oItem.setProperty("/StorageLocation_valueStateText", "");
					oItem.setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(oItem.getData()));
					// get actual material and material related master data in item
					sMaterial = oItem.getProperty("/Material_Input");
					sPlant = oItem.getProperty("/Plant");
					sUoM = oItem.getProperty("/DeliveredUnit_input");
					sStorageLocation = oItem.getProperty("/StorageLocation");
					sStockTypekey = oItem.getProperty("/StockType_selectedKey");
					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) { // App "GR without Reference" has different behaviour
						bSelectEnabled = this._ItemConsistent(oItem.getData());
						if (bSelectEnabled === true) {
							oItem.setProperty("/SelectEnabled", bSelectEnabled);
							oItem.setProperty("/Selected", bSelectEnabled);
						}
					}
					//select all is handled in nav back event
				}
				if (this._SourceOfGR === this._SourceOfGRIsNoReference) { // validation only for GR without Referecence
					// Validation of the exiting material and material related master data 
					this._handleValidationMasterData(sMaterial, sUoM, sPlant, sStorageLocation, this._SelectedTableIndex);
					if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
						sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
					} else {
						sPlant = oItem.getProperty("/Plant");
					}
					this._getControlFields(sMaterial, sPlant, this._SelectedTableIndex, sStockTypekey);
				}
				oModel.setProperty("/ColumnStorageBinVisible", this._isStorageBinInItems(oModel.getData().Items));
			} //selected
		},

		/**
		 * @function value help of Alternative Units of Measure (AUoM) based on included library
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleAUoMHelp: function (oEvent) {
			var sMaterial = "";
			var oSource = oEvent.getSource();
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") { //S2
				if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
					sMaterial = this.getView().getModel("oItem").getProperty("/Material");
				} else {
					sMaterial = this.getView().getModel("oItem").getProperty("/Material_Input");
				}
			} else { //S1
				var oParent = oSource.getParent().getParent();
				var aCells = oParent.getCells();

				if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
					sMaterial = aCells[2].getText();
					sMaterial = sMaterial.substr(1, sMaterial.length - 1);
				} else {
					var sSelectedTableIndex = this._getSelectedItemInModel(oEvent);
					sMaterial = this.getView().getModel("oFrontend").getProperty("/Items/" + sSelectedTableIndex + "/Material_Input");
				}
				//getting the index of the table item and storing it in controller
				this._SelectedTableIndex = this._getSelectedItemInModel(oEvent);
			} //S1

			var that = this;
			var oParams = {};
			oParams.Material = sMaterial;
			this._oValueHelpController.displayValueHelpAUOM4Material(oParams, function (oReturn) {
				that._handleValueHelpAUOMCallback(oReturn);
			}, that);
		}, //end handleAUoMConfirm

		/**
		 * @function component material UoM value help based on included library
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleComponentAUoMHelp: function (oEvent) {
			var oBindingContext = oEvent.getSource().getBindingContext("oItem");
			var sBindingPath = oBindingContext.getPath();
			var sMaterial = oBindingContext.getProperty("Material");
			var oParams = {};
			var that = this;
			oParams.Material = sMaterial;
			this._oValueHelpController.displayValueHelpAUOM4Material(oParams, function (oReturn) {
				if (oReturn.selected === true) {
					var oModel = that.getView().getModel("oItem");
					oModel.setProperty(sBindingPath + "/EntryUnit", oReturn.AUoM);
				}
			}, that);
		},

		/**
		 * @function call back function of AUoM  value Help
		 * @param oReturn Provided by Value Help containing selected values/or no selection
		 */
		_handleValueHelpAUOMCallback: function (oReturn) { // callback function
			var oModel = {}; //JSON model
			var sMaterial;
			var sPlant;
			var sUoM;
			var sStorageLocation;
			var sStockTypekey;
			var bSelectEnabled;
			if (oReturn.selected === true) {
				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") { //S2
					//Write local back  
					oModel = this.getView().getModel("oItem");

					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) { //App "GR without Reference" has different behaviour
						bSelectEnabled = this._ItemConsistent(oModel.getData());
						if (bSelectEnabled === true) {
							oModel.setProperty("/SelectEnabled", bSelectEnabled);
							oModel.setProperty("/Selected", bSelectEnabled);
						}
					}
					//subitems are handled in nav back event handler
					oModel.setProperty("/DeliveredUnit_input", oReturn.AUoM);
					// get actual material and material related master data in item
					sMaterial = oModel.getProperty("/Material_Input");
					sPlant = oModel.getProperty("/Plant");
					sUoM = oModel.getProperty("/DeliveredUnit_input");
					sStorageLocation = oModel.getProperty("/StorageLocation");
					sStockTypekey = oModel.getProperty("/StockType_selectedKey");
				} else { // S1
					//writing back to JSON Model
					oModel = this.getView().getModel("oFrontend");
					var aItems = oModel.getProperty("/Items");
					if (aItems[this._SelectedTableIndex].DeliveredUnit_input !== oReturn.AUoM) {
						aItems[this._SelectedTableIndex].DeliveredUnit_input = oReturn.AUoM;
					}
					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) { //App "GR without Reference" has different behaviour
						bSelectEnabled = this._ItemConsistent(aItems[this._SelectedTableIndex], aItems);
						if (bSelectEnabled === true) {
							aItems[this._SelectedTableIndex].SelectEnabled = bSelectEnabled;
							aItems[this._SelectedTableIndex].Selected = bSelectEnabled;
						}
						//update select all of subitems
						this._setSelectEnabled(aItems[this._SelectedTableIndex], aItems);
						this._controlSelectAllAndPostButton(); //update buttons
						this._updateHiglightProperty(); //update highlight

						// call function import to calculate component material quantity based on new entry unit (for subcontracting process)
						if (aItems[this._SelectedTableIndex].ItemHasComponent && aItems[this._SelectedTableIndex].ItemComponentVisible) {
							this._calculateComponentQuantity(oModel.getProperty("/Ebeln"), aItems[this._SelectedTableIndex], this._SelectedTableIndex);
						}
					}
					oModel.setProperty("/Items", aItems);

					// get actual material and material related master data in item
					sMaterial = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Material_Input");
					sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
					sUoM = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
					sStorageLocation = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation");
					sStockTypekey = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/StockType_selectedKey");
				} //S1

				if (this._SourceOfGR === this._SourceOfGRIsNoReference) { // validation only for GR without Referecence
					// Validation of the exiting material and material related master data 
					this._handleValidationMasterData(sMaterial, sUoM, sPlant, sStorageLocation, this._SelectedTableIndex);
					if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
						oModel = this.getView().getModel("oFrontend");
						sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
					} else {
						oModel = this.getView().getModel("oItem");
						sPlant = oModel.getProperty("/Plant");
					}
					// this._setGuidedTour();
					this._getControlFields(sMaterial, sPlant, this._SelectedTableIndex, sStockTypekey);
				}
			}
		},

		/**
		 * @function value help of Batch per PO Item
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleBatchHelp: function (oEvent) {
			//reset buffer if needed
			if (this._ResetBatchBuffer === true) {
				this._ResetBatchBuffer = false;
				this._oBatchHelp = {};
			}
			var oItem = {};
			if (!this._oBatchDialog) {
				this._oBatchDialog = sap.ui.xmlfragment(this.getView().getId(), "s2p.mm.im.goodsreceipt.purchaseorder.view.selectBatch", this);
				this.getView().addDependent(this._oBatchDialog);
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oBatchDialog);
			}
			var sMaterial;
			var sPlant;
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") { //S2
				oItem = this.getView().getModel("oItem").getData();
				if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
					sMaterial = oItem.Material_Input;
				} else {
					sMaterial = oItem.Material;
				}
				sPlant = oItem.Plant;
			} else {
				var oModel = this.getView().getModel("oFrontend");
				var sSelectedItem = this._getSelectedItemInModel(oEvent);
				oItem = oModel.getProperty("/Items/" + sSelectedItem);
				var aItems = oModel.getProperty("/Items");
				if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
					sMaterial = aItems[sSelectedItem].Material_Input;
				} else {
					sMaterial = aItems[sSelectedItem].Material;
				}
				sPlant = aItems[sSelectedItem].Plant;
				//Store selected item in Controller
				this._SelectedTableIndex = sSelectedItem;
			}
			//set micro chart bars to customized ones
			var oMicroChart = sap.ui.core.Fragment.byId(this.getView().getId(), "idBatchStockChart");
			var sDisplayStockType = "";
			oMicroChart.removeAllData();
			for (var j = 0; j < oItem.StockType_input.length; j++) {
				switch (oItem.StockType_input[j].key) {
				case " ":
					sDisplayStockType = "CurrentStock";
					break;
				case "2":
					sDisplayStockType = "QualityInspectionStockQuantity";
					break;
				case "3":
					sDisplayStockType = "BlockedStockQuantity";
					break;
				default:
					continue;
				}
				oMicroChart.addData(new sap.suite.ui.microchart.ComparisonMicroChartData({
					color: "Good",
					displayValue: "{oBatchCollection>" + sDisplayStockType + "_Dis" + "}",
					value: "{oBatchCollection>" + sDisplayStockType + "_Int" + "}",
					title: "{i18n>BATCH_VALUE_HELP_CHART_TITLE_" + sDisplayStockType.toUpperCase() + "}"
				}));
			}
			// the batch buffer this._oBatchHelp[oParam.Material + oParam.Plant] cann't be reused, since the stock quantity of batch is varied depening 
			// on the storagelocation selection. Furthermore the customizing-setting of table TCUCH has also influence of the Batch F4-help data.
			// Thus, in order to get consistant Batch F4-help, the communication by oDATA is necessary in realtime. 
			var aFilters = [];
			if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
				aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, oItem.Material));
			} else {
				aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, oItem.Material_Input));
			}
			aFilters.push(new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, oItem.Plant));
			aFilters.push(new sap.ui.model.Filter("StorageLocation", sap.ui.model.FilterOperator.EQ, oItem.StorageLocation));
			aFilters.push(new sap.ui.model.Filter("DeliveryDocumentItem", sap.ui.model.FilterOperator.EQ, oItem.DocumentItem));
			aFilters.push(new sap.ui.model.Filter("InboundDelivery", sap.ui.model.FilterOperator.EQ, this.getView().getModel("oFrontend").getProperty(
				"/Ebeln")));
			this.getView().getModel("oData").read("/MaterialBatchHelps", {
				filters: aFilters,
				success: jQuery.proxy(this._successBatchLoad, this, oItem),
				error: jQuery.proxy(this._handleOdataError, this)
			});
		},
		/**
		 * @function callback of successfull load of StorageLocations
		 * @param {object} oData Resultset retrieved from Backend
		 * @param {object} oParam Input parameters
		 */
		_successBatchLoad: function (oParam, oData) {

			var aBatchCollection = new Array();
			for (var i = 0; i < oData.results.length; i++) {
				var oItem = {};
				oItem.Batch = oData.results[i].Batch;
				oItem.BaseUnit = oData.results[i].BaseUnit;
				oItem.BlockedStockQuantity_Dis = this._NumberFormatter.format(oData.results[i].BlockedStockQuantity, oItem.BaseUnit) + " ";
				oItem.CurrentStock_Dis = this._NumberFormatter.format(oData.results[i].CurrentStock, oItem.BaseUnit) + " ";
				oItem.QualityInspectionStockQuantity_Dis = this._NumberFormatter.format(oData.results[i].QualityInspectionStockQuantity, oItem.BaseUnit) +
					" ";
				oItem.BlockedStockQuantity_Int = parseFloat(oData.results[i].BlockedStockQuantity);
				oItem.CurrentStock_Int = parseFloat(oData.results[i].CurrentStock);
				oItem.QualityInspectionStockQuantity_Int = parseFloat(oData.results[i].QualityInspectionStockQuantity);
				oItem.BlockedStockQuantity = oData.results[i].BlockedStockQuantity;
				oItem.CurrentStock = oData.results[i].CurrentStock;
				oItem.QualityInspectionStockQuantity = oData.results[i].QualityInspectionStockQuantity;
				oItem.Material = oData.results[i].Material;
				oItem.Plant = oData.results[i].Plant;
				oItem.ShelfLifeExpirationDate = oData.results[i].ShelfLifeExpirationDate;
				oItem.ManufactureDate = oData.results[i].ManufactureDate;
				aBatchCollection.push(oItem);
			}
			// in call back of oData Service
			this._oBatchHelp[oParam.Material + oParam.Plant] = aBatchCollection;
			var oBatchCollection = new sap.ui.model.json.JSONModel();
			oBatchCollection.setDefaultBindingMode("OneWay");
			oBatchCollection.setProperty("/BatchCollection", this._oBatchHelp[oParam.Material + oParam.Plant]);
			var oMinMax = this._getMinMaxOfDisplayedStocks(this._oBatchHelp[oParam.Material + oParam.Plant], oParam.StockType_input);
			oBatchCollection.setProperty("/minValue", oMinMax.minValue);
			oBatchCollection.setProperty("/maxValue", oMinMax.maxValue);
			this._oBatchDialog.setModel(oBatchCollection, "oBatchCollection");
			this._oBatchDialog.open();
		},

		/**
		 * @function calculates the Minimum and Maximum of displayed Stocks in Model
		 * @param {array} aCollection Array with Stock Quantities
		 * @param {array} aDisplayedStocks Object Displayed Stocktypes 
		 * @return {object} object containing minValue/maxValue as float
		 */
		_getMinMaxOfDisplayedStocks: function (aCollection, aDisplayedStocks) {
			var oMinMax = {
				minValue: 0.0,
				maxValue: 0.0
			};

			//changing key to oData
			var sDisplayStockType = "";

			for (var i = 0; i < aDisplayedStocks.length; i++) {
				switch (aDisplayedStocks[i].key) {
				case "2":
					sDisplayStockType = "QualityInspectionStockQuantity";
					break;
				case "3":
					sDisplayStockType = "BlockedStockQuantity";
					break;
				default:
					sDisplayStockType = "CurrentStock";
				}

				//all items
				for (var j = 0; j < aCollection.length; j++) {
					if (aCollection[j][sDisplayStockType + "_Int"] > oMinMax.maxValue) {
						oMinMax.maxValue = aCollection[j][sDisplayStockType + "_Int"];
					}
					if (aCollection[j][sDisplayStockType + "_Int"] < oMinMax.minValue) {
						oMinMax.minValue = aCollection[j][sDisplayStockType + "_Int"];
					}
				} //all stocks
			} //all stock types

			return oMinMax;
		},

		/**
		 * @function handler for Search in Batches
		 * @param {sap.ui.base.Event} oEvent Event object of the UI
		 */
		handleBatchValueHelpSearch: function (oEvent) {
			var sValue = oEvent.getParameter("value");
			var oFilter = new sap.ui.model.Filter("Batch", sap.ui.model.FilterOperator.Contains, sValue);
			var oBinding = oEvent.getSource().getBinding("items");
			oBinding.filter([oFilter]);
		},
		/**
		 * @function handler for cancel in Batche Value Help
		 * @param {object} oEvent Event object of the UI
		 */
		handleBatchValueHelpCancel: function (oEvent) {
			oEvent.getSource().getBinding("items").filter([]);
			this._sComponentBindingPath = ""; // clean the path used for subcontractiong component  
		},

		/**
		 * @function handler for confirm in Batch Value Help
		 * @param {sap.ui.base.Event} oEvent Event object of the UI
		 */
		handleBatchValueHelpConfirm: function (oEvent) {
			oEvent.getSource().getBinding("items").filter([]);
			var aContexts = oEvent.getParameter("selectedContexts");
			var sMaterial;
			var sPlant;
			var sUoM;
			var sStorageLocation;
			var bSelectEnabled;
			oEvent.getSource().getBinding("items").filter([]);
			if (aContexts.length) {
				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") { //S2
					// batch value help on the component level for subcontractiong
					if (this._sComponentBindingPath) {
						var sBatch = aContexts[0].getObject().Batch;
						var oItemModel = this.getView().getModel("oItem");

						oItemModel.setProperty(this._sComponentBindingPath + "/Batch", sBatch);
						oItemModel.setProperty(this._sComponentBindingPath + "/Batch_valueState", sap.ui.core.ValueState.None);

						var oItemData = oItemModel.getData();
						var bApplyButtonEnabled = this._applyButtonEnabled(oItemData);
						var bIsConsistent = this._ItemConsistent(oItemData);

						oItemModel.setProperty("/Selected", bIsConsistent); // control the check box on the S1 after apply on S2
						oItemModel.setProperty("/SelectEnabled", bIsConsistent);
						oItemModel.setProperty("/ApplyButtonEnabled", bApplyButtonEnabled); // control the apply button on the S2
						this._sComponentBindingPath = "";
						return;
					}

					this.getView().getModel("oItem").setProperty("/Batch", aContexts[0].getObject().Batch);
					this.getView().getModel("oItem").setProperty("/Batch_valueState", sap.ui.core.ValueState.None);
					this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate", this._oDateFormat.format(aContexts[0].getObject().ShelfLifeExpirationDate));
					this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None);
					this.getView().getModel("oItem").setProperty("/ManufactureDate", this._oDateFormat.format(aContexts[0].getObject().ManufactureDate));
					this.getView().getModel("oItem").setProperty("/ManufactureDate_valueState", sap.ui.core.ValueState.None);
					// var oItem = this.getView().getModel("oItem");
					this._setValueStateMandatoryFields(this.getView().getModel("oItem").getData());
					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) { //App "GR without Reference" has different behaviour
						bSelectEnabled = this._ItemConsistent(this.getView().getModel("oItem").getData());
						if (bSelectEnabled === true) {
							this.getView().getModel("oItem").setProperty("/SelectEnabled", bSelectEnabled);
							this.getView().getModel("oItem").setProperty("/Selected", bSelectEnabled);
							this.getView().getModel("oItem").setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(this.getView().getModel("oItem").getData()));
						}
					}
					// get actual material and material related master data in item
					sMaterial = this.getView().getModel("oItem").getProperty("/Material_Input");
					sPlant = this.getView().getModel("oItem").getProperty("/Plant");
					sUoM = this.getView().getModel("oItem").getProperty("/DeliveredUnit_input");
					sStorageLocation = this.getView().getModel("oItem").getProperty("/StorageLocation");
				} else { //S1
					var oModel = this.getView().getModel("oFrontend");

					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Batch", aContexts[0].getObject().Batch);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Batch_valueState", sap.ui.core.ValueState.None);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/ShelfLifeExpirationDate", this._oDateFormat.format(aContexts[0].getObject()
						.ShelfLifeExpirationDate));
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/ManufactureDate", this._oDateFormat.format(aContexts[0].getObject().ManufactureDate));
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/ManufactureDate_valueState", sap.ui.core.ValueState.None);
					this._setValueStateMandatoryFields(oModel.getProperty("/Items/" + this._SelectedTableIndex));
					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) { //App "GR without Reference" has different behaviour
						bSelectEnabled = this._ItemConsistent(oModel.getProperty("/Items/" + this._SelectedTableIndex));
						if (bSelectEnabled === true) {
							oModel.setProperty("/Items/" + this._SelectedTableIndex + "/SelectEnabled", bSelectEnabled);
							oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Selected", bSelectEnabled);
						}
						//take care of select for (sub)items
						this._setSelectEnabled(oModel.getProperty("/Items/" + this._SelectedTableIndex));
						this._controlSelectAllAndPostButton(); //update buttons
						this._updateHiglightProperty(); //update highlight
					}
					// get actual material and material related master data in item
					sMaterial = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Material_Input");
					sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
					sUoM = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
					sStorageLocation = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation");
				}

				if (this._SourceOfGR === this._SourceOfGRIsNoReference) { // validation only for GR without Referecence
					// Validation of the exiting material and material related master data 
					this._handleValidationMasterData(sMaterial, sUoM, sPlant, sStorageLocation, this._SelectedTableIndex);
					if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
						sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
					} else {
						sPlant = oModel.getProperty("/Plant");
					}
					// this._setGuidedTour();
					this._getControlFields(sMaterial, sPlant, this._SelectedTableIndex);
				}
			} //context available
		},

		/**
		 * @function handler for navigation of component material
		 * @param {sap.ui.base.Event} oEvent Event object of the UI
		 */
		handleDisplayComponentMaterialLinkPress: function (oEvent) {
			var sMaterial = oEvent.getSource().data("Material");
			var oItem = this.getView().getModel("oItem");
			var oParams = {
				Material: sMaterial
			};

			var oHashChanger = sap.ui.core.routing.HashChanger.getInstance();
			oHashChanger.setHash("");
			this._oNavigationService.navigate("Material", "displayFactSheet", oParams, this._getInnerAppState("", null, oItem.getData()));
		},

		/**
		 * @function handler for creating a batch by external application
		 * @param {sap.ui.base.Event} oEvent Event object of the UI
		 */
		handleCreateBatch: function (oEvent) {
			var oItem = this.getView().getModel("oItem");
			var oParams;
			if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
				oParams = {
					Material: oItem.getProperty("/Material_Name"),
					Plant: oItem.getProperty("/Plant")
				};
			} else {
				oParams = {
					Material: oItem.getProperty("/Material"),
					Plant: oItem.getProperty("/Plant")
				};
			}

			this._ResetBatchBuffer = true; //invalidate local buffer due to create operation
			//Clear browserhash
			var oHashChanger = sap.ui.core.routing.HashChanger.getInstance();
			oHashChanger.setHash("");

			if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
				this._oNavigationService.navigate("Batch", "create", oParams, this._getInnerAppState("", {
					DocumentItem: oItem.getProperty("/DocumentItem"),
					ItemCounter: oItem.getProperty("/ItemCounter")
				}));
			} else {
				this._oNavigationService.navigate("Batch", "create", oParams, this._getInnerAppState("", {
					DocumentItem: oItem.getProperty("/DocumentItem")
				}));
			}
		},

		/**
		 * @function handler for Search function in Table
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleSearch: function (oEvent) {
			var sValue = oEvent.getParameter("query");
			var oTable = this.getView().byId("idProductsTable");
			var oModel = this.getView().getModel("oFrontend");
			var oBinding = oTable.getBinding("items");
			var oFilter = {};
			var aFilters = [];
			if (sValue.length > 0) {
				aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("MaterialName", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("PurchaseOrderItemText", sap.ui.model.FilterOperator.Contains, sValue));
				oFilter = new sap.ui.model.Filter(aFilters, false);
				oTable.getBinding("items").filter(oFilter);
			} else {
				oTable.getBinding("items").filter([]);
			}

			//get items count for refreshing table header label
			var resourceBundle = this.getResourceBundle();
			var aItems = oTable.getItems();
			var iVisibleItems = 0;
			for (var i = 0; i < aItems.length; i++) {
				var bInfo = aItems[i].getCells()[0].getProperty("visible");
				if (bInfo == true) {
					iVisibleItems++;
				}
			}

			var sPOItemsCountTableHeader = resourceBundle.getText("TABLE_TOTAL_ITEMS_LABEL", [iVisibleItems]);
			oModel.setProperty("/POItemsCountTableHeader", sPOItemsCountTableHeader);

			//new rendering of stacked micro chart
			/// add stack bar chart percentage for multiple accounting
			this._updateStackedBarChartColumn();
		}, //end handleSearch

		/**
		 * @function handler for Search function in Table Account Assignments
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleSearchAccounting: function (oEvent) {
			var sValue = oEvent.getParameter("query");
			var oTable = this.getView().byId("idAccountAssingmentsTable");
			var oFilter = {};
			var aFilters = [];
			if (sValue.length > 0) {
				aFilters.push(new sap.ui.model.Filter("GLAccount", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("GLAccountName", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("CostCenter", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("CostCenterName", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("AssetNumber", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("AssetNumberName", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("FunctionalArea", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("ProfitCenter", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("ProfitCenterName", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("Project", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("ProjectDescription", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("SalesOrder", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("OrderID", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("GoodsRecipientName", sap.ui.model.FilterOperator.Contains, sValue));
				aFilters.push(new sap.ui.model.Filter("UnloadingPointName", sap.ui.model.FilterOperator.Contains, sValue));
				oFilter = new sap.ui.model.Filter(aFilters, false);
				oTable.getBinding("items").filter(oFilter);
			} else {
				oTable.getBinding("items").filter([]);
			}
		}, //end handleSearchAccounting

		/**
		 * @function handler to display popin window with Account Assigment details in table based on XML fragment
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		onDisplayAccountAssignment: function (oEvent) {
			if (!this._oAccAssDialog) {
				this._oAccAssDialog = sap.ui.xmlfragment("s2p.mm.im.goodsreceipt.purchaseorder.view.accountAssignment", this);
				this.getView().addDependent(this._oAccAssDialog);
			}
			//determine account details of current material
			//var oTable = this.getView().byId("idProductsTable");
			//var oListItem = oEvent.getSource().getParent();
			//var iSelectedTableIndex = oTable.indexOfItem(oListItem);
			//var sPath = oEvent.getSource().getBindingContext("oFrontend").getPath();
			//var iSelectedTableIndex = parseInt(sPath.substring(7, sPath.length) );
			var iSelectedTableIndex = this._getSelectedItemInModel(oEvent);
			var oFrontendModel = this.getView().getModel("oFrontend");
			var oModel = oFrontendModel.getData();
			//	var oItem = oModel.Items[iSelectedTableIndex];
			var oItem = JSON.parse(JSON.stringify(oModel.Items[iSelectedTableIndex]));
			for (var i = 0; i < oItem.AccountAssignments.length; i++) {
				oItem.AccountAssignments[i].ValueColor = this._aSemanticChartColors[i];
			}
			var oItemModel = new sap.ui.model.json.JSONModel();
			oItemModel.setData(oItem);

			this._oAccAssDialog.setModel(oItemModel, "oItem");
			var oButton = oEvent.getSource();
			jQuery.sap.delayedCall(0, this, function () {
				this._oAccAssDialog.openBy(oButton);
			});
			//this._oAccAssDialog.open();

		}, //end onDisplayAccountAssignment

		/**
		 * @function handler of select all items in table checkbox
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleSelectAll: function (oEvent) {
			var bSelected = oEvent.getParameter("selected");
			var oModel = this.getView().getModel("oFrontend");
			var aItems = oModel.getProperty("/Items");
			var sValidation;
			if (bSelected) {
				for (var i = 0; i < aItems.length; i++) {
					if (aItems[i].SelectEnabled) {
						aItems[i].Selected = true;
					}
				}
				for (var i = 0; i < aItems.length; i++) {
					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
						//App "GR without Reference" has different behaviour, there is not any connection Selection Checkbox 
						//zu the Post button
						oModel.setProperty("/PostButtonEnabled", true);
					}
				}
				oModel.setProperty("/CopyButtonVisible", true);
				oModel.setProperty("/DeleteButtonVisible", true);
			} else {
				for (var i = 0; i < aItems.length; i++) {
					if (aItems[i].SelectEnabled) {
						aItems[i].Selected = false;
					}
					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
						//App "GR without Reference" has different behaviour, there is not any connection Selection Checkbox 
						//zu the Post button
						oModel.setProperty("/PostButtonEnabled", false);
					}
				}
				oModel.setProperty("/CopyButtonVisible", false);
				oModel.setProperty("/DeleteButtonVisible", false);
			} //else

			oModel.setProperty("/Items", aItems);
		}, //end handleSelectAll

		/**
		 * @function handler of select one items in table checkbox
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleSelect: function (oEvent) {
			var bSelected = oEvent.getParameter("selected");
			var oModel = this.getView().getModel("oFrontend");
			var aItems = oModel.getProperty("/Items");

			var iSelectedTableIndex = this._getSelectedItemInModel(oEvent);
			var iSelectedDocumentItem;
			iSelectedDocumentItem = aItems[iSelectedTableIndex].DocumentItem;

			var iSelectedItemsCount = 0;
			for (var i = 0; i < aItems.length; i++) {
				if (aItems[i].DocumentItem == iSelectedDocumentItem) {
					aItems[i].Selected = bSelected;
				}

				if (aItems[i].Selected) {
					iSelectedItemsCount++;
				}
			} //for

			var bAllItemsSelected = this._allItemsInTableSelected(aItems);
			this._controlSelectAllCheckBox(iSelectedItemsCount > 0, bAllItemsSelected);

			if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
				if (iSelectedItemsCount > 0) {
					oModel.setProperty("/PostButtonEnabled", true);
					// 	this.setBtnEnabled("postBtn", true); //activate post button
				} else {
					oModel.setProperty("/PostButtonEnabled", false);
					// 	this.setBtnEnabled("postBtn", false); //deactivate post button
				}
			} else {
				var sValidation = false;
				if (aItems[iSelectedTableIndex].Selected === true) {
					// sValidation = this._validationNoRefItem(iSelectedTableIndex);
					// if (sValidation === true) {
					// 	oModel.setProperty("/PostButtonEnabled", true);
					// } else {
					// 	oModel.setProperty("/PostButtonEnabled", false);
					// }
					oModel.setProperty("/CopyButtonVisible", true);
					oModel.setProperty("/DeleteButtonVisible", true);
				} else {
					// for (var i = 0; i < aItems.length; i++) {
					// 	if (aItems[i].Selected === true) {
					// 		sValidation = this._validationNoRefItem(i);
					// 		if (sValidation === false) {
					// 			oModel.setProperty("/PostButtonEnabled", false);
					// 			break;
					// 		} else {
					// 			oModel.setProperty("/PostButtonEnabled", true);
					// 		}

					// 	}
					// }
					if (iSelectedItemsCount === 0) {
						oModel.setProperty("/CopyButtonVisible", false);
						oModel.setProperty("/DeleteButtonVisible", false);
					}
				}

			}

			oModel.setProperty("/Items", aItems);
		}, //end handleSelect

		/**
		 * @function handler of changes in input field DeliveredQuantity_Input of table, checks if input equals valid quantity
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */

		handleInputChange: function (oEvent) {
			//delivered quantity adjusted manually
			var oInput = oEvent.getSource();

			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") { //S2 view
				// in S2 view the select property of sub(items) is handled after nav back 
				var oItem = this.getView().getModel("oItem");
				if (this._oQuantFormat.parse(oInput.getValue()) >= 0) {
					oItem.setProperty("/DeliveredQuantity_valueState", sap.ui.core.ValueState.None); //correct state before check
					oItem.setProperty("/DeliveredQuantity_valueStateText", "");
					oItem.setProperty("/DeliveredQuantity_input", this._oQuantFormat.parse(oInput.getValue()));
					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
						if (oItem.getProperty("/StorageLocation_input") === "" && oItem.getProperty("/StorageLocationVisible") == true) {
							oItem.setProperty("/StorageLocation_valueState", sap.ui.core.ValueState.Error);
							oItem.setProperty("/StorageLocation_valueStateText", this.getResourceBundle().getText(
								"STORAGELOCATION_VALUE_STATE_TEXT"));
						}
						var bIsConsistent = this._ItemConsistent(oItem.getData());
						oItem.setProperty("/Selected", bIsConsistent);
						oItem.setProperty("/SelectEnabled", bIsConsistent);
						oItem.setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(oItem.getData())); //Footer Button control
					}

				} else { //error state
					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
						oItem.setProperty("/Selected", false);
						oItem.setProperty("/SelectEnabled", false);
					}
					oItem.setProperty("/ApplyButtonEnabled", false); //Footer Button control
					oItem.setProperty("/DeliveredQuantity_valueState", sap.ui.core.ValueState.Error);
					oItem.setProperty("/DeliveredQuantity_valueStateText", this.getResourceBundle().getText(
						"DELIVEREDQUANTITY_VALUE_STATE_TEXT"));
					//oItem.setProperty("/DeliveredQuantity_input",""); //give chance to correct
				}
			} else { //S1 view with table
				var iSelectedTableIndex = this._getSelectedItemInModel(oEvent);
				var oModel = this.getView().getModel("oFrontend");
				//setting selection of cell --> ListItem
				if (this._oQuantFormat.parse(oInput.getValue()) >= 0) {
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/DeliveredQuantity_valueState", sap.ui.core.ValueState.None); //correct state before check
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/DeliveredQuantity_valueStateText", "");
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/DeliveredQuantity_input", this._oQuantFormat.parse(oInput.getValue()));
					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
						if (oModel.getProperty("/Items/" + iSelectedTableIndex + "/StorageLocation_input") == "" && oModel.getProperty("/Items/" +
								iSelectedTableIndex + "/StorageLocationVisible") == true) {
							oModel.setProperty("/Items/" + iSelectedTableIndex + "/StorageLocation_valueState", sap.ui.core.ValueState.Error);
							oModel.setProperty("/Items/" + iSelectedTableIndex + "/StorageLocation_valueStateText", this.getResourceBundle()
								.getText("STORAGELOCATION_VALUE_STATE_TEXT"));
						}

						var bIsConsistent = this._ItemConsistent(oModel.getProperty("/Items")[iSelectedTableIndex], oModel.getProperty("/Items"));
						oModel.setProperty("/Items/" + iSelectedTableIndex + "/Selected", bIsConsistent);
						oModel.setProperty("/Items/" + iSelectedTableIndex + "/SelectEnabled", bIsConsistent);

						// take care of subitems
						var aItems = oModel.getProperty("/Items");
						this._setSelectEnabled(aItems[iSelectedTableIndex], aItems);
						//activate post button and check if select all checkbox has to be set after subitems
						aItems = oModel.getProperty("/Items"); //re-read
						this._controlSelectAllAndPostButton(aItems);
						this._updateHiglightProperty(); //update highlight

						// call function import to calculate component material quantity (for subcontracting process)
						var oPOItem = oModel.getProperty("/Items/" + iSelectedTableIndex);
						if (oPOItem.ItemHasComponent && oPOItem.ItemComponentVisible) {
							this._calculateComponentQuantity(oModel.getProperty("/Ebeln"), oPOItem, iSelectedTableIndex);
						}
					}

				} else { //blank
					//de-activate checkboxes / check if at least one item is selected otherwise deactivate post button
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/DeliveredQuantity_valueState", sap.ui.core.ValueState.Error);
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/DeliveredQuantity_valueStateText", this.getResourceBundle()
						.getText("DELIVEREDQUANTITY_VALUE_STATE_TEXT"));
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/DeliveredQuantity_input", '');
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/ApplyButtonEnabled", false); //Footer Button control
					var aItems = oModel.getProperty("/Items");
					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
						oModel.setProperty("/Items/" + iSelectedTableIndex + "/Selected", false);
						oModel.setProperty("/Items/" + iSelectedTableIndex + "/SelectEnabled", false);
						// take care of subitems
						this._setSelectEnabled(aItems[iSelectedTableIndex], aItems);
					}
					this._controlSelectAllAndPostButton(aItems);
					this._updateHiglightProperty(); //update highlight

				}
			}
			if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
				this._setGuidedTour(iSelectedTableIndex);
			}
		}, //end handleInputChange

		/**
		 * Calculates the component material quantity based on the enter quantity of header material. Order unit shall be passed, so that the entry quantity can be converted
		 * @param {string} sInboundDelivery the document number
		 * @param {object} oPOItem the main position data
		 * @param {int} iSelectedTableIndex the line index in the table
		 */
		_calculateComponentQuantity: function (sInboundDelivery, oPOItem, iSelectedTableIndex) {
			this.getOwnerComponent().getModel("oData").callFunction('/ComponentMatQty', {
				method: 'GET',
				urlParameters: {
					DeliveryDocumentItem: oPOItem.DocumentItem,
					InboundDelivery: sInboundDelivery,
					Material: oPOItem.Material,
					EntryUnit: oPOItem.DeliveredUnit_input,
					QuantityInEntryUnit: oPOItem.DeliveredQuantity_input.toString(),
					OrderUnit: oPOItem.OrderedQuantityUnit,
					SourceOfGR: this._SourceOfGR,
				},
				success: jQuery.proxy(this._successComponentQuantityLoad, this, iSelectedTableIndex),
				error: jQuery.proxy(this._handleOdataError, this)
			});
			this._toggleBusy(true);
		},

		/**
		 * Updates the component data based on the entered quantity of the header material. All the manually changes on the component will be overwritten.
		 * @param {int} iSelectedTableIndex the line index in the table
		 * @param {object} oData the returned data from backend
		 * @param {object} oResponse the response message from backend
		 */
		_successComponentQuantityLoad: function (iSelectedTableIndex, oData, oResponse) {
			this._toggleBusy(false);
			if (oData.results) {
				var oItem = this.getView().getModel("oFrontend").getProperty("/Items/" + iSelectedTableIndex);
				if (oData.results.length > 0) {
					var oJsonItem = SubItemController.createSubItemData(oItem, oData.results, this._isIntentSupported.MaterialDisplay, true);
					this.getView().getModel("oFrontend").setProperty("/Items/" + iSelectedTableIndex, oJsonItem);
				} else {
					// set quantity to 0 on the components in case of the entry quantity on the main position is 0
					for (var i = 0; i < oItem.SubItems.length; i++) {
						oItem.SubItems[i].OpenQuantity = 0;
						oItem.SubItems[i].QuantityInEntryUnit = 0;
					}
					this.getView().getModel("oFrontend").setProperty("/Items/" + iSelectedTableIndex, oItem);
				}
				this._controlSelectAllAndPostButton(); //update buttons
				this._updateHiglightProperty(); //update highlight
			}
		},

		/**
		 * @function handler of changes in input field StockType of table/view, adjusts field control
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */

		handleStockTypeChange: function (oEvent) {
			//sControlOfBatchTableField changes
			var sControlOfBatchTableField = oEvent.getSource().getSelectedItem().data("ControlOfBatchTableField");
			var sControlOfReasonCodeTableField = oEvent.getSource().getSelectedItem().data("ControlOfReasonCodeTableField");
			//Shelf Life
			var sControlOfExpirationDate = oEvent.getSource().getSelectedItem().data("ControlOfExpirationDate");
			var sControlOfManufactureDate = oEvent.getSource().getSelectedItem().data("ControlOfManufactureDate");
			var oItem = {};
			var bIsConsistent;
			var sMaterial;
			var sPlant;
			var sUoM;
			var sStorageLocation;
			var sStockTypekey;

			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") { //S2 view
				// in S2 view the select property of sub(items) is handled after nav back 
				oItem = this.getView().getModel("oItem").getData();
				this._evaluateFieldControl("Batch", sControlOfBatchTableField, oItem);
				this._evaluateFieldControl("GoodsMovementReasonCode", sControlOfReasonCodeTableField, oItem);
				this._evaluateFieldControl("ShelfLifeExpirationDate", sControlOfExpirationDate, oItem);
				oItem.ShelfLifeExpirationDate_valueState = sap.ui.core.ValueState.None;
				this._evaluateFieldControl("ManufactureDate", sControlOfManufactureDate, oItem);
				oItem.ManufactureDate_valueState = sap.ui.core.ValueState.None;
				if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
					//Storage Location visibility if movement is into GR Blocked stock
					if (oItem.StockType_selectedKey === "U") {
						oItem.StorageLocationVisible = false;
						oItem.StorageLocation_valueState = sap.ui.core.ValueState.None;
						oItem.StorageLocation_valueStateText = "";
						if (oItem.ItemHasComponent && oItem.ItemComponentVisible) {
							oItem.ItemComponentVisible = false;
						}
					} else {
						oItem.StorageLocationVisible = true;
						if (oItem.StorageLocation_input === "") {
							oItem.StorageLocation_valueState = sap.ui.core.ValueState.Error;
							oItem.StorageLocation_valueStateText = this.getResourceBundle().getText("STORAGELOCATION_VALUE_STATE_TEXT");
						}
						if (oItem.ItemHasComponent && !oItem.ItemComponentVisible) {
							oItem.ItemComponentVisible = true;
						}
					}
				}
				this._setValueStateMandatoryFields(oItem);
				this.getView().getModel("oItem").setData(oItem);
				this._setReasonCodeFilter(oItem);
				if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
					bIsConsistent = this._ItemConsistent(oItem);
					this.getView().getModel("oItem").setProperty("/Selected", bIsConsistent);
					this.getView().getModel("oItem").setProperty("/SelectEnabled", bIsConsistent);
					this.getView().getModel("oItem").setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(oItem)); //Footer Button control
				}

				sMaterial = oItem.Material_Input;
				sPlant = oItem.Plant;
				sUoM = oItem.DeliveredUnit_input;
				sStorageLocation = oItem.StorageLocation;
				sStockTypekey = oItem.StockType_selectedKey;

			} else { //S1 view with table
				var iSelectedTableIndex = this._getSelectedItemInModel(oEvent);
				var oModel = this.getView().getModel("oFrontend");
				oItem = oModel.getProperty("/Items/" + iSelectedTableIndex);
				this._evaluateFieldControl("Batch", sControlOfBatchTableField, oItem);
				this._evaluateFieldControl("GoodsMovementReasonCode", sControlOfReasonCodeTableField, oItem);
				//Shelf Life - mandatory for some stock types
				this._evaluateFieldControl("ShelfLifeExpirationDate", sControlOfExpirationDate, oItem);
				oItem.ShelfLifeExpirationDate_valueState = sap.ui.core.ValueState.None;
				this._evaluateFieldControl("ManufactureDate", sControlOfManufactureDate, oItem);
				oItem.ManufactureDate_valueState = sap.ui.core.ValueState.None;
				if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
					//Storage Location visibility if movement is into GR Blocked stock
					if (oItem.StockType_selectedKey === "U") {
						oItem.StorageLocationVisible = false;
						oItem.StorageLocation_valueState = sap.ui.core.ValueState.None;
						oItem.StorageLocation_valueStateText = "";
						if (oItem.ItemHasComponent && oItem.ItemComponentVisible) {
							oItem.ItemComponentVisible = false;
						}
					} else {
						oItem.StorageLocationVisible = true;
						if (oItem.StorageLocation_input === "") {
							oItem.StorageLocation_valueState = sap.ui.core.ValueState.Error;
							oItem.StorageLocation_valueStateText = this.getResourceBundle().getText("STORAGELOCATION_VALUE_STATE_TEXT");
						}
						if (oItem.ItemHasComponent && !oItem.ItemComponentVisible) { // change from the 103 to 101, set component visible and recalculate the quantity
							oItem.ItemComponentVisible = true;
							this._calculateComponentQuantity(oModel.getProperty("/Ebeln"), oItem, iSelectedTableIndex);
						}
					}
				}
				this._setValueStateMandatoryFields(oItem);
				oModel.setProperty("/Items/" + iSelectedTableIndex, oItem);
				if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
					bIsConsistent = this._ItemConsistent(oModel.getProperty("/Items")[iSelectedTableIndex], oModel.getProperty("/Items"));
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/Selected", bIsConsistent);
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/SelectEnabled", bIsConsistent);

					// take care of subitems
					var aItems = oModel.getProperty("/Items");
					this._setSelectEnabled(aItems[iSelectedTableIndex], aItems);
					//activate post button and check if select all checkbox has to be set after subitems
					aItems = oModel.getProperty("/Items"); //re-read
					this._controlSelectAllAndPostButton(aItems);
					this._updateHiglightProperty(); //update highlight
				}
				sMaterial = oModel.getProperty("/Items/" + iSelectedTableIndex + "/Material_Input");
				sPlant = oModel.getProperty("/Items/" + iSelectedTableIndex + "/Plant");
				sUoM = oModel.getProperty("/Items/" + iSelectedTableIndex + "/DeliveredUnit_input");
				sStorageLocation = oModel.getProperty("/Items/" + iSelectedTableIndex + "/StorageLocation");
				sStockTypekey = oModel.getProperty("/Items/" + iSelectedTableIndex + "/StockType_selectedKey");
			}

			//set Column visibility
			if (oItem.BatchVisible === true) { //1 Batch Visible => column must be visible
				this.getView().getModel("oFrontend").setProperty("/ColumnBatchVisible", true);
			}
			//Shelf Life
			if (oItem.ManufactureDateVisible === true) { //1 Batch Visible => column must be visible
				this.getView().getModel("oFrontend").setProperty("/ColumnManufactureDateVisible", true);
			}
			if (oItem.ShelfLifeExpirationDateVisible === true) { //1 Batch Visible => column must be visible
				this.getView().getModel("oFrontend").setProperty("/ColumnShelfLifeExpirationDateVisible", true);
			}
			// if (oItem.ManufactureDateMandatory === true) { //1 Batch Visible => column must be visible
			// 	this.getView().getModel("oFrontend").setProperty("/ColumnManufactureDateMandatory", true);
			// }
			// if (oItem.ManufactureDateEnabled === true) { //1 Batch Visible => column must be visible
			// 	this.getView().getModel("oFrontend").setProperty("/ColumnSManufactureDateEnabled", true);
			// }
			// if (oItem.ShelfLifeExpirationDateEnabled === true) { //1 Batch Visible => column must be visible
			// 	this.getView().getModel("oFrontend").setProperty("/ColumnShelfLifeExpirationDateEnabled", true);
			// }
			// if (oItem.ShelfLifeExpirationDateMandatory === true) { //1 Batch Visible => column must be visible
			// 	this.getView().getModel("oFrontend").setProperty("/ColumnShelfLifeExpirationDateMandatory", true);
			// }
			/////////////
			if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
				// this._setGuidedTour(iSelectedTableIndex);
				// Validation of the exiting material and material related master data 
				this._handleValidationMasterData(sMaterial, sUoM, sPlant, sStorageLocation, this._SelectedTableIndex);
				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
					oModel = this.getView().getModel("oFrontend");
					sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
				} else {
					oModel = this.getView().getModel("oItem");
					sPlant = oModel.getProperty("/Plant");
				}
				this._getControlFields(sMaterial, sPlant, this._SelectedTableIndex, sStockTypekey);
			}
		}, //end handleStockTypeChange

		/*
		 * @function handler of changes in input field DocumentDate/PostingDate of header, checks if input equals valid date
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleDateChange: function (oEvent) {
			var sValueState = sap.ui.core.ValueState.None;

			if (oEvent.getParameter("valid") == false || oEvent.getParameters().value == "") {
				sValueState = sap.ui.core.ValueState.Error;
			}

			oEvent.getSource().setValueState(sValueState);
			if (this._SourceOfGR !== this._SourceOfGRIsNoReference) { //App "GR without Reference" has different behaviou
				this._controlSelectAllAndPostButton(); //update post button
			} else {

				var sValidation;
				var oModel = this.getView().getModel("oFrontend");
				var aItems = oModel.getProperty("/Items");
				for (var j = 0; j < aItems.length; j++) {
					sValidation = this._validationNoRefItem(j);
					if (sValidation === false) {
						oModel.setProperty("/PostButtonEnabled", false);
						break;
					} else {
						oModel.setProperty("/PostButtonEnabled", true);
					}
				}
			}
		},

		handleShelfLifeExpirationDateChange: function (oEvent) {
			//	this.byId("idShelfLifeExpirationDate").setMinDate(this._oDateFormat.format(new Date()));
			//oEvent.getSource().setMinDate(new Date());
			// this.byId("idShelfLifeExpirationDate").setMaxDate(new Date());
			var sValueState = sap.ui.core.ValueState.None;

			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {

				var iSelectedTableIndex = this._getSelectedItemInModel(oEvent);
				var oModel = this.getView().getModel("oFrontend");
				var oItem = oModel.getProperty("/Items/" + iSelectedTableIndex);

				if (oModel.getProperty("/Items/" + iSelectedTableIndex + "/ShelfLifeExpirationDateVisible") !== true) {
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/ShelfLifeExpirationDate_valueState", sValueState);

				}

				if (oEvent.getParameter("valid") === false || oEvent.getParameters().value === "") {
					sValueState = sap.ui.core.ValueState.Error;
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/ShelfLifeExpirationDate_valueState", sValueState);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/ShelfLifeExpirationDate_valueStateText", this.getResourceBundle().getText(
						"SHELFLIFE_VALUE_STATE_TEXT"));
				} else {
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/ShelfLifeExpirationDate_valueState", sValueState);
				}
				this._setValueStateMandatoryFields(oItem);

				oModel.setProperty("/Items/" + iSelectedTableIndex, oItem);

				var bIsConsistent = this._ItemConsistent(oModel.getProperty("/Items")[iSelectedTableIndex], oModel.getProperty("/Items"));
				if (this._SourceOfGR !== this._SourceOfGRIsNoReference) { //App "GR without Reference" has different behaviour
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/Selected", bIsConsistent);
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/SelectEnabled", bIsConsistent);
				}
				this._setSelectEnabled(oModel.getProperty("/Items/" + iSelectedTableIndex));
				this._controlSelectAllAndPostButton(); //update post button
				this._updateHiglightProperty(); //update highlight

			} else {

				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
					var oItem = this.getView().getModel("oItem");

					if (oItem.getData().ShelfLifeExpirationDateVisible !== true) {
						oItem.setProperty("/ShelfLifeExpirationDate_valueState", sValueState);
					}
					if (oEvent.getParameter("valid") === false || oEvent.getParameters().value === "") {
						sValueState = sap.ui.core.ValueState.Error;
						oItem.setProperty("/ShelfLifeExpirationDate_valueState", sValueState);
						oItem.setProperty("/ShelfLifeExpirationDate_valueStateText", this.getResourceBundle().getText(
							"SHELFLIFE_VALUE_STATE_TEXT"));
					} else {
						oItem.setProperty("/ShelfLifeExpirationDate_valueState", sValueState);
					}
					this._setValueStateMandatoryFields(oItem.getData());
					var bSelectEnabled = this._ItemConsistent(oItem.getData());
					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
						oItem.setProperty("/SelectEnabled", bSelectEnabled);
						oItem.setProperty("/Selected", bSelectEnabled);
						oItem.setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(oItem.getData()));
					}
				}
			}

			if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
				this._setGuidedTour(iSelectedTableIndex);
			}
			this.getView().byId("idShelfLifeExpirationDate").focus();
		},

		handleManufactureDateChange: function (oEvent) {
			var sValueState = sap.ui.core.ValueState.None;

			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {

				var iSelectedTableIndex = this._getSelectedItemInModel(oEvent);
				var oModel = this.getView().getModel("oFrontend");
				var oItem = oModel.getProperty("/Items/" + iSelectedTableIndex);

				if (oItem.ManufactureDateMandatory === true && oEvent.getParameters().value === "") {
					sValueState = sap.ui.core.ValueState.Error;
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/ManufactureDate_valueState", sValueState);
					oModel.setProperty("/Items/" + iSelectedTableIndex + "/ManufactureDate_valueStateText", this.getResourceBundle().getText(
						"PRODUCTION_VALUE_STATE_TEXT"));
				} else {
					if (oEvent.getParameter("valid") === false) {
						sValueState = sap.ui.core.ValueState.Error;
						oModel.setProperty("/Items/" + iSelectedTableIndex + "/ManufactureDate_valueState", sValueState);
						oModel.setProperty("/Items/" + iSelectedTableIndex + "/ManufactureDate_valueStateText", this.getResourceBundle().getText(
							"PRODUCTION_VALUE_STATE_TEXT"));

					} else {
						oModel.setProperty("/Items/" + iSelectedTableIndex + "/ManufactureDate_valueState", sValueState);
						// calculate the shelf life expiration date based on the manufacture date and total shelf life 
						if (oItem.ShelfLifeExpirationDateEnabled !== true) {
							this._calculateExpirationDate(oModel.oData.Ebeln, oItem, iSelectedTableIndex);
						}
					}
				}
				this._setValueStateMandatoryFields(oItem);

				oModel.setProperty("/Items/" + iSelectedTableIndex, oItem);

				var bIsConsistent = this._ItemConsistent(oModel.getProperty("/Items")[iSelectedTableIndex], oModel.getProperty("/Items"));
				oModel.setProperty("/Items/" + iSelectedTableIndex + "/Selected", bIsConsistent);
				oModel.setProperty("/Items/" + iSelectedTableIndex + "/SelectEnabled", bIsConsistent);

				this._controlSelectAllAndPostButton(); //update post button
				this._updateHiglightProperty(); //update highlight

			} else {

				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
					var oData = this.getView().getModel("oFrontend").getData(oData);
					var oItem = this.getView().getModel("oItem");

					//var sDocument = oData["GR4PO_DL_Headers"].InboundDelivery;

					if (oItem.getData().ManufactureDateMandatory === true && oEvent.getParameters().value === "") {
						sValueState = sap.ui.core.ValueState.Error;
						oItem.setProperty("/ManufactureDate_valueState", sValueState);
						oItem.setProperty("/ManufactureDate_valueStateText", this.getResourceBundle().getText(
							"PRODUCTION_VALUE_STATE_TEXT"));
					} else {
						if (oEvent.getParameter("valid") === false) {
							sValueState = sap.ui.core.ValueState.Error;
							oItem.setProperty("/ManufactureDate_valueState", sValueState);
							oItem.setProperty("/ManufactureDate_valueStateText", this.getResourceBundle().getText(
								"PRODUCTION_VALUE_STATE_TEXT"));
						} else {
							oItem.setProperty("/ManufactureDate_valueState", sValueState);

							// calculate the shelf life expiration date based on the manufacture date and total shelf life 
							if (oItem.getData().ShelfLifeExpirationDateEnabled !== true) {
								this._calculateExpirationDate(oData.Ebeln, oItem.getData());
							}
						}
					}
					this._setValueStateMandatoryFields(oItem.getData());
					var bSelectEnabled = this._ItemConsistent(oItem.getData());
					if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
						oItem.setProperty("/SelectEnabled", bSelectEnabled);
						oItem.setProperty("/Selected", bSelectEnabled);
						oItem.setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(oItem.getData()));
					}
				}
			}

			if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
				this._setGuidedTour(iSelectedTableIndex);
			}
			this.getView().byId("idManufactureDate").focus();
		},
		// Formatter changes to upper case
		handleUpperCase: function (oEvent) {
			var sValue = oEvent.getSource().getValue();
			if (sValue) {
				oEvent.getSource().setValue(sValue.toUpperCase());
			}
		},

		/**
		 * @function handler to split items in table (main + subitems)
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleItemSplit: function (oEvent) {
			//var oTable = this.getView().byId("idProductsTable");
			//var oListItem = oEvent.getSource().getParent();
			//var iSelectedTableIndex = oTable.indexOfItem(oListItem);
			var iSelectedTableIndex = this._getSelectedItemInModel(oEvent);
			var oFrontendModel = this.getView().getModel("oFrontend");

			var oModel = oFrontendModel.getData();
			if (oModel.Items[iSelectedTableIndex].SplitButtonIcon === "sap-icon://add") { //add item
				//clone item
				var newItem = JSON.parse(JSON.stringify(oModel.Items[iSelectedTableIndex]));
				newItem.ItemCounter = this._getMaxItemOfDocumentIteminModel(oModel.Items[iSelectedTableIndex].DocumentItem, oFrontendModel);
				newItem.ItemCounter++;
				newItem.SplitEnabled = true;
				newItem.MaterialVisible = false; // hide non relevant fields
				newItem.AccountAssignmentVisible = false; // hide Account Assignment Button
				newItem.PlantVisible = false; //plant only on original item
				newItem.StockTypeVisible = true; // Stock Type location on split item
				newItem.DeliveredQuantity_input = 0;
				newItem.SplitButtonIcon = "sap-icon://less";

				//initial subitem components for splitted item
				if (newItem.SubItems && newItem.SubItems.length > 0) {
					if (newItem.ComponentAutoAdjusted) {
						newItem.ComponentIconState = IconColor.Positive; // no auto	adjust initially
						if (newItem.highlight === sap.ui.core.MessageType.Warning) { // no warning highlight for new split item
							newItem.highlight = sap.ui.core.MessageType.None;
						}
					}
					newItem.ComponentManualAdjusted = false; // no manual adjust initially
					newItem.ComponentAutoAdjusted = false; // no auto adjust initially
					for (var i = 0; i < newItem.SubItems.length; i++) {
						newItem.SubItems[i].QuantityInEntryUnit = 0;
						newItem.SubItems[i].OpenQuantity = 0;
					}
				}
				oModel.Items.splice(++iSelectedTableIndex, 0, newItem);
				oFrontendModel.setData(oModel);
			} else { //delete item
				oModel.Items.splice(iSelectedTableIndex, 1);
				oFrontendModel.setData(oModel);
			}

			// tooltip is lost on action (add or delete) and needs to be reset for all deletion items 
			var aTableCells = this.getView().byId("idProductsTable").getItems();
			var sIndex = aTableCells.length;
			for (var i = 1; i < sIndex; i++) {
				if (oModel.Items[i].SplitButtonIcon === "sap-icon://less") {
					aTableCells[i].getCells()[9].setTooltip(this.getResourceBundle().getText("LABEL_DISTRIBUTION_DELETE"));
				}
			}

			this._updateStackedBarChartColumn();
		}, //end handleItemSplit

		/**
		 * @function handler to navigate to detail screen
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleDetailPress: function (oEvent) {
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			//getting data of pressed table item in order to set model for detail screen
			var oFrontendModel = this.getView().getModel("oFrontend");
			var aItems = oFrontendModel.getProperty("/Items");
			var iSelectedTableIndex = this._getSelectedItemInModel(oEvent);
			oRouter.navTo("subscreen", {
				POItem: iSelectedTableIndex
			}, true); // route name in component definition

		},

		/**
		 * @function handler to navigate back to first screen with data confirm
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleNavButtonPress: function (oEvent) {
			//	this.oApplicationFacade.setApplicationModel("oItem", this.getView().getModel("oItem")); //needed for transfer back
			//write data back by reference semantics
			var oItemModel = this.getModel("oItem").getData();
			var oFrontendModel = this.getModel("oFrontend");
			var aItems = oFrontendModel.getProperty("/Items");
			var bIsConsistent;

			//extension
			if (this._aExtendedFields && this._aExtendedFields.length > 0) { //extended fields --> transfer
				var oBoundObject = this.getView().byId("idExtensionForm").getElementBinding().getBoundContext().getObject();
				for (var i = 0; i < this._aExtendedFields.length; i++) {
					if (this._isExtendedField(this._aExtendedFields[i].name) === true) {
						oItemModel[this._aExtendedFields[i].name] = oBoundObject[this._aExtendedFields[i].name];
					}
				}
			}
			if (this._SourceOfGR != this._SourceOfGRIsNoReference) {
				if (this._applyButtonEnabled(oItemModel)) { //transfer data only, if no error state in the item
					if (aItems) { //transfer detail back to main table //  
						for (var i = 0; i < aItems.length; i++) {
							if (aItems[i].DocumentItem === oItemModel.DocumentItem && aItems[i].ItemCounter === oItemModel.ItemCounter) {
								// check if component material and header material values (or Unit) in the S2 page are changed, so that the state icon and text of component can be adapted
								if (!oItemModel.ComponentManualAdjusted && oItemModel.SubItems && oItemModel.SubItems.length > 0 && aItems[i].SubItems &&
									aItems[i].SubItems.length > 0) {
									var bComponentManualAdjusted = SubItemController.checkIfSubItemChanged(aItems[i], oItemModel);
									if (bComponentManualAdjusted) {
										oItemModel.ComponentIconState = IconColor.Positive; // when user is able to apply the change on the components by click the apply button, the state of the components shall be correct
										oItemModel.ComponentAutoAdjusted = false; // auto adjust text shall be hiden
									}
									oItemModel.ComponentManualAdjusted = bComponentManualAdjusted;
								}
								aItems[i] = oItemModel;
							}
						}
						oFrontendModel.setProperty("/Items", aItems);
					}
					// Deal with select item an subitems 
					this._setSelectEnabled(oItemModel, aItems);
				} //transfer data only, if consistent
			} else { // App "GR without Reference" different behaviour, resp.:  transfer to main screen even if inconsistent
				if (aItems) { //transfer detail back to main table //  
					for (var i = 0; i < aItems.length; i++) {
						if (aItems[i].DocumentItem === oItemModel.DocumentItem && aItems[i].ItemCounter === oItemModel.ItemCounter) {
							aItems[i] = oItemModel;
						}
					}
					oFrontendModel.setProperty("/Items", aItems);
				}
				var oItem = this.getView().getModel("oItem");
				var sDocumentItem = oItem.getProperty("/DocumentItem");
				var msg;
				msg = this.getResourceBundle().getText("ITEM_APPLIED", [sDocumentItem]);
				MessageToast.show(msg, {
					duration: 1500,
					closeOnBrowserNavigation: false
				});
			}

			// remove Batch Button while navigating back to Object page if exists
			var oButton = null;
			if (this.getView().byId("idBatchLabel").getVisible() === true &&
				this.getView().byId("idBatchLabel").getFields().length > 1) {
				oButton = this.getView().byId("idBatchLabel").removeField("idCreateBatchButton");
			}
			if (oButton) {
				oButton.detachPress(this.handleCreateBatch, this).destroy();
			}

			// check storage bin and enable the column
			oFrontendModel.setProperty("/ColumnStorageBinVisible", this._isStorageBinInItems(oFrontendModel.getData().Items));
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("fullscreen", {
				abort: "false"
			}, true); //back seems to work alternative use fullscreen

		},

		/**
		 * @function handler to navigate back to first screen with data abort
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleCancelButtonPress: function (oEvent) {
			// remove Batch Button while navigating back to Object page if exists
			var oButton = null;
			if (this.getView().byId("idBatchLabel").getVisible() === true &&
				this.getView().byId("idBatchLabel").getFields().length > 1) {
				oButton = this.getView().byId("idBatchLabel").removeField("idCreateBatchButton");
			}
			if (oButton) {
				oButton.detachPress(this.handleCreateBatch, this).destroy();
			}
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("fullscreen", {
				abort: "true"
			}, true); //back seems to work alternative use fullscreen

		},

		/**
		 * @function handler of route matched event in unified shell navigation
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 * @param oController Controller object supplied by the UI
		 */
		_handleRouteMatched: function (oEvent, oController) {
			if (oController.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom" && oEvent.getParameters()
				.name === "subscreenAppState" && oController._oDetailPageData) {
				var oRouter = sap.ui.core.UIComponent.getRouterFor(oController);
				var oView = oRouter.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S2", sap.ui.core.mvc.ViewType.XML);
				var oDetailPageDataModel = new sap.ui.model.json.JSONModel(oController._oDetailPageData);
				oView.setModel(oDetailPageDataModel, "oItem");
				oController._oDetailPageData = null; // clean up the detail page data from app state
				return;
			}
			if (oController.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom" && oEvent.getParameters()
				.name ===
				"fullscreen") { //only S1 View
				// write data back
				var sAbort = "true"; //default -> hash change by nav from other app
				sAbort = oEvent.getParameter("arguments").abort;
				var oFrontendModel = oController.getView().getModel("oFrontend");
				var aItems = oFrontendModel.getProperty("/Items");
				if (sAbort === "false") {
					// var oFrontendModel = oController.getView().getModel("oFrontend");
					// var aItems = oFrontendModel.getProperty("/Items");
					// deal with post and select all button
					if (oController._SourceOfGR !== oController._SourceOfGRIsNoReference) { // except App "GR without Reference" different Behaviour
						oController._controlSelectAllAndPostButton(aItems); //update buttons
						oController._updateHiglightProperty(); //Update highlight
					} else { // App "GR without Reference Behaviour"
						oController._updateHiglightProperty(); //Update highlight
						var sValidation;
						var sColumnBatchVisible = false;
						for (var j = 0; j < aItems.length; j++) {
							sValidation = oController._validationNoRefItem(j);
							var oModel = oController.getView().getModel("oFrontend");
							if (aItems[j].BatchVisible === true && sColumnBatchVisible === false) {
								oModel.setProperty("/ColumnBatchVisible", true);
							}
							if (sValidation === false) {
								oModel = oController.getView().getModel("oFrontend");
								oModel.setProperty("/PostButtonEnabled", false);
								break;
							} else {
								oModel = oController.getView().getModel("oFrontend");
								oModel.setProperty("/PostButtonEnabled", true);
							}
						}
					}
				}
				for (var i = 0; i < aItems.length; i++) {
					if (aItems[i].Selected) {
						oFrontendModel.setProperty("/CopyButtonVisible", true);
						oFrontendModel.setProperty("/DeleteButtonVisible", true);
					}
				}
				//oController.getView().byId("idSelectAll").setSelected(oController._allItemsInTableSelected(aItems));
			} else { //only S2 view

				if (oController.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom" && (oEvent.getParameters()
						.name ===
						"fullscreen2" || oEvent.getParameters().name === "fullscreen3")) { //Hash set		
					//nav Event
					var oHashChanger = sap.ui.core.routing.HashChanger.getInstance();
					var sHash = oHashChanger.getHash();
					if (sHash.indexOf("key") > -1) {
						var aKeys = sHash.split("/");
						if (aKeys.length >= 2) {
							var sPurchaseOrderNumber = aKeys[aKeys.length - 1]; //last
							var oPOInput = oController.getView().byId("POInput");
							if (oPOInput.getValue() !== sPurchaseOrderNumber) { //change only if differen PO
								oPOInput.setValue(sPurchaseOrderNumber);
								oPOInput.fireChangeEvent(sPurchaseOrderNumber);
							}
						}
					}
				} else { //hash set --> old
					//AppState
					if (oController.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom" && (oEvent.getParameters()
							.name ===
							"fullscreen4")) { //Appstate		
						//nav Event
					} else { //S2
						// S2 used to transfer table line to view
						var oRouter = sap.ui.core.UIComponent.getRouterFor(oController);
						//var oItemModel = oController.oApplicationFacade.getApplicationModel("oItem");
						var oItemLine = oController.getModel("oFrontend").getProperty("/Items/" + oEvent.getParameter("arguments").POItem + "/");
						//	var oNewItem = new sap.ui.model.json.JSONModel(JSON.parse(JSON.stringify(oItemLine))); //clone line in case of abort
						var oNewItemJson = {};
						jQuery.extend(true, oNewItemJson, oItemLine); //clone line in case of abort
						var oNewItem = new sap.ui.model.json.JSONModel(oNewItemJson);
						var oView = oRouter.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S2", sap.ui.core.mvc.ViewType.XML);
						if (oController._SourceOfGR === oController._SourceOfGRIsNoReference) { // except App "GR without Reference" different Behaviour
							var sValidation = oController._validationNoRefItem(oEvent.getParameter("arguments").POItem);
							if (sValidation === false) {
								oNewItem.setProperty("/ApplyButtonEnabled", false);
							} else {
								if (oItemLine.Material_Input === "") {
									oNewItem.setProperty("/ApplyButtonEnabled", false);
								} else {
									oNewItem.setProperty("/ApplyButtonEnabled", true);
								}
							}
						} else {
							var bSelectEnabled = oController._ItemConsistent(oItemLine);

							oNewItem.setProperty("/SelectEnabled", bSelectEnabled);
							oNewItem.setProperty("/Selected", bSelectEnabled);
							oNewItem.setProperty("/ApplyButtonEnabled", oController._applyButtonEnabled(oItemLine));

						}
						oView.setModel(oNewItem, "oItem");
						oView.setModel(oController.getModel("oFrontend"), "oFrontend"); //needed for conistency chec
						oController._setReasonCodeFilter(oNewItem.getData());
						oView.byId("idTableSearchAccounting").setValue("");
						//Dynamic Batch Button Incident-ID: 1770611148
						var oData = oController.getModel("oFrontend").getProperty("/CreateBatchActive"); //check if intent is allowed
						if (oItemLine.BatchVisible === true && oData === true) {
							oView.byId("idBatchLabel").addField(new sap.m.Button("idCreateBatchButton", {
								//			press: this.handleCreateBatch,
								visible: true,
								text: "{i18n>BUTTON_CREATE_BATCH}",
								tooltip: "{i18n>TOOLTIP_CREATE_BATCH}",
								enabled: "{oItem>/ItemEnabled}"
							}).attachPress(oController.handleCreateBatch, oController));
						}
						if (oController._aExtendedFields && oController._aExtendedFields.length > 0) { //extended fields --> 

							var oDataModel = oController.getOwnerComponent().getModel("oData");
							var sItem = oEvent.getParameter('arguments').POItem;

							oView.byId("idExtensionForm").bindElement({
								path: "/GR4PO_DL_Items(InboundDelivery='" + oController.getModel("oFrontend").getProperty("/Ebeln") +
									"',DeliveryDocumentItem='" + oItemLine.DocumentItem + "',SourceOfGR='" + oController._SourceOfGR +
									"',AccountAssignmentNumber='')"
							});
						}
					}
				}
			}

		},

		/**
		 * @function checks whether all items in table are selected
		 * @param aTableItems optional containing all table items
		 * @return {boolean} true, if all items in table are selected
		 */
		_allItemsInTableSelected: function (aTableItems) {
			//if not supplied get on your own
			var aItems = [];
			if (aTableItems) {
				aItems = aTableItems;
			} else {
				var oModel = this.getView().getModel("oFrontend");
				aItems = oModel.getProperty("/Items");
			}

			//if at least one item is not selected --> deactivate the all checkbox
			var bSelectAll = false;
			if (aItems.length > 0) {
				bSelectAll = true;
				for (var i = 0; i < aItems.length; i++) {
					if ((aItems[i].Selected == false) && (aItems[i].ItemCounter == 0)) {
						bSelectAll = false;
					}
				} //for
			}
			return bSelectAll;

		},

		/**
		 * @function checks whether at least one item in table are selected
		 * @param aTableItems optional containing all table items
		 * @return {boolean} true, if at least one item in table is selected
		 */
		_oneItemsInTableSelected: function (aTableItems) {
			//if not supplied get on your own
			var aItems = [];
			if (aTableItems) {
				aItems = aTableItems;
			} else {
				var oModel = this.getView().getModel("oFrontend");
				aItems = oModel.getProperty("/Items");
			}

			//if at least one item is  selected 
			var bSelectAll = false;
			for (var i = 0; i < aItems.length; i++) {
				if ((aItems[i].Selected == true) && (aItems[i].ItemCounter == 0)) {
					bSelectAll = true;
				}
			} //for

			return bSelectAll;

		},

		/**
		 * @function checks whether at least one item in table is select enabled
		 * @param aTableItems optional containing all table items
		 * @return {boolean} true, if at least one item in table are selected
		 */
		_oneItemsInTableEnabled: function (aTableItems) {
			//if not supplied get on your own
			var aItems = [];
			if (aTableItems) {
				aItems = aTableItems;
			} else {
				var oModel = this.getView().getModel("oFrontend");
				aItems = oModel.getProperty("/Items");
			}

			//if at least one item is  selected 
			var bSelectEnabled = false;
			for (var i = 0; i < aItems.length; i++) {
				if ((aItems[i].SelectEnabled == true) && (aItems[i].ItemCounter == 0)) {
					bSelectEnabled = true;
				}
			} //for

			return bSelectEnabled;

		},

		/**
		 * @function checks whether  item in table plus its subitems is consistent (no field with value state error)
		 * @param aTableItems optional containing all table items
		 * @param oItem Table item to be checked
		 * @return {boolean} true, if item and its subitems is consistent
		 */
		_ItemConsistent: function (oItem, aTableItems) {
			var aItems;
			if (aTableItems) {
				aItems = aTableItems;
			} else {
				var oModel = this.getView().getModel("oFrontend");
				aItems = oModel.getProperty("/Items");
			}

			//check all (sub) items
			var bConsistent = true;
			for (var i = 0; i < aItems.length; i++) {
				if (aItems[i].DocumentItem === oItem.DocumentItem) { //item or subitem
					if (aItems[i].ItemCounter === oItem.ItemCounter) {
						bConsistent = this._applyButtonEnabled(oItem); //check item from input
					} else {
						bConsistent = this._applyButtonEnabled(aItems[i]); //check item from data
					}
				}
			}
			return bConsistent;
		},

		/**
		 * checks if the item has error state field to enable the apply button
		 * @param oCheckItem the item object
		 * @return {boolean} true if there is no error state
		 */
		_applyButtonEnabled: function (oCheckItem) {
			var bEnabled = true;
			for (var prop in oCheckItem) {
				if ((prop.indexOf("_valueState") > 0) && (prop.indexOf("_valueStateText") < 0)) {
					if ((oCheckItem[prop] !== sap.ui.core.ValueState.None) && (oCheckItem[prop] !== sap.ui.core.ValueState.Success)) {
						bEnabled = false;
					}
				}
			}
			if (bEnabled && oCheckItem.ItemComponentVisible) { // check if all the components have the correct state
				bEnabled = SubItemController._applyButtonEnabledForSubItems(oCheckItem);
			}
			return bEnabled;
		},

		/**
		 * @function updates highlight property of one item
		 * @param oItem the item object
		 * @return {string} error state
		 */
		_updateHighlightForEachItem: function (oItem) {
			var sHighlight = sap.ui.core.MessageType.None;
			for (var prop in oItem) {
				if ((prop.indexOf("_valueState") > 0) && (prop.indexOf("_valueStateText") < 0)) {
					if (oItem[prop] === sap.ui.core.ValueState.Error) { //error has highest prio
						sHighlight = sap.ui.core.MessageType.Error;
						break;
					} else if (oItem[prop] === sap.ui.core.ValueState.Warning && sHighlight === sap.ui.core.MessageType.None) {
						sHighlight = sap.ui.core.MessageType.Warning;
					}
				}
				if (oItem.ItemComponentVisible && prop.indexOf("ComponentIconState") >= 0) { // update the highlight of item based on the component icon state
					if (oItem[prop] === IconColor.Negative) {
						sHighlight = sap.ui.core.MessageType.Error;
						break;
					} else if (oItem[prop] === IconColor.Critical) {
						sHighlight = sap.ui.core.MessageType.Warning;
					}
				}
			}
			return sHighlight;
		},

		/**
		 * @function updates highlight property of each visible table item
		 */
		_updateHiglightProperty: function () {
			var oModel = this.getModel("oFrontend");
			var aTableItems = this.getView().byId("idProductsTable").getItems();
			var sJsonItems = oModel.getData().Items;
			for (var i = 0; i < aTableItems.length; i++) {
				for (var j = 0; j < sJsonItems.length; j++) {
					// update the StackedBarChart and highlight only on visible items in table
					if (aTableItems[i].getBindingContext("oFrontend").getObject().DocumentItem === sJsonItems[j].DocumentItem &&
						aTableItems[i].getBindingContext("oFrontend").getObject().ItemCounter === sJsonItems[j].ItemCounter) {
						oModel.setProperty("/Items/" + j + "/highlight", this._updateHighlightForEachItem(sJsonItems[j]));
						break;
					}
				}
			}
		},

		/**
		 * @function sets the value state of empty mandatory fields to error by reference semantics
		 * @param oItem Table item to be checked
		 */
		_setValueStateMandatoryFields: function (oItem) {
			// all properties
			var attribute = "";
			for (var prop in oItem) {
				if ((prop.indexOf("Mandatory") > 0) && oItem[prop] === true) { //mandatory exists
					attribute = prop.substring(0, prop.indexOf("Mandatory"));
					if ((oItem[attribute] !== undefined && oItem[attribute] === "") || (oItem[attribute + "_selectedKey"] !== undefined && oItem[
							attribute + "_selectedKey"] === "")) { //field is initial
						oItem[attribute + "_valueState"] = sap.ui.core.ValueState.Error; //reference semantics
						oItem.highlight = sap.ui.core.ValueState.Error;
					}
				}
			} //for
		},

		/**
		 * @function checks whether select all Checkbox shall be partially selected or selected
		 * @param bOneItemSelected if at lease one item is selected
		 * @param bAllItemsSelected if all items are selected
		 */
		_controlSelectAllCheckBox: function (bOneItemSelected, bAllItemsSelected) {
			var oSelectAllCheckbox = this.getView().byId("idSelectAll");
			if (bAllItemsSelected) {
				oSelectAllCheckbox.setSelected(true).setPartiallySelected(false);
			} else if (bOneItemSelected) {
				oSelectAllCheckbox.setSelected(true).setPartiallySelected(true);
			} else {
				oSelectAllCheckbox.setSelected(false);
			}
		},

		/**
		 * @function checks whether  Select all Checkbox / Post Button shall be enabled
		 * @param aTableItems optional containing all table items
		 */
		_controlSelectAllAndPostButton: function (aTableItems) {
			//if not supplied get on your own
			var aItems = [];
			var oModel = this.getView().getModel("oFrontend");
			if (aTableItems) {
				aItems = aTableItems;
			} else {
				aItems = oModel.getProperty("/Items");
			}
			var bOneItemSelected = this._oneItemsInTableSelected(aItems);
			var bAllItemsSelected = this._allItemsInTableSelected(aItems);
			var bNoReferenceApp = this._SourceOfGR === this._SourceOfGRIsNoReference;

			if ((oModel.getProperty("/DocumentDate_valueState") == sap.ui.core.ValueState.None) && (oModel.getProperty(
						"/PostingDate_valueState") ==
					sap.ui.core.ValueState.None)) {
				oModel.setProperty("/PostButtonEnabled", bOneItemSelected || bNoReferenceApp);
			} else { //disable on wrong date
				oModel.setProperty("/PostButtonEnabled", false);
				//  				this.setBtnEnabled("postBtn", false);
			}

			this.getView().byId("idSelectAll").setEnabled(this._oneItemsInTableEnabled(aItems));
			this._controlSelectAllCheckBox(bOneItemSelected, bAllItemsSelected);
		},

		/**
		 * @function sets select enabled button of table item and subitems (invisible)
		 * @param aTableItems optional containing all table items
		 * @param oItem Table item to be selected
		 */
		_setSelectEnabled: function (oItem, aTableItems) { //Update Model of subitems for select attributes 
			var aItems;
			var oModel = this.getView().getModel("oFrontend");
			if (aTableItems) {
				aItems = aTableItems;
			} else {
				aItems = oModel.getProperty("/Items");
			}
			for (var i = 0; i < aItems.length; i++) {
				if (aItems[i].DocumentItem == oItem.DocumentItem && (aItems[i].Selected !== oItem.Selected || aItems[i].SelectEnabled !== oItem.SelectEnabled)) {
					oModel.setProperty("/Items/" + i + "/SelectEnabled", oItem.SelectEnabled);
					oModel.setProperty("/Items/" + i + "/Selected", oItem.Selected);
				}
			} //for

		},

		/**
		 * @function returns the selected table item in model
		 * @param oEvent Event object supplied by UI
		 * @return {int} index of the selected item in model
		 */
		_getSelectedItemInModel: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("oFrontend").getPath();
			return parseInt(sPath.substring(7, sPath.length));
		},

		/**
		 * @function returns the max index of subitems of a table item
		 * @param {string} sDocumentItem key of the table item = PO item number
		 * @return {int} max index of subitems assigned to sDocumentItem
		 */
		_getMaxItemOfDocumentIteminModel: function (sDocumentItem, oFrontend) {
			var oModel = {};
			if (!oFrontend) {
				oModel = this.getView().getModel("oFrontend");
			} else {
				oModel = oFrontend;
			}

			var aItems = oModel.getProperty("/Items");
			var maxItem = 0;

			for (var i = 0; i < aItems.length; i++) {
				if ((aItems[i].DocumentItem === sDocumentItem) && (aItems[i].ItemCounter > maxItem)) {
					maxItem = aItems[i].ItemCounter;
				}
			}

			return maxItem;
		},

		/**
		 * @function return the inner app state
		 * @private
		 * @param {oJSON} optional parameter, if not supplied, "oFrontend" is used
		 * @return {object} Inner app state as JSON
		 */
		_getInnerAppState: function (oJSON, oBatchCreate, oDetailPageData) {
			var oState = {
				customData: {}
			};

			var oJSONModel;
			if (!oJSON) { //deal with optional parameter
				oJSONModel = this.getModel("oFrontend").getData();
			} else {
				oJSONModel = oJSON;
			}

			//Header
			for (var k = 0; k < this._oNavigationServiceFields.aHeaderFields.length; k++) {
				oState.customData[this._oNavigationServiceFields.aHeaderFields[k]] = oJSONModel[this._oNavigationServiceFields.aHeaderFields[k]];
			}
			//Attachment services
			oState.customData.Temp_Key = this.temp_objectKey;
			//Copy the items data in App State
			oState.customData.Items = oJSONModel.Items;
			if (oBatchCreate) {
				oState.customData.oBatchCreate = oBatchCreate;
			}
			if (oDetailPageData) {
				oState.customData.DetailPageData = oDetailPageData;
			}
			return oState;
		},

		/**
		 * Returns the success dialog state
		 * @private
		 * @param {oJSON} optional parameter, if not supplied, "oFrontend" is used
		 * @return {object} Success dialog state as JSON
		 */
		_getSuccessPostDialogState: function (oJson) {
			var oState = {
				customData: {
					successPostDialog: oJson
				}
			};
			return oState;
		},

		/**
		 * @function restores the Appstate if GR without reference is used
		 * @private
		 * @param {oAppState} AppState derived from BackEnd
		 */
		_restoreInnerAppStateSourceOfGRIsNoReference: function (oAppState) {
			var sJson = this.getView().getModel("oFrontend").getData();
			//restore header
			for (var k = 0; k < this._oNavigationServiceFields.aHeaderFields.length; k++) {
				sJson[this._oNavigationServiceFields.aHeaderFields[k]] = oAppState[this._oNavigationServiceFields.aHeaderFields[k]];
			}
			sJson.Items = oAppState.Items;
			this.getView().getModel("oFrontend").setData(sJson); //write back
		},

		/**
		 * @function sets the search placeholder text in case of setting changes
		 * @private
		 */
		_setSearchPlaceholderText: function () {
			var sSearchPlaceholder = "";
			//Default
			if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) { //purchase order
				sSearchPlaceholder = this.getResourceBundle().getText("SEARCH_PLACEHOLDER_TEXT_STO_PO");
			} else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) { //Production Order // TODO: 
				sSearchPlaceholder = this.getResourceBundle().getText("SEARCH_PLACEHOLDER_TEXT_PROD");
			} else { //Inbound delivery
				sSearchPlaceholder = this.getResourceBundle().getText("SEARCH_PLACEHOLDER_TEXT_DL");
			}

			this.getModel("oFrontend").setProperty("/searchPlaceholderText", sSearchPlaceholder);
		},

		/**
		 * @function updates all StackedBarCharts in Table 
		 */
		_updateStackedBarChartColumn: function () {
			//new rendering of stacked micro chart
			/// add stack bar chart percentage for multiple accounting
			var sJson = this.getModel("oFrontend").getData();
			var aItems = this.getView().byId("idProductsTable").getItems();

			for (var i = 0; i < aItems.length; i++) {
				for (var j = 0; j < sJson.Items.length; j++) {
					if (sJson.Items[j].AccountAssignmentVisible === true) {
						if (aItems[i].getBindingContext("oFrontend").getObject().DocumentItem === sJson.Items[j].DocumentItem &&
							aItems[i].getBindingContext("oFrontend").getObject().ItemCounter === 0) {
							this._updateStackedBarChart(aItems[i], sJson.Items[j]);
							break;
						}
					}
				}
			}
		},

		onUpdateFinished: function () {
			this._updateStackedBarChartColumn();
		},

		/**
		 * @function fills the StackedBarChart with bars per purchase order item
		 * @param {Object} oTableItems contains a reference purchase order item table line
		 * @param {Object} oItem contains a reference purchase order item model with account assignments
		 */
		_updateStackedBarChart: function (oTableItems, oItem) {
			if (oItem.AccountAssignmentVisible === true) {
				//find correct cell
				var aCells = oTableItems.getCells();
				var iStackedBarCellIndex = null;
				for (var i = 0; i < aCells.length; i++) {
					if (aCells[i].getId().indexOf("idAccountAssignment") > 0) {
						iStackedBarCellIndex = i;
					}
				}

				//Cell contains vertical layout container, therefore second entry of content aggregation has chart
				oTableItems.getCells()[iStackedBarCellIndex].getContent()[1].removeAllBars(); //second entry in vertical layout

				//if single accounting => set to 100 %
				var a = oItem.AccountAssignments.length;
				if (a < 2) {
					oItem.AccountAssignments[0].MultipleAcctAssgmtDistrPercent = 100;
				}

				for (var y = 0; y < oItem.AccountAssignments.length; y++) {
					var oStackedBar = new sap.suite.ui.microchart.StackedBarMicroChartBar({
						value: parseFloat(oItem.AccountAssignments[y].MultipleAcctAssgmtDistrPercent),
						displayValue: oItem.AccountAssignments[y].MultipleAcctAssgmtDistrPercent + " %",
						valueColor: this._aSemanticChartColors[y]
					});

					oTableItems.getCells()[iStackedBarCellIndex].getContent()[1].addBar(oStackedBar); //econd entry in vertical layout
				}
			} //if
		},

		/**
		 * @function  enables the scan button based on personalisation
		 * @private
		 */
		_setScanButtonVisibility: function () {
			if (jQuery.support.touch || this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
				this.getModel("oFrontend").setProperty("/ScanButtonVisible", this._oPersonalizedDataContainer.EnableBarcodeScanning);
			} else {
				this.getModel("oFrontend").setProperty("/ScanButtonVisible", false);
			}
		},

		/**
		 * @function evaluates field control information of oData and translates it into boolean values in Json
		 * @param {string} sField name of the field to be controlled in UI
		 * @param {string} sODataControlField name of the field to be controlled in UI
		 * @param {object} oItem Json object will get attributes ala <sField>visible, <sField>mandatory, <sField>enabled, <sField>ValueHelpVisible, <sField>CreateButtonVisible
		 */

		_evaluateFieldControl: function (sField, sODataControlField, oItem) {
			if (sODataControlField.substring(0, 1) === "1") { //Visisble
				oItem[sField + "Visible"] = true;
			} else {
				oItem[sField + "Visible"] = false;
			}
			if (sODataControlField.substring(1, 2) === "1") { //Mandatory
				oItem[sField + "Mandatory"] = true;
			} else {
				oItem[sField + "Mandatory"] = false;
			}
			if (sODataControlField.substring(2, 3) === "1") { //enabled
				oItem[sField + "Enabled"] = true;
			} else {
				oItem[sField + "Enabled"] = false;
			}
			if (sODataControlField.substring(3, 4) === "1") { //ValueHelp
				oItem[sField + "ValueHelpVisible"] = true;
			} else {
				oItem[sField + "ValueHelpVisible"] = false;
			}
			if (sODataControlField.substring(4, 5) === "1") { //CreateFunction
				oItem[sField + "CreateButtonVisible"] = true;
			} else {
				oItem[sField + "CreateButtonVisible"] = false;
			}

		},

		/**
		 * @function sets the filter value for movement type of the reason code drop down
		 * @param {Object} oItem selected PO item
		 **/
		_setReasonCodeFilter: function (oItem) {
			if (oItem.GoodsMovementReasonCodeVisible === true) { //reason code visible
				var sMyMovemenType = this._getMovementType(oItem);
				var aFilters = [];
				aFilters.push(new sap.ui.model.Filter("MovementType", sap.ui.model.FilterOperator.EQ, sMyMovemenType));
				this.getView().byId("idGoodsMovementReasonCodeSelect").getBinding("items").filter(aFilters);
			} //reason code visible
		},

		/**
		 * @function calculate the shelf life expiration date based on the entered production date (function import)
		 * @private
		 * @param {Object} oData     => material, production date, Source of GR (purchase order or delivery or production order)
		 * @param {Integer} iSelectedIndexe optional, represents selected table row in items
		 **/
		_calculateExpirationDate: function (oEbeln, oItem, iSelectedTableIndex) {

			var oDateOutputFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd"
			});

			// determine the document number (purchase order, delivery or production order)
			var oGR4Document = oEbeln;
			if (this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
				oGR4Document = "000" + oGR4Document;
			}
			if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
				oGR4Document = "00" + oGR4Document;
			}
			if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
				oGR4Document = "";
			}
			// determine the movement type
			var sMovementType = "";
			var sMaterial;
			if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
				sMaterial = oItem.Material;
			} else {
				sMaterial = oItem.Material_Input;
			}
			var sMyMovemenType = this._getMovementType(oItem);
			this.getOwnerComponent().getModel("oData").callFunction('/ShelfLifeExpirationDate', {
				method: 'GET',
				urlParameters: {
					DeliveryDocumentItem: oItem.DocumentItem,
					InboundDelivery: oGR4Document,
					ManufactureDate: oDateOutputFormat.format(this._oDateFormat.parse(oItem.ManufactureDate)),
					Material: sMaterial,
					MovementType: sMyMovemenType,
					Plant: oItem.Plant,
					SourceOfGR: this._SourceOfGR,
					StorageLocation: oItem.StorageLocation
				},
				success: jQuery.proxy(this._successExpirationDateLoad, this, iSelectedTableIndex),
				error: jQuery.proxy(this._handleOdataError, this)
			}); //calculate shelf life expiration date 
		},
		/**
		 * Proxy of successfull load of Shelf Life Expiration Date
		 * @private
		 * @param {Object} oData Result of the oData request (function import to calculate the production date)
		 * @param {Object} oResponse Response of the oData request (calculated production date)
		 */
		_successExpirationDateLoad: function (iSelectedTableIndex, oData, oResponse) {
			if (oData.results[0]) { //prerquisite only one line is filled
				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") { //S1 View
					this.getView().getModel("oFrontend").setProperty("/Items/" + iSelectedTableIndex + "/ShelfLifeExpirationDate", this._oDateFormat
						.format(
							oData.results[0].ShelfLifeExpirationDate));
				} else { //S2 View
					this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate", this._oDateFormat.format(oData.results[0].ShelfLifeExpirationDate));
				}

			}

		},

		/**
		 * @function checks whether the field is extended or field control
		 * @param {string} sField name of the field to be controlled
		 * @return {boolean} true, field is extended field, false, field is field control
		 **/
		_isExtendedField: function (sFieldname) {
			if (sFieldname.lastIndexOf("_COB") === sFieldname.length - 4) {
				return true;
			} else {
				return false;
			}
		},

		/**
		 * @function View settings such as grouping/sorting
		 * @param oEvent Event object supplied by UI
		 */
		handleViewSettingsDialogButtonPressed: function (oEvent) {
			if (!this._oSettingsDialog) {
				this._oSettingsDialog = sap.ui.xmlfragment("s2p.mm.im.goodsreceipt.purchaseorder.view.settings", this);
				this.getView().addDependent(this._oSettingsDialog);
			}
			// toggle compact style
			//jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
			this._oSettingsDialog.open();
		},

		/**
		 * @function View settings Confirm
		 * @param oEvent Event object supplied by UI
		 */
		handleViewSettingsConfirm: function (oEvent) {
			var oView = this.getView();
			var oTable = oView.byId("idProductsTable");

			var mParams = oEvent.getParameters();
			var oBinding = oTable.getBinding("items");

			// apply sorter to binding
			// (grouping comes before sorting)
			var aSorters = [];
			/*if (mParams.groupItem) {
				  var sPath = mParams.groupItem.getKey();
				  var bDescending = mParams.groupDescending;
				  var vGroup = this.mGroupFunctions[sPath];
				  aSorters.push(new sap.ui.model.Sorter(sPath, bDescending, vGroup));
				}*/
			var sPath = mParams.sortItem.getKey();
			var bDescending = mParams.sortDescending;
			aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
			if (sPath == "Material" || sPath == "MaterialName") { //ensure that items with splitt stay together
				aSorters.push(new sap.ui.model.Sorter("DocumentItem_int", false));
			}

			aSorters.push(new sap.ui.model.Sorter("ItemCounter", false)); //keep split items together
			oBinding.sort(aSorters);

		},
		/**
		 * @function View settings cancel
		 * @param oEvent Event object supplied by UI
		 */
		handleViewSettingsCancel: function (oEvent) {

		},
		/**
		 * @function handler for post button/ post GR to backend/displays messages/clears all on success
		 */
		handlePost: function () {
			//remove message from previous posting if exist
			if (sap.ui.getCore().getMessageManager().getMessageModel().getData().length > 0) {
				sap.ui.getCore().getMessageManager().removeAllMessages();
			}
			var oModel = this.getView().getModel("oFrontend");
			var oBinModel = this.getView().getModel("bindata");
			var oBinData = oBinModel.getData();
			var oResourceBundle = this.getResourceBundle();
			var oDateOutputFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd"
			});
			var oJSONModel = oModel.getData();
			var oJson = {};
			var aChangeOperations = [];
			oJson.InboundDelivery = "";
			var oDate = oModel.getProperty("/DocumentDate");
			oJson.DocumentDate = oDateOutputFormat.format(this._oDateFormat.parse(oDate)) + "T00:00:00";
			//oJson.DocumentDate = "2014-06-05T00:00:00";
			//oJson.PostingDate =  "2014-06-05T00:00:00";
			oDate = oModel.getProperty("/PostingDate");
			oJson.PostingDate = oDateOutputFormat.format(this._oDateFormat.parse(oDate)) + "T00:00:00";
			oJson.InboundDelivery = oModel.getProperty("/Ebeln");
			oJson.SourceOfGR = this._SourceOfGR;
			oJson.DeliveryDocumentByVendor = oModel.getProperty("/DeliveryDocumentByVendor");
			oJson.MaterialDocumentHeaderText = oModel.getProperty("/MaterialDocumentHeaderText");
			oJson.Temp_Key = this.temp_objectKey;
			oJson.BillOfLading = oModel.getProperty("/BillOfLading");
			oJson.VersionForPrintingSlip = oModel.getProperty("/VersionForPrintingSlip_selectedKey");
			var Item;
			oJson.Header2Items = new Array();
			var aStorageBinsMissing = [];
			for (var i = 0; i < oJSONModel.Items.length; i++) {
				Item = {};
				// var oObject =  aSelectedContext[i].getObject();
				Item.Material = oJSONModel.Items[i].Material;
				// No Reference 
				if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
					Item.Material = oJSONModel.Items[i].Material_Input;
				}
				Item.InboundDelivery = oModel.getProperty("/Ebeln");
				Item.DeliveryDocumentItem = oJSONModel.Items[i].DocumentItem;

				Item.DocumentItemText = oJSONModel.Items[i].DocumentItemText;

				Item.QuantityInEntryUnit = "" + oJSONModel.Items[i].DeliveredQuantity_input; //convert to string
				Item.EntryUnit = oJSONModel.Items[i].DeliveredUnit_input;
				Item.OpenQuantity = oJSONModel.Items[i].OpenQuantity;
				Item.UnitOfMeasure = oJSONModel.Items[i].Unit;
				Item.Plant = oJSONModel.Items[i].Plant;
				Item.StorageLocation = oJSONModel.Items[i].StorageLocation;
				Item.StockType = oJSONModel.Items[i].StockType_selectedKey; //use key not array position
				if (Item.StockType === " ") { //remapping space -> empty
					Item.StockType = "";
				}
				Item.Batch = oJSONModel.Items[i].Batch;

				/*--------------------------------------------------------------------------*/
				Item.SupplierBatch = oJSONModel.Items[i].SupplierBatch;
				/*--------------------------------------------------------------------------*/

				Item.AcctAssignmentCategory = oJSONModel.Items[i].AcctAssignmentCategory;
				Item.AcctAssignmentCategoryName = oJSONModel.Items[i].AcctAssignmentCategoryName;
				Item.AssetNumber = oJSONModel.Items[i].AssetNumber;
				Item.AssetNumberName = oJSONModel.Items[i].AssetNumberName;
				Item.SubAssetNumber = oJSONModel.Items[i].SubAssetNumber;
				Item.GLAccount = oJSONModel.Items[i].GLAccount;
				Item.GLAccountName = oJSONModel.Items[i].GLAccountName;
				Item.Project = oJSONModel.Items[i].Project;
				Item.ProjectDescription = oJSONModel.Items[i].ProjectDescription;
				Item.InventorySpecialStockType = oJSONModel.Items[i].InventorySpecialStockType;
				Item.SalesOrder = oJSONModel.Items[i].SalesOrder;
				Item.SalesOrderItem = oJSONModel.Items[i].SalesOrderItem;
				Item.WBSElement = oJSONModel.Items[i].Project;
				Item.WBSElementDescription = oJSONModel.Items[i].ProjectDescription;
				Item.Supplier = oJSONModel.Items[i].Lifnr;
				if (oJSONModel.Items[i].DeliveryCompleted === true) {
					Item.DeliveryCompleted = "X";
				}
				Item.UnloadingPointName = oJSONModel.Items[i].UnloadingPointName;
				Item.GoodsRecipientName = oJSONModel.Items[i].GoodsRecipientName;
				Item.SubItem = oJSONModel.Items[i].ItemCounter.toString();

				Item.GoodsMovementReasonCode = oJSONModel.Items[i].GoodsMovementReasonCode_selectedKey;
				//ShelfLifeExpirationDate
				if (oJSONModel.Items[i].ShelfLifeExpirationDate !== '') {
					Item.ShelfLifeExpirationDate = oDateOutputFormat.format(this._oDateFormat.parse(oJSONModel.Items[i].ShelfLifeExpirationDate)) +
						"T00:00:00";
				}
				if (oJSONModel.Items[i].ManufactureDate !== '') {
					Item.ManufactureDate = oDateOutputFormat.format(this._oDateFormat.parse(oJSONModel.Items[i].ManufactureDate)) + "T00:00:00";
				}

				//Extension fields per item 
				if (this._aExtendedFields && this._aExtendedFields.length > 0) { //extended fields --> transfer
					for (var k = 0; k < this._aExtendedFields.length; k++) {
						if (this._isExtendedField(this._aExtendedFields[k].name) === true) {
							Item[this._aExtendedFields[k].name] = oJSONModel.Items[i][this._aExtendedFields[k].name];
						}
					}
				}
				if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
					if (Item.QuantityInEntryUnit >= 0 && oJSONModel.Items[i].Selected === true) { // post only selected Quanities>= 0
						// check component material changes for subcontracting. When stock type is "U" (bwart 105), no sub components is posted.
						if (oJSONModel.Items[i].ComponentManualAdjusted && oJSONModel.Items[i].SubItems && Item.StockType !== "U") {
							Item = SubItemController.handleSubItemDataForPosting(Item, oJSONModel.Items[i].SubItems);
						}
						oJson.Header2Items.push(Item);
					}
				} else {
					if (Item.QuantityInEntryUnit > 0) {
						oJson.Header2Items.push(Item);
					}
				}
			}
			oJson.Header2Refs = [{}]; // need for post to get the content from backend

			var aSelectedItems = oJSONModel.Items.filter(item => item.WMLInScope && item.Selected === true);

			for (i = 0; i < aSelectedItems.length; i++) {
				var sItemText = aSelectedItems[i].DeliveredQuantity_input + " " + aSelectedItems[i].DeliveredUnit_input + " - " + aSelectedItems[i]
					.Material + "/" + aSelectedItems[i].StorageLocation + (aSelectedItems[i].ItemCounter > 0 ? "/" + aSelectedItems[i].ItemCounter :
						"");
				if (oBinData === undefined || oBinData.Bin === undefined) {
					aStorageBinsMissing.push(oResourceBundle.getText("MESSAGE_ITEM_MISSING_DATA", [sItemText, "Storage Bin"]));
				} else {
					var oBin = oBinData.Bin[i];
					if (oBin === undefined || oBin.StorageBin === "") {
						aStorageBinsMissing.push(oResourceBundle.getText("MESSAGE_ITEM_MISSING_DATA", [sItemText, "Storage Bin"]));
					}
				}
			}

			if (aStorageBinsMissing.length > 0) {
				var sDetails = "<ul>";
				aStorageBinsMissing.forEach(function (sMsg) {
					sDetails += "<li>" + sMsg + "</li>";
				});
				sDetails += "</ul>";
				sap.m.MessageBox.error(oResourceBundle.getText("MESSAGE_ITEM_MISSING_DATA", ["Items", "Storage Bin"]), {
					icon: sap.m.MessageBox.Icon.QUESTION,
					title: oResourceBundle.getText("DIALOG_MESSAGE_ITEM_MISSING_DATA"),
					details: sDetails,
					onClose: function () {},
					styleClass: "sapUiSizeCompact",
					initialFocus: sap.m.MessageBox.Action.CANCEL
				});
				return;
			}
			this._toggleBusy(true);
			this.getView().getModel("oData").create("/GR4PO_DL_Headers", oJson, {
				success: jQuery.proxy(this._handlePostSuccess, this),
				error: jQuery.proxy(this._handleOdataError, this)
			});

		},

		_handleErrorResponse: function (oJson) {
			var rItemRegex, sItemNr, aItemRegexArray, sTargetProperty, aItems, rCounterRegex, aCounterRegexArray, sCounterNr;
			var oFrontendModel = this.getView().getModel("oFrontend");
			var bNoReferenceApp = this._SourceOfGR === this._SourceOfGRIsNoReference;

			function setErrorValueState(oFrontendModel, sTarget, sMessage) {
				switch (sTarget) {
				case "PostingDate":
					oFrontendModel.setProperty("/" + sTarget + "_valueState", sap.ui.core.ValueState.Error);
					oFrontendModel.setProperty("/" + sTarget + "_valueStateText", sMessage);
					break;
				default:
					// sTarget is a relative path to item, use regular expression to read the item id
					rItemRegex = /Item=(\d*)/g;
					aItemRegexArray = rItemRegex.exec(sTarget);
					rCounterRegex = /Counter=(\d*)/g;
					aCounterRegexArray = rCounterRegex.exec(sTarget);
					if (aItemRegexArray) {
						sItemNr = aItemRegexArray[1];
						sCounterNr = aCounterRegexArray[1];
						sTargetProperty = sTarget.substring(sTarget.lastIndexOf("/") + 1, sTarget.length);
						aItems = oFrontendModel.getProperty("/Items");
						for (var i = 0; i < aItems.length; i++) {
							if ((aItems[i].DocumentItem === sItemNr || sItemNr.endsWith(aItems[i].DocumentItem)) && (aItems[i].ItemCounter.toString() ===
									sCounterNr || sCounterNr.endsWith(aItems[i].ItemCounter.toString()))) {
								aItems[i][sTargetProperty + "_valueState"] = "Error";
								aItems[i][sTargetProperty + "_valueStateText"] = sMessage;
								aItems[i].Selected = false;
								aItems[i].SelectEnabled = bNoReferenceApp || false;
								aItems[i].highlight = "Error";
								aItems[i].ApplyButtonEnabled = false;
								break;
							}
						}
					}
					break;
				}
			}

			setErrorValueState(oFrontendModel, oJson.target, oJson.message);
			if (oJson.details) {
				for (var i = 0; i < oJson.details.length; i++) {
					setErrorValueState(oFrontendModel, oJson.details[i].target, oJson.details[i].message);
				}
			}
			this._controlSelectAllAndPostButton(oFrontendModel.getProperty("/Items"));
		},

		/**
		 *
		 * @function call back on successfull post request
		 * @private
		 * @param {object} oData oData object
		 * @param {object} oResponse Response object
		 */
		_handlePostSuccess: function (oData, oResponse) {
			this._toggleBusy(false);
			var oheader = oResponse.headers["sap-message"];
			var oJson = JSON.parse(oheader);

			var oBinData = {
				Bin: [{
					CompanyCode: "",
					MatDocPos: "",
					Country: "",
					Quantity: "",
					Plant: "",
					StorageLocation: "",
					StorageBin: "",
					Material: "",
					Batch: "",
					SupplierBatch: "",
					Order: "",
					Item: "",
					Customer: "",
					QuantitySO: "",
					Unit: ""
				}]
			};

			var oBinModel = new JSONModel(oBinData);
			this.getView().setModel(oBinModel, "bindata");

			if (oJson.code === "MIGO/012" ||
				oJson.code === "MBND_CLOUD/017" || //Inbound Delivery
				oJson.code === "MBND_CLOUD/018") { //Outbound Delivery
				// Initialization the Initial Load String
				this._initialDataLoaded = null;

				// create and open success post dialog
				this._openSuccessDialog(oData, oJson);

				//clear success message from message indicator
				sap.ui.getCore().getMessageManager().removeAllMessages();

				//after successful posting the PO item table has to be hidden
				this.getView().getModel("oFrontend").setData(this._getInitFrontend());

				this._ResetStorageLocationBuffer = true; //reset Storage Location buffer
				this._ResetBatchBuffer = true; //reset Batch Buffer
				this.getView().byId("idProductsTable").getBinding("items").filter([]); // clear any table filters
				this.getView().byId("idSelectAll").setSelected(false);
				this.getView().byId("idTableSearch").setValue("");
				this.getView().byId("POInput").setValue(""); //reset input field
				this.getView().byId("POInput").setEditable(true); //in case of call by PO Number

				/*code for Attachments*/
				if (this.oCompAttachProj) {
					delete this.oCompAttachProj;
				}

			} else {
				if (oJson.severity === "error" && oJson.target) {
					this._handleErrorResponse(oJson);
				}
				// First set the status 
				if (oJson.code === "MBND_CLOUD/002") {
					var aReturn = [];
					var oReturn = {};
					oReturn.MessageText = oJson.message;
					oReturn.Severity = oJson.severity;
					var aMessage = oJson.target.split(";");
					oReturn.valueState = (aMessage[aMessage.length - 1] + "_valueState");
					oReturn.valueStateText = (aMessage[aMessage.length - 1] + "_valueStateText");
					oReturn.DocumentItem = aMessage[aMessage.length - 2];
					aReturn.push(oReturn);
					for (var i = 0; i < oJson.details.length; i++) {
						oReturn = {};
						oReturn.MessageText = oJson.details[i].message;
						oReturn.Severity = oJson.details[i].severity;
						var aMessage = oJson.details[i].target.split(";");
						oReturn.valueState = (aMessage[aMessage.length - 1] + "_valueState");
						oReturn.valueStateText = (aMessage[aMessage.length - 1] + "_valueStateText");
						oReturn.DocumentItem = aMessage[aMessage.length - 2];
						aReturn.push(oReturn);
					}

					this._SetStatus(aReturn, this.getView().getModel("oFrontend"), oData);
				}
				this.getView().getModel("message").fireMessageChange();
			}
		},

		/**
		 * Create data model for the success dialog. Supports to show the BAdI created document in the success dialog.
		 * @private
		 * @param {object} oData object from backend entity
		 */
		_openSuccessDialog: function (oData) {
			var oPostMessageModel, oPostDialogJson;
			oPostDialogJson = {
				DialogState: "Success",
				DialogTitle: this.getResourceBundle().getText("TITLE_SUCC_POST"),
				CopilotEnabled: this._aCopilotChats && this._aCopilotChats.length > 0,
				CopilotActive: this.getView().getModel("oFrontend").getProperty("/CopilotActive")
			};

			// new entity Header2Refs include the app own created material document (delivery document) and the BAdI created documents
			if (oData.Header2Refs && oData.Header2Refs.results.length > 0) {
				this._createDataForDocuments(oData.Header2Refs.results, oPostDialogJson);
				oPostMessageModel = new sap.ui.model.json.JSONModel(oPostDialogJson);
				this._oPostDialog.setModel(oPostMessageModel);

				var oInput = this.getView().byId("POInput");
				var fnAfterClose = function (oEvt) {
					jQuery.sap.delayedCall(200, this, function () {
						oInput.focus();
						oInput.selectText(0, 99);
					});
					oEvt.getSource().detachAfterClose(fnAfterClose);
				};
				this._oPostDialog.attachAfterClose(fnAfterClose);

				this._oPostDialog.open();
			}
		},

		/**
		 * Fills data for the success post dialog model.
		 * @private
		 * @param {object} oData object from backend entity
		 * @param {object} oPostDialogJson object of success dialog data model
		 */
		_createDataForDocuments: function (aHeader2Refs, oPostDialogJson) {
			// Split Success and Failed Documents
			var aSuccessDocuments = [],
				aFailedDocuments = [];
			for (var i = 0; i < aHeader2Refs.length; i++) {
				aHeader2Refs[i].CopilotActive = oPostDialogJson.CopilotActive;
				if (aHeader2Refs[i].DocCrtSuccess === "X") {
					// check link and copilot enablement for BAdI documents (enble the link only when all the fields are filled)
					aHeader2Refs[i].LinkActive = !!(this._isIntentSupported[aHeader2Refs[i].SemanticObject + "Display"] && aHeader2Refs[i].SemanticObject &&
						aHeader2Refs[i].SemanticAction && aHeader2Refs[i].SemanticParam);
					aHeader2Refs[i].CopilotEnabled = oPostDialogJson.CopilotEnabled && !!(aHeader2Refs[i].ServiceName && aHeader2Refs[i].NaviTarget &&
						aHeader2Refs[i].NaviPath);
					aSuccessDocuments.push(aHeader2Refs[i]);
				} else {
					aFailedDocuments.push(aHeader2Refs[i]);
				}
			}

			if (aFailedDocuments.length > 0) {
				oPostDialogJson.DialogState = "Warning";
				oPostDialogJson.DialogTitle = this.getResourceBundle().getText("TITLE_WARN_POST");
			}
			oPostDialogJson.SuccessMessageHeadline = this.getResourceBundle().getText("SUCC_POST_TEXT", aSuccessDocuments.length);
			oPostDialogJson.FailedMessageHeadline = this.getResourceBundle().getText("FAIL_POST_TEXT", aFailedDocuments.length);
			oPostDialogJson.FailedMessageHeadlineVisible = aFailedDocuments.length > 0;
			oPostDialogJson.SuccessDocuments = aSuccessDocuments; // Success Document
			oPostDialogJson.FailedDocuments = aFailedDocuments; // Failed Document
		},

		/**
		 * @function sets the value/state selection properties of all table items with issues after posting failure
		 * @param {array} aReturn Array of Document items with issue after posting
		 * @param {oFrontend} optional oFrontend model
		 * @param {oData} reference to ODATA response
		 */
		_SetStatus: function (aReturn, oFrontend, oData) {
			var oFrontendModel = {};

			if (!oFrontend) {
				oFrontendModel = this.getView().getModel("oFrontend");
			} else {
				oFrontendModel = oFrontend;
			}

			var aItems = oFrontendModel.getProperty("/Items");
			//var aItems = oFrontendModel.Items;

			for (var i = 0; i < aReturn.length; i++) {
				for (var y = 0; y < aItems.length; y++) {
					if (aReturn[i].DocumentItem == aItems[y].DocumentItem) {
						// Set the Item on inactive
						if (aReturn[i].valueState == "DocumentItem_valueState") {
							aItems[y].Selected = false;
							aItems[y].SelectEnabled = false;
							aItems[y].ItemEnabled = false;
							aItems[y].SplitEnabled = false;
						} else {
							// Set the Warning on Quntity and Unit 	
							aItems[y][aReturn[i].valueState] = sap.ui.core.ValueState.Warning;
							aItems[y][aReturn[i].valueStateText] = aReturn[i].MessageText;
							for (var z = 0; z < oData.Header2Items.results.length; z++) {
								if (aItems[y].DocumentItem == oData.Header2Items.results[z].DeliveryDocumentItem) {
									aItems[y].Unit = oData.Header2Items.results[z].UnitOfMeasure;
									aItems[y].OpenQuantity = oData.Header2Items.results[z].OpenQuantity;
									if (aItems[y].ItemCounter == 0) {
										aItems[y].DeliveredQuantity_input = oData.Header2Items.results[z].QuantityInEntryUnit;
									} else {
										aItems[y].DeliveredQuantity_input = 0;
									}
									aItems[y].DeliveredUnit_input = oData.Header2Items.results[z].EntryUnit;
								}
							}
						}
					}
				}
			}
			oFrontendModel.setProperty("/Items", aItems);
		},

		/**
		 * @function handler for close event after successfull post
		 * @param oEvent Event object supplied by UI
		 */
		handlePostCloseButton: function (oEvent) {
			//No Reference App && no initial item exist
			if (this._SourceOfGR === this._SourceOfGRIsNoReference && this.getView().getModel("oFrontend").getData().Items.length === 0) {
				this._getInitialItem(0);
			}
			var oHashChanger = sap.ui.core.routing.HashChanger.getInstance();
			oHashChanger.replaceHash(""); //clean up the app state of post dialog, when dialog is closed
			this._oPostDialog.close();
		},

		/**
		 * @function handler for navigation to created GR after successfull post
		 * @param oEvent Event object supplied by UI
		 */
		handleFactSheetLinkPress: function (oEvent) { //Navigation to MaterialDocument
			var aData = oEvent.getSource().getCustomData();
			var sSemanticObject = aData[0].getValue();
			var sAction = aData[1].getValue();
			var sParameters = aData[2].getValue();
			var oParams = {};
			if (sParameters) {
				var aPairs = sParameters.split('&');
				for (var i in aPairs) {
					var sParameter = aPairs[i].split('=');
					oParams[sParameter[0]] = sParameter[1];
				}
			}
			// remove the abort hash so that app state works
			this._removeAbortHashBeforeNavigation();
			// save Popover state
			var oState = this._getSuccessPostDialogState(this._oPostDialog.getModel().getData());
			this._oNavigationService.navigate(sSemanticObject, sAction, oParams, oState);
		},

		/**
		 * @function handler for navigation to Material FactSheet of table items/checks data loss
		 * @param oEvent Event object supplied by UI
		 */
		handleDisplayMaterialLinkPress: function (oEvent) {
			var sMaterial = oEvent.getSource().data("Material"); //store here to avoid side effect in eventing chain
			this._nav2Material(sMaterial);
		},

		/**
		 * @function handler for navigation to Supplier FactSheet of table header/checks data loss
		 * @param oEvent Event object supplied by UI
		 */
		handleDisplaySupplierLinkPress: function (oEvent) { //Navigation to Supplier
			var oFrontendModel = this.getView().getModel("oFrontend");
			this._nav2Supplier(oFrontendModel.getProperty("/Lifnr"));
		},

		/**
		 * @function handler for navigation to Purchase Order FactSheet of table header/checks data loss
		 * @param oEvent Event object supplied by UI
		 */
		handleDisplayPurchaseOrderLinkPress: function (oEvent) { //Navigation to PurchaseOrder
			var oFrontendModel = this.getView().getModel("oFrontend");
			this._nav2PurchaseOrderOrInboundDelivery(oFrontendModel.getProperty("/Ebeln"));
		},

		/**
		 * @function Barcode Scanner Button
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleScanSuccess: function (oEvent) {
			if (oEvent.getParameters().cancelled === false && oEvent.getParameters().text !== "" &&
				jQuery.isNumeric(oEvent.getParameters().text) === true) {
				var oPOInput = this.getView().byId("POInput");
				oPOInput.setValue(oEvent.getParameters().text);
				oPOInput.fireChangeEvent(oEvent.getParameters().text);
			}
		},

		/**
		 * @function handler for all input such as SuggestionsItemSelected and direct enter in Purchase Order field/checks data loss
		 * @param {sap.ui.base.Event} oEvent Event object supplied by UI
		 */
		handleInputChangeEvent: function (oEvent) { //used for paste into input field
			var sSelectedItemText = oEvent.getParameters().value.trim(); //Remove spaces of the imported string
			var that = this;
			var resourceBundle = that.getResourceBundle();
			var ChangeOK = true;
			var aMaxLength = this.getView().getModel("oFrontend").getProperty("/Ebeln_possibleLength");
			// Check data loss
			var sCurrentModel = JSON.stringify(this._getInnerAppState());
			if (sCurrentModel && this._initialDataLoaded && (this._initialDataLoaded != null)) {

				var sOldModel = JSON.stringify(this._getInnerAppState(this._initialDataLoaded));
				if (sOldModel !== sCurrentModel) {
					// Warning for Data Loss
					var ChangeOK = false;
					sap.m.MessageBox.confirm(resourceBundle.getText("MESSAGE_DATA_LOSS"), {
						icon: sap.m.MessageBox.Icon.QUESTION,
						title: resourceBundle.getText("MESSAGE_DATA_LOSS_TITLE"),
						onClose: fnCallbackConfirm,
						styleClass: "sapUiSizeCompact",
						initialFocus: sap.m.MessageBox.Action.CANCEL
					});
				}
			}

			if (ChangeOK === true) {

				if ((aMaxLength.indexOf(sSelectedItemText.length) !== -1 && jQuery.isNumeric(
						sSelectedItemText) === true) ||
					(this.getView().byId("POInput").getEditable() === false) //case direct navigation
				) {
					this._readPO(sSelectedItemText); //read data
				} else {
					this._toggleBusy(false);
					this.getView().byId("POInput").fireSuggest({
						suggestValue: sSelectedItemText
					}); //start suggestion
				}

				/*destroy old attachment service instance*/
				if (this.oCompAttachProj) {
					delete this.oCompAttachProj;
				}

			}
			//local callback
			function fnCallbackConfirm(bResult) {
				//		    if (bResult === true){
				if (bResult === "OK") {
					//	that._readPO(sSelectedItemText);
					if (that.oCompAttachProj) {
						delete that.oCompAttachProj;
					}
					// trigger reload
					if (aMaxLength.indexOf(sSelectedItemText.length) !== -1 && jQuery.isNumeric(
							sSelectedItemText) === true) {
						that._readPO(sSelectedItemText); //read data
					} else {
						that._toggleBusy(false);
						that.getView().byId("POInput").fireSuggest({
							suggestValue: sSelectedItemText
						}); //start suggestion
					}

				} else {
					var oPOInput = that.getView().byId("POInput");
					oPOInput.setValue(that._initialDataLoaded.Ebeln);
				}
			}
		},

		/**
		 * @function handler for all input such as SuggestionsItemSelected and direct enter in Purchase Order field/checks data loss
		 * @param {sap.ui.base.Event} oEvent Event object supplied by UI
		 */
		handleInputBatchChangeEvent: function (oEvent) { //used for paste into input field
			var sSelectedItemText = oEvent.getParameters().value.trim(); //Remove spaces of the imported string
			var that = this;
			var resourceBundle = that.getResourceBundle();
			var oItem;
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") { //S2
				oItem = this.getView().getModel("oItem").getData();
			} else {
				var oModel = this.getView().getModel("oFrontend");
				var sSelectedItem = this._getSelectedItemInModel(oEvent);
				oItem = oModel.getProperty("/Items/" + sSelectedItem);
			}
			this._readBatch(sSelectedItemText, sSelectedItem, oItem); //read data
		},

		_readBatch: function (sBatchNumber, sSelectedTableIndex, oItem) {
			var aFilters = [];
			var sMovementType = "";
			if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
				aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, oItem.Material));
			} else {
				aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, oItem.Material_Input));
			}
			aFilters.push(new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, oItem.Plant));
			aFilters.push(new sap.ui.model.Filter("StorageLocation", sap.ui.model.FilterOperator.EQ, oItem.StorageLocation));
			aFilters.push(new sap.ui.model.Filter("DeliveryDocumentItem", sap.ui.model.FilterOperator.EQ, oItem.DocumentItem));
			aFilters.push(new sap.ui.model.Filter("Batch", sap.ui.model.FilterOperator.EQ, oItem.Batch));
			aFilters.push(new sap.ui.model.Filter("InboundDelivery", sap.ui.model.FilterOperator.EQ, this.getView().getModel("oFrontend").getProperty(
				"/Ebeln")));
			aFilters.push(new sap.ui.model.Filter("SourceOfGR", sap.ui.model.FilterOperator.EQ, this._SourceOfGR));
			var sMyMovemenType = this._getMovementType(oItem);
			aFilters.push(new sap.ui.model.Filter("GoodsMovementType", sap.ui.model.FilterOperator.EQ, sMyMovemenType));
			this.getView().getModel("oData").read("/MaterialBatchHelps", {
				filters: aFilters,
				success: jQuery.proxy(this._successMyBatchLoad, this, sBatchNumber, sSelectedTableIndex, oItem),
				error: jQuery.proxy(this._handleOdataError, this)
			});

		},

		/**
		 * @function navigates to Material FactSheet
		 * @param {string}  sMaterial key for navigation
		 */
		_nav2Material: function (sMaterial) {
			var oParams = {
				Material: sMaterial
			};
			//Clear browserhash
			var oHashChanger = sap.ui.core.routing.HashChanger.getInstance();
			oHashChanger.setHash("");
			this._oNavigationService.navigate("Material", "displayFactSheet", oParams, this._getInnerAppState());
		},
		/**
		 * @function navigates to Supplier FactSheet
		 * @param {string}  sLifnr key for navigation
		 */
		_nav2Supplier: function (sLifnr) {
			var oParams = {
				Supplier: sLifnr
			};
			//Clear browserhash
			var oHashChanger = sap.ui.core.routing.HashChanger.getInstance();
			oHashChanger.setHash("");
			this._oNavigationService.navigate("Supplier", "displayFactSheet", oParams, this._getInnerAppState());
		},

		/**
		 * @function navigates to PurchaseOrder/InboundDelivery FactSheet
		 * @param {string}  sEbeln key for navigation
		 */
		_nav2PurchaseOrderOrInboundDelivery: function (sEbeln) {

			var sSemanticObject = "";
			var oParams = {};
			if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
				sSemanticObject = "PurchaseOrder";
				oParams = {
					PurchaseOrder: sEbeln
				};
			} else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) { //Production Order
				sSemanticObject = "ProductionOrder";
				oParams = {
					ProductionOrder: sEbeln
				};
			} else {
				sSemanticObject = "InboundDelivery";
				oParams = {
					InboundDelivery: sEbeln
				};
			}
			//Clear browserhash
			var oHashChanger = sap.ui.core.routing.HashChanger.getInstance();
			oHashChanger.setHash("");
			this._oNavigationService.navigate(sSemanticObject, "displayFactSheet", oParams, this._getInnerAppState());
		},

		/**
		 * @function reads Purchase Order from backend and creates new oFrontend model with read data/resets filters/sorting/sets App Footer/Header
		 * @param {string}  sPOnumber key of Purchase Order
		 * @param {object}  oAppState optional may contain appstate when navigating back
		 */
		_readPO: function (sPOnumber, oAppState) {
			var that = this;
			var aFilters = [];
			if (sPOnumber) {
				if (sap.ui.getCore().getMessageManager().getMessageModel().getData().length > 0) {
					sap.ui.getCore().getMessageManager().removeAllMessages();
				}
				if (this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
					if (sPOnumber.length === 9) {
						sPOnumber = "000" + sPOnumber;
					} else {
						sPOnumber = "00" + sPOnumber;
					}
				}
				if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
					sPOnumber = "00" + sPOnumber;
				}

				aFilters.push(new sap.ui.model.Filter("SourceOfGR", sap.ui.model.FilterOperator.EQ, this._SourceOfGR));
				aFilters.push(new sap.ui.model.Filter("InboundDelivery", sap.ui.model.FilterOperator.EQ, sPOnumber));
				this._toggleBusy(true);
				this.getOwnerComponent().getModel("oData").read("/GR4PO_DL_Headers", {
					urlParameters: {
						$expand: "Header2Items,Header2Items/Item2StockTypes,Header2Items/Item2SubItems"
					},
					filters: aFilters,
					success: jQuery.proxy(this._successPOLoad, this, oAppState),
					error: jQuery.proxy(this._handleOdataError, this)
				});

				/*				this.getOwnerComponent().getModel("oData").read("/GR4PO_DL_Headers", {
									urlParameters: {
										$expand: "Header2Items,Header2Items/Item2StockTypes"
									},
									filters: aFilters,
									success: jQuery.proxy(this._successPOLoad, this, oAppState),
									error: jQuery.proxy(this._handleOdataError, this)
								});*/
			} //selected item
		},

		/**
		 * @function called after successful load of the Batch 
		 * @param {Object} oData result set of the request
		 * @param {Object} oAppState Appstate when navigating back 
		 * @param {Object} oResponse response of the request
		 */
		_successMyBatchLoad: function (sBatchNumber, sSelectedTableIndex, oAppState, oData, oResponse) {
			var bAbort = false;
			var oHeader = oResponse.headers["sap-message"];
			var bSelectEnabled;
			if (oHeader) {
				var oJson = JSON.parse(oHeader);
				if (oJson.code && oJson.severity === "error") {
					bAbort = true;
				}
			}
			//Nothing selected
			if (oData.results.length !== 1 || sBatchNumber === "") {
				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") { //S2
					this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate", "");
					this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None);
					this.getView().getModel("oItem").setProperty("/ManufactureDate", "");
					this.getView().getModel("oItem").setProperty("/ManufactureDate_valueState", sap.ui.core.ValueState.None);
					this.getView().getModel("oItem").setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(this.getView().getModel("oItem").getData()));
					if (bAbort === true && sBatchNumber !== "") {
						this.getView().getModel("oItem").setProperty("/Batch_valueState", sap.ui.core.ValueState.Error);
					} else {
						this.getView().getModel("oItem").setProperty("/Batch_valueState", sap.ui.core.ValueState.None);
					};
					this._setValueStateMandatoryFields(this.getView().getModel("oItem").getData());
					this.getView().getModel("oItem").updateBindings();
					bSelectEnabled = this._ItemConsistent(this.getView().getModel("oItem").getData());
					if (bSelectEnabled === true) {
						this.getView().getModel("oItem").setProperty("/SelectEnabled", bSelectEnabled);
						this.getView().getModel("oItem").setProperty("/Selected", bSelectEnabled);
					}
				} else { //S1
					var oModel = this.getView().getModel("oFrontend");
					oModel.setProperty("/Items/" + sSelectedTableIndex + "/ShelfLifeExpirationDate", "");
					oModel.setProperty("/Items/" + sSelectedTableIndex + "/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None);
					oModel.setProperty("/Items/" + sSelectedTableIndex + "/ManufactureDate", "");
					oModel.setProperty("/Items/" + sSelectedTableIndex + "/ManufactureDate_valueState", sap.ui.core.ValueState.None);
					if (bAbort === true && sBatchNumber !== "") {
						oModel.setProperty("/Items/" + sSelectedTableIndex + "/Batch_valueState", sap.ui.core.ValueState.Error);
					} else {
						oModel.setProperty("/Items/" + sSelectedTableIndex + "/Batch_valueState", sap.ui.core.ValueState.None);
					};
					this._setValueStateMandatoryFields(oModel.getProperty("/Items/" + sSelectedTableIndex));
					bSelectEnabled = this._ItemConsistent(oModel.getProperty("/Items/" + sSelectedTableIndex));
					if (bSelectEnabled === true) {
						oModel.setProperty("/Items/" + sSelectedTableIndex + "/SelectEnabled", bSelectEnabled);
						oModel.setProperty("/Items/" + sSelectedTableIndex + "/Selected", bSelectEnabled);
					}
					this._setSelectEnabled(oModel.getProperty("/Items/" + sSelectedTableIndex));
					this._controlSelectAllAndPostButton(); //update buttons
					this._updateHiglightProperty(); //update highlight
				}

				bAbort = true;
			} else {
				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") { //S2
					this.getView().getModel("oItem").setProperty("/Batch", oData.results[0].Batch);
					this.getView().getModel("oItem").setProperty("/Batch_valueState", sap.ui.core.ValueState.None);
					this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate", this._oDateFormat.format(oData.results[0].ShelfLifeExpirationDate));
					this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None);
					this.getView().getModel("oItem").setProperty("/ManufactureDate", this._oDateFormat.format(oData.results[0].ManufactureDate));
					this.getView().getModel("oItem").setProperty("/ManufactureDate_valueState", sap.ui.core.ValueState.None);
					this.getView().getModel("oItem").setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(this.getView().getModel("oItem").getData()));
					this._setValueStateMandatoryFields(this.getView().getModel("oItem").getData());
					this.getView().getModel("oItem").updateBindings();
					bSelectEnabled = this._ItemConsistent(this.getView().getModel("oItem").getData());
					if (bSelectEnabled === true) {
						this.getView().getModel("oItem").setProperty("/SelectEnabled", bSelectEnabled);
						this.getView().getModel("oItem").setProperty("/Selected", bSelectEnabled);
					}
				} else { //S1
					var oModel = this.getView().getModel("oFrontend");
					oModel.setProperty("/Items/" + sSelectedTableIndex + "/Batch", oData.results[0].Batch);
					oModel.setProperty("/Items/" + sSelectedTableIndex + "/Batch_valueState", sap.ui.core.ValueState.None);
					oModel.setProperty("/Items/" + sSelectedTableIndex + "/ShelfLifeExpirationDate", this._oDateFormat.format(oData.results[0]
						.ShelfLifeExpirationDate));
					oModel.setProperty("/Items/" + sSelectedTableIndex + "/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None);
					oModel.setProperty("/Items/" + sSelectedTableIndex + "/ManufactureDate", this._oDateFormat.format(oData.results[0].ManufactureDate));
					oModel.setProperty("/Items/" + sSelectedTableIndex + "/ManufactureDate_valueState", sap.ui.core.ValueState.None);
					this._setValueStateMandatoryFields(oModel.getProperty("/Items/" + sSelectedTableIndex));
					bSelectEnabled = this._ItemConsistent(oModel.getProperty("/Items/" + sSelectedTableIndex));
					if (bSelectEnabled === true) {
						oModel.setProperty("/Items/" + sSelectedTableIndex + "/SelectEnabled", bSelectEnabled);
						oModel.setProperty("/Items/" + sSelectedTableIndex + "/Selected", bSelectEnabled);
					}
					this._setSelectEnabled(oModel.getProperty("/Items/" + sSelectedTableIndex));
					this._controlSelectAllAndPostButton(); //update buttons
					this._updateHiglightProperty(); //update highlight
				}
				return;
			}
		},

		/**
		 * @function called after successful load of the PO
		 * @param {Object} oData result set of the request
		 * @param {Object} oAppState Appstate when navigating back 
		 * @param {Object} oResponse response of the request
		 */
		_successPOLoad: function (oAppState, oData, oResponse) {
			// Check header for backend system errors
			var bAbort = false;
			var oAccountAssignmentReference;
			var sOldDocumentItemNumber = ""; // used to detect if new document item is processed
			var oHeader = oResponse.headers["sap-message"];
			if (oHeader) {
				var oJson = JSON.parse(oHeader);
				if (oJson.code && oJson.severity === "error") {
					bAbort = true;
				}
			}
			//Nothing selected
			if (oData.results.length === 0) {
				bAbort = true;
			}
			var oModel = this.getView().getModel("oFrontend");
			if (bAbort !== false) {
				oModel.setProperty("/PO_Input_valueState", sap.ui.core.ValueState.Error);
			} else { //no error --> continue
				var bStockTypeCustomizingError = false; //true, if no stock type selection is possible
				oModel.setProperty("/PO_Input_valueState", sap.ui.core.ValueState.None);
				//Document header
				var sJson = {};
				sJson.maxFractionDigits = "3";
				sJson.visible = true; //table and header become visible
				sJson.personalizationEnabled = true; // used to control personalisation during posting
				sJson.SupplierDisplayActive = this._isIntentSupported.SupplierDisplay;
				if (oData.results[0].PurchasingDocumentCategory === 'L') { //Scheduling Agreement
					sJson.PurchaseOrderDisplayActive = false;
				} else {
					sJson.PurchaseOrderDisplayActive = this._isIntentSupported.PurchaseOrderDisplay;
				}
				sJson.CreateBatchActive = this._isIntentSupported.BatchCreate;
				sJson.MaterialDisplayActive = this._isIntentSupported.MaterialDisplay;
				sJson.VersionForPrintingSlip = this._aVersionForPrintingSlip;
				sJson.VersionForPrintingSlipAppSetting = this._aVersionForPrintingSlipAppSetting;
				if (this._oPersonalizedDataContainer.VersionForPrintingSlip !== "none") {
					sJson.VersionForPrintingSlip_selectedKey = this._oPersonalizedDataContainer.VersionForPrintingSlip; //2785669					
				} else if (oData.results[0].VersionForPrintingSlip) { // check odata cloud BAdI
					sJson.VersionForPrintingSlip_selectedKey = oData.results[0].VersionForPrintingSlip; //"value from cloud BAdI";
				} else {
					sJson.VersionForPrintingSlip_selectedKey = "0";
				}
				//sJson.VersionForPrintingSlip_selectedKey = this._oPersonalizedDataContainer.VersionForPrintingSlip; //2785669
				sJson.Lifname = oData.results[0].VendorName;
				sJson.Lifnr = oData.results[0].Vendor;
				sJson.Ebeln = oData.results[0].InboundDelivery;
				//sJson.DocumentDate = this._oDateFormat.format(new Date());
				sJson.DocumentDate = oData.results[0].DocumentDate;
				//sJson.PostingDate = this._oDateFormat.format(new Date());
				sJson.PostingDate = oData.results[0].PostingDate;
				sJson.DocumentDate_valueState = sap.ui.core.ValueState.None;
				sJson.PostingDate_valueState = sap.ui.core.ValueState.None;
				sJson.DeliveryDocumentByVendor = "";
				sJson.MaterialDocumentHeaderText = oData.results[0].MaterialDocumentHeaderText;
				sJson.BillOfLading = "";
				sJson.PurchasingDocumentType = oData.results[0].PurchasingDocumentType;
				sJson.PurchasingDocumentTypeName = oData.results[0].PurchasingDocumentTypeName;
				sJson.SupplyingPlant = oData.results[0].SupplyingPlant;
				sJson.SupplyingPlantName = oData.results[0].SupplyingPlantName;
				sJson.OrderType = oData.results[0].OrderType;
				sJson.OrderTypeName = oData.results[0].OrderTypeName;
				//deal with columen visibility  set to false initially an true further down
				sJson.ColumnAccountAssignmentVisible = false;
				sJson.ColumnSplitVisible = false;
				sJson.ColumnPlantVisible = false;
				sJson.ColumnStorageBinVisible = false;
				sJson.ColumnStorageLocationVisible = false;
				sJson.ColumnStockTypeVisible = false;
				sJson.ColumnBatchVisible = false;
				sJson.ColumnManufactureDateVisible = false;
				sJson.ColumnShelfLifeExpirationDateVisible = false;
				// Start Scale changes
				sJson.ColumnScaleVisible = false;
				// End scale chnages
				// sJson.ColumnManufactureDateEnabled = false;
				// sJson.ColumnManufactureDateMandatory = false;
				// sJson.ColumnShelfLifeExpirationDateEnabled = false;
				// sJson.ColumnShelfLifeExpirationDateMandatory = false;
				sJson.ColumnNonVltdGRBlockedStockQty = false;
				sJson.ColumnIsReturnsItemVisible = false;
				sJson.HasSubcontractingItem = false; // determins the visiblity of column
				sJson.Items = [];
				if (sJson.DocumentDate == null) {
					sJson.DocumentDate = this._oDateFormat.format(new Date());
				} else {
					sJson.DocumentDate = this._oDateFormat.format(sJson.DocumentDate);
				}
				if (sJson.PostingDate == null) {
					sJson.PostingDate = this._oDateFormat.format(new Date());
				} else {
					sJson.PostingDate = this._oDateFormat.format(sJson.PostingDate);
				}
				for (var i = 0; i < oData.results[0].Header2Items.results.length; i++) {
					if (sOldDocumentItemNumber !== oData.results[0].Header2Items.results[i].DeliveryDocumentItem) { //detect new document item
						sOldDocumentItemNumber = oData.results[0].Header2Items.results[i].DeliveryDocumentItem;
						var oUnit_input = [];
						oUnit_input[0] = {};
						var oItem = {};
						oItem.highlight = sap.ui.core.MessageType.None; //Controls highlight property of ListItem
						oItem.ItemCounter = 0; //internal counter used during split
						oItem.Selected = false; // Model of select Checkbox
						if (oData.results[0].Header2Items.results[i].OpenQuantity >= 0) {
							oItem.SelectEnabled = true;
						} else {
							oItem.SelectEnabled = false;
						}
						oItem.OpenQuantity_valueState = sap.ui.core.ValueState.None;
						oItem.OpenQuantity_valueStateText = "";
						oItem.SplitEnabled = oData.results[0].Header2Items.results[i].IsBatchManaged;
						oItem.DocumentItem = oData.results[0].Header2Items.results[i].DeliveryDocumentItem;
						oItem.DocumentItem_int = parseInt(oData.results[0].Header2Items.results[i].DeliveryDocumentItem); //required for sorting
						oItem.Material = oData.results[0].Header2Items.results[i].Material;
						oItem.MaterialName = oData.results[0].Header2Items.results[i].MaterialName;
						oItem.DocumentItemText = oData.results[0].Header2Items.results[i].DocumentItemText;
						oItem.PurchaseOrderItemText = oData.results[0].Header2Items.results[i].PurchaseOrderItemText;

						// TODO: get storage bin from backend
						oItem.WarehouseStorageBin = oData.results[0].Header2Items.results[i].WarehouseStorageBin;
						if (oItem.WarehouseStorageBin) {
							sJson.ColumnStorageBinVisible = true;
						}

						if (oItem.PurchaseOrderItemText !== "") { //DocumentItemText of PO is used if filled
							oItem.MaterialText = oItem.PurchaseOrderItemText;
						} else { // Material short text is used
							oItem.MaterialText = oItem.MaterialName;
						}
						if (this._SourceOfGR === this._SourceOfGRIsProductionOrder && sJson.Objectheader !== oData.results[0].Header2Items.results[0]
							.Material) {
							sJson.Objectheader = oItem.MaterialText;
							sJson.Objectheadertext = oItem.Material;
						} //Production Order
						if (this._oPersonalizedDataContainer.PresetDocumentItemTextFromPO === true) {
							oItem.DocumentItemText = oItem.PurchaseOrderItemText;
						}
						if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
							oItem.DeliveredQuantityEditable = true;
							oItem.DeliveredUnitEditable = true;
							oItem.StockTypeNOREFEnabled = true;
						}
						oItem.Unit = oData.results[0].Header2Items.results[i].UnitOfMeasure;
						oItem.OpenQuantity = oData.results[0].Header2Items.results[i].OpenQuantity;
						oItem.OpenQuantityIgnore = oData.results[0].Header2Items.results[i].OpenQtyIgnore;
						oItem.OpenQuantity_number = parseFloat(oData.results[0].Header2Items.results[i].OpenQuantity); //needed internally for sorting
						oItem.GoodsReceiptQty = oData.results[0].Header2Items.results[i].GoodsReceiptQty;
						oItem.GoodsReceiptQty_number = parseFloat(oData.results[0].Header2Items.results[i].GoodsReceiptQty);
						oItem.OrderedQuantity = oData.results[0].Header2Items.results[i].OrderedQuantity;
						oItem.OrderedQuantity_number = parseFloat(oData.results[0].Header2Items.results[i].OrderedQuantity);
						if (oData.results[0].PurchasingDocumentCategory === 'L') { //Scheduling Agreement
							oItem.ChartVisible = false;
							oItem.GRQuantity = oItem.GoodsReceiptQty;
							oItem.GRQuantity_number = oItem.GoodsReceiptQty_number;
						} else {
							oItem.ChartVisible = true;
							oItem.GRQuantity = oItem.OrderedQuantity - oItem.OpenQuantity;
							oItem.GRQuantity_number = oItem.OrderedQuantity_number - oItem.OpenQuantity_number;
						}
						oItem.OrderedQuantityUnit = oData.results[0].Header2Items.results[i].OrderedQuantityUnit;
						oItem.NonVltdGRBlockedStockQty = oData.results[0].Header2Items.results[i].NonVltdGRBlockedStockQty;
						oItem.NonVltdGRBlockedStockQty_number = parseFloat(oData.results[0].Header2Items.results[i].NonVltdGRBlockedStockQty);
						if (oItem.NonVltdGRBlockedStockQty_number > 0) {
							sJson.ColumnNonVltdGRBlockedStockQty = true;
						}
						if (oData.results[0].Header2Items.results[i].DeliveryCompleted === "") {
							oItem.DeliveryCompleted = false; //normal case
						} else {
							oItem.DeliveryCompleted = true; //should not happen due to backed filtering
						}
						// Setting item to enabled 
						if (oItem.OpenQuantityIgnore || (parseFloat(oItem.OpenQuantity) > 0) || (parseFloat(oItem.NonVltdGRBlockedStockQty))) {
							//if ((parseFloat(oItem.NonVltdGRBlockedStockQty))) {
							oItem.ItemEnabled = true;
							oItem.MaterialVisible = true;
							oItem.DeliveredQuantityEditable = oItem.OpenQuantityIgnore ? false : oItem.DeliveredQuantityEditable;
							oItem.DeliveredUnitEditable = oItem.OpenQuantityIgnore ? false : oItem.DeliveredUnitEditable;
							oItem.SplitEnabled = oItem.OpenQuantityIgnore ? false : oData.results[0].Header2Items.results[i].IsBatchManaged;
						} else {
							oItem.ItemEnabled = false;
							oItem.SplitEnabled = oData.results[0].Header2Items.results[i].IsBatchManaged; //splitt button
							oItem.MaterialVisible = true;
						}

						oItem.SplitButtonIcon = "sap-icon://add";
						// oItem.SplitButtonText = "Split Item";
						if (this._oPersonalizedDataContainer.deliveredQuantityDefault2open === true) {
							oItem.DeliveredQuantity_input = parseFloat(oData.results[0].Header2Items.results[i].QuantityInEntryUnit);
						} else {
							oItem.DeliveredQuantity_input = ""; //parseFloat("0.00");
						}
						oItem.DeliveredQuantity_valueState = sap.ui.core.ValueState.None;
						oItem.DeliveredQuantity_valueStateText = "";
						//add the additional AUoM to the array of select field
						oItem.DeliveredUnit_input = oData.results[0].Header2Items.results[i].EntryUnit;
						oItem.DeliveredUnit_input_valueState = sap.ui.core.ValueState.None;
						oItem.DeliveredUnit_input_valueStateText = "";
						//plant
						if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
							oItem.Plant_input = oData.results[0].Header2Items.results[i].PlannedPlantName;
							oItem.Plant = oData.results[0].Header2Items.results[i].PlannedPlant;
							oItem.LABEL_STACKED_BAR = this.getResourceBundle().getText("LABEL_STACKED_BAR_PROD");
						} else {
							oItem.Plant_input = oData.results[0].Header2Items.results[i].PlantName;
							oItem.Plant = oData.results[0].Header2Items.results[i].Plant;
							if (this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
								oItem.LABEL_STACKED_BAR = this.getResourceBundle().getText("LABEL_STACKED_BAR_INBD");
							} else {
								oItem.LABEL_STACKED_BAR = this.getResourceBundle().getText("LABEL_STACKED_BAR_PO");
							}
						}
						// Start Scale changes
						if (this._SourceOfGR === this._SourceOfGRIsProductionOrder && oItem.Plant === "A600") {
							sJson.ColumnScaleVisible = true;
						}
						// End scale chnages
						oItem.Country = oData.results[0].Header2Items.results[i].Country;
						oItem.WMLInScope = oData.results[0].Header2Items.results[i].WMLInScope;
						//Batch
						oItem.Batch = oData.results[0].Header2Items.results[i].Batch;
						oItem.SupplierBatch = oData.results[0].Header2Items.results[i].SupplierBatch;
						oItem.ShelfLifeExpirationDate = oData.results[0].Header2Items.results[i].ShelfLifeExpirationDate;
						oItem.ManufactureDate = oData.results[0].Header2Items.results[i].ManufactureDate;
						// Delivey Return Item
						oItem.IsReturnsItem = oData.results[0].Header2Items.results[i].IsReturnsItem;
						if (oItem.IsReturnsItem === true) {
							sJson.ColumnIsReturnsItemVisible = true;
						}
						//assignment category
						oItem.IsConsumptionMovement = oData.results[0].Header2Items.results[i].IsConsumptionMovement;
						oItem.AcctAssignmentCategory = oData.results[0].Header2Items.results[i].AcctAssignmentCategory;
						oItem.AcctAssignmentCategoryName = oData.results[0].Header2Items.results[i].AcctAssignmentCategoryName;
						oItem.HasMultipleAccountAssignment = oData.results[0].Header2Items.results[i].HasMultipleAccountAssignment;
						oItem.MultipleAcctAssgmtDistribution = oData.results[0].Header2Items.results[i].MultipleAcctAssgmtDistribution;
						oItem.MultipleAcctAssgmtDistrName = oData.results[0].Header2Items.results[i].MultipleAcctAssgmtDistrName;
						oItem.PartialInvoiceDistribution = oData.results[0].Header2Items.results[i].PartialInvoiceDistribution;
						oItem.PartialInvoiceDistributionName = oData.results[0].Header2Items.results[i].PartialInvoiceDistributionName;
						if (oItem.IsConsumptionMovement === false) { // normal material
							oItem.AccountAssignmentVisible = false;
							oItem.PlantVisible = true;
							oItem.StorageLocationVisible = true;
							oItem.StockTypeVisible = true;
							//columns must become visible
							sJson.ColumnSplitVisible = true;
							sJson.ColumnPlantVisible = true;
							sJson.ColumnStorageLocationVisible = true;
							sJson.ColumnStockTypeVisible = true;
						} else { // Project Stock
							oItem.SplitEnabled = false; //never split 
							oItem.PlantVisible = false;
							oItem.StorageLocationVisible = false;
							oItem.StockTypeVisible = false;
						} //check account assignment category

						// Account Assignment Column control
						if (oItem.AcctAssignmentCategory !== '') {
							// columns must become visible
							sJson.ColumnAccountAssignmentVisible = true;
							oItem.AccountAssignmentVisible = true;
							if (oData.results[0].Header2Items.results[i].GoodsReceiptIsNonValuated === true) {
								oItem.AccountAssignmentChartVisible = false;
								oItem.MultipleAcctAssignmentNoValuated = this.getResourceBundle().getText("TEXT_MAA_NOVALUATED");
							} else {
								oItem.AccountAssignmentChartVisible = true;
							}
						}

						// moved due to multi account assignment
						oItem.Project = oData.results[0].Header2Items.results[i].Project;
						oItem.ProjectDescription = oData.results[0].Header2Items.results[i].ProjectDescription;

						//Special Stock types for GR
						oItem.InventorySpecialStockType = oData.results[0].Header2Items.results[i].InventorySpecialStockType;
						oItem.InventorySpecialStockTypeName = oData.results[0].Header2Items.results[i].InventorySpecialStockTypeName;
						oItem.Lifname = oData.results[0].VendorName;
						oItem.Lifnr = oData.results[0].Vendor;
						oItem.SalesOrder = oData.results[0].Header2Items.results[i].SalesOrder;
						oItem.SalesOrderItem = oData.results[0].Header2Items.results[i].SalesOrderItem;
						oItem.OrderID = oData.results[0].Header2Items.results[i].OrderID;

						//storage location after account assingment since it is needed below
						oItem.StorageLocation = oData.results[0].Header2Items.results[i].StorageLocation;
						oItem.StorageLocation_input = oData.results[0].Header2Items.results[i].StorageLocationName;
						oItem.GoodsMovementReasonCode_selectedKey = oData.results[0].Header2Items.results[i].GoodsMovementReasonCode;

						if (oItem.AcctAssignmentCategory === "") { //Normal Material 
							if (oItem.StorageLocation === "" && oItem.DeliveredQuantity_input > 0) {
								oItem.StorageLocation_valueState = sap.ui.core.ValueState.Error;
								oItem.highlight = sap.ui.core.MessageType.Error;
								oItem.StorageLocation_valueStateText = this.getResourceBundle().getText("STORAGELOCATION_VALUE_STATE_TEXT");
							} else {
								oItem.StorageLocation_valueState = sap.ui.core.ValueState.None;
								oItem.StorageLocation_valueStateText = "";
							}
						} else { //Project stock is ok to have no storage location
							oItem.StorageLocation_valueState = sap.ui.core.ValueState.None;
							oItem.StorageLocation_valueStateText = "";
						}
						//Storage Location is editable if Purchase Order or Delivery has not Storage location
						if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
							oItem.StorageLocationEditable = true;
							oItem.Plant_input_editable = false;
							oItem.SalesOrder_editable = false;
						} else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) { //Production Order//  
							oItem.StorageLocationEditable = true;
							oItem.Plant_input_editable = false;
							oItem.SalesOrder_editable = false;
						} else if (this._SourceOfGR === this._SourceOfGRIsNoReference) { //No Reference//  
							oItem.StorageLocationEditable = true;
							oItem.Plant_input_editable = false;
							oItem.SalesOrder_editable = false;
						} else {
							oItem.Plant_input_editable = false;
							oItem.SalesOrder_editable = false;
							if (oItem.StorageLocation === "") {
								oItem.StorageLocationEditable = true;
							} else {
								oItem.StorageLocationEditable = false;
							}
						}

						//ShelfLifeExpirationDate
						if (oData.results[0].Header2Items.results[i].ShelfLifeExpirationDate) {
							oItem.ShelfLifeExpirationDate = this._oDateFormat.format(oData.results[0].Header2Items.results[i].ShelfLifeExpirationDate);
						} else {
							oItem.ShelfLifeExpirationDate = "";
						}
						oItem.ShelfLifeExpirationDateMinDate = new Date(); //Propery of control Datepicker
						if (oData.results[0].Header2Items.results[i].ManufactureDate) {
							oItem.ManufactureDate = this._oDateFormat.format(oData.results[0].Header2Items.results[i].ManufactureDate);
						} else {
							oItem.ManufactureDate = "";
						}
						// add stock types as array to select field on screen
						var oStockType_input = new Array(); //Array for select box
						var bSelectedStockTypeInList = false; //indicates that pre-selected stock type is allowed
						for (var j = 0; j < oData.results[0].Header2Items.results[i].Item2StockTypes.results.length; j++) {
							if (oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].StockType === "") {
								oStockType_input.push({
									key: " ",
									text: oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].StockTypeName,
									ControlOfBatchTableField: oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].ControlOfBatchTableField,
									ControlOfReasonCodeTableField: oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].ControlOfReasonCodeTableField,
									ControlOfExpirationDate: oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].ControlOfExpirationDate,
									ControlOfManufactureDate: oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].ControlOfManufactureDate,
									StorLocAutoCreationIsAllowed: oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].StorLocAutoCreationIsAllowed
								});
							} else {
								oStockType_input.push({
									key: oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].StockType,
									text: oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].StockTypeName,
									ControlOfBatchTableField: oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].ControlOfBatchTableField,
									ControlOfReasonCodeTableField: oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].ControlOfReasonCodeTableField,
									ControlOfExpirationDate: oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].ControlOfExpirationDate,
									ControlOfManufactureDate: oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].ControlOfManufactureDate,
									StorLocAutoCreationIsAllowed: oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].StorLocAutoCreationIsAllowed
								});
							}
							if (oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].StockType === oData.results[0].Header2Items.results[
									i]
								.StockType) {
								bSelectedStockTypeInList = true;
								//set batch layout if selected_key is in list
								this._evaluateFieldControl("Batch", oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].ControlOfBatchTableField,
									oItem);
								// set reason code layout if selected key is in list
								this._evaluateFieldControl("GoodsMovementReasonCode", oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].ControlOfReasonCodeTableField,
									oItem);
								//Shelf Life 
								this._evaluateFieldControl("ShelfLifeExpirationDate", oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].ControlOfExpirationDate,
									oItem);
								this._evaluateFieldControl("ManufactureDate", oData.results[0].Header2Items.results[i].Item2StockTypes.results[j].ControlOfManufactureDate,
									oItem);
							}
						} //end for stock types
						oItem.StockType_input = oStockType_input;
						if (oData.results[0].Header2Items.results[i].StockTypeName !== "" && bSelectedStockTypeInList === true) { //StockType from PO allowed --> set selected
							oItem.StockType_selectedKey = oData.results[0].Header2Items.results[i].StockType;
							if (oItem.StockType_selectedKey === "") {
								oItem.StockType_selectedKey = " ";
							}
						} else { //-> use first, if possible
							if (oStockType_input.length > 0) {
								oItem.StockType_selectedKey = oStockType_input[0].key;
								//set batch layout if selected key is not in list
								this._evaluateFieldControl("Batch", oStockType_input[0].ControlOfBatchTableField, oItem);
								//set GoodsMovementReasonCode layout if selected key is not in list
								this._evaluateFieldControl("GoodsMovementReasonCode", oStockType_input[0].ControlOfReasonCodeTableField, oItem);
								//Shelf Life 
								this._evaluateFieldControl("ShelfLifeExpirationDate", oStockType_input[0].ControlOfExpirationDate, oItem);
								this._evaluateFieldControl("ManufactureDate", oStockType_input[0].ControlOfManufactureDate, oItem);
							} else {
								oItem.StockType_selectedKey = " ";
								bStockTypeCustomizingError = true;
							}

						}
						//Stock Types Enabled if > 0
						if (oItem.StockType_input.length > 1) {
							oItem.StockTypeEnabled = true;
						} else {
							oItem.StockTypeEnabled = false;
						}
						//check for Batch Column Visibility
						if (oItem.BatchVisible === true) {
							sJson.ColumnBatchVisible = true;
						}
						//Shelf Life
						if (oItem.ManufactureDateVisible === true) {
							sJson.ColumnManufactureDateVisible = true;
						}
						if (oItem.ShelfLifeExpirationDateVisible === true) {
							sJson.ColumnShelfLifeExpirationDateVisible = true;
						}
						this._setValueStateMandatoryFields(oItem);

						//Text for Detail header			 
						//oItem.DetailHeaderText = (resourceBundle.getText("DETAILSCREEN_TITLE") + " " + oItem.DocumentItem.replace(/^0+/, ''));
						oItem.DetailHeaderText = (this.getResourceBundle().getText("DETAILSCREEN_TITLE2") + " " + oItem.MaterialName +
							" (" + oItem.Material + ")");
						//Extension fields per item 
						if (this._aExtendedFields && this._aExtendedFields.length > 0) { //extended fields --> transfer
							for (var k = 0; k < this._aExtendedFields.length; k++) {
								if (this._isExtendedField(this._aExtendedFields[k].name) === true) {
									oItem[this._aExtendedFields[k].name] = oData.results[0].Header2Items.results[i][this._aExtendedFields[k].name];
								}
							}
						}
						//Account Assignment Preparation
						oItem.AccountAssignments = [];
						oItem.AccountAssignmentsColumnAssetNumberVisible = false;
						oItem.AccountAssignmentsColumnSubAssetNumberVisible = false;
						oItem.AccountAssignmentsColumnGLAccountVisible = false;
						oItem.AccountAssignmentsColumnGoodsRecipientVisible = false;
						oItem.AccountAssignmentsColumnUnloadingPointVisible = false;
						oItem.AccountAssignmentsColumnFunctionalAreaVisible = false;
						oItem.AccountAssignmentsColumnProfitCenterVisible = false;
						oItem.AccountAssignmentsColumnCostCenterVisible = false;
						oItem.AccountAssignmentsColumnProjectVisible = false;
						oItem.AccountAssignmentsColumnSalesOrderVisible = false;
						oItem.AccountAssignmentsColumnOrderIDVisible = false;

						// handling for subcontracting components
						if (oData.results[0].Header2Items.results[i].Item2SubItems && oData.results[0].Header2Items.results[i].Item2SubItems.results &&
							oData.results[0].Header2Items.results[i].Item2SubItems.results.length > 0) {
							oItem = SubItemController.createSubItemData(oItem, oData.results[0].Header2Items.results[i].Item2SubItems.results, this._isIntentSupported
								.MaterialDisplay);
							sJson.HasSubcontractingItem = true; // determins the visiblity of column
						} else {
							oItem.ItemHasComponent = false;
							oItem.ItemComponentVisible = false;
						}

						sJson.Items.push(oItem);
						oItem.SelectEnabled = this._ItemConsistent(oItem, sJson.Items);
						//Controls also apply button on detailed screen
						oItem.ApplyButtonEnabled = oItem.SelectEnabled;
					} //Multi account assignment 

					//AccountAssignment handling/ update of oItem by reference semantics
					var AccountAssignmentItem = {};
					//Multiple Account Assignments
					AccountAssignmentItem.AccountAssignmentNumber = oData.results[0].Header2Items.results[i].AccountAssignmentNumber;
					AccountAssignmentItem.MultipleAcctAssgmtDistrPercent = oData.results[0].Header2Items.results[i].MultipleAcctAssgmtDistrPercent;
					AccountAssignmentItem.MultipleAcctAssgmtDistrQty = oData.results[0].Header2Items.results[i].MultipleAcctAssgmtDistrQty;
					AccountAssignmentItem.AssetNumber = oData.results[0].Header2Items.results[i].AssetNumber;
					AccountAssignmentItem.AssetNumberName = oData.results[0].Header2Items.results[i].AssetNumberName;
					if (AccountAssignmentItem.AssetNumberName !== '') {
						oItem.AccountAssignmentsColumnAssetNumberVisible = true;
					}
					AccountAssignmentItem.SubAssetNumber = oData.results[0].Header2Items.results[i].SubAssetNumber;
					if (AccountAssignmentItem.SubAssetNumber !== '') {
						oItem.AccountAssignmentsColumnSubAssetNumberVisible = true;
					}
					AccountAssignmentItem.GLAccount = oData.results[0].Header2Items.results[i].GLAccount;
					AccountAssignmentItem.GLAccountName = oData.results[0].Header2Items.results[i].GLAccountName;
					if (AccountAssignmentItem.GLAccount !== '') {
						oItem.AccountAssignmentsColumnGLAccountVisible = true;
					}
					AccountAssignmentItem.GoodsRecipientName = oData.results[0].Header2Items.results[i].GoodsRecipientName;
					if (AccountAssignmentItem.GoodsRecipientName !== '') {
						oItem.AccountAssignmentsColumnGoodsRecipientVisible = true;
					}
					AccountAssignmentItem.UnloadingPointName = oData.results[0].Header2Items.results[i].UnloadingPointName;
					if (AccountAssignmentItem.UnloadingPointName !== '') {
						oItem.AccountAssignmentsColumnUnloadingPointVisible = true;
					}
					AccountAssignmentItem.FunctionalArea = oData.results[0].Header2Items.results[i].FunctionalArea;
					if (AccountAssignmentItem.FunctionalArea !== '') {
						oItem.AccountAssignmentsColumnFunctionalAreaVisible = true;
					}
					AccountAssignmentItem.ProfitCenter = oData.results[0].Header2Items.results[i].ProfitCenter;
					AccountAssignmentItem.ProfitCenterName = oData.results[0].Header2Items.results[i].ProfitCenterName;
					if (AccountAssignmentItem.ProfitCenter !== '') {
						oItem.AccountAssignmentsColumnProfitCenterVisible = true;
					}
					AccountAssignmentItem.CostCenter = oData.results[0].Header2Items.results[i].CostCenter;
					AccountAssignmentItem.CostCenterName = oData.results[0].Header2Items.results[i].CostCenterName;
					if (AccountAssignmentItem.CostCenter !== '') {
						oItem.AccountAssignmentsColumnCostCenterVisible = true;
					}
					// Special Stock and/or accounting field					
					AccountAssignmentItem.Project = oData.results[0].Header2Items.results[i].Project;
					AccountAssignmentItem.ProjectDescription = oData.results[0].Header2Items.results[i].ProjectDescription;
					if (AccountAssignmentItem.Project !== '') {
						oItem.AccountAssignmentsColumnProjectVisible = true;
					}
					AccountAssignmentItem.SalesOrder = oData.results[0].Header2Items.results[i].SalesOrder;
					AccountAssignmentItem.SalesOrderItem = oData.results[0].Header2Items.results[i].SalesOrderItem;
					if (AccountAssignmentItem.SalesOrder !== '') {
						oItem.AccountAssignmentsColumnSalesOrderVisible = true;
					}
					AccountAssignmentItem.OrderID = oData.results[0].Header2Items.results[i].OrderID;
					if (AccountAssignmentItem.OrderID !== '') {
						oItem.AccountAssignmentsColumnOrderIDVisible = true;
					}
					oItem.AccountAssignments.push(AccountAssignmentItem);
				} //end for items
				// item count
				this._iTableRowsCount = sJson.Items.length;
				sJson.POItemsCountTableHeader = this.getResourceBundle().getText("TABLE_TOTAL_ITEMS_LABEL", [this._iTableRowsCount]);

				//set Object header
				if (sJson.SupplyingPlant !== "") { //supplying plant
					sJson.Objectheader = this.formatter.concatenateNameIdFormatter(sJson.SupplyingPlantName, sJson.SupplyingPlant);
					sJson.SupplierDisplayActive = false; // set link to inactive
				} else { //default
					if (this._SourceOfGR !== this._SourceOfGRIsProductionOrder) {
						sJson.Objectheader = sJson.Lifname;
					}
				}
				if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
					sJson.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PO");
					sJson.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PO");
					sJson.searchFieldLabel = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PO");
					sJson.Ebeln_label = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PO");
					sJson.Ebeln_maxLength = 10;
					sJson.HeaderContentVisible = true; //no reference
				} else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) { //Production Order
					sJson.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PROD");
					sJson.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PROD");
					sJson.searchFieldLabel = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PROD");
					sJson.Ebeln_label = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PROD");
					sJson.Ebeln_maxLength = 12;
					sJson.HeaderContentVisible = true; //no reference
					sJson.BillOfLadingVisible = false;
				} else if (this._SourceOfGR === this._SourceOfGRIsNoReference) { //No REF
					sJson.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_NOREF");
					sJson.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_NoREF");
					sJson.BillOfLadingVisible = false;
				} else {
					sJson.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_DL");
					sJson.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_DL");
					sJson.searchFieldLabel = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_DL");
					sJson.Ebeln_label = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_DL");
					sJson.HeaderContentVisible = true; //no reference
					sJson.Ebeln_maxLength = 10;
				}
				sJson.SourceOfGR = this._SourceOfGR;
				if (this._aExtendedFields.length > 0) { //extended fields --> show facet
					sJson.ExtensionSectionVisible = true;
				} else {
					sJson.ExtensionSectionVisible = false;
				}
				//max Length preservation
				sJson.Ebeln_possibleLength = this.getView().getModel("oFrontend").getProperty("/Ebeln_possibleLength"); //propagate Possible lengh after loads
				sJson.maxSuggestionWidth = this.getView().getModel("oFrontend").getProperty("/maxSuggestionWidth"); //propagate Possible lengh after loads

				//Mix AppState  if available 
				var bOneNotFound = false;
				if (oAppState) {
					for (var k = 0; k < this._oNavigationServiceFields.aHeaderFields.length; k++) {
						sJson[this._oNavigationServiceFields.aHeaderFields[k]] = oAppState[this._oNavigationServiceFields.aHeaderFields[k]];
					}
					var bFoundItem = false;
					var iIndexFound = 0;
					for (var m = 0; m < oAppState.Items.length; m++) { // on all items
						bFoundItem = false;
						iIndexFound = 0;
						while (iIndexFound < sJson.Items.length && bFoundItem === false) {
							if (oAppState.Items[m].DocumentItem === sJson.Items[iIndexFound].DocumentItem) {
								bFoundItem = true;
							} else {
								iIndexFound++;
							}
						}
						if (bFoundItem === true) { //item exists
							if (oAppState.Items[m].ItemCounter === 0) { //parent
								sJson.Items[iIndexFound].Selected = oAppState.Items[m].Selected;
								sJson.Items[iIndexFound].DocumentItemText = oAppState.Items[m].DocumentItemText;
								sJson.Items[iIndexFound].DeliveryCompleted = oAppState.Items[m].DeliveryCompleted;
								sJson.Items[iIndexFound].DeliveredUnit_input = oAppState.Items[m].DeliveredUnit_input;
								sJson.Items[iIndexFound].DeliveredQuantity_input = oAppState.Items[m].DeliveredQuantity_input;
								sJson.Items[iIndexFound].StockType_selectedKey = oAppState.Items[m].StockType_selectedKey;
								sJson.Items[iIndexFound].StorageLocation = oAppState.Items[m].StorageLocation;
								sJson.Items[iIndexFound].StorageLocation_input = oAppState.Items[m].StorageLocation_input;
								sJson.Items[iIndexFound].ShelfLifeExpirationDate = oAppState.Items[m].ShelfLifeExpirationDate;
								sJson.Items[iIndexFound].ManufactureDate = oAppState.Items[m].ManufactureDate;
								sJson.Items[iIndexFound].ReasonCode = oAppState.Items[m].ReasonCode;
								if (sJson.Items[iIndexFound].ShelfLifeExpirationDate !== "") {
									sJson.Items[iIndexFound].ShelfLifeExpirationDate_valueState = sap.ui.core.ValueState.None;
								}
								if (sJson.Items[iIndexFound].ManufactureDate !== "") {
									sJson.Items[iIndexFound].ManufactureDate_valueState = sap.ui.core.ValueState.None;
								}
								if (sJson.Items[iIndexFound].ReasonCode !== "") {
									sJson.Items[iIndexFound].ReasonCode_valueState = sap.ui.core.ValueState.None;
								}
								if (sJson.Items[iIndexFound].StockType_selectedKey === "U") {
									sJson.Items[iIndexFound].StorageLocationVisible = false;
								}
								if (sJson.Items[iIndexFound].Plant !== oAppState.Items[m].Plant) {
									sJson.Items[iIndexFound].StorageLocation_valueState = sap.ui.core.ValueState.Warning;
									sJson.Items[iIndexFound].highlight = (sJson.Items[iIndexFound].highlight === sap.ui.core.ValueState.Error) ? sap.ui.core.ValueState
										.Error : sap.ui.core.ValueState.Warning;
									sJson.Items[iIndexFound].StorageLocation_valueStateText = "";
									sJson.Items[iIndexFound].Selected = false;
								} else {
									if (sJson.Items[iIndexFound].StorageLocation !== "") {
										sJson.Items[iIndexFound].StorageLocation_valueState = sap.ui.core.ValueState.None;
									}
								}
								sJson.Items[iIndexFound].Plant = oAppState.Items[m].Plant;
								if (sJson.Items[iIndexFound].OpenQuantity !== oAppState.Items[m].OpenQuantity ||
									sJson.Items[iIndexFound].Unit !== oAppState.Items[m].Unit ||
									sJson.Items[iIndexFound].NonVltdGRBlockedStockQty !== oAppState.Items[m].NonVltdGRBlockedStockQty) {
									sJson.Items[iIndexFound].DeliveredQuantity_valueState = sap.ui.core.ValueState.Warning;
									sJson.Items[iIndexFound].highlight = (sJson.Items[iIndexFound].highlight === sap.ui.core.ValueState.Error) ? sap.ui.core.ValueState
										.Error : sap.ui.core.ValueState.Warning;
									sJson.Items[iIndexFound].DeliveredQuantity_valueStateText = "";
									sJson.Items[iIndexFound].Selected = false;
								}
								// apply the subcontracting components from app state
								if (sJson.Items[iIndexFound].ItemHasComponent && oAppState.Items[m].ItemHasComponent) {
									sJson.Items[iIndexFound].ItemComponentVisible = oAppState.Items[m].ItemComponentVisible;
									sJson.Items[iIndexFound].ComponentIconState = oAppState.Items[m].ComponentIconState;
									sJson.Items[iIndexFound].ComponentAutoAdjusted = oAppState.Items[m].ComponentAutoAdjusted;
									sJson.Items[iIndexFound].ComponentManualAdjusted = oAppState.Items[m].ComponentManualAdjusted;
									sJson.Items[iIndexFound].SubItems = oAppState.Items[m].SubItems;
								}
							} else { //child due to splitting
								//clone item
								var newItem = JSON.parse(JSON.stringify(sJson.Items[iIndexFound]));
								newItem.ItemCounter = oAppState.Items[m].ItemCounter;
								newItem.SplitEnabled = true;
								newItem.MaterialVisible = false; // hide non relevant fields
								newItem.AccountAssignmentVisible = false; // hide Account Assignment Button
								newItem.PlantVisible = false; //plant only on original item
								newItem.StorageLocationVisible = true; // Storage location on split item
								newItem.StockTypeVisible = true; // Stock Type location on split item
								newItem.DeliveredQuantity_input = 0;
								newItem.SplitButtonIcon = "sap-icon://less";
								//take over stored data
								newItem.Selected = true;
								newItem.DocumentItemText = oAppState.Items[m].DocumentItemText;
								newItem.DeliveryCompleted = oAppState.Items[m].DeliveryCompleted;
								newItem.DeliveredUnit_input = oAppState.Items[m].DeliveredUnit_input;
								newItem.DeliveredQuantity_input = oAppState.Items[m].DeliveredQuantity_input;
								newItem.StockType_selectedKey = oAppState.Items[m].StockType_selectedKey;
								newItem.StorageLocation = oAppState.Items[m].StorageLocation;
								newItem.StorageLocation_input = oAppState.Items[m].StorageLocation_input;
								newItem.ShelfLifeExpirationDate = oAppState.Items[m].ShelfLifeExpirationDate;
								newItem.ManufactureDate = oAppState.Items[m].ManufactureDate;
								newItem.ReasonCode = oAppState.Items[m].ReasonCode;
								if (newItem.StockType_selectedKey === "U") {
									newItem.StorageLocationVisible = false;
								}
								//reset cloned errors
								if (newItem.StorageLocation !== "") {
									newItem.StorageLocation_valueState = sap.ui.core.ValueState.None;
								}
								if (newItem.ShelfLifeExpirationDate !== "") {
									newItem.ShelfLifeExpirationDate_valueState = sap.ui.core.ValueState.None;
								}
								if (newItem.ReasonCode !== "") {
									newItem.ReasonCode_valueState = sap.ui.core.ValueState.None;
								}
								if (newItem.ManufactureDate !== "") {
									newItem.ManufactureDate_valueState = sap.ui.core.ValueState.None;
								}
								//Plant/States are  is cloned
								//Add split items to all items
								sJson.Items.splice(++iIndexFound, 0, newItem);
							} //Item Counter
						} else { //bFoundItem
							bOneNotFound = true;
						}
					}

					var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
					var iSelectedItem;
					if (oAppState.oBatchCreate) {
						//getting item index in item list in order to set model for detail screen
						for (iSelectedItem = 0; iSelectedItem < sJson.Items.length; iSelectedItem++) {
							if (sJson.Items[iSelectedItem].DocumentItem === oAppState.oBatchCreate.DocumentItem && sJson.Items[iSelectedItem].ItemCounter ===
								oAppState.oBatchCreate.ItemCounter) {
								break;
							}
						}
						oRouter.navTo("subscreen", {
							POItem: iSelectedItem
						}, true); // route name in component definition
					}
					if (oAppState.DetailPageData) {
						this._oDetailPageData = oAppState.DetailPageData;
						//getting item index in item list in order to set model for detail screen
						for (iSelectedItem = 0; iSelectedItem < sJson.Items.length; iSelectedItem++) {
							if (sJson.Items[iSelectedItem].DocumentItem === oAppState.DetailPageData.DocumentItem && sJson.Items[iSelectedItem].ItemCounter ===
								oAppState.DetailPageData.ItemCounter) {
								break;
							}
						}
						oRouter.navTo("subscreenAppState", {
							POItem: iSelectedItem
						}, true); // route name in component definition
					}
				} //Mix AppState  if available/

				oModel.setData(sJson);
				this._setSearchPlaceholderText();
				this._setScanButtonVisibility();
				//co-pilot
				this.getView().bindElement({
					path: "/GR4PO_DL_Headers(InboundDelivery='" + sJson.Ebeln +
						"',SourceOfGR='" + this._SourceOfGR + "')",
					model: "oData"
				});
				// Save Data for following Check
				this._initialDataLoaded = JSON.parse(JSON.stringify(sJson));
				//New PO was chosen therefore we have to re-set the screen objects (check box, button, ...)
				//determine i18n related variables
				oModel.setProperty("/PostButtonVisible", true);
				var aSorters = []; //initial sorting
				aSorters.push(new sap.ui.model.Sorter("DocumentItem_int", false));
				aSorters.push(new sap.ui.model.Sorter("ItemCounter", false));
				this.getView().byId("idProductsTable").removeSelections(true);
				this.getView().byId("idProductsTable").getBinding("items").filter([]); // clear any table filters
				this.getView().byId("idProductsTable").getBinding("items").sort(aSorters); // allways sort top down

				this.getView().byId("idTableSearch").setValue("");
				this._controlSelectAllAndPostButton();
				if (oAppState) { // apply attachment service key to show attachment
					this._loadAttachmentComponent(oAppState.Temp_Key);
				} else {
					this._loadAttachmentComponent();
				}

				//issue with AppState
				if (bOneNotFound === true) {
					MessageToast.show(this.getResourceBundle().getText("MESSAGE_CHANGED_PO"));
				}
				//issue with Customizing
				if (bStockTypeCustomizingError === true) {
					this._toggleBusy(false);
					MessageToast.show(this.getResourceBundle().getText("MESSAGE_CONFIGURATION"));
				}
			} // bAbort === false; Response Header ok
			this._toggleBusy(false);
			//copilot reload after each load
			var that = this;
			if (sap.cp && sap.cp.ui.services && sap.cp.ui.services.CopilotApi) {
				sap.cp.ui.services.CopilotApi.getChats().then(function (aChats) {
					that._aCopilotChats = aChats;
				});
				this._oCopilotActive = true;
				this.getView().getModel("oFrontend").setProperty("/CopilotActive", this._oCopilotActive); //Copilot active on system
			}
		}, //success full read

		/**
		 * Remove the abort hash so that it work with app state
		 * @private
		 */
		_removeAbortHashBeforeNavigation: function (sAppStateKey) {
			var oHashChanger = sap.ui.core.routing.HashChanger.getInstance();
			var sCurrentHash = oHashChanger.getHash();
			if (sCurrentHash.includes("false") || sCurrentHash.includes("true")) {
				if (sAppStateKey) {
					oHashChanger.replaceHash("sap-iapp-state=" + sAppStateKey);
				} else {
					oHashChanger.replaceHash("");
				}
			}
		},

		/**
		 * Saves the app state and returns the app state key
		 * @private
		 */
		_generateAppStateKey: function () {
			var oStoreInnerAppState = this._oNavigationService.storeInnerAppStateWithImmediateReturn(this._getInnerAppState(), false);
			var oStoreInnerAppStatePromise = oStoreInnerAppState.promise;
			oStoreInnerAppStatePromise.done(function (sAppStateKey) {
				//inner app state is saved now, sAppStateKey was added to URL
				this._removeAbortHashBeforeNavigation(sAppStateKey);
			}.bind(this));
			return oStoreInnerAppState.appStateKey;
		},

		/**
		 * @function generate the app state
		 * @return {string} the external hash tag which includes parameter and app state key
		 */
		_generateAppStateExternalUrl: function () {
			var sAppStateKey = this._generateAppStateKey();
			var oCrossAppNavigator = sap.ushell.Container.getService("CrossApplicationNavigation");

			var ext_href_For_start_app;
			var sSemanticObject;
			var oParams;

			var sAction = "createGR"; //default action
			if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
				sSemanticObject = "PurchaseOrder";
				oParams = {
					"SourceOfGR": [this._SourceOfGR]
				};
			} else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) { //Production Order
				sSemanticObject = "ProductionOrder";
				oParams = {
					"SourceOfGR": [this._SourceOfGR]
				};
			} else if (this._SourceOfGR === this._SourceOfGRIsNoReference) { //No Reference
				sAction = "createGRwoReference"; //override of default
				sSemanticObject = "Material";
				oParams = {
					"SourceOfGR": [this._SourceOfGR]
				};
			} else {
				sSemanticObject = "InboundDelivery";
				oParams = {
					"SourceOfGR": [this._SourceOfGR]
				};
			}

			ext_href_For_start_app = (oCrossAppNavigator && oCrossAppNavigator.hrefForExternal({
				target: {
					semanticObject: sSemanticObject,
					action: sAction
				},
				params: oParams,
				appStateKey: sAppStateKey
			})) || "";
			return ext_href_For_start_app;
		},

		/**
		 * @function private call back method before save as tile is executed
		 */
		handleBookmarkBeforePress: function () {
			var sTitle = "";
			if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
				sTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PO");
			} else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) { //Production Order
				sTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PROD");
			} else if (this._SourceOfGR === this._SourceOfGRIsNoReference) { //No Reference
				sTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_NOREF");
			} else {
				sTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_DL");
			}

			var oFrontendModel = this.getView().getModel("oFrontend");
			var PONumber = oFrontendModel.getProperty("/Ebeln");
			oFrontendModel.setProperty("/saveAsTileTitle", sTitle);
			oFrontendModel.setProperty("/saveAsTileSubtitle", PONumber);
			oFrontendModel.setProperty("/saveAsTileURL", this._generateAppStateExternalUrl());
		},

		/**
		 * @function handle checkbox delivery completed
		 * @param oEvent Event object supplied by UI
		 */
		handleSelectDeliveryCompleted: function (oEvent) {
			//Handler for detail screen checkbox for setting item to completed
			var bDeliveryCompleted = oEvent.getParameter("selected");
			var oModel = this.getView().getModel("oItem");
			//oModel.setProperty("/DeliveryCompleted", bDeliveryCompleted );
			if (bDeliveryCompleted) { //if set set also selected for posting
				oModel.setProperty("/Selected", bDeliveryCompleted);
			}

		},

		/**
		 * @function handle personalisation start button press
		 * @param oEvent Event object supplied by UI
		 */
		onPersoButtonPressed: function (oEvent) {
			if (!this._oPersDialog) {
				this._oPersDialog = sap.ui.xmlfragment("s2p.mm.im.goodsreceipt.purchaseorder.view.personalization", this);
				this.getView().addDependent(this._oPersDialog);
			}

			var oPersModel = new sap.ui.model.json.JSONModel();

			oPersModel.setData(JSON.parse(JSON.stringify(this._oPersonalizedDataContainer))); //clone to avoid reference issues
			this._oPersDialog.setModel(oPersModel);
			this._oPersDialog.open();
		},

		/**
		 * @function handle personalisation save button press
		 * @param oEvent Event object supplied by UI
		 */
		handlePersonalizationSave: function (oEvent) {

			var oModel = this._oPersDialog.getModel();
			this._oPersonalizedDataContainer = oModel.getData();

			if (this._oPersonalizer) { //personalizer exists = working in FLP
				var oFrontendModel = this.getView().getModel("oFrontend");
				//disable save button during save
				oFrontendModel.setProperty("/personalizationEnabled", false);
				var oSavePromise = this._oPersonalizer.setPersData(this._oPersonalizedDataContainer).done(function () {
					// before the next save is triggered the last one has to be finished
					//enable save button after save
					oFrontendModel.setProperty("/personalizationEnabled", true);
				}).fail(function () {
					jQuery.sap.log.error("Writing personalization data failed.");
					oFrontendModel.setProperty("/personalizationEnabled", true); //restore save although failure
				});
			} //personalizer exists

			this._oPersDialog.close();
		},

		/**
		 * @function handle personalisation abort button press
		 * @param oEvent Event object supplied by UI
		 */
		handlePersonalizationAbort: function (oEvent) {
			this._oPersDialog.close();

		},

		/**
		 * @function handle app settings button press
		 * @param oEvent Event object supplied by UI
		 */
		_showSettingsDialog: function (oEvent) {
			// application settings dialog fragment
			if (!this._oApplicationSettingsDialog) {

				if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
					this._oApplicationSettingsDialog = sap.ui.xmlfragment({
						fragmentName: "s2p.mm.im.goodsreceipt.purchaseorder.view.ApplicationSettingsPurchaseOrder",
						type: "XML",
						id: "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.ApplicationSettings"
					}, this);
				} else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) { //Production Order// TODO: 
					this._oApplicationSettingsDialog = sap.ui.xmlfragment({
						fragmentName: "s2p.mm.im.goodsreceipt.purchaseorder.view.ApplicationSettingsProductionOrder",
						type: "XML",
						id: "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.ApplicationSettings"
					}, this);
				} else if (this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
					this._oApplicationSettingsDialog = sap.ui.xmlfragment({
						fragmentName: "s2p.mm.im.goodsreceipt.purchaseorder.view.ApplicationSettingsInboundDelivery",
						type: "XML",
						id: "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.ApplicationSettings"
					}, this);
				}

				this.getView().addDependent(this._oApplicationSettingsDialog);
			}
			var oPersModel = new sap.ui.model.json.JSONModel();

			oPersModel.setData(JSON.parse(JSON.stringify(this._oPersonalizedDataContainer))); //clone to avoid reference issues
			this._oApplicationSettingsDialog.setModel(oPersModel);
			this._oApplicationSettingsDialog.open();
		},
		/**
		 * @function handle personalisation save button press
		 * @param oEvent Event object supplied by UI
		 */
		handleApplicationSettingsSave: function (oEvent) {

			var oModel = this._oApplicationSettingsDialog.getModel();
			this._oPersonalizedDataContainer = oModel.getData();

			if (this._oPersonalizer) { //personalizer exists = working in FLP
				var oFrontendModel = this.getView().getModel("oFrontend");
				//disable save button during save
				oFrontendModel.setProperty("/personalizationEnabled", false);
				var oSavePromise = this._oPersonalizer.setPersData(this._oPersonalizedDataContainer).done(function () {
					// before the next save is triggered the last one has to be finished
					//enable save button after save
					oFrontendModel.setProperty("/personalizationEnabled", true);
				}).fail(function () {
					jQuery.sap.log.error("Writing personalization data failed.");
					oFrontendModel.setProperty("/personalizationEnabled", true); //restore save although failure
				});
			} //personalizer exists

			this._setSearchPlaceholderText();
			this._setScanButtonVisibility();
			this._oApplicationSettingsDialog.close();
		},

		/**
		 * @function handle personalisation abort button press
		 * @param oEvent Event object supplied by UI
		 */
		handleApplicationSettingsAbort: function (oEvent) {
			this._oApplicationSettingsDialog.close();

		},
		/**
		 * @function formatter of material puts brackets around input
		 * @param {string} smatid String to be put in brackets
		 * @retrun {string} formatted string
		 */
		matidformatter: function (smatid) {
			if (smatid !== "") {
				smatid = " " + smatid + "";
			}
			return smatid;
		},
		/**
		 * @function formatter of sales order/sales order item
		 * @param {string} sSalesOrder String to be put ahead of slash
		 * @param {string} sSalesOrderItem String to be behind slash
		 * @return {string} formatted string
		 */
		soformatter: function (sSalesOrder, sSalesOrderItem) {
			return sSalesOrder + "/" + sSalesOrderItem;
		},
		/**
		 * private method
		 * @function handler to create a empty item in table (main + subitems)
		 * @param {string} maxium DocumentItem number in current table
		 * @param {string} add/delete button visible status
		 */
		_getInitialItem: function (maxItemCell, buttonvisible) {
			var oFrontendModel = this.getView().getModel("oFrontend");
			var oModel = oFrontendModel.getData();
			var newItem = {};
			var ostock_type = new Array();
			newItem.ItemCounter = 0;
			newItem.POItemsCountTableHeader = '01';
			newItem.Selected = false;
			newItem.SelectEnabled = true;
			newItem.Material_Input = "";
			newItem.StockTypeNOREFEnabled = false;
			newItem.DeliveredQuantityEditable = false;
			newItem.DeliveredUnitEditable = false;
			newItem.DocumentItem = maxItemCell + 1;
			newItem.ChartVisible = false;
			if (newItem.DocumentItem < 10) {
				newItem.DocumentItem = "0" + newItem.DocumentItem;
			} else {
				newItem.DocumentItem = newItem.DocumentItem.toString();
			}
			newItem.ItemEnabled = true;
			newItem.SplitEnabled = false;
			newItem.MaterialText = this.getResourceBundle().getText("ITEM_DETAILTITLE", [newItem.DocumentItem]);
			newItem.MaterialEditable = true;
			newItem.Plant_input_editable = false;
			newItem.SalesOrder_editable = false;
			newItem.StorageLocationEditable = false;
			newItem.BatchEditable = false;
			newItem.AccountAssignmentVisible = false; // hide Account Assignment Button
			newItem.PlantVisible = true; //plant only on original item
			newItem.Plant = '';
			newItem.StorageLocationVisible = true;
			newItem.StorageLocation = '';
			newItem.WarehouseStorageBin = '';
			newItem.StockTypeVisible = true;
			newItem.StockType = '';
			newItem.StockTypeEnabled = true;
			newItem.StockType_input = ostock_type;
			newItem.UnloadingPoint_editable = true;
			newItem.GoodsRecipientName_editable = true;
			newItem.InventorySpecialStockTypeName = this.getResourceBundle().getText("NONE");
			newItem.DeliveredQuantity_input = 0;
			newItem.BatchVisible = false;
			newItem.ManufactureDateVisible = false;
			newItem.ShelfLifeExpirationDate = '';
			newItem.ManufactureDate = '';
			newItem.ShelfLifeExpirationDateVisible = false;
			newItem.GoodsMovementReasonCodeVisible = false;
			oModel.Items.push(newItem);
			this._initialDataLoaded = JSON.parse(JSON.stringify(oModel));
			this._loadAttachmentComponentNOREF();
			if (buttonvisible === true) {
				oModel.CopyButtonVisible = true;
				oModel.DeleteButtonVisible = true;
			} else {
				oModel.CopyButtonVisible = false;
				oModel.DeleteButtonVisible = false;
			}
			//No Reference
			var oMyModel = this.getView().getModel("oFrontend");
			if (oMyModel.getProperty("/SpecialStock_input") === "" || oMyModel.getProperty("/SpecialStock_input") === undefined) {
				this.getOwnerComponent().getModel("oData").read("/MMIMInventSpecialStockTypeVH", {
					success: jQuery.proxy(this._successSpecialStockLoad, this),
					error: jQuery.proxy(this._handleOdataError, this)
				});
			}
			oFrontendModel.setData(oModel);
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
				this.getView().byId("idProductsTable").setNoDataText(this.getResourceBundle().getText("TABLE_NODATA_TEXT"));
			}
		},
		/**
		 * public method
		 * @function handler to delete an initial item into item table
		 * @param oEvent Event object supplied by UI
		 */
		handleAddButtonPressed: function (oEvent) {
			var oFrontendModel = this.getView().getModel("oFrontend");
			var oModeldata = oFrontendModel.getData();
			var maxItemCell = 0;
			for (var i = 0; i < oModeldata.Items.length; i++) {
				if (maxItemCell < parseInt(oModeldata.Items[i].DocumentItem)) {
					maxItemCell = parseInt(oModeldata.Items[i].DocumentItem);
				}
			}
			var oModel = this.getView().getModel("oFrontend");
			var aItems;
			var sValidation;
			aItems = oModel.getProperty("/Items");
			for (var j = 0; j < aItems.length; j++) {
				sValidation = this._validationNoRefItem(j);
				if (sValidation === false) {
					oModel.setProperty("/PostButtonEnabled", false);
					break;
				} else {
					oModel.setProperty("/PostButtonEnabled", true);
				}
			}
			this._getInitialItem(maxItemCell, oModeldata.CopyButtonVisible);
			this.getView().byId("idSelectAll").setEnabled(true);
			this.getView().byId("idAddButton").focus();
			// Check/Set the checkbox SelectAll status
			var aItems = oFrontendModel.getProperty("/Items");
			var iSelectedItemsCount = 0;
			for (var i = 0; i < aItems.length; i++) {
				if (aItems[i].Selected) {
					iSelectedItemsCount++;
				}
			}
			var bAllItemsSelected = this._allItemsInTableSelected(aItems);
			this._controlSelectAllCheckBox(iSelectedItemsCount > 0, bAllItemsSelected);
		},
		/**
		 * public method
		 * @function handler to delete one / more items from item table
		 * @param oEvent Event object supplied by UI
		 */
		handleDeleteButtonPressed: function (oEvent) {
			var oFrontendModel = this.getView().getModel("oFrontend");
			var oModel = oFrontendModel.getData();
			var oItems = new Array();
			var j = 0;
			var x;
			var msg;
			var popupmsg;
			for (var i = 0; i < oModel.Items.length; i++) {
				if (oModel.Items[i].Selected === true) {
					oItems.push({
						item: i
					});
					x = oModel.Items[i].DocumentItem;
				}
			}
			if (oItems.length === 1) {
				popupmsg = this.getResourceBundle().getText("DELETE_POPUP_MIN", [x]);
			} else {
				popupmsg = this.getResourceBundle().getText("DELETE_POPUP_MAX", [oItems.length]);
			}

			var ChangeOK = false;
			var that = this;
			var resourceBundle = that.getResourceBundle();
			sap.m.MessageBox.warning(popupmsg, {
				icon: sap.m.MessageBox.Icon.WARNING,
				title: this.getResourceBundle().getText("DELETE"),
				actions: [this.getResourceBundle().getText("DELETE"), sap.m.MessageBox.Action.CANCEL],
				onClose: fnCallbackConfirm,
				styleClass: "sapUiSizeCompact",
				initialFocus: sap.m.MessageBox.Action.CANCEL
			});

			//local callback
			function fnCallbackConfirm(sResult) {
				var j = 0;
				if (sResult === that.getResourceBundle().getText("DELETE")) {
					for (var i = 0; i < oItems.length; i++) {
						oModel.Items.splice(oItems[i].item - j, 1);
						j++;
					}
					if (oModel.Items.length === 0) {
						that.getView().byId("idSelectAll").setSelected(false);
						that.getView().byId("idSelectAll").setEnabled(true);
					}
					oModel.CopyButtonVisible = false;
					oModel.DeleteButtonVisible = false;
					if (oItems.length === 1) {
						// msg = that.getResourceBundle().getText("TABLE_COLUMN_Item_TEXT") + ' ' + x + ' ' + that.getResourceBundle().getText("DELETEDS");
						msg = that.getResourceBundle().getText("DELETE_MESSAGE_MIN", [x]);
					} else {
						// msg = oItems.length + ' ' + that.getResourceBundle().getText("ITEMSS") + ' ' + that.getResourceBundle().getText("DELETEDS");
						msg = that.getResourceBundle().getText("DELETE_MESSAGE_MAX", [oItems.length]);
					}
					MessageToast.show(msg);
					oFrontendModel.setData(oModel);
					// validation of post-button (aktiv/inaktiv)
					var aItems;
					var sValidation;
					aItems = oFrontendModel.getProperty("/Items");
					if (aItems.length === 0) {
						oFrontendModel.setProperty("/PostButtonEnabled", false);
					} else {
						for (var s = 0; s < aItems.length; s++) {
							sValidation = that._validationNoRefItem(s);
							if (sValidation === false) {
								oFrontendModel.setProperty("/PostButtonEnabled", false);
								break;
							} else {
								oFrontendModel.setProperty("/PostButtonEnabled", true);
							}
						}
					}
					that.getView().byId("idAddButton").focus();
					sap.ui.getCore().getMessageManager().removeAllMessages();
					var myModel = that.getView().getModel("oFrontend");
					var aItems = myModel.getProperty("/Items");
					for (var j = 0; j < aItems.length; j++) {
						var sDocumentItem = myModel.getProperty("/Items/" + j + "/DocumentItem");
						if (myModel.getProperty("/Items/" + j + "/ManufactureDate_valueState") === sap.ui.core.ValueState.Error ||
							myModel.getProperty("/Items/" + j + "/ShelfLifeExpirationDate_valueState") === sap.ui.core.ValueState.Error
						) {
							var oMessage = new Message({
								message: that.getResourceBundle().getText("TITLE_ERROR_DETAILVIEW"),
								type: MessageType.Error,
								target: "Special Stock",
								processor: myModel,
								additionalText: that.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [sDocumentItem]),
								description: that.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [sDocumentItem])
							});
							sap.ui.getCore().getMessageManager().addMessages(oMessage);
						}
					}

					// Check/Set the checkbox SelectAll status
					// var aItems = oFrontendModel.getProperty("/Items");
					var iSelectedItemsCount = 0;
					for (var i = 0; i < aItems.length; i++) {
						if (aItems[i].Selected) {
							iSelectedItemsCount++;
						}
					}
					var bAllItemsSelected = that._allItemsInTableSelected(aItems);
					that._controlSelectAllCheckBox(iSelectedItemsCount > 0, bAllItemsSelected);
				}
			}

			// Check/Set the checkbox SelectAll status
			// 	var aItems = oFrontendModel.getProperty("/Items");
			// 	var iSelectedItemsCount = 0;
			// 	for (var i = 0; i < aItems.length; i++) {
			// 		if (aItems[i].Selected) {
			// 			iSelectedItemsCount++;
			// 		}
			// 	}
			// 	var bAllItemsSelected = this._allItemsInTableSelected(aItems);
			// 	this._controlSelectAllCheckBox(iSelectedItemsCount > 0, bAllItemsSelected);
		},
		/**
		 * public method
		 * @function handler to copy one / more items into item table
		 * @param oEvent Event object supplied by UI
		 */
		handleCopyButtonPressed: function (oEvent) {
			var oFrontendModel = this.getView().getModel("oFrontend");
			var oModel = oFrontendModel.getData();
			var maxItemCell = 0;
			var j;
			var y = 0;
			var sDocumentItemSelected = [];
			for (var i = 0; i < oModel.Items.length; i++) {
				if (maxItemCell < parseInt(oModel.Items[i].DocumentItem)) {
					maxItemCell = parseInt(oModel.Items[i].DocumentItem);
				}
			}
			for (var i = 0; i < oModel.Items.length; i++) {
				if (oModel.Items[i].Selected === true) {
					var newItem = JSON.parse(JSON.stringify(oModel.Items[i]));
					sDocumentItemSelected[y] = newItem.DocumentItem;
					y++;
					newItem.Selected = false;
					maxItemCell++;
					newItem.DocumentItem = maxItemCell;
					if (newItem.DocumentItem < 10) {
						newItem.DocumentItem = "0" + newItem.DocumentItem;
					} else {
						newItem.DocumentItem = newItem.DocumentItem.toString();
					}
					sDocumentItemSelected[y] = newItem.DocumentItem;
					y++;
					newItem.MaterialText = 'Item ' + newItem.DocumentItem;
					// newItem.highlight = sap.ui.core.ValueState.Success;
					newItem.highlight = sap.ui.core.MessageType.Information;
					oModel.Items.splice(0, 0, newItem);
					j = i + 1;
					oModel.Items[j].Selected = false;

				}
			}

			var oSelectAllCheckbox = this.getView().byId("idSelectAll");
			oSelectAllCheckbox.setSelected(false);
			oFrontendModel.setData(oModel);
			oFrontendModel.setProperty("/CopyButtonVisible", false);
			oFrontendModel.setProperty("/DeleteButtonVisible", false);
			// thiFrontendModels._controlSelectAllAndPostButton(oModel.Items);
			this.getView().byId("idAddButton").focus();
			sap.ui.getCore().getMessageManager().removeAllMessages();
			var myModel = this.getView().getModel("oFrontend");
			var aItems = myModel.getProperty("/Items");
			for (var j = 0; j < aItems.length; j++) {
				var sDocumentItem = myModel.getProperty("/Items/" + j + "/DocumentItem");
				if (myModel.getProperty("/Items/" + j + "/ManufactureDate_valueState") === sap.ui.core.ValueState.Error ||
					myModel.getProperty("/Items/" + j + "/ShelfLifeExpirationDate_valueState") === sap.ui.core.ValueState.Error
				) {
					var oMessage = new Message({
						message: this.getResourceBundle().getText("TITLE_ERROR_DETAILVIEW"),
						type: MessageType.Error,
						target: "Special Stock",
						processor: myModel,
						additionalText: this.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [sDocumentItem]),
						description: this.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [sDocumentItem])
					});
					sap.ui.getCore().getMessageManager().addMessages(oMessage);
				}
			}
		},
		/**
		 * public method
		 * @function event handler to change special stock type 
		 * @param oEvent Event object supplied by UI
		 */
		handleSpecialStockChange: function (oEvent) {
			var oItem = {};
			oItem = this.getView().getModel("oItem").getData();
			oItem.InventorySpecialStockType = oItem.SpecialStock_selectedKey;
			for (var x = 0; x < oItem.SpecialStock_input.length; x++) {
				if (oItem.SpecialStock_input[x].key === oItem.SpecialStock_selectedKey) {
					oItem.InventorySpecialStockTypeName = oItem.SpecialStock_input[x].text;
					break;
				}
			}
			if (oItem.InventorySpecialStockType === "E") {
				oItem.SalesOrder_editable = true;
				oItem.SalesOrder_inputMandatory = true;
				oItem.Lifnr_inputMandatory = false;
				oItem.Project_inputMandatory = false;
				oItem.SpecialStock_input_State = sap.ui.core.ValueState.None;
				oItem.SpecialStock_input_StateText = "";
				oItem.Lifnr_State = sap.ui.core.ValueState.None;
				oItem.Lifnr_StateText = "";
				sap.ui.getCore().getMessageManager().removeAllMessages();
			}
			if (oItem.InventorySpecialStockType === "Q") {
				oItem.Project_inputMandatory = true;
				oItem.SalesOrder_inputMandatory = false;
				oItem.Lifnr_inputMandatory = false;
				oItem.SpecialStock_input_State = sap.ui.core.ValueState.None;
				oItem.SpecialStock_input_StateText = "";
				oItem.Lifnr_State = sap.ui.core.ValueState.None;
				oItem.Lifnr_StateText = "";
				sap.ui.getCore().getMessageManager().removeAllMessages();
			}
			if (oItem.InventorySpecialStockType === "K") {
				oItem.Lifnr_inputMandatory = true;
				oItem.Project_inputMandatory = false;
				oItem.SalesOrder_inputMandatory = false;
				oItem.Lifname = "";
				oItem.Lifnr = "";
				oItem.SpecialStock_input_State = sap.ui.core.ValueState.None;
				oItem.SpecialStock_input_StateText = "";
				oItem.Lifnr_State = sap.ui.core.ValueState.None;
				oItem.Lifnr_StateText = "";
				sap.ui.getCore().getMessageManager().removeAllMessages();
				//No Reference Message Manager
				var aFilters = [];
				var sMaterial = this.getView().getModel("oItem").getProperty("/Material_Input");
				var oModel = this.getView().getModel("oItem");
				oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
				this.getView().setModel(oModel);
				aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, sMaterial));
				this.getOwnerComponent().getModel("oData").read("/MMIMSupplierMaterialVH", {
					filters: aFilters,
					success: jQuery.proxy(this._successSupplierLoad, this),
					error: jQuery.proxy(this._handleOdataError, this)
				});
			}
			if (oItem.InventorySpecialStockType === "") {
				oItem.SalesOrder_inputMandatory = false;
				oItem.Lifnr_inputMandatory = false;
				oItem.Project_inputMandatory = false;
				oItem.SpecialStock_input_State = sap.ui.core.ValueState.None;
				oItem.SpecialStock_input_StateText = "";
				oItem.Lifnr_State = sap.ui.core.ValueState.None;
				oItem.Lifnr_StateText = "";
				sap.ui.getCore().getMessageManager().removeAllMessages();
			}
			if (oItem.InventorySpecialStockType !== "E") {
				oItem.SalesOrder = "";
				oItem.SalesOrderItem = "";
			}
			if (oItem.InventorySpecialStockType !== "Q") {
				oItem.Project = "";
				oItem.ProjectDescription = "";
			}
			this.getView().getModel("oItem").setData(oItem);

			this._setGuidedTour();
			this.getView().byId("idInventorySpecialStockSelection").focus();
		},

		_successSupplierLoad: function (oData, oResponse) {
			var oItem = this.getView().getModel("oItem");

			if (oData.results.length <= 0) {
				oItem.setProperty("/SpecialStock_input_State", sap.ui.core.ValueState.Error);
				oItem.setProperty("/SpecialStock_input_StateText", this.getResourceBundle().getText("LABEL_LIFNR_NOFOUND"));
				oItem.setProperty("/Lifnr_State", sap.ui.core.ValueState.Error);
				oItem.setProperty("/Lifnr_StateText", this.getResourceBundle().getText("LABEL_LIFNR_NOFOUND2"));
				if (sap.ui.getCore().getMessageManager().getMessageModel().getData().length === 0) {
					var oMessage = new Message({
						message: this.getResourceBundle().getText("LABEL_LIFNR_NOFOUND"),
						type: MessageType.Error,
						target: "Special Stock",
						processor: oItem,
						additionalText: this.getResourceBundle().getText("LABEL_SPECIALSTOCK"),
						// description: this.getResourceBundle().getText("TEXT_LIFNR_NOFOUND")
					});
					sap.ui.getCore().getMessageManager().addMessages(oMessage);
					oMessage = new Message({
						message: this.getResourceBundle().getText("LABEL_LIFNR_NOFOUND2"),
						type: MessageType.Error,
						target: "Special Stock",
						processor: oItem,
						additionalText: this.getResourceBundle().getText("SUPPLIER"),
						description: this.getResourceBundle().getText("TEXT_LIFNR_NOFOUND")
					});
					sap.ui.getCore().getMessageManager().addMessages(oMessage);
				}
			} else {
				oItem.setProperty("/SpecialStock_input_State", sap.ui.core.ValueState.None);
				oItem.setProperty("/SpecialStock_input_StateText", "");
				oItem.setProperty("/Lifnr_State", sap.ui.core.ValueState.None);
				oItem.setProperty("/Lifnr_StateText", "");
			}
		},
		/**
		 * public method
		 * @function handler to F4-help for material
		 * @param oEvent Event object supplied by UI
		 */
		handleMaterialValueHelp: function (oEvent) {
			var that = this;
			var myEventSource = oEvent.getSource();
			var oParams = {};
			var sMaterial;
			var sMaterialName;
			var sPlant;
			var sUoM;
			var sStorageLocation;
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
				this._SelectedTableIndex = this._getSelectedItemInModel(oEvent);
				var oModel = this.getView().getModel("oFrontend");
				var aItems = oModel.getProperty("/Items");
				sMaterial = aItems[this._SelectedTableIndex].Material_Input;
				sMaterialName = aItems[this._SelectedTableIndex].Material_Name;
				sPlant = aItems[this._SelectedTableIndex].Plant;
				sUoM = aItems[this._SelectedTableIndex].DeliveredUnit_input;
				sStorageLocation = aItems[this._SelectedTableIndex].StorageLocation_input;
			} else { //S2 view
				var oItem = this.getModel("oItem");
				sMaterial = oItem.getProperty("/Material_Input");
				sMaterialName = oItem.getProperty("/Material_Name");
				sPlant = oItem.getProperty("/Plant");
				sUoM = oItem.DeliveredUnit_input;
				sStorageLocation = oItem.StorageLocation_input;
			}
			oParams.Material = sMaterialName;
			this._oValueHelpController.displayValueHelpMaterialGeneral(oParams, function (oReturn) {
				that._handleMaterialValueHelpCallback(oReturn);
				//needed to manually sync UI  with model in case user changed input without enter/tab event 
				if (myEventSource.getValue() !== oReturn.MaterialName && oReturn.selected === true) {
					myEventSource.setValue(oReturn.MaterialName);
				}
			});
		},
		/**
		 * public method
		 * @function event handler call back for F4-Help of material
		 * @param oEvent Event object supplied by UI
		 */
		_handleMaterialValueHelpCallback: function (oReturn) { // callback function
			var bSelectEnabled = false;
			var sMaterial;
			var sPlant;
			var sUoM;
			var sStorageLocation;
			var sStockTypekey;
			var sValueState = sap.ui.core.ValueState.None;
			var oSpecialStock;
			if (oReturn.selected === true) {
				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
					var oModel = this.getView().getModel("oFrontend");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input", oReturn.Material);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Name", oReturn.MaterialName);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", sap.ui.core.ValueState.None);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueStateText", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Plant", oReturn.Plant);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_input", oReturn.PlantName);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_valueState", sap.ui.core.ValueState.None);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_valueStateText", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Batch", "");
					// special stock consigment "K", after material change, this kind special stock shall be re-assigned 
					// the current "K" related data shall be clear
					if (oModel.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey") === "K") {
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr", "");
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifname", "");
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_State", sap.ui.core.ValueState.None);
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_StateText", "");
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input_State", sap.ui.core.ValueState.None);
						var myItem = oModel.getProperty("/Items/" + this._SelectedTableIndex);
						if (myItem.SpecialStock_input.length > 0) {
							for (var x = 0; x < myItem.SpecialStock_input.length; x++) {
								if (myItem.SpecialStock_input[x].key === "") {
									var sInventorySpecialStockTypeName = myItem.SpecialStock_input[x].text;
									break;
								}
							}
							oModel.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey", "");
							oModel.setProperty("/Items/" + this._SelectedTableIndex + "/InventorySpecialStockTypeName", sInventorySpecialStockTypeName);
							oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_inputMandatory", false);
						}
					}
					this._setValueStateMandatoryFields(oModel.getProperty("/Items/" + this._SelectedTableIndex));
					//Mandantory field with ValueState Updating
					if (oReturn.Material === "") {
						sValueState = sap.ui.core.ValueState.Error;
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", sValueState);
					} else {
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", sValueState);
					}
					//Special Stock Key Assignment
					if (oModel.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input") === undefined) {
						oSpecialStock = oModel.getProperty("/SpecialStock_input");
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input", oSpecialStock);
					}
					// Updating of Material, in the case of existing Plant input, the control fields shall be fetching againg.
					sMaterial = oReturn.Material;
					sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
					sUoM = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
					sStorageLocation = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation");
					sStockTypekey = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/StockType_selectedKey");
				} else {
					var oFrontModel = this.getView().getModel("oFrontend");
					var oItem = this.getView().getModel("oItem");
					oItem.setProperty("/Material_Input", oReturn.Material);
					oItem.setProperty("/Material_Name", oReturn.MaterialName);
					oItem.setProperty("/Material_Input_valueState", sap.ui.core.ValueState.None);
					oItem.setProperty("/Material_Input_valueStateText", "");
					oItem.setProperty("/Plant", oReturn.Plant);
					oItem.setProperty("/Plant_input", oReturn.PlantName);
					oItem.setProperty("/Plant_valueState", sap.ui.core.ValueState.None);
					oItem.setProperty("/Plant_valueStateText", "");
					oItem.setProperty("/Batch", "");
					// special stock consigment "K", after material change, this kind special stock shall be re-assigned 
					// the current "K" related data shall be clear
					if (oItem.getProperty("/SpecialStock_selectedKey") === "K") {
						oItem.setProperty("/Lifnr", "");
						oItem.setProperty("/Lifname", "");
						oItem.setProperty("/Lifnr_State", sap.ui.core.ValueState.None);
						oItem.setProperty("/Lifnr_StateText", "");
						oItem.setProperty("/SpecialStock_input_State", sap.ui.core.ValueState.None);
						var myItem = oItem.getData();
						if (myItem.SpecialStock_input !== undefined && myItem.SpecialStock_input.length > 0) {
							for (var x = 0; x < myItem.SpecialStock_input.length; x++) {
								if (myItem.SpecialStock_input[x].key === "") {
									var sInventorySpecialStockTypeName = myItem.SpecialStock_input[x].text;
									break;
								}
							}
							oItem.setProperty("/SpecialStock_selectedKey", "");
							oItem.setProperty("/InventorySpecialStockTypeName", sInventorySpecialStockTypeName);
							oItem.setProperty("/Lifnr_inputMandatory", false);
						}
					}
					//Mandantory field with ValueState Updating
					if (oReturn.Material === "") {
						sValueState = sap.ui.core.ValueState.Error;
						oItem.setProperty("/Material_Input_valueState", sValueState);
					} else {
						oItem.setProperty("/Material_Input_valueState", sValueState);
					}
					this.getView().byId("idQuantity").focus();
					//Special Stock Key Assignment
					if (oItem.getProperty("/SpecialStock_input") === undefined) {
						oSpecialStock = oFrontModel.getProperty("/SpecialStock_input");
						oItem.setProperty("/SpecialStock_input", oSpecialStock);
					}

					// Updating of Material, in the case of existing Plant input, the control fields shall be fetching againg.
					sMaterial = oReturn.Material;
					sPlant = oItem.getProperty("/Plant");
					sUoM = oItem.getProperty("/DeliveredUnit_input");
					sStorageLocation = oItem.getProperty("/StorageLocation");
					sStockTypekey = oItem.getProperty("/StockType_selectedKey");
				}
				// Material related master data buffer in library project updating
				this._oValueHelpController.fillBufferForMaterialExpanded(oReturn, this._validationCallbBack, this);
				// Validation of the exiting material and material related master data 
				this._handleValidationMasterData(sMaterial, sUoM, sPlant, sStorageLocation, this._SelectedTableIndex);
				// Updating of Material, in the case of existing Plant input, the control fields shall be fetching againg.
				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
					oModel = this.getView().getModel("oFrontend");
					sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
				} else {
					oItem = this.getView().getModel("oItem");
					sPlant = oItem.getProperty("/Plant");
				}
				this._getControlFields(sMaterial, sPlant, this._SelectedTableIndex, sStockTypekey);
			}
		},
		/**
		 * public method
		 * @function event handler for F4-help of Plant
		 * @param oEvent Event object supplied by UI
		 */
		handlePlantHelp: function (oEvent) {
			var that = this;
			var oParams = {};
			var sMaterial;
			var sPlant;
			var sUoM;
			var sStorageLocation;
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
				this._SelectedTableIndex = this._getSelectedItemInModel(oEvent);
				var oModel = this.getView().getModel("oFrontend");
				var aItems = oModel.getProperty("/Items");
				sMaterial = aItems[this._SelectedTableIndex].Material_Input;
				sPlant = aItems[this._SelectedTableIndex].Plant;
				sUoM = aItems[this._SelectedTableIndex].DeliveredUnit_input;
				sStorageLocation = aItems[this._SelectedTableIndex].StorageLocation_input;
			} else {
				var oItem = this.getModel("oItem");
				// this._SelectedTableIndex = this._getSelectedItemInModel(oEvent);
				sMaterial = oItem.getProperty("/Material_Input");
				sPlant = oItem.getProperty("/Plant");
				sUoM = oItem.DeliveredUnit_input;
				sStorageLocation = oItem.StorageLocation_input;
			} //S2 view
			oParams.Material = sMaterial;
			oParams.Plant = sPlant;
			oParams.UoM = sUoM;
			oParams.StorageLocation = sStorageLocation;
			this._oValueHelpController.displayValueHelpPlant4Material(oParams, function (oReturn) {
				that._handlePlantValueHelpCallback(oReturn);
			}, that);
		},
		/**
		 * private method
		 * @function event handler call back for F4-help of Plant
		 * @param oEvent Event object supplied by UI
		 */
		_handlePlantValueHelpCallback: function (oReturn) { // callback function
			var bSelectEnabled = false;
			var oMaterial;
			var sUoM;
			var sPlant;
			var sStorageLocation;
			var sStockTypekey;
			if (oReturn.selected === true) {
				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
					var oModel = this.getView().getModel("oFrontend");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Plant", oReturn.Plant);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_input", oReturn.PlantName);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Batch", "");
					// special stock consigment "K", after plant change, this kind special stock shall be re-assigned 
					// the current "K" related data shall be clear
					if (oModel.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey") === "K") {
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr", "");
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifname", "");
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_State", sap.ui.core.ValueState.None);
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_StateText", "");
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input_State", sap.ui.core.ValueState.None);
						var myItem = oModel.getProperty("/Items/" + this._SelectedTableIndex);
						if (myItem.SpecialStock_input !== undefined && myItem.SpecialStock_input.length > 0) {
							for (var x = 0; x < myItem.SpecialStock_input.length; x++) {
								if (myItem.SpecialStock_input[x].key === "") {
									var sInventorySpecialStockTypeName = myItem.SpecialStock_input[x].text;
									break;
								}
							}
							oModel.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey", "");
							oModel.setProperty("/Items/" + this._SelectedTableIndex + "/InventorySpecialStockTypeName", sInventorySpecialStockTypeName);
							oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_inputMandatory", false);
						}
					}
					//fetching the control fields
					oMaterial = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Material_Input");
					sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
					sUoM = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
					sStorageLocation = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation");
					sStockTypekey = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/StockType_selectedKey");
				} else {
					var oItem = this.getView().getModel("oItem");
					oItem.setProperty("/Plant", oReturn.Plant);
					oItem.setProperty("/Plant_input", oReturn.PlantName);
					oItem.setProperty("/Batch", "");
					// special stock consigment "K", after plant change, this kind special stock shall be re-assigned 
					// the current "K" related data shall be clear
					if (oItem.getProperty("/SpecialStock_selectedKey") === "K") {
						oItem.setProperty("/Lifnr", "");
						oItem.setProperty("/Lifname", "");
						oItem.setProperty("/Lifnr_State", sap.ui.core.ValueState.None);
						oItem.setProperty("/Lifnr_StateText", "");
						oItem.setProperty("/SpecialStock_input_State", sap.ui.core.ValueState.None);
						var myItem = oItem.getData();
						if (myItem.SpecialStock_input !== undefined && myItem.SpecialStock_input.length > 0) {
							for (var x = 0; x < myItem.SpecialStock_input.length; x++) {
								if (myItem.SpecialStock_input[x].key === "") {
									var sInventorySpecialStockTypeName = myItem.SpecialStock_input[x].text;
									break;
								}
							}
							oItem.setProperty("/SpecialStock_selectedKey", "");
							oItem.setProperty("/InventorySpecialStockTypeName", sInventorySpecialStockTypeName);
							oItem.setProperty("/Lifnr_inputMandatory", false);
						}
					}
					//fetching the control fields
					oMaterial = oItem.getProperty("/Material_Input");
					sPlant = oItem.getProperty("/Plant");
					sUoM = oItem.getProperty("/DeliveredUnit_input");
					sStorageLocation = oItem.getProperty("/StorageLocation");
					sStockTypekey = oItem.getProperty("/StockType_selectedKey");
				}
				// Validation of the exiting material and material related master data 
				this._handleValidationMasterData(oMaterial, sUoM, sPlant, sStorageLocation, this._SelectedTableIndex);
				if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
					oModel = this.getView().getModel("oFrontend");
					sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
				} else {
					oItem = this.getView().getModel("oItem");
					sPlant = oItem.getProperty("/Plant");
				}
				this._getControlFields(oMaterial, oReturn.Plant, this._SelectedTableIndex, sStockTypekey);
			}
		},
		/**
		 * public method
		 * @function handler handle the type ahead search of material
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleMaterialSuggest: function (oEvent) {
			var sTerm = oEvent.getParameter("suggestValue").trim().toUpperCase(); //Remove spaces of the imported string;
			var oOrFilter = {};
			var aOrFilters = [];
			// type or link of material and materialname
			aOrFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, sTerm));
			aOrFilters.push(new sap.ui.model.Filter("MaterialName", sap.ui.model.FilterOperator.Contains, sTerm));
			oOrFilter = new sap.ui.model.Filter(aOrFilters, false);

			if (!oEvent.getSource().getBinding("suggestionItems")) {
				oEvent.getSource().bindAggregation("suggestionItems", {
					path: "/MaterialHelps",
					model: "oDataHelp",
					template: new sap.ui.core.ListItem({
						additionalText: "{oDataHelp>Material}",
						text: "{oDataHelp>MaterialName}"
					})
				});
			}
			oEvent.getSource().getBinding("suggestionItems").filter(oOrFilter);
		},

		/**
		 * public method
		 * @function handler of the type ahead selection event for material field
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleSuggestionMaterialSelected: function (oEvent) {
			// oEvent.getSource().setValue(oEvent.getParameter("selectedItem").getText());
			var sMaterial;
			var sMaterialName;
			var sPlant;
			var bSelectEnabled;
			var sUoM;
			var sStorageLocation;
			var sStockStypeKey;
			var oSpecialStock;
			var sValueState = sap.ui.core.ValueState.None;
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
				this._SelectedTableIndex = this._getSelectedItemInModel(oEvent);
				var oModel = this.getView().getModel("oFrontend");
				var aItems = oModel.getProperty("/Items");
				sMaterialName = oEvent.getParameter("selectedItem").getText();
				sMaterial = oEvent.getParameter("selectedItem").getAdditionalText();
				sPlant = sPlant = aItems[this._SelectedTableIndex].Plant;
				oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Name", sMaterialName);
				oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input", sMaterial);
				oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", sap.ui.core.ValueState.None);
				oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueStateText", "");
				oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Batch", "");
				// special stock consigment "K", after material change, this kind special stock shall be re-assigned 
				// the current "K" related data shall be clear
				if (oModel.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey") === "K") {
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifname", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_State", sap.ui.core.ValueState.None);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_StateText", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input_State", sap.ui.core.ValueState.None);
					var myItem = oModel.getProperty("/Items/" + this._SelectedTableIndex);
					if (myItem.SpecialStock_input !== undefined && myItem.SpecialStock_input.length > 0) {
						for (var x = 0; x < myItem.SpecialStock_input.length; x++) {
							if (myItem.SpecialStock_input[x].key === "") {
								var sInventorySpecialStockTypeName = myItem.SpecialStock_input[x].text;
								break;
							}
						}
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey", "");
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/InventorySpecialStockTypeName", sInventorySpecialStockTypeName);
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_inputMandatory", false);
					}
				}
				// get actual material and material related master data in item
				sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
				sUoM = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
				sStorageLocation = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation");
				sStockStypeKey = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/StockType_selectedKey");
				//Special Stock Key Assignment
				if (oModel.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input") === undefined) {
					oSpecialStock = oModel.getProperty("/SpecialStock_input");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input", oSpecialStock);
				}
				//Mandantory field with ValueState Updating
				if (oEvent.getParameter("valid") === false || oEvent.getParameters().value === "") {
					sValueState = sap.ui.core.ValueState.Error;
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", sValueState);
				} else {
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", sValueState);
				}
			} else { // view S2
				var oItem = this.getView().getModel("oItem");
				var oFrontModel = this.getView().getModel("oFrontend");
				sMaterialName = oEvent.getParameter("selectedItem").getText();
				sMaterial = oEvent.getParameter("selectedItem").getAdditionalText();
				oItem.setProperty("/Material_Input", sMaterial);
				oItem.setProperty("/Material_Name", sMaterialName);
				oItem.setProperty("/Material_Input_valueState", sap.ui.core.ValueState.None);
				oItem.setProperty("/Material_Input_valueStateText", "");
				oItem.setProperty("/Batch", "");
				// special stock consigment "K", after material change, this kind special stock shall be re-assigned 
				// the current "K" related data shall be clear
				if (oItem.setProperty("/SpecialStock_selectedKey") === "K") {
					oItem.setProperty("/Lifnr", "");
					oItem.setProperty("/Lifname", "");
					oItem.setProperty("/Lifnr_State", sap.ui.core.ValueState.None);
					oItem.setProperty("/Lifnr_StateText", "");
					oItem.setProperty("/SpecialStock_input_State", sap.ui.core.ValueState.None);
					var myItem = oItem.getData();
					if (myItem.SpecialStock_input !== undefined && myItem.SpecialStock_input.length > 0) {
						for (var x = 0; x < myItem.SpecialStock_input.length; x++) {
							if (myItem.SpecialStock_input[x].key === "") {
								var sInventorySpecialStockTypeName = myItem.SpecialStock_input[x].text;
								break;
							}
						}
						oItem.setProperty("/SpecialStock_selectedKey", "");
						oItem.setProperty("/InventorySpecialStockTypeName", sInventorySpecialStockTypeName);
						oItem.setProperty("/Lifnr_inputMandatory", false);
					}
				}
				//Special Stock Key Assignment
				if (oItem.getProperty("/SpecialStock_input") === undefined) {
					oSpecialStock = oFrontModel.getProperty("/SpecialStock_input");
					oItem.setProperty("/SpecialStock_input", oSpecialStock);
				}
				// get actual material and material related master data in item
				sPlant = oItem.getProperty("/Plant");
				sUoM = oItem.getProperty("/DeliveredUnit_input");
				sStorageLocation = oItem.getProperty("/StorageLocation");
				sStockStypeKey = oItem.getProperty("/StockType_selectedKey");
				//Mandantory field with ValueState Updating
				if (oEvent.getParameter("valid") === false || oEvent.getParameters().value === "") {
					sValueState = sap.ui.core.ValueState.Error;
					oItem.setProperty("/Material_Input_valueState", sValueState);
				} else {
					oItem.setProperty("/Material_Input_valueState", sValueState);
				}
				this._setValueStateMandatoryFields(oItem.getData());
				// Updating of Material, in the case of existing Plant input, the control fields shall be fetching againg.
				sPlant = oItem.getProperty("/Plant");
			}
			// Validation of the exiting material and material related master data 
			this._handleValidationMasterData(sMaterial, sUoM, sPlant, sStorageLocation, this._SelectedTableIndex);
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
				sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
			} else {
				sPlant = oItem.getProperty("/Plant");
			}
			//Guided Tour
			this._getControlFields(sMaterial, sPlant, this._SelectedTableIndex, sStockStypeKey);

		},
		/**
		 * private method
		 * @function to fetch control fields based on custermizing setting in backend system and 
		 * and input fields "material", "plant", "stock type"
		 * @param (string) material number
		 * @param (string) plant number
		 * @param (string) aktuell editing item index 
		 * @param (string) stock type of editing item
		 */
		_getControlFields: function (oMaterial, oPlant, iSelectedTableIndex, iStockType) {
			if (iStockType === undefined || iStockType === "" || iStockType === 0) {
				iStockType = 0;
			} else {
				iStockType = iStockType - 1;
			}
			/**
			 * public method
			 * @function event handler for F4-help of Plant
			 * @param oEvent Event object supplied by UI
			 */
			this.getOwnerComponent().getModel("oData").callFunction('/MatlPlntControlDpdtFields', {
				method: 'GET',
				urlParameters: {
					Material: oMaterial,
					Plant: oPlant,
					SourceOfGR: this._SourceOfGR
				},
				success: jQuery.proxy(this._successControlFieldsLoad, this, iSelectedTableIndex, iStockType),
				error: jQuery.proxy(this._handleOdataError, this)
			});
		},
		/**
		 * Proxy of successfull load of Control Fields based on the Input "Material"  "Plant" "Stock Type"
		 * @private method
		 * @param {string} editing item index
		 * @param {string} editing stock type in item
		 * @param {Object} oData Result of the oData request (function import to fetch control fields)
		 * @param {Object} oResponse Response of the oData request (calculated production date)
		 */
		_successControlFieldsLoad: function (iSelectedTableIndex, iStockType, oData, oResponse) {
			var oModel = this.getView().getModel("oFrontend");
			var aItems = oModel.getProperty("/Items");
			var oStockType_input = new Array();
			var bIsConsistent;
			var iBatchVisible;

			if (oData.results[0]) { //prerquisite only one line is filled
				for (var j = 0; j < oData.results.length; j++) {
					oStockType_input.push({
						key: oData.results[j].StockType,
						text: oData.results[j].StockTypeName,
						ControlOfBatchTableField: oData.results[j].ControlOfBatchTableField,
						ControlOfReasonCodeTableField: oData.results[j].ControlOfReasonCodeTableField,
						ControlOfExpirationDate: oData.results[j].ControlOfExpirationDate,
						ControlOfManufactureDate: oData.results[j].ControlOfManufactureDate,
						StorLocAutoCreationIsAllowed: oData.results[j].StorLocAutoCreationIsAllowed
					});
				}
			} else {
				oStockType_input.push({
					key: "",
					text: "",
					ControlOfBatchTableField: "00000",
					ControlOfReasonCodeTableField: "00000",
					ControlOfExpirationDate: "00000",
					ControlOfManufactureDate: "00000",
					StorLocAutoCreationIsAllowed: "00000"
				});
			}
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") { //S2 view
				// in S2 view the select property of sub(items) is handled after nav back 
				var oItem = this.getView().getModel("oItem").getData();
				if (oData.results[iStockType] !== undefined) {
					this._evaluateFieldControl("Batch", oData.results[iStockType].ControlOfBatchTableField, oItem);
					this._evaluateFieldControl("GoodsMovementReasonCode", oData.results[iStockType].ControlOfReasonCodeTableField, oItem);
					this._evaluateFieldControl("ShelfLifeExpirationDate", oData.results[iStockType].ControlOfExpirationDate, oItem);
					this._evaluateFieldControl("ManufactureDate", oData.results[iStockType].ControlOfManufactureDate, oItem);
				}
				this.getView().getModel("oItem").setProperty("/StockType_input", oStockType_input);

				//set Column visibility
				if (oItem.BatchVisible === true) { //1 Batch Visible => column must be visible
					this.getView().getModel("oItem").setProperty("/ColumnBatchVisible", true);
					this.getView().getModel("oItem").setProperty("/BatchVisible", true);
				} else {
					this.getView().getModel("oItem").setProperty("/ColumnBatchVisible", false);
					this.getView().getModel("oItem").setProperty("/Batch_valueState", sap.ui.core.ValueState.None);
				}
				//Shelf Life
				if (oItem.ManufactureDateVisible === true) {
					this.getView().getModel("oItem").setProperty("/ColumnManufactureDateVisible", true);
				} else {
					this.getView().getModel("oItem").setProperty("/ColumnManufactureDateVisible", false);
					this.getView().getModel("oItem").setProperty("/ManufactureDate_valueState", sap.ui.core.ValueState.None);
				}
				if (oItem.ShelfLifeExpirationDateVisible === true) {
					this.getView().getModel("oItem").setProperty("/ColumnShelfLifeExpirationDateVisible", true);
				} else {
					this.getView().getModel("oItem").setProperty("/ColumnShelfLifeExpirationDateVisible", false);
					this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None);
				}
				// this._setValueStateMandatoryFields(oItem);
				this.getView().getModel("oItem").setData(oItem);
				this._setReasonCodeFilter(oItem);
				// this._setGuidedTour(this._SelectedTableIndex);

			} else { //S1 v
				this.getView().getModel("oFrontend").setProperty("/Items/" + iSelectedTableIndex + "/StockType_input", oStockType_input);
				// Initial control fields state based on Inputs "Material","Plant"
				if (oData.results[iStockType] !== undefined) {
					this._evaluateFieldControl("Batch", oData.results[iStockType].ControlOfBatchTableField, aItems[iSelectedTableIndex]);
					this._evaluateFieldControl("GoodsMovementReasonCode", oData.results[iStockType].ControlOfReasonCodeTableField, aItems[
						iSelectedTableIndex]);
					this._evaluateFieldControl("ShelfLifeExpirationDate", oData.results[iStockType].ControlOfExpirationDate, aItems[
						iSelectedTableIndex]);
					this._evaluateFieldControl("ManufactureDate", oData.results[iStockType].ControlOfManufactureDate, aItems[iSelectedTableIndex]);
				}
				//set Column visibility
				if (aItems[iSelectedTableIndex].ManufactureDateVisible === true) { //1 ManufactureDate Visible => column must be visible
					this.getView().getModel("oFrontend").setProperty("/ColumnManufactureDateVisible", true);
				} else {
					this.getView().getModel("oFrontend").setProperty("/ColumnManufactureDateVisible", false);
					this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/ManufactureDate_valueState", sap.ui.core
						.ValueState.None);
				};

				if (aItems[iSelectedTableIndex].ShelfLifeExpirationDateVisible === true) { //1 Batch Visible => column must be visible
					this.getView().getModel("oFrontend").setProperty("/ColumnShelfLifeExpirationDateVisible", true);
				} else {
					this.getView().getModel("oFrontend").setProperty("/ColumnShelfLifeExpirationDateVisible", false);
					this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/ShelfLifeExpirationDate_valueState",
						sap.ui.core.ValueState.None);
				};
				sap.ui.getCore().getMessageManager().removeAllMessages();
				for (var j = 0; j < aItems.length; j++) {
					var sDocumentItem = oModel.getProperty("/Items/" + j + "/DocumentItem");
					if (oModel.getProperty("/Items/" + j + "/ManufactureDate_valueState") === sap.ui.core.ValueState.Error ||
						oModel.getProperty("/Items/" + j + "/ShelfLifeExpirationDate_valueState") === sap.ui.core.ValueState.Error
					) {
						var oMessage = new Message({
							message: this.getResourceBundle().getText("TITLE_ERROR_DETAILVIEW"),
							type: MessageType.Error,
							target: "Special Stock",
							processor: oModel,
							additionalText: this.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [sDocumentItem]),
							description: this.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [sDocumentItem])
						});
						sap.ui.getCore().getMessageManager().addMessages(oMessage);
					}
				}
				if (aItems[iSelectedTableIndex].BatchVisible === true) { //1 Batch Visible => column must be visible
					this.getView().getModel("oFrontend").setProperty("/ColumnBatchVisible", true);
				} else {
					for (var j = 0; j < aItems.length; j++) {
						this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/BatchVisible", false);
						if (aItems[j].BatchVisible === true) {
							iBatchVisible = true;
							return;
						}
					}
					if (iBatchVisible === true) {
						this.getView().getModel("oFrontend").setProperty("/ColumnBatchVisible", false);
						this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/Batch_valueState", sap.ui.core.ValueState
							.None);
					}
				};
				oItem = oModel.getProperty("/Items/" + iSelectedTableIndex);
				this._setValueStateMandatoryFields(oItem);
				oModel.setProperty("/Items/" + iSelectedTableIndex, oItem);
				// this._setGuidedTour(this._SelectedTableIndex);
				//take care of select for (sub)items
				this._setSelectEnabled(oModel.getProperty("/Items/" + this._SelectedTableIndex));
				this._controlSelectAllAndPostButton(); //update buttons
				this._updateHiglightProperty(); //update highlight
			}
		},
		/**
		 * privat method
		 * send aktuelle input fields (material, unit of measurment, plant, storage location, actual item index) 
		 * to the method validateMasterData  in "mm.im.lib.materialmaster", in order to verify whether these 
		 * input fields combination is valid or not
		 * @private method
		 * @param {string} editing item index
		 * @param {string} material number
		 * @param {string} unit of measurement
		 * @param {string} plant number
		 * @param {string} storage location
		 */
		_handleValidationMasterData: function (sMaterial, sUoM, sPlant, sStorageLocation, iSelectedTableIndex) {
			var oReturn = {};
			var bSelectEnabled;
			this._SelectedTableIndex = iSelectedTableIndex;
			this._oValueHelpController.validateMasterData(sMaterial, sUoM, sPlant, sStorageLocation, this._validationCallbBack, this);
		},
		/**
		 * privat method
		 * call back function and receive the validation result of material 
		 * master data (material, plant, UOM and Storage Location)
		 * @private method
		 * @param {object} oReturn contains boolean information for material master fields
		 */
		_validationCallbBack: function (oReturn) {
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
				var oModel = this.getView().getModel("oFrontend");
				if (oReturn.bMaterialIsValid !== true) {
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", sap.ui.core.ValueState.Error);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueStateText", "");
				}
				if (oReturn.bUoMIsValid !== true) {
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input", "");
				}
				if (oReturn.bPlantIsValid !== true) {
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Plant", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_input", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_valueState", sap.ui.core.ValueState.None);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_valueStateText", "");
				}
				if (oReturn.bStorageLocationIsValid !== true) {
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation_input", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation_valueState", sap.ui.core.ValueState.None);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation_valueStateText", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/BatchEditable", false);
				}
			} else {
				var oItem = this.getView().getModel("oItem");
				if (oReturn.bMaterialIsValid !== true) {
					oItem.setProperty("/Material_Input", "");
					oItem.setProperty("/Material_Input_valueState", sap.ui.core.ValueState.Error);
					oItem.setProperty("/Material_Input_valueStateText", "");
				}
				if (oReturn.bUoMIsValid !== true) {
					oItem.setProperty("/DeliveredUnit_input", "");
				}
				if (oReturn.bPlantIsValid !== true) {
					oItem.setProperty("/Plant", "");
					oItem.setProperty("/Plant_input", "");
					oItem.setProperty("/Plant_valueState", sap.ui.core.ValueState.None);
					oItem.setProperty("/Plant_valueStateText", "");
				}
				if (oReturn.bStorageLocationIsValid !== true) {
					oItem.setProperty("/StorageLocation", "");
					oItem.setProperty("/StorageLocation_input", "");
					oItem.setProperty("/StorageLocation_valueState", sap.ui.core.ValueState.None);
					oItem.setProperty("/StorageLocation_valueStateText", "");
					oItem.setProperty("/BatchEditable", false);
				}
			}
			this._setGuidedTour(this._SelectedTableIndex);
		},
		/**
		 * privat method
		 * to define the input fieds Material, Quantity/UoM, Plant... shall be open for editing step by step
		 * in the both view S1 and S2
		 * to define the focus of the above fields shall be moved with certain sequence
		 * to check whether item input is consistant or not, as well as decide the related Post button 
		 * and Apply button is aktiv or not
		 * master data (material, plant, UOM and Storage Location)
		 * @private method
		 * @param {string} actual editing item index
		 */
		_setGuidedTour: function (sSelectedTableIndex) {
			var bSelectEnabled;
			var oFrontendModel = this.getModel("oFrontend");
			var sMaterial;
			var sQuantity;
			var sAUM;
			var sPlant;
			var sStorageLocation;
			var bMandantory;
			var sIsModelConsistant = true;
			var sValidation;
			var aStorageLocationCollection;
			var BufferedMaterial;

			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
				var oModel = this.getView().getModel("oFrontend");
				// BufferedMaterial = this._oValueHelpController.getBufferOfMaterial(oModel.getProperty("/Items/" + this._SelectedTableIndex +
				// 	"/Material_Input"));
				// sMaterial = BufferedMaterial.Material;
				// sAUM = BufferedMaterial.AUoM;
				// sPlant = BufferedMaterial.Plant;
				// sStorageLocation = BufferedMaterial.StorageLocation;
				var aItems;
				aItems = oModel.getProperty("/Items");
				var aTableCells = this.getView().byId("idProductsTable").getItems();
				for (var i = 0; i < aItems.length; i++) {
					if (oModel.getProperty("/Items/" + i + "/Material_Input") !== "") {
						BufferedMaterial = this._oValueHelpController.getBufferOfMaterial(oModel.getProperty("/Items/" + i +
							"/Material_Input"));
						sMaterial = BufferedMaterial.Material;
						sAUM = BufferedMaterial.AUoM;
						sPlant = BufferedMaterial.Plant;
						sStorageLocation = BufferedMaterial.StorageLocation;
						oModel.setProperty("/Items/" + i + "/DeliveredQuantityEditable", true);
						if (sAUM.AUoMCollection.length === 1) { //if one BaseUnit in Dialog
							oModel.setProperty("/Items/" + i + "/DeliveredUnit_input", BufferedMaterial.AUoM.AUoMCollection[0].BaseUnit);
						}
						oModel.setProperty("/Items/" + i + "/DeliveredUnitEditable", true);
						if (oModel.getProperty("/Items/" + i + "/DeliveredQuantity_input") !== 0) {
							if (oModel.getProperty("/Items/" + i + "/DeliveredUnit_input") !== "") {
								if (sPlant.PlantCollection.length === 1) { //if only one Plant in ValueHelpDialog
									oModel.setProperty("/Items/" + i + "/Plant_input", BufferedMaterial.Plant.PlantCollection[0].PlantName);
									oModel.setProperty("/Items/" + i + "/Plant", BufferedMaterial.Plant.PlantCollection[0].Plant);
									this._getControlFields(oModel.getProperty("/Items/" + i + "/Material_Input"), BufferedMaterial.Plant.PlantCollection[0].Plant,
										i, "");
								}
								oModel.setProperty("/Items/" + i + "/Plant_input_editable", true);
								if (oModel.getProperty("/Items/" + i + "/Plant_input") !== "") {
									aStorageLocationCollection = sStorageLocation[oModel.getProperty("/Items/" + i + "/Plant")].StorageLocationCollection;
									var iAutoCreationCount = 0;
									var iLastAutoCreationIndex = 0;
									//check after plant is changed, whether the existing storage location is still valid. Start
									if (oModel.getData().Items[0].StorageLocation !== "") {
										var IsValidStorageLocation = false;
										for (var s = 0; s < aStorageLocationCollection.length; s++) {
											if (oModel.getProperty("/Items/" + i + "/StorageLocation_input") === aStorageLocationCollection[s].StorageLocationName) {
												if (oModel.getProperty("/Items/" + i + "/StorageLocation") === aStorageLocationCollection[s].StorageLocation) {
													IsValidStorageLocation = true;
												}
											}
										}
										if (IsValidStorageLocation === false) {
											oModel.setProperty("/Items/" + i + "/StorageLocation", "");
											oModel.setProperty("/Items/" + i + "/StorageLocation_input", "");
											oModel.setProperty("/Items/" + i + "/StorageLocation_valueState", sap.ui.core.ValueState.None);
											oModel.setProperty("/Items/" + i + "/StorageLocation_valueStateText", "");
										}
										//check after plant is changed, whether the existing storage location is still valid. End
									}
									//User-friendly automaitc Storage location suggestion for the case--existing only single availabe storage Location start
									if (oModel.getData().Items[0].StorageLocation === "") {
										for (var s = 0; s < aStorageLocationCollection.length; s++) {
											var sStorLocAutoCreationIsNotAllowed = aStorageLocationCollection[s].StorLocAutoCreationIsAllowed;
											if (sStorLocAutoCreationIsNotAllowed === false) {
												iAutoCreationCount++;
												iLastAutoCreationIndex = s;
											}
										}
										if (iAutoCreationCount === 1) { //only one non-derived Storage location
											oModel.setProperty("/Items/" + i + "/StorageLocation_input", aStorageLocationCollection[iLastAutoCreationIndex].StorageLocationName);
											oModel.setProperty("/Items/" + i + "/StorageLocation", aStorageLocationCollection[iLastAutoCreationIndex].StorageLocation);
											this._getControlFields(oModel.getProperty("/Items/" + i + "/Material_Input"), oModel.getProperty("/Items/" + i +
												"/Plant"), i, "");
										} else if (iAutoCreationCount === 0 && aStorageLocationCollection.length === 1) { //only one derived Storage location!
											oModel.setProperty("/Items/" + i + "/StorageLocation_input", aStorageLocationCollection[0].StorageLocationName);
											oModel.setProperty("/Items/" + i + "/StorageLocation", aStorageLocationCollection[0].StorageLocation);
											this._getControlFields(oModel.getProperty("/Items/" + i + "/Material_Input"), oModel.getProperty("/Items/" + i +
												"/Plant"), i, "");
										}
									}
									//User-friendly automaitc Storage location suggestion for the case--existing only single availabe storage Location End
									oModel.setProperty("/Items/" + i + "/StorageLocationEditable", true);
									if (oModel.getProperty("/Items/" + i + "/StorageLocation_input") !== "") {
										oModel.setProperty("/Items/" + i + "/StockTypeNOREFEnabled", true);
										oModel.setProperty("/Items/" + i + "/SpecialStockSelection_Visible", true);
										oModel.setProperty("/Items/" + i + "/BatchEditable", true);
									} else {
										oModel.setProperty("/Items/" + i + "/BatchEditable", false);
									}
								} else {
									oModel.setProperty("/Items/" + i + "/StorageLocationEditable", false);

								}
							} else {
								oModel.setProperty("/Items/" + i + "/Plant_input_editable", false);
								oModel.setProperty("/Items/" + i + "/StorageLocationEditable", false);
							}
						} else {
							oModel.setProperty("/Items/" + i + "/Plant_input_editable", false);
							oModel.setProperty("/Items/" + i + "/StorageLocationEditable", false);
						}
					}
					this._setValueStateMandatoryFields(oModel.getProperty("/Items/" + i));
				}
				//set focus for the guided tour
				var sIndex = sSelectedTableIndex + 0;
				if (oModel.getProperty("/Items/" + sSelectedTableIndex + "/Material_Input") !== "") {
					aTableCells[sIndex].getCells()[8].getContent()[0].focus();
					if (oModel.getProperty("/Items/" + sSelectedTableIndex + "/DeliveredQuantity_input") !== 0) {
						aTableCells[sIndex].getCells()[8].getContent()[1].focus();
						if (oModel.getProperty("/Items/" + sSelectedTableIndex + "/DeliveredUnit_input") !== "") {
							aTableCells[sIndex].getCells()[10].focus();
							if (oModel.getProperty("/Items/" + sSelectedTableIndex + "/Plant_input") !== "") {
								aTableCells[sIndex].getCells()[12].focus();
								if (oModel.getProperty("/Items/" + sSelectedTableIndex + "/StorageLocation_input") !== "" &&
									oModel.getProperty("/Items/" + sSelectedTableIndex + "/BatchVisible") === true) {
									aTableCells[sIndex].getCells()[16].focus();
								}
							}
						}
					}
				}
				sap.ui.getCore().getMessageManager().removeAllMessages();
				for (var j = 0; j < aItems.length; j++) {
					var sDocumentItem = oModel.getProperty("/Items/" + j + "/DocumentItem");
					if (oModel.getProperty("/Items/" + j + "/ManufactureDate_valueState") === sap.ui.core.ValueState.Error ||
						oModel.getProperty("/Items/" + j + "/ShelfLifeExpirationDate_valueState") === sap.ui.core.ValueState.Error
					) {
						var oMessage = new Message({
							message: this.getResourceBundle().getText("TITLE_ERROR_DETAILVIEW"),
							type: MessageType.Error,
							target: "Special Stock",
							processor: oModel,
							additionalText: this.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [sDocumentItem]),
							description: this.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [sDocumentItem])
						});
						sap.ui.getCore().getMessageManager().addMessages(oMessage);
					}
				}
				for (var j = 0; j < aItems.length; j++) {
					sValidation = this._validationNoRefItem(j);
					if (sValidation === false) {
						oModel.setProperty("/PostButtonEnabled", false);
						break;
					} else {
						oModel.setProperty("/PostButtonEnabled", true);
					}
				}
				this._updateHiglightProperty();
				if (this.getView().getModel("oFrontend").setProperty("/Items/" + sSelectedTableIndex + "/ManufactureDateMandatory") === true) {
					this.getView().getModel("oFrontend").setProperty("/Items/" + sSelectedTableIndex + "/ManufactureDate_valueStateText", this.getResourceBundle()
						.getText("PRODUCTION_VALUE_STATE_TEXT"));
				}
				if (this.getView().getModel("oFrontend").setProperty("/Items/" + sSelectedTableIndex + "/ShelfLifeExpirationDateMandatory") ===
					true) {
					this.getView().getModel("oFrontend").setProperty("/Items/" + sSelectedTableIndex + "/ShelfLifeExpirationDatee_valueStateText",
						this.getResourceBundle().getText("SHELFLIFE_VALUE_STATE_TEXT"));
				}
			} else { //S2
				var oItem = this.getView().getModel("oItem");
				if (oItem.getProperty("/Material_Input") !== "") {
					BufferedMaterial = this._oValueHelpController.getBufferOfMaterial(oItem.getProperty("/Material_Input"));
					sStorageLocation = BufferedMaterial.StorageLocation;
					oItem.setProperty("/DeliveredQuantityEditable", true);
					oItem.setProperty("/DeliveredUnitEditable", true);
					this.getView().byId("idQuantity").focus();
					if (oItem.getProperty("/DeliveredQuantity_input") !== 0) {
						this.getView().byId("idUOM").focus();
						if (oItem.getProperty("/DeliveredUnit_input") !== "") {
							oItem.setProperty("/Plant_input_editable", true);
							this.getView().byId("idPlantInput").focus();
							if (oItem.getProperty("/Plant_input") !== "") {
								oItem.setProperty("/StorageLocationEditable", true);
								this.getView().byId("idStorageLocationInput").focus();
								if (oItem.getProperty("/StorageLocation_input") !== "") {
									//check after plant is changed, whether the existing storage location is still valid. Start
									aStorageLocationCollection = sStorageLocation[oItem.getProperty("/Plant")].StorageLocationCollection;
									var IsValidStorageLocation = false;
									for (var s = 0; s < aStorageLocationCollection.length; s++) {
										if (oItem.getProperty("/StorageLocation") === aStorageLocationCollection[s].StorageLocation) {
											if (oItem.getProperty("/StorageLocation_input") === aStorageLocationCollection[s].StorageLocationName) {
												IsValidStorageLocation = true;
											}
										}
									}
									if (IsValidStorageLocation === true) {
										oItem.setProperty("/StockTypeNOREFEnabled", true);
										oItem.setProperty("/SpecialStockSelection_Visible", true);
										oItem.setProperty("/BatchEditable", true);
										this.getView().byId("idBatchInput").focus();
										if (oItem.getProperty("/InventorySpecialStockType") === "E") {
											oItem.setProperty("/SalesOrder_inputMandatory", true);
										} else {
											oItem.setProperty("/SalesOrder_inputMandatory", false);
										}
									} else {
										oItem.setProperty("/StorageLocation", "");
										oItem.setProperty("/StorageLocation_input", "");
										oItem.setProperty("/StorageLocation_valueState", sap.ui.core.ValueState.None);
										oItem.setProperty("/StorageLocation_valueStateText", "");
										oItem.setProperty("/BatchEditable", false);
									}
									//check after plant is changed, whether the existing storage location is still valid. End
								}
							} else {
								oItem.setProperty("/StorageLocationEditable", false);
							}
						} else {
							oItem.setProperty("/Plant_input_editable", false);
							oItem.setProperty("/StorageLocationEditable", false);
						}
					} else {
						oItem.setProperty("/Plant_input_editable", false);
						oItem.setProperty("/StorageLocationEditable", false);
					}
				}
				this._setValueStateMandatoryFields(oItem);
				sValidation = this._validationNoRefItem();
				if (sValidation === false) {
					oItem.setProperty("/ApplyButtonEnabled", false);
				} else {
					oItem.setProperty("/ApplyButtonEnabled", true);
				}
				this._updateItemHiglightProperty();
				if (this.getView().getModel("oFrontend").setProperty("/Items/" + sSelectedTableIndex + "/ManufactureDateMandatory") === true) {
					this.getView().getModel("oFrontend").setProperty("/Items/" + sSelectedTableIndex + "/ManufactureDate_valueStateText", this.getResourceBundle()
						.getText("PRODUCTION_VALUE_STATE_TEXT"));
				}
				if (this.getView().getModel("oFrontend").setProperty("/Items/" + sSelectedTableIndex + "/ShelfLifeExpirationDateMandatory") ===
					true) {
					this.getView().getModel("oFrontend").setProperty("/Items/" + sSelectedTableIndex + "/ShelfLifeExpirationDatee_valueStateText",
						this.getResourceBundle().getText("SHELFLIFE_VALUE_STATE_TEXT"));
				}
				sap.ui.getCore().getMessageManager().removeAllMessages();
			}

		},

		/**
		 * Event handler for the F4-help sales order
		 * @public
		 * @param {sap.ui.base.Event}  oEvent event object from Selection list
		 */
		handleSalesOrderValueHelp: function (oEvent) {
			var sTargetSpecialStockType = this.getView().getModel("oItem").getProperty("/SpecialStock_selectedKey");
			var that = this;
			if (!this._oSalesOrderValueHelpDialog) {
				this._oSalesOrderValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					ok: function (oControlEvent) {
						var aTokens = oControlEvent.getParameter("tokens");
						var oRow = aTokens[aTokens.length - 1].data();
						that.getView().getModel("oItem").setProperty("/SalesOrder", oRow.row.SalesOrder);
						that.getView().getModel("oItem").setProperty("/SalesOrderItem", oRow.row.SalesOrderItem);
						that._setGuidedTour();
						that.getView().byId("idSalesOrderDocumentSpecialStockInputText").focus();
						that._oSalesOrderValueHelpDialog.close();
						that._oSalesOrderValueHelpDialog.destroy();
						that._oSalesOrderValueHelpDialog = undefined;
					},
					cancel: function (oControlEvent) {
						that._oSalesOrderValueHelpDialog.close();
					}
				});
				this._oSalesOrderValueHelpDialog.setKeys(["SalesOrder", "SalesOrderItem"]);
				//Presetting a search term from main windwo
				var sFilterTerm = "";
				var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
					advancedMode: true,
					expandAdvancedArea: true,
					search: function (oEvent) {
						var oSearchField = sap.ui.getCore().byId("idSalesOrderSearch");
						var sSearch = oSearchField.getValue();
						// var params = oEvent.getParameters();
						var mParams = {};
						// var sSearch = params.selectionSet[0].getValue();
						if (sSearch.length > 0) {
							var mParams = {
								custom: {
									"search": sSearch
								}
							};
							that._oSalesOrderValueHelpDialog.getTable().bindAggregation("rows", {
								path: "/MMIMSalesOrderVH",
								parameters: mParams
							});
						} else { // reset search
							that._oSalesOrderValueHelpDialog.getTable().bindAggregation("rows", {
								path: "/MMIMSalesOrderVH"
							});
						}
					}
				});
				//trigger the search event handler
				oFilterBar.setBasicSearch(new sap.m.SearchField({
					id: "idSalesOrderSearch",
					value: sFilterTerm,
					tooltip: this.getResourceBundle().getText("SEARCH_FIELD_TOOLTIP"),
					showSearchButton: false,
					search: function (oEvent) {
						that._oSalesOrderValueHelpDialog.getFilterBar().search();
					}
				}));
				this._oSalesOrderValueHelpDialog.setFilterBar(oFilterBar);
				this._oSalesOrderValueHelpDialog.setModel(this.getOwnerComponent().getModel("oData"));
			} // endif check !this
			this._oSalesOrderValueHelpDialog.setTitle(that.getResourceBundle().getText("SALES_ORDER"));
			var aCols = [{
				label: that.getResourceBundle().getText("SALES_ORDER"),
				template: "SalesOrder"
			}, {
				label: that.getResourceBundle().getText("LABEL_SALES_ORDER_ITEMS"),
				template: "SalesOrderItem"
			}, {
				label: that.getResourceBundle().getText("LABEL_MATERIAL_COL"),
				template: "Material"
			}, {
				label: that.getResourceBundle().getText("TABLE_COLUMN_PLANT_TEXT"),
				template: "Plant"
			}, {
				label: that.getResourceBundle().getText("SOLD_TO_PARTY"),
				template: "SoldToParty"
			}, {
				label: that.getResourceBundle().getText("CUSTOMER"),
				template: "Customer"
			}, {
				label: that.getResourceBundle().getText("SALES_ORGANIZATION"),
				template: "SalesOrganization"
			}, {
				label: that.getResourceBundle().getText("DISTRIBUTION_CHANNEL"),
				template: "DistributionChannel"
			}, {
				label: that.getResourceBundle().getText("DIVISION"),
				template: "OrganizationDivision"
			}, {
				label: that.getResourceBundle().getText("SALES_ORDER_TYPE"),
				template: "SalesOrderType"
			}];
			var sSelect =
				"SalesOrder,SalesOrderItem,Material,Plant,SoldToParty,Customer,SalesOrganization, DistributionChannel,OrganizationDivision, SalesOrderType";
			this._oSalesOrderValueHelpDialog.getTable().bindAggregation("rows", {
				path: "/MMIMSalesOrderVH"
			});
			var oColModel = new sap.ui.model.json.JSONModel();
			oColModel.setData({
				cols: aCols
			});
			this._oSalesOrderValueHelpDialog.setModel(oColModel, "columns");
			this._oSalesOrderValueHelpDialog.TableStateDataFilled();
			this._oSalesOrderValueHelpDialog.open();
		},

		/**
		 * Event handler F4-help for the WBS element
		 * @public
		 * @param {sap.ui.base.Event}  oEvent event object from Selection list
		 */
		handleWBSValueHelp: function (oEvent) {
			var sTargetSpecialStockType = this.getView().getModel("oItem").getProperty("/SpecialStock_selectedKey");
			var that = this;
			if (!this._oWBSValueHelpDialog) {
				this._oWBSValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					ok: function (oControlEvent) {
						var aTokens = oControlEvent.getParameter("tokens");
						var oRow = aTokens[aTokens.length - 1].data();
						that.getView().getModel("oItem").setProperty("/Project", oRow.row.WBSElement);
						that.getView().getModel("oItem").setProperty("/ProjectDescription", oRow.row.WBSDescription);
						that._setGuidedTour();
						that.getView().byId("idProjectNameSpecialStockText").focus();
						that._oWBSValueHelpDialog.close();
						that._oWBSValueHelpDialog.destroy();
						that._oWBSValueHelpDialog = undefined;
					},
					cancel: function (oControlEvent) {
						that._oWBSValueHelpDialog.close();
					}
				});
				this._oWBSValueHelpDialog.setKey("WBSElement");
				this._oWBSValueHelpDialog.setDescriptionKey("WBSElement");
				//Presetting a search term from main windwo
				var sFilterTerm = "";
				var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
					advancedMode: true,
					expandAdvancedArea: true,
					search: function (oEvent) {
						var oSearchField = sap.ui.getCore().byId("idWBSSearch");
						var sSearch = oSearchField.getValue();
						// var params = oEvent.getParameters();
						var mParams = {};
						// var sSearch = params.selectionSet[0].getValue();
						if (sSearch.length > 0) {
							var mParams = {
								custom: {
									"search": sSearch
								},
								// select: sSelect
							};
							that._oWBSValueHelpDialog.getTable().bindAggregation("rows", {
								path: "/MMIMWBSElementVH",
								parameters: mParams
							});
						} else { // reset search
							that._oWBSValueHelpDialog.getTable().bindAggregation("rows", {
								path: "/MMIMWBSElementVH"
							});
						}
					}
				});
				//trigger the search event handler
				oFilterBar.setBasicSearch(new sap.m.SearchField({
					id: "idWBSSearch",
					value: sFilterTerm,
					tooltip: this.getResourceBundle().getText("SEARCH_FIELD_TOOLTIP"),
					showSearchButton: false,
					search: function (oEvent) {
						that._oWBSValueHelpDialog.getFilterBar().search();
					}
				}));
				this._oWBSValueHelpDialog.setFilterBar(oFilterBar);
				this._oWBSValueHelpDialog.setModel(this.getOwnerComponent().getModel("oData"));
			} // endif check !this
			this._oWBSValueHelpDialog.setTitle(that.getResourceBundle().getText("WBS_ELEMENT"));
			var aCols = [{
				label: that.getResourceBundle().getText("WBS_ELEMENT"),
				template: "WBSElement"
			}, {
				label: that.getResourceBundle().getText("WBS_DESCRIPTION"),
				template: "WBSDescription"
			}, {
				label: that.getResourceBundle().getText("WBS_PROJECT"),
				template: "Project"
			}, {
				label: that.getResourceBundle().getText("WBS_PROJECT_DESCRIPTION"),
				template: "ProjectDescription"
			}];
			var sSelect =
				"WBSElement,WBSDescription,Project,ProjectDescription";
			this._oWBSValueHelpDialog.getTable().bindAggregation("rows", {
				path: "/MMIMWBSElementVH"
			});
			var oColModel = new sap.ui.model.json.JSONModel();
			oColModel.setData({
				cols: aCols
			});
			this._oWBSValueHelpDialog.setModel(oColModel, "columns");
			this._oWBSValueHelpDialog.TableStateDataFilled();
			this._oWBSValueHelpDialog.open();
		},

		/**
		 * Event handler F4-help for the supplier
		 * @public
		 * @param {sap.ui.base.Event}  oEvent event object from Selection list
		 */
		handleLifnrValueHelp: function (oEvent) {
			var sTargetSpecialStockType = this.getView().getModel("oItem").getProperty("/SpecialStock_selectedKey");
			var that = this;
			var aCols;
			var aFilters = [];
			var sMaterial = this.getView().getModel("oItem").getProperty("/Material_Input");
			//No Reference Message Manager
			if (sTargetSpecialStockType === "K") {
				var oModel = this.getView().getModel("oItem");
				oModel.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
				this.getView().setModel(oModel);
				aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, sMaterial));
				this.getOwnerComponent().getModel("oData").read("/MMIMSupplierMaterialVH", {
					filters: aFilters,
					success: jQuery.proxy(this._successSupplierLoad, this),
					error: jQuery.proxy(this._handleOdataError, this)
				});
			}
			aFilters.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, sMaterial));
			if (!this._oLifnrValueHelpDialog) {
				this._oLifnrValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
					supportMultiselect: false,
					supportRanges: false,
					supportRangesOnly: false,
					ok: function (oControlEvent) {
						var aTokens = oControlEvent.getParameter("tokens");
						var oRow = aTokens[aTokens.length - 1].data();
						that.getView().getModel("oItem").setProperty("/Lifnr", oRow.row.Supplier);
						that.getView().getModel("oItem").setProperty("/Lifname", oRow.row.SupplierName);
						that._setGuidedTour();
						that.getView().byId("idVendorNameSpecialStockInputText").focus();
						that._oLifnrValueHelpDialog.close();
						that._oLifnrValueHelpDialog.destroy();
						that._oLifnrValueHelpDialog = undefined;
					},
					cancel: function (oControlEvent) {
						that._oLifnrValueHelpDialog.close();
					}
				});
				this._oLifnrValueHelpDialog.setKey("Supplier");
				this._oLifnrValueHelpDialog.setDescriptionKey("Supplier");
				//Presetting a search term from main windwo
				var sFilterTerm = "";
				var oFilterBar = new sap.ui.comp.filterbar.FilterBar({
					advancedMode: true,
					expandAdvancedArea: true,
					search: function (oEvent) {
						var oSearchField = sap.ui.getCore().byId("idLifnrSearch");
						var sSearch = oSearchField.getValue();
						var mParams = {};
						if (sSearch.length > 0) {
							var mParams = {
								custom: {
									"search": sSearch
								}
							};
							switch (sTargetSpecialStockType) {
							case "K":
								that._oLifnrValueHelpDialog.getTable().bindAggregation("rows", {
									path: "/MMIMSupplierMaterialVH",
									parameters: mParams,
									filters: aFilters
								});
								break;
							default:
								that._oLifnrValueHelpDialog.getTable().bindAggregation("rows", {
									path: "/MMIMSupplierGeneralVH",
									parameters: mParams
								});
								break;
							}
						} else { // reset search
							switch (sTargetSpecialStockType) {
							case "K":
								that._oLifnrValueHelpDialog.getTable().bindAggregation("rows", {
									path: "/MMIMSupplierMaterialVH",
									filters: aFilters
								});
								break;
							default:
								that._oLifnrValueHelpDialog.getTable().bindAggregation("rows", {
									path: "/MMIMSupplierGeneralVH"
								});
								break;
							}
						}
					}
				});
				//trigger the search event handler
				oFilterBar.setBasicSearch(new sap.m.SearchField({
					id: "idLifnrSearch",
					value: sFilterTerm,
					tooltip: this.getResourceBundle().getText("SEARCH_FIELD_TOOLTIP"),
					showSearchButton: false,
					search: function (oEvent) {
						that._oLifnrValueHelpDialog.getFilterBar().search();
					}
				}));
				this._oLifnrValueHelpDialog.setFilterBar(oFilterBar);
				this._oLifnrValueHelpDialog.setModel(this.getOwnerComponent().getModel("oData"));
			} // endif check !this
			this._oLifnrValueHelpDialog.setTitle(that.getResourceBundle().getText("SUPPLIER"));
			switch (sTargetSpecialStockType) {
			case "K":
				aCols = [{
					label: that.getResourceBundle().getText("SUPPLIER"),
					template: "Supplier"
				}, {
					label: that.getResourceBundle().getText("SUPPLIERNAME"),
					template: "SupplierName"
				}, {
					label: that.getResourceBundle().getText("COMPANYCODE"),
					template: "CompanyCode"
				}, {
					label: that.getResourceBundle().getText("COUNTRY"),
					template: "Country"
				}, {
					label: that.getResourceBundle().getText("POSTALCODE"),
					template: "PostalCode"
				}, {
					label: that.getResourceBundle().getText("CITYNAME"),
					template: "CityName"
				}];
				break;
			default:
				aCols = [{
					label: that.getResourceBundle().getText("SUPPLIER"),
					template: "Supplier"
				}, {
					label: that.getResourceBundle().getText("SUPPLIERNAME"),
					template: "SupplierName"
				}, {
					label: that.getResourceBundle().getText("COUNTRY"),
					template: "Country"
				}, {
					label: that.getResourceBundle().getText("POSTALCODE"),
					template: "PostalCode"
				}, {
					label: that.getResourceBundle().getText("CITYNAME"),
					template: "CityName"
				}];
				break;
			}
			var sSelect = "Supplier,SupplierName,Country,PostalCode,CityName";
			switch (sTargetSpecialStockType) {
			case "K":
				this._oLifnrValueHelpDialog.getTable().bindAggregation("rows", {
					path: "/MMIMSupplierMaterialVH",
					filters: aFilters
				});
				break;
			default:
				this._oLifnrValueHelpDialog.getTable().bindAggregation("rows", {
					path: "/MMIMSupplierGeneralVH"
				});
				break;
			};
			var oColModel = new sap.ui.model.json.JSONModel();
			oColModel.setData({
				cols: aCols
			});
			this._oLifnrValueHelpDialog.setModel(oColModel, "columns");
			this._oLifnrValueHelpDialog.TableStateDataFilled();
			this._oLifnrValueHelpDialog.open();
		},
		/**
		 * set High light status if the item input is not consistant.(e.g. mandantory input fields miss value)
		 * @private
		 * @param {sap.ui.base.Event}  oEvent event object from Selection list
		 */
		_updateItemHiglightProperty: function () {
			var oItem = this.getView().getModel("oItem");

			//internal check function : check one item
			var check = function (oCheckItem) {
				var sHighlight = sap.ui.core.MessageType.None;
				for (var prop in oCheckItem) {
					if ((prop.indexOf("_valueState") > 0) && (prop.indexOf("_valueStateText") < 0)) {
						if (oCheckItem[prop] === sap.ui.core.ValueState.Error) { //error has highest prio
							sHighlight = sap.ui.core.MessageType.Error;
						} else {
							if (oCheckItem[prop] === sap.ui.core.ValueState.Warning && sHighlight === sap.ui.core.MessageType.None) {
								sHighlight = sap.ui.core.MessageType.Warning;
							}
						}
					}
				} //for
				return sHighlight;
			};
			oItem.setProperty("/highlight", check(oItem));
		},
		/**
		 * public method
		 * @function handler to the button "Apply and New"
		 * @param {sap.ui.base.Event}  oEvent event object from Selection list
		 */
		handleAppylyAndNewButtonPress: function (oEvent) {
			var oItemModel = this.getModel("oItem").getData();
			var oFrontendModel = this.getModel("oFrontend");
			var aItems = oFrontendModel.getProperty("/Items");
			var bIsConsistent;

			//extension
			if (this._aExtendedFields && this._aExtendedFields.length > 0) { //extended fields --> transfer
				var oBoundObject = this.getView().byId("idExtensionForm").getElementBinding().getBoundContext().getObject();
				for (var i = 0; i < this._aExtendedFields.length; i++) {
					if (this._isExtendedField(this._aExtendedFields[i].name) === true) {
						oItemModel[this._aExtendedFields[i].name] = oBoundObject[this._aExtendedFields[i].name];
					}
				}
			}
			var maxItemCell = 0;
			if (aItems) { //transfer detail back to main table //  
				for (var i = 0; i < aItems.length; i++) {
					if (aItems[i].DocumentItem === oItemModel.DocumentItem && aItems[i].ItemCounter === oItemModel.ItemCounter) {
						aItems[i] = oItemModel;
					}
					if (maxItemCell < parseInt(aItems[i].DocumentItem)) {
						maxItemCell = parseInt(aItems[i].DocumentItem);
					}
					if (aItems[i].Selected) {
						oFrontendModel.setProperty("/CopyButtonVisible", true);
						oFrontendModel.setProperty("/DeleteButtonVisible", true);
					}
				}
				oFrontendModel.setProperty("/Items", aItems);
			}
			var oItem = this.getView().getModel("oItem");
			var sDocumentItem = oItem.getProperty("/DocumentItem");
			var msg;
			msg = this.getResourceBundle().getText("ITEM_APPLIED", [sDocumentItem]);
			MessageToast.show(msg);
			this._getInitialItem(maxItemCell);
			var sValidation = this._validationNoRefItem();
			if (sValidation === false) {
				oFrontendModel.setProperty("/PostButtonEnabled", false);
			} else {
				oFrontendModel.setProperty("/PostButtonEnabled", true);
			}
			var newItem = maxItemCell++;
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);

			// remove Batch Button while navigating back to Object page if exists
			var oButton = null;
			if (this.getView().byId("idBatchLabel").getVisible() === true &&
				this.getView().byId("idBatchLabel").getFields().length > 1) {
				oButton = this.getView().byId("idBatchLabel").removeField("idCreateBatchButton");
			}
			if (oButton) {
				oButton.detachPress(this.handleCreateBatch, this).destroy();
			}

			// check storage bin and enable the column
			oFrontendModel.setProperty("/ColumnStorageBinVisible", this._isStorageBinInItems(oFrontendModel.getData().Items));
			oRouter.navTo("subscreen", {
				POItem: newItem
			}, true); // route name in component definition

		},
		/**
		 * privat method
		 * attachment document handler in S1 view
		 */
		_loadAttachmentComponentNOREF: function () {
			try {
				var oModel = this.getView().getModel("oFrontend");
				var tempkey = this.getUniqueKey();
				var asMode = "I";
				var objectType = "BUS2017";
				var that = this;
				this.temp_objectKey = "GR" + tempkey;
				if (!this.oCompAttachProj) {
					//check if app runs with mock data
					if (this.getOwnerComponent().getModel("oDataHelp").getServiceMetadata().dataServices.schema[0].entityType.length >= 15) {
						this.oCompAttachProj = this.getOwnerComponent().createComponent({
							usage: "attachmentReuseComponent",
							settings: {
								mode: asMode,
								objectKey: this.temp_objectKey,
								objectType: objectType
							}
						});
						this.oCompAttachProj.then(function (successValue) {
							that.byId("idastestcompContainer").setComponent(successValue);
						});
					} else { //app runs with mock data --> hide the attachment section
						oModel.setProperty("/AttachmentVisible", false);
					}
				}
			} catch (err) { //attachment service could not be load --> hide the section
				oModel.setProperty("/AttachmentVisible", false);
			}
		}, //_loadAttachmentComponent

		/**
		 * @function handler to navigate back S2 to S1 scrcreen with back button in S2 view
		 * Apps --GR with reference document shall go back to main screen with all changes data in S2
		 * App ---GR without reference shall go back without any changes data in S2 view
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleNavButtonPressNew: function (oEvent) {
			var oItemModel = this.getModel("oItem").getData();
			var oItem = this.getView().getModel("oItem");
			var oFrontendModel = this.getModel("oFrontend");
			var aItems = oFrontendModel.getProperty("/Items");
			var bIsConsistent;
			var iChange = false;
			var oRouter;
			//extension
			if (this._aExtendedFields && this._aExtendedFields.length > 0) { //extended fields --> transfer
				var oBoundObject = this.getView().byId("idExtensionForm").getElementBinding().getBoundContext().getObject();
				for (var i = 0; i < this._aExtendedFields.length; i++) {
					if (this._isExtendedField(this._aExtendedFields[i].name) === true) {
						oItemModel[this._aExtendedFields[i].name] = oBoundObject[this._aExtendedFields[i].name];
					}
				}
			}
			if (aItems) {
				for (var i = 0; i < aItems.length; i++) {
					if (aItems[i].DocumentItem === oItemModel.DocumentItem && aItems[i].ItemCounter === oItemModel.ItemCounter) {
						for (var prop in oItemModel) {
							if ((prop.indexOf("ApplyButton") < 0) && (prop.indexOf("CancelButton")) < 0 && (prop.indexOf("ItemCounter")) < 0 && (prop.indexOf(
									"Selected") < 0 && (prop.indexOf("GoodsMovementReasonCode_selectedKey") < 0))) {
								if (aItems[i][prop] === undefined && (prop.indexOf("ApplyButton") < 0) && (prop.indexOf("CancelButton") < 0)) {
									iChange = true;
									break;
								} else {
									if (aItems[i][prop].toString() !== oItemModel[prop].toString()) {
										iChange = true;
										break;
									} else if (prop === "SubItems" && SubItemController.checkIfSubItemChanged(aItems[i], oItemModel)) { // compare if the component material data and header quantiy are changed
										iChange = true;
										break;
									} else {
										iChange = false;
									}
								}
							}
						}
					}
				}
			}
			var ChangeOK = false;
			var that = this;
			var resourceBundle = that.getResourceBundle();
			if (iChange === true) {
				sap.m.MessageBox.confirm(resourceBundle.getText("MESSAGE_DATA_LOSS"), {
					icon: sap.m.MessageBox.Icon.QUESTION,
					title: resourceBundle.getText("MESSAGE_DATA_LOSS_TITLE"),
					onClose: fnCallbackConfirm,
					styleClass: "sapUiSizeCompact",
					initialFocus: sap.m.MessageBox.Action.CANCEL
				});
			} else {
				// remove Batch Button while navigating back to Object page if exists
				var oButton = null;
				if (this.getView().byId("idBatchLabel").getVisible() === true &&
					this.getView().byId("idBatchLabel").getFields().length > 1) {
					oButton = this.getView().byId("idBatchLabel").removeField("idCreateBatchButton");
				}
				if (oButton) {
					oButton.detachPress(this.handleCreateBatch, this).destroy();
				}
				oRouter = sap.ui.core.UIComponent.getRouterFor(that);
				oRouter.navTo("fullscreen", {
					abort: "false"
				}, true); //back seems to work alternative use fullscreen
			}

			// }
			//local callback
			function fnCallbackConfirm(sResult) {
				if (sResult === "OK") {
					// remove Batch Button while navigating back to Object page if exists
					var oButton = null;
					if (that.getView().byId("idBatchLabel").getVisible() === true &&
						that.getView().byId("idBatchLabel").getFields().length > 1) {
						oButton = that.getView().byId("idBatchLabel").removeField("idCreateBatchButton");
					}
					if (oButton) {
						oButton.detachPress(that.handleCreateBatch, that).destroy();
					}
					oRouter = sap.ui.core.UIComponent.getRouterFor(that);
					oRouter.navTo("fullscreen", {
						abort: "false"
					}, true); //back seems to work alternative use fullscreen
				}
			}
		},
		/**
		 * @Event handler to edit material by key board in S1 and S2 views
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleMaterialChangeEvent: function (oEvent) {
			var sMaterial = oEvent.getParameters().value.toUpperCase();
			var sMaterialName;
			var sPlant;
			var bSelectEnabled;
			var sUoM;
			var sStorageLocation;
			var sValueState = sap.ui.core.ValueState.None;
			var oSpecialStock;
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
				this._SelectedTableIndex = this._getSelectedItemInModel(oEvent);
				var oModel = this.getView().getModel("oFrontend");
				var aItems = oModel.getProperty("/Items");
				sPlant = sPlant = aItems[this._SelectedTableIndex].Plant;
				oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input", sMaterial);
				// special stock consigment "K", after material change, this kind special stock shall be re-assigned 
				// the current "K" related data shall be clear
				if (oModel.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey") === "K") {
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifname", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_State", sap.ui.core.ValueState.None);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_StateText", "");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input_State", sap.ui.core.ValueState.None);
					var myItem = oModel.getProperty("/Items/" + this._SelectedTableIndex);
					if (myItem.SpecialStock_input !== undefined && myItem.SpecialStock_input.length > 0) {
						for (var x = 0; x < myItem.SpecialStock_input.length; x++) {
							if (myItem.SpecialStock_input[x].key === "") {
								var sInventorySpecialStockTypeName = myItem.SpecialStock_input[x].text;
								break;
							}
						}
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey", "");
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/InventorySpecialStockTypeName", sInventorySpecialStockTypeName);
						oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_inputMandatory", false);
					}
				}
				// get actual material and material related master data in item
				sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
				sUoM = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
				sStorageLocation = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation");
				//Special Stock Key Assignment
				if (oModel.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input") === undefined) {
					oSpecialStock = oModel.getProperty("/SpecialStock_input");
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input", oSpecialStock);
				}
				//Mandantory field with ValueState Updating
				if (oEvent.getParameter("valid") === false || oEvent.getParameters().value === "") {
					sValueState = sap.ui.core.ValueState.Error;
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", sValueState);
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueStateText", this.getResourceBundle().getText(
						"MATERIAL_VALUE_STATE_TEXT"));
				} else {
					oModel.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", sValueState);
				}
				if (sMaterial === "") {
					oModel.setProperty("/PostButtonEnabled", false);
				}

			} else { // view S2
				var oFrontModel = this.getView().getModel("oFrontend");
				var oItem = this.getView().getModel("oItem");
				oItem.setProperty("/Material_Input", sMaterial);
				// special stock consigment "K", after material change, this kind special stock shall be re-assigned 
				// the current "K" related data shall be clear
				if (oItem.getProperty("/SpecialStock_selectedKey") === "K") { // special stock consigment "K"
					oItem.setProperty("/Lifnr", "");
					oItem.setProperty("/Lifname", "");
					oItem.setProperty("/Lifnr_State", sap.ui.core.ValueState.None);
					oItem.setProperty("/Lifnr_StateText", "");
					oItem.setProperty("/SpecialStock_input_State", sap.ui.core.ValueState.None);
					var myItem = oItem.getData();
					if (myItem.SpecialStock_input !== undefined && myItem.SpecialStock_input.length > 0) {
						for (var x = 0; x < myItem.SpecialStock_input.length; x++) {
							if (myItem.SpecialStock_input[x].key === "") {
								var sInventorySpecialStockTypeName = myItem.SpecialStock_input[x].text;
								break;
							}
						}
						oItem.setProperty("/SpecialStock_selectedKey", "");
						oItem.setProperty("/InventorySpecialStockTypeName", sInventorySpecialStockTypeName);
						oItem.setProperty("/Lifnr_inputMandatory", false);
					}
				}
				// get actual material and material related master data in item
				sPlant = oItem.getProperty("/Plant");
				sUoM = oItem.getProperty("/DeliveredUnit_input");
				sStorageLocation = oItem.getProperty("/StorageLocation");
				//Special Stock Key Assignment
				if (oItem.getProperty("/SpecialStock_input") === undefined) {
					oSpecialStock = oFrontModel.getProperty("/SpecialStock_input");
					oItem.setProperty("/SpecialStock_input", oSpecialStock);
				}
				//Mandantory field with ValueState Updating
				if (oEvent.getParameter("valid") === false || oEvent.getParameters().value === "") {
					sValueState = sap.ui.core.ValueState.Error;
					oItem.setProperty("/Material_Input_valueState", sValueState);
					oItem.setProperty("/Material_Input_valueStateText", this.getResourceBundle().getText(
						"MATERIAL_VALUE_STATE_TEXT"));
				} else {
					oItem.setProperty("/Material_Input_valueState", sValueState);
				}
				this._setValueStateMandatoryFields(oItem.getData());
				// Updating of Material, in the case of existing Plant input, the control fields shall be fetching againg.
				sPlant = oItem.getProperty("/Plant");
				if (sMaterial === "") {
					oItem.setProperty("/ApplyButtonEnabled", false);
				}
			}
			// Validation of the exiting material and material related master data 
			if (sMaterial !== "") {
				this._handleValidationMasterData(sMaterial, sUoM, sPlant, sStorageLocation, this._SelectedTableIndex);
			}
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
				sPlant = oModel.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
			} else {
				sPlant = oItem.getProperty("/Plant");
			}
			//Guided Tour
			// this._setGuidedTour();
			this._getControlFields(sMaterial, sPlant, this._SelectedTableIndex);
			// this._oValueHelpController.fillBufferForMaterialExpanded(sMaterial, this._validationCallbBack, this);
		},
		/**
		 * @Event handler to edit unloading point in S2 views
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleUnloadingPointChangeEvent: function (oEvent) {
			var sUnloadingPoint = oEvent.getParameters().value;
			var oItem = this.getView().getModel("oItem");
			oItem.setProperty("/UnloadingPointName", sUnloadingPoint);
		},
		/**
		 * @Event handler to edit goods recipient name in S2 views
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleGoodsRecipientNameEvent: function (oEvent) {
			var sGoodsRecipientName = oEvent.getParameters().value;
			var oItem = this.getView().getModel("oItem");
			oItem.setProperty("/GoodsRecipientName", sGoodsRecipientName);
		},
		/**
		 * @Event handler to edit document item text in S2 views
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		handleDocumentItemTextEvent: function (oEvent) {
			var sDocumentItemText = oEvent.getParameters().value;
			var oItem = this.getView().getModel("oItem");
			oItem.setProperty("/DocumentItemText", sDocumentItemText);
		},
		/**
		 * @private method to loading special stock type data from oData
		 * @param {sap.ui.base.Event} oEvent Event object supplied by the UI
		 */
		_successSpecialStockLoad: function (oData, oResponse) {
			var oModel = this.getView().getModel("oFrontend");
			var oSpecialStock_type = new Array();
			var sNoneText = this.getResourceBundle().getText("NONE");
			oSpecialStock_type.push({
				key: "",
				text: sNoneText
			});
			for (var i = 0; i < oData.results.length; i++) {
				oSpecialStock_type.push({
					key: oData.results[i].InventorySpecialStockType,
					text: oData.results[i].InventorySpecialStockTypeName
				});
			}
			oModel.setProperty("/SpecialStock_input", oSpecialStock_type);
		},
		/**
		 * @private method to check item consistant
		 * @param {string} actual item index
		 */
		_validationNoRefItem: function (iSelectedItem) {
			var oModel;
			var oItem;
			var sMaterial;
			var sQuantity;
			var sAUM;
			var sPlant;
			var sStorageLocation;
			var bMandantory;
			var bSelectEnabled;
			var bManufactureDate = true;
			var bShelfLifeExpirationDate = true;
			var bSalesOrder = true;
			var bWBS = true;
			var bLifnr = true;
			var sValidation;
			var sAvailable;
			if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
				oModel = this.getModel("oFrontend");
				var oModeldata = oModel.getData();
				var aItems = oModel.getProperty("/Items");
				for (var j = 0; j < aItems.length; j++) {
					if (aItems[j].Material_Input !== "") {
						sAvailable = true;
						break;
					}
				}
				sMaterial = oModel.getProperty("/Items/" + iSelectedItem + "/Material_Input");
				sQuantity = oModel.getProperty("/Items/" + iSelectedItem + "/DeliveredQuantity_input");
				sAUM = oModel.getProperty("/Items/" + iSelectedItem + "/DeliveredUnit_input");
				sPlant = oModel.getProperty("/Items/" + iSelectedItem + "/Plant_input");
				sStorageLocation = oModel.getProperty("/Items/" + iSelectedItem + "/StorageLocation_input");
				bSelectEnabled = this._ItemConsistent(oModel.getProperty("/Items/" + iSelectedItem));
			} else { //S2
				oItem = this.getView().getModel("oItem");
				if (sMaterial !== "") {
					sAvailable = true;
				}
				sMaterial = oItem.getProperty("/Material_Input");
				sQuantity = oItem.getProperty("/DeliveredQuantity_input");
				sAUM = oItem.getProperty("/DeliveredUnit_input");
				sPlant = oItem.getProperty("/Plant_input");
				sStorageLocation = oItem.getProperty("/StorageLocation_input");
				bSelectEnabled = this._ItemConsistent(oItem.getData());
				if (oItem.getProperty("/ManufactureDateMandatory") === true &&
					(oItem.getProperty("/ManufactureDate") === "" || oItem.getProperty("/ManufactureDate") === undefined)) {
					bManufactureDate = false;
				}
				if (oItem.getProperty("/ShelfLifeExpirationDateMandatory") === true &&
					(oItem.getProperty("/ShelfLifeExpirationDate") === "" || oItem.getProperty("/ShelfLifeExpirationDate") === undefined)) {
					bShelfLifeExpirationDate = false;
				}
				if (oItem.getProperty("/InventorySpecialStockType") === "E" &&
					(oItem.getProperty("/SalesOrder") === "" || oItem.getProperty("/SalesOrder") === undefined)) {
					bSalesOrder = false;
				}
				if (oItem.getProperty("/InventorySpecialStockType") === "Q" &&
					(oItem.getProperty("/Project") === "" || oItem.getProperty("/Project") === undefined)) {
					bWBS = false;
				}
				if (oItem.getProperty("/InventorySpecialStockType") === "K" &&
					(oItem.getProperty("/Lifnr") === "" || oItem.getProperty("/Lifnr") === undefined)) {
					bLifnr = false;
				}
			}
			bMandantory = false;
			if (sMaterial !== "" && sPlant !== "" && sQuantity !== "" && sAUM !== "" && sStorageLocation !== "") {
				bMandantory = true;
			}
			if (sMaterial === "" && (sPlant === undefined || sPlant === "") && sQuantity === 0 &&
				(sAUM === "" || sAUM === undefined) && (sStorageLocation === "" || sStorageLocation === undefined)) {
				bMandantory = true;
			}

			if (bMandantory === true && bSelectEnabled === true && sAvailable === true &&
				bManufactureDate === true && bShelfLifeExpirationDate === true && bSalesOrder === true &&
				bWBS === true && bLifnr === true) {
				sValidation = true;
			} else {
				sValidation = false;
			}
			return sValidation;
		},

		/**
		 * Event handler for Copilot
		 * @param {sap.ui.base.Event}  oEvent
		 * @public triggered when co-pilot button is pressed, displays all available chats
		 */
		onCopilot: function (oEvent) {
			//Re-read chats
			var that = this; //closure
			var oCopilotButton = oEvent.getSource(); //closure

			if (!this._oCopilotPopover) {
				this._oCopilotPopover = sap.ui.xmlfragment("s2p.mm.im.goodsreceipt.purchaseorder.view.CoPilotChatPopover", this);
				this.getView().addDependent(this._oCopilotPopover);
				jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oCopilotPopover);
			}
			sap.cp.ui.services.CopilotApi.getChats().then(function (aChats) {
				that._aCopilotChats = aChats;
				var aCopilotChats = [];
				var oCopilotChatItem = {};
				for (var i = 0; i < that._aCopilotChats.length; i++) {
					oCopilotChatItem = {};
					oCopilotChatItem.title = that._aCopilotChats[i].getProperties().title;
					oCopilotChatItem.createdOn = that._aCopilotChats[i].getProperties().createdOn;
					oCopilotChatItem.guid = that._aCopilotChats[i].getProperties().guid;
					aCopilotChats.push(oCopilotChatItem);
				}

				var oCopilotPopover = new sap.ui.model.json.JSONModel({
					ServiceName: oCopilotButton.getCustomData()[0].getValue(),
					AnnotationPath: oCopilotButton.getCustomData()[1].getValue(),
					ContextPath: oCopilotButton.getCustomData()[2].getValue(),
					Chats: aCopilotChats
				});
				oCopilotPopover.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
				that._oCopilotPopover.setModel(oCopilotPopover);
				that._oCopilotPopover.openBy(oCopilotButton);
			});
		},

		/* Event handler for Copilot adds item to selected chat
		 * @param {sap.ui.base.Event}  oEvent
		 * @public
		 */
		handleAddDocument2CopilotChat: function (oEvent) {
			this._oCopilotPopover.close();
			var sSelectedCopilotChatGuid = oEvent.getSource().getBindingContext().getObject().guid;
			var iChat = null;
			// identify chat
			for (var i = 0; i < this._aCopilotChats.length; i++) {
				if (this._aCopilotChats[i].getProperties().guid === sSelectedCopilotChatGuid) {
					iChat = i;
				}
			}
			if (iChat !== null) {
				var sServiceName = oEvent.getSource().getModel().getProperty("/ServiceName");
				var sAnnotationPath = oEvent.getSource().getModel().getProperty("/AnnotationPath");
				var sContextPath = oEvent.getSource().getModel().getProperty("/ContextPath");
				var oContext = new sap.ui.model.Context(new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/" + sServiceName + "/", {
					annotationURI: "/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Annotations(TechnicalName='" + sAnnotationPath +
						"',Version='0001')/$value/"
				}), sContextPath);
				var that = this;
				this._aCopilotChats[iChat].addObjectFromContext(oContext).then(function (Object) {
					MessageToast.show(that.getResourceBundle().getText("SUCCESS_MESSAGE_COPILOT"));
				});
			}
		},

		/**
		 * Event handler for the consider post checkbox of component material.
		 * @param {object} oEvent event object
		 */
		handleComponentConsiderSelect: function (oEvent) {
			SubItemController.onHandleComponentConsiderSelect.call(this, oEvent);
		},

		/**
		 * Event handler for the batch value help of component material.
		 * @param {object} oEvent event object
		 */
		handleComponentBatchHelp: function (oEvent) {
			SubItemController.onHandleComponentBatchHelp.call(this, oEvent);
		},

		/**
		 * Event handler for the quantity input of component material.
		 * @param {object} oEvent event object
		 */
		handleComponentQuantityInputChange: function (oEvent) {
			SubItemController.onHandleComponentQuantityInputChange.call(this, oEvent);
		},

		/**
		 * Get the controller file for subcontracting item.
		 * @return {object} SubItemController
		 */
		getSubItemController: function () {
			return SubItemController;
		},

		_getMovementType: function (oItem) {
			var sMovementType = "";
			if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
				if (oItem.IsReturnsItem === true) { // return delivery 
					sMovementType = "161";
				} else {
					switch (oItem.StockType_selectedKey) {
					case "U":
						sMovementType = "103";
						break;
					case "V":
						sMovementType = "105";
						break;
					case "W":
						sMovementType = "105";
						break;
					case "Z":
						sMovementType = "105";
						break;
					default:
						sMovementType = "101";
					}
				}
			} else {
				switch (oItem.StockType_selectedKey) {
				case "2":
					sMovementType = "503";
					break;
				case "3":
					sMovementType = "505";
					break;
				default:
					sMovementType = "501"; //text: "Unrestricted-Use"
				}
			}
			return sMovementType;
		},

		//New Event handle when supplier batch is filled based on scan or manual entry
		handleAssignStoBin: function (oEvent) {
			var oFrontEndModel = this.getView().getModel("oFrontend");
			var aWMLStorageLocations = oFrontEndModel.getProperty("/WMLStorageLocations");

			if (!aWMLStorageLocations) {
				var oDataModel = this.getOwnerComponent().getModel("oData");

				oDataModel.read("/WMLStorageLocations", {
					method: "GET",
					success: function (oData) {
						aWMLStorageLocations = [];
						if (oData.results) {
							oData.results.forEach(oResult => {
								var oWMLStorageLocation = Object.assign({}, oResult);
								delete oWMLStorageLocation.__metadata;
								aWMLStorageLocations.push(oWMLStorageLocation);
							});
						}
						oFrontEndModel.setProperty("/WMLStorageLocations", aWMLStorageLocations);
						this.handleAssignStoBin(oEvent);
					}.bind(this),
					error: function () {
						oFrontEndModel.setProperty("/WMLStorageLocations", []);
					}
				});
				return;
			}

			var sDocumentNumber = oFrontEndModel.getProperty("/Ebeln");
			sDocumentNumber = sDocumentNumber.padStart(oFrontEndModel.getProperty("/Ebeln_maxLength"), "0");
			var aItems = [...oFrontEndModel.getProperty("/Items")];
			aItems.sort((a, b) => {
				if (a.DocumentItem_int < b.DocumentItem_int) {
					return -1;
				}
				if (a.DocumentItem_int > b.DocumentItem_int) {
					return 1;
				}
				if (a.ItemCounter < b.ItemCounter) {
					return -1;
				}
				if (a.ItemCounter > b.ItemCounter) {
					return 1;
				}
				return 0;
			});
			var sBinData = {};
			var aBin = [];
			var iMatDocPos = 1;
			for (var i = 0; i < aItems.length; i++) {
				sBinData = {};

				if (!aItems[i].Selected) {
					continue;
				}

				var sSelectedItemStorageLocation = aItems[i].StorageLocation;

				var oWMLStorageLocation = aWMLStorageLocations.find(oItem => oItem.StorageLocation === sSelectedItemStorageLocation && oItem.WMLEnabled ===
					true);

				if (!aItems[i].WMLInScope && !oWMLStorageLocation) {
					continue;
				}

				sBinData.Country = "";
				var sQuantity = aItems[i].DeliveredQuantity_input;
				var sUnit = aItems[i].DeliveredUnit_input;
				if (aItems[i].DeliveryCompleted) {
					sQuantity = aItems[i].OrderedQuantity;
					sUnit = aItems[i].OrderedQuantityUnit;
				}
				sBinData.Quantity = sQuantity;
				sBinData.MatDocPos = String(iMatDocPos).padStart(4, "0");
				sBinData.Plant = aItems[i].Plant;
				sBinData.StorageLocation = aItems[i].StorageLocation;
				sBinData.StorageBin = "";
				sBinData.Material = aItems[i].Material;
				sBinData.Batch = aItems[i].Batch;
				sBinData.SupplierBatch = aItems[i].SupplierBatch;
				sBinData.OriginDocument = sDocumentNumber;
				sBinData.Order = "";
				sBinData.Item = aItems[i].DocumentItem;
				sBinData.Customer = "";
				sBinData.QuantitySO = "";
				sBinData.Unit = sUnit;

				if (this._SourceOfGR === this._SourceOfGRIsProductionOrder && sBinData.StorageLocation === "A620") {
					sBinData.StorageBin = "PR";
				}

				aBin.push(sBinData);
				iMatDocPos++;
			}

			if (aBin.length) {
				this.getView().getModel("bindata").setProperty("/Bin", aBin);
				this._callDialog();
			}

		},

		handleInputSupplierBatch: function (oEvent) {

			this._SelectedTableIndex = this._getSelectedItemInModel(oEvent);

			var oTable = this.byId("idProductsTable");
			/*var aSelectedItens = oTable.getSelectedContexts();
			var aItems = aSelectedItens.map(function (oItem) {
				return oItem.getPath();
			});*/
			var aList = oTable.getBinding("items").oList;

			var sMaterial = aList[this._SelectedTableIndex].Material,
				sPlant = aList[this._SelectedTableIndex].Plant,
				sStorageLocation = aList[this._SelectedTableIndex].StorageLocation_input;

			var oRow = oEvent.getSource().getParent();
			var oCells = oRow.getCells();
			var oBatch = oCells[15];

			var oBatchData = {
				Material: sMaterial,
				Plant: sPlant,
				SupplierBatch: oEvent.getParameter("value")

			};

			this._getSAPBatch(oBatchData, oBatch);

		},

		onScanSuccess: function (oEvent) {

			if (oEvent.getParameter("cancelled")) {
				MessageToast.show("Scan cancelled", {
					duration: 1000
				});
			} else {
				if (oEvent.getParameter("text")) {

					var oModel = this.getView().getModel("oFrontend");
					var aItems = oModel.getProperty("/Items");
					this._SelectedTableIndex = this._getSelectedItemInModel(oEvent);

					var sMaterial = aItems[this._SelectedTableIndex].Material,
						sPlant = aItems[this._SelectedTableIndex].Plant,
						sStorageLocation = aItems[this._SelectedTableIndex].StorageLocation_input;

					var oRow = oEvent.getSource().getParent();
					var oCells = oRow.getCells();
					oCells[16].setValue(oEvent.getParameter("text"));

					var oBatch = oCells[15];

					var oBatchData = {
						Material: sMaterial,
						Plant: sPlant,
						SupplierBatch: oEvent.getParameter("text")
					};

					this._getSAPBatch(oBatchData, oBatch);

				} else {}
			}
		},

		closeDialog: function () {
			this._oDialog.close();
		},

		onScanError: function (oEvent) {
			MessageToast.show("Scan failed: " + oEvent, {
				duration: 1000
			});
		},

		onScanLiveupdate: function (oEvent) {
			// User can implement the validation about inputting value
		},

		_callDialog: function () {

			var oView = this.getView();
			if (!this._oDialog) {
				sap.ui.core.Fragment.load({
					name: "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.fragment.BinDialog",
					id: oView.getId(),
					controller: this
				}).then(function (oDialog) {
					this._oDialog = oDialog;
					this.getView().addDependent(oDialog);
					this._oDialog.open();
				}.bind(this));
			} else {
				this._oDialog.open();
			}

		},

		_getSAPBatch: function (oBatchData, oBatch) {

			var aTableFilter = [];
			this._addFilter(aTableFilter, oBatchData.Material, "Material");
			this._addFilter(aTableFilter, oBatchData.Plant, "Plant");
			this._addFilter(aTableFilter, oBatchData.SupplierBatch, "SupplierBatch");

			var oModel = this.getOwnerComponent().getModel("oData");
			var mParameters = {
				filters: aTableFilter,
				success: function (oData, response) {
					oBatch.setValue(oData.results[0].Batch);
				}.bind(this),
				error: function (oError) {
					console.log(oError);
				}.bind(this)
			};

			var sPath = "/SAPBatchSet";
			oModel.read(sPath, mParameters);

		},

		onSaveAddress: function () {
			//var oTable = this.getView().byId("table0");
			var aItems = this.getView().getModel("bindata").getData(),
				vEntity = "/BinSet";
			var oBinCreate = {};

			var oModel = this.getView().getModel("oData");
			var mParameters = {
				success: function (oData, response) {
					this._oDialog.close();
				}.bind(this),
				error: function (oError) {
					console.log(oError);
				}
			};

			for (var i = 0; i < aItems.Bin.length; i++) {

				oBinCreate = {};
				oBinCreate.CompanyCode = aItems.Bin[i].CompanyCode;
				oBinCreate.Country = "";
				oBinCreate.MatDocPos = aItems.Bin[i].MatDocPos;
				oBinCreate.Quantity = String(aItems.Bin[i].Quantity);
				oBinCreate.Plant = aItems.Bin[i].Plant;
				oBinCreate.StorageLocation = aItems.Bin[i].StorageLocation;
				oBinCreate.StorageBin = aItems.Bin[i].StorageBin;
				oBinCreate.Material = aItems.Bin[i].Material;
				oBinCreate.Batch = aItems.Bin[i].Batch;
				oBinCreate.Order = aItems.Bin[i].Order;
				oBinCreate.OriginDocument = aItems.Bin[i].OriginDocument;
				oBinCreate.Item = aItems.Bin[i].Item;
				oBinCreate.Customer = "";
				oBinCreate.QuantitySO = "0";
				oBinCreate.Unit = aItems.Bin[i].Unit;

				oModel.create(vEntity, oBinCreate, mParameters);

			}

		},

		onValueRequestBin: function (oEvent) {

			this._SelectedTableIndex = this._getSelectedItemBinInModel(oEvent);

			var oButton = oEvent.getSource(),
				oView = this.getView();

			if (!this._pDialog) {
				this._pDialog = sap.ui.core.Fragment.load({
					id: oView.getId(),
					name: "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.fragment.selectStorageBin",
					controller: this
				}).then(function (oDialog) {
					oView.addDependent(oDialog);
					return oDialog;
				}.bind(this));
			}

			this._pDialog.then(function (oDialog) {
				this._configDialog(oButton, oDialog);
				oDialog.open();
			}.bind(this));

		},

		_configDialog: function (oButton, oDialog) {

			// Multi-select if required
			var bMultiSelect = !!oButton.data("multi");
			oDialog.setMultiSelect(bMultiSelect);

			var sCustomConfirmButtonText = oButton.data("confirmButtonText");
			oDialog.setConfirmButtonText(sCustomConfirmButtonText);

			// Remember selections if required
			var bRemember = !!oButton.data("remember");
			oDialog.setRememberSelections(bRemember);

			//add Clear button if needed
			var bShowClearButton = !!oButton.data("showClearButton");
			oDialog.setShowClearButton(bShowClearButton);

			// Set growing property
			var bGrowing = oButton.data("growing");
			oDialog.setGrowing(bGrowing == "true");

			// Set growing threshold
			var sGrowingThreshold = oButton.data("threshold");
			if (sGrowingThreshold) {
				oDialog.setGrowingThreshold(parseInt(sGrowingThreshold, 10));
			}

			// Set draggable property
			var bDraggable = !!oButton.data("draggable");
			oDialog.setDraggable(bDraggable);

			// Set draggable property
			var bResizable = !!oButton.data("resizable");
			oDialog.setResizable(bResizable);

			// Set style classes
			var sResponsiveStyleClasses =
				"sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer";
			var bResponsivePadding = !!oButton.data("responsivePadding");
			oDialog.toggleStyleClass(sResponsiveStyleClasses, bResponsivePadding);

			// clear the old search filter
			//oDialog.getBinding("items").filter([]);

			// toggle compact style
			//syncStyleClass("sapUiSizeCompact", this.getView(), oDialog);

			var oModelData = this.getView().getModel("bindata");
			var aItems = oModelData.getData();
			var sPlant = aItems.Bin[this._SelectedTableIndex].Plant,
				sStorageLocation = aItems.Bin[this._SelectedTableIndex].StorageLocation;

			var aFilters = [];
			this._addFilter(aFilters, sPlant, "Plant");
			this._addFilter(aFilters, sStorageLocation, "StorageLocation");
			var oModel = this.getView().getModel("oData");
			var vEntity;

			var mParameters = {
				filters: aFilters,
				success: function (oData, response) {
					this.getView().getModel("bindatavh").setProperty("/data", oData.results);
				}.bind(this),
				error: function (oError) {}.bind(this)
			};
			oModel.read("/BinVHSet", mParameters);

		},

		_handleStorageBinSearch: function (oEvent) {

			var sValue = oEvent.getParameter("value");
			var oFilter = new Filter("Bin", FilterOperator.Contains, sValue);
			var oBinding = oEvent.getParameter("itemsBinding");
			oBinding.filter([oFilter]);

		},

		_handleStorageBinClose: function (oEvent) {

			var aContexts = oEvent.getParameter("selectedContexts");
			if (aContexts && aContexts.length) {
				var oContext = aContexts.map(function (oContext) {
					return oContext;
				});
			} else {
				MessageToast.show("No new item was selected.");
			}

			oEvent.getSource().getBinding("items").filter([]);

			var oModel = this.getView().getModel("bindata");
			if (oContext) {
				oModel.setProperty("/Bin/" + this._SelectedTableIndex + "/CompanyCode", oContext[0].getObject().CompanyCode);
				oModel.setProperty("/Bin/" + this._SelectedTableIndex + "/StorageBin", oContext[0].getObject().Bin);
			}
			this._pDialog = undefined;

		},

		_getSelectedItemBinInModel: function (oEvent) {
			var sPath = oEvent.getSource().getBindingContext("bindata").getPath();
			return parseInt(sPath.substring(5, sPath.length), 10);
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
		// Begin scale change
		handleScaleWeightGet: function (oEvent) {
			var oDataModel = this.getView().getModel("oFrontend");
			var aItems = oDataModel.getProperty("/Items");
			this._SelectedTableIndex = this._getSelectedItemInModel(oEvent);
			var vPlant = aItems[this._SelectedTableIndex].Plant,
				vScale = aItems[this._SelectedTableIndex].ScaleNo;
			//fetch default scale
			if (!vScale) {
				let Order = this.getView().getModel("oFrontend").getData().Ebeln,
					// Dummy Values
					ScaleNo = 99,
					Werks = "0300",
					Spras = "E";
				let scaleKey = "ScaleNo='" + ScaleNo + "'," + "Werks='" + Werks + "'," + "Spras='" + Spras + "'," + "Order='" + Order + "'";
				var oModel = this.getOwnerComponent().getModel("oData");
				oModel = this.getOwnerComponent().getModel("oData");
				oModel.read("/ScaleHelpSet(" + scaleKey + ")", {
					success: function (oData, oResponse) {
						let vScaleNo = oData.ScaleNo;
						if (vScaleNo === "") {
							this.getView().setBusy(false);
							MessageToast.show("Default Scale is not maintained");
						} else {
							this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/ScaleNo", vScaleNo);
							// Read Weight
							vScaleNo = vScaleNo.replace(" ", "");
							vPlant = "0030";
							this.getView().setBusy(true);
							var key = "ScaleNo='" + vScaleNo + "'," + "Plant='" + vPlant + "'";
							oModel.read("/ScaleWeightSet(" + key + ")", {
								success: function (oData, oRes) {
									if (oData.Status === "00") {
										this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/DeliveredQuantity_input",
											oData.Quantity);
										this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input", oData.Unit);
										this.getView().setBusy(false);
										MessageToast.show("Quantity Updated");
									} else {
										this.getView().setBusy(false);
										if (oData.Status) {
											MessageToast.show(oData.Status);
										} else {
											MessageToast.show("No response from scale");
										}
									}
								}.bind(this),
								error: function (oError) {
									this.getView().setBusy(false);
									MessageToast.show("Technical error, please contact developer");
								}
							});
						}
					}.bind(this),
					error: function (oError) {
						MessageToast.show(oError);
					}
				});
				this.getView().setBusy(false);
			}
			if (vScale) {
				vScale = vScale.replace(" ", "");
				vPlant = "0030";
				this.getView().setBusy(true);
				var oModel = this.getOwnerComponent().getModel("oData");
				var key = "ScaleNo='" + vScale + "'," + "Plant='" + vPlant + "'";
				oModel.read("/ScaleWeightSet(" + key + ")", {
					success: function (oData, oResponse) {
						if (oData.Status === "00") {
							this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/DeliveredQuantity_input", oData.Quantity);
							this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input", oData.Unit);
							this.getView().setBusy(false);
							MessageToast.show("Quantity Updated");
						} else {
							this.getView().setBusy(false);
							if (oData.Status) {
								MessageToast.show(oData.Status);
							} else {
								MessageToast.show("No response from scale");
							}
						}
					}.bind(this),
					error: function (oError) {
						this.getView().setBusy(false);
						MessageToast.show("Technical error, please contact developer");
					}
				});
			}

		},
		getScalelist: function (oEvent) {
			var oModel = this.getOwnerComponent().getModel("oData");
			oModel.read("/ScaleHelpSet", {
				success: function (oData, oResponse) {
					var scaleModel = new sap.ui.model.json.JSONModel();
					var myData = {};
					myData = oData;
					scaleModel.setData(myData);
					this.getView().setModel(scaleModel, "scalemodel");
				}.bind(this),
				error: function (oError) {
					MessageToast.show(oError);
				}
			});
		},
		handleScaleSelect: function (oEvent) {
			var vScale = oEvent.getParameter("selectedItem").getText();
			if (vScale) {
				this._SelectedTableIndex = this._getSelectedItemInModel(oEvent);
				this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/ScaleNo", vScale);
			}
		}

	});
});