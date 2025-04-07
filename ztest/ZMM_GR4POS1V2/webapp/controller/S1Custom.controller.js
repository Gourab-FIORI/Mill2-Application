sap.ui.define(["s2p/mm/im/goodsreceipt/purchaseorder/controller/BaseController", "sap/ui/model/json/JSONModel", "s2p/mm/im/goodsreceipt/purchaseorder/model/formatter", "sap/ui/model/Filter", "sap/ui/model/FilterOperator", "ui/s2p/mm/im/lib/materialmaster/controller/ValueHelpController", "sap/m/MessageToast", "sap/ui/generic/app/navigation/service/NavigationHandler", "sap/ui/Device", "sap/m/MessageBox", "sap/ui/core/MessageType", "sap/ui/core/message/Message", "sap/ui/model/BindingMode", "sap/ui/core/IconColor", "s2p/mm/im/goodsreceipt/purchaseorder/controller/utils/SubItemController"], function (e, t, a, r, i, s, o, l, n, u, d, c, p, g, h) {
    "use strict";
    return sap.ui.controller("s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.controller.S1Custom", {
        formatter: a,
        onInit: function () {
            var e = {
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
            var a = new t(e);
            this.getView().setModel(a, "bindata");
            var r = {
                data: [{
                    CompanyCode: "",
                    Plant: "",
                    StorageLocation: "",
                    Bin: "",
                    Description: ""
                }]
            };
            var i = new t(r);
            this.getView().setModel(i, "bindatavh");
            var o = this;
            var l = sap.ui.core.UIComponent.getRouterFor(this);
            this._oNavigationService = new sap.ui.generic.app.navigation.service.NavigationHandler(this);
            this._oCopilotActive = false;
            this._oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "dd.MM.yyyy",
                strictParsing: "true"
            });
            this._aSemanticChartColors = ["sapUiChart1", "sapUiChart2", "sapUiChart3", "sapUiChart4", "sapUiChart5", "sapUiChart6", "sapUiChart7", "sapUiChart8", "sapUiChart9", "sapUiChart10"];
            var u = sap.ui.core.Component.getOwnerIdFor(this.getView());
            var d = sap.ui.component(u).getComponentData();
            this._SourceOfGR = "";
            this._SourceOfGRIsPurchaseOrder = "PURORD";
            this._SourceOfGRIsInboundDelivery = "INBDELIV";
            this._SourceOfGRIsProductionOrder = "PRODORD";
            this._SourceOfGRIsNoReference = "NOREF";
            if (d && d.startupParameters && d.startupParameters.SourceOfGR) {
                this._SourceOfGR = d.startupParameters.SourceOfGR[0]
            } else {
                this._SourceOfGR = jQuery.sap.getUriParameters().get("SourceOfGR")
            }
            if (this._SourceOfGR === null) {
                this._SourceOfGR = this._SourceOfGRIsPurchaseOrder
            }
            n.orientation.attachHandler(this._devicehandling(), this);
            if (this._SourceOfGR !== this._SourceOfGRIsNoReference && this.getView().byId("shareTile")) {
                this.getView().byId("shareTile").setBeforePressHandler(jQuery.proxy(this.handleBookmarkBeforePress, this))
            }
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                this._toggleBusy(true);
                this._initController();
                var c = "idApplSettingsBtn";
                var p = sap.ui.getCore().byId(c);
                if (p !== undefined) {
                    p.destroy()
                }
                if (sap.ushell) {
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        sap.ushell.services.AppConfiguration.addApplicationSettingsButtons([new sap.m.Button({
                            id: c,
                            text: this.getResourceBundle().getText("SETTINGS_TITLE"),
                            press: jQuery.proxy(function () {
                                this._showSettingsDialog({})
                            }, this)
                        })])
                    }
                }
                var g = this.getOwnerComponent().getModel("oData");
                g.setRefreshAfterChange(false);
                g.setDefaultCountMode(sap.ui.model.odata.CountMode.Inline);
                this.getView().setModel(g, "oData");
                var h = this.getOwnerComponent().getModel("oDataHelp") || {};
                var m = new sap.ui.model.json.JSONModel;
                m.setData(this._getInitFrontend());
                this.getView().setModel(m, "oFrontend");
                this.getOwnerComponent().getModel("oData2").read("/MMIMInventSpecialStockTypeVH", {
                    success: jQuery.proxy(this._successSpecialStockLoad, this),
                    error: jQuery.proxy(this._handleOdataError, this)
                });
                if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                    this._getInitialItem(0)
                }
                this._ResetStorageLocationBuffer = false;
                this._ResetBatchBuffer = false;
                l.attachRoutePatternMatched(this, this._handleRouteMatched);
                if (!this._oPostDialog) {
                    this._oPostDialog = sap.ui.xmlfragment({
                        fragmentName: "s2p.mm.im.goodsreceipt.purchaseorder.view.successPost",
                        type: "XML",
                        id: "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.successPost"
                    }, this);
                    this.getView().addDependent(this._oPostDialog)
                }
                var S = {
                    container: "s2p.mm.im.goodsreceipt.purchaseorder",
                    item: "app"
                };
                if (sap.ushell && sap.ushell.Container) {
                    this._oPersonalizer = sap.ushell.Container.getService("Personalization").getPersonalizer(S)
                }
                if (this._oPersonalizer) {
                    var f = this._oPersonalizer.getPersData().done(function (e) {
                        if (e) {
                            o._oPersonalizedDataContainer = e;
                            if (!o._oPersonalizedDataContainer.PresetDocumentItemTextFromPO) {
                                o._oPersonalizedDataContainer.PresetDocumentItemTextFromPO = false
                            }
                            if (!o._oPersonalizedDataContainer.SelectPROD) {
                                o._oPersonalizedDataContainer.SelectPROD = false
                            }
                            if (!o._oPersonalizedDataContainer.EnableBarcodeScanning) {
                                o._oPersonalizedDataContainer.EnableBarcodeScanning = false
                            }
                            if (!o._oPersonalizedDataContainer.VersionForPrintingSlip || o._oPersonalizedDataContainer.VersionForPrintingSlip === "none") {
                                o._oPersonalizedDataContainer.VersionForPrintingSlip = "none"
                            }
                            o._setScanButtonVisibility();
                            o._setSearchPlaceholderText()
                        }
                    }).fail(function () {
                        jQuery.sap.log.error("Reading personalization data failed.")
                    })
                }
                var _ = jQuery.sap.getUriParameters().get("sap-mmim-testmode");
                if (!(_ && parseInt(_) > 0)) {
                    if (d && d.startupParameters && d.startupParameters.sap_mmim_testmode) {
                        _ = d.startupParameters.sap_mmim_testmode[0]
                    }
                }
                if (_ && parseInt(_) > 0) {
                    var I = "/sap/opu/odata/sap/MMIM_EXTERNALTEST_SRV";
                    var y = new sap.ui.model.odata.ODataModel(I, true);
                    var P = {};
                    P.AverageProcessingDuration = "" + parseInt(_);
                    P.CreatedByUser = "";
                    var v = "/TestModeSet";
                    y.create(v, P, null, function (e, t) {}, this._handleOdataError.bind(this))
                }
                if (sap.ushell && sap.ushell.Container) {
                    var b = new Array;
                    var D = "#MaterialMovement-displayFactSheet?MaterialDocument=123&MaterialDocumentYear=2016";
                    b.push(D);
                    var T = "#Supplier-displayFactSheet";
                    b.push(T);
                    if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                        var M = "#PurchaseOrder-displayFactSheet";
                        b.push(M)
                    } else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                        var C = "#ProductionOrder-displayFactSheet";
                        b.push(C)
                    } else {
                        var E = "#InboundDelivery-displayFactSheet";
                        b.push(E)
                    }
                    var V = "#Material-displayFactSheet";
                    b.push(V);
                    var O = "#Batch-create";
                    b.push(O);
                    var x = "#OutboundDelivery-displayFactSheet";
                    b.push(x);
                    var L = "#InboundDelivery-displayFactSheet";
                    b.push(L);
                    var R = sap.ushell.Container.getService("CrossApplicationNavigation");
                    var B = R.isNavigationSupported(b).done(function (e) {
                        if (e) {
                            o._isIntentSupported.MaterialMovementDisplay = e[0].supported || false;
                            o._isIntentSupported.SupplierDisplay = e[1].supported || false;
                            o._isIntentSupported.PurchaseOrderDisplay = e[2].supported || false;
                            o._isIntentSupported.MaterialDisplay = e[3].supported || false;
                            o._isIntentSupported.BatchCreate = e[4].supported || false;
                            o._isIntentSupported.OutboundDeliveryDisplay = e[5].supported || false;
                            o._isIntentSupported.InboundDeliveryDisplay = e[6].supported || false;
                            o._isIntentSupported.ProductionOrderDisplay = e[2].supported || false;
                            if (o.getView().getModel("oFrontend")) {
                                o.getView().getModel("oFrontend").setProperty("/SupplierDisplayActive", o._isIntentSupported.SupplierDisplay);
                                o.getView().getModel("oFrontend").setProperty("/PurchaseOrderDisplayActive", o._isIntentSupported.PurchaseOrderDisplay);
                                o.getView().getModel("oFrontend").setProperty("/MaterialDisplayActive", o._isIntentSupported.MaterialDisplay);
                                o.getView().getModel("oFrontend").setProperty("/CreateBatchActive", o._isIntentSupported.BatchCreate);
                                o.getView().getModel("oFrontend").setProperty("/ProductionOrderDisplayActive", o._isIntentSupported.ProductionOrderDisplay);
                                if (o._initialDataLoaded) {
                                    o._initialDataLoaded.SupplierDisplayActive = o._isIntentSupported.SupplierDisplay;
                                    o._initialDataLoaded.PurchaseOrderDisplayActive = o._isIntentSupported.PurchaseOrderDisplay;
                                    o._initialDataLoaded.MaterialDisplayActive = o._isIntentSupported.MaterialDisplay;
                                    o._initialDataLoaded.CreateBatchActive = o._isIntentSupported.BatchCreate;
                                    o._initialDataLoaded.ProductionOrderDisplayActive = o._isIntentSupported.ProductionOrderDisplay
                                }
                            }
                        }
                    }).fail(function () {
                        jQuery.sap.log.error("Reading intent data failed.")
                    })
                }
                var w;
                var A;
                if (d && d.startupParameters && d.startupParameters.PurchaseOrder && this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                    w = d.startupParameters.PurchaseOrder[0]
                }
                if (d && d.startupParameters && d.startupParameters.InboundDelivery && this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
                    w = d.startupParameters.InboundDelivery[0];
                    if (w) {
                        w = "" + parseInt(w, 10)
                    }
                }
                if (d && d.startupParameters && d.startupParameters.ProductionOrder && this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                    w = d.startupParameters.ProductionOrder[0]
                }
                if (w) {
                    A = this.getView().byId("POInput");
                    A.setValue(w);
                    A.setEditable(false);
                    A.fireChangeEvent(w)
                } else {
                    this._oNavigationService.parseNavigation().done(function (e, t, a) {
                        if (o._SourceOfGR !== o._SourceOfGRIsNoReference) {
                            if (e && e.customData && e.customData.Ebeln) {
                                if (o.getView().byId("POInput")) {
                                    o.getView().byId("POInput").setValue(e.customData.Ebeln)
                                }
                                o._readPO(e.customData.Ebeln, e.customData)
                            }
                        } else {
                            if (e && e.customData && !e.customData.successPostDialog) {
                                o._restoreInnerAppStateSourceOfGRIsNoReference(e.customData)
                            }
                        }
                        if (e && e.customData && e.customData.successPostDialog) {
                            var r = new sap.ui.model.json.JSONModel(e.customData.successPostDialog);
                            o._oPostDialog.setModel(r);
                            o._oPostDialog.open();
                            sap.ui.getCore().getMessageManager().removeAllMessages()
                        }
                        var i = o.getView().byId("POInput");
                        if (i) {
                            jQuery.sap.delayedCall(200, this, function () {
                                i.focus();
                                i.selectText(0, 99)
                            })
                        }
                    });
                    this._toggleBusy(false)
                }
                if (s) {
                    this._oValueHelpController = new s;
                    this._oValueHelpController.init(h)
                }
                this._setSearchPlaceholderText();
                this._aExtendedFields = [];
                var F = g.getMetaModel().loaded().then(function (e) {
                    var t = o.getOwnerComponent().getModel("oData").getMetaModel().getODataEntityType("Z_MMIM_GR4PO_DL_SRV.GR4PO_DL_Item").property;
                    for (var a = 0; a < t.length; a++) {
                        if (t[a]["sap:is-extension-field"]) {
                            if (JSON.parse(t[a]["sap:is-extension-field"]) === true) {
                                o._aExtendedFields.push(t[a])
                            }
                        }
                    }
                    if (o._aExtendedFields.length === 0) {
                        o.getOwnerComponent().getModel("oData").setDefaultBindingMode(sap.ui.model.BindingMode.OneWay)
                    }
                });
                if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                    if (o._oPersonalizer) {
                        o._oPersonalizedDataContainer.EnableBarcodeScanning = true;
                        o._setScanButtonVisibility();
                        o._setSearchPlaceholderText()
                    }
                }
                this.getModel("oFrontend").setProperty("/ScaleButtonVisible", true);
                if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                    this.getScalelist()
                }
            }
            if (this.getView().sViewName == "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                if (l.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType.XML).getController() === undefined) {
                    this.getRouter().getTargets().display("notFound", {
                        fromTarget: "home"
                    })
                } else {
                    if (!jQuery.support.touch) {
                        this.getView().addStyleClass("sapUiSizeCompact")
                    }
                    var N = new sap.ui.model.json.JSONModel;
                    this._oValueHelpController = l.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType.XML).getController()._oValueHelpController;
                    this._aValidStockTypes = l.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType.XML).getController()._aValidStockTypes;
                    this._oNavigationServiceFields = {};
                    this._oNavigationServiceFields.aHeaderFields = l.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType.XML).getController()._oNavigationServiceFields.aHeaderFields;
                    this._oNavigationServiceFields.aItemFields = l.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType.XML).getController()._oNavigationServiceFields.aItemFields;
                    this._aExtendedFields = l.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType.XML).getController()._aExtendedFields;
                    this.getView().setModel(N, "oItem");
                    this.getView().setModel(l.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S1", sap.ui.core.mvc.ViewType.XML).getModel("oFrontend"), "oFrontend");
                    this.getView().byId("idGoodsMovementReasonCodeSelect").setModel("oData", this.getOwnerComponent().getModel("oData"));
                    if (this._aExtendedFields.length) {
                        this.getView().getModel("oFrontend").setProperty("/ExtensionSectionVisible", true);
                        this.getView().byId("idExtensionForm").setModel(this.getOwnerComponent().getModel("oData"));
                        this.getView().byId("idExtensionForm").getModel().setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                        this.getView().byId("idExtensionForm").getModel().setDeferredGroups(["edititems"]);
                        this.getView().byId("idExtensionForm").getModel().setChangeBatchGroups({
                            GR4PO_DL_Header: {
                                batchGroupId: "edititems"
                            },
                            GR4PO_DL_Item: {
                                batchGroupId: "edititems"
                            }
                        })
                    }
                }
            }
            this._oQuantFormat = sap.ui.core.format.NumberFormat.getFloatInstance({
                maxFractionDigits: 3,
                minIntegerDigits: 1,
                maxIntegerDigits: 10,
                groupingEnabled: true
            });
            this._oBatchHelp = {};
            this._NumberFormatter = sap.ui.core.format.NumberFormat.getFloatInstance({
                style: "short"
            });
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
            this.getView().getModel("message").attachMessageChange(null, this._onMessageChange, this)
        },
        _handleOdataError: function (e, t) {
            if (!t) {
                t = this
            }
            t._toggleBusy(false);
            if (t.getView().getModel("message")) {
                t.getView().getModel("message").fireMessageChange()
            }
        },
        _toggleBusy: function (e) {
            if (this.getView().byId("idProductsTable")) {
                this.getView().byId("idProductsTable").setBusy(e);
                this.getView().byId("idProductsTable").setBusyIndicatorDelay(0)
            }
        },
        onExit: function () {
            if (this._oValueHelpController) {
                this._oValueHelpController.exit()
            }
            if (sap.m.InstanceManager.hasOpenPopover()) {
                sap.m.InstanceManager.closeAllPopovers()
            }
            if (sap.m.InstanceManager.hasOpenDialog()) {
                sap.m.InstanceManager.closeAllDialogs()
            }
            this.getView().getModel("message").detachMessageChange(this._onMessageChange, this)
        },
        onMessagesButtonPress: function (e) {
            var t = e.getSource();
            this._oMessagePopover.toggle(t)
        },
        onAfterRendering: function () {
            if (this._MessageShown !== undefined && this._MessageShown === false) {
                this._oMessagePopover.openBy(this.getView().byId("idMessageIndicator"));
                this._MessageShown = true
            }
            if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                if (sap.cp && sap.cp.ui.services && sap.cp.ui.services.CopilotApi) {
                    sap.cp.ui.services.CopilotApi.getChats().then(function (e) {
                        this._aCopilotChats = e
                    }.bind(this));
                    this._oCopilotActive = true;
                    this.getView().getModel("oFrontend").setProperty("/CopilotActive", this._oCopilotActive)
                }
            }
        },
        _onMessageChange: function (e) {
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom" && this.getView().byId("idPage").getMessagesIndicator().getDomRef() !== null) {
                this._oMessagePopover.openBy(this.getView().byId("idMessageIndicator"))
            } else {
                this._MessageShown = false
            }
        },
        _devicehandling: function (e) {
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                if (n.resize.width >= 1900) {
                    this.getView().addStyleClass("sapUiSizeCompact")
                } else if (n.resize.width >= 450) {
                    this.getView().byId("POInput").setWidth("100%")
                } else {
                    this.getView().byId("POInput").setWidth("100%");
                    this.getView().byId("idPOItemsCountTableHeader").setWidth("4rem")
                }
            }
        },
        _loadAttachmentComponent: function (e) {
            try {
                var t = this.getView().getModel("oFrontend");
                var a = t.getProperty("/Ebeln");
                if (a) {
                    var r = this.getUniqueKey();
                    var i = "I";
                    var s = "BUS2017";
                    var o = this;
                    if (e) {
                        this.temp_objectKey = e
                    } else {
                        this.temp_objectKey = a + "GR" + r
                    }
                    if (!this.oCompAttachProj) {
                        if (this.getOwnerComponent().getModel("oDataHelp").getServiceMetadata().dataServices.schema[0].entityType.length >= 15) {
                            this.oCompAttachProj = this.getOwnerComponent().createComponent({
                                usage: "attachmentReuseComponent",
                                settings: {
                                    mode: i,
                                    objectKey: this.temp_objectKey,
                                    objectType: s
                                }
                            });
                            this.oCompAttachProj.then(function (e) {
                                o.byId("idastestcompContainer").setComponent(e)
                            })
                        } else {
                            t.setProperty("/AttachmentVisible", false)
                        }
                    }
                }
            } catch (e) {
                t.setProperty("/AttachmentVisible", false)
            }
        },
        getUniqueKey: function () {
            var e = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "ddMMYYYYHHmmss"
            });
            var t = new Date;
            return e.format(t)
        },
        _getInitFrontend: function () {
            var e = "50%";
            if (!jQuery.support.touch) {
                e = "35%"
            }
            var t = {
                saveAsTileTitle: "",
                saveAsTileSubtitle: "",
                saveAsTileURL: "",
                shareOnJamTitle: "",
                searchPlaceholderText: "",
                fullscreenTitle: "",
                searchFieldLabel: "",
                visible: false,
                DocumentInputVisible: true,
                BillOfLadingVisible: true,
                HeaderContentVisible: true,
                ColumnOpenQuantityVisible: true,
                Objectheader: "",
                Objectheadertext: "",
                CopyButtonVisible: false,
                DeleteButtonVisible: false,
                PostButtonEnabled: false,
                PostButtonVisible: false,
                ScanButtonVisible: false,
                DocumentDate: this._oDateFormat.format(new Date),
                PostingDate: this._oDateFormat.format(new Date),
                DocumentDate_valueState: sap.ui.core.ValueState.None,
                PostingDate_valueState: sap.ui.core.ValueState.None,
                ColumnBatchVisible: false,
                ColumnManufactureDateVisible: false,
                ColumnShelfLifeExpirationDateVisible: false,
                ColumnStorageBinVisible: false,
                DeliveredQuantityEditable: true,
                StockTypeNOREFEnabled: true,
                DeliveredUnitEditable: true,
                ManufactureDateMandatory_valueState: sap.ui.core.ValueState.None,
                ShelfLifeExpirationDateMandatory_valueState: sap.ui.core.ValueState.None,
                Items: [],
                VersionForPrintingSlipAppSetting: this._aVersionForPrintingSlipAppSetting,
                VersionForPrintingSlip: this._aVersionForPrintingSlip,
                VersionForPrintingSlip_selectedKey: "0",
                SourceOfGR: this._SourceOfGR,
                ExtensionSectionVisible: false,
                maxSuggestionWidth: e,
                CopilotActive: this._oCopilotActive
            };
            if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                t.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PO");
                t.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PO");
                t.searchFieldLabel = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PO");
                t.Ebeln_label = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PO");
                t.Ebeln_maxLength = 10;
                t.Ebeln_possibleLength = [10]
            } else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                t.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PROD");
                t.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PROD");
                t.searchFieldLabel = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PROD");
                t.Ebeln_label = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PROD");
                t.Ebeln_maxLength = 12;
                t.Ebeln_possibleLength = [12];
                t.BillOfLadingVisible = false
            } else if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                t.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_NOREF");
                t.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_NOREF");
                t.Objectheader = this.getResourceBundle().getText("OBJECT_HEADER_NOREF");
                t.DocumentInputVisible = false;
                t.visible = true;
                t.BillOfLadingVisible = false;
                t.PostButtonVisible = true;
                t.ColumnNonVltdGRBlockedStockQty = false;
                t.ColumnOpenQuantityVisible = false;
                t.ColumnSplitVisible = false;
                t.ColumnIsReturnsItemVisible = false;
                t.ColumnAccountAssignmentVisible = false;
                t.CopyButtonVisible = true;
                t.DeleteButtonVisible = true;
                t.saveShareEmailActive = false;
                t.shareTileActive = false
            } else {
                t.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_DL");
                t.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_DL");
                t.searchFieldLabel = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_DL");
                t.Ebeln_label = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_DL");
                t.Ebeln_maxLength = 10;
                t.Ebeln_possibleLength = [9, 10]
            }
            return t
        },
        _initController: function () {
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
                text: this.getResourceBundle().getText("SELECT_ITEM_OUTPUT_NONE")
            }];
            this._oPersonalizedDataContainer = {
                deliveredQuantityDefault2open: true,
                deliveredQuantityDefault20: false,
                PresetDocumentItemTextFromPO: false,
                SelectPROD: true,
                EnableBarcodeScanning: false,
                VersionForPrintingSlip: "0"
            };
            if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                this._oNavigationServiceFields = {
                    aHeaderFields: ["DocumentDate", "PostingDate", "Ebeln", "DeliveryDocumentByVendor", "MaterialDocumentHeaderText", "BillOfLading", "VersionForPrintingSlip_selectedKey"],
                    aItemFields: ["DocumentItem", "ItemCounter", "DocumentItemText", "DeliveredQuantity_input", "DeliveredUnit_input", "OpenQuantity", "Unit", "Plant", "StorageLocation", "StockType_selectedKey", "DeliveryCompleted", "NonVltdGRBlockedStockQty", "StorageLocation_input", "ReasonCode", "ShelfLifeExpirationDate", "ManufactureDate", "Selected"]
                }
            } else {
                this._oNavigationServiceFields = {
                    aHeaderFields: ["DocumentDate", "PostingDate", "VersionForPrintingSlip_selectedKey"],
                    aItemFields: ["DocumentItem", "ItemCounter", "Material_Input", "MaterialText", "Material_Name", "POItemsCountTableHeader", "OpenQuantity", "Unit", "Plant", "Plant_Input", "StorageLocation", "StockType_selectedKey", "InventorySpecialStockTypeName", "StorageLocation_input", "ReasonCode", "ShelfLifeExpirationDate", "ManufactureDate", "Selected"]
                }
            }
            this._isIntentSupported = {
                MaterialMovementDisplay: false,
                SupplierDisplay: false,
                MaterialDisplay: false,
                PurchaseOrderDisplay: false,
                BatchCreate: false,
                ProductionOrderDisplay: false,
                OutboundDeliveryDisplay: false,
                InboundDeliveryDisplay: false
            };
            this._aCopilotChats = []
        },
        concatenateNameIdFormatter: function (e, t) {
            if (e) {
                if (t !== "") {
                    e = e + " (" + t + ")"
                }
                return e
            } else {
                if (t) {
                    return t
                } else {
                    return null
                }
            }
        },
        concatenateDocumentNumberYear: function (e, t) {
            if (t && t !== "0000") {
                return e + "/" + t
            }
            return e
        },
        concatenateNumberOfComponents: function (e, t) {
            return e + " (" + t + ")"
        },
        onNavBack: function () {
            var e = sap.ushell.Container.getService("CrossApplicationNavigation");
            var t = this;
            var a = t.getResourceBundle();
            var r = true;
            this.oModel = this.getOwnerComponent().getModel("oData");
            this.aBinData = this.getView().getModel("bindata").getData();
            var i = JSON.stringify(this._getInnerAppState());
            if (i && this._initialDataLoaded && this._initialDataLoaded != null) {
                var s = JSON.stringify(this._getInnerAppState(this._initialDataLoaded));
                if (s !== i) {
                    var r = false;
                    sap.m.MessageBox.confirm(a.getText("MESSAGE_DATA_LOSS"), {
                        icon: sap.m.MessageBox.Icon.QUESTION,
                        title: a.getText("MESSAGE_DATA_LOSS_TITLE"),
                        onClose: o,
                        styleClass: "sapUiSizeCompact",
                        initialFocus: sap.m.MessageBox.Action.CANCEL
                    })
                }
            }
            if (r === true) {
                e.backToPreviousApp()
            }

            function o(t) {
                if (t === "OK") {
                    if (this.aBinData && this.aBinData.Bin) {
                        var a = this.aBinData.Bin;
                        for (var r = 0; r < a.length; r++) {
                            this.oModel.remove(a[r], {
                                success: function (e, t) {}.bind(this),
                                error: function (e) {
                                    console.error(e)
                                }.bind(this)
                            })
                        }
                    }
                    e.backToPreviousApp()
                }
            }
        },
        onShareInJamPress: function () {
            var e;
            var t = (new URI).toString().split("#");
            if (t[0]) {
                e = t[0] + this._generateAppStateExternalUrl()
            }
            var a = this.getModel("oFrontend");
            var r = sap.ui.getCore().createComponent({
                name: "sap.collaboration.components.fiori.sharing.dialog",
                settings: {
                    object: {
                        id: e,
                        share: a.getProperty("/shareOnJamTitle")
                    }
                }
            });
            r.open()
        },
        handleSuggest: function (e) {
            var t = e.getParameter("suggestValue").trim();
            if (t) {
                var a = {};
                var r = [];
                var i = [];
                var s = {};
                if (t.length > 3) {
                    r.push(new sap.ui.model.Filter("InboundDelivery", sap.ui.model.FilterOperator.Contains, t))
                }
                if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder || this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
                    r.push(new sap.ui.model.Filter("VendorName", sap.ui.model.FilterOperator.Contains, t))
                }
                if (this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
                    r.push(new sap.ui.model.Filter("DeliveryDocumentBySupplier", sap.ui.model.FilterOperator.Contains, t))
                }
                if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                    r.push(new sap.ui.model.Filter("SupplyingPlant", sap.ui.model.FilterOperator.Contains, t));
                    r.push(new sap.ui.model.Filter("SupplyingPlantName", sap.ui.model.FilterOperator.Contains, t))
                }
                a = new sap.ui.model.Filter(r, false);
                i.push(a);
                i.push(new sap.ui.model.Filter("SourceOfGR", sap.ui.model.FilterOperator.EQ, this._SourceOfGR));
                s = new sap.ui.model.Filter(i, true);
                this.getView().byId("POInput").removeAllSuggestionColumns();
                var o = new sap.m.ColumnListItem({
                    cells: [new sap.m.Label({
                        text: "{oData>InboundDelivery}"
                    })]
                });
                if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                    this.getView().byId("POInput").addSuggestionColumn(new sap.m.Column({
                        header: new sap.m.Label({
                            text: this.getResourceBundle().getText("PO_SEARCH_FIELD_LABEL")
                        })
                    }))
                } else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                    this.getView().byId("POInput").addSuggestionColumn(new sap.m.Column({
                        header: new sap.m.Label({
                            text: this.getResourceBundle().getText("PROD_SEARCH_FIELD_LABEL")
                        })
                    }))
                } else {
                    this.getView().byId("POInput").addSuggestionColumn(new sap.m.Column({
                        header: new sap.m.Label({
                            text: this.getResourceBundle().getText("DL_SEARCH_FIELD_LABEL")
                        })
                    }));
                    this.getView().byId("POInput").addSuggestionColumn(new sap.m.Column({
                        header: new sap.m.Label({
                            text: this.getResourceBundle().getText("EXT_DL_SEARCH_FIELD_LABEL")
                        })
                    }));
                    o.addCell(new sap.m.Label({
                        text: "{oData>DeliveryDocumentBySupplier}"
                    }))
                }
                if (this._oPersonalizedDataContainer.SelectPROD === true && this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                    o.addCell(new sap.m.Label({
                        text: "{parts:[{path: 'oData>OrderTypeName'},{path: 'oData>OrderType'}], formatter: '.formatter.concatenateNameIdFormatter'}"
                    }));
                    this.getView().byId("POInput").addSuggestionColumn(new sap.m.Column({
                        header: new sap.m.Label({
                            text: this.getResourceBundle().getText("ORDERTYPE_SEARCH_FIELD_LABEL")
                        })
                    }));
                    o.addCell(new sap.m.Label({
                        text: "{path: 'oData>MfgOrderPlannedStartDate', type:'sap.ui.model.type.Date', pattern: 'yyyy/MM/dd' }"
                    }));
                    this.getView().byId("POInput").addSuggestionColumn(new sap.m.Column({
                        header: new sap.m.Label({
                            text: this.getResourceBundle().getText("STARTDATE_SEARCH_FIELD_LABEL")
                        })
                    }));
                    o.addCell(new sap.m.Label({
                        text: "{path: 'oData>MfgOrderPlannedEndDate', type:'sap.ui.model.type.Date', pattern: 'yyyy/MM/dd' }"
                    }));
                    this.getView().byId("POInput").addSuggestionColumn(new sap.m.Column({
                        header: new sap.m.Label({
                            text: this.getResourceBundle().getText("ENDDATE_SEARCH_FIELD_LABEL")
                        })
                    }))
                } else {
                    if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder || this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
                        o.addCell(new sap.m.Label({
                            text: "{oData>VendorName}"
                        }));
                        this.getView().byId("POInput").addSuggestionColumn(new sap.m.Column({
                            header: new sap.m.Label({
                                text: this.getResourceBundle().getText("SUPPLIER_SEARCH_FIELD_LABEL")
                            })
                        }))
                    }
                    if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                        o.addCell(new sap.m.Label({
                            text: "{oData>SupplyingPlant}"
                        }));
                        this.getView().byId("POInput").addSuggestionColumn(new sap.m.Column({
                            header: new sap.m.Label({
                                text: this.getResourceBundle().getText("SUPPLYINGPLANT_SEARCH_FIELD_LABEL")
                            })
                        }))
                    }
                }
                this.getView().byId("POInput").bindAggregation("suggestionRows", {
                    path: "/GR4PO_DL_Headers",
                    model: "oData",
                    filters: i,
                    template: o
                });
                if (this.getView().byId("POInput").getBinding("suggestionRows")) {
                    this.getView().byId("POInput").getBinding("suggestionRows").attachDataReceived(this._setEbelnPossibleLength, this)
                }
            }
        },
        _setEbelnPossibleLength: function (e) {
            if (e.getParameter("data") && e.getParameter("data").results.length > 0) {
                var t = this.getView().getModel("oFrontend").getProperty("/Ebeln_possibleLength");
                var a;
                for (var r = 0; r < e.getParameter("data").results.length; r++) {
                    if (e.getParameter("data").results[r].InboundDelivery || e.getParameter("data").results[r].DeliveryDocument) {
                        a = e.getParameter("data").results[r].InboundDelivery || e.getParameter("data").results[r].DeliveryDocument
                    } else {
                        if (e.getParameter("data").results[r].PurchaseOrder) {
                            a = e.getParameter("data").results[r].PurchaseOrder
                        } else {
                            a = e.getParameter("data").results[r].OrderID
                        }
                    }
                    if (t.indexOf(parseInt(a.length, 10)) === -1) {
                        t.push(parseInt(a.length, 10));
                        if (this.getView().getModel("oFrontend").getProperty("/Ebeln_maxLength") < parseInt(a.length, 10)) {
                            this.getView().getModel("oFrontend").setProperty("/Ebeln_maxLength", parseInt(a.length, 10))
                        }
                    }
                }
                this.getView().getModel("oFrontend").setProperty("/Ebeln_possibleLength", t)
            }
        },
        handlePOHelp: function (e) {
            var t = this.getResourceBundle();
            var a = this;
            var s = "";
            if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                s = t.getText("TITLE_PO_HELP")
            } else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                s = t.getText("TITLE_PROD_HELP")
            } else {
                s = t.getText("TITLE_DL_HELP")
            }
            var o = this.getView().byId("POInput");
            var l = "";
            if (o.getValue().length > 0) {
                l = o.getValue()
            }
            var n = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                basicSearchText: l,
                id: "idValueHelpDialog",
                title: s,
                supportMultiselect: false,
                supportRanges: false,
                supportRangesOnly: false,
                ok: function (e) {
                    var t = e.getParameter("tokens");
                    var r = t[0].data();
                    var i = "";
                    n.close();
                    if (a._SourceOfGR === a._SourceOfGRIsPurchaseOrder) {
                        i = r.row.PurchaseOrder
                    } else if (a._SourceOfGR === a._SourceOfGRIsProductionOrder) {
                        i = r.row.OrderID
                    } else {
                        i = r.row.DeliveryDocument
                    }
                    if (i) {
                        var s = a.getView().byId("POInput");
                        s.setValue(i);
                        s.fireChangeEvent(i)
                    }
                },
                cancel: function (e) {
                    n.close()
                },
                afterClose: function () {
                    n.destroy()
                }
            });
            var u = "";
            var d = {};
            var c;
            if (n.getTable().getMetadata().getElementName() !== "sap.m.Table") {
                u = "rows";
                c = false
            } else {
                u = "items";
                c = true
            }
            var p = "";
            var g = [];
            var h = "";
            if (a._SourceOfGR === a._SourceOfGRIsPurchaseOrder) {
                p = "/PoHelpSet";
                g = [{
                    label: t.getText("LABEL_PO_COL"),
                    template: "PurchaseOrder"
                }, {
                    label: t.getText("LABEL_PO_CATEGORY_TEXT"),
                    template: "PurchasingDocumentCategoryName"
                }, {
                    label: t.getText("LABEL_PO_TYPE_TEXT"),
                    template: "PurchasingDocumentTypeName"
                }];
                h = "PurchaseOrder,PurchasingDocumentCategoryName,PurchasingDocumentTypeName";
                g.push({
                    label: t.getText("LABEL_SUP_COL"),
                    template: "Supplier"
                });
                g.push({
                    label: t.getText("LABEL_SUP_NAME_COL"),
                    template: "SupplierName"
                });
                g.push({
                    label: t.getText("LABEL_CITY_COL"),
                    template: "SupplierCityName"
                });
                h += ",Supplier,SupplierName,SupplierCityName";
                g.push({
                    label: t.getText("SUPPLYINGPLANT_SEARCH_FIELD_LABEL"),
                    template: "SupplyingPlant"
                });
                g.push({
                    label: t.getText("SUPPLYINGPLANTNAME_SEARCH_FIELD_LABEL"),
                    template: "SupplyingPlantName"
                });
                h += ",SupplyingPlant,SupplyingPlantName";
                g.push({
                    label: t.getText("LABEL_MATERIAL_COL"),
                    template: "Material"
                });
                g.push({
                    label: t.getText("LABEL_MATERIAL_TXT_COL"),
                    template: "PurchaseOrderItemText"
                });
                h += ",Material,PurchaseOrderItemText"
            } else if (a._SourceOfGR === a._SourceOfGRIsProductionOrder) {
                p = "/MMIMProductionOrderVH";
                g = [{
                    label: t.getText("LABEL_PROD_COL"),
                    template: "OrderID"
                }, {
                    label: t.getText("LABEL_MATERIAL_COL"),
                    template: "Material"
                }, {
                    label: t.getText("LABEL_MATERIAL_PROD_TXT_COL"),
                    template: "MaterialName"
                }, {
                    label: t.getText("PRODUCTION_PLANT_LABEL"),
                    template: "ProductionPlant"
                }, {
                    label: t.getText("PLANNING_PLANT_LABEL"),
                    template: "PlannedPlant"
                }, {
                    label: t.getText("PROD_TYPE_LABEL"),
                    template: "OrderTypeName"
                }];
                h = "OrderID,Material,MaterialName,ProductionPlant,PlannedPlant,OrderTypeName"
            } else {
                p = "/HMmimGr4inbdelSet";
                g = [{
                    label: t.getText("LABEL_DL_COL"),
                    template: "DeliveryDocument"
                }, {
                    label: t.getText("LABEL_DL_ITEM_TEXT"),
                    template: "DeliveryDocumentItem"
                }, {
                    label: t.getText("LABEL_DL_EXT_ID_TEXT"),
                    tooltip: t.getText("LABEL_DL_EXT_ID_TEXT"),
                    template: "DeliveryDocumentBySupplier"
                }, {
                    label: t.getText("LABEL_MATERIAL_TXT_COL"),
                    template: "DeliveryDocumentItemText"
                }, {
                    label: t.getText("LABEL_SUP_COL"),
                    template: "Supplier"
                }, {
                    label: t.getText("LABEL_SUP_NAME_COL"),
                    template: "SupplierName"
                }, {
                    label: t.getText("LABEL_CITY_COL"),
                    template: "SupplierCityName"
                }, {
                    label: t.getText("LABEL_PO_COL"),
                    template: "PurchaseOrder"
                }, {
                    label: t.getText("LABEL_PO_ITEMTYPE_TEXT"),
                    template: "PurchaseOrderItem"
                }];
                h = "DeliveryDocument,DeliveryDocumentItem,DeliveryDocumentBySupplier,DeliveryDocumentItemText,PurchaseOrder,PurchaseOrderItem,Supplier,SupplierName,SupplierCityName"
            }
            var m = new sap.ui.model.json.JSONModel({
                cols: g
            });
            n.setModel(m, "columns");
            if (c === true) {
                d = new sap.m.ColumnListItem({
                    cells: []
                });
                for (var S = 0; S < g.length; S++) {
                    d.addCell(new sap.m.Label({
                        text: "{" + g[S].template + "}"
                    }))
                }
            }
            n.setModel(this.getView().getModel("oData2"));
            switch (a._SourceOfGR) {
                case a._SourceOfGRIsPurchaseOrder:
                    n.setKey("PurchaseOrder");
                    break;
                case a._SourceOfGRIsInboundDelivery:
                    n.setKey("DeliveryDocument");
                    break;
                default:
                    n.setKey("OrderID");
                    break
            }
            var f = new sap.ui.comp.filterbar.FilterBar({
                advancedMode: true,
                expandAdvancedArea: true,
                search: function (e) {
                    var t = sap.ui.getCore().byId("idSearch");
                    var s = t.getValue();
                    var o = e.getParameter("selectionSet");
                    var l = o.reduce(function (e, t) {
                        if (t.getSelectedItem() && t.getSelectedItem().getKey()) {
                            e.push(new r({
                                path: t.getName(),
                                operator: i.Contains,
                                value1: t.getSelectedItem().getKey()
                            }))
                        }
                        return e
                    }, []);
                    var g = new sap.ui.model.Filter(l, true);
                    if (s.length > 0) {
                        var m = {
                            custom: {
                                search: s
                            },
                            select: h
                        };
                        if (c === false) {
                            n.getTable().bindAggregation(u, {
                                path: p,
                                parameters: m,
                                filters: g
                            })
                        } else {
                            n.getTable().bindAggregation(u, {
                                path: p,
                                template: d,
                                parameters: m,
                                filters: g
                            })
                        }
                        n.getTable().setBusy(true)
                    } else {
                        if (c === false) {
                            n.getTable().bindAggregation(u, {
                                path: p,
                                parameters: {
                                    select: h
                                },
                                filters: g
                            })
                        } else {
                            n.getTable().bindAggregation(u, {
                                path: p,
                                template: d,
                                parameters: {
                                    select: h
                                },
                                filters: g
                            })
                        }
                        n.getTable().setBusy(true)
                    }
                    n.getTable().getBinding(u).attachDataReceived(function (e) {
                        if (e.getParameter("data") && e.getParameter("data").results.length === 0) {
                            n.TableStateDataFilled()
                        }
                        n.getTable().setBusy(false);
                        a._setEbelnPossibleLength(e)
                    }, this)
                }
            });
            var _ = new sap.ui.comp.filterbar.FilterGroupItem({
                groupName: "PD01",
                name: "PurchasingDocumentCategoryName",
                label: this.getResourceBundle().getText("LABEL_PO_CATEGORY_TEXT"),
                visibleInFilterBar: true
            });
            if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                var I = [new sap.ui.core.Item({
                    key: "",
                    text: this.getResourceBundle().getText("TEXT_ALL_CATERGORIES")
                }), new sap.ui.core.Item({
                    key: "F",
                    text: this.getResourceBundle().getText("TEXT_PURCHASE_ORDERS")
                }), new sap.ui.core.Item({
                    key: "L",
                    text: this.getResourceBundle().getText("TEXT_SCHEDULING_AGREEMENT")
                })];
                _.setControl(new sap.m.Select({
                    name: "PurchasingDocumentCategory",
                    items: I
                }));
                f.addFilterGroupItem(_)
            }
            f.setBasicSearch(new sap.m.SearchField({
                id: "idSearch",
                value: l,
                tooltip: this.getResourceBundle().getText("SEARCH_FIELD_TOOLTIP"),
                showSearchButton: false,
                search: function (e) {
                    if (!e.getParameter("clearButtonPressed")) {
                        n.getFilterBar().search()
                    }
                }.bind(this)
            }));
            n.setFilterBar(f);
            if (l) {
                var y = {
                    custom: {
                        search: l
                    },
                    select: h
                };
                if (c === false) {
                    n.getTable().bindAggregation(u, {
                        path: p,
                        parameters: y
                    })
                } else {
                    n.getTable().bindAggregation(u, {
                        path: p,
                        template: d,
                        parameters: y
                    })
                }
                n.getTable().setBusy(true);
                n.getTable().getBinding(u).attachDataReceived(function (e) {
                    if (e.getParameter("data") && e.getParameter("data").results.length === 0) {
                        n.TableStateDataFilled()
                    }
                    n.getTable().setBusy(false);
                    a._setEbelnPossibleLength(e)
                }, this)
            }
            n.open()
        },
        handleStorageLocationHelp: function (e) {
            var t = [];
            var a = [];
            var r = "";
            var i = "";
            var s = "";
            var o = false;
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                var l = e.getSource();
                var n = l.getParent();
                var u = n.getCells();
                if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                    r = u[2].getText();
                    r = r.substr(1, r.length - 1);
                    this._SelectedTableIndex = this._getSelectedItemInModel(e);
                    var d = this.getView().getModel("oFrontend");
                    var c = d.getProperty("/Items");
                    i = c[this._SelectedTableIndex].Plant;
                    s = c[this._SelectedTableIndex].StockType_selectedKey;
                    t = c[this._SelectedTableIndex].StockType_input
                } else {
                    this._SelectedTableIndex = this._getSelectedItemInModel(e);
                    var d = this.getView().getModel("oFrontend");
                    var c = d.getProperty("/Items");
                    r = c[this._SelectedTableIndex].Material_Input;
                    i = c[this._SelectedTableIndex].Plant;
                    s = c[this._SelectedTableIndex].StockType_selectedKey;
                    t = c[this._SelectedTableIndex].StockType_input
                }
            }
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                var p = this.getModel("oItem");
                if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                    r = p.getProperty("/Material")
                } else {
                    r = p.getProperty("/Material_Input")
                }
                i = p.getProperty("/Plant");
                s = p.getProperty("/StockType_selectedKey");
                t = p.getProperty("/StockType_input")
            }
            for (var g = 0; g < t.length; g++) {
                if (t[g].key === s || t[g].key === "" && s === undefined) {
                    o = t[g].StorLocAutoCreationIsAllowed
                }
                switch (t[g].key) {
                    case " ":
                        a.push("CurrentStock");
                        break;
                    case "":
                        a.push("CurrentStock");
                        break;
                    case "2":
                        a.push("QualityInspectionStockQuantity");
                        break;
                    case "3":
                        a.push("BlockedStockQuantity")
                }
            }
            var h = this;
            var m = {};
            m.Material = r;
            m.Plant = i;
            m.StorLocAutoCreationIsAllowed = o;
            m.DisplayedStockTypes = a;
            if (this._ResetStorageLocationBuffer === true && this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                m.resetBuffer = true;
                this._ResetStorageLocationBuffer = false
            }
            this._oValueHelpController.displayValueHelpStorageLocation4Material(m, function (e) {
                h._handleValueHelpStorageLocationCallback(e)
            }, h)
        },
        _isStorageBinInItems: function (e) {
            for (var t = 0; t < e.length; t++) {
                if (e[t].WarehouseStorageBin) {
                    return true
                }
            }
            return false
        },
        _handleValueHelpStorageLocationCallback: function (e) {
            var t = false;
            var a;
            var r;
            var i;
            var s;
            var o;
            if (e.selected === true) {
                var l = this.getModel("oFrontend");
                var n = l.getProperty("/WMLStorageLocations");
                if (!n) {
                    var u = this.getOwnerComponent().getModel("oData");
                    u.read("/WMLStorageLocations", {
                        method: "GET",
                        success: function (t) {
                            n = [];
                            if (t.results) {
                                t.results.forEach(e => {
                                    var t = Object.assign({}, e);
                                    delete t.__metadata;
                                    n.push(t)
                                })
                            }
                            l.setProperty("/WMLStorageLocations", n);
                            this._handleValueHelpStorageLocationCallback(e)
                        }.bind(this),
                        error: function () {
                            l.setProperty("/WMLStorageLocations", [])
                        }
                    });
                    return
                }
                var d = n.find(t => t.StorageLocation === e.StorageLocation && t.WMLEnabled === true);
                var c = d !== undefined;
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                    l.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation", e.StorageLocation);
                    l.setProperty("/Items/" + this._SelectedTableIndex + "/WMLInScope", c);
                    l.setProperty("/Items/" + this._SelectedTableIndex + "/WarehouseStorageBin", e.StorageBin);
                    l.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation_input", e.StorageLocationName);
                    l.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation_valueState", sap.ui.core.ValueState.None);
                    l.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation_valueStateText", "");
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        t = this._ItemConsistent(l.getProperty("/Items/" + this._SelectedTableIndex));
                        if (t === true) {
                            l.setProperty("/Items/" + this._SelectedTableIndex + "/SelectEnabled", t);
                            l.setProperty("/Items/" + this._SelectedTableIndex + "/Selected", t)
                        }
                        this._setSelectEnabled(l.getProperty("/Items/" + this._SelectedTableIndex));
                        this._controlSelectAllAndPostButton();
                        this._updateHiglightProperty()
                    }
                    a = l.getProperty("/Items/" + this._SelectedTableIndex + "/Material_Input");
                    r = l.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
                    i = l.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
                    s = l.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation");
                    o = l.getProperty("/Items/" + this._SelectedTableIndex + "/StockType_selectedKey")
                }
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                    var p = this.getView().getModel("oItem");
                    p.setProperty("/StorageLocation", e.StorageLocation);
                    p.setProperty("/WMLInScope", c);
                    p.setProperty("/StorageLocation_input", e.StorageLocationName);
                    p.setProperty("/WarehouseStorageBin", e.StorageBin);
                    p.setProperty("/StorageLocation_valueState", sap.ui.core.ValueState.None);
                    p.setProperty("/StorageLocation_valueStateText", "");
                    p.setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(p.getData()));
                    a = p.getProperty("/Material_Input");
                    r = p.getProperty("/Plant");
                    i = p.getProperty("/DeliveredUnit_input");
                    s = p.getProperty("/StorageLocation");
                    o = p.getProperty("/StockType_selectedKey");
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        t = this._ItemConsistent(p.getData());
                        if (t === true) {
                            p.setProperty("/SelectEnabled", t);
                            p.setProperty("/Selected", t)
                        }
                    }
                }
                if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                    this._handleValidationMasterData(a, i, r, s, this._SelectedTableIndex);
                    if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                        r = l.getProperty("/Items/" + this._SelectedTableIndex + "/Plant")
                    } else {
                        r = p.getProperty("/Plant")
                    }
                    this._getControlFields(a, r, this._SelectedTableIndex, o)
                }
                l.setProperty("/ColumnStorageBinVisible", this._isStorageBinInItems(l.getData().Items))
            }
        },
        handleAUoMHelp: function (e) {
            var t = "";
            var a = e.getSource();
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                    t = this.getView().getModel("oItem").getProperty("/Material")
                } else {
                    t = this.getView().getModel("oItem").getProperty("/Material_Input")
                }
            } else {
                var r = a.getParent().getParent();
                var i = r.getCells();
                if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                    t = i[2].getText();
                    t = t.substr(1, t.length - 1)
                } else {
                    var s = this._getSelectedItemInModel(e);
                    t = this.getView().getModel("oFrontend").getProperty("/Items/" + s + "/Material_Input")
                }
                this._SelectedTableIndex = this._getSelectedItemInModel(e)
            }
            var o = this;
            var l = {};
            l.Material = t;
            this._oValueHelpController.displayValueHelpAUOM4Material(l, function (e) {
                o._handleValueHelpAUOMCallback(e)
            }, o)
        },
        handleComponentAUoMHelp: function (e) {
            var t = e.getSource().getBindingContext("oItem");
            var a = t.getPath();
            var r = t.getProperty("Material");
            var i = {};
            var s = this;
            i.Material = r;
            this._oValueHelpController.displayValueHelpAUOM4Material(i, function (e) {
                if (e.selected === true) {
                    var t = s.getView().getModel("oItem");
                    t.setProperty(a + "/EntryUnit", e.AUoM)
                }
            }, s)
        },
        _handleValueHelpAUOMCallback: function (e) {
            var t = {};
            var a;
            var r;
            var i;
            var s;
            var o;
            var l;
            if (e.selected === true) {
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                    t = this.getView().getModel("oItem");
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        l = this._ItemConsistent(t.getData());
                        if (l === true) {
                            t.setProperty("/SelectEnabled", l);
                            t.setProperty("/Selected", l)
                        }
                    }
                    t.setProperty("/DeliveredUnit_input", e.AUoM);
                    a = t.getProperty("/Material_Input");
                    r = t.getProperty("/Plant");
                    i = t.getProperty("/DeliveredUnit_input");
                    s = t.getProperty("/StorageLocation");
                    o = t.getProperty("/StockType_selectedKey")
                } else {
                    t = this.getView().getModel("oFrontend");
                    var n = t.getProperty("/Items");
                    if (n[this._SelectedTableIndex].DeliveredUnit_input !== e.AUoM) {
                        n[this._SelectedTableIndex].DeliveredUnit_input = e.AUoM
                    }
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        l = this._ItemConsistent(n[this._SelectedTableIndex], n);
                        if (l === true) {
                            n[this._SelectedTableIndex].SelectEnabled = l;
                            n[this._SelectedTableIndex].Selected = l
                        }
                        this._setSelectEnabled(n[this._SelectedTableIndex], n);
                        this._controlSelectAllAndPostButton();
                        this._updateHiglightProperty();
                        if (n[this._SelectedTableIndex].ItemHasComponent && n[this._SelectedTableIndex].ItemComponentVisible) {
                            this._calculateComponentQuantity(t.getProperty("/Ebeln"), n[this._SelectedTableIndex], this._SelectedTableIndex)
                        }
                    }
                    t.setProperty("/Items", n);
                    a = t.getProperty("/Items/" + this._SelectedTableIndex + "/Material_Input");
                    r = t.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
                    i = t.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
                    s = t.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation");
                    o = t.getProperty("/Items/" + this._SelectedTableIndex + "/StockType_selectedKey")
                }
                if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                    this._handleValidationMasterData(a, i, r, s, this._SelectedTableIndex);
                    if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                        t = this.getView().getModel("oFrontend");
                        r = t.getProperty("/Items/" + this._SelectedTableIndex + "/Plant")
                    } else {
                        t = this.getView().getModel("oItem");
                        r = t.getProperty("/Plant")
                    }
                    this._getControlFields(a, r, this._SelectedTableIndex, o)
                }
            }
        },
        handleBatchHelp: function (e) {
            if (this._ResetBatchBuffer === true) {
                this._ResetBatchBuffer = false;
                this._oBatchHelp = {}
            }
            var t = {};
            if (!this._oBatchDialog) {
                this._oBatchDialog = sap.ui.xmlfragment(this.getView().getId(), "s2p.mm.im.goodsreceipt.purchaseorder.view.selectBatch", this);
                this.getView().addDependent(this._oBatchDialog);
                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oBatchDialog)
            }
            var a;
            var r;
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                t = this.getView().getModel("oItem").getData();
                if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                    a = t.Material_Input
                } else {
                    a = t.Material
                }
                r = t.Plant
            } else {
                var i = this.getView().getModel("oFrontend");
                var s = this._getSelectedItemInModel(e);
                t = i.getProperty("/Items/" + s);
                var o = i.getProperty("/Items");
                if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                    a = o[s].Material_Input
                } else {
                    a = o[s].Material
                }
                r = o[s].Plant;
                this._SelectedTableIndex = s
            }
            var l = sap.ui.core.Fragment.byId(this.getView().getId(), "idBatchStockChart");
            var n = "";
            l.removeAllData();
            for (var u = 0; u < t.StockType_input.length; u++) {
                switch (t.StockType_input[u].key) {
                    case " ":
                        n = "CurrentStock";
                        break;
                    case "2":
                        n = "QualityInspectionStockQuantity";
                        break;
                    case "3":
                        n = "BlockedStockQuantity";
                        break;
                    default:
                        continue
                }
                l.addData(new sap.suite.ui.microchart.ComparisonMicroChartData({
                    color: "Good",
                    displayValue: "{oBatchCollection>" + n + "_Dis" + "}",
                    value: "{oBatchCollection>" + n + "_Int" + "}",
                    title: "{i18n>BATCH_VALUE_HELP_CHART_TITLE_" + n.toUpperCase() + "}"
                }))
            }
            var d = [];
            if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                d.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, t.Material))
            } else {
                d.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, t.Material_Input))
            }
            d.push(new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, t.Plant));
            d.push(new sap.ui.model.Filter("StorageLocation", sap.ui.model.FilterOperator.EQ, t.StorageLocation));
            d.push(new sap.ui.model.Filter("DeliveryDocumentItem", sap.ui.model.FilterOperator.EQ, t.DocumentItem));
            d.push(new sap.ui.model.Filter("InboundDelivery", sap.ui.model.FilterOperator.EQ, this.getView().getModel("oFrontend").getProperty("/Ebeln")));
            this.getView().getModel("oData").read("/MaterialBatchHelps", {
                filters: d,
                success: jQuery.proxy(this._successBatchLoad, this, t),
                error: jQuery.proxy(this._handleOdataError, this)
            })
        },
        _successBatchLoad: function (e, t) {
            var a = new Array;
            for (var r = 0; r < t.results.length; r++) {
                var i = {};
                i.Batch = t.results[r].Batch;
                i.BaseUnit = t.results[r].BaseUnit;
                i.BlockedStockQuantity_Dis = this._NumberFormatter.format(t.results[r].BlockedStockQuantity, i.BaseUnit) + " ";
                i.CurrentStock_Dis = this._NumberFormatter.format(t.results[r].CurrentStock, i.BaseUnit) + " ";
                i.QualityInspectionStockQuantity_Dis = this._NumberFormatter.format(t.results[r].QualityInspectionStockQuantity, i.BaseUnit) + " ";
                i.BlockedStockQuantity_Int = parseFloat(t.results[r].BlockedStockQuantity);
                i.CurrentStock_Int = parseFloat(t.results[r].CurrentStock);
                i.QualityInspectionStockQuantity_Int = parseFloat(t.results[r].QualityInspectionStockQuantity);
                i.BlockedStockQuantity = t.results[r].BlockedStockQuantity;
                i.CurrentStock = t.results[r].CurrentStock;
                i.QualityInspectionStockQuantity = t.results[r].QualityInspectionStockQuantity;
                i.Material = t.results[r].Material;
                i.Plant = t.results[r].Plant;
                i.ShelfLifeExpirationDate = t.results[r].ShelfLifeExpirationDate;
                i.ManufactureDate = t.results[r].ManufactureDate;
                a.push(i)
            }
            this._oBatchHelp[e.Material + e.Plant] = a;
            var s = new sap.ui.model.json.JSONModel;
            s.setDefaultBindingMode("OneWay");
            s.setProperty("/BatchCollection", this._oBatchHelp[e.Material + e.Plant]);
            var o = this._getMinMaxOfDisplayedStocks(this._oBatchHelp[e.Material + e.Plant], e.StockType_input);
            s.setProperty("/minValue", o.minValue);
            s.setProperty("/maxValue", o.maxValue);
            this._oBatchDialog.setModel(s, "oBatchCollection");
            this._oBatchDialog.open()
        },
        _getMinMaxOfDisplayedStocks: function (e, t) {
            var a = {
                minValue: 0,
                maxValue: 0
            };
            var r = "";
            for (var i = 0; i < t.length; i++) {
                switch (t[i].key) {
                    case "2":
                        r = "QualityInspectionStockQuantity";
                        break;
                    case "3":
                        r = "BlockedStockQuantity";
                        break;
                    default:
                        r = "CurrentStock"
                }
                for (var s = 0; s < e.length; s++) {
                    if (e[s][r + "_Int"] > a.maxValue) {
                        a.maxValue = e[s][r + "_Int"]
                    }
                    if (e[s][r + "_Int"] < a.minValue) {
                        a.minValue = e[s][r + "_Int"]
                    }
                }
            }
            return a
        },
        handleBatchValueHelpSearch: function (e) {
            var t = e.getParameter("value");
            var a = new sap.ui.model.Filter("Batch", sap.ui.model.FilterOperator.Contains, t);
            var r = e.getSource().getBinding("items");
            r.filter([a])
        },
        handleBatchValueHelpCancel: function (e) {
            e.getSource().getBinding("items").filter([]);
            this._sComponentBindingPath = ""
        },
        handleBatchValueHelpConfirm: function (e) {
            e.getSource().getBinding("items").filter([]);
            var t = e.getParameter("selectedContexts");
            var a;
            var r;
            var i;
            var s;
            var o;
            e.getSource().getBinding("items").filter([]);
            if (t.length) {
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                    if (this._sComponentBindingPath) {
                        var l = t[0].getObject().Batch;
                        var n = this.getView().getModel("oItem");
                        n.setProperty(this._sComponentBindingPath + "/Batch", l);
                        n.setProperty(this._sComponentBindingPath + "/Batch_valueState", sap.ui.core.ValueState.None);
                        var u = n.getData();
                        var d = this._applyButtonEnabled(u);
                        var c = this._ItemConsistent(u);
                        n.setProperty("/Selected", c);
                        n.setProperty("/SelectEnabled", c);
                        n.setProperty("/ApplyButtonEnabled", d);
                        this._sComponentBindingPath = "";
                        return
                    }
                    this.getView().getModel("oItem").setProperty("/Batch", t[0].getObject().Batch);
                    this.getView().getModel("oItem").setProperty("/Batch_valueState", sap.ui.core.ValueState.None);
                    this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate", this._oDateFormat.format(t[0].getObject().ShelfLifeExpirationDate));
                    this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None);
                    this.getView().getModel("oItem").setProperty("/ManufactureDate", this._oDateFormat.format(t[0].getObject().ManufactureDate));
                    this.getView().getModel("oItem").setProperty("/ManufactureDate_valueState", sap.ui.core.ValueState.None);
                    this._setValueStateMandatoryFields(this.getView().getModel("oItem").getData());
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        o = this._ItemConsistent(this.getView().getModel("oItem").getData());
                        if (o === true) {
                            this.getView().getModel("oItem").setProperty("/SelectEnabled", o);
                            this.getView().getModel("oItem").setProperty("/Selected", o);
                            this.getView().getModel("oItem").setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(this.getView().getModel("oItem").getData()))
                        }
                    }
                    a = this.getView().getModel("oItem").getProperty("/Material_Input");
                    r = this.getView().getModel("oItem").getProperty("/Plant");
                    i = this.getView().getModel("oItem").getProperty("/DeliveredUnit_input");
                    s = this.getView().getModel("oItem").getProperty("/StorageLocation")
                } else {
                    var p = this.getView().getModel("oFrontend");
                    p.setProperty("/Items/" + this._SelectedTableIndex + "/Batch", t[0].getObject().Batch);
                    p.setProperty("/Items/" + this._SelectedTableIndex + "/Batch_valueState", sap.ui.core.ValueState.None);
                    p.setProperty("/Items/" + this._SelectedTableIndex + "/ShelfLifeExpirationDate", this._oDateFormat.format(t[0].getObject().ShelfLifeExpirationDate));
                    p.setProperty("/Items/" + this._SelectedTableIndex + "/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None);
                    p.setProperty("/Items/" + this._SelectedTableIndex + "/ManufactureDate", this._oDateFormat.format(t[0].getObject().ManufactureDate));
                    p.setProperty("/Items/" + this._SelectedTableIndex + "/ManufactureDate_valueState", sap.ui.core.ValueState.None);
                    this._setValueStateMandatoryFields(p.getProperty("/Items/" + this._SelectedTableIndex));
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        o = this._ItemConsistent(p.getProperty("/Items/" + this._SelectedTableIndex));
                        if (o === true) {
                            p.setProperty("/Items/" + this._SelectedTableIndex + "/SelectEnabled", o);
                            p.setProperty("/Items/" + this._SelectedTableIndex + "/Selected", o)
                        }
                        this._setSelectEnabled(p.getProperty("/Items/" + this._SelectedTableIndex));
                        this._controlSelectAllAndPostButton();
                        this._updateHiglightProperty()
                    }
                    a = p.getProperty("/Items/" + this._SelectedTableIndex + "/Material_Input");
                    r = p.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
                    i = p.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
                    s = p.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation")
                }
                if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                    this._handleValidationMasterData(a, i, r, s, this._SelectedTableIndex);
                    if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                        r = p.getProperty("/Items/" + this._SelectedTableIndex + "/Plant")
                    } else {
                        r = p.getProperty("/Plant")
                    }
                    this._getControlFields(a, r, this._SelectedTableIndex)
                }
            }
        },
        handleDisplayComponentMaterialLinkPress: function (e) {
            var t = e.getSource().data("Material");
            var a = this.getView().getModel("oItem");
            var r = {
                Material: t
            };
            var i = sap.ui.core.routing.HashChanger.getInstance();
            i.setHash("");
            this._oNavigationService.navigate("Material", "displayFactSheet", r, this._getInnerAppState("", null, a.getData()))
        },
        handleCreateBatch: function (e) {
            var t = this.getView().getModel("oItem");
            var a;
            if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                a = {
                    Material: t.getProperty("/Material_Name"),
                    Plant: t.getProperty("/Plant")
                }
            } else {
                a = {
                    Material: t.getProperty("/Material"),
                    Plant: t.getProperty("/Plant")
                }
            }
            this._ResetBatchBuffer = true;
            var r = sap.ui.core.routing.HashChanger.getInstance();
            r.setHash("");
            if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                this._oNavigationService.navigate("Batch", "create", a, this._getInnerAppState("", {
                    DocumentItem: t.getProperty("/DocumentItem"),
                    ItemCounter: t.getProperty("/ItemCounter")
                }))
            } else {
                this._oNavigationService.navigate("Batch", "create", a, this._getInnerAppState("", {
                    DocumentItem: t.getProperty("/DocumentItem")
                }))
            }
        },
        handleSearch: function (e) {
            var t = e.getParameter("query");
            var a = this.getView().byId("idProductsTable");
            var r = this.getView().getModel("oFrontend");
            var i = a.getBinding("items");
            var s = {};
            var o = [];
            if (t.length > 0) {
                o.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, t));
                o.push(new sap.ui.model.Filter("MaterialName", sap.ui.model.FilterOperator.Contains, t));
                o.push(new sap.ui.model.Filter("PurchaseOrderItemText", sap.ui.model.FilterOperator.Contains, t));
                s = new sap.ui.model.Filter(o, false);
                a.getBinding("items").filter(s)
            } else {
                a.getBinding("items").filter([])
            }
            var l = this.getResourceBundle();
            var n = a.getItems();
            var u = 0;
            for (var d = 0; d < n.length; d++) {
                var c = n[d].getCells()[0].getProperty("visible");
                if (c == true) {
                    u++
                }
            }
            var p = l.getText("TABLE_TOTAL_ITEMS_LABEL", [u]);
            r.setProperty("/POItemsCountTableHeader", p);
            this._updateStackedBarChartColumn()
        },
        handleSearchAccounting: function (e) {
            var t = e.getParameter("query");
            var a = this.getView().byId("idAccountAssingmentsTable");
            var r = {};
            var i = [];
            if (t.length > 0) {
                i.push(new sap.ui.model.Filter("GLAccount", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("GLAccountName", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("CostCenter", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("CostCenterName", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("AssetNumber", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("AssetNumberName", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("FunctionalArea", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("ProfitCenter", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("ProfitCenterName", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("Project", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("ProjectDescription", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("SalesOrder", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("OrderID", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("GoodsRecipientName", sap.ui.model.FilterOperator.Contains, t));
                i.push(new sap.ui.model.Filter("UnloadingPointName", sap.ui.model.FilterOperator.Contains, t));
                r = new sap.ui.model.Filter(i, false);
                a.getBinding("items").filter(r)
            } else {
                a.getBinding("items").filter([])
            }
        },
        onDisplayAccountAssignment: function (e) {
            if (!this._oAccAssDialog) {
                this._oAccAssDialog = sap.ui.xmlfragment("s2p.mm.im.goodsreceipt.purchaseorder.view.accountAssignment", this);
                this.getView().addDependent(this._oAccAssDialog)
            }
            var t = this._getSelectedItemInModel(e);
            var a = this.getView().getModel("oFrontend");
            var r = a.getData();
            var i = JSON.parse(JSON.stringify(r.Items[t]));
            for (var s = 0; s < i.AccountAssignments.length; s++) {
                i.AccountAssignments[s].ValueColor = this._aSemanticChartColors[s]
            }
            var o = new sap.ui.model.json.JSONModel;
            o.setData(i);
            this._oAccAssDialog.setModel(o, "oItem");
            var l = e.getSource();
            jQuery.sap.delayedCall(0, this, function () {
                this._oAccAssDialog.openBy(l)
            })
        },
        handleSelectAll: function (e) {
            var t = e.getParameter("selected");
            var a = this.getView().getModel("oFrontend");
            var r = a.getProperty("/Items");
            var i;
            if (t) {
                for (var s = 0; s < r.length; s++) {
                    if (r[s].SelectEnabled) {
                        r[s].Selected = true
                    }
                }
                for (var s = 0; s < r.length; s++) {
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        a.setProperty("/PostButtonEnabled", true)
                    }
                }
                a.setProperty("/CopyButtonVisible", true);
                a.setProperty("/DeleteButtonVisible", true)
            } else {
                for (var s = 0; s < r.length; s++) {
                    if (r[s].SelectEnabled) {
                        r[s].Selected = false
                    }
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        a.setProperty("/PostButtonEnabled", false)
                    }
                }
                a.setProperty("/CopyButtonVisible", false);
                a.setProperty("/DeleteButtonVisible", false)
            }
            a.setProperty("/Items", r)
        },
        handleSelect: function (e) {
            var t = e.getParameter("selected");
            var a = this.getView().getModel("oFrontend");
            var r = a.getProperty("/Items");
            var i = this._getSelectedItemInModel(e);
            var s;
            s = r[i].DocumentItem;
            var o = 0;
            for (var l = 0; l < r.length; l++) {
                if (r[l].DocumentItem == s) {
                    r[l].Selected = t
                }
                if (r[l].Selected) {
                    o++
                }
            }
            var n = this._allItemsInTableSelected(r);
            this._controlSelectAllCheckBox(o > 0, n);
            if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                if (o > 0) {
                    a.setProperty("/PostButtonEnabled", true)
                } else {
                    a.setProperty("/PostButtonEnabled", false)
                }
            } else {
                var u = false;
                if (r[i].Selected === true) {
                    a.setProperty("/CopyButtonVisible", true);
                    a.setProperty("/DeleteButtonVisible", true)
                } else {
                    if (o === 0) {
                        a.setProperty("/CopyButtonVisible", false);
                        a.setProperty("/DeleteButtonVisible", false)
                    }
                }
            }
            a.setProperty("/Items", r)
        },
        handleInputChange: function (e) {
            var t = e.getSource();
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                var a = this.getView().getModel("oItem");
                if (this._oQuantFormat.parse(t.getValue()) >= 0) {
                    a.setProperty("/DeliveredQuantity_valueState", sap.ui.core.ValueState.None);
                    a.setProperty("/DeliveredQuantity_valueStateText", "");
                    a.setProperty("/DeliveredQuantity_input", this._oQuantFormat.parse(t.getValue()));
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        if (a.getProperty("/StorageLocation_input") === "" && a.getProperty("/StorageLocationVisible") == true) {
                            a.setProperty("/StorageLocation_valueState", sap.ui.core.ValueState.Error);
                            a.setProperty("/StorageLocation_valueStateText", this.getResourceBundle().getText("STORAGELOCATION_VALUE_STATE_TEXT"))
                        }
                        var r = this._ItemConsistent(a.getData());
                        a.setProperty("/Selected", r);
                        a.setProperty("/SelectEnabled", r);
                        a.setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(a.getData()))
                    }
                } else {
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        a.setProperty("/Selected", false);
                        a.setProperty("/SelectEnabled", false)
                    }
                    a.setProperty("/ApplyButtonEnabled", false);
                    a.setProperty("/DeliveredQuantity_valueState", sap.ui.core.ValueState.Error);
                    a.setProperty("/DeliveredQuantity_valueStateText", this.getResourceBundle().getText("DELIVEREDQUANTITY_VALUE_STATE_TEXT"))
                }
            } else {
                var i = this._getSelectedItemInModel(e);
                var s = this.getView().getModel("oFrontend");
                if (this._oQuantFormat.parse(t.getValue()) >= 0) {
                    s.setProperty("/Items/" + i + "/DeliveredQuantity_valueState", sap.ui.core.ValueState.None);
                    s.setProperty("/Items/" + i + "/DeliveredQuantity_valueStateText", "");
                    s.setProperty("/Items/" + i + "/DeliveredQuantity_input", this._oQuantFormat.parse(t.getValue()));
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        if (s.getProperty("/Items/" + i + "/StorageLocation_input") == "" && s.getProperty("/Items/" + i + "/StorageLocationVisible") == true) {
                            s.setProperty("/Items/" + i + "/StorageLocation_valueState", sap.ui.core.ValueState.Error);
                            s.setProperty("/Items/" + i + "/StorageLocation_valueStateText", this.getResourceBundle().getText("STORAGELOCATION_VALUE_STATE_TEXT"))
                        }
                        var r = this._ItemConsistent(s.getProperty("/Items")[i], s.getProperty("/Items"));
                        s.setProperty("/Items/" + i + "/Selected", r);
                        s.setProperty("/Items/" + i + "/SelectEnabled", r);
                        var o = s.getProperty("/Items");
                        this._setSelectEnabled(o[i], o);
                        o = s.getProperty("/Items");
                        this._controlSelectAllAndPostButton(o);
                        this._updateHiglightProperty();
                        var l = s.getProperty("/Items/" + i);
                        if (l.ItemHasComponent && l.ItemComponentVisible) {
                            this._calculateComponentQuantity(s.getProperty("/Ebeln"), l, i)
                        }
                    }
                } else {
                    s.setProperty("/Items/" + i + "/DeliveredQuantity_valueState", sap.ui.core.ValueState.Error);
                    s.setProperty("/Items/" + i + "/DeliveredQuantity_valueStateText", this.getResourceBundle().getText("DELIVEREDQUANTITY_VALUE_STATE_TEXT"));
                    s.setProperty("/Items/" + i + "/DeliveredQuantity_input", "");
                    s.setProperty("/Items/" + i + "/ApplyButtonEnabled", false);
                    var o = s.getProperty("/Items");
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        s.setProperty("/Items/" + i + "/Selected", false);
                        s.setProperty("/Items/" + i + "/SelectEnabled", false);
                        this._setSelectEnabled(o[i], o)
                    }
                    this._controlSelectAllAndPostButton(o);
                    this._updateHiglightProperty()
                }
            }
            if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                this._setGuidedTour(i)
            }
        },
        _calculateComponentQuantity: function (e, t, a) {
            this.getOwnerComponent().getModel("oData").callFunction("/ComponentMatQty", {
                method: "GET",
                urlParameters: {
                    DeliveryDocumentItem: t.DocumentItem,
                    InboundDelivery: e,
                    Material: t.Material,
                    EntryUnit: t.DeliveredUnit_input,
                    QuantityInEntryUnit: t.DeliveredQuantity_input.toString(),
                    OrderUnit: t.OrderedQuantityUnit,
                    SourceOfGR: this._SourceOfGR
                },
                success: jQuery.proxy(this._successComponentQuantityLoad, this, a),
                error: jQuery.proxy(this._handleOdataError, this)
            });
            this._toggleBusy(true)
        },
        _successComponentQuantityLoad: function (e, t, a) {
            this._toggleBusy(false);
            if (t.results) {
                var r = this.getView().getModel("oFrontend").getProperty("/Items/" + e);
                if (t.results.length > 0) {
                    var i = h.createSubItemData(r, t.results, this._isIntentSupported.MaterialDisplay, true);
                    this.getView().getModel("oFrontend").setProperty("/Items/" + e, i)
                } else {
                    for (var s = 0; s < r.SubItems.length; s++) {
                        r.SubItems[s].OpenQuantity = 0;
                        r.SubItems[s].QuantityInEntryUnit = 0
                    }
                    this.getView().getModel("oFrontend").setProperty("/Items/" + e, r)
                }
                this._controlSelectAllAndPostButton();
                this._updateHiglightProperty()
            }
        },
        handleStockTypeChange: function (e) {
            var t = e.getSource().getSelectedItem().data("ControlOfBatchTableField");
            var a = e.getSource().getSelectedItem().data("ControlOfReasonCodeTableField");
            var r = e.getSource().getSelectedItem().data("ControlOfExpirationDate");
            var i = e.getSource().getSelectedItem().data("ControlOfManufactureDate");
            var s = {};
            var o;
            var l;
            var n;
            var u;
            var d;
            var c;
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                s = this.getView().getModel("oItem").getData();
                this._evaluateFieldControl("Batch", t, s);
                this._evaluateFieldControl("GoodsMovementReasonCode", a, s);
                this._evaluateFieldControl("ShelfLifeExpirationDate", r, s);
                s.ShelfLifeExpirationDate_valueState = sap.ui.core.ValueState.None;
                this._evaluateFieldControl("ManufactureDate", i, s);
                s.ManufactureDate_valueState = sap.ui.core.ValueState.None;
                if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                    if (s.StockType_selectedKey === "U") {
                        s.StorageLocationVisible = false;
                        s.StorageLocation_valueState = sap.ui.core.ValueState.None;
                        s.StorageLocation_valueStateText = "";
                        if (s.ItemHasComponent && s.ItemComponentVisible) {
                            s.ItemComponentVisible = false
                        }
                    } else {
                        s.StorageLocationVisible = true;
                        if (s.StorageLocation_input === "") {
                            s.StorageLocation_valueState = sap.ui.core.ValueState.Error;
                            s.StorageLocation_valueStateText = this.getResourceBundle().getText("STORAGELOCATION_VALUE_STATE_TEXT")
                        }
                        if (s.ItemHasComponent && !s.ItemComponentVisible) {
                            s.ItemComponentVisible = true
                        }
                    }
                }
                this._setValueStateMandatoryFields(s);
                this.getView().getModel("oItem").setData(s);
                this._setReasonCodeFilter(s);
                if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                    o = this._ItemConsistent(s);
                    this.getView().getModel("oItem").setProperty("/Selected", o);
                    this.getView().getModel("oItem").setProperty("/SelectEnabled", o);
                    this.getView().getModel("oItem").setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(s))
                }
                l = s.Material_Input;
                n = s.Plant;
                u = s.DeliveredUnit_input;
                d = s.StorageLocation;
                c = s.StockType_selectedKey
            } else {
                var p = this._getSelectedItemInModel(e);
                var g = this.getView().getModel("oFrontend");
                s = g.getProperty("/Items/" + p);
                this._evaluateFieldControl("Batch", t, s);
                this._evaluateFieldControl("GoodsMovementReasonCode", a, s);
                this._evaluateFieldControl("ShelfLifeExpirationDate", r, s);
                s.ShelfLifeExpirationDate_valueState = sap.ui.core.ValueState.None;
                this._evaluateFieldControl("ManufactureDate", i, s);
                s.ManufactureDate_valueState = sap.ui.core.ValueState.None;
                if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                    if (s.StockType_selectedKey === "U") {
                        s.StorageLocationVisible = false;
                        s.StorageLocation_valueState = sap.ui.core.ValueState.None;
                        s.StorageLocation_valueStateText = "";
                        if (s.ItemHasComponent && s.ItemComponentVisible) {
                            s.ItemComponentVisible = false
                        }
                    } else {
                        s.StorageLocationVisible = true;
                        if (s.StorageLocation_input === "") {
                            s.StorageLocation_valueState = sap.ui.core.ValueState.Error;
                            s.StorageLocation_valueStateText = this.getResourceBundle().getText("STORAGELOCATION_VALUE_STATE_TEXT")
                        }
                        if (s.ItemHasComponent && !s.ItemComponentVisible) {
                            s.ItemComponentVisible = true;
                            this._calculateComponentQuantity(g.getProperty("/Ebeln"), s, p)
                        }
                    }
                }
                this._setValueStateMandatoryFields(s);
                g.setProperty("/Items/" + p, s);
                if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                    o = this._ItemConsistent(g.getProperty("/Items")[p], g.getProperty("/Items"));
                    g.setProperty("/Items/" + p + "/Selected", o);
                    g.setProperty("/Items/" + p + "/SelectEnabled", o);
                    var h = g.getProperty("/Items");
                    this._setSelectEnabled(h[p], h);
                    h = g.getProperty("/Items");
                    this._controlSelectAllAndPostButton(h);
                    this._updateHiglightProperty()
                }
                l = g.getProperty("/Items/" + p + "/Material_Input");
                n = g.getProperty("/Items/" + p + "/Plant");
                u = g.getProperty("/Items/" + p + "/DeliveredUnit_input");
                d = g.getProperty("/Items/" + p + "/StorageLocation");
                c = g.getProperty("/Items/" + p + "/StockType_selectedKey")
            }
            if (s.BatchVisible === true) {
                this.getView().getModel("oFrontend").setProperty("/ColumnBatchVisible", true)
            }
            if (s.ManufactureDateVisible === true) {
                this.getView().getModel("oFrontend").setProperty("/ColumnManufactureDateVisible", true)
            }
            if (s.ShelfLifeExpirationDateVisible === true) {
                this.getView().getModel("oFrontend").setProperty("/ColumnShelfLifeExpirationDateVisible", true)
            }
            if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                this._handleValidationMasterData(l, u, n, d, this._SelectedTableIndex);
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                    g = this.getView().getModel("oFrontend");
                    n = g.getProperty("/Items/" + this._SelectedTableIndex + "/Plant")
                } else {
                    g = this.getView().getModel("oItem");
                    n = g.getProperty("/Plant")
                }
                this._getControlFields(l, n, this._SelectedTableIndex, c)
            }
        },
        handleDateChange: function (e) {
            var t = sap.ui.core.ValueState.None;
            if (e.getParameter("valid") == false || e.getParameters().value == "") {
                t = sap.ui.core.ValueState.Error
            }
            e.getSource().setValueState(t);
            if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                this._controlSelectAllAndPostButton()
            } else {
                var a;
                var r = this.getView().getModel("oFrontend");
                var i = r.getProperty("/Items");
                for (var s = 0; s < i.length; s++) {
                    a = this._validationNoRefItem(s);
                    if (a === false) {
                        r.setProperty("/PostButtonEnabled", false);
                        break
                    } else {
                        r.setProperty("/PostButtonEnabled", true)
                    }
                }
            }
        },
        handleShelfLifeExpirationDateChange: function (e) {
            var t = sap.ui.core.ValueState.None;
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                var a = this._getSelectedItemInModel(e);
                var r = this.getView().getModel("oFrontend");
                var i = r.getProperty("/Items/" + a);
                if (r.getProperty("/Items/" + a + "/ShelfLifeExpirationDateVisible") !== true) {
                    r.setProperty("/Items/" + a + "/ShelfLifeExpirationDate_valueState", t)
                }
                if (e.getParameter("valid") === false || e.getParameters().value === "") {
                    t = sap.ui.core.ValueState.Error;
                    r.setProperty("/Items/" + a + "/ShelfLifeExpirationDate_valueState", t);
                    r.setProperty("/Items/" + this._SelectedTableIndex + "/ShelfLifeExpirationDate_valueStateText", this.getResourceBundle().getText("SHELFLIFE_VALUE_STATE_TEXT"))
                } else {
                    r.setProperty("/Items/" + a + "/ShelfLifeExpirationDate_valueState", t)
                }
                this._setValueStateMandatoryFields(i);
                r.setProperty("/Items/" + a, i);
                var s = this._ItemConsistent(r.getProperty("/Items")[a], r.getProperty("/Items"));
                if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                    r.setProperty("/Items/" + a + "/Selected", s);
                    r.setProperty("/Items/" + a + "/SelectEnabled", s)
                }
                this._setSelectEnabled(r.getProperty("/Items/" + a));
                this._controlSelectAllAndPostButton();
                this._updateHiglightProperty()
            } else {
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                    var i = this.getView().getModel("oItem");
                    if (i.getData().ShelfLifeExpirationDateVisible !== true) {
                        i.setProperty("/ShelfLifeExpirationDate_valueState", t)
                    }
                    if (e.getParameter("valid") === false || e.getParameters().value === "") {
                        t = sap.ui.core.ValueState.Error;
                        i.setProperty("/ShelfLifeExpirationDate_valueState", t);
                        i.setProperty("/ShelfLifeExpirationDate_valueStateText", this.getResourceBundle().getText("SHELFLIFE_VALUE_STATE_TEXT"))
                    } else {
                        i.setProperty("/ShelfLifeExpirationDate_valueState", t)
                    }
                    this._setValueStateMandatoryFields(i.getData());
                    var o = this._ItemConsistent(i.getData());
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        i.setProperty("/SelectEnabled", o);
                        i.setProperty("/Selected", o);
                        i.setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(i.getData()))
                    }
                }
            }
            if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                this._setGuidedTour(a)
            }
            this.getView().byId("idShelfLifeExpirationDate").focus()
        },
        handleManufactureDateChange: function (e) {
            var t = sap.ui.core.ValueState.None;
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                var a = this._getSelectedItemInModel(e);
                var r = this.getView().getModel("oFrontend");
                var i = r.getProperty("/Items/" + a);
                if (i.ManufactureDateMandatory === true && e.getParameters().value === "") {
                    t = sap.ui.core.ValueState.Error;
                    r.setProperty("/Items/" + a + "/ManufactureDate_valueState", t);
                    r.setProperty("/Items/" + a + "/ManufactureDate_valueStateText", this.getResourceBundle().getText("PRODUCTION_VALUE_STATE_TEXT"))
                } else {
                    if (e.getParameter("valid") === false) {
                        t = sap.ui.core.ValueState.Error;
                        r.setProperty("/Items/" + a + "/ManufactureDate_valueState", t);
                        r.setProperty("/Items/" + a + "/ManufactureDate_valueStateText", this.getResourceBundle().getText("PRODUCTION_VALUE_STATE_TEXT"))
                    } else {
                        r.setProperty("/Items/" + a + "/ManufactureDate_valueState", t);
                        if (i.ShelfLifeExpirationDateEnabled !== true) {
                            this._calculateExpirationDate(r.oData.Ebeln, i, a)
                        }
                    }
                }
                this._setValueStateMandatoryFields(i);
                r.setProperty("/Items/" + a, i);
                var s = this._ItemConsistent(r.getProperty("/Items")[a], r.getProperty("/Items"));
                r.setProperty("/Items/" + a + "/Selected", s);
                r.setProperty("/Items/" + a + "/SelectEnabled", s);
                this._controlSelectAllAndPostButton();
                this._updateHiglightProperty()
            } else {
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                    var o = this.getView().getModel("oFrontend").getData(o);
                    var i = this.getView().getModel("oItem");
                    if (i.getData().ManufactureDateMandatory === true && e.getParameters().value === "") {
                        t = sap.ui.core.ValueState.Error;
                        i.setProperty("/ManufactureDate_valueState", t);
                        i.setProperty("/ManufactureDate_valueStateText", this.getResourceBundle().getText("PRODUCTION_VALUE_STATE_TEXT"))
                    } else {
                        if (e.getParameter("valid") === false) {
                            t = sap.ui.core.ValueState.Error;
                            i.setProperty("/ManufactureDate_valueState", t);
                            i.setProperty("/ManufactureDate_valueStateText", this.getResourceBundle().getText("PRODUCTION_VALUE_STATE_TEXT"))
                        } else {
                            i.setProperty("/ManufactureDate_valueState", t);
                            if (i.getData().ShelfLifeExpirationDateEnabled !== true) {
                                this._calculateExpirationDate(o.Ebeln, i.getData())
                            }
                        }
                    }
                    this._setValueStateMandatoryFields(i.getData());
                    var l = this._ItemConsistent(i.getData());
                    if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                        i.setProperty("/SelectEnabled", l);
                        i.setProperty("/Selected", l);
                        i.setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(i.getData()))
                    }
                }
            }
            if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                this._setGuidedTour(a)
            }
            this.getView().byId("idManufactureDate").focus()
        },
        handleUpperCase: function (e) {
            var t = e.getSource().getValue();
            if (t) {
                e.getSource().setValue(t.toUpperCase())
            }
        },
        handleItemSplit: function (e) {
            var t = this._getSelectedItemInModel(e);
            var a = this.getView().getModel("oFrontend");
            var r = a.getData();
            if (r.Items[t].SplitButtonIcon === "sap-icon://add") {
                var i = JSON.parse(JSON.stringify(r.Items[t]));
                i.ItemCounter = this._getMaxItemOfDocumentIteminModel(r.Items[t].DocumentItem, a);
                i.ItemCounter++;
                i.SplitEnabled = true;
                i.MaterialVisible = false;
                i.AccountAssignmentVisible = false;
                i.PlantVisible = false;
                i.StockTypeVisible = true;
                i.DeliveredQuantity_input = 0;
                i.SplitButtonIcon = "sap-icon://less";
                if (i.SubItems && i.SubItems.length > 0) {
                    if (i.ComponentAutoAdjusted) {
                        i.ComponentIconState = g.Positive;
                        if (i.highlight === sap.ui.core.MessageType.Warning) {
                            i.highlight = sap.ui.core.MessageType.None
                        }
                    }
                    i.ComponentManualAdjusted = false;
                    i.ComponentAutoAdjusted = false;
                    for (var s = 0; s < i.SubItems.length; s++) {
                        i.SubItems[s].QuantityInEntryUnit = 0;
                        i.SubItems[s].OpenQuantity = 0
                    }
                }
                r.Items.splice(++t, 0, i);
                a.setData(r)
            } else {
                r.Items.splice(t, 1);
                a.setData(r)
            }
            var o = this.getView().byId("idProductsTable").getItems();
            var l = o.length;
            for (var s = 1; s < l; s++) {
                if (r.Items[s].SplitButtonIcon === "sap-icon://less") {
                    o[s].getCells()[9].setTooltip(this.getResourceBundle().getText("LABEL_DISTRIBUTION_DELETE"))
                }
            }
            this._updateStackedBarChartColumn()
        },
        handleDetailPress: function (e) {
            var t = sap.ui.core.UIComponent.getRouterFor(this);
            var a = this.getView().getModel("oFrontend");
            var r = a.getProperty("/Items");
            var i = this._getSelectedItemInModel(e);
            t.navTo("subscreen", {
                POItem: i
            }, true)
        },
        handleNavButtonPress: function (e) {
            var t = this.getModel("oItem").getData();
            var a = this.getModel("oFrontend");
            var r = a.getProperty("/Items");
            var i;
            if (this._aExtendedFields && this._aExtendedFields.length > 0) {
                var s = this.getView().byId("idExtensionForm").getElementBinding().getBoundContext().getObject();
                for (var l = 0; l < this._aExtendedFields.length; l++) {
                    if (this._isExtendedField(this._aExtendedFields[l].name) === true) {
                        t[this._aExtendedFields[l].name] = s[this._aExtendedFields[l].name]
                    }
                }
            }
            if (this._SourceOfGR != this._SourceOfGRIsNoReference) {
                if (this._applyButtonEnabled(t)) {
                    if (r) {
                        for (var l = 0; l < r.length; l++) {
                            if (r[l].DocumentItem === t.DocumentItem && r[l].ItemCounter === t.ItemCounter) {
                                if (!t.ComponentManualAdjusted && t.SubItems && t.SubItems.length > 0 && r[l].SubItems && r[l].SubItems.length > 0) {
                                    var n = h.checkIfSubItemChanged(r[l], t);
                                    if (n) {
                                        t.ComponentIconState = g.Positive;
                                        t.ComponentAutoAdjusted = false
                                    }
                                    t.ComponentManualAdjusted = n
                                }
                                r[l] = t
                            }
                        }
                        a.setProperty("/Items", r)
                    }
                    this._setSelectEnabled(t, r)
                }
            } else {
                if (r) {
                    for (var l = 0; l < r.length; l++) {
                        if (r[l].DocumentItem === t.DocumentItem && r[l].ItemCounter === t.ItemCounter) {
                            r[l] = t
                        }
                    }
                    a.setProperty("/Items", r)
                }
                var u = this.getView().getModel("oItem");
                var d = u.getProperty("/DocumentItem");
                var c;
                c = this.getResourceBundle().getText("ITEM_APPLIED", [d]);
                o.show(c, {
                    duration: 1500,
                    closeOnBrowserNavigation: false
                })
            }
            var p = null;
            if (this.getView().byId("idBatchLabel").getVisible() === true && this.getView().byId("idBatchLabel").getFields().length > 1) {
                p = this.getView().byId("idBatchLabel").removeField("idCreateBatchButton")
            }
            if (p) {
                p.detachPress(this.handleCreateBatch, this).destroy()
            }
            a.setProperty("/ColumnStorageBinVisible", this._isStorageBinInItems(a.getData().Items));
            var m = sap.ui.core.UIComponent.getRouterFor(this);
            m.navTo("fullscreen", {
                abort: "false"
            }, true)
        },
        handleCancelButtonPress: function (e) {
            var t = null;
            if (this.getView().byId("idBatchLabel").getVisible() === true && this.getView().byId("idBatchLabel").getFields().length > 1) {
                t = this.getView().byId("idBatchLabel").removeField("idCreateBatchButton")
            }
            if (t) {
                t.detachPress(this.handleCreateBatch, this).destroy()
            }
            var a = sap.ui.core.UIComponent.getRouterFor(this);
            a.navTo("fullscreen", {
                abort: "true"
            }, true)
        },
        _handleRouteMatched: function (e, t) {
            if (t.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom" && e.getParameters().name === "subscreenAppState" && t._oDetailPageData) {
                var a = sap.ui.core.UIComponent.getRouterFor(t);
                var r = a.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S2", sap.ui.core.mvc.ViewType.XML);
                var i = new sap.ui.model.json.JSONModel(t._oDetailPageData);
                r.setModel(i, "oItem");
                t._oDetailPageData = null;
                return
            }
            if (t.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom" && e.getParameters().name === "fullscreen") {
                var s = "true";
                s = e.getParameter("arguments").abort;
                var o = t.getView().getModel("oFrontend");
                var l = o.getProperty("/Items");
                if (s === "false") {
                    if (t._SourceOfGR !== t._SourceOfGRIsNoReference) {
                        t._controlSelectAllAndPostButton(l);
                        t._updateHiglightProperty()
                    } else {
                        t._updateHiglightProperty();
                        var n;
                        var u = false;
                        for (var d = 0; d < l.length; d++) {
                            n = t._validationNoRefItem(d);
                            var c = t.getView().getModel("oFrontend");
                            if (l[d].BatchVisible === true && u === false) {
                                c.setProperty("/ColumnBatchVisible", true)
                            }
                            if (n === false) {
                                c = t.getView().getModel("oFrontend");
                                c.setProperty("/PostButtonEnabled", false);
                                break
                            } else {
                                c = t.getView().getModel("oFrontend");
                                c.setProperty("/PostButtonEnabled", true)
                            }
                        }
                    }
                }
                for (var p = 0; p < l.length; p++) {
                    if (l[p].Selected) {
                        o.setProperty("/CopyButtonVisible", true);
                        o.setProperty("/DeleteButtonVisible", true)
                    }
                }
            } else {
                if (t.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom" && (e.getParameters().name === "fullscreen2" || e.getParameters().name === "fullscreen3")) {
                    var g = sap.ui.core.routing.HashChanger.getInstance();
                    var h = g.getHash();
                    if (h.indexOf("key") > -1) {
                        var m = h.split("/");
                        if (m.length >= 2) {
                            var S = m[m.length - 1];
                            var f = t.getView().byId("POInput");
                            if (f.getValue() !== S) {
                                f.setValue(S);
                                f.fireChangeEvent(S)
                            }
                        }
                    }
                } else {
                    if (t.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom" && e.getParameters().name === "fullscreen4") {} else {
                        var a = sap.ui.core.UIComponent.getRouterFor(t);
                        var _ = t.getModel("oFrontend").getProperty("/Items/" + e.getParameter("arguments").POItem + "/");
                        var I = {};
                        jQuery.extend(true, I, _);
                        var y = new sap.ui.model.json.JSONModel(I);
                        var r = a.getView("s2p.mm.im.goodsreceipt.purchaseorder.view.S2", sap.ui.core.mvc.ViewType.XML);
                        if (t._SourceOfGR === t._SourceOfGRIsNoReference) {
                            var n = t._validationNoRefItem(e.getParameter("arguments").POItem);
                            if (n === false) {
                                y.setProperty("/ApplyButtonEnabled", false)
                            } else {
                                if (_.Material_Input === "") {
                                    y.setProperty("/ApplyButtonEnabled", false)
                                } else {
                                    y.setProperty("/ApplyButtonEnabled", true)
                                }
                            }
                        } else {
                            var P = t._ItemConsistent(_);
                            y.setProperty("/SelectEnabled", P);
                            y.setProperty("/Selected", P);
                            y.setProperty("/ApplyButtonEnabled", t._applyButtonEnabled(_))
                        }
                        r.setModel(y, "oItem");
                        r.setModel(t.getModel("oFrontend"), "oFrontend");
                        t._setReasonCodeFilter(y.getData());
                        r.byId("idTableSearchAccounting").setValue("");
                        var v = t.getModel("oFrontend").getProperty("/CreateBatchActive");
                        if (_.BatchVisible === true && v === true) {
                            r.byId("idBatchLabel").addField(new sap.m.Button("idCreateBatchButton", {
                                visible: true,
                                text: "{i18n>BUTTON_CREATE_BATCH}",
                                tooltip: "{i18n>TOOLTIP_CREATE_BATCH}",
                                enabled: "{oItem>/ItemEnabled}"
                            }).attachPress(t.handleCreateBatch, t))
                        }
                        if (t._aExtendedFields && t._aExtendedFields.length > 0) {
                            var b = t.getOwnerComponent().getModel("oData");
                            var D = e.getParameter("arguments").POItem;
                            r.byId("idExtensionForm").bindElement({
                                path: "/GR4PO_DL_Items(InboundDelivery='" + t.getModel("oFrontend").getProperty("/Ebeln") + "',DeliveryDocumentItem='" + _.DocumentItem + "',SourceOfGR='" + t._SourceOfGR + "',AccountAssignmentNumber='')"
                            })
                        }
                    }
                }
            }
        },
        _allItemsInTableSelected: function (e) {
            var t = [];
            if (e) {
                t = e
            } else {
                var a = this.getView().getModel("oFrontend");
                t = a.getProperty("/Items")
            }
            var r = false;
            if (t.length > 0) {
                r = true;
                for (var i = 0; i < t.length; i++) {
                    if (t[i].Selected == false && t[i].ItemCounter == 0) {
                        r = false
                    }
                }
            }
            return r
        },
        _oneItemsInTableSelected: function (e) {
            var t = [];
            if (e) {
                t = e
            } else {
                var a = this.getView().getModel("oFrontend");
                t = a.getProperty("/Items")
            }
            var r = false;
            for (var i = 0; i < t.length; i++) {
                if (t[i].Selected == true && t[i].ItemCounter == 0) {
                    r = true
                }
            }
            return r
        },
        _oneItemsInTableEnabled: function (e) {
            var t = [];
            if (e) {
                t = e
            } else {
                var a = this.getView().getModel("oFrontend");
                t = a.getProperty("/Items")
            }
            var r = false;
            for (var i = 0; i < t.length; i++) {
                if (t[i].SelectEnabled == true && t[i].ItemCounter == 0) {
                    r = true
                }
            }
            return r
        },
        _ItemConsistent: function (e, t) {
            var a;
            if (t) {
                a = t
            } else {
                var r = this.getView().getModel("oFrontend");
                a = r.getProperty("/Items")
            }
            var i = true;
            for (var s = 0; s < a.length; s++) {
                if (a[s].DocumentItem === e.DocumentItem) {
                    if (a[s].ItemCounter === e.ItemCounter) {
                        i = this._applyButtonEnabled(e)
                    } else {
                        i = this._applyButtonEnabled(a[s])
                    }
                }
            }
            return i
        },
        _applyButtonEnabled: function (e) {
            var t = true;
            for (var a in e) {
                if (a.indexOf("_valueState") > 0 && a.indexOf("_valueStateText") < 0) {
                    if (e[a] !== sap.ui.core.ValueState.None && e[a] !== sap.ui.core.ValueState.Success) {
                        t = false
                    }
                }
            }
            if (t && e.ItemComponentVisible) {
                t = h._applyButtonEnabledForSubItems(e)
            }
            return t
        },
        _updateHighlightForEachItem: function (e) {
            var t = sap.ui.core.MessageType.None;
            for (var a in e) {
                if (a.indexOf("_valueState") > 0 && a.indexOf("_valueStateText") < 0) {
                    if (e[a] === sap.ui.core.ValueState.Error) {
                        t = sap.ui.core.MessageType.Error;
                        break
                    } else if (e[a] === sap.ui.core.ValueState.Warning && t === sap.ui.core.MessageType.None) {
                        t = sap.ui.core.MessageType.Warning
                    }
                }
                if (e.ItemComponentVisible && a.indexOf("ComponentIconState") >= 0) {
                    if (e[a] === g.Negative) {
                        t = sap.ui.core.MessageType.Error;
                        break
                    } else if (e[a] === g.Critical) {
                        t = sap.ui.core.MessageType.Warning
                    }
                }
            }
            return t
        },
        _updateHiglightProperty: function () {
            var e = this.getModel("oFrontend");
            var t = this.getView().byId("idProductsTable").getItems();
            var a = e.getData().Items;
            for (var r = 0; r < t.length; r++) {
                for (var i = 0; i < a.length; i++) {
                    if (t[r].getBindingContext("oFrontend").getObject().DocumentItem === a[i].DocumentItem && t[r].getBindingContext("oFrontend").getObject().ItemCounter === a[i].ItemCounter) {
                        e.setProperty("/Items/" + i + "/highlight", this._updateHighlightForEachItem(a[i]));
                        break
                    }
                }
            }
        },
        _setValueStateMandatoryFields: function (e) {
            var t = "";
            for (var a in e) {
                if (a.indexOf("Mandatory") > 0 && e[a] === true) {
                    t = a.substring(0, a.indexOf("Mandatory"));
                    if (e[t] !== undefined && e[t] === "" || e[t + "_selectedKey"] !== undefined && e[t + "_selectedKey"] === "") {
                        e[t + "_valueState"] = sap.ui.core.ValueState.Error;
                        e.highlight = sap.ui.core.ValueState.Error
                    }
                }
            }
        },
        _controlSelectAllCheckBox: function (e, t) {
            var a = this.getView().byId("idSelectAll");
            if (t) {
                a.setSelected(true).setPartiallySelected(false)
            } else if (e) {
                a.setSelected(true).setPartiallySelected(true)
            } else {
                a.setSelected(false)
            }
        },
        _controlSelectAllAndPostButton: function (e) {
            var t = [];
            var a = this.getView().getModel("oFrontend");
            if (e) {
                t = e
            } else {
                t = a.getProperty("/Items")
            }
            var r = this._oneItemsInTableSelected(t);
            var i = this._allItemsInTableSelected(t);
            var s = this._SourceOfGR === this._SourceOfGRIsNoReference;
            if (a.getProperty("/DocumentDate_valueState") == sap.ui.core.ValueState.None && a.getProperty("/PostingDate_valueState") == sap.ui.core.ValueState.None) {
                a.setProperty("/PostButtonEnabled", r || s)
            } else {
                a.setProperty("/PostButtonEnabled", false)
            }
            this.getView().byId("idSelectAll").setEnabled(this._oneItemsInTableEnabled(t));
            this._controlSelectAllCheckBox(r, i)
        },
        _setSelectEnabled: function (e, t) {
            var a;
            var r = this.getView().getModel("oFrontend");
            if (t) {
                a = t
            } else {
                a = r.getProperty("/Items")
            }
            for (var i = 0; i < a.length; i++) {
                if (a[i].DocumentItem == e.DocumentItem && (a[i].Selected !== e.Selected || a[i].SelectEnabled !== e.SelectEnabled)) {
                    r.setProperty("/Items/" + i + "/SelectEnabled", e.SelectEnabled);
                    r.setProperty("/Items/" + i + "/Selected", e.Selected)
                }
            }
        },
        _getSelectedItemInModel: function (e) {
            var t = e.getSource().getBindingContext("oFrontend").getPath();
            return parseInt(t.substring(7, t.length))
        },
        _getMaxItemOfDocumentIteminModel: function (e, t) {
            var a = {};
            if (!t) {
                a = this.getView().getModel("oFrontend")
            } else {
                a = t
            }
            var r = a.getProperty("/Items");
            var i = 0;
            for (var s = 0; s < r.length; s++) {
                if (r[s].DocumentItem === e && r[s].ItemCounter > i) {
                    i = r[s].ItemCounter
                }
            }
            return i
        },
        _getInnerAppState: function (e, t, a) {
            var r = {
                customData: {}
            };
            var i;
            if (!e) {
                i = this.getModel("oFrontend").getData()
            } else {
                i = e
            }
            for (var s = 0; s < this._oNavigationServiceFields.aHeaderFields.length; s++) {
                r.customData[this._oNavigationServiceFields.aHeaderFields[s]] = i[this._oNavigationServiceFields.aHeaderFields[s]]
            }
            r.customData.Temp_Key = this.temp_objectKey;
            r.customData.Items = i.Items;
            if (t) {
                r.customData.oBatchCreate = t
            }
            if (a) {
                r.customData.DetailPageData = a
            }
            return r
        },
        _getSuccessPostDialogState: function (e) {
            var t = {
                customData: {
                    successPostDialog: e
                }
            };
            return t
        },
        _restoreInnerAppStateSourceOfGRIsNoReference: function (e) {
            var t = this.getView().getModel("oFrontend").getData();
            for (var a = 0; a < this._oNavigationServiceFields.aHeaderFields.length; a++) {
                t[this._oNavigationServiceFields.aHeaderFields[a]] = e[this._oNavigationServiceFields.aHeaderFields[a]]
            }
            t.Items = e.Items;
            this.getView().getModel("oFrontend").setData(t)
        },
        _setSearchPlaceholderText: function () {
            var e = "";
            if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                e = this.getResourceBundle().getText("SEARCH_PLACEHOLDER_TEXT_STO_PO")
            } else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                e = this.getResourceBundle().getText("SEARCH_PLACEHOLDER_TEXT_PROD")
            } else {
                e = this.getResourceBundle().getText("SEARCH_PLACEHOLDER_TEXT_DL")
            }
            this.getModel("oFrontend").setProperty("/searchPlaceholderText", e)
        },
        _updateStackedBarChartColumn: function () {
            var e = this.getModel("oFrontend").getData();
            var t = this.getView().byId("idProductsTable").getItems();
            for (var a = 0; a < t.length; a++) {
                for (var r = 0; r < e.Items.length; r++) {
                    if (e.Items[r].AccountAssignmentVisible === true) {
                        if (t[a].getBindingContext("oFrontend").getObject().DocumentItem === e.Items[r].DocumentItem && t[a].getBindingContext("oFrontend").getObject().ItemCounter === 0) {
                            this._updateStackedBarChart(t[a], e.Items[r]);
                            break
                        }
                    }
                }
            }
        },
        onUpdateFinished: function () {
            this._updateStackedBarChartColumn()
        },
        _updateStackedBarChart: function (e, t) {
            if (t.AccountAssignmentVisible === true) {
                var a = e.getCells();
                var r = null;
                for (var i = 0; i < a.length; i++) {
                    if (a[i].getId().indexOf("idAccountAssignment") > 0) {
                        r = i
                    }
                }
                e.getCells()[r].getContent()[1].removeAllBars();
                var s = t.AccountAssignments.length;
                if (s < 2) {
                    t.AccountAssignments[0].MultipleAcctAssgmtDistrPercent = 100
                }
                for (var o = 0; o < t.AccountAssignments.length; o++) {
                    var l = new sap.suite.ui.microchart.StackedBarMicroChartBar({
                        value: parseFloat(t.AccountAssignments[o].MultipleAcctAssgmtDistrPercent),
                        displayValue: t.AccountAssignments[o].MultipleAcctAssgmtDistrPercent + " %",
                        valueColor: this._aSemanticChartColors[o]
                    });
                    e.getCells()[r].getContent()[1].addBar(l)
                }
            }
        },
        _setScanButtonVisibility: function () {
            if (jQuery.support.touch || this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                this.getModel("oFrontend").setProperty("/ScanButtonVisible", this._oPersonalizedDataContainer.EnableBarcodeScanning)
            } else {
                this.getModel("oFrontend").setProperty("/ScanButtonVisible", false)
            }
        },
        _evaluateFieldControl: function (e, t, a) {
            if (t.substring(0, 1) === "1") {
                a[e + "Visible"] = true
            } else {
                a[e + "Visible"] = false
            }
            if (t.substring(1, 2) === "1") {
                a[e + "Mandatory"] = true
            } else {
                a[e + "Mandatory"] = false
            }
            if (t.substring(2, 3) === "1") {
                a[e + "Enabled"] = true
            } else {
                a[e + "Enabled"] = false
            }
            if (t.substring(3, 4) === "1") {
                a[e + "ValueHelpVisible"] = true
            } else {
                a[e + "ValueHelpVisible"] = false
            }
            if (t.substring(4, 5) === "1") {
                a[e + "CreateButtonVisible"] = true
            } else {
                a[e + "CreateButtonVisible"] = false
            }
        },
        _setReasonCodeFilter: function (e) {
            if (e.GoodsMovementReasonCodeVisible === true) {
                var t = this._getMovementType(e);
                var a = [];
                a.push(new sap.ui.model.Filter("MovementType", sap.ui.model.FilterOperator.EQ, t));
                this.getView().byId("idGoodsMovementReasonCodeSelect").getBinding("items").filter(a)
            }
        },
        _calculateExpirationDate: function (e, t, a) {
            var r = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "yyyy-MM-dd"
            });
            var i = e;
            if (this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
                i = "000" + i
            }
            if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                i = "00" + i
            }
            if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                i = ""
            }
            var s = "";
            var o;
            if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                o = t.Material
            } else {
                o = t.Material_Input
            }
            var l = this._getMovementType(t);
            this.getOwnerComponent().getModel("oData").callFunction("/ShelfLifeExpirationDate", {
                method: "GET",
                urlParameters: {
                    DeliveryDocumentItem: t.DocumentItem,
                    InboundDelivery: i,
                    ManufactureDate: r.format(this._oDateFormat.parse(t.ManufactureDate)),
                    Material: o,
                    MovementType: l,
                    Plant: t.Plant,
                    SourceOfGR: this._SourceOfGR,
                    StorageLocation: t.StorageLocation
                },
                success: jQuery.proxy(this._successExpirationDateLoad, this, a),
                error: jQuery.proxy(this._handleOdataError, this)
            })
        },
        _successExpirationDateLoad: function (e, t, a) {
            if (t.results[0]) {
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                    this.getView().getModel("oFrontend").setProperty("/Items/" + e + "/ShelfLifeExpirationDate", this._oDateFormat.format(t.results[0].ShelfLifeExpirationDate))
                } else {
                    this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate", this._oDateFormat.format(t.results[0].ShelfLifeExpirationDate))
                }
            }
        },
        _isExtendedField: function (e) {
            if (e.lastIndexOf("_COB") === e.length - 4) {
                return true
            } else {
                return false
            }
        },
        handleViewSettingsDialogButtonPressed: function (e) {
            if (!this._oSettingsDialog) {
                this._oSettingsDialog = sap.ui.xmlfragment("s2p.mm.im.goodsreceipt.purchaseorder.view.settings", this);
                this.getView().addDependent(this._oSettingsDialog)
            }
            this._oSettingsDialog.open()
        },
        handleViewSettingsConfirm: function (e) {
            var t = this.getView();
            var a = t.byId("idProductsTable");
            var r = e.getParameters();
            var i = a.getBinding("items");
            var s = [];
            var o = r.sortItem.getKey();
            var l = r.sortDescending;
            s.push(new sap.ui.model.Sorter(o, l));
            if (o == "Material" || o == "MaterialName") {
                s.push(new sap.ui.model.Sorter("DocumentItem_int", false))
            }
            s.push(new sap.ui.model.Sorter("ItemCounter", false));
            i.sort(s)
        },
        handleViewSettingsCancel: function (e) {},
        handlePost: function () {
            if (sap.ui.getCore().getMessageManager().getMessageModel().getData().length > 0) {
                sap.ui.getCore().getMessageManager().removeAllMessages()
            }
            var e = this.getView().getModel("oFrontend");
            var t = this.getView().getModel("bindata");
            var a = t.getData();
            var r = this.getResourceBundle();
            var i = sap.ui.core.format.DateFormat.getDateTimeInstance({
                pattern: "yyyy-MM-dd"
            });
            var s = e.getData();
            var o = {};
            var l = [];
            o.InboundDelivery = "";
            var n = e.getProperty("/DocumentDate");
            o.DocumentDate = i.format(this._oDateFormat.parse(n)) + "T00:00:00";
            n = e.getProperty("/PostingDate");
            o.PostingDate = i.format(this._oDateFormat.parse(n)) + "T00:00:00";
            o.InboundDelivery = e.getProperty("/Ebeln");
            o.SourceOfGR = this._SourceOfGR;
            o.DeliveryDocumentByVendor = e.getProperty("/DeliveryDocumentByVendor");
            o.MaterialDocumentHeaderText = e.getProperty("/MaterialDocumentHeaderText");
            o.Temp_Key = this.temp_objectKey;
            o.BillOfLading = e.getProperty("/BillOfLading");
            o.VersionForPrintingSlip = e.getProperty("/VersionForPrintingSlip_selectedKey");
            var u;
            o.Header2Items = new Array;
            var d = [];
            for (var c = 0; c < s.Items.length; c++) {
                u = {};
                u.Material = s.Items[c].Material;
                if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                    u.Material = s.Items[c].Material_Input
                }
                u.InboundDelivery = e.getProperty("/Ebeln");
                u.DeliveryDocumentItem = s.Items[c].DocumentItem;
                u.DocumentItemText = s.Items[c].DocumentItemText;
                u.QuantityInEntryUnit = "" + s.Items[c].DeliveredQuantity_input;
                u.EntryUnit = s.Items[c].DeliveredUnit_input;
                u.OpenQuantity = s.Items[c].OpenQuantity;
                u.UnitOfMeasure = s.Items[c].Unit;
                u.Plant = s.Items[c].Plant;
                u.StorageLocation = s.Items[c].StorageLocation;
                u.StockType = s.Items[c].StockType_selectedKey;
                if (u.StockType === " ") {
                    u.StockType = ""
                }
                u.Batch = s.Items[c].Batch;
                u.SupplierBatch = s.Items[c].SupplierBatch;
                u.AcctAssignmentCategory = s.Items[c].AcctAssignmentCategory;
                u.AcctAssignmentCategoryName = s.Items[c].AcctAssignmentCategoryName;
                u.AssetNumber = s.Items[c].AssetNumber;
                u.AssetNumberName = s.Items[c].AssetNumberName;
                u.SubAssetNumber = s.Items[c].SubAssetNumber;
                u.GLAccount = s.Items[c].GLAccount;
                u.GLAccountName = s.Items[c].GLAccountName;
                u.Project = s.Items[c].Project;
                u.ProjectDescription = s.Items[c].ProjectDescription;
                u.InventorySpecialStockType = s.Items[c].InventorySpecialStockType;
                u.SalesOrder = s.Items[c].SalesOrder;
                u.SalesOrderItem = s.Items[c].SalesOrderItem;
                u.WBSElement = s.Items[c].Project;
                u.WBSElementDescription = s.Items[c].ProjectDescription;
                u.Supplier = s.Items[c].Lifnr;
                if (s.Items[c].DeliveryCompleted === true) {
                    u.DeliveryCompleted = "X"
                }
                u.UnloadingPointName = s.Items[c].UnloadingPointName;
                u.GoodsRecipientName = s.Items[c].GoodsRecipientName;
                u.SubItem = s.Items[c].ItemCounter.toString();
                u.GoodsMovementReasonCode = s.Items[c].GoodsMovementReasonCode_selectedKey;
                if (s.Items[c].ShelfLifeExpirationDate !== "") {
                    u.ShelfLifeExpirationDate = i.format(this._oDateFormat.parse(s.Items[c].ShelfLifeExpirationDate)) + "T00:00:00"
                }
                if (s.Items[c].ManufactureDate !== "") {
                    u.ManufactureDate = i.format(this._oDateFormat.parse(s.Items[c].ManufactureDate)) + "T00:00:00"
                }
                if (this._aExtendedFields && this._aExtendedFields.length > 0) {
                    for (var p = 0; p < this._aExtendedFields.length; p++) {
                        if (this._isExtendedField(this._aExtendedFields[p].name) === true) {
                            u[this._aExtendedFields[p].name] = s.Items[c][this._aExtendedFields[p].name]
                        }
                    }
                }
                if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                    if (u.QuantityInEntryUnit >= 0 && s.Items[c].Selected === true) {
                        if (s.Items[c].ComponentManualAdjusted && s.Items[c].SubItems && u.StockType !== "U") {
                            u = h.handleSubItemDataForPosting(u, s.Items[c].SubItems)
                        }
                        o.Header2Items.push(u)
                    }
                } else {
                    if (u.QuantityInEntryUnit > 0) {
                        o.Header2Items.push(u)
                    }
                }
            }
            o.Header2Refs = [{}];
            var g = s.Items.filter(e => e.WMLInScope && e.Selected === true);
            for (c = 0; c < g.length; c++) {
                var m = g[c].DeliveredQuantity_input + " " + g[c].DeliveredUnit_input + " - " + g[c].Material + "/" + g[c].StorageLocation + (g[c].ItemCounter > 0 ? "/" + g[c].ItemCounter : "");
                if (a === undefined || a.Bin === undefined) {
                    d.push(r.getText("MESSAGE_ITEM_MISSING_DATA", [m, "Storage Bin"]))
                } else {
                    var S = a.Bin[c];
                    if (S === undefined || S.StorageBin === "") {
                        d.push(r.getText("MESSAGE_ITEM_MISSING_DATA", [m, "Storage Bin"]))
                    }
                }
            }
            if (d.length > 0) {
                var f = "<ul>";
                d.forEach(function (e) {
                    f += "<li>" + e + "</li>"
                });
                f += "</ul>";
                sap.m.MessageBox.error(r.getText("MESSAGE_ITEM_MISSING_DATA", ["Items", "Storage Bin"]), {
                    icon: sap.m.MessageBox.Icon.QUESTION,
                    title: r.getText("DIALOG_MESSAGE_ITEM_MISSING_DATA"),
                    details: f,
                    onClose: function () {},
                    styleClass: "sapUiSizeCompact",
                    initialFocus: sap.m.MessageBox.Action.CANCEL
                });
                return
            }
            this._toggleBusy(true);
            this.getView().getModel("oData").create("/GR4PO_DL_Headers", o, {
                success: jQuery.proxy(this._handlePostSuccess, this),
                error: jQuery.proxy(this._handleOdataError, this)
            })
        },
        _handleErrorResponse: function (e) {
            var t, a, r, i, s, o, l, n;
            var u = this.getView().getModel("oFrontend");
            var d = this._SourceOfGR === this._SourceOfGRIsNoReference;

            function c(e, u, c) {
                switch (u) {
                    case "PostingDate":
                        e.setProperty("/" + u + "_valueState", sap.ui.core.ValueState.Error);
                        e.setProperty("/" + u + "_valueStateText", c);
                        break;
                    default:
                        t = /Item=(\d*)/g;
                        r = t.exec(u);
                        o = /Counter=(\d*)/g;
                        l = o.exec(u);
                        if (r) {
                            a = r[1];
                            n = l[1];
                            i = u.substring(u.lastIndexOf("/") + 1, u.length);
                            s = e.getProperty("/Items");
                            for (var p = 0; p < s.length; p++) {
                                if ((s[p].DocumentItem === a || a.endsWith(s[p].DocumentItem)) && (s[p].ItemCounter.toString() === n || n.endsWith(s[p].ItemCounter.toString()))) {
                                    s[p][i + "_valueState"] = "Error";
                                    s[p][i + "_valueStateText"] = c;
                                    s[p].Selected = false;
                                    s[p].SelectEnabled = d || false;
                                    s[p].highlight = "Error";
                                    s[p].ApplyButtonEnabled = false;
                                    break
                                }
                            }
                        }
                        break
                }
            }
            c(u, e.target, e.message);
            if (e.details) {
                for (var p = 0; p < e.details.length; p++) {
                    c(u, e.details[p].target, e.details[p].message)
                }
            }
            this._controlSelectAllAndPostButton(u.getProperty("/Items"))
        },
        _handlePostSuccess: function (e, a) {
            this._toggleBusy(false);
            var r = a.headers["sap-message"];
            var i = JSON.parse(r);
            var s = {
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
            var o = new t(s);
            this.getView().setModel(o, "bindata");
            if (i.code === "MIGO/012" || i.code === "MBND_CLOUD/017" || i.code === "MBND_CLOUD/018") {
                this._initialDataLoaded = null;
                this._openSuccessDialog(e, i);
                sap.ui.getCore().getMessageManager().removeAllMessages();
                this.getView().getModel("oFrontend").setData(this._getInitFrontend());
                this._ResetStorageLocationBuffer = true;
                this._ResetBatchBuffer = true;
                this.getView().byId("idProductsTable").getBinding("items").filter([]);
                this.getView().byId("idSelectAll").setSelected(false);
                this.getView().byId("idTableSearch").setValue("");
                this.getView().byId("POInput").setValue("");
                this.getView().byId("POInput").setEditable(true);
                if (this.oCompAttachProj) {
                    delete this.oCompAttachProj
                }
            } else {
                if (i.severity === "error" && i.target) {
                    this._handleErrorResponse(i)
                }
                if (i.code === "MBND_CLOUD/002") {
                    var l = [];
                    var n = {};
                    n.MessageText = i.message;
                    n.Severity = i.severity;
                    var u = i.target.split(";");
                    n.valueState = u[u.length - 1] + "_valueState";
                    n.valueStateText = u[u.length - 1] + "_valueStateText";
                    n.DocumentItem = u[u.length - 2];
                    l.push(n);
                    for (var d = 0; d < i.details.length; d++) {
                        n = {};
                        n.MessageText = i.details[d].message;
                        n.Severity = i.details[d].severity;
                        var u = i.details[d].target.split(";");
                        n.valueState = u[u.length - 1] + "_valueState";
                        n.valueStateText = u[u.length - 1] + "_valueStateText";
                        n.DocumentItem = u[u.length - 2];
                        l.push(n)
                    }
                    this._SetStatus(l, this.getView().getModel("oFrontend"), e)
                }
                this.getView().getModel("message").fireMessageChange()
            }
        },
        _openSuccessDialog: function (e) {
            var t, a;
            a = {
                DialogState: "Success",
                DialogTitle: this.getResourceBundle().getText("TITLE_SUCC_POST"),
                CopilotEnabled: this._aCopilotChats && this._aCopilotChats.length > 0,
                CopilotActive: this.getView().getModel("oFrontend").getProperty("/CopilotActive")
            };
            if (e.Header2Refs && e.Header2Refs.results.length > 0) {
                this._createDataForDocuments(e.Header2Refs.results, a);
                t = new sap.ui.model.json.JSONModel(a);
                this._oPostDialog.setModel(t);
                var r = this.getView().byId("POInput");
                var i = function (e) {
                    jQuery.sap.delayedCall(200, this, function () {
                        r.focus();
                        r.selectText(0, 99)
                    });
                    e.getSource().detachAfterClose(i)
                };
                this._oPostDialog.attachAfterClose(i);
                this._oPostDialog.open()
            }
        },
        _createDataForDocuments: function (e, t) {
            var a = [],
                r = [];
            for (var i = 0; i < e.length; i++) {
                e[i].CopilotActive = t.CopilotActive;
                if (e[i].DocCrtSuccess === "X") {
                    e[i].LinkActive = !!(this._isIntentSupported[e[i].SemanticObject + "Display"] && e[i].SemanticObject && e[i].SemanticAction && e[i].SemanticParam);
                    e[i].CopilotEnabled = t.CopilotEnabled && !!(e[i].ServiceName && e[i].NaviTarget && e[i].NaviPath);
                    a.push(e[i])
                } else {
                    r.push(e[i])
                }
            }
            if (r.length > 0) {
                t.DialogState = "Warning";
                t.DialogTitle = this.getResourceBundle().getText("TITLE_WARN_POST")
            }
            t.SuccessMessageHeadline = this.getResourceBundle().getText("SUCC_POST_TEXT", a.length);
            t.FailedMessageHeadline = this.getResourceBundle().getText("FAIL_POST_TEXT", r.length);
            t.FailedMessageHeadlineVisible = r.length > 0;
            t.SuccessDocuments = a;
            t.FailedDocuments = r
        },
        _SetStatus: function (e, t, a) {
            var r = {};
            if (!t) {
                r = this.getView().getModel("oFrontend")
            } else {
                r = t
            }
            var i = r.getProperty("/Items");
            for (var s = 0; s < e.length; s++) {
                for (var o = 0; o < i.length; o++) {
                    if (e[s].DocumentItem == i[o].DocumentItem) {
                        if (e[s].valueState == "DocumentItem_valueState") {
                            i[o].Selected = false;
                            i[o].SelectEnabled = false;
                            i[o].ItemEnabled = false;
                            i[o].SplitEnabled = false
                        } else {
                            i[o][e[s].valueState] = sap.ui.core.ValueState.Warning;
                            i[o][e[s].valueStateText] = e[s].MessageText;
                            for (var l = 0; l < a.Header2Items.results.length; l++) {
                                if (i[o].DocumentItem == a.Header2Items.results[l].DeliveryDocumentItem) {
                                    i[o].Unit = a.Header2Items.results[l].UnitOfMeasure;
                                    i[o].OpenQuantity = a.Header2Items.results[l].OpenQuantity;
                                    if (i[o].ItemCounter == 0) {
                                        i[o].DeliveredQuantity_input = a.Header2Items.results[l].QuantityInEntryUnit
                                    } else {
                                        i[o].DeliveredQuantity_input = 0
                                    }
                                    i[o].DeliveredUnit_input = a.Header2Items.results[l].EntryUnit
                                }
                            }
                        }
                    }
                }
            }
            r.setProperty("/Items", i)
        },
        handlePostCloseButton: function (e) {
            if (this._SourceOfGR === this._SourceOfGRIsNoReference && this.getView().getModel("oFrontend").getData().Items.length === 0) {
                this._getInitialItem(0)
            }
            var t = sap.ui.core.routing.HashChanger.getInstance();
            t.replaceHash("");
            this._oPostDialog.close()
        },
        handleFactSheetLinkPress: function (e) {
            var t = e.getSource().getCustomData();
            var a = t[0].getValue();
            var r = t[1].getValue();
            var i = t[2].getValue();
            var s = {};
            if (i) {
                var o = i.split("&");
                for (var l in o) {
                    var n = o[l].split("=");
                    s[n[0]] = n[1]
                }
            }
            this._removeAbortHashBeforeNavigation();
            var u = this._getSuccessPostDialogState(this._oPostDialog.getModel().getData());
            this._oNavigationService.navigate(a, r, s, u)
        },
        handleDisplayMaterialLinkPress: function (e) {
            var t = e.getSource().data("Material");
            this._nav2Material(t)
        },
        handleDisplaySupplierLinkPress: function (e) {
            var t = this.getView().getModel("oFrontend");
            this._nav2Supplier(t.getProperty("/Lifnr"))
        },
        handleDisplayPurchaseOrderLinkPress: function (e) {
            var t = this.getView().getModel("oFrontend");
            this._nav2PurchaseOrderOrInboundDelivery(t.getProperty("/Ebeln"))
        },
        handleScanSuccess: function (e) {
            if (e.getParameters().cancelled === false && e.getParameters().text !== "" && jQuery.isNumeric(e.getParameters().text) === true) {
                var t = this.getView().byId("POInput");
                t.setValue(e.getParameters().text);
                t.fireChangeEvent(e.getParameters().text)
            }
        },
        handleInputChangeEvent: function (e) {
            var t = e.getParameters().value.trim();
            var a = this;
            var r = a.getResourceBundle();
            var i = true;
            var s = this.getView().getModel("oFrontend").getProperty("/Ebeln_possibleLength");
            var o = JSON.stringify(this._getInnerAppState());
            if (o && this._initialDataLoaded && this._initialDataLoaded != null) {
                var l = JSON.stringify(this._getInnerAppState(this._initialDataLoaded));
                if (l !== o) {
                    var i = false;
                    sap.m.MessageBox.confirm(r.getText("MESSAGE_DATA_LOSS"), {
                        icon: sap.m.MessageBox.Icon.QUESTION,
                        title: r.getText("MESSAGE_DATA_LOSS_TITLE"),
                        onClose: n,
                        styleClass: "sapUiSizeCompact",
                        initialFocus: sap.m.MessageBox.Action.CANCEL
                    })
                }
            }
            if (i === true) {
                if (s.indexOf(t.length) !== -1 && jQuery.isNumeric(t) === true || this.getView().byId("POInput").getEditable() === false) {
                    this._readPO(t)
                } else {
                    this._toggleBusy(false);
                    this.getView().byId("POInput").fireSuggest({
                        suggestValue: t
                    })
                }
                if (this.oCompAttachProj) {
                    delete this.oCompAttachProj
                }
            }

            function n(e) {
                if (e === "OK") {
                    if (a.oCompAttachProj) {
                        delete a.oCompAttachProj
                    }
                    if (s.indexOf(t.length) !== -1 && jQuery.isNumeric(t) === true) {
                        a._readPO(t)
                    } else {
                        a._toggleBusy(false);
                        a.getView().byId("POInput").fireSuggest({
                            suggestValue: t
                        })
                    }
                } else {
                    var r = a.getView().byId("POInput");
                    r.setValue(a._initialDataLoaded.Ebeln)
                }
            }
        },
        handleInputBatchChangeEvent: function (e) {
            var t = e.getParameters().value.trim();
            var a = this;
            var r = a.getResourceBundle();
            var i;
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                i = this.getView().getModel("oItem").getData()
            } else {
                var s = this.getView().getModel("oFrontend");
                var o = this._getSelectedItemInModel(e);
                i = s.getProperty("/Items/" + o)
            }
            this._readBatch(t, o, i)
        },
        _readBatch: function (e, t, a) {
            var r = [];
            var i = "";
            if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                r.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, a.Material))
            } else {
                r.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, a.Material_Input))
            }
            r.push(new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.EQ, a.Plant));
            r.push(new sap.ui.model.Filter("StorageLocation", sap.ui.model.FilterOperator.EQ, a.StorageLocation));
            r.push(new sap.ui.model.Filter("DeliveryDocumentItem", sap.ui.model.FilterOperator.EQ, a.DocumentItem));
            r.push(new sap.ui.model.Filter("Batch", sap.ui.model.FilterOperator.EQ, a.Batch));
            r.push(new sap.ui.model.Filter("InboundDelivery", sap.ui.model.FilterOperator.EQ, this.getView().getModel("oFrontend").getProperty("/Ebeln")));
            r.push(new sap.ui.model.Filter("SourceOfGR", sap.ui.model.FilterOperator.EQ, this._SourceOfGR));
            var s = this._getMovementType(a);
            r.push(new sap.ui.model.Filter("GoodsMovementType", sap.ui.model.FilterOperator.EQ, s));
            this.getView().getModel("oData").read("/MaterialBatchHelps", {
                filters: r,
                success: jQuery.proxy(this._successMyBatchLoad, this, e, t, a),
                error: jQuery.proxy(this._handleOdataError, this)
            })
        },
        _nav2Material: function (e) {
            var t = {
                Material: e
            };
            var a = sap.ui.core.routing.HashChanger.getInstance();
            a.setHash("");
            this._oNavigationService.navigate("Material", "displayFactSheet", t, this._getInnerAppState())
        },
        _nav2Supplier: function (e) {
            var t = {
                Supplier: e
            };
            var a = sap.ui.core.routing.HashChanger.getInstance();
            a.setHash("");
            this._oNavigationService.navigate("Supplier", "displayFactSheet", t, this._getInnerAppState())
        },
        _nav2PurchaseOrderOrInboundDelivery: function (e) {
            var t = "";
            var a = {};
            if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                t = "PurchaseOrder";
                a = {
                    PurchaseOrder: e
                }
            } else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                t = "ProductionOrder";
                a = {
                    ProductionOrder: e
                }
            } else {
                t = "InboundDelivery";
                a = {
                    InboundDelivery: e
                }
            }
            var r = sap.ui.core.routing.HashChanger.getInstance();
            r.setHash("");
            this._oNavigationService.navigate(t, "displayFactSheet", a, this._getInnerAppState())
        },
        _readPO: function (e, t) {
            var a = this;
            var r = [];
            if (e) {
                if (sap.ui.getCore().getMessageManager().getMessageModel().getData().length > 0) {
                    sap.ui.getCore().getMessageManager().removeAllMessages()
                }
                if (this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
                    if (e.length === 9) {
                        e = "000" + e
                    } else {
                        e = "00" + e
                    }
                }
                if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                    e = "00" + e
                }
                r.push(new sap.ui.model.Filter("SourceOfGR", sap.ui.model.FilterOperator.EQ, this._SourceOfGR));
                r.push(new sap.ui.model.Filter("InboundDelivery", sap.ui.model.FilterOperator.EQ, e));
                this._toggleBusy(true);
                this.getOwnerComponent().getModel("oData").read("/GR4PO_DL_Headers", {
                    urlParameters: {
                        $expand: "Header2Items,Header2Items/Item2StockTypes,Header2Items/Item2SubItems"
                    },
                    filters: r,
                    success: jQuery.proxy(this._successPOLoad, this, t),
                    error: jQuery.proxy(this._handleOdataError, this)
                })
            }
        },
        _successMyBatchLoad: function (e, t, a, r, i) {
            var s = false;
            var o = i.headers["sap-message"];
            var l;
            if (o) {
                var n = JSON.parse(o);
                if (n.code && n.severity === "error") {
                    s = true
                }
            }
            if (r.results.length !== 1 || e === "") {
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                    this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate", "");
                    this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None);
                    this.getView().getModel("oItem").setProperty("/ManufactureDate", "");
                    this.getView().getModel("oItem").setProperty("/ManufactureDate_valueState", sap.ui.core.ValueState.None);
                    this.getView().getModel("oItem").setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(this.getView().getModel("oItem").getData()));
                    if (s === true && e !== "") {
                        this.getView().getModel("oItem").setProperty("/Batch_valueState", sap.ui.core.ValueState.Error)
                    } else {
                        this.getView().getModel("oItem").setProperty("/Batch_valueState", sap.ui.core.ValueState.None)
                    }
                    this._setValueStateMandatoryFields(this.getView().getModel("oItem").getData());
                    this.getView().getModel("oItem").updateBindings();
                    l = this._ItemConsistent(this.getView().getModel("oItem").getData());
                    if (l === true) {
                        this.getView().getModel("oItem").setProperty("/SelectEnabled", l);
                        this.getView().getModel("oItem").setProperty("/Selected", l)
                    }
                } else {
                    var u = this.getView().getModel("oFrontend");
                    u.setProperty("/Items/" + t + "/ShelfLifeExpirationDate", "");
                    u.setProperty("/Items/" + t + "/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None);
                    u.setProperty("/Items/" + t + "/ManufactureDate", "");
                    u.setProperty("/Items/" + t + "/ManufactureDate_valueState", sap.ui.core.ValueState.None);
                    if (s === true && e !== "") {
                        u.setProperty("/Items/" + t + "/Batch_valueState", sap.ui.core.ValueState.Error)
                    } else {
                        u.setProperty("/Items/" + t + "/Batch_valueState", sap.ui.core.ValueState.None)
                    }
                    this._setValueStateMandatoryFields(u.getProperty("/Items/" + t));
                    l = this._ItemConsistent(u.getProperty("/Items/" + t));
                    if (l === true) {
                        u.setProperty("/Items/" + t + "/SelectEnabled", l);
                        u.setProperty("/Items/" + t + "/Selected", l)
                    }
                    this._setSelectEnabled(u.getProperty("/Items/" + t));
                    this._controlSelectAllAndPostButton();
                    this._updateHiglightProperty()
                }
                s = true
            } else {
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                    this.getView().getModel("oItem").setProperty("/Batch", r.results[0].Batch);
                    this.getView().getModel("oItem").setProperty("/Batch_valueState", sap.ui.core.ValueState.None);
                    this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate", this._oDateFormat.format(r.results[0].ShelfLifeExpirationDate));
                    this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None);
                    this.getView().getModel("oItem").setProperty("/ManufactureDate", this._oDateFormat.format(r.results[0].ManufactureDate));
                    this.getView().getModel("oItem").setProperty("/ManufactureDate_valueState", sap.ui.core.ValueState.None);
                    this.getView().getModel("oItem").setProperty("/ApplyButtonEnabled", this._applyButtonEnabled(this.getView().getModel("oItem").getData()));
                    this._setValueStateMandatoryFields(this.getView().getModel("oItem").getData());
                    this.getView().getModel("oItem").updateBindings();
                    l = this._ItemConsistent(this.getView().getModel("oItem").getData());
                    if (l === true) {
                        this.getView().getModel("oItem").setProperty("/SelectEnabled", l);
                        this.getView().getModel("oItem").setProperty("/Selected", l)
                    }
                } else {
                    var u = this.getView().getModel("oFrontend");
                    u.setProperty("/Items/" + t + "/Batch", r.results[0].Batch);
                    u.setProperty("/Items/" + t + "/Batch_valueState", sap.ui.core.ValueState.None);
                    u.setProperty("/Items/" + t + "/ShelfLifeExpirationDate", this._oDateFormat.format(r.results[0].ShelfLifeExpirationDate));
                    u.setProperty("/Items/" + t + "/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None);
                    u.setProperty("/Items/" + t + "/ManufactureDate", this._oDateFormat.format(r.results[0].ManufactureDate));
                    u.setProperty("/Items/" + t + "/ManufactureDate_valueState", sap.ui.core.ValueState.None);
                    this._setValueStateMandatoryFields(u.getProperty("/Items/" + t));
                    l = this._ItemConsistent(u.getProperty("/Items/" + t));
                    if (l === true) {
                        u.setProperty("/Items/" + t + "/SelectEnabled", l);
                        u.setProperty("/Items/" + t + "/Selected", l)
                    }
                    this._setSelectEnabled(u.getProperty("/Items/" + t));
                    this._controlSelectAllAndPostButton();
                    this._updateHiglightProperty()
                }
                return
            }
        },
        _successPOLoad: function (e, t, a) {
            var r = false;
            var i;
            var s = "";
            var l = a.headers["sap-message"];
            if (l) {
                var n = JSON.parse(l);
                if (n.code && n.severity === "error") {
                    r = true
                }
            }
            if (t.results.length === 0) {
                r = true
            }
            var u = this.getView().getModel("oFrontend");
            if (r !== false) {
                u.setProperty("/PO_Input_valueState", sap.ui.core.ValueState.Error)
            } else {
                var d = false;
                u.setProperty("/PO_Input_valueState", sap.ui.core.ValueState.None);
                var c = {};
                c.maxFractionDigits = "3";
                c.visible = true;
                c.personalizationEnabled = true;
                c.SupplierDisplayActive = this._isIntentSupported.SupplierDisplay;
                if (t.results[0].PurchasingDocumentCategory === "L") {
                    c.PurchaseOrderDisplayActive = false
                } else {
                    c.PurchaseOrderDisplayActive = this._isIntentSupported.PurchaseOrderDisplay
                }
                c.CreateBatchActive = this._isIntentSupported.BatchCreate;
                c.MaterialDisplayActive = this._isIntentSupported.MaterialDisplay;
                c.VersionForPrintingSlip = this._aVersionForPrintingSlip;
                c.VersionForPrintingSlipAppSetting = this._aVersionForPrintingSlipAppSetting;
                if (this._oPersonalizedDataContainer.VersionForPrintingSlip !== "none") {
                    c.VersionForPrintingSlip_selectedKey = this._oPersonalizedDataContainer.VersionForPrintingSlip
                } else if (t.results[0].VersionForPrintingSlip) {
                    c.VersionForPrintingSlip_selectedKey = t.results[0].VersionForPrintingSlip
                } else {
                    c.VersionForPrintingSlip_selectedKey = "0"
                }
                c.Lifname = t.results[0].VendorName;
                c.Lifnr = t.results[0].Vendor;
                c.Ebeln = t.results[0].InboundDelivery;
                c.DocumentDate = t.results[0].DocumentDate;
                c.PostingDate = t.results[0].PostingDate;
                c.DocumentDate_valueState = sap.ui.core.ValueState.None;
                c.PostingDate_valueState = sap.ui.core.ValueState.None;
                c.DeliveryDocumentByVendor = "";
                c.MaterialDocumentHeaderText = t.results[0].MaterialDocumentHeaderText;
                c.BillOfLading = "";
                c.PurchasingDocumentType = t.results[0].PurchasingDocumentType;
                c.PurchasingDocumentTypeName = t.results[0].PurchasingDocumentTypeName;
                c.SupplyingPlant = t.results[0].SupplyingPlant;
                c.SupplyingPlantName = t.results[0].SupplyingPlantName;
                c.OrderType = t.results[0].OrderType;
                c.OrderTypeName = t.results[0].OrderTypeName;
                c.ColumnAccountAssignmentVisible = false;
                c.ColumnSplitVisible = false;
                c.ColumnPlantVisible = false;
                c.ColumnStorageBinVisible = false;
                c.ColumnStorageLocationVisible = false;
                c.ColumnStockTypeVisible = false;
                c.ColumnBatchVisible = false;
                c.ColumnManufactureDateVisible = false;
                c.ColumnShelfLifeExpirationDateVisible = false;
                c.ColumnScaleVisible = false;
                c.ColumnNonVltdGRBlockedStockQty = false;
                c.ColumnIsReturnsItemVisible = false;
                c.HasSubcontractingItem = false;
                c.Items = [];
                if (c.DocumentDate == null) {
                    c.DocumentDate = this._oDateFormat.format(new Date)
                } else {
                    c.DocumentDate = this._oDateFormat.format(c.DocumentDate)
                }
                if (c.PostingDate == null) {
                    c.PostingDate = this._oDateFormat.format(new Date)
                } else {
                    c.PostingDate = this._oDateFormat.format(c.PostingDate)
                }
                for (var p = 0; p < t.results[0].Header2Items.results.length; p++) {
                    if (s !== t.results[0].Header2Items.results[p].DeliveryDocumentItem) {
                        s = t.results[0].Header2Items.results[p].DeliveryDocumentItem;
                        var g = [];
                        g[0] = {};
                        var m = {};
                        m.highlight = sap.ui.core.MessageType.None;
                        m.ItemCounter = 0;
                        m.Selected = false;
                        if (t.results[0].Header2Items.results[p].OpenQuantity >= 0) {
                            m.SelectEnabled = true
                        } else {
                            m.SelectEnabled = false
                        }
                        m.OpenQuantity_valueState = sap.ui.core.ValueState.None;
                        m.OpenQuantity_valueStateText = "";
                        m.SplitEnabled = t.results[0].Header2Items.results[p].IsBatchManaged;
                        m.DocumentItem = t.results[0].Header2Items.results[p].DeliveryDocumentItem;
                        m.DocumentItem_int = parseInt(t.results[0].Header2Items.results[p].DeliveryDocumentItem);
                        m.Material = t.results[0].Header2Items.results[p].Material;
                        m.MaterialName = t.results[0].Header2Items.results[p].MaterialName;
                        m.DocumentItemText = t.results[0].Header2Items.results[p].DocumentItemText;
                        m.PurchaseOrderItemText = t.results[0].Header2Items.results[p].PurchaseOrderItemText;
                        m.WarehouseStorageBin = t.results[0].Header2Items.results[p].WarehouseStorageBin;
                        if (m.WarehouseStorageBin) {
                            c.ColumnStorageBinVisible = true
                        }
                        if (m.PurchaseOrderItemText !== "") {
                            m.MaterialText = m.PurchaseOrderItemText
                        } else {
                            m.MaterialText = m.MaterialName
                        }
                        if (this._SourceOfGR === this._SourceOfGRIsProductionOrder && c.Objectheader !== t.results[0].Header2Items.results[0].Material) {
                            c.Objectheader = m.MaterialText;
                            c.Objectheadertext = m.Material
                        }
                        if (this._oPersonalizedDataContainer.PresetDocumentItemTextFromPO === true) {
                            m.DocumentItemText = m.PurchaseOrderItemText
                        }
                        if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                            m.DeliveredQuantityEditable = true;
                            m.DeliveredUnitEditable = true;
                            m.StockTypeNOREFEnabled = true
                        }
                        m.Unit = t.results[0].Header2Items.results[p].UnitOfMeasure;
                        m.OpenQuantity = t.results[0].Header2Items.results[p].OpenQuantity;
                        m.OpenQuantityIgnore = t.results[0].Header2Items.results[p].OpenQtyIgnore;
                        m.OpenQuantity_number = parseFloat(t.results[0].Header2Items.results[p].OpenQuantity);
                        m.GoodsReceiptQty = t.results[0].Header2Items.results[p].GoodsReceiptQty;
                        m.GoodsReceiptQty_number = parseFloat(t.results[0].Header2Items.results[p].GoodsReceiptQty);
                        m.OrderedQuantity = t.results[0].Header2Items.results[p].OrderedQuantity;
                        m.OrderedQuantity_number = parseFloat(t.results[0].Header2Items.results[p].OrderedQuantity);
                        if (t.results[0].PurchasingDocumentCategory === "L") {
                            m.ChartVisible = false;
                            m.GRQuantity = m.GoodsReceiptQty;
                            m.GRQuantity_number = m.GoodsReceiptQty_number
                        } else {
                            m.ChartVisible = true;
                            m.GRQuantity = m.OrderedQuantity - m.OpenQuantity;
                            m.GRQuantity_number = m.OrderedQuantity_number - m.OpenQuantity_number
                        }
                        m.OrderedQuantityUnit = t.results[0].Header2Items.results[p].OrderedQuantityUnit;
                        m.NonVltdGRBlockedStockQty = t.results[0].Header2Items.results[p].NonVltdGRBlockedStockQty;
                        m.NonVltdGRBlockedStockQty_number = parseFloat(t.results[0].Header2Items.results[p].NonVltdGRBlockedStockQty);
                        if (m.NonVltdGRBlockedStockQty_number > 0) {
                            c.ColumnNonVltdGRBlockedStockQty = true
                        }
                        if (t.results[0].Header2Items.results[p].DeliveryCompleted === "") {
                            m.DeliveryCompleted = false
                        } else {
                            m.DeliveryCompleted = true
                        }
                        if (m.OpenQuantityIgnore || parseFloat(m.OpenQuantity) > 0 || parseFloat(m.NonVltdGRBlockedStockQty)) {
                            m.ItemEnabled = true;
                            m.MaterialVisible = true;
                            m.DeliveredQuantityEditable = m.OpenQuantityIgnore ? false : m.DeliveredQuantityEditable;
                            m.DeliveredUnitEditable = m.OpenQuantityIgnore ? false : m.DeliveredUnitEditable;
                            m.SplitEnabled = m.OpenQuantityIgnore ? false : t.results[0].Header2Items.results[p].IsBatchManaged
                        } else {
                            m.ItemEnabled = false;
                            m.SplitEnabled = t.results[0].Header2Items.results[p].IsBatchManaged;
                            m.MaterialVisible = true
                        }
                        m.SplitButtonIcon = "sap-icon://add";
                        if (this._oPersonalizedDataContainer.deliveredQuantityDefault2open === true) {
                            m.DeliveredQuantity_input = parseFloat(t.results[0].Header2Items.results[p].QuantityInEntryUnit)
                        } else {
                            m.DeliveredQuantity_input = ""
                        }
                        m.DeliveredQuantity_valueState = sap.ui.core.ValueState.None;
                        m.DeliveredQuantity_valueStateText = "";
                        m.DeliveredUnit_input = t.results[0].Header2Items.results[p].EntryUnit;
                        m.DeliveredUnit_input_valueState = sap.ui.core.ValueState.None;
                        m.DeliveredUnit_input_valueStateText = "";
                        if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                            m.Plant_input = t.results[0].Header2Items.results[p].PlannedPlantName;
                            m.Plant = t.results[0].Header2Items.results[p].PlannedPlant;
                            m.LABEL_STACKED_BAR = this.getResourceBundle().getText("LABEL_STACKED_BAR_PROD")
                        } else {
                            m.Plant_input = t.results[0].Header2Items.results[p].PlantName;
                            m.Plant = t.results[0].Header2Items.results[p].Plant;
                            if (this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
                                m.LABEL_STACKED_BAR = this.getResourceBundle().getText("LABEL_STACKED_BAR_INBD")
                            } else {
                                m.LABEL_STACKED_BAR = this.getResourceBundle().getText("LABEL_STACKED_BAR_PO")
                            }
                        }
                        if (this._SourceOfGR === this._SourceOfGRIsProductionOrder && m.Plant === "A600") {
                            c.ColumnScaleVisible = true
                        }
                        m.Country = t.results[0].Header2Items.results[p].Country;
                        m.WMLInScope = t.results[0].Header2Items.results[p].WMLInScope;
                        m.Batch = t.results[0].Header2Items.results[p].Batch;
                        m.SupplierBatch = t.results[0].Header2Items.results[p].SupplierBatch;
                        m.ShelfLifeExpirationDate = t.results[0].Header2Items.results[p].ShelfLifeExpirationDate;
                        m.ManufactureDate = t.results[0].Header2Items.results[p].ManufactureDate;
                        m.IsReturnsItem = t.results[0].Header2Items.results[p].IsReturnsItem;
                        if (m.IsReturnsItem === true) {
                            c.ColumnIsReturnsItemVisible = true
                        }
                        m.IsConsumptionMovement = t.results[0].Header2Items.results[p].IsConsumptionMovement;
                        m.AcctAssignmentCategory = t.results[0].Header2Items.results[p].AcctAssignmentCategory;
                        m.AcctAssignmentCategoryName = t.results[0].Header2Items.results[p].AcctAssignmentCategoryName;
                        m.HasMultipleAccountAssignment = t.results[0].Header2Items.results[p].HasMultipleAccountAssignment;
                        m.MultipleAcctAssgmtDistribution = t.results[0].Header2Items.results[p].MultipleAcctAssgmtDistribution;
                        m.MultipleAcctAssgmtDistrName = t.results[0].Header2Items.results[p].MultipleAcctAssgmtDistrName;
                        m.PartialInvoiceDistribution = t.results[0].Header2Items.results[p].PartialInvoiceDistribution;
                        m.PartialInvoiceDistributionName = t.results[0].Header2Items.results[p].PartialInvoiceDistributionName;
                        if (m.IsConsumptionMovement === false) {
                            m.AccountAssignmentVisible = false;
                            m.PlantVisible = true;
                            m.StorageLocationVisible = true;
                            m.StockTypeVisible = true;
                            c.ColumnSplitVisible = true;
                            c.ColumnPlantVisible = true;
                            c.ColumnStorageLocationVisible = true;
                            c.ColumnStockTypeVisible = true
                        } else {
                            m.SplitEnabled = false;
                            m.PlantVisible = false;
                            m.StorageLocationVisible = false;
                            m.StockTypeVisible = false
                        }
                        if (m.AcctAssignmentCategory !== "") {
                            c.ColumnAccountAssignmentVisible = true;
                            m.AccountAssignmentVisible = true;
                            if (t.results[0].Header2Items.results[p].GoodsReceiptIsNonValuated === true) {
                                m.AccountAssignmentChartVisible = false;
                                m.MultipleAcctAssignmentNoValuated = this.getResourceBundle().getText("TEXT_MAA_NOVALUATED")
                            } else {
                                m.AccountAssignmentChartVisible = true
                            }
                        }
                        m.Project = t.results[0].Header2Items.results[p].Project;
                        m.ProjectDescription = t.results[0].Header2Items.results[p].ProjectDescription;
                        m.InventorySpecialStockType = t.results[0].Header2Items.results[p].InventorySpecialStockType;
                        m.InventorySpecialStockTypeName = t.results[0].Header2Items.results[p].InventorySpecialStockTypeName;
                        m.Lifname = t.results[0].VendorName;
                        m.Lifnr = t.results[0].Vendor;
                        m.SalesOrder = t.results[0].Header2Items.results[p].SalesOrder;
                        m.SalesOrderItem = t.results[0].Header2Items.results[p].SalesOrderItem;
                        m.OrderID = t.results[0].Header2Items.results[p].OrderID;
                        m.StorageLocation = t.results[0].Header2Items.results[p].StorageLocation;
                        m.StorageLocation_input = t.results[0].Header2Items.results[p].StorageLocationName;
                        m.GoodsMovementReasonCode_selectedKey = t.results[0].Header2Items.results[p].GoodsMovementReasonCode;
                        if (m.AcctAssignmentCategory === "") {
                            if (m.StorageLocation === "" && m.DeliveredQuantity_input > 0) {
                                m.StorageLocation_valueState = sap.ui.core.ValueState.Error;
                                m.highlight = sap.ui.core.MessageType.Error;
                                m.StorageLocation_valueStateText = this.getResourceBundle().getText("STORAGELOCATION_VALUE_STATE_TEXT")
                            } else {
                                m.StorageLocation_valueState = sap.ui.core.ValueState.None;
                                m.StorageLocation_valueStateText = ""
                            }
                        } else {
                            m.StorageLocation_valueState = sap.ui.core.ValueState.None;
                            m.StorageLocation_valueStateText = ""
                        }
                        if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                            m.StorageLocationEditable = true;
                            m.Plant_input_editable = false;
                            m.SalesOrder_editable = false
                        } else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                            m.StorageLocationEditable = true;
                            m.Plant_input_editable = false;
                            m.SalesOrder_editable = false
                        } else if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                            m.StorageLocationEditable = true;
                            m.Plant_input_editable = false;
                            m.SalesOrder_editable = false
                        } else {
                            m.Plant_input_editable = false;
                            m.SalesOrder_editable = false;
                            if (m.StorageLocation === "") {
                                m.StorageLocationEditable = true
                            } else {
                                m.StorageLocationEditable = false
                            }
                        }
                        if (t.results[0].Header2Items.results[p].ShelfLifeExpirationDate) {
                            m.ShelfLifeExpirationDate = this._oDateFormat.format(t.results[0].Header2Items.results[p].ShelfLifeExpirationDate)
                        } else {
                            m.ShelfLifeExpirationDate = ""
                        }
                        m.ShelfLifeExpirationDateMinDate = new Date;
                        if (t.results[0].Header2Items.results[p].ManufactureDate) {
                            m.ManufactureDate = this._oDateFormat.format(t.results[0].Header2Items.results[p].ManufactureDate)
                        } else {
                            m.ManufactureDate = ""
                        }
                        var S = new Array;
                        var f = false;
                        for (var _ = 0; _ < t.results[0].Header2Items.results[p].Item2StockTypes.results.length; _++) {
                            if (t.results[0].Header2Items.results[p].Item2StockTypes.results[_].StockType === "") {
                                S.push({
                                    key: " ",
                                    text: t.results[0].Header2Items.results[p].Item2StockTypes.results[_].StockTypeName,
                                    ControlOfBatchTableField: t.results[0].Header2Items.results[p].Item2StockTypes.results[_].ControlOfBatchTableField,
                                    ControlOfReasonCodeTableField: t.results[0].Header2Items.results[p].Item2StockTypes.results[_].ControlOfReasonCodeTableField,
                                    ControlOfExpirationDate: t.results[0].Header2Items.results[p].Item2StockTypes.results[_].ControlOfExpirationDate,
                                    ControlOfManufactureDate: t.results[0].Header2Items.results[p].Item2StockTypes.results[_].ControlOfManufactureDate,
                                    StorLocAutoCreationIsAllowed: t.results[0].Header2Items.results[p].Item2StockTypes.results[_].StorLocAutoCreationIsAllowed
                                })
                            } else {
                                S.push({
                                    key: t.results[0].Header2Items.results[p].Item2StockTypes.results[_].StockType,
                                    text: t.results[0].Header2Items.results[p].Item2StockTypes.results[_].StockTypeName,
                                    ControlOfBatchTableField: t.results[0].Header2Items.results[p].Item2StockTypes.results[_].ControlOfBatchTableField,
                                    ControlOfReasonCodeTableField: t.results[0].Header2Items.results[p].Item2StockTypes.results[_].ControlOfReasonCodeTableField,
                                    ControlOfExpirationDate: t.results[0].Header2Items.results[p].Item2StockTypes.results[_].ControlOfExpirationDate,
                                    ControlOfManufactureDate: t.results[0].Header2Items.results[p].Item2StockTypes.results[_].ControlOfManufactureDate,
                                    StorLocAutoCreationIsAllowed: t.results[0].Header2Items.results[p].Item2StockTypes.results[_].StorLocAutoCreationIsAllowed
                                })
                            }
                            if (t.results[0].Header2Items.results[p].Item2StockTypes.results[_].StockType === t.results[0].Header2Items.results[p].StockType) {
                                f = true;
                                this._evaluateFieldControl("Batch", t.results[0].Header2Items.results[p].Item2StockTypes.results[_].ControlOfBatchTableField, m);
                                this._evaluateFieldControl("GoodsMovementReasonCode", t.results[0].Header2Items.results[p].Item2StockTypes.results[_].ControlOfReasonCodeTableField, m);
                                this._evaluateFieldControl("ShelfLifeExpirationDate", t.results[0].Header2Items.results[p].Item2StockTypes.results[_].ControlOfExpirationDate, m);
                                this._evaluateFieldControl("ManufactureDate", t.results[0].Header2Items.results[p].Item2StockTypes.results[_].ControlOfManufactureDate, m)
                            }
                        }
                        m.StockType_input = S;
                        if (t.results[0].Header2Items.results[p].StockTypeName !== "" && f === true) {
                            m.StockType_selectedKey = t.results[0].Header2Items.results[p].StockType;
                            if (m.StockType_selectedKey === "") {
                                m.StockType_selectedKey = " "
                            }
                        } else {
                            if (S.length > 0) {
                                m.StockType_selectedKey = S[0].key;
                                this._evaluateFieldControl("Batch", S[0].ControlOfBatchTableField, m);
                                this._evaluateFieldControl("GoodsMovementReasonCode", S[0].ControlOfReasonCodeTableField, m);
                                this._evaluateFieldControl("ShelfLifeExpirationDate", S[0].ControlOfExpirationDate, m);
                                this._evaluateFieldControl("ManufactureDate", S[0].ControlOfManufactureDate, m)
                            } else {
                                m.StockType_selectedKey = " ";
                                d = true
                            }
                        }
                        if (m.StockType_input.length > 1) {
                            m.StockTypeEnabled = true
                        } else {
                            m.StockTypeEnabled = false
                        }
                        if (m.BatchVisible === true) {
                            c.ColumnBatchVisible = true
                        }
                        if (m.ManufactureDateVisible === true) {
                            c.ColumnManufactureDateVisible = true
                        }
                        if (m.ShelfLifeExpirationDateVisible === true) {
                            c.ColumnShelfLifeExpirationDateVisible = true
                        }
                        this._setValueStateMandatoryFields(m);
                        m.DetailHeaderText = this.getResourceBundle().getText("DETAILSCREEN_TITLE2") + " " + m.MaterialName + " (" + m.Material + ")";
                        if (this._aExtendedFields && this._aExtendedFields.length > 0) {
                            for (var I = 0; I < this._aExtendedFields.length; I++) {
                                if (this._isExtendedField(this._aExtendedFields[I].name) === true) {
                                    m[this._aExtendedFields[I].name] = t.results[0].Header2Items.results[p][this._aExtendedFields[I].name]
                                }
                            }
                        }
                        m.AccountAssignments = [];
                        m.AccountAssignmentsColumnAssetNumberVisible = false;
                        m.AccountAssignmentsColumnSubAssetNumberVisible = false;
                        m.AccountAssignmentsColumnGLAccountVisible = false;
                        m.AccountAssignmentsColumnGoodsRecipientVisible = false;
                        m.AccountAssignmentsColumnUnloadingPointVisible = false;
                        m.AccountAssignmentsColumnFunctionalAreaVisible = false;
                        m.AccountAssignmentsColumnProfitCenterVisible = false;
                        m.AccountAssignmentsColumnCostCenterVisible = false;
                        m.AccountAssignmentsColumnProjectVisible = false;
                        m.AccountAssignmentsColumnSalesOrderVisible = false;
                        m.AccountAssignmentsColumnOrderIDVisible = false;
                        if (t.results[0].Header2Items.results[p].Item2SubItems && t.results[0].Header2Items.results[p].Item2SubItems.results && t.results[0].Header2Items.results[p].Item2SubItems.results.length > 0) {
                            m = h.createSubItemData(m, t.results[0].Header2Items.results[p].Item2SubItems.results, this._isIntentSupported.MaterialDisplay);
                            c.HasSubcontractingItem = true
                        } else {
                            m.ItemHasComponent = false;
                            m.ItemComponentVisible = false
                        }
                        c.Items.push(m);
                        m.SelectEnabled = this._ItemConsistent(m, c.Items);
                        m.ApplyButtonEnabled = m.SelectEnabled
                    }
                    var y = {};
                    y.AccountAssignmentNumber = t.results[0].Header2Items.results[p].AccountAssignmentNumber;
                    y.MultipleAcctAssgmtDistrPercent = t.results[0].Header2Items.results[p].MultipleAcctAssgmtDistrPercent;
                    y.MultipleAcctAssgmtDistrQty = t.results[0].Header2Items.results[p].MultipleAcctAssgmtDistrQty;
                    y.AssetNumber = t.results[0].Header2Items.results[p].AssetNumber;
                    y.AssetNumberName = t.results[0].Header2Items.results[p].AssetNumberName;
                    if (y.AssetNumberName !== "") {
                        m.AccountAssignmentsColumnAssetNumberVisible = true
                    }
                    y.SubAssetNumber = t.results[0].Header2Items.results[p].SubAssetNumber;
                    if (y.SubAssetNumber !== "") {
                        m.AccountAssignmentsColumnSubAssetNumberVisible = true
                    }
                    y.GLAccount = t.results[0].Header2Items.results[p].GLAccount;
                    y.GLAccountName = t.results[0].Header2Items.results[p].GLAccountName;
                    if (y.GLAccount !== "") {
                        m.AccountAssignmentsColumnGLAccountVisible = true
                    }
                    y.GoodsRecipientName = t.results[0].Header2Items.results[p].GoodsRecipientName;
                    if (y.GoodsRecipientName !== "") {
                        m.AccountAssignmentsColumnGoodsRecipientVisible = true
                    }
                    y.UnloadingPointName = t.results[0].Header2Items.results[p].UnloadingPointName;
                    if (y.UnloadingPointName !== "") {
                        m.AccountAssignmentsColumnUnloadingPointVisible = true
                    }
                    y.FunctionalArea = t.results[0].Header2Items.results[p].FunctionalArea;
                    if (y.FunctionalArea !== "") {
                        m.AccountAssignmentsColumnFunctionalAreaVisible = true
                    }
                    y.ProfitCenter = t.results[0].Header2Items.results[p].ProfitCenter;
                    y.ProfitCenterName = t.results[0].Header2Items.results[p].ProfitCenterName;
                    if (y.ProfitCenter !== "") {
                        m.AccountAssignmentsColumnProfitCenterVisible = true
                    }
                    y.CostCenter = t.results[0].Header2Items.results[p].CostCenter;
                    y.CostCenterName = t.results[0].Header2Items.results[p].CostCenterName;
                    if (y.CostCenter !== "") {
                        m.AccountAssignmentsColumnCostCenterVisible = true
                    }
                    y.Project = t.results[0].Header2Items.results[p].Project;
                    y.ProjectDescription = t.results[0].Header2Items.results[p].ProjectDescription;
                    if (y.Project !== "") {
                        m.AccountAssignmentsColumnProjectVisible = true
                    }
                    y.SalesOrder = t.results[0].Header2Items.results[p].SalesOrder;
                    y.SalesOrderItem = t.results[0].Header2Items.results[p].SalesOrderItem;
                    if (y.SalesOrder !== "") {
                        m.AccountAssignmentsColumnSalesOrderVisible = true
                    }
                    y.OrderID = t.results[0].Header2Items.results[p].OrderID;
                    if (y.OrderID !== "") {
                        m.AccountAssignmentsColumnOrderIDVisible = true
                    }
                    m.AccountAssignments.push(y)
                }
                this._iTableRowsCount = c.Items.length;
                c.POItemsCountTableHeader = this.getResourceBundle().getText("TABLE_TOTAL_ITEMS_LABEL", [this._iTableRowsCount]);
                if (c.SupplyingPlant !== "") {
                    c.Objectheader = this.formatter.concatenateNameIdFormatter(c.SupplyingPlantName, c.SupplyingPlant);
                    c.SupplierDisplayActive = false
                } else {
                    if (this._SourceOfGR !== this._SourceOfGRIsProductionOrder) {
                        c.Objectheader = c.Lifname
                    }
                }
                if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                    c.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PO");
                    c.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PO");
                    c.searchFieldLabel = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PO");
                    c.Ebeln_label = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PO");
                    c.Ebeln_maxLength = 10;
                    c.HeaderContentVisible = true
                } else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                    c.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PROD");
                    c.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_PROD");
                    c.searchFieldLabel = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PROD");
                    c.Ebeln_label = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_PROD");
                    c.Ebeln_maxLength = 12;
                    c.HeaderContentVisible = true;
                    c.BillOfLadingVisible = false
                } else if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                    c.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_NOREF");
                    c.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_NoREF");
                    c.BillOfLadingVisible = false
                } else {
                    c.fullscreenTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_DL");
                    c.shareOnJamTitle = this.getResourceBundle().getText("FULLSCREEN_TITLE_DL");
                    c.searchFieldLabel = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_DL");
                    c.Ebeln_label = this.getResourceBundle().getText("SEARCH_FIELD_LABEL_DL");
                    c.HeaderContentVisible = true;
                    c.Ebeln_maxLength = 10
                }
                c.SourceOfGR = this._SourceOfGR;
                if (this._aExtendedFields.length > 0) {
                    c.ExtensionSectionVisible = true
                } else {
                    c.ExtensionSectionVisible = false
                }
                c.Ebeln_possibleLength = this.getView().getModel("oFrontend").getProperty("/Ebeln_possibleLength");
                c.maxSuggestionWidth = this.getView().getModel("oFrontend").getProperty("/maxSuggestionWidth");
                var P = false;
                if (e) {
                    for (var I = 0; I < this._oNavigationServiceFields.aHeaderFields.length; I++) {
                        c[this._oNavigationServiceFields.aHeaderFields[I]] = e[this._oNavigationServiceFields.aHeaderFields[I]]
                    }
                    var v = false;
                    var b = 0;
                    for (var D = 0; D < e.Items.length; D++) {
                        v = false;
                        b = 0;
                        while (b < c.Items.length && v === false) {
                            if (e.Items[D].DocumentItem === c.Items[b].DocumentItem) {
                                v = true
                            } else {
                                b++
                            }
                        }
                        if (v === true) {
                            if (e.Items[D].ItemCounter === 0) {
                                c.Items[b].Selected = e.Items[D].Selected;
                                c.Items[b].DocumentItemText = e.Items[D].DocumentItemText;
                                c.Items[b].DeliveryCompleted = e.Items[D].DeliveryCompleted;
                                c.Items[b].DeliveredUnit_input = e.Items[D].DeliveredUnit_input;
                                c.Items[b].DeliveredQuantity_input = e.Items[D].DeliveredQuantity_input;
                                c.Items[b].StockType_selectedKey = e.Items[D].StockType_selectedKey;
                                c.Items[b].StorageLocation = e.Items[D].StorageLocation;
                                c.Items[b].StorageLocation_input = e.Items[D].StorageLocation_input;
                                c.Items[b].ShelfLifeExpirationDate = e.Items[D].ShelfLifeExpirationDate;
                                c.Items[b].ManufactureDate = e.Items[D].ManufactureDate;
                                c.Items[b].ReasonCode = e.Items[D].ReasonCode;
                                if (c.Items[b].ShelfLifeExpirationDate !== "") {
                                    c.Items[b].ShelfLifeExpirationDate_valueState = sap.ui.core.ValueState.None
                                }
                                if (c.Items[b].ManufactureDate !== "") {
                                    c.Items[b].ManufactureDate_valueState = sap.ui.core.ValueState.None
                                }
                                if (c.Items[b].ReasonCode !== "") {
                                    c.Items[b].ReasonCode_valueState = sap.ui.core.ValueState.None
                                }
                                if (c.Items[b].StockType_selectedKey === "U") {
                                    c.Items[b].StorageLocationVisible = false
                                }
                                if (c.Items[b].Plant !== e.Items[D].Plant) {
                                    c.Items[b].StorageLocation_valueState = sap.ui.core.ValueState.Warning;
                                    c.Items[b].highlight = c.Items[b].highlight === sap.ui.core.ValueState.Error ? sap.ui.core.ValueState.Error : sap.ui.core.ValueState.Warning;
                                    c.Items[b].StorageLocation_valueStateText = "";
                                    c.Items[b].Selected = false
                                } else {
                                    if (c.Items[b].StorageLocation !== "") {
                                        c.Items[b].StorageLocation_valueState = sap.ui.core.ValueState.None
                                    }
                                }
                                c.Items[b].Plant = e.Items[D].Plant;
                                if (c.Items[b].OpenQuantity !== e.Items[D].OpenQuantity || c.Items[b].Unit !== e.Items[D].Unit || c.Items[b].NonVltdGRBlockedStockQty !== e.Items[D].NonVltdGRBlockedStockQty) {
                                    c.Items[b].DeliveredQuantity_valueState = sap.ui.core.ValueState.Warning;
                                    c.Items[b].highlight = c.Items[b].highlight === sap.ui.core.ValueState.Error ? sap.ui.core.ValueState.Error : sap.ui.core.ValueState.Warning;
                                    c.Items[b].DeliveredQuantity_valueStateText = "";
                                    c.Items[b].Selected = false
                                }
                                if (c.Items[b].ItemHasComponent && e.Items[D].ItemHasComponent) {
                                    c.Items[b].ItemComponentVisible = e.Items[D].ItemComponentVisible;
                                    c.Items[b].ComponentIconState = e.Items[D].ComponentIconState;
                                    c.Items[b].ComponentAutoAdjusted = e.Items[D].ComponentAutoAdjusted;
                                    c.Items[b].ComponentManualAdjusted = e.Items[D].ComponentManualAdjusted;
                                    c.Items[b].SubItems = e.Items[D].SubItems
                                }
                            } else {
                                var T = JSON.parse(JSON.stringify(c.Items[b]));
                                T.ItemCounter = e.Items[D].ItemCounter;
                                T.SplitEnabled = true;
                                T.MaterialVisible = false;
                                T.AccountAssignmentVisible = false;
                                T.PlantVisible = false;
                                T.StorageLocationVisible = true;
                                T.StockTypeVisible = true;
                                T.DeliveredQuantity_input = 0;
                                T.SplitButtonIcon = "sap-icon://less";
                                T.Selected = true;
                                T.DocumentItemText = e.Items[D].DocumentItemText;
                                T.DeliveryCompleted = e.Items[D].DeliveryCompleted;
                                T.DeliveredUnit_input = e.Items[D].DeliveredUnit_input;
                                T.DeliveredQuantity_input = e.Items[D].DeliveredQuantity_input;
                                T.StockType_selectedKey = e.Items[D].StockType_selectedKey;
                                T.StorageLocation = e.Items[D].StorageLocation;
                                T.StorageLocation_input = e.Items[D].StorageLocation_input;
                                T.ShelfLifeExpirationDate = e.Items[D].ShelfLifeExpirationDate;
                                T.ManufactureDate = e.Items[D].ManufactureDate;
                                T.ReasonCode = e.Items[D].ReasonCode;
                                if (T.StockType_selectedKey === "U") {
                                    T.StorageLocationVisible = false
                                }
                                if (T.StorageLocation !== "") {
                                    T.StorageLocation_valueState = sap.ui.core.ValueState.None
                                }
                                if (T.ShelfLifeExpirationDate !== "") {
                                    T.ShelfLifeExpirationDate_valueState = sap.ui.core.ValueState.None
                                }
                                if (T.ReasonCode !== "") {
                                    T.ReasonCode_valueState = sap.ui.core.ValueState.None
                                }
                                if (T.ManufactureDate !== "") {
                                    T.ManufactureDate_valueState = sap.ui.core.ValueState.None
                                }
                                c.Items.splice(++b, 0, T)
                            }
                        } else {
                            P = true
                        }
                    }
                    var M = sap.ui.core.UIComponent.getRouterFor(this);
                    var C;
                    if (e.oBatchCreate) {
                        for (C = 0; C < c.Items.length; C++) {
                            if (c.Items[C].DocumentItem === e.oBatchCreate.DocumentItem && c.Items[C].ItemCounter === e.oBatchCreate.ItemCounter) {
                                break
                            }
                        }
                        M.navTo("subscreen", {
                            POItem: C
                        }, true)
                    }
                    if (e.DetailPageData) {
                        this._oDetailPageData = e.DetailPageData;
                        for (C = 0; C < c.Items.length; C++) {
                            if (c.Items[C].DocumentItem === e.DetailPageData.DocumentItem && c.Items[C].ItemCounter === e.DetailPageData.ItemCounter) {
                                break
                            }
                        }
                        M.navTo("subscreenAppState", {
                            POItem: C
                        }, true)
                    }
                }
                u.setData(c);
                this._setSearchPlaceholderText();
                this._setScanButtonVisibility();
                this.getView().bindElement({
                    path: "/GR4PO_DL_Headers(InboundDelivery='" + c.Ebeln + "',SourceOfGR='" + this._SourceOfGR + "')",
                    model: "oData"
                });
                this._initialDataLoaded = JSON.parse(JSON.stringify(c));
                u.setProperty("/PostButtonVisible", true);
                var E = [];
                E.push(new sap.ui.model.Sorter("DocumentItem_int", false));
                E.push(new sap.ui.model.Sorter("ItemCounter", false));
                this.getView().byId("idProductsTable").removeSelections(true);
                this.getView().byId("idProductsTable").getBinding("items").filter([]);
                this.getView().byId("idProductsTable").getBinding("items").sort(E);
                this.getView().byId("idTableSearch").setValue("");
                this._controlSelectAllAndPostButton();
                if (e) {
                    this._loadAttachmentComponent(e.Temp_Key)
                } else {
                    this._loadAttachmentComponent()
                }
                if (P === true) {
                    o.show(this.getResourceBundle().getText("MESSAGE_CHANGED_PO"))
                }
                if (d === true) {
                    this._toggleBusy(false);
                    o.show(this.getResourceBundle().getText("MESSAGE_CONFIGURATION"))
                }
            }
            this._toggleBusy(false);
            var V = this;
            if (sap.cp && sap.cp.ui.services && sap.cp.ui.services.CopilotApi) {
                sap.cp.ui.services.CopilotApi.getChats().then(function (e) {
                    V._aCopilotChats = e
                });
                this._oCopilotActive = true;
                this.getView().getModel("oFrontend").setProperty("/CopilotActive", this._oCopilotActive)
            }
        },
        _removeAbortHashBeforeNavigation: function (e) {
            var t = sap.ui.core.routing.HashChanger.getInstance();
            var a = t.getHash();
            if (a.includes("false") || a.includes("true")) {
                if (e) {
                    t.replaceHash("sap-iapp-state=" + e)
                } else {
                    t.replaceHash("")
                }
            }
        },
        _generateAppStateKey: function () {
            var e = this._oNavigationService.storeInnerAppStateWithImmediateReturn(this._getInnerAppState(), false);
            var t = e.promise;
            t.done(function (e) {
                this._removeAbortHashBeforeNavigation(e)
            }.bind(this));
            return e.appStateKey
        },
        _generateAppStateExternalUrl: function () {
            var e = this._generateAppStateKey();
            var t = sap.ushell.Container.getService("CrossApplicationNavigation");
            var a;
            var r;
            var i;
            var s = "createGR";
            if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                r = "PurchaseOrder";
                i = {
                    SourceOfGR: [this._SourceOfGR]
                }
            } else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                r = "ProductionOrder";
                i = {
                    SourceOfGR: [this._SourceOfGR]
                }
            } else if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                s = "createGRwoReference";
                r = "Material";
                i = {
                    SourceOfGR: [this._SourceOfGR]
                }
            } else {
                r = "InboundDelivery";
                i = {
                    SourceOfGR: [this._SourceOfGR]
                }
            }
            a = t && t.hrefForExternal({
                target: {
                    semanticObject: r,
                    action: s
                },
                params: i,
                appStateKey: e
            }) || "";
            return a
        },
        handleBookmarkBeforePress: function () {
            var e = "";
            if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                e = this.getResourceBundle().getText("FULLSCREEN_TITLE_PO")
            } else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                e = this.getResourceBundle().getText("FULLSCREEN_TITLE_PROD")
            } else if (this._SourceOfGR === this._SourceOfGRIsNoReference) {
                e = this.getResourceBundle().getText("FULLSCREEN_TITLE_NOREF")
            } else {
                e = this.getResourceBundle().getText("FULLSCREEN_TITLE_DL")
            }
            var t = this.getView().getModel("oFrontend");
            var a = t.getProperty("/Ebeln");
            t.setProperty("/saveAsTileTitle", e);
            t.setProperty("/saveAsTileSubtitle", a);
            t.setProperty("/saveAsTileURL", this._generateAppStateExternalUrl())
        },
        handleSelectDeliveryCompleted: function (e) {
            var t = e.getParameter("selected");
            var a = this.getView().getModel("oItem");
            if (t) {
                a.setProperty("/Selected", t)
            }
        },
        onPersoButtonPressed: function (e) {
            if (!this._oPersDialog) {
                this._oPersDialog = sap.ui.xmlfragment("s2p.mm.im.goodsreceipt.purchaseorder.view.personalization", this);
                this.getView().addDependent(this._oPersDialog)
            }
            var t = new sap.ui.model.json.JSONModel;
            t.setData(JSON.parse(JSON.stringify(this._oPersonalizedDataContainer)));
            this._oPersDialog.setModel(t);
            this._oPersDialog.open()
        },
        handlePersonalizationSave: function (e) {
            var t = this._oPersDialog.getModel();
            this._oPersonalizedDataContainer = t.getData();
            if (this._oPersonalizer) {
                var a = this.getView().getModel("oFrontend");
                a.setProperty("/personalizationEnabled", false);
                var r = this._oPersonalizer.setPersData(this._oPersonalizedDataContainer).done(function () {
                    a.setProperty("/personalizationEnabled", true)
                }).fail(function () {
                    jQuery.sap.log.error("Writing personalization data failed.");
                    a.setProperty("/personalizationEnabled", true)
                })
            }
            this._oPersDialog.close()
        },
        handlePersonalizationAbort: function (e) {
            this._oPersDialog.close()
        },
        _showSettingsDialog: function (e) {
            if (!this._oApplicationSettingsDialog) {
                if (this._SourceOfGR === this._SourceOfGRIsPurchaseOrder) {
                    this._oApplicationSettingsDialog = sap.ui.xmlfragment({
                        fragmentName: "s2p.mm.im.goodsreceipt.purchaseorder.view.ApplicationSettingsPurchaseOrder",
                        type: "XML",
                        id: "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.ApplicationSettings"
                    }, this)
                } else if (this._SourceOfGR === this._SourceOfGRIsProductionOrder) {
                    this._oApplicationSettingsDialog = sap.ui.xmlfragment({
                        fragmentName: "s2p.mm.im.goodsreceipt.purchaseorder.view.ApplicationSettingsProductionOrder",
                        type: "XML",
                        id: "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.ApplicationSettings"
                    }, this)
                } else if (this._SourceOfGR === this._SourceOfGRIsInboundDelivery) {
                    this._oApplicationSettingsDialog = sap.ui.xmlfragment({
                        fragmentName: "s2p.mm.im.goodsreceipt.purchaseorder.view.ApplicationSettingsInboundDelivery",
                        type: "XML",
                        id: "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.ApplicationSettings"
                    }, this)
                }
                this.getView().addDependent(this._oApplicationSettingsDialog)
            }
            var t = new sap.ui.model.json.JSONModel;
            t.setData(JSON.parse(JSON.stringify(this._oPersonalizedDataContainer)));
            this._oApplicationSettingsDialog.setModel(t);
            this._oApplicationSettingsDialog.open()
        },
        handleApplicationSettingsSave: function (e) {
            var t = this._oApplicationSettingsDialog.getModel();
            this._oPersonalizedDataContainer = t.getData();
            if (this._oPersonalizer) {
                var a = this.getView().getModel("oFrontend");
                a.setProperty("/personalizationEnabled", false);
                var r = this._oPersonalizer.setPersData(this._oPersonalizedDataContainer).done(function () {
                    a.setProperty("/personalizationEnabled", true)
                }).fail(function () {
                    jQuery.sap.log.error("Writing personalization data failed.");
                    a.setProperty("/personalizationEnabled", true)
                })
            }
            this._setSearchPlaceholderText();
            this._setScanButtonVisibility();
            this._oApplicationSettingsDialog.close()
        },
        handleApplicationSettingsAbort: function (e) {
            this._oApplicationSettingsDialog.close()
        },
        matidformatter: function (e) {
            if (e !== "") {
                e = " " + e + ""
            }
            return e
        },
        soformatter: function (e, t) {
            return e + "/" + t
        },
        _getInitialItem: function (e, t) {
            var a = this.getView().getModel("oFrontend");
            var r = a.getData();
            var i = {};
            var s = new Array;
            i.ItemCounter = 0;
            i.POItemsCountTableHeader = "01";
            i.Selected = false;
            i.SelectEnabled = true;
            i.Material_Input = "";
            i.StockTypeNOREFEnabled = false;
            i.DeliveredQuantityEditable = false;
            i.DeliveredUnitEditable = false;
            i.DocumentItem = e + 1;
            i.ChartVisible = false;
            if (i.DocumentItem < 10) {
                i.DocumentItem = "0" + i.DocumentItem
            } else {
                i.DocumentItem = i.DocumentItem.toString()
            }
            i.ItemEnabled = true;
            i.SplitEnabled = false;
            i.MaterialText = this.getResourceBundle().getText("ITEM_DETAILTITLE", [i.DocumentItem]);
            i.MaterialEditable = true;
            i.Plant_input_editable = false;
            i.SalesOrder_editable = false;
            i.StorageLocationEditable = false;
            i.BatchEditable = false;
            i.AccountAssignmentVisible = false;
            i.PlantVisible = true;
            i.Plant = "";
            i.StorageLocationVisible = true;
            i.StorageLocation = "";
            i.WarehouseStorageBin = "";
            i.StockTypeVisible = true;
            i.StockType = "";
            i.StockTypeEnabled = true;
            i.StockType_input = s;
            i.UnloadingPoint_editable = true;
            i.GoodsRecipientName_editable = true;
            i.InventorySpecialStockTypeName = this.getResourceBundle().getText("NONE");
            i.DeliveredQuantity_input = 0;
            i.BatchVisible = false;
            i.ManufactureDateVisible = false;
            i.ShelfLifeExpirationDate = "";
            i.ManufactureDate = "";
            i.ShelfLifeExpirationDateVisible = false;
            i.GoodsMovementReasonCodeVisible = false;
            r.Items.push(i);
            this._initialDataLoaded = JSON.parse(JSON.stringify(r));
            this._loadAttachmentComponentNOREF();
            if (t === true) {
                r.CopyButtonVisible = true;
                r.DeleteButtonVisible = true
            } else {
                r.CopyButtonVisible = false;
                r.DeleteButtonVisible = false
            }
            var o = this.getView().getModel("oFrontend");
            if (o.getProperty("/SpecialStock_input") === "" || o.getProperty("/SpecialStock_input") === undefined) {
                this.getOwnerComponent().getModel("oData").read("/MMIMInventSpecialStockTypeVH", {
                    success: jQuery.proxy(this._successSpecialStockLoad, this),
                    error: jQuery.proxy(this._handleOdataError, this)
                })
            }
            a.setData(r);
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                this.getView().byId("idProductsTable").setNoDataText(this.getResourceBundle().getText("TABLE_NODATA_TEXT"))
            }
        },
        handleAddButtonPressed: function (e) {
            var t = this.getView().getModel("oFrontend");
            var a = t.getData();
            var r = 0;
            for (var i = 0; i < a.Items.length; i++) {
                if (r < parseInt(a.Items[i].DocumentItem)) {
                    r = parseInt(a.Items[i].DocumentItem)
                }
            }
            var s = this.getView().getModel("oFrontend");
            var o;
            var l;
            o = s.getProperty("/Items");
            for (var n = 0; n < o.length; n++) {
                l = this._validationNoRefItem(n);
                if (l === false) {
                    s.setProperty("/PostButtonEnabled", false);
                    break
                } else {
                    s.setProperty("/PostButtonEnabled", true)
                }
            }
            this._getInitialItem(r, a.CopyButtonVisible);
            this.getView().byId("idSelectAll").setEnabled(true);
            this.getView().byId("idAddButton").focus();
            var o = t.getProperty("/Items");
            var u = 0;
            for (var i = 0; i < o.length; i++) {
                if (o[i].Selected) {
                    u++
                }
            }
            var d = this._allItemsInTableSelected(o);
            this._controlSelectAllCheckBox(u > 0, d)
        },
        handleDeleteButtonPressed: function (e) {
            var t = this.getView().getModel("oFrontend");
            var a = t.getData();
            var r = new Array;
            var i = 0;
            var s;
            var l;
            var n;
            for (var u = 0; u < a.Items.length; u++) {
                if (a.Items[u].Selected === true) {
                    r.push({
                        item: u
                    });
                    s = a.Items[u].DocumentItem
                }
            }
            if (r.length === 1) {
                n = this.getResourceBundle().getText("DELETE_POPUP_MIN", [s])
            } else {
                n = this.getResourceBundle().getText("DELETE_POPUP_MAX", [r.length])
            }
            var p = false;
            var g = this;
            var h = g.getResourceBundle();
            sap.m.MessageBox.warning(n, {
                icon: sap.m.MessageBox.Icon.WARNING,
                title: this.getResourceBundle().getText("DELETE"),
                actions: [this.getResourceBundle().getText("DELETE"), sap.m.MessageBox.Action.CANCEL],
                onClose: m,
                styleClass: "sapUiSizeCompact",
                initialFocus: sap.m.MessageBox.Action.CANCEL
            });

            function m(e) {
                var i = 0;
                if (e === g.getResourceBundle().getText("DELETE")) {
                    for (var n = 0; n < r.length; n++) {
                        a.Items.splice(r[n].item - i, 1);
                        i++
                    }
                    if (a.Items.length === 0) {
                        g.getView().byId("idSelectAll").setSelected(false);
                        g.getView().byId("idSelectAll").setEnabled(true)
                    }
                    a.CopyButtonVisible = false;
                    a.DeleteButtonVisible = false;
                    if (r.length === 1) {
                        l = g.getResourceBundle().getText("DELETE_MESSAGE_MIN", [s])
                    } else {
                        l = g.getResourceBundle().getText("DELETE_MESSAGE_MAX", [r.length])
                    }
                    o.show(l);
                    t.setData(a);
                    var u;
                    var p;
                    u = t.getProperty("/Items");
                    if (u.length === 0) {
                        t.setProperty("/PostButtonEnabled", false)
                    } else {
                        for (var h = 0; h < u.length; h++) {
                            p = g._validationNoRefItem(h);
                            if (p === false) {
                                t.setProperty("/PostButtonEnabled", false);
                                break
                            } else {
                                t.setProperty("/PostButtonEnabled", true)
                            }
                        }
                    }
                    g.getView().byId("idAddButton").focus();
                    sap.ui.getCore().getMessageManager().removeAllMessages();
                    var m = g.getView().getModel("oFrontend");
                    var u = m.getProperty("/Items");
                    for (var i = 0; i < u.length; i++) {
                        var S = m.getProperty("/Items/" + i + "/DocumentItem");
                        if (m.getProperty("/Items/" + i + "/ManufactureDate_valueState") === sap.ui.core.ValueState.Error || m.getProperty("/Items/" + i + "/ShelfLifeExpirationDate_valueState") === sap.ui.core.ValueState.Error) {
                            var f = new c({
                                message: g.getResourceBundle().getText("TITLE_ERROR_DETAILVIEW"),
                                type: d.Error,
                                target: "Special Stock",
                                processor: m,
                                additionalText: g.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [S]),
                                description: g.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [S])
                            });
                            sap.ui.getCore().getMessageManager().addMessages(f)
                        }
                    }
                    var _ = 0;
                    for (var n = 0; n < u.length; n++) {
                        if (u[n].Selected) {
                            _++
                        }
                    }
                    var I = g._allItemsInTableSelected(u);
                    g._controlSelectAllCheckBox(_ > 0, I)
                }
            }
        },
        handleCopyButtonPressed: function (e) {
            var t = this.getView().getModel("oFrontend");
            var a = t.getData();
            var r = 0;
            var i;
            var s = 0;
            var o = [];
            for (var l = 0; l < a.Items.length; l++) {
                if (r < parseInt(a.Items[l].DocumentItem)) {
                    r = parseInt(a.Items[l].DocumentItem)
                }
            }
            for (var l = 0; l < a.Items.length; l++) {
                if (a.Items[l].Selected === true) {
                    var n = JSON.parse(JSON.stringify(a.Items[l]));
                    o[s] = n.DocumentItem;
                    s++;
                    n.Selected = false;
                    r++;
                    n.DocumentItem = r;
                    if (n.DocumentItem < 10) {
                        n.DocumentItem = "0" + n.DocumentItem
                    } else {
                        n.DocumentItem = n.DocumentItem.toString()
                    }
                    o[s] = n.DocumentItem;
                    s++;
                    n.MaterialText = "Item " + n.DocumentItem;
                    n.highlight = sap.ui.core.MessageType.Information;
                    a.Items.splice(0, 0, n);
                    i = l + 1;
                    a.Items[i].Selected = false
                }
            }
            var u = this.getView().byId("idSelectAll");
            u.setSelected(false);
            t.setData(a);
            t.setProperty("/CopyButtonVisible", false);
            t.setProperty("/DeleteButtonVisible", false);
            this.getView().byId("idAddButton").focus();
            sap.ui.getCore().getMessageManager().removeAllMessages();
            var p = this.getView().getModel("oFrontend");
            var g = p.getProperty("/Items");
            for (var i = 0; i < g.length; i++) {
                var h = p.getProperty("/Items/" + i + "/DocumentItem");
                if (p.getProperty("/Items/" + i + "/ManufactureDate_valueState") === sap.ui.core.ValueState.Error || p.getProperty("/Items/" + i + "/ShelfLifeExpirationDate_valueState") === sap.ui.core.ValueState.Error) {
                    var m = new c({
                        message: this.getResourceBundle().getText("TITLE_ERROR_DETAILVIEW"),
                        type: d.Error,
                        target: "Special Stock",
                        processor: p,
                        additionalText: this.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [h]),
                        description: this.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [h])
                    });
                    sap.ui.getCore().getMessageManager().addMessages(m)
                }
            }
        },
        handleSpecialStockChange: function (e) {
            var t = {};
            t = this.getView().getModel("oItem").getData();
            t.InventorySpecialStockType = t.SpecialStock_selectedKey;
            for (var a = 0; a < t.SpecialStock_input.length; a++) {
                if (t.SpecialStock_input[a].key === t.SpecialStock_selectedKey) {
                    t.InventorySpecialStockTypeName = t.SpecialStock_input[a].text;
                    break
                }
            }
            if (t.InventorySpecialStockType === "E") {
                t.SalesOrder_editable = true;
                t.SalesOrder_inputMandatory = true;
                t.Lifnr_inputMandatory = false;
                t.Project_inputMandatory = false;
                t.SpecialStock_input_State = sap.ui.core.ValueState.None;
                t.SpecialStock_input_StateText = "";
                t.Lifnr_State = sap.ui.core.ValueState.None;
                t.Lifnr_StateText = "";
                sap.ui.getCore().getMessageManager().removeAllMessages()
            }
            if (t.InventorySpecialStockType === "Q") {
                t.Project_inputMandatory = true;
                t.SalesOrder_inputMandatory = false;
                t.Lifnr_inputMandatory = false;
                t.SpecialStock_input_State = sap.ui.core.ValueState.None;
                t.SpecialStock_input_StateText = "";
                t.Lifnr_State = sap.ui.core.ValueState.None;
                t.Lifnr_StateText = "";
                sap.ui.getCore().getMessageManager().removeAllMessages()
            }
            if (t.InventorySpecialStockType === "K") {
                t.Lifnr_inputMandatory = true;
                t.Project_inputMandatory = false;
                t.SalesOrder_inputMandatory = false;
                t.Lifname = "";
                t.Lifnr = "";
                t.SpecialStock_input_State = sap.ui.core.ValueState.None;
                t.SpecialStock_input_StateText = "";
                t.Lifnr_State = sap.ui.core.ValueState.None;
                t.Lifnr_StateText = "";
                sap.ui.getCore().getMessageManager().removeAllMessages();
                var r = [];
                var i = this.getView().getModel("oItem").getProperty("/Material_Input");
                var s = this.getView().getModel("oItem");
                s.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                this.getView().setModel(s);
                r.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, i));
                this.getOwnerComponent().getModel("oData").read("/MMIMSupplierMaterialVH", {
                    filters: r,
                    success: jQuery.proxy(this._successSupplierLoad, this),
                    error: jQuery.proxy(this._handleOdataError, this)
                })
            }
            if (t.InventorySpecialStockType === "") {
                t.SalesOrder_inputMandatory = false;
                t.Lifnr_inputMandatory = false;
                t.Project_inputMandatory = false;
                t.SpecialStock_input_State = sap.ui.core.ValueState.None;
                t.SpecialStock_input_StateText = "";
                t.Lifnr_State = sap.ui.core.ValueState.None;
                t.Lifnr_StateText = "";
                sap.ui.getCore().getMessageManager().removeAllMessages()
            }
            if (t.InventorySpecialStockType !== "E") {
                t.SalesOrder = "";
                t.SalesOrderItem = ""
            }
            if (t.InventorySpecialStockType !== "Q") {
                t.Project = "";
                t.ProjectDescription = ""
            }
            this.getView().getModel("oItem").setData(t);
            this._setGuidedTour();
            this.getView().byId("idInventorySpecialStockSelection").focus()
        },
        _successSupplierLoad: function (e, t) {
            var a = this.getView().getModel("oItem");
            if (e.results.length <= 0) {
                a.setProperty("/SpecialStock_input_State", sap.ui.core.ValueState.Error);
                a.setProperty("/SpecialStock_input_StateText", this.getResourceBundle().getText("LABEL_LIFNR_NOFOUND"));
                a.setProperty("/Lifnr_State", sap.ui.core.ValueState.Error);
                a.setProperty("/Lifnr_StateText", this.getResourceBundle().getText("LABEL_LIFNR_NOFOUND2"));
                if (sap.ui.getCore().getMessageManager().getMessageModel().getData().length === 0) {
                    var r = new c({
                        message: this.getResourceBundle().getText("LABEL_LIFNR_NOFOUND"),
                        type: d.Error,
                        target: "Special Stock",
                        processor: a,
                        additionalText: this.getResourceBundle().getText("LABEL_SPECIALSTOCK")
                    });
                    sap.ui.getCore().getMessageManager().addMessages(r);
                    r = new c({
                        message: this.getResourceBundle().getText("LABEL_LIFNR_NOFOUND2"),
                        type: d.Error,
                        target: "Special Stock",
                        processor: a,
                        additionalText: this.getResourceBundle().getText("SUPPLIER"),
                        description: this.getResourceBundle().getText("TEXT_LIFNR_NOFOUND")
                    });
                    sap.ui.getCore().getMessageManager().addMessages(r)
                }
            } else {
                a.setProperty("/SpecialStock_input_State", sap.ui.core.ValueState.None);
                a.setProperty("/SpecialStock_input_StateText", "");
                a.setProperty("/Lifnr_State", sap.ui.core.ValueState.None);
                a.setProperty("/Lifnr_StateText", "")
            }
        },
        handleMaterialValueHelp: function (e) {
            var t = this;
            var a = e.getSource();
            var r = {};
            var i;
            var s;
            var o;
            var l;
            var n;
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                this._SelectedTableIndex = this._getSelectedItemInModel(e);
                var u = this.getView().getModel("oFrontend");
                var d = u.getProperty("/Items");
                i = d[this._SelectedTableIndex].Material_Input;
                s = d[this._SelectedTableIndex].Material_Name;
                o = d[this._SelectedTableIndex].Plant;
                l = d[this._SelectedTableIndex].DeliveredUnit_input;
                n = d[this._SelectedTableIndex].StorageLocation_input
            } else {
                var c = this.getModel("oItem");
                i = c.getProperty("/Material_Input");
                s = c.getProperty("/Material_Name");
                o = c.getProperty("/Plant");
                l = c.DeliveredUnit_input;
                n = c.StorageLocation_input
            }
            r.Material = s;
            this._oValueHelpController.displayValueHelpMaterialGeneral(r, function (e) {
                t._handleMaterialValueHelpCallback(e);
                if (a.getValue() !== e.MaterialName && e.selected === true) {
                    a.setValue(e.MaterialName)
                }
            })
        },
        _handleMaterialValueHelpCallback: function (e) {
            var t = false;
            var a;
            var r;
            var i;
            var s;
            var o;
            var l = sap.ui.core.ValueState.None;
            var n;
            if (e.selected === true) {
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                    var u = this.getView().getModel("oFrontend");
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input", e.Material);
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Name", e.MaterialName);
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", sap.ui.core.ValueState.None);
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueStateText", "");
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Plant", e.Plant);
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_input", e.PlantName);
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_valueState", sap.ui.core.ValueState.None);
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_valueStateText", "");
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Batch", "");
                    if (u.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey") === "K") {
                        u.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr", "");
                        u.setProperty("/Items/" + this._SelectedTableIndex + "/Lifname", "");
                        u.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_State", sap.ui.core.ValueState.None);
                        u.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_StateText", "");
                        u.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input_State", sap.ui.core.ValueState.None);
                        var d = u.getProperty("/Items/" + this._SelectedTableIndex);
                        if (d.SpecialStock_input.length > 0) {
                            for (var c = 0; c < d.SpecialStock_input.length; c++) {
                                if (d.SpecialStock_input[c].key === "") {
                                    var p = d.SpecialStock_input[c].text;
                                    break
                                }
                            }
                            u.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey", "");
                            u.setProperty("/Items/" + this._SelectedTableIndex + "/InventorySpecialStockTypeName", p);
                            u.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_inputMandatory", false)
                        }
                    }
                    this._setValueStateMandatoryFields(u.getProperty("/Items/" + this._SelectedTableIndex));
                    if (e.Material === "") {
                        l = sap.ui.core.ValueState.Error;
                        u.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", l)
                    } else {
                        u.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", l)
                    }
                    if (u.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input") === undefined) {
                        n = u.getProperty("/SpecialStock_input");
                        u.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input", n)
                    }
                    a = e.Material;
                    r = u.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
                    i = u.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
                    s = u.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation");
                    o = u.getProperty("/Items/" + this._SelectedTableIndex + "/StockType_selectedKey")
                } else {
                    var g = this.getView().getModel("oFrontend");
                    var h = this.getView().getModel("oItem");
                    h.setProperty("/Material_Input", e.Material);
                    h.setProperty("/Material_Name", e.MaterialName);
                    h.setProperty("/Material_Input_valueState", sap.ui.core.ValueState.None);
                    h.setProperty("/Material_Input_valueStateText", "");
                    h.setProperty("/Plant", e.Plant);
                    h.setProperty("/Plant_input", e.PlantName);
                    h.setProperty("/Plant_valueState", sap.ui.core.ValueState.None);
                    h.setProperty("/Plant_valueStateText", "");
                    h.setProperty("/Batch", "");
                    if (h.getProperty("/SpecialStock_selectedKey") === "K") {
                        h.setProperty("/Lifnr", "");
                        h.setProperty("/Lifname", "");
                        h.setProperty("/Lifnr_State", sap.ui.core.ValueState.None);
                        h.setProperty("/Lifnr_StateText", "");
                        h.setProperty("/SpecialStock_input_State", sap.ui.core.ValueState.None);
                        var d = h.getData();
                        if (d.SpecialStock_input !== undefined && d.SpecialStock_input.length > 0) {
                            for (var c = 0; c < d.SpecialStock_input.length; c++) {
                                if (d.SpecialStock_input[c].key === "") {
                                    var p = d.SpecialStock_input[c].text;
                                    break
                                }
                            }
                            h.setProperty("/SpecialStock_selectedKey", "");
                            h.setProperty("/InventorySpecialStockTypeName", p);
                            h.setProperty("/Lifnr_inputMandatory", false)
                        }
                    }
                    if (e.Material === "") {
                        l = sap.ui.core.ValueState.Error;
                        h.setProperty("/Material_Input_valueState", l)
                    } else {
                        h.setProperty("/Material_Input_valueState", l)
                    }
                    this.getView().byId("idQuantity").focus();
                    if (h.getProperty("/SpecialStock_input") === undefined) {
                        n = g.getProperty("/SpecialStock_input");
                        h.setProperty("/SpecialStock_input", n)
                    }
                    a = e.Material;
                    r = h.getProperty("/Plant");
                    i = h.getProperty("/DeliveredUnit_input");
                    s = h.getProperty("/StorageLocation");
                    o = h.getProperty("/StockType_selectedKey")
                }
                this._oValueHelpController.fillBufferForMaterialExpanded(e, this._validationCallbBack, this);
                this._handleValidationMasterData(a, i, r, s, this._SelectedTableIndex);
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                    u = this.getView().getModel("oFrontend");
                    r = u.getProperty("/Items/" + this._SelectedTableIndex + "/Plant")
                } else {
                    h = this.getView().getModel("oItem");
                    r = h.getProperty("/Plant")
                }
                this._getControlFields(a, r, this._SelectedTableIndex, o)
            }
        },
        handlePlantHelp: function (e) {
            var t = this;
            var a = {};
            var r;
            var i;
            var s;
            var o;
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                this._SelectedTableIndex = this._getSelectedItemInModel(e);
                var l = this.getView().getModel("oFrontend");
                var n = l.getProperty("/Items");
                r = n[this._SelectedTableIndex].Material_Input;
                i = n[this._SelectedTableIndex].Plant;
                s = n[this._SelectedTableIndex].DeliveredUnit_input;
                o = n[this._SelectedTableIndex].StorageLocation_input
            } else {
                var u = this.getModel("oItem");
                r = u.getProperty("/Material_Input");
                i = u.getProperty("/Plant");
                s = u.DeliveredUnit_input;
                o = u.StorageLocation_input
            }
            a.Material = r;
            a.Plant = i;
            a.UoM = s;
            a.StorageLocation = o;
            this._oValueHelpController.displayValueHelpPlant4Material(a, function (e) {
                t._handlePlantValueHelpCallback(e)
            }, t)
        },
        _handlePlantValueHelpCallback: function (e) {
            var t = false;
            var a;
            var r;
            var i;
            var s;
            var o;
            if (e.selected === true) {
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                    var l = this.getView().getModel("oFrontend");
                    l.setProperty("/Items/" + this._SelectedTableIndex + "/Plant", e.Plant);
                    l.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_input", e.PlantName);
                    l.setProperty("/Items/" + this._SelectedTableIndex + "/Batch", "");
                    if (l.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey") === "K") {
                        l.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr", "");
                        l.setProperty("/Items/" + this._SelectedTableIndex + "/Lifname", "");
                        l.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_State", sap.ui.core.ValueState.None);
                        l.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_StateText", "");
                        l.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input_State", sap.ui.core.ValueState.None);
                        var n = l.getProperty("/Items/" + this._SelectedTableIndex);
                        if (n.SpecialStock_input !== undefined && n.SpecialStock_input.length > 0) {
                            for (var u = 0; u < n.SpecialStock_input.length; u++) {
                                if (n.SpecialStock_input[u].key === "") {
                                    var d = n.SpecialStock_input[u].text;
                                    break
                                }
                            }
                            l.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey", "");
                            l.setProperty("/Items/" + this._SelectedTableIndex + "/InventorySpecialStockTypeName", d);
                            l.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_inputMandatory", false)
                        }
                    }
                    a = l.getProperty("/Items/" + this._SelectedTableIndex + "/Material_Input");
                    i = l.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
                    r = l.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
                    s = l.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation");
                    o = l.getProperty("/Items/" + this._SelectedTableIndex + "/StockType_selectedKey")
                } else {
                    var c = this.getView().getModel("oItem");
                    c.setProperty("/Plant", e.Plant);
                    c.setProperty("/Plant_input", e.PlantName);
                    c.setProperty("/Batch", "");
                    if (c.getProperty("/SpecialStock_selectedKey") === "K") {
                        c.setProperty("/Lifnr", "");
                        c.setProperty("/Lifname", "");
                        c.setProperty("/Lifnr_State", sap.ui.core.ValueState.None);
                        c.setProperty("/Lifnr_StateText", "");
                        c.setProperty("/SpecialStock_input_State", sap.ui.core.ValueState.None);
                        var n = c.getData();
                        if (n.SpecialStock_input !== undefined && n.SpecialStock_input.length > 0) {
                            for (var u = 0; u < n.SpecialStock_input.length; u++) {
                                if (n.SpecialStock_input[u].key === "") {
                                    var d = n.SpecialStock_input[u].text;
                                    break
                                }
                            }
                            c.setProperty("/SpecialStock_selectedKey", "");
                            c.setProperty("/InventorySpecialStockTypeName", d);
                            c.setProperty("/Lifnr_inputMandatory", false)
                        }
                    }
                    a = c.getProperty("/Material_Input");
                    i = c.getProperty("/Plant");
                    r = c.getProperty("/DeliveredUnit_input");
                    s = c.getProperty("/StorageLocation");
                    o = c.getProperty("/StockType_selectedKey")
                }
                this._handleValidationMasterData(a, r, i, s, this._SelectedTableIndex);
                if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                    l = this.getView().getModel("oFrontend");
                    i = l.getProperty("/Items/" + this._SelectedTableIndex + "/Plant")
                } else {
                    c = this.getView().getModel("oItem");
                    i = c.getProperty("/Plant")
                }
                this._getControlFields(a, e.Plant, this._SelectedTableIndex, o)
            }
        },
        handleMaterialSuggest: function (e) {
            var t = e.getParameter("suggestValue").trim().toUpperCase();
            var a = {};
            var r = [];
            r.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.Contains, t));
            r.push(new sap.ui.model.Filter("MaterialName", sap.ui.model.FilterOperator.Contains, t));
            a = new sap.ui.model.Filter(r, false);
            if (!e.getSource().getBinding("suggestionItems")) {
                e.getSource().bindAggregation("suggestionItems", {
                    path: "/MaterialHelps",
                    model: "oDataHelp",
                    template: new sap.ui.core.ListItem({
                        additionalText: "{oDataHelp>Material}",
                        text: "{oDataHelp>MaterialName}"
                    })
                })
            }
            e.getSource().getBinding("suggestionItems").filter(a)
        },
        handleSuggestionMaterialSelected: function (e) {
            var t;
            var a;
            var r;
            var i;
            var s;
            var o;
            var l;
            var n;
            var u = sap.ui.core.ValueState.None;
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                this._SelectedTableIndex = this._getSelectedItemInModel(e);
                var d = this.getView().getModel("oFrontend");
                var c = d.getProperty("/Items");
                a = e.getParameter("selectedItem").getText();
                t = e.getParameter("selectedItem").getAdditionalText();
                r = r = c[this._SelectedTableIndex].Plant;
                d.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Name", a);
                d.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input", t);
                d.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", sap.ui.core.ValueState.None);
                d.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueStateText", "");
                d.setProperty("/Items/" + this._SelectedTableIndex + "/Batch", "");
                if (d.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey") === "K") {
                    d.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr", "");
                    d.setProperty("/Items/" + this._SelectedTableIndex + "/Lifname", "");
                    d.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_State", sap.ui.core.ValueState.None);
                    d.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_StateText", "");
                    d.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input_State", sap.ui.core.ValueState.None);
                    var p = d.getProperty("/Items/" + this._SelectedTableIndex);
                    if (p.SpecialStock_input !== undefined && p.SpecialStock_input.length > 0) {
                        for (var g = 0; g < p.SpecialStock_input.length; g++) {
                            if (p.SpecialStock_input[g].key === "") {
                                var h = p.SpecialStock_input[g].text;
                                break
                            }
                        }
                        d.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey", "");
                        d.setProperty("/Items/" + this._SelectedTableIndex + "/InventorySpecialStockTypeName", h);
                        d.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_inputMandatory", false)
                    }
                }
                r = d.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
                s = d.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
                o = d.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation");
                l = d.getProperty("/Items/" + this._SelectedTableIndex + "/StockType_selectedKey");
                if (d.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input") === undefined) {
                    n = d.getProperty("/SpecialStock_input");
                    d.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input", n)
                }
                if (e.getParameter("valid") === false || e.getParameters().value === "") {
                    u = sap.ui.core.ValueState.Error;
                    d.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", u)
                } else {
                    d.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", u)
                }
            } else {
                var m = this.getView().getModel("oItem");
                var S = this.getView().getModel("oFrontend");
                a = e.getParameter("selectedItem").getText();
                t = e.getParameter("selectedItem").getAdditionalText();
                m.setProperty("/Material_Input", t);
                m.setProperty("/Material_Name", a);
                m.setProperty("/Material_Input_valueState", sap.ui.core.ValueState.None);
                m.setProperty("/Material_Input_valueStateText", "");
                m.setProperty("/Batch", "");
                if (m.setProperty("/SpecialStock_selectedKey") === "K") {
                    m.setProperty("/Lifnr", "");
                    m.setProperty("/Lifname", "");
                    m.setProperty("/Lifnr_State", sap.ui.core.ValueState.None);
                    m.setProperty("/Lifnr_StateText", "");
                    m.setProperty("/SpecialStock_input_State", sap.ui.core.ValueState.None);
                    var p = m.getData();
                    if (p.SpecialStock_input !== undefined && p.SpecialStock_input.length > 0) {
                        for (var g = 0; g < p.SpecialStock_input.length; g++) {
                            if (p.SpecialStock_input[g].key === "") {
                                var h = p.SpecialStock_input[g].text;
                                break
                            }
                        }
                        m.setProperty("/SpecialStock_selectedKey", "");
                        m.setProperty("/InventorySpecialStockTypeName", h);
                        m.setProperty("/Lifnr_inputMandatory", false)
                    }
                }
                if (m.getProperty("/SpecialStock_input") === undefined) {
                    n = S.getProperty("/SpecialStock_input");
                    m.setProperty("/SpecialStock_input", n)
                }
                r = m.getProperty("/Plant");
                s = m.getProperty("/DeliveredUnit_input");
                o = m.getProperty("/StorageLocation");
                l = m.getProperty("/StockType_selectedKey");
                if (e.getParameter("valid") === false || e.getParameters().value === "") {
                    u = sap.ui.core.ValueState.Error;
                    m.setProperty("/Material_Input_valueState", u)
                } else {
                    m.setProperty("/Material_Input_valueState", u)
                }
                this._setValueStateMandatoryFields(m.getData());
                r = m.getProperty("/Plant")
            }
            this._handleValidationMasterData(t, s, r, o, this._SelectedTableIndex);
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                r = d.getProperty("/Items/" + this._SelectedTableIndex + "/Plant")
            } else {
                r = m.getProperty("/Plant")
            }
            this._getControlFields(t, r, this._SelectedTableIndex, l)
        },
        _getControlFields: function (e, t, a, r) {
            if (r === undefined || r === "" || r === 0) {
                r = 0
            } else {
                r = r - 1
            }
            this.getOwnerComponent().getModel("oData").callFunction("/MatlPlntControlDpdtFields", {
                method: "GET",
                urlParameters: {
                    Material: e,
                    Plant: t,
                    SourceOfGR: this._SourceOfGR
                },
                success: jQuery.proxy(this._successControlFieldsLoad, this, a, r),
                error: jQuery.proxy(this._handleOdataError, this)
            })
        },
        _successControlFieldsLoad: function (e, t, a, r) {
            var i = this.getView().getModel("oFrontend");
            var s = i.getProperty("/Items");
            var o = new Array;
            var l;
            var n;
            if (a.results[0]) {
                for (var u = 0; u < a.results.length; u++) {
                    o.push({
                        key: a.results[u].StockType,
                        text: a.results[u].StockTypeName,
                        ControlOfBatchTableField: a.results[u].ControlOfBatchTableField,
                        ControlOfReasonCodeTableField: a.results[u].ControlOfReasonCodeTableField,
                        ControlOfExpirationDate: a.results[u].ControlOfExpirationDate,
                        ControlOfManufactureDate: a.results[u].ControlOfManufactureDate,
                        StorLocAutoCreationIsAllowed: a.results[u].StorLocAutoCreationIsAllowed
                    })
                }
            } else {
                o.push({
                    key: "",
                    text: "",
                    ControlOfBatchTableField: "00000",
                    ControlOfReasonCodeTableField: "00000",
                    ControlOfExpirationDate: "00000",
                    ControlOfManufactureDate: "00000",
                    StorLocAutoCreationIsAllowed: "00000"
                })
            }
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S2Custom") {
                var p = this.getView().getModel("oItem").getData();
                if (a.results[t] !== undefined) {
                    this._evaluateFieldControl("Batch", a.results[t].ControlOfBatchTableField, p);
                    this._evaluateFieldControl("GoodsMovementReasonCode", a.results[t].ControlOfReasonCodeTableField, p);
                    this._evaluateFieldControl("ShelfLifeExpirationDate", a.results[t].ControlOfExpirationDate, p);
                    this._evaluateFieldControl("ManufactureDate", a.results[t].ControlOfManufactureDate, p)
                }
                this.getView().getModel("oItem").setProperty("/StockType_input", o);
                if (p.BatchVisible === true) {
                    this.getView().getModel("oItem").setProperty("/ColumnBatchVisible", true);
                    this.getView().getModel("oItem").setProperty("/BatchVisible", true)
                } else {
                    this.getView().getModel("oItem").setProperty("/ColumnBatchVisible", false);
                    this.getView().getModel("oItem").setProperty("/Batch_valueState", sap.ui.core.ValueState.None)
                }
                if (p.ManufactureDateVisible === true) {
                    this.getView().getModel("oItem").setProperty("/ColumnManufactureDateVisible", true)
                } else {
                    this.getView().getModel("oItem").setProperty("/ColumnManufactureDateVisible", false);
                    this.getView().getModel("oItem").setProperty("/ManufactureDate_valueState", sap.ui.core.ValueState.None)
                }
                if (p.ShelfLifeExpirationDateVisible === true) {
                    this.getView().getModel("oItem").setProperty("/ColumnShelfLifeExpirationDateVisible", true)
                } else {
                    this.getView().getModel("oItem").setProperty("/ColumnShelfLifeExpirationDateVisible", false);
                    this.getView().getModel("oItem").setProperty("/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None)
                }
                this.getView().getModel("oItem").setData(p);
                this._setReasonCodeFilter(p)
            } else {
                this.getView().getModel("oFrontend").setProperty("/Items/" + e + "/StockType_input", o);
                if (a.results[t] !== undefined) {
                    this._evaluateFieldControl("Batch", a.results[t].ControlOfBatchTableField, s[e]);
                    this._evaluateFieldControl("GoodsMovementReasonCode", a.results[t].ControlOfReasonCodeTableField, s[e]);
                    this._evaluateFieldControl("ShelfLifeExpirationDate", a.results[t].ControlOfExpirationDate, s[e]);
                    this._evaluateFieldControl("ManufactureDate", a.results[t].ControlOfManufactureDate, s[e])
                }
                if (s[e].ManufactureDateVisible === true) {
                    this.getView().getModel("oFrontend").setProperty("/ColumnManufactureDateVisible", true)
                } else {
                    this.getView().getModel("oFrontend").setProperty("/ColumnManufactureDateVisible", false);
                    this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/ManufactureDate_valueState", sap.ui.core.ValueState.None)
                }
                if (s[e].ShelfLifeExpirationDateVisible === true) {
                    this.getView().getModel("oFrontend").setProperty("/ColumnShelfLifeExpirationDateVisible", true)
                } else {
                    this.getView().getModel("oFrontend").setProperty("/ColumnShelfLifeExpirationDateVisible", false);
                    this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/ShelfLifeExpirationDate_valueState", sap.ui.core.ValueState.None)
                }
                sap.ui.getCore().getMessageManager().removeAllMessages();
                for (var u = 0; u < s.length; u++) {
                    var g = i.getProperty("/Items/" + u + "/DocumentItem");
                    if (i.getProperty("/Items/" + u + "/ManufactureDate_valueState") === sap.ui.core.ValueState.Error || i.getProperty("/Items/" + u + "/ShelfLifeExpirationDate_valueState") === sap.ui.core.ValueState.Error) {
                        var h = new c({
                            message: this.getResourceBundle().getText("TITLE_ERROR_DETAILVIEW"),
                            type: d.Error,
                            target: "Special Stock",
                            processor: i,
                            additionalText: this.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [g]),
                            description: this.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [g])
                        });
                        sap.ui.getCore().getMessageManager().addMessages(h)
                    }
                }
                if (s[e].BatchVisible === true) {
                    this.getView().getModel("oFrontend").setProperty("/ColumnBatchVisible", true)
                } else {
                    for (var u = 0; u < s.length; u++) {
                        this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/BatchVisible", false);
                        if (s[u].BatchVisible === true) {
                            n = true;
                            return
                        }
                    }
                    if (n === true) {
                        this.getView().getModel("oFrontend").setProperty("/ColumnBatchVisible", false);
                        this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/Batch_valueState", sap.ui.core.ValueState.None)
                    }
                }
                p = i.getProperty("/Items/" + e);
                this._setValueStateMandatoryFields(p);
                i.setProperty("/Items/" + e, p);
                this._setSelectEnabled(i.getProperty("/Items/" + this._SelectedTableIndex));
                this._controlSelectAllAndPostButton();
                this._updateHiglightProperty()
            }
        },
        _handleValidationMasterData: function (e, t, a, r, i) {
            var s = {};
            var o;
            this._SelectedTableIndex = i;
            this._oValueHelpController.validateMasterData(e, t, a, r, this._validationCallbBack, this)
        },
        _validationCallbBack: function (e) {
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                var t = this.getView().getModel("oFrontend");
                if (e.bMaterialIsValid !== true) {
                    t.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input", "");
                    t.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", sap.ui.core.ValueState.Error);
                    t.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueStateText", "")
                }
                if (e.bUoMIsValid !== true) {
                    t.setProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input", "")
                }
                if (e.bPlantIsValid !== true) {
                    t.setProperty("/Items/" + this._SelectedTableIndex + "/Plant", "");
                    t.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_input", "");
                    t.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_valueState", sap.ui.core.ValueState.None);
                    t.setProperty("/Items/" + this._SelectedTableIndex + "/Plant_valueStateText", "")
                }
                if (e.bStorageLocationIsValid !== true) {
                    t.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation", "");
                    t.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation_input", "");
                    t.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation_valueState", sap.ui.core.ValueState.None);
                    t.setProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation_valueStateText", "");
                    t.setProperty("/Items/" + this._SelectedTableIndex + "/BatchEditable", false)
                }
            } else {
                var a = this.getView().getModel("oItem");
                if (e.bMaterialIsValid !== true) {
                    a.setProperty("/Material_Input", "");
                    a.setProperty("/Material_Input_valueState", sap.ui.core.ValueState.Error);
                    a.setProperty("/Material_Input_valueStateText", "")
                }
                if (e.bUoMIsValid !== true) {
                    a.setProperty("/DeliveredUnit_input", "")
                }
                if (e.bPlantIsValid !== true) {
                    a.setProperty("/Plant", "");
                    a.setProperty("/Plant_input", "");
                    a.setProperty("/Plant_valueState", sap.ui.core.ValueState.None);
                    a.setProperty("/Plant_valueStateText", "")
                }
                if (e.bStorageLocationIsValid !== true) {
                    a.setProperty("/StorageLocation", "");
                    a.setProperty("/StorageLocation_input", "");
                    a.setProperty("/StorageLocation_valueState", sap.ui.core.ValueState.None);
                    a.setProperty("/StorageLocation_valueStateText", "");
                    a.setProperty("/BatchEditable", false)
                }
            }
            this._setGuidedTour(this._SelectedTableIndex)
        },
        _setGuidedTour: function (e) {
            var t;
            var a = this.getModel("oFrontend");
            var r;
            var i;
            var s;
            var o;
            var l;
            var n;
            var u = true;
            var p;
            var g;
            var h;
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                var m = this.getView().getModel("oFrontend");
                var S;
                S = m.getProperty("/Items");
                var f = this.getView().byId("idProductsTable").getItems();
                for (var _ = 0; _ < S.length; _++) {
                    if (m.getProperty("/Items/" + _ + "/Material_Input") !== "") {
                        h = this._oValueHelpController.getBufferOfMaterial(m.getProperty("/Items/" + _ + "/Material_Input"));
                        r = h.Material;
                        s = h.AUoM;
                        o = h.Plant;
                        l = h.StorageLocation;
                        m.setProperty("/Items/" + _ + "/DeliveredQuantityEditable", true);
                        if (s.AUoMCollection.length === 1) {
                            m.setProperty("/Items/" + _ + "/DeliveredUnit_input", h.AUoM.AUoMCollection[0].BaseUnit)
                        }
                        m.setProperty("/Items/" + _ + "/DeliveredUnitEditable", true);
                        if (m.getProperty("/Items/" + _ + "/DeliveredQuantity_input") !== 0) {
                            if (m.getProperty("/Items/" + _ + "/DeliveredUnit_input") !== "") {
                                if (o.PlantCollection.length === 1) {
                                    m.setProperty("/Items/" + _ + "/Plant_input", h.Plant.PlantCollection[0].PlantName);
                                    m.setProperty("/Items/" + _ + "/Plant", h.Plant.PlantCollection[0].Plant);
                                    this._getControlFields(m.getProperty("/Items/" + _ + "/Material_Input"), h.Plant.PlantCollection[0].Plant, _, "")
                                }
                                m.setProperty("/Items/" + _ + "/Plant_input_editable", true);
                                if (m.getProperty("/Items/" + _ + "/Plant_input") !== "") {
                                    g = l[m.getProperty("/Items/" + _ + "/Plant")].StorageLocationCollection;
                                    var I = 0;
                                    var y = 0;
                                    if (m.getData().Items[0].StorageLocation !== "") {
                                        var P = false;
                                        for (var v = 0; v < g.length; v++) {
                                            if (m.getProperty("/Items/" + _ + "/StorageLocation_input") === g[v].StorageLocationName) {
                                                if (m.getProperty("/Items/" + _ + "/StorageLocation") === g[v].StorageLocation) {
                                                    P = true
                                                }
                                            }
                                        }
                                        if (P === false) {
                                            m.setProperty("/Items/" + _ + "/StorageLocation", "");
                                            m.setProperty("/Items/" + _ + "/StorageLocation_input", "");
                                            m.setProperty("/Items/" + _ + "/StorageLocation_valueState", sap.ui.core.ValueState.None);
                                            m.setProperty("/Items/" + _ + "/StorageLocation_valueStateText", "")
                                        }
                                    }
                                    if (m.getData().Items[0].StorageLocation === "") {
                                        for (var v = 0; v < g.length; v++) {
                                            var b = g[v].StorLocAutoCreationIsAllowed;
                                            if (b === false) {
                                                I++;
                                                y = v
                                            }
                                        }
                                        if (I === 1) {
                                            m.setProperty("/Items/" + _ + "/StorageLocation_input", g[y].StorageLocationName);
                                            m.setProperty("/Items/" + _ + "/StorageLocation", g[y].StorageLocation);
                                            this._getControlFields(m.getProperty("/Items/" + _ + "/Material_Input"), m.getProperty("/Items/" + _ + "/Plant"), _, "")
                                        } else if (I === 0 && g.length === 1) {
                                            m.setProperty("/Items/" + _ + "/StorageLocation_input", g[0].StorageLocationName);
                                            m.setProperty("/Items/" + _ + "/StorageLocation", g[0].StorageLocation);
                                            this._getControlFields(m.getProperty("/Items/" + _ + "/Material_Input"), m.getProperty("/Items/" + _ + "/Plant"), _, "")
                                        }
                                    }
                                    m.setProperty("/Items/" + _ + "/StorageLocationEditable", true);
                                    if (m.getProperty("/Items/" + _ + "/StorageLocation_input") !== "") {
                                        m.setProperty("/Items/" + _ + "/StockTypeNOREFEnabled", true);
                                        m.setProperty("/Items/" + _ + "/SpecialStockSelection_Visible", true);
                                        m.setProperty("/Items/" + _ + "/BatchEditable", true)
                                    } else {
                                        m.setProperty("/Items/" + _ + "/BatchEditable", false)
                                    }
                                } else {
                                    m.setProperty("/Items/" + _ + "/StorageLocationEditable", false)
                                }
                            } else {
                                m.setProperty("/Items/" + _ + "/Plant_input_editable", false);
                                m.setProperty("/Items/" + _ + "/StorageLocationEditable", false)
                            }
                        } else {
                            m.setProperty("/Items/" + _ + "/Plant_input_editable", false);
                            m.setProperty("/Items/" + _ + "/StorageLocationEditable", false)
                        }
                    }
                    this._setValueStateMandatoryFields(m.getProperty("/Items/" + _))
                }
                var D = e + 0;
                if (m.getProperty("/Items/" + e + "/Material_Input") !== "") {
                    f[D].getCells()[8].getContent()[0].focus();
                    if (m.getProperty("/Items/" + e + "/DeliveredQuantity_input") !== 0) {
                        f[D].getCells()[8].getContent()[1].focus();
                        if (m.getProperty("/Items/" + e + "/DeliveredUnit_input") !== "") {
                            f[D].getCells()[10].focus();
                            if (m.getProperty("/Items/" + e + "/Plant_input") !== "") {
                                f[D].getCells()[12].focus();
                                if (m.getProperty("/Items/" + e + "/StorageLocation_input") !== "" && m.getProperty("/Items/" + e + "/BatchVisible") === true) {
                                    f[D].getCells()[16].focus()
                                }
                            }
                        }
                    }
                }
                sap.ui.getCore().getMessageManager().removeAllMessages();
                for (var T = 0; T < S.length; T++) {
                    var M = m.getProperty("/Items/" + T + "/DocumentItem");
                    if (m.getProperty("/Items/" + T + "/ManufactureDate_valueState") === sap.ui.core.ValueState.Error || m.getProperty("/Items/" + T + "/ShelfLifeExpirationDate_valueState") === sap.ui.core.ValueState.Error) {
                        var C = new c({
                            message: this.getResourceBundle().getText("TITLE_ERROR_DETAILVIEW"),
                            type: d.Error,
                            target: "Special Stock",
                            processor: m,
                            additionalText: this.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [M]),
                            description: this.getResourceBundle().getText("TEXT_ERROR_DETAILVIEW", [M])
                        });
                        sap.ui.getCore().getMessageManager().addMessages(C)
                    }
                }
                for (var T = 0; T < S.length; T++) {
                    p = this._validationNoRefItem(T);
                    if (p === false) {
                        m.setProperty("/PostButtonEnabled", false);
                        break
                    } else {
                        m.setProperty("/PostButtonEnabled", true)
                    }
                }
                this._updateHiglightProperty();
                if (this.getView().getModel("oFrontend").setProperty("/Items/" + e + "/ManufactureDateMandatory") === true) {
                    this.getView().getModel("oFrontend").setProperty("/Items/" + e + "/ManufactureDate_valueStateText", this.getResourceBundle().getText("PRODUCTION_VALUE_STATE_TEXT"))
                }
                if (this.getView().getModel("oFrontend").setProperty("/Items/" + e + "/ShelfLifeExpirationDateMandatory") === true) {
                    this.getView().getModel("oFrontend").setProperty("/Items/" + e + "/ShelfLifeExpirationDatee_valueStateText", this.getResourceBundle().getText("SHELFLIFE_VALUE_STATE_TEXT"))
                }
            } else {
                var E = this.getView().getModel("oItem");
                if (E.getProperty("/Material_Input") !== "") {
                    h = this._oValueHelpController.getBufferOfMaterial(E.getProperty("/Material_Input"));
                    l = h.StorageLocation;
                    E.setProperty("/DeliveredQuantityEditable", true);
                    E.setProperty("/DeliveredUnitEditable", true);
                    this.getView().byId("idQuantity").focus();
                    if (E.getProperty("/DeliveredQuantity_input") !== 0) {
                        this.getView().byId("idUOM").focus();
                        if (E.getProperty("/DeliveredUnit_input") !== "") {
                            E.setProperty("/Plant_input_editable", true);
                            this.getView().byId("idPlantInput").focus();
                            if (E.getProperty("/Plant_input") !== "") {
                                E.setProperty("/StorageLocationEditable", true);
                                this.getView().byId("idStorageLocationInput").focus();
                                if (E.getProperty("/StorageLocation_input") !== "") {
                                    g = l[E.getProperty("/Plant")].StorageLocationCollection;
                                    var P = false;
                                    for (var v = 0; v < g.length; v++) {
                                        if (E.getProperty("/StorageLocation") === g[v].StorageLocation) {
                                            if (E.getProperty("/StorageLocation_input") === g[v].StorageLocationName) {
                                                P = true
                                            }
                                        }
                                    }
                                    if (P === true) {
                                        E.setProperty("/StockTypeNOREFEnabled", true);
                                        E.setProperty("/SpecialStockSelection_Visible", true);
                                        E.setProperty("/BatchEditable", true);
                                        this.getView().byId("idBatchInput").focus();
                                        if (E.getProperty("/InventorySpecialStockType") === "E") {
                                            E.setProperty("/SalesOrder_inputMandatory", true)
                                        } else {
                                            E.setProperty("/SalesOrder_inputMandatory", false)
                                        }
                                    } else {
                                        E.setProperty("/StorageLocation", "");
                                        E.setProperty("/StorageLocation_input", "");
                                        E.setProperty("/StorageLocation_valueState", sap.ui.core.ValueState.None);
                                        E.setProperty("/StorageLocation_valueStateText", "");
                                        E.setProperty("/BatchEditable", false)
                                    }
                                }
                            } else {
                                E.setProperty("/StorageLocationEditable", false)
                            }
                        } else {
                            E.setProperty("/Plant_input_editable", false);
                            E.setProperty("/StorageLocationEditable", false)
                        }
                    } else {
                        E.setProperty("/Plant_input_editable", false);
                        E.setProperty("/StorageLocationEditable", false)
                    }
                }
                this._setValueStateMandatoryFields(E);
                p = this._validationNoRefItem();
                if (p === false) {
                    E.setProperty("/ApplyButtonEnabled", false)
                } else {
                    E.setProperty("/ApplyButtonEnabled", true)
                }
                this._updateItemHiglightProperty();
                if (this.getView().getModel("oFrontend").setProperty("/Items/" + e + "/ManufactureDateMandatory") === true) {
                    this.getView().getModel("oFrontend").setProperty("/Items/" + e + "/ManufactureDate_valueStateText", this.getResourceBundle().getText("PRODUCTION_VALUE_STATE_TEXT"))
                }
                if (this.getView().getModel("oFrontend").setProperty("/Items/" + e + "/ShelfLifeExpirationDateMandatory") === true) {
                    this.getView().getModel("oFrontend").setProperty("/Items/" + e + "/ShelfLifeExpirationDatee_valueStateText", this.getResourceBundle().getText("SHELFLIFE_VALUE_STATE_TEXT"))
                }
                sap.ui.getCore().getMessageManager().removeAllMessages()
            }
        },
        handleSalesOrderValueHelp: function (e) {
            var t = this.getView().getModel("oItem").getProperty("/SpecialStock_selectedKey");
            var a = this;
            if (!this._oSalesOrderValueHelpDialog) {
                this._oSalesOrderValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                    supportMultiselect: false,
                    supportRanges: false,
                    supportRangesOnly: false,
                    ok: function (e) {
                        var t = e.getParameter("tokens");
                        var r = t[t.length - 1].data();
                        a.getView().getModel("oItem").setProperty("/SalesOrder", r.row.SalesOrder);
                        a.getView().getModel("oItem").setProperty("/SalesOrderItem", r.row.SalesOrderItem);
                        a._setGuidedTour();
                        a.getView().byId("idSalesOrderDocumentSpecialStockInputText").focus();
                        a._oSalesOrderValueHelpDialog.close();
                        a._oSalesOrderValueHelpDialog.destroy();
                        a._oSalesOrderValueHelpDialog = undefined
                    },
                    cancel: function (e) {
                        a._oSalesOrderValueHelpDialog.close()
                    }
                });
                this._oSalesOrderValueHelpDialog.setKeys(["SalesOrder", "SalesOrderItem"]);
                var r = "";
                var i = new sap.ui.comp.filterbar.FilterBar({
                    advancedMode: true,
                    expandAdvancedArea: true,
                    search: function (e) {
                        var t = sap.ui.getCore().byId("idSalesOrderSearch");
                        var r = t.getValue();
                        var i = {};
                        if (r.length > 0) {
                            var i = {
                                custom: {
                                    search: r
                                }
                            };
                            a._oSalesOrderValueHelpDialog.getTable().bindAggregation("rows", {
                                path: "/MMIMSalesOrderVH",
                                parameters: i
                            })
                        } else {
                            a._oSalesOrderValueHelpDialog.getTable().bindAggregation("rows", {
                                path: "/MMIMSalesOrderVH"
                            })
                        }
                    }
                });
                i.setBasicSearch(new sap.m.SearchField({
                    id: "idSalesOrderSearch",
                    value: r,
                    tooltip: this.getResourceBundle().getText("SEARCH_FIELD_TOOLTIP"),
                    showSearchButton: false,
                    search: function (e) {
                        a._oSalesOrderValueHelpDialog.getFilterBar().search()
                    }
                }));
                this._oSalesOrderValueHelpDialog.setFilterBar(i);
                this._oSalesOrderValueHelpDialog.setModel(this.getOwnerComponent().getModel("oData"))
            }
            this._oSalesOrderValueHelpDialog.setTitle(a.getResourceBundle().getText("SALES_ORDER"));
            var s = [{
                label: a.getResourceBundle().getText("SALES_ORDER"),
                template: "SalesOrder"
            }, {
                label: a.getResourceBundle().getText("LABEL_SALES_ORDER_ITEMS"),
                template: "SalesOrderItem"
            }, {
                label: a.getResourceBundle().getText("LABEL_MATERIAL_COL"),
                template: "Material"
            }, {
                label: a.getResourceBundle().getText("TABLE_COLUMN_PLANT_TEXT"),
                template: "Plant"
            }, {
                label: a.getResourceBundle().getText("SOLD_TO_PARTY"),
                template: "SoldToParty"
            }, {
                label: a.getResourceBundle().getText("CUSTOMER"),
                template: "Customer"
            }, {
                label: a.getResourceBundle().getText("SALES_ORGANIZATION"),
                template: "SalesOrganization"
            }, {
                label: a.getResourceBundle().getText("DISTRIBUTION_CHANNEL"),
                template: "DistributionChannel"
            }, {
                label: a.getResourceBundle().getText("DIVISION"),
                template: "OrganizationDivision"
            }, {
                label: a.getResourceBundle().getText("SALES_ORDER_TYPE"),
                template: "SalesOrderType"
            }];
            var o = "SalesOrder,SalesOrderItem,Material,Plant,SoldToParty,Customer,SalesOrganization, DistributionChannel,OrganizationDivision, SalesOrderType";
            this._oSalesOrderValueHelpDialog.getTable().bindAggregation("rows", {
                path: "/MMIMSalesOrderVH"
            });
            var l = new sap.ui.model.json.JSONModel;
            l.setData({
                cols: s
            });
            this._oSalesOrderValueHelpDialog.setModel(l, "columns");
            this._oSalesOrderValueHelpDialog.TableStateDataFilled();
            this._oSalesOrderValueHelpDialog.open()
        },
        handleWBSValueHelp: function (e) {
            var t = this.getView().getModel("oItem").getProperty("/SpecialStock_selectedKey");
            var a = this;
            if (!this._oWBSValueHelpDialog) {
                this._oWBSValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                    supportMultiselect: false,
                    supportRanges: false,
                    supportRangesOnly: false,
                    ok: function (e) {
                        var t = e.getParameter("tokens");
                        var r = t[t.length - 1].data();
                        a.getView().getModel("oItem").setProperty("/Project", r.row.WBSElement);
                        a.getView().getModel("oItem").setProperty("/ProjectDescription", r.row.WBSDescription);
                        a._setGuidedTour();
                        a.getView().byId("idProjectNameSpecialStockText").focus();
                        a._oWBSValueHelpDialog.close();
                        a._oWBSValueHelpDialog.destroy();
                        a._oWBSValueHelpDialog = undefined
                    },
                    cancel: function (e) {
                        a._oWBSValueHelpDialog.close()
                    }
                });
                this._oWBSValueHelpDialog.setKey("WBSElement");
                this._oWBSValueHelpDialog.setDescriptionKey("WBSElement");
                var r = "";
                var i = new sap.ui.comp.filterbar.FilterBar({
                    advancedMode: true,
                    expandAdvancedArea: true,
                    search: function (e) {
                        var t = sap.ui.getCore().byId("idWBSSearch");
                        var r = t.getValue();
                        var i = {};
                        if (r.length > 0) {
                            var i = {
                                custom: {
                                    search: r
                                }
                            };
                            a._oWBSValueHelpDialog.getTable().bindAggregation("rows", {
                                path: "/MMIMWBSElementVH",
                                parameters: i
                            })
                        } else {
                            a._oWBSValueHelpDialog.getTable().bindAggregation("rows", {
                                path: "/MMIMWBSElementVH"
                            })
                        }
                    }
                });
                i.setBasicSearch(new sap.m.SearchField({
                    id: "idWBSSearch",
                    value: r,
                    tooltip: this.getResourceBundle().getText("SEARCH_FIELD_TOOLTIP"),
                    showSearchButton: false,
                    search: function (e) {
                        a._oWBSValueHelpDialog.getFilterBar().search()
                    }
                }));
                this._oWBSValueHelpDialog.setFilterBar(i);
                this._oWBSValueHelpDialog.setModel(this.getOwnerComponent().getModel("oData"))
            }
            this._oWBSValueHelpDialog.setTitle(a.getResourceBundle().getText("WBS_ELEMENT"));
            var s = [{
                label: a.getResourceBundle().getText("WBS_ELEMENT"),
                template: "WBSElement"
            }, {
                label: a.getResourceBundle().getText("WBS_DESCRIPTION"),
                template: "WBSDescription"
            }, {
                label: a.getResourceBundle().getText("WBS_PROJECT"),
                template: "Project"
            }, {
                label: a.getResourceBundle().getText("WBS_PROJECT_DESCRIPTION"),
                template: "ProjectDescription"
            }];
            var o = "WBSElement,WBSDescription,Project,ProjectDescription";
            this._oWBSValueHelpDialog.getTable().bindAggregation("rows", {
                path: "/MMIMWBSElementVH"
            });
            var l = new sap.ui.model.json.JSONModel;
            l.setData({
                cols: s
            });
            this._oWBSValueHelpDialog.setModel(l, "columns");
            this._oWBSValueHelpDialog.TableStateDataFilled();
            this._oWBSValueHelpDialog.open()
        },
        handleLifnrValueHelp: function (e) {
            var t = this.getView().getModel("oItem").getProperty("/SpecialStock_selectedKey");
            var a = this;
            var r;
            var i = [];
            var s = this.getView().getModel("oItem").getProperty("/Material_Input");
            if (t === "K") {
                var o = this.getView().getModel("oItem");
                o.setDefaultBindingMode(sap.ui.model.BindingMode.TwoWay);
                this.getView().setModel(o);
                i.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, s));
                this.getOwnerComponent().getModel("oData").read("/MMIMSupplierMaterialVH", {
                    filters: i,
                    success: jQuery.proxy(this._successSupplierLoad, this),
                    error: jQuery.proxy(this._handleOdataError, this)
                })
            }
            i.push(new sap.ui.model.Filter("Material", sap.ui.model.FilterOperator.EQ, s));
            if (!this._oLifnrValueHelpDialog) {
                this._oLifnrValueHelpDialog = new sap.ui.comp.valuehelpdialog.ValueHelpDialog({
                    supportMultiselect: false,
                    supportRanges: false,
                    supportRangesOnly: false,
                    ok: function (e) {
                        var t = e.getParameter("tokens");
                        var r = t[t.length - 1].data();
                        a.getView().getModel("oItem").setProperty("/Lifnr", r.row.Supplier);
                        a.getView().getModel("oItem").setProperty("/Lifname", r.row.SupplierName);
                        a._setGuidedTour();
                        a.getView().byId("idVendorNameSpecialStockInputText").focus();
                        a._oLifnrValueHelpDialog.close();
                        a._oLifnrValueHelpDialog.destroy();
                        a._oLifnrValueHelpDialog = undefined
                    },
                    cancel: function (e) {
                        a._oLifnrValueHelpDialog.close()
                    }
                });
                this._oLifnrValueHelpDialog.setKey("Supplier");
                this._oLifnrValueHelpDialog.setDescriptionKey("Supplier");
                var l = "";
                var n = new sap.ui.comp.filterbar.FilterBar({
                    advancedMode: true,
                    expandAdvancedArea: true,
                    search: function (e) {
                        var r = sap.ui.getCore().byId("idLifnrSearch");
                        var s = r.getValue();
                        var o = {};
                        if (s.length > 0) {
                            var o = {
                                custom: {
                                    search: s
                                }
                            };
                            switch (t) {
                                case "K":
                                    a._oLifnrValueHelpDialog.getTable().bindAggregation("rows", {
                                        path: "/MMIMSupplierMaterialVH",
                                        parameters: o,
                                        filters: i
                                    });
                                    break;
                                default:
                                    a._oLifnrValueHelpDialog.getTable().bindAggregation("rows", {
                                        path: "/MMIMSupplierGeneralVH",
                                        parameters: o
                                    });
                                    break
                            }
                        } else {
                            switch (t) {
                                case "K":
                                    a._oLifnrValueHelpDialog.getTable().bindAggregation("rows", {
                                        path: "/MMIMSupplierMaterialVH",
                                        filters: i
                                    });
                                    break;
                                default:
                                    a._oLifnrValueHelpDialog.getTable().bindAggregation("rows", {
                                        path: "/MMIMSupplierGeneralVH"
                                    });
                                    break
                            }
                        }
                    }
                });
                n.setBasicSearch(new sap.m.SearchField({
                    id: "idLifnrSearch",
                    value: l,
                    tooltip: this.getResourceBundle().getText("SEARCH_FIELD_TOOLTIP"),
                    showSearchButton: false,
                    search: function (e) {
                        a._oLifnrValueHelpDialog.getFilterBar().search()
                    }
                }));
                this._oLifnrValueHelpDialog.setFilterBar(n);
                this._oLifnrValueHelpDialog.setModel(this.getOwnerComponent().getModel("oData"))
            }
            this._oLifnrValueHelpDialog.setTitle(a.getResourceBundle().getText("SUPPLIER"));
            switch (t) {
                case "K":
                    r = [{
                        label: a.getResourceBundle().getText("SUPPLIER"),
                        template: "Supplier"
                    }, {
                        label: a.getResourceBundle().getText("SUPPLIERNAME"),
                        template: "SupplierName"
                    }, {
                        label: a.getResourceBundle().getText("COMPANYCODE"),
                        template: "CompanyCode"
                    }, {
                        label: a.getResourceBundle().getText("COUNTRY"),
                        template: "Country"
                    }, {
                        label: a.getResourceBundle().getText("POSTALCODE"),
                        template: "PostalCode"
                    }, {
                        label: a.getResourceBundle().getText("CITYNAME"),
                        template: "CityName"
                    }];
                    break;
                default:
                    r = [{
                        label: a.getResourceBundle().getText("SUPPLIER"),
                        template: "Supplier"
                    }, {
                        label: a.getResourceBundle().getText("SUPPLIERNAME"),
                        template: "SupplierName"
                    }, {
                        label: a.getResourceBundle().getText("COUNTRY"),
                        template: "Country"
                    }, {
                        label: a.getResourceBundle().getText("POSTALCODE"),
                        template: "PostalCode"
                    }, {
                        label: a.getResourceBundle().getText("CITYNAME"),
                        template: "CityName"
                    }];
                    break
            }
            var u = "Supplier,SupplierName,Country,PostalCode,CityName";
            switch (t) {
                case "K":
                    this._oLifnrValueHelpDialog.getTable().bindAggregation("rows", {
                        path: "/MMIMSupplierMaterialVH",
                        filters: i
                    });
                    break;
                default:
                    this._oLifnrValueHelpDialog.getTable().bindAggregation("rows", {
                        path: "/MMIMSupplierGeneralVH"
                    });
                    break
            }
            var d = new sap.ui.model.json.JSONModel;
            d.setData({
                cols: r
            });
            this._oLifnrValueHelpDialog.setModel(d, "columns");
            this._oLifnrValueHelpDialog.TableStateDataFilled();
            this._oLifnrValueHelpDialog.open()
        },
        _updateItemHiglightProperty: function () {
            var e = this.getView().getModel("oItem");
            var t = function (e) {
                var t = sap.ui.core.MessageType.None;
                for (var a in e) {
                    if (a.indexOf("_valueState") > 0 && a.indexOf("_valueStateText") < 0) {
                        if (e[a] === sap.ui.core.ValueState.Error) {
                            t = sap.ui.core.MessageType.Error
                        } else {
                            if (e[a] === sap.ui.core.ValueState.Warning && t === sap.ui.core.MessageType.None) {
                                t = sap.ui.core.MessageType.Warning
                            }
                        }
                    }
                }
                return t
            };
            e.setProperty("/highlight", t(e))
        },
        handleAppylyAndNewButtonPress: function (e) {
            var t = this.getModel("oItem").getData();
            var a = this.getModel("oFrontend");
            var r = a.getProperty("/Items");
            var i;
            if (this._aExtendedFields && this._aExtendedFields.length > 0) {
                var s = this.getView().byId("idExtensionForm").getElementBinding().getBoundContext().getObject();
                for (var l = 0; l < this._aExtendedFields.length; l++) {
                    if (this._isExtendedField(this._aExtendedFields[l].name) === true) {
                        t[this._aExtendedFields[l].name] = s[this._aExtendedFields[l].name]
                    }
                }
            }
            var n = 0;
            if (r) {
                for (var l = 0; l < r.length; l++) {
                    if (r[l].DocumentItem === t.DocumentItem && r[l].ItemCounter === t.ItemCounter) {
                        r[l] = t
                    }
                    if (n < parseInt(r[l].DocumentItem)) {
                        n = parseInt(r[l].DocumentItem)
                    }
                    if (r[l].Selected) {
                        a.setProperty("/CopyButtonVisible", true);
                        a.setProperty("/DeleteButtonVisible", true)
                    }
                }
                a.setProperty("/Items", r)
            }
            var u = this.getView().getModel("oItem");
            var d = u.getProperty("/DocumentItem");
            var c;
            c = this.getResourceBundle().getText("ITEM_APPLIED", [d]);
            o.show(c);
            this._getInitialItem(n);
            var p = this._validationNoRefItem();
            if (p === false) {
                a.setProperty("/PostButtonEnabled", false)
            } else {
                a.setProperty("/PostButtonEnabled", true)
            }
            var g = n++;
            var h = sap.ui.core.UIComponent.getRouterFor(this);
            var m = null;
            if (this.getView().byId("idBatchLabel").getVisible() === true && this.getView().byId("idBatchLabel").getFields().length > 1) {
                m = this.getView().byId("idBatchLabel").removeField("idCreateBatchButton")
            }
            if (m) {
                m.detachPress(this.handleCreateBatch, this).destroy()
            }
            a.setProperty("/ColumnStorageBinVisible", this._isStorageBinInItems(a.getData().Items));
            h.navTo("subscreen", {
                POItem: g
            }, true)
        },
        _loadAttachmentComponentNOREF: function () {
            try {
                var e = this.getView().getModel("oFrontend");
                var t = this.getUniqueKey();
                var a = "I";
                var r = "BUS2017";
                var i = this;
                this.temp_objectKey = "GR" + t;
                if (!this.oCompAttachProj) {
                    if (this.getOwnerComponent().getModel("oDataHelp").getServiceMetadata().dataServices.schema[0].entityType.length >= 15) {
                        this.oCompAttachProj = this.getOwnerComponent().createComponent({
                            usage: "attachmentReuseComponent",
                            settings: {
                                mode: a,
                                objectKey: this.temp_objectKey,
                                objectType: r
                            }
                        });
                        this.oCompAttachProj.then(function (e) {
                            i.byId("idastestcompContainer").setComponent(e)
                        })
                    } else {
                        e.setProperty("/AttachmentVisible", false)
                    }
                }
            } catch (t) {
                e.setProperty("/AttachmentVisible", false)
            }
        },
        handleNavButtonPressNew: function (e) {
            var t = this.getModel("oItem").getData();
            var a = this.getView().getModel("oItem");
            var r = this.getModel("oFrontend");
            var i = r.getProperty("/Items");
            var s;
            var o = false;
            var l;
            if (this._aExtendedFields && this._aExtendedFields.length > 0) {
                var n = this.getView().byId("idExtensionForm").getElementBinding().getBoundContext().getObject();
                for (var u = 0; u < this._aExtendedFields.length; u++) {
                    if (this._isExtendedField(this._aExtendedFields[u].name) === true) {
                        t[this._aExtendedFields[u].name] = n[this._aExtendedFields[u].name]
                    }
                }
            }
            if (i) {
                for (var u = 0; u < i.length; u++) {
                    if (i[u].DocumentItem === t.DocumentItem && i[u].ItemCounter === t.ItemCounter) {
                        for (var d in t) {
                            if (d.indexOf("ApplyButton") < 0 && d.indexOf("CancelButton") < 0 && d.indexOf("ItemCounter") < 0 && (d.indexOf("Selected") < 0 && d.indexOf("GoodsMovementReasonCode_selectedKey") < 0)) {
                                if (i[u][d] === undefined && d.indexOf("ApplyButton") < 0 && d.indexOf("CancelButton") < 0) {
                                    o = true;
                                    break
                                } else {
                                    if (i[u][d].toString() !== t[d].toString()) {
                                        o = true;
                                        break
                                    } else if (d === "SubItems" && h.checkIfSubItemChanged(i[u], t)) {
                                        o = true;
                                        break
                                    } else {
                                        o = false
                                    }
                                }
                            }
                        }
                    }
                }
            }
            var c = false;
            var p = this;
            var g = p.getResourceBundle();
            if (o === true) {
                sap.m.MessageBox.confirm(g.getText("MESSAGE_DATA_LOSS"), {
                    icon: sap.m.MessageBox.Icon.QUESTION,
                    title: g.getText("MESSAGE_DATA_LOSS_TITLE"),
                    onClose: S,
                    styleClass: "sapUiSizeCompact",
                    initialFocus: sap.m.MessageBox.Action.CANCEL
                })
            } else {
                var m = null;
                if (this.getView().byId("idBatchLabel").getVisible() === true && this.getView().byId("idBatchLabel").getFields().length > 1) {
                    m = this.getView().byId("idBatchLabel").removeField("idCreateBatchButton")
                }
                if (m) {
                    m.detachPress(this.handleCreateBatch, this).destroy()
                }
                l = sap.ui.core.UIComponent.getRouterFor(p);
                l.navTo("fullscreen", {
                    abort: "false"
                }, true)
            }

            function S(e) {
                if (e === "OK") {
                    var t = null;
                    if (p.getView().byId("idBatchLabel").getVisible() === true && p.getView().byId("idBatchLabel").getFields().length > 1) {
                        t = p.getView().byId("idBatchLabel").removeField("idCreateBatchButton")
                    }
                    if (t) {
                        t.detachPress(p.handleCreateBatch, p).destroy()
                    }
                    l = sap.ui.core.UIComponent.getRouterFor(p);
                    l.navTo("fullscreen", {
                        abort: "false"
                    }, true)
                }
            }
        },
        handleMaterialChangeEvent: function (e) {
            var t = e.getParameters().value.toUpperCase();
            var a;
            var r;
            var i;
            var s;
            var o;
            var l = sap.ui.core.ValueState.None;
            var n;
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                this._SelectedTableIndex = this._getSelectedItemInModel(e);
                var u = this.getView().getModel("oFrontend");
                var d = u.getProperty("/Items");
                r = r = d[this._SelectedTableIndex].Plant;
                u.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input", t);
                if (u.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey") === "K") {
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr", "");
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Lifname", "");
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_State", sap.ui.core.ValueState.None);
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_StateText", "");
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input_State", sap.ui.core.ValueState.None);
                    var c = u.getProperty("/Items/" + this._SelectedTableIndex);
                    if (c.SpecialStock_input !== undefined && c.SpecialStock_input.length > 0) {
                        for (var p = 0; p < c.SpecialStock_input.length; p++) {
                            if (c.SpecialStock_input[p].key === "") {
                                var g = c.SpecialStock_input[p].text;
                                break
                            }
                        }
                        u.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_selectedKey", "");
                        u.setProperty("/Items/" + this._SelectedTableIndex + "/InventorySpecialStockTypeName", g);
                        u.setProperty("/Items/" + this._SelectedTableIndex + "/Lifnr_inputMandatory", false)
                    }
                }
                r = u.getProperty("/Items/" + this._SelectedTableIndex + "/Plant");
                s = u.getProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input");
                o = u.getProperty("/Items/" + this._SelectedTableIndex + "/StorageLocation");
                if (u.getProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input") === undefined) {
                    n = u.getProperty("/SpecialStock_input");
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/SpecialStock_input", n)
                }
                if (e.getParameter("valid") === false || e.getParameters().value === "") {
                    l = sap.ui.core.ValueState.Error;
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", l);
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueStateText", this.getResourceBundle().getText("MATERIAL_VALUE_STATE_TEXT"))
                } else {
                    u.setProperty("/Items/" + this._SelectedTableIndex + "/Material_Input_valueState", l)
                }
                if (t === "") {
                    u.setProperty("/PostButtonEnabled", false)
                }
            } else {
                var h = this.getView().getModel("oFrontend");
                var m = this.getView().getModel("oItem");
                m.setProperty("/Material_Input", t);
                if (m.getProperty("/SpecialStock_selectedKey") === "K") {
                    m.setProperty("/Lifnr", "");
                    m.setProperty("/Lifname", "");
                    m.setProperty("/Lifnr_State", sap.ui.core.ValueState.None);
                    m.setProperty("/Lifnr_StateText", "");
                    m.setProperty("/SpecialStock_input_State", sap.ui.core.ValueState.None);
                    var c = m.getData();
                    if (c.SpecialStock_input !== undefined && c.SpecialStock_input.length > 0) {
                        for (var p = 0; p < c.SpecialStock_input.length; p++) {
                            if (c.SpecialStock_input[p].key === "") {
                                var g = c.SpecialStock_input[p].text;
                                break
                            }
                        }
                        m.setProperty("/SpecialStock_selectedKey", "");
                        m.setProperty("/InventorySpecialStockTypeName", g);
                        m.setProperty("/Lifnr_inputMandatory", false)
                    }
                }
                r = m.getProperty("/Plant");
                s = m.getProperty("/DeliveredUnit_input");
                o = m.getProperty("/StorageLocation");
                if (m.getProperty("/SpecialStock_input") === undefined) {
                    n = h.getProperty("/SpecialStock_input");
                    m.setProperty("/SpecialStock_input", n)
                }
                if (e.getParameter("valid") === false || e.getParameters().value === "") {
                    l = sap.ui.core.ValueState.Error;
                    m.setProperty("/Material_Input_valueState", l);
                    m.setProperty("/Material_Input_valueStateText", this.getResourceBundle().getText("MATERIAL_VALUE_STATE_TEXT"))
                } else {
                    m.setProperty("/Material_Input_valueState", l)
                }
                this._setValueStateMandatoryFields(m.getData());
                r = m.getProperty("/Plant");
                if (t === "") {
                    m.setProperty("/ApplyButtonEnabled", false)
                }
            }
            if (t !== "") {
                this._handleValidationMasterData(t, s, r, o, this._SelectedTableIndex)
            }
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                r = u.getProperty("/Items/" + this._SelectedTableIndex + "/Plant")
            } else {
                r = m.getProperty("/Plant")
            }
            this._getControlFields(t, r, this._SelectedTableIndex)
        },
        handleUnloadingPointChangeEvent: function (e) {
            var t = e.getParameters().value;
            var a = this.getView().getModel("oItem");
            a.setProperty("/UnloadingPointName", t)
        },
        handleGoodsRecipientNameEvent: function (e) {
            var t = e.getParameters().value;
            var a = this.getView().getModel("oItem");
            a.setProperty("/GoodsRecipientName", t)
        },
        handleDocumentItemTextEvent: function (e) {
            var t = e.getParameters().value;
            var a = this.getView().getModel("oItem");
            a.setProperty("/DocumentItemText", t)
        },
        _successSpecialStockLoad: function (e, t) {
            var a = this.getView().getModel("oFrontend");
            var r = new Array;
            var i = this.getResourceBundle().getText("NONE");
            r.push({
                key: "",
                text: i
            });
            for (var s = 0; s < e.results.length; s++) {
                r.push({
                    key: e.results[s].InventorySpecialStockType,
                    text: e.results[s].InventorySpecialStockTypeName
                })
            }
            a.setProperty("/SpecialStock_input", r)
        },
        _validationNoRefItem: function (e) {
            var t;
            var a;
            var r;
            var i;
            var s;
            var o;
            var l;
            var n;
            var u;
            var d = true;
            var c = true;
            var p = true;
            var g = true;
            var h = true;
            var m;
            var S;
            if (this.getView().sViewName === "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.view.S1Custom") {
                t = this.getModel("oFrontend");
                var f = t.getData();
                var _ = t.getProperty("/Items");
                for (var I = 0; I < _.length; I++) {
                    if (_[I].Material_Input !== "") {
                        S = true;
                        break
                    }
                }
                r = t.getProperty("/Items/" + e + "/Material_Input");
                i = t.getProperty("/Items/" + e + "/DeliveredQuantity_input");
                s = t.getProperty("/Items/" + e + "/DeliveredUnit_input");
                o = t.getProperty("/Items/" + e + "/Plant_input");
                l = t.getProperty("/Items/" + e + "/StorageLocation_input");
                u = this._ItemConsistent(t.getProperty("/Items/" + e))
            } else {
                a = this.getView().getModel("oItem");
                if (r !== "") {
                    S = true
                }
                r = a.getProperty("/Material_Input");
                i = a.getProperty("/DeliveredQuantity_input");
                s = a.getProperty("/DeliveredUnit_input");
                o = a.getProperty("/Plant_input");
                l = a.getProperty("/StorageLocation_input");
                u = this._ItemConsistent(a.getData());
                if (a.getProperty("/ManufactureDateMandatory") === true && (a.getProperty("/ManufactureDate") === "" || a.getProperty("/ManufactureDate") === undefined)) {
                    d = false
                }
                if (a.getProperty("/ShelfLifeExpirationDateMandatory") === true && (a.getProperty("/ShelfLifeExpirationDate") === "" || a.getProperty("/ShelfLifeExpirationDate") === undefined)) {
                    c = false
                }
                if (a.getProperty("/InventorySpecialStockType") === "E" && (a.getProperty("/SalesOrder") === "" || a.getProperty("/SalesOrder") === undefined)) {
                    p = false
                }
                if (a.getProperty("/InventorySpecialStockType") === "Q" && (a.getProperty("/Project") === "" || a.getProperty("/Project") === undefined)) {
                    g = false
                }
                if (a.getProperty("/InventorySpecialStockType") === "K" && (a.getProperty("/Lifnr") === "" || a.getProperty("/Lifnr") === undefined)) {
                    h = false
                }
            }
            n = false;
            if (r !== "" && o !== "" && i !== "" && s !== "" && l !== "") {
                n = true
            }
            if (r === "" && (o === undefined || o === "") && i === 0 && (s === "" || s === undefined) && (l === "" || l === undefined)) {
                n = true
            }
            if (n === true && u === true && S === true && d === true && c === true && p === true && g === true && h === true) {
                m = true
            } else {
                m = false
            }
            return m
        },
        onCopilot: function (e) {
            var t = this;
            var a = e.getSource();
            if (!this._oCopilotPopover) {
                this._oCopilotPopover = sap.ui.xmlfragment("s2p.mm.im.goodsreceipt.purchaseorder.view.CoPilotChatPopover", this);
                this.getView().addDependent(this._oCopilotPopover);
                jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oCopilotPopover)
            }
            sap.cp.ui.services.CopilotApi.getChats().then(function (e) {
                t._aCopilotChats = e;
                var r = [];
                var i = {};
                for (var s = 0; s < t._aCopilotChats.length; s++) {
                    i = {};
                    i.title = t._aCopilotChats[s].getProperties().title;
                    i.createdOn = t._aCopilotChats[s].getProperties().createdOn;
                    i.guid = t._aCopilotChats[s].getProperties().guid;
                    r.push(i)
                }
                var o = new sap.ui.model.json.JSONModel({
                    ServiceName: a.getCustomData()[0].getValue(),
                    AnnotationPath: a.getCustomData()[1].getValue(),
                    ContextPath: a.getCustomData()[2].getValue(),
                    Chats: r
                });
                o.setDefaultBindingMode(sap.ui.model.BindingMode.OneWay);
                t._oCopilotPopover.setModel(o);
                t._oCopilotPopover.openBy(a)
            })
        },
        handleAddDocument2CopilotChat: function (e) {
            this._oCopilotPopover.close();
            var t = e.getSource().getBindingContext().getObject().guid;
            var a = null;
            for (var r = 0; r < this._aCopilotChats.length; r++) {
                if (this._aCopilotChats[r].getProperties().guid === t) {
                    a = r
                }
            }
            if (a !== null) {
                var i = e.getSource().getModel().getProperty("/ServiceName");
                var s = e.getSource().getModel().getProperty("/AnnotationPath");
                var l = e.getSource().getModel().getProperty("/ContextPath");
                var n = new sap.ui.model.Context(new sap.ui.model.odata.v2.ODataModel("/sap/opu/odata/sap/" + i + "/", {
                    annotationURI: "/sap/opu/odata/IWFND/CATALOGSERVICE;v=2/Annotations(TechnicalName='" + s + "',Version='0001')/$value/"
                }), l);
                var u = this;
                this._aCopilotChats[a].addObjectFromContext(n).then(function (e) {
                    o.show(u.getResourceBundle().getText("SUCCESS_MESSAGE_COPILOT"))
                })
            }
        },
        handleComponentConsiderSelect: function (e) {
            h.onHandleComponentConsiderSelect.call(this, e)
        },
        handleComponentBatchHelp: function (e) {
            h.onHandleComponentBatchHelp.call(this, e)
        },
        handleComponentQuantityInputChange: function (e) {
            h.onHandleComponentQuantityInputChange.call(this, e)
        },
        getSubItemController: function () {
            return h
        },
        _getMovementType: function (e) {
            var t = "";
            if (this._SourceOfGR !== this._SourceOfGRIsNoReference) {
                if (e.IsReturnsItem === true) {
                    t = "161"
                } else {
                    switch (e.StockType_selectedKey) {
                        case "U":
                            t = "103";
                            break;
                        case "V":
                            t = "105";
                            break;
                        case "W":
                            t = "105";
                            break;
                        case "Z":
                            t = "105";
                            break;
                        default:
                            t = "101"
                    }
                }
            } else {
                switch (e.StockType_selectedKey) {
                    case "2":
                        t = "503";
                        break;
                    case "3":
                        t = "505";
                        break;
                    default:
                        t = "501"
                }
            }
            return t
        },
        handleAssignStoBin: function (e) {
            var t = this.getView().getModel("oFrontend");
            var a = t.getProperty("/WMLStorageLocations");
            if (!a) {
                var r = this.getOwnerComponent().getModel("oData");
                r.read("/WMLStorageLocations", {
                    method: "GET",
                    success: function (r) {
                        a = [];
                        if (r.results) {
                            r.results.forEach(e => {
                                var t = Object.assign({}, e);
                                delete t.__metadata;
                                a.push(t)
                            })
                        }
                        t.setProperty("/WMLStorageLocations", a);
                        this.handleAssignStoBin(e)
                    }.bind(this),
                    error: function () {
                        t.setProperty("/WMLStorageLocations", [])
                    }
                });
                return
            }
            var i = t.getProperty("/Ebeln");
            i = i.padStart(t.getProperty("/Ebeln_maxLength"), "0");
            var s = [...t.getProperty("/Items")];
            s.sort((e, t) => {
                if (e.DocumentItem_int < t.DocumentItem_int) {
                    return -1
                }
                if (e.DocumentItem_int > t.DocumentItem_int) {
                    return 1
                }
                if (e.ItemCounter < t.ItemCounter) {
                    return -1
                }
                if (e.ItemCounter > t.ItemCounter) {
                    return 1
                }
                return 0
            });
            var o = {};
            var l = [];
            var n = 1;
            for (var u = 0; u < s.length; u++) {
                o = {};
                if (!s[u].Selected) {
                    continue
                }
                var d = s[u].StorageLocation;
                var c = a.find(e => e.StorageLocation === d && e.WMLEnabled === true);
                if (!s[u].WMLInScope && !c) {
                    continue
                }
                o.Country = "";
                var p = s[u].DeliveredQuantity_input;
                var g = s[u].DeliveredUnit_input;
                if (s[u].DeliveryCompleted) {
                    p = s[u].OrderedQuantity;
                    g = s[u].OrderedQuantityUnit
                }
                o.Quantity = p;
                o.MatDocPos = String(n).padStart(4, "0");
                o.Plant = s[u].Plant;
                o.StorageLocation = s[u].StorageLocation;
                o.StorageBin = "";
                o.Material = s[u].Material;
                o.Batch = s[u].Batch;
                o.SupplierBatch = s[u].SupplierBatch;
                o.OriginDocument = i;
                o.Order = "";
                o.Item = s[u].DocumentItem;
                o.Customer = "";
                o.QuantitySO = "";
                o.Unit = g;
                if (this._SourceOfGR === this._SourceOfGRIsProductionOrder && o.StorageLocation === "A620") {
                    o.StorageBin = "PR"
                }
                l.push(o);
                n++
            }
            if (l.length) {
                this.getView().getModel("bindata").setProperty("/Bin", l);
                this._callDialog()
            }
        },
        handleInputSupplierBatch: function (e) {
            this._SelectedTableIndex = this._getSelectedItemInModel(e);
            var t = this.byId("idProductsTable");
            var a = t.getBinding("items").oList;
            var r = a[this._SelectedTableIndex].Material,
                i = a[this._SelectedTableIndex].Plant,
                s = a[this._SelectedTableIndex].StorageLocation_input;
            var o = e.getSource().getParent();
            var l = o.getCells();
            var n = l[15];
            var u = {
                Material: r,
                Plant: i,
                SupplierBatch: e.getParameter("value")
            };
            this._getSAPBatch(u, n)
        },
        onScanSuccess: function (e) {
            if (e.getParameter("cancelled")) {
                o.show("Scan cancelled", {
                    duration: 1e3
                })
            } else {
                if (e.getParameter("text")) {
                    var t = this.getView().getModel("oFrontend");
                    var a = t.getProperty("/Items");
                    this._SelectedTableIndex = this._getSelectedItemInModel(e);
                    var r = a[this._SelectedTableIndex].Material,
                        i = a[this._SelectedTableIndex].Plant,
                        s = a[this._SelectedTableIndex].StorageLocation_input;
                    var l = e.getSource().getParent();
                    var n = l.getCells();
                    n[16].setValue(e.getParameter("text"));
                    var u = n[15];
                    var d = {
                        Material: r,
                        Plant: i,
                        SupplierBatch: e.getParameter("text")
                    };
                    this._getSAPBatch(d, u)
                } else {}
            }
        },
        closeDialog: function () {
            this._oDialog.close()
        },
        onScanError: function (e) {
            o.show("Scan failed: " + e, {
                duration: 1e3
            })
        },
        onScanLiveupdate: function (e) {},
        _callDialog: function () {
            var e = this.getView();
            if (!this._oDialog) {
                sap.ui.core.Fragment.load({
                    name: "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.fragment.BinDialog",
                    id: e.getId(),
                    controller: this
                }).then(function (e) {
                    this._oDialog = e;
                    this.getView().addDependent(e);
                    this._oDialog.open()
                }.bind(this))
            } else {
                this._oDialog.open()
            }
        },
        _getSAPBatch: function (e, t) {
            var a = [];
            this._addFilter(a, e.Material, "Material");
            this._addFilter(a, e.Plant, "Plant");
            this._addFilter(a, e.SupplierBatch, "SupplierBatch");
            var r = this.getOwnerComponent().getModel("oData");
            var i = {
                filters: a,
                success: function (e, a) {
                    t.setValue(e.results[0].Batch)
                }.bind(this),
                error: function (e) {
                    console.log(e)
                }.bind(this)
            };
            var s = "/SAPBatchSet";
            r.read(s, i)
        },
        onSaveAddress: function () {
            var e = this.getView().getModel("bindata").getData(),
                t = "/BinSet";
            var a = {};
            var r = this.getView().getModel("oData");
            var i = {
                success: function (e, t) {
                    this._oDialog.close()
                }.bind(this),
                error: function (e) {
                    console.log(e)
                }
            };
            for (var s = 0; s < e.Bin.length; s++) {
                a = {};
                a.CompanyCode = e.Bin[s].CompanyCode;
                a.Country = "";
                a.MatDocPos = e.Bin[s].MatDocPos;
                a.Quantity = String(e.Bin[s].Quantity);
                a.Plant = e.Bin[s].Plant;
                a.StorageLocation = e.Bin[s].StorageLocation;
                a.StorageBin = e.Bin[s].StorageBin;
                a.Material = e.Bin[s].Material;
                a.Batch = e.Bin[s].Batch;
                a.Order = e.Bin[s].Order;
                a.OriginDocument = e.Bin[s].OriginDocument;
                a.Item = e.Bin[s].Item;
                a.Customer = "";
                a.QuantitySO = "0";
                a.Unit = e.Bin[s].Unit;
                r.create(t, a, i)
            }
        },
        onValueRequestBin: function (e) {
            this._SelectedTableIndex = this._getSelectedItemBinInModel(e);
            var t = e.getSource(),
                a = this.getView();
            if (!this._pDialog) {
                this._pDialog = sap.ui.core.Fragment.load({
                    id: a.getId(),
                    name: "s2p.mm.im.goodsreceipt.purchaseorder.GR4POS1Extension.fragment.selectStorageBin",
                    controller: this
                }).then(function (e) {
                    a.addDependent(e);
                    return e
                }.bind(this))
            }
            this._pDialog.then(function (e) {
                this._configDialog(t, e);
                e.open()
            }.bind(this))
        },
        _configDialog: function (e, t) {
            var a = !!e.data("multi");
            t.setMultiSelect(a);
            var r = e.data("confirmButtonText");
            t.setConfirmButtonText(r);
            var i = !!e.data("remember");
            t.setRememberSelections(i);
            var s = !!e.data("showClearButton");
            t.setShowClearButton(s);
            var o = e.data("growing");
            t.setGrowing(o == "true");
            var l = e.data("threshold");
            if (l) {
                t.setGrowingThreshold(parseInt(l, 10))
            }
            var n = !!e.data("draggable");
            t.setDraggable(n);
            var u = !!e.data("resizable");
            t.setResizable(u);
            var d = "sapUiResponsivePadding--header sapUiResponsivePadding--subHeader sapUiResponsivePadding--content sapUiResponsivePadding--footer";
            var c = !!e.data("responsivePadding");
            t.toggleStyleClass(d, c);
            var p = this.getView().getModel("bindata");
            var g = p.getData();
            var h = g.Bin[this._SelectedTableIndex].Plant,
                m = g.Bin[this._SelectedTableIndex].StorageLocation;
            var S = [];
            this._addFilter(S, h, "Plant");
            this._addFilter(S, m, "StorageLocation");
            var f = this.getView().getModel("oData");
            var _;
            var I = {
                filters: S,
                success: function (e, t) {
                    this.getView().getModel("bindatavh").setProperty("/data", e.results)
                }.bind(this),
                error: function (e) {}.bind(this)
            };
            f.read("/BinVHSet", I)
        },
        _handleStorageBinSearch: function (e) {
            var t = e.getParameter("value");
            var a = new r("Bin", i.Contains, t);
            var s = e.getParameter("itemsBinding");
            s.filter([a])
        },
        _handleStorageBinClose: function (e) {
            var t = e.getParameter("selectedContexts");
            if (t && t.length) {
                var a = t.map(function (e) {
                    return e
                })
            } else {
                o.show("No new item was selected.")
            }
            e.getSource().getBinding("items").filter([]);
            var r = this.getView().getModel("bindata");
            if (a) {
                r.setProperty("/Bin/" + this._SelectedTableIndex + "/CompanyCode", a[0].getObject().CompanyCode);
                r.setProperty("/Bin/" + this._SelectedTableIndex + "/StorageBin", a[0].getObject().Bin)
            }
            this._pDialog = undefined
        },
        _getSelectedItemBinInModel: function (e) {
            var t = e.getSource().getBindingContext("bindata").getPath();
            return parseInt(t.substring(5, t.length), 10)
        },
        _addFilter: function (e, t, a) {
            var s = 0;
            var o = t.indexOf(",");
            if (o !== -1) {
                var l = t.split(",");
                for (s = 0; s < 10; s++) {
                    var n = l[s];
                    if (n !== undefined) {
                        e.push(new r(a, i.EQ, n))
                    }
                }
            } else {
                o = t.indexOf("/");
                if (o !== -1) {
                    l = t.split("/");
                    var u = t;
                    var d = t;
                    e.push(new r(a, i.BT, u, d))
                } else {
                    e.push(new r(a, i.EQ, t))
                }
            }
        },
        handleScaleWeightGet: function (e) {
            var t = this.getView().getModel("oFrontend");
            var a = t.getProperty("/Items");
            this._SelectedTableIndex = this._getSelectedItemInModel(e);
            var r = a[this._SelectedTableIndex].Plant,
                i = a[this._SelectedTableIndex].ScaleNo;
            if (!i) {
                let e = this.getView().getModel("oFrontend").getData().Ebeln,
                    t = 99,
                    a = "0300",
                    i = "E";
                let l = "ScaleNo='" + t + "'," + "Werks='" + a + "'," + "Spras='" + i + "'," + "Order='" + e + "'";
                var s = this.getOwnerComponent().getModel("oData");
                s = this.getOwnerComponent().getModel("oData");
                s.read("/ScaleHelpSet(" + l + ")", {
                    success: function (e, t) {
                        let a = e.ScaleNo;
                        if (a === "") {
                            this.getView().setBusy(false);
                            o.show("Default Scale is not maintained")
                        } else {
                            this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/ScaleNo", a);
                            a = a.replace(" ", "");
                            r = "0030";
                            this.getView().setBusy(true);
                            var i = "ScaleNo='" + a + "'," + "Plant='" + r + "'";
                            s.read("/ScaleWeightSet(" + i + ")", {
                                success: function (e, t) {
                                    if (e.Status === "00") {
                                        this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/DeliveredQuantity_input", e.Quantity);
                                        this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input", e.Unit);
                                        this.getView().setBusy(false);
                                        o.show("Quantity Updated")
                                    } else {
                                        this.getView().setBusy(false);
                                        if (e.Status) {
                                            o.show(e.Status)
                                        } else {
                                            o.show("No response from scale")
                                        }
                                    }
                                }.bind(this),
                                error: function (e) {
                                    this.getView().setBusy(false);
                                    o.show("Technical error, please contact developer")
                                }
                            })
                        }
                    }.bind(this),
                    error: function (e) {
                        o.show(e)
                    }
                });
                this.getView().setBusy(false)
            }
            if (i) {
                i = i.replace(" ", "");
                r = "0030";
                this.getView().setBusy(true);
                var s = this.getOwnerComponent().getModel("oData");
                var l = "ScaleNo='" + i + "'," + "Plant='" + r + "'";
                s.read("/ScaleWeightSet(" + l + ")", {
                    success: function (e, t) {
                        if (e.Status === "00") {
                            this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/DeliveredQuantity_input", e.Quantity);
                            this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/DeliveredUnit_input", e.Unit);
                            this.getView().setBusy(false);
                            o.show("Quantity Updated")
                        } else {
                            this.getView().setBusy(false);
                            if (e.Status) {
                                o.show(e.Status)
                            } else {
                                o.show("No response from scale")
                            }
                        }
                    }.bind(this),
                    error: function (e) {
                        this.getView().setBusy(false);
                        o.show("Technical error, please contact developer")
                    }
                })
            }
        },
        getScalelist: function (e) {
            var t = this.getOwnerComponent().getModel("oData");
            t.read("/ScaleHelpSet", {
                success: function (e, t) {
                    var a = new sap.ui.model.json.JSONModel;
                    var r = {};
                    r = e;
                    a.setData(r);
                    this.getView().setModel(a, "scalemodel")
                }.bind(this),
                error: function (e) {
                    o.show(e)
                }
            })
        },
        handleScaleSelect: function (e) {
            var t = e.getParameter("selectedItem").getText();
            if (t) {
                this._SelectedTableIndex = this._getSelectedItemInModel(e);
                this.getView().getModel("oFrontend").setProperty("/Items/" + this._SelectedTableIndex + "/ScaleNo", t)
            }
        }
    })
});