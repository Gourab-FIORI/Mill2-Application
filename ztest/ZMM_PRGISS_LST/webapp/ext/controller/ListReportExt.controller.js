sap.ui.define(["sap/m/ColumnListItem", "sap/m/Label", "sap/ui/model/Filter", "sap/m/MessageToast", "sap/m/MessageBox", "sap/ui/comp/valuehelpdialog/ValueHelpDialog", "sap/ui/model/json/JSONModel", "sap/ui/model/resource/ResourceModel"], function (e, t, a, i, n, r, o,ResourceModel) {
    return sap.ui.controller("ZMM.zmm_progissue_lst.ext.controller.ListReportExt", {
        onInit: function () {
            this.oView = this.getView();
            this.oModel = this.oView.getModel();
             //++T_singhaG1 for GAP82A 07.02.2025
			  var sLanguage = sap.ui.getCore().getConfiguration().getLanguage();

			  // Default to English
			  //var sI18nPath = "ZMM.zmm_progissue_lst.ext.i18n.i18n.properties";
  
			  // If French, set the French translation file
			  if (sLanguage.toLowerCase().startsWith("fr")) {
				  //this.oView.byId("SplitDialogColumnStrandLabel").setText("Brin");
				  //this.oView.byId("SplitDialogColumnRoadLabel").setText("Route");
			  }
  
			//   // Set the i18n Model
			//   var oResourceModel = new ResourceModel({
			// 	  bundleUrl: sI18nPath
			//   });
			//   this.oView.setModel(oResourceModel, "i18n");
			  //++T_singhaG1 for GAP82A 07.02.2025
            this.oSplitDataModel = this.getOwnerComponent().getModel("splitData");
            this.oView.setModel(this.oSplitDataModel, "splitData");
            if (!this._oSplitDialog) {
                this._oSplitDialog = sap.ui.xmlfragment({
                    fragmentName: "ZMM.zmm_progissue_lst.ext.view.SplitDialog",
                    type: "XML",
                    id: "ZMM.zmm_progissue_lst.ext.SplitDialog"
                }, this);
                this._oSplitDialog.setModel(this.oModel);
                this.oView.addDependent(this._oSplitDialog)
            }
            if (!this._oUnplannedDialog) {
                this._oUnplannedDialog = sap.ui.xmlfragment({
                    fragmentName: "ZMM.zmm_progissue_lst.ext.view.UnplannedDialog",
                    type: "XML",
                    id: "ZMM.zmm_progissue_lst.ext.SplitDialog"
                }, this);
                this._oUnplannedDialog.setModel(this.oModel);
                this.oView.addDependent(this._oUnplannedDialog)
            }
            if (!this._oItemMessagesDialog) {
                this._oItemMessagesDialog = sap.ui.xmlfragment({
                    fragmentName: "ZMM.zmm_progissue_lst.ext.view.ItemMessagesDialog",
                    type: "XML",
                    id: "ZMM.zmm_progissue_lst.ext.ItemMessagesDialog"
                }, this);
                this._oItemMessagesDialog.setModel(this.oModel);
                this.oView.addDependent(this._oItemMessagesDialog)
            }
            var e = "Desired Value";
            if (!this._oPlantValueHelpDialog) {
                this._oPlantValueHelpDialog = new r({
                    supportRangesOnly: false,
                    supportMultiselect: false,
                    title: e,
                    supportRanges: false,
                    key: "Plant",
                    keys: ["PlantName"],
                    descriptionKey: "PlantName",
                    ok: jQuery.proxy(this.onPlantValueHelpResultSelect, this),
                    cancel: function () {
                        this.close()
                    },
                    afterClose: function () {
                        this.setModel(null)
                    },
                    beforeOpen: function () {
                        this.oSelectionTitle.setText(e)
                    }
                })
            }
        },
        onAfterRendering: function (e) {
            jQuery.sap.delayedCall(200, this, function () {
                var e = this.byId("listReportFilter-btnBasicSearch");
                if (e) {
                    e.focus()
                }
            }.bind(this))
        },
        handleProductionOrderScanSuccess: function (e) {
            if (e.getParameter("cancelled")) {
                i.show("Scan cancelled", {
                    duration: 1e3
                })
            } else {
                var t = this.byId("listReportFilter-btnBasicSearch");
                var a = this.byId("listReportFilter-btnGo");
                if (e.getParameter("text")) {
                    t.setValue(e.getParameter("text"));
                    a.firePress()
                } else {
                    t.setValue("")
                }
            }
        },
        handleProductionOrderScanError: function (e) {},
        handleProductionOrderScanLiveupdate: function (e) {},
        handleSplitButton: function (e) {
            var t = this.oView ? this.oView : e.getSource().getParent();
            var i = e.getSource().getBindingContext();
            var n = t.getModel("splitData");
            var r = n.getObject("/NewSplitCommon");
            var o = i.getObject();
            r.Quantity = o.OpenedQuantity;
            r.OrderOpenedQuantity = o.OpenedQuantity;
            r.Batch = o.Batch;
            r.MaterialBatchManaged = o.MaterialBatchManaged;
            var s = this._oSplitDialog;
            s.bindElement({
                path: i.getPath(),
                events: {
                    change: function (e) {},
                    dataRequested: function () {
                        s.setBusy(true)
                    },
                    dataReceived: function (e) {
                        s.setBusy(false)
                    }
                }
            });
            n.updateBindings(true);
            // var oItemTemplate = Object.assign({}, n.getObject("/SplitTemplate"));
			// var aSplitItems = n.getObject("/NewSplitItems");
//             var sPath = "/ZC_PROORDC_LST";
// var aFilters = [
//     new sap.ui.model.Filter("ProductionOrder", sap.ui.model.FilterOperator.EQ, o.ProductionOrder)
// ];

// t.getModel().read(sPath, {
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
//             // this.updateOpenQuantity(n);
//             // n.updateBindings(true);
//             // oDialog.open();
//            // return;
//         }
//         sap.m.MessageToast.show(this._i18nText("MSG_ORDER_NOT_FOUND"));
//     }.bind(this),
//     error: function () {
//         sap.m.MessageToast.show(this._i18nText("MSG_ORDER_SRV_ERROR"));
//         oItemTemplate.FieldsActive = false;
//         oSplitDataModel.updateBindings(true);
//     }.bind(this)
// });
            if (!o.Batch) {
                s.open();
                return
            }
            var l = t.getModel();
            var u = Object.assign({}, n.getObject("/SplitTemplate"));
            var p = n.getObject("/NewSplitItems");
            if (p.length > 0) {
                var c = Math.max.apply(Math, p.map(function (e) {
                    return e.Index
                }));
                u.Index = c + 1 + ""
            } else {
                u.Index = "1"
            }
            u.Material = o.Material;
            u.Plant = o.Plant;
            u.ProductionOrder = o.ProductionOrder;
            u.Reservation = o.Reservation;
            u.ReservationItem = o.ReservationItem;
            u.Unit = o.BaseUnit;
            u.WMLEnabled = false;
            var d = [new a("Material", "EQ", o.Material), new a("Batch", "EQ", o.Batch)];
            if (o.StorageLocation !== "") {
                d.push(new a("StorageLocation", "EQ", o.StorageLocation))
            }
            l.read("/ZI_MATBATCH_VH", {
                method: "GET",
                filters: d,
                urlParameters: {
                    $expand: "to_WmlStock"
                },
                success: function (e) {
                    var t = e.results.find(() => true);
                    if (t !== undefined) {
                        u.StorageLocation = t.StorageLocation;
                        u.Batch = t.Batch;
                        u.SupplierBatch = t.BatchBySupplier;
                        var a = parseFloat(t.BaseUnitQuantity);
                        u.Quantity = a;
                        u.WMLEnabled = t.WMLEnabled !== "";
                        if (t.to_WmlStock && t.to_WmlStock.results) {
                            var i = t.to_WmlStock.results.find(() => true);
                            if (i) {
                                u.WMLBin = i.StorageBin;
                                var r = parseFloat(i.Quantity, 10);
                                u.Quantity = a > r && u.AutoQuantity ? r : a
                            }
                        }
                        p.push(u);
                        this.updateOpenQuantity(n);
                        n.updateBindings(true);
                        s.open();
                        return
                    }
                    sap.m.MessageToast.show(this._i18nText("MSG_BATCH_NOT_FOUND"))
                }.bind(this),
                error: function () {
                    sap.m.MessageToast.show(this._i18nText("MSG_BATCH_SRV_ERROR"));
                    u.StorageLocation = "";
                    u.Batch = "";
                    u.SupplierBatch = "";
                    u.WMLBin = "";
                    u.Quantity = 0;
                    n.updateBindings(true)
                }.bind(this)
            })
        },
        handleUnplannedButton: function (e) {
            var t = this.oView ? this.oView : e.getSource().getParent();
            var a = null;
            var n = this.extensionAPI.getSelectedContexts()[0];
            if (!n) {
                n = e.getSource().getBindingContext();
                if (n) {
                    a = n.getObject();
                    if (!a.Material) {
                        a = null
                    }
                }
            } else {
                a = n.getObject()
            }
            if (!a) {
                i.show("Production order item must be selected.");
                return
            }
            var r = t.getModel("splitData");
            var o = r.getObject("/UnplannedCommon");
            o.Material = a.Material;
            o.MaterialBatchManaged = a.MaterialBatchManaged;
            o.Plant = a.Plant;
            o.Qunatity = 0;
            o.Unit = a.BaseUnit;
            var s = this._oUnplannedDialog;
            s.bindElement({
                path: n.getPath(),
                events: {
                    change: function (e) {},
                    dataRequested: function () {
                        s.setBusy(true)
                    },
                    dataReceived: function (e) {
                        s.setBusy(false)
                    }
                }
            });
            r.updateBindings(true);
            s.open()
        },
        handleShowMessagesButton: function (e) {
            var t = this.oView ? this.oView : e.getSource().getParent();
            var a = e.getSource().getBindingContext();
            var i = t.getModel("splitData");
            var n = this._oItemMessagesDialog;
            n.bindElement({
                path: a.getPath(),
                events: {
                    change: function (e) {},
                    dataRequested: function () {
                        n.setBusy(true)
                    },
                    dataReceived: function (e) {
                        n.setBusy(false)
                    }
                }
            });
            i.updateBindings(true);
            n.open()
        },
        handleAddSplitButton: function (e) {
            var t = this.oView;
            var a = e.getSource().getBindingContext();
            var i = a.getObject();
            var n = t.getModel("splitData");
            var r = Object.assign({}, n.getObject("/SplitTemplate"));
            var o = n.getObject("/NewSplitItems");
            if (o.length > 0) {
                var s = Math.max.apply(Math, o.map(function (e) {
                    return e.Index
                }));
                r.Index = s + 1 + ""
            } else {
                r.Index = "1"
            }
            var l = n.getObject("/UnplannedCommon");
            r.IsUnplanned = l.Material !== "";
            r.Material = l.Material !== "" ? l.Material : i.Material;
            r.Plant = l.Plant !== "" ? l.Plant : i.Plant;
            r.ProductionOrder = i.ProductionOrder;
            r.Reservation = i.Reservation;
            r.ReservationItem = i.ReservationItem;
            r.Unit = l.Material !== "" ? l.Unit : i.BaseUnit;
            r.WMLEnabled = false;
            var sPath = "/ZC_PROORDC_LST";
            var aFilters = [
                new sap.ui.model.Filter("ProductionOrder", sap.ui.model.FilterOperator.EQ, i.ProductionOrder)
            ];
            
            t.getModel().read(sPath, {
                method: "GET",
                filters: aFilters,
                urlParameters: {
                    "$select": "FieldsActive"
                },
                success: function (oData) {
                    var oEntry = oData.results.find(() => true); // Get the first entry if available
                    if (oEntry !== undefined) {
                        // Set FieldsActive based on the value retrieved
                        r.FieldsActive = (oEntry.FieldsActive === 'X');
                        o.push(r);
                        n.updateBindings(true)
                        // Continue with any other logic as needed, e.g., adding to a collection
                        //aSplitItems.push(oItemTemplate);
                        // this.updateOpenQuantity(n);
                        // n.updateBindings(true);
                        // oDialog.open();
                       // return;
                    }
                    //sap.m.MessageToast.show(this._i18nText("MSG_ORDER_NOT_FOUND"));
                }.bind(this),
                error: function () {
                    //sap.m.MessageToast.show(this._i18nText("MSG_ORDER_SRV_ERROR"));
                    r.FieldsActive = false;
                    o.push(r);
                     n.updateBindings(true)
                }.bind(this)
            });
            // o.push(r);
            // n.updateBindings(true)
        },
        handleAddSplitScanSuccess: function (e) {
            debugger;
            var t = this.oView;
            var i = t.getModel();
            var n = e.getSource().getBindingContext();
            var r = n.getObject();
            var o = t.getModel("splitData");
            var s = Object.assign({}, o.getObject("/SplitTemplate"));
            var l = o.getObject("/NewSplitItems");
            var u = e.getParameter("text");
            if (e.getParameters().cancelled === false && u !== "") {
                if (l.length > 0) {
                    var p = Math.max.apply(Math, l.map(function (e) {
                        return e.Index
                    }));
                    s.Index = p + 1 + ""
                } else {
                    s.Index = "1"
                }
                var c = o.getObject("/UnplannedCommon");
                s.IsUnplanned = c.Material !== "";
                s.Material = c.Material !== "" ? c.Material : r.Material;
                s.Plant = c.Plant !== "" ? c.Plant : r.Plant;
                s.ProductionOrder = r.ProductionOrder;
                s.Reservation = r.Reservation;
                s.ReservationItem = r.ReservationItem;
                s.Unit = r.BaseUnit;
                s.Batch = u;
                var d = [new a("Material", "EQ", s.Material), new a("Plant", "EQ", s.Plant), new a({
                    filters: [new a("Batch", "EQ", u), new a("BatchBySupplier", "EQ", u)],
                    and: false
                })];
                i.read("/ZI_MATBATCH_VH", {
                    method: "GET",
                    filters: d,
                    urlParameters: {
                        $expand: "to_WmlStock"
                    },
                    success: function (e) {
                        var t = e.results.find(() => true);
                        if (t !== undefined) {
                            s.StorageLocation = t.StorageLocation;
                            s.Batch = t.Batch;
                            s.SupplierBatch = t.BatchBySupplier;
                            var a = parseFloat(t.BaseUnitQuantity);
                            s.Quantity = a;
                            s.WMLEnabled = t.WMLEnabled !== "";
                            if (t.to_WmlStock && t.to_WmlStock.results) {
                                var i = t.to_WmlStock.results.find(() => true);
                                if (i) {
                                    s.WMLBin = i.StorageBin;
                                    var n = parseFloat(i.Quantity, 10);
                                    s.Quantity = a > n ? n : a
                                }
                            }
                        }
                        l.push(s);
                        this.updateOpenQuantity(o);
                        o.updateBindings(true)
                    }.bind(this),
                    error: function () {
                        sap.m.MessageToast.show("Failed to retrieve batch information.");
                        s.Batch = u;
                        l.push(s);
                        o.updateBindings(true)
                    }
                })
                //BOC T_Singhag1 14.02.2025
                var sPath = "/ZC_PROORDC_LST";
                var aFilters = [
                    new sap.ui.model.Filter("ProductionOrder", sap.ui.model.FilterOperator.EQ, s.ProductionOrder)
                ];
                
                t.getModel().read(sPath, {
                    method: "GET",
                    filters: aFilters,
                    urlParameters: {
                        "$select": "FieldsActive"
                    },
                    success: function (oData) {
                        var oEntry = oData.results.find(() => true); // Get the first entry if available
                        if (oEntry !== undefined) {
                            // Set FieldsActive based on the value retrieved
                            s.FieldsActive = (oEntry.FieldsActive === 'X');
                            //l.push(s);
                            o.updateBindings(true)
                            // Continue with any other logic as needed, e.g., adding to a collection
                            //aSplitItems.push(oItemTemplate);
                            // this.updateOpenQuantity(n);
                            // n.updateBindings(true);
                            // oDialog.open();
                           // return;
                        }
                        //sap.m.MessageToast.show(this._i18nText("MSG_ORDER_NOT_FOUND"));
                    }.bind(this),
                    error: function () {
                        //sap.m.MessageToast.show(this._i18nText("MSG_ORDER_SRV_ERROR"));
                        s.FieldsActive = false;
                        //l.push(s);
                        o.updateBindings(true)
                    }.bind(this)
                });
                //Eoc T_singhag1 14.02.2024
            }
        },
        handleAddSplitScanError: function (e) {},
        handleAddSplitLiveUpdate: function (e) {},
        handleDelSplitButton: function (e) {
            if (e.getSource().getCustomData().length === 0) {
                return
            }
            var t = this.oView;
            var a = t.getModel("splitData");
            var i = e.getSource().getCustomData()[0].getValue();
            var n = a.getObject("/NewSplitItems");
            n.splice(n.findIndex(e => e.Index === i), 1);
            this.updateOpenQuantity(a);
            a.updateBindings(true)
        },
        handleDistributionDialogOk: function (e) {
            var t = e.getSource().getParent();
            var a = this.oView;
            var i = a.getModel();
            var n = a.getModel("splitData");
            var r = n.getObject("/NewSplitItems");
            var o = (Math.random() * 1e32).toString(36);
            this.createAddDistributionsBatch(i, r, o);
            this.submitDistributionsBatch(t, i, o)
        },
        handleDistributionDialogCancel: function (e) {
            var t = e.getSource().getParent();
            t.close()
        },
        handleDistributionDialogClose: function (e) {
            var t = this.oView;
            var a = t.getModel("splitData");
            var i = a.getObject("/UnplannedCommon");
            var n = a.getObject("/NewSplitItems");
            var r = a.getObject("/NewSplitCommon");
            r.Quantity = 0;
            r.Batch = "";
            n.splice(0, n.length);
            i.Material = "";
            i.MaterialBatchManaged = false;
            i.Plant = "";
            i.Quantity = 0;
            i.Unit = "";
            a.updateBindings(true)
        },
        handleItemMessagesDialogClose: function (e) {
            var t = e.getSource().getParent();
            t.close()
        },
        handleStockTypeChange: function (e) {
            if (e.getSource().getCustomData().length === 0) {
                return
            }
            var t = e.getSource().getSelectedKey();
            var a = this.oView;
            var i = a.getModel("splitData");
            var n = e.getSource().getCustomData()[0].getValue();
            var r = i.getObject("/NewSplitItems");
            var o = r.findIndex(e => e.Index === n);
            if (o) {
                o.StockType = t;
                i.updateBindings(true)
            }
            console.log(o)
        },
        onStorageLocationValueHelpRequest: function (e) {
            if (e.getSource().getCustomData().length === 0) {
                return
            }
            var t = this.oView;
            var i = e.getSource().getCustomData()[0].getValue();
            var n = t.getModel("splitData");
            var s = n.getObject("/NewSplitItems");
            var l = s.find(e => e.Index === i);
            var u = "Desired Value";
            var p = new r({
                supportRangesOnly: false,
                supportMultiselect: false,
                title: u,
                supportRanges: false,
                key: "StorageLocation",
                keys: ["Plant"],
                descriptionKey: "StorageLocationName",
                ok: jQuery.proxy(this.onStorageLocationValueHelpResultSelect, this),
                cancel: function () {
                    this.close()
                },
                afterClose: function () {
                    this.setModel(null)
                },
                beforeOpen: function () {
                    this.oSelectionTitle.setText(u)
                }
            });
            var c = [];
            c.push({
                label: "Storage Location",
                tooltip: "Storage Location",
                template: "StorageLocation",
                type: "string"
            });
            c.push({
                label: "Storage Location Name",
                tooltip: "Storage Location Name",
                template: "StorageLocationName",
                type: "string"
            });
            p.setModel(this.getView().getModel());
            p.setModel(new o({
                cols: c
            }), "columns");
            p.data("sSplitItemIdx", i);
            var d = [new a("Plant", "EQ", l.Plant)];
            p.setTokens([]);
            p.getTableAsync().then(function (e) {
                e.setBusy(true);
                if (e.bindRows) {
                    e.bindAggregation("rows", {
                        path: "/C_ProdStorageLocationVH",
                        filters: d,
                        sorter: new sap.ui.model.Sorter("StorageLocation"),
                        events: {
                            dataReceived: jQuery.proxy(function (t) {
                                e.setBusy(false);
                                var a = t.getSource(),
                                    i;
                                if (a && this && this.isOpen()) {
                                    i = a.getLength();
                                    if (i) {
                                        this.update()
                                    }
                                }
                            }, p)
                        }
                    })
                }
                if (e.bindItems) {
                    var t = new sap.m.ColumnListItem({
                        cells: [new sap.m.Text({
                            text: "{StorageLocation}"
                        }), new sap.m.Text({
                            text: "{StorageLocationName}"
                        })]
                    });
                    e.bindAggregation("items", {
                        path: "/C_ProdStorageLocationVH",
                        filters: d,
                        sorter: new sap.ui.model.Sorter("StorageLocation"),
                        events: {
                            dataReceived: jQuery.proxy(function (t) {
                                e.setBusy(false);
                                var a = t.getSource(),
                                    i;
                                if (a && this && this.isOpen()) {
                                    i = a.getLength();
                                    if (i) {
                                        this.update()
                                    }
                                }
                            }, p)
                        },
                        template: t,
                        templateShareable: false
                    })
                }
            });
            p.open()
        },
        onStorageLocationValueHelpResultSelect: function (e) {
            var t = e.getParameter("tokens");
            if (t) {
                var i = t.find(() => true);
                if (i && i.getProperty("key")) {
                    var n = e.getSource();
                    var r = this.oView;
                    var o = r.getModel();
                    var s = r.getModel("splitData");
                    var l = n.data("sSplitItemIdx") + "";
                    var u = s.getObject("/NewSplitItems").find(e => e.Index === l);
                    if (u) {
                        u.StorageLocation = i.getProperty("key");
                        var p = [new a("Plant", "EQ", u.Plant), new a("StorageLocation", "EQ", u.StorageLocation)];
                        o.read("/ZC_WML_STLOC", {
                            method: "GET",
                            filters: p,
                            success: function (e) {
                                var t = e.results.find(() => true);
                                u.Batch = "";
                                u.SupplierBatch = "";
                                u.WMLBin = "";
                                u.WMLEnabled = t !== undefined && (t.WMLEnabled === "X" || t.WMLEnabled === true);
                                u.SalesOrder = "";
                                u.SalesOrderItem = "";
                                u.SalesOrderVisible = u.SalesOrder !== "";
                                u.Quantity = u.AutoQuantity ? 0 : u.Quantity;
                                s.updateBindings(true)
                            },
                            error: function () {
                                sap.m.MessageToast.show("Failed to retrieve storage location information all options are enabled.");
                                u.Batch = "";
                                u.SupplierBatch = "";
                                u.WMLBin = "";
                                u.WMLEnabled = true;
                                u.SalesOrder = "";
                                u.SalesOrderItem = "";
                                u.SalesOrderVisible = true;
                                u.Quantity = u.AutoQuantity ? 0 : u.Quantity;
                                s.updateBindings(true)
                            }
                        })
                    }
                    n.close()
                }
            }
        },
        onBatchValueHelpRequest: function (e) {
            if (e.getSource().getCustomData().length === 0) {
                return
            }
            var t = this.oView;
            var i = e.getSource().getCustomData()[0].getValue();
            var n = t.getModel("splitData");
            var s = n.getObject("/NewSplitItems");
            var l = s.find(e => e.Index === i);
            var u = "Desired Value";
            var p = new r({
                supportRangesOnly: false,
                supportMultiselect: false,
                title: u,
                supportRanges: false,
                key: "Batch",
                keys: ["Material", "Plant"],
                descriptionKey: "Batch",
                ok: jQuery.proxy(this.onBatchValueHelpResultSelect, this),
                cancel: function () {
                    this.close()
                },
                afterClose: function () {
                    this.setModel(null)
                },
                beforeOpen: function () {
                    this.oSelectionTitle.setText(u)
                }
            });
            var c = [];
            c.push({
                label: "Batch",
                tooltip: "Batch",
                template: "Batch",
                type: "string"
            });
            c.push({
                label: "Supplier Batch",
                tooltip: "Supplier Batch",
                template: "BatchBySupplier",
                type: "string"
            });
            c.push({
                label: "Storage Location",
                tooltip: "Storage Location",
                template: "StorageLocation",
                type: "string"
            });
            c.push({
                label: "Quantity",
                tooltip: "Quantity",
                template: "BaseUnitQuantity",
                type: "string"
            });
            c.push({
                label: "Unit",
                tooltip: "Unit",
                template: "BaseUnit",
                type: "string"
            });
            p.setModel(this.getView().getModel());
            p.setModel(new o({
                cols: c
            }), "columns");
            p.data("sSplitItemIdx", i);
            var d = [new a({
                path: "Material",
                operator: "EQ",
                value1: l.Material,
                and: true
            }), new a({
                path: "Plant",
                operator: "EQ",
                value1: l.Plant,
                and: true
            }), new a({
                path: "AlternativeUnit",
                operator: "EQ",
                value1: l.Unit,
                and: true
            })];
            p.setTokens([]);
            p.getTableAsync().then(function (e) {
                e.setBusy(true);
                if (e.bindRows) {
                    e.bindAggregation("rows", {
                        path: "/ZI_MATBATCH_VH",
                        filters: d,
                        parameters: {
                            expand: "to_WmlStock"
                        },
                        sorter: new sap.ui.model.Sorter("Batch"),
                        events: {
                            dataReceived: jQuery.proxy(function (t) {
                                e.setBusy(false);
                                var a = t.getSource(),
                                    i;
                                if (a && this && this.isOpen()) {
                                    i = a.getLength();
                                    if (i) {
                                        this.update()
                                    }
                                }
                            }, p)
                        }
                    })
                }
                if (e.bindItems) {
                    var t = new sap.m.ColumnListItem({
                        cells: [new sap.m.Text({
                            text: "{Batch}"
                        }), new sap.m.Text({
                            text: "{BatchBySupplier}"
                        }), new sap.m.Text({
                            text: "{StorageLocation}"
                        }), new sap.m.Text({
                            text: "{BaseUnitQuantity}"
                        }), new sap.m.Text({
                            text: "{BaseUnit}"
                        })]
                    });
                    e.bindAggregation("items", {
                        path: "/ZI_MATBATCH_VH",
                        filters: d,
                        parameters: {
                            expand: "to_WmlStock"
                        },
                        sorter: new sap.ui.model.Sorter("Batch"),
                        events: {
                            dataReceived: jQuery.proxy(function (t) {
                                e.setBusy(false);
                                var a = t.getSource(),
                                    i;
                                if (a && this && this.isOpen()) {
                                    i = a.getLength();
                                    if (i) {
                                        this.update()
                                    }
                                }
                            }, p)
                        },
                        template: t,
                        templateShareable: false
                    })
                }
            });
            p.open()
        },
        onBatchValueHelpResultSelect: function (e) {
            var t = e.getParameter("tokens");
            if (t === undefined || !t) {
                return
            }
            var a = t.find(() => true);
            if (a && a.getProperty("key")) {
                var i = e.getSource();
                var n = this.oView;
                var r = n.getModel();
                var o = n.getModel("splitData");
                var s = o.getObject("/NewSplitItems");
                var l = i.data("sSplitItemIdx") + "";
                var u = s.find(e => e.Index === l);
                if (u) {
                    i.getTableAsync().then(function (e) {
                        var t;
                        if (e.getSelectedIndex) {
                            t = e.getContextByIndex(e.getSelectedIndex())
                        }
                        if (!t && e.getSelectedContexts) {
                            t = e.getSelectedContexts().find(() => true)
                        }
                        if (!t) {
                            i.close();
                            return
                        }
                        var a = t.getObject();
                        u.StorageLocation = a.StorageLocation;
                        u.Batch = a.Batch;
                        u.SupplierBatch = a.BatchBySupplier;
                        var n = parseFloat(a.BaseUnitQuantity);
                        u.Quantity = a.BaseUnitQuantity;
                        u.SpecialStock = a.SpecialStock;
                        u.WMLEnabled = a.WMLEnabled !== "";
                        if (a.to_WmlStock && a.to_WmlStock.__list) {
                            var s = a.to_WmlStock.__list.find(() => true);
                            var l = r.getObject("/" + s);
                            if (l) {
                                u.WMLBin = l.StorageBin;
                                u.SalesOrder = l.SalesOrder;
                                u.SalesOrderItem = l.SalesOrderItem;
                                u.SalesOrderVisible = u.SalesOrder !== "";
                                var p = parseFloat(l.Quantity, 10);
                                var c = n > p ? p : n;
                                u.Quantity = u.AutoQuantity ? c : u.Quantity;
                                u.Quantity = !u.AutoQuantity && u.Quantity > c ? c : u.Quantity
                            }
                            this.updateOpenQuantity(o);
                            o.updateBindings(true)
                        }
                        i.close()
                    }.bind(this))
                }
            }
        },
        onSupplierBatchValueHelpRequest: function (e) {
            if (e.getSource().getCustomData().length === 0) {
                return
            }
            var t = this.oView;
            var i = e.getSource().getCustomData()[0].getValue();
            var n = t.getModel("splitData");
            var s = n.getObject("/NewSplitItems");
            var l = s.find(e => e.Index === i);
            var u = "Desired Value";
            var p = new r({
                supportRangesOnly: false,
                supportMultiselect: false,
                title: u,
                supportRanges: false,
                key: "BatchBySupplier",
                keys: ["Material", "Plant"],
                descriptionKey: "BatchBySupplier",
                ok: jQuery.proxy(this.onSupplierBatchValueHelpResultSelect, this),
                cancel: function () {
                    this.close()
                },
                afterClose: function () {
                    this.setModel(null)
                },
                beforeOpen: function () {
                    this.oSelectionTitle.setText(u)
                }
            });
            var c = [];
            c.push({
                label: "Supplier Batch",
                tooltip: "Supplier Batch",
                template: "BatchBySupplier",
                type: "string"
            });
            c.push({
                label: "Batch",
                tooltip: "Batch",
                template: "Batch",
                type: "string"
            });
            c.push({
                label: "Storage Location",
                tooltip: "Storage Location",
                template: "StorageLocation",
                type: "string"
            });
            c.push({
                label: "Quantity",
                tooltip: "Quantity",
                template: "BaseUnitQuantity",
                type: "string"
            });
            c.push({
                label: "Unit",
                tooltip: "Unit",
                template: "BaseUnit",
                type: "string"
            });
            p.setModel(this.getView().getModel());
            p.setModel(new o({
                cols: c
            }), "columns");
            p.data("sSplitItemIdx", i);
            var d = [new a({
                path: "Material",
                operator: "EQ",
                value1: l.Material,
                and: true
            }), new a({
                path: "Plant",
                operator: "EQ",
                value1: l.Plant,
                and: true
            }), new a({
                path: "AlternativeUnit",
                operator: "EQ",
                value1: l.Unit,
                and: true
            }), new a({
                path: "BatchBySupplier",
                operator: "NE",
                value1: "",
                and: true
            })];
            p.setTokens([]);
            p.getTableAsync().then(function (e) {
                e.setBusy(true);
                if (e.bindRows) {
                    e.bindAggregation("rows", {
                        path: "/ZI_MATBATCH_VH",
                        filters: d,
                        parameters: {
                            expand: "to_WmlStock"
                        },
                        sorter: new sap.ui.model.Sorter("BatchBySupplier"),
                        events: {
                            dataReceived: jQuery.proxy(function (t) {
                                e.setBusy(false);
                                var a = t.getSource(),
                                    i;
                                if (a && this && this.isOpen()) {
                                    i = a.getLength();
                                    if (i) {
                                        this.update()
                                    }
                                }
                            }, p)
                        }
                    })
                }
                if (e.bindItems) {
                    var t = new sap.m.ColumnListItem({
                        cells: [new sap.m.Text({
                            text: "{BatchBySupplier}"
                        }), new sap.m.Text({
                            text: "{Batch}"
                        }), new sap.m.Text({
                            text: "{StorageLocation}"
                        }), new sap.m.Text({
                            text: "{BaseUnitQuantity}"
                        }), new sap.m.Text({
                            text: "{BaseUnit}"
                        })]
                    });
                    e.bindAggregation("items", {
                        path: "/ZI_MATBATCH_VH",
                        filters: d,
                        parameters: {
                            expand: "to_WmlStock"
                        },
                        sorter: new sap.ui.model.Sorter("Batch"),
                        events: {
                            dataReceived: jQuery.proxy(function (t) {
                                e.setBusy(false);
                                var a = t.getSource(),
                                    i;
                                if (a && this && this.isOpen()) {
                                    i = a.getLength();
                                    if (i) {
                                        this.update()
                                    }
                                }
                            }, p)
                        },
                        template: t,
                        templateShareable: false
                    })
                }
            });
            p.open()
        },
        onSupplierBatchValueHelpResultSelect: function (e) {
            var t = e.getParameter("tokens");
            if (t === undefined || !t) {
                return
            }
            var a = t.find(() => true);
            if (a && a.getProperty("key")) {
                var i = e.getSource();
                var n = this.oView;
                var r = n.getModel();
                var o = n.getModel("splitData");
                var s = o.getObject("/NewSplitItems");
                var l = i.data("sSplitItemIdx") + "";
                var u = s.find(e => e.Index === l);
                if (u) {
                    i.getTableAsync().then(function (e) {
                        var t;
                        if (e.getSelectedIndex) {
                            t = e.getContextByIndex(e.getSelectedIndex())
                        }
                        if (!t && e.getSelectedContexts) {
                            t = e.getSelectedContexts().find(() => true)
                        }
                        if (!t) {
                            i.close();
                            return
                        }
                        var a = t.getObject();
                        u.StorageLocation = a.StorageLocation;
                        u.Batch = a.Batch;
                        u.SupplierBatch = a.BatchBySupplier;
                        var n = parseFloat(a.BaseUnitQuantity);
                        u.Quantity = a.BaseUnitQuantity;
                        u.SpecialStock = a.SpecialStock;
                        u.WMLEnabled = a.WMLEnabled !== "";
                        if (a.to_WmlStock && a.to_WmlStock.__list) {
                            var s = a.to_WmlStock.__list.find(() => true);
                            var l = r.getObject("/" + s);
                            if (l) {
                                u.WMLBin = l.StorageBin;
                                u.SalesOrder = l.SalesOrder;
                                u.SalesOrderItem = l.SalesOrderItem;
                                u.SalesOrderVisible = u.SalesOrder !== "";
                                var p = parseFloat(l.Quantity, 10);
                                var c = n > p ? p : n;
                                u.Quantity = u.AutoQuantity ? c : u.Quantity;
                                u.Quantity = !u.AutoQuantity && u.Quantity > c ? c : u.Quantity
                            }
                            this.updateOpenQuantity(o);
                            o.updateBindings(true)
                        }
                        i.close()
                    }.bind(this))
                }
            }
        },
        onWMLBinValueHelpRequest: function (e) {
            if (e.getSource().getCustomData().length === 0) {
                return
            }
            var t = this.oView;
            var i = e.getSource().getCustomData()[0].getValue();
            var n = t.getModel("splitData");
            var s = n.getObject("/NewSplitItems");
            var l = s.find(e => e.Index === i);
            var u = "Desired Value";
            var p = new r({
                supportRangesOnly: false,
                supportMultiselect: false,
                title: u,
                supportRanges: false,
                key: "StorageBin",
                keys: ["StorageBin"],
                descriptionKey: "StorageBin",
                ok: jQuery.proxy(this.onWMLBinValueHelpResultSelect, this),
                cancel: function () {
                    this.close()
                },
                afterClose: function () {
                    this.setModel(null)
                },
                beforeOpen: function () {
                    this.oSelectionTitle.setText(u)
                }
            });
            var c = [];
            c.push({
                label: "Bin",
                tooltip: "Bin",
                template: "StorageBin",
                type: "string"
            });
            c.push({
                label: "Batch",
                tooltip: "Batch",
                template: "Batch",
                type: "number"
            });
            c.push({
                label: "Storage Location",
                tooltip: "Storage Location",
                template: "StorageLocation",
                type: "string"
            });
            c.push({
                label: "Quantity",
                tooltip: "Quantity",
                template: "Quantity",
                type: "number"
            });
            c.push({
                label: "Unit",
                tooltip: "Unit",
                template: "UnitMeasure",
                type: "string"
            });
            p.data("sSplitItemIdx", i);
            p.setModel(this.getView().getModel());
            p.setModel(new o({
                cols: c
            }), "columns");
            var d = [new a({
                path: "Material",
                operator: "EQ",
                value1: l.Material,
                and: true
            }), new a({
                path: "Plant",
                operator: "EQ",
                value1: l.Plant,
                and: true
            }), new a({
                path: "Quantity",
                operator: "GT",
                value1: 0,
                and: true
            }), new a({
                path: "UnitMeasure",
                operator: "NE",
                value1: "",
                and: true
            }), new a({
                path: "StockType",
                operator: "EQ",
                value1: "01",
                and: true
            })];
            p.setTokens([]);
            p.getTableAsync().then(function (e) {
                e.setBusy(true);
                if (e.bindRows) {
                    e.bindAggregation("rows", {
                        path: "/ZI_WMLSTOCK",
                        filters: d,
                        sorter: new sap.ui.model.Sorter("Batch"),
                        events: {
                            dataReceived: jQuery.proxy(function (t) {
                                e.setBusy(false);
                                var a = t.getSource(),
                                    i;
                                if (a && this && this.isOpen()) {
                                    i = a.getLength();
                                    if (i) {
                                        this.update()
                                    }
                                }
                            }, p)
                        }
                    })
                }
                if (e.bindItems) {
                    var t = new sap.m.ColumnListItem({
                        cells: [new sap.m.Text({
                            text: "{StorageBin}"
                        }), new sap.m.Text({
                            text: "{Batch}"
                        }), new sap.m.Text({
                            text: "{StorageLocation}"
                        }), new sap.m.Text({
                            text: "{Quantity}"
                        }), new sap.m.Text({
                            text: "{UnitMeasure}"
                        })]
                    });
                    e.bindAggregation("items", {
                        path: "/ZI_WMLSTOCK",
                        filters: d,
                        sorter: new sap.ui.model.Sorter("Batch"),
                        events: {
                            dataReceived: jQuery.proxy(function (t) {
                                e.setBusy(false);
                                var a = t.getSource(),
                                    i;
                                if (a && this && this.isOpen()) {
                                    i = a.getLength();
                                    if (i) {
                                        this.update()
                                    }
                                }
                            }, p)
                        },
                        template: t,
                        templateShareable: false
                    })
                }
            });
            p.open()
        },
        onWMLBinValueHelpResultSelect: function (e) {
            var t = e.getParameter("tokens");
            if (t) {
                var i = t.find(() => true);
                if (i && i.getProperty("key")) {
                    var n = e.getSource();
                    var r = this.oView;
                    var o = r.getModel();
                    var s = r.getModel("splitData");
                    var l = s.getObject("/NewSplitItems");
                    var u = n.data("sSplitItemIdx") + "";
                    var p = l.find(e => e.Index === u);
                    if (p) {
                        n.getTableAsync().then(function (e) {
                            var t;
                            if (e.getSelectedIndex) {
                                t = e.getContextByIndex(e.getSelectedIndex())
                            }
                            if (!t && e.getSelectedContexts) {
                                t = e.getSelectedContexts().find(() => true)
                            }
                            if (!t) {
                                n.close();
                                return
                            }
                            var i = t.getObject();
                            p.WMLBin = i.StorageBin;
                            p.StorageLocation = i.StorageLocation;
                            p.Batch = i.Batch;
                            p.SupplierBatch = i.BatchBySupplier;
                            p.SalesOrder = i.SalesOrder;
                            p.SalesOrderItem = i.SalesOrderItem;
                            p.SalesOrderVisible = p.SalesOrder !== "";
                            var r = [new a("Material", "EQ", p.Material), new a("Batch", "EQ", p.Batch)];
                            o.read("/ZI_MATBATCH_VH", {
                                method: "GET",
                                filters: r,
                                success: function (e) {
                                    var t = e.results.find(() => true);
                                    if (t !== undefined) {
                                        var a = parseFloat(t.BaseUnitQuantity, 10);
                                        var r = parseFloat(i.Quantity, 10);
                                        var o = a > r ? r : a;
                                        p.Quantity = p.AutoQuantity ? o : p.Quantity;
                                        p.Quantity = !p.AutoQuantity && p.Quantity > o ? o : p.Quantity
                                    } else {
                                        p.Quantity = 0
                                    }
                                    this.updateOpenQuantity(s);
                                    s.updateBindings(true);
                                    n.close()
                                }.bind(this),
                                error: function () {
                                    sap.m.MessageToast.show("Quantity set to zero due to failure to get batch information.");
                                    p.Quantity = 0;
                                    this.updateOpenQuantity(s);
                                    s.updateBindings(true);
                                    n.close()
                                }.bind(this)
                            })
                        }.bind(this))
                    }
                }
            }
        },
        onPlantValueHelpRequest: function (e) {
            var t = this._oPlantValueHelpDialog;
            var a = [];
            a.push({
                label: "Plant",
                tooltip: "Plant",
                template: "Plant",
                type: "string"
            });
            a.push({
                label: "Plant Name",
                tooltip: "Plant Name",
                template: "PlantName",
                type: "string"
            });
            t.setModel(this.getView().getModel());
            t.setModel(new o({
                cols: a
            }), "columns");
            var i = [];
            var n = t.getTable();
            n.setBusy(true);
            n.bindRows({
                path: "/C_MM_PlantBasicValueHelp",
                filters: i,
                sorter: new sap.ui.model.Sorter("Plant"),
                events: {
                    dataReceived: jQuery.proxy(function (e) {
                        n.setBusy(false);
                        var t = e.getSource(),
                            a;
                        if (t && this && this.isOpen()) {
                            a = t.getLength();
                            if (a) {
                                this.update()
                            }
                        }
                    }, t)
                }
            });
            t.setTokens([]);
            t.update();
            t.open()
        },
        onPlantValueHelpResultSelect: function (e) {
            var t = e.getParameter("tokens");
            if (t) {
                var a = t.find(() => true);
                if (a && a.getProperty("key")) {
                    var i = this._oPlantValueHelpDialog;
                    var n = this.oView;
                    var r = n.getModel("splitData");
                    var o = r.getObject("/UnplannedCommon");
                    o.Plant = a.getProperty("key");
                    r.updateBindings(true);
                    i.close()
                }
            }
        },
        onMaterialValueHelpRequest: function (e) {
            var t = "Select desired value.";
            var a = new r({
                supportRangesOnly: false,
                supportMultiselect: false,
                title: t,
                supportRanges: false,
                key: "Material",
                descriptionKey: "Material_Text",
                ok: jQuery.proxy(this.onMaterialValueHelpResultSelect, this),
                cancel: function () {
                    this.close()
                },
                afterClose: function () {
                    this.setModel(null);
                    this.destroy()
                },
                beforeOpen: function () {
                    this.oSelectionTitle.setText(t)
                }
            });
            var i = new sap.ui.comp.smartfilterbar.ControlConfiguration({});
            var n = {
                entityType: "F_Mmim_I_Material_VhType",
                basicSearchFieldName: "Material",
                enableBasicSearch: true,
                advancedMode: true,
                expandAdvancedArea: false,
                search: jQuery.proxy(this.onMaterialValueHelpSearch, this),
                controlConfiguration: i,
                customData: [new sap.ui.core.CustomData({
                    key: "dateFormatSettings",
                    value: {
                        UTC: true
                    }
                }), new sap.ui.core.CustomData({
                    key: "parentDialog",
                    value: a
                })],
                filterChange: function () {
                    a.getTable().setShowOverlay(true)
                }.bind(this)
            };
            var s = new sap.ui.comp.smartfilterbar.SmartFilterBar(n);
            s.setModel(this.oModel);
            a.setFilterBar(s);
            var l = [];
            l.push({
                label: "Material",
                tooltip: "Material",
                template: "Material",
                type: "string"
            });
            l.push({
                label: "Material Name",
                tooltip: "Material Name",
                template: "Material_Text",
                type: "string"
            });
            a.setModel(this.getView().getModel());
            a.setModel(new o({
                cols: l
            }), "columns");
            var u = [];
            a.setTokens([]);
            a.getTableAsync().then(function (e) {
                e.setBusy(true);
                if (e.bindRows) {
                    e.bindAggregation("rows", {
                        path: "/ZC_FMMIMMat_Vh",
                        filters: u,
                        sorter: new sap.ui.model.Sorter("Material"),
                        events: {
                            dataReceived: jQuery.proxy(function (t) {
                                e.setBusy(false);
                                a.update();
                                var i = t.getSource(),
                                    n;
                                if (i && this && this.isOpen()) {
                                    n = i.getLength();
                                    if (n) {
                                        this.update()
                                    }
                                }
                            }, a)
                        }
                    })
                }
                if (e.bindItems) {
                    var t = new sap.m.ColumnListItem({
                        cells: [new sap.m.Text({
                            text: "{Material}"
                        }), new sap.m.Text({
                            text: "{Material_Text}"
                        })]
                    });
                    e.bindAggregation("items", {
                        path: "/ZC_FMMIMMat_Vh",
                        filters: u,
                        sorter: new sap.ui.model.Sorter("Material"),
                        events: {
                            dataReceived: jQuery.proxy(function (t) {
                                e.setBusy(false);
                                a.update();
                                var i = t.getSource(),
                                    n;
                                if (i && this && this.isOpen()) {
                                    n = i.getLength();
                                    if (n) {
                                        this.update()
                                    }
                                }
                            }, a)
                        },
                        template: t,
                        templateShareable: false
                    })
                }
            });
            a.open()
        },
        onMaterialValueHelpResultSelect: function (e) {
            var t = e.getParameter("tokens");
            if (t) {
                var a = t.find(() => true);
                if (a && a.getProperty("key")) {
                    var i = e.getSource();
                    var n = this.oView;
                    var r = n.getModel("splitData");
                    var o = r.getObject("/UnplannedCommon");
                    i.getTableAsync().then(function (e) {
                        var t;
                        if (e.getSelectedIndex) {
                            t = e.getContextByIndex(e.getSelectedIndex())
                        }
                        if (!t && e.getSelectedContexts) {
                            t = e.getSelectedContexts().find(() => true)
                        }
                        if (!t) {
                            i.close();
                            return
                        }
                        var a = t.getObject();
                        var n = a.MaterialBaseUnit;
                        var s = r.getObject("/NewSplitItems");
                        o.Material = a.Material;
                        o.Unit = n;
                        o.MaterialBatchManaged = a.IsBatchManagementRequired;
                        s.forEach(e => {
                            if (e.Material !== a.Material) {
                                e.Material = a.Material;
                                e.StorageLocation = "";
                                e.Unit = n;
                                e.Batch = "";
                                e.SupplierBatch = "";
                                e.WMLBin = "";
                                e.WMLEnabled = false
                            }
                        });
                        r.updateBindings(true);
                        i.close()
                    })
                }
            }
        },
        onMaterialValueHelpSearch: function (e) {
            var t = e.getSource().getCustomData()[1].getValue();
            var i = e.getSource().getFilters();
            var n = e.getSource().getBasicSearchValue();
            i.push(new a({
                filters: [new a("Material", "Contains", n), new a("Material_Text", "Contains", n)],
                and: false
            }));
            t.getTableAsync().then(function (e) {
                e.setShowOverlay(false);
                e.setBusy(true);
                if (e.bindRows) {
                    e.bindAggregation("rows", {
                        path: "/ZC_FMMIMMat_Vh",
                        filters: i,
                        sorter: new sap.ui.model.Sorter("Material"),
                        events: {
                            dataReceived: jQuery.proxy(function (a) {
                                e.setBusy(false);
                                t.update();
                                var i = a.getSource(),
                                    n;
                                if (i && this && this.isOpen()) {
                                    n = i.getLength();
                                    if (n) {
                                        this.update()
                                    }
                                }
                            }, t)
                        }
                    })
                }
                if (e.bindItems) {
                    var a = new sap.m.ColumnListItem({
                        cells: [new sap.m.Text({
                            text: "{Material}"
                        }), new sap.m.Text({
                            text: "{Material_Text}"
                        })]
                    });
                    e.bindAggregation("items", {
                        path: "/ZC_FMMIMMat_Vh",
                        filters: i,
                        sorter: new sap.ui.model.Sorter("Material"),
                        events: {
                            dataReceived: jQuery.proxy(function (a) {
                                e.setBusy(false);
                                t.update();
                                var i = a.getSource(),
                                    n;
                                if (i && this && this.isOpen()) {
                                    n = i.getLength();
                                    if (n) {
                                        this.update()
                                    }
                                }
                            }, t)
                        },
                        template: a,
                        templateShareable: false
                    })
                }
            })
        },
        handlePlantChange: function (e) {
            var t = this.oView;
            var a = t.getModel("splitData");
            var i = a.getObject("/NewSplitItems");
            var n = e.getParameter("value");
            i.forEach(e => {
                if (e.Plant !== n) {
                    e.Plant = n
                }
            })
        },
        handleUnplannedMaterialChange: function (e) {
            var t = this.oView;
            var i = t.getModel();
            var n = t.getModel("splitData");
            var r = n.getObject("/NewSplitItems");
            var o = n.getObject("/UnplannedCommon");
            var s = e.getParameter("value");
            var l = [new a({
                path: "Material",
                operator: "EQ",
                value1: s,
                and: true
            }), new a({
                path: "Plant",
                operator: "EQ",
                value1: o.Plant,
                and: true
            })];
            i.read("/ZC_FMMIMMat_Vh", {
                method: "GET",
                filters: l,
                success: function (e) {
                    var t = e.results.find(() => true);
                    if (t !== undefined) {
                        var a = t.MaterialBaseUnit;
                        o.Material = t.Material;
                        o.Unit = a;
                        o.MaterialBatchManaged = t.IsBatchManagementRequired;
                        r.forEach(e => {
                            if (e.Material !== t.Material) {
                                e.Material = t.Material;
                                e.StorageLocation = "";
                                e.Unit = a;
                                e.Batch = "";
                                e.SupplierBatch = "";
                                e.WMLBin = "";
                                e.WMLEnabled = false
                            }
                        });
                        n.updateBindings(true)
                    }
                    n.updateBindings(true)
                },
                error: function () {
                    sap.m.MessageToast.show("Failed to retrieve material information.");
                    n.updateBindings(true)
                }
            })
        },
        handleSplitQuantityChange: function (e) {
            if (e.getSource().getCustomData().length === 0) {
                return
            }
            var t = e.getParameter("value");
            if (t === "") {
                return
            }
            var a = e.getSource().getBindingContext();
            var i = a.getObject();
            var n = e.getSource().getCustomData()[0].getValue();
            var r = this.oView;
            var o = r.getModel("splitData");
            var s = o.getObject("/NewSplitItems");
            var l = s.find(e => e.Index === n);
            var u = 0;
            s.forEach(e => {
                u += parseFloat(e.Quantity, 10)
            });
            var p = parseFloat(l.Quantity, 10);
            var c = o.getObject("/NewSplitCommon");
            var d = parseFloat(c.OrderOpenedQuantity, 10);
            d -= u;
            c.Quantity = d;
            l.Quantity = p;
            l.AutoQuantity = p === 0;
            o.updateBindings(true)
        },
        handleUnplannedQuantityChange: function (e) {
            if (e.getSource().getCustomData().length === 0) {
                return
            }
            var t = e.getParameter("value");
            if (t === "") {
                return
            }
            var a = e.getSource().getCustomData()[0].getValue();
            var i = this.oView;
            var n = i.getModel("splitData");
            var r = n.getObject("/NewSplitItems");
            var o = r.find(e => e.Index === a);
            var s = 0;
            r.forEach(e => {
                s += parseFloat(e.Quantity, 10)
            });
            var l = n.getObject("/UnplannedCommon");
            var u = sap.ui.core.format.NumberFormat.getFloatInstance({
                groupingEnabled: true,
                groupingSize: 3,
                decimals: 3
            });
            var p = u.parse(t);
            o.Quantity = p;
            o.AutoQuantity = p === 0;
            l.Quantity = s;
            n.updateBindings(true)
        },
        handleBatchChange: function (e) {
            if (e.getSource().getCustomData().length === 0) {
                return
            }
            var t = e.getSource().getCustomData()[0].getValue();
            var i = this.oView;
            var n = i.getModel();
            var r = i.getModel("splitData");
            var o = r.getObject("/NewSplitItems");
            var s = o.find(e => e.Index === t);
            var l = [new a("Material", "EQ", s.Material), new a("Batch", "EQ", s.Batch)];
            if (s.StorageLocation !== "") {
                l.push(new a("StorageLocation", "EQ", s.StorageLocation))
            }
            n.read("/ZI_MATBATCH_VH", {
                method: "GET",
                filters: l,
                urlParameters: {
                    $expand: "to_WmlStock"
                },
                success: function (e) {
                    var t = e.results.find(() => true);
                    if (t !== undefined) {
                        s.StorageLocation = t.StorageLocation;
                        s.Batch = t.Batch;
                        s.SupplierBatch = t.BatchBySupplier;
                        var a = parseFloat(t.BaseUnitQuantity);
                        s.Quantity = a;
                        s.WMLEnabled = t.WMLEnabled !== "";
                        if (t.to_WmlStock && t.to_WmlStock.results) {
                            var i = t.to_WmlStock.results.find(() => true);
                            if (i) {
                                s.WMLBin = i.StorageBin;
                                var n = parseFloat(i.Quantity, 10);
                                s.Quantity = a > n && s.AutoQuantity ? n : a
                            }
                        }
                    }
                    this.updateOpenQuantity(r);
                    r.updateBindings(true)
                }.bind(this),
                error: function () {
                    sap.m.MessageToast.show(this._i18nText("MSG_BATCH_SRV_ERROR"));
                    s.StorageLocation = "";
                    s.Batch = "";
                    s.SupplierBatch = "";
                    s.WMLBin = "";
                    s.Quantity = 0;
                    r.updateBindings(true)
                }.bind(this)
            })
        },
        handleSupplierBatchChange: function (e) {
            if (e.getSource().getCustomData().length === 0) {
                return
            }
            var t = e.getSource().getCustomData()[0].getValue();
            var i = this.oView;
            var n = i.getModel();
            var r = i.getModel("splitData");
            var o = r.getObject("/NewSplitItems");
            var s = o.find(e => e.Index === t);
            var l = [new a("Material", "EQ", s.Material), new a("BatchBySupplier", "EQ", s.SupplierBatch)];
            if (s.StorageLocation !== "") {
                l.push(new a("StorageLocation", "EQ", s.StorageLocation))
            }
            n.read("/ZI_MATBATCH_VH", {
                method: "GET",
                filters: l,
                urlParameters: {
                    $expand: "to_WmlStock"
                },
                success: function (e) {
                    var t = e.results.find(() => true);
                    if (t !== undefined) {
                        s.StorageLocation = t.StorageLocation;
                        s.Batch = t.Batch;
                        s.SupplierBatch = t.BatchBySupplier;
                        var a = parseFloat(t.BaseUnitQuantity);
                        s.Quantity = a;
                        s.WMLEnabled = t.WMLEnabled !== "";
                        if (t.to_WmlStock && t.to_WmlStock.results) {
                            var i = t.to_WmlStock.results.find(() => true);
                            if (i) {
                                s.WMLBin = i.StorageBin;
                                var n = parseFloat(i.Quantity, 10);
                                s.Quantity = a > n && s.AutoQuantity ? n : a
                            }
                        }
                    }
                    this.updateOpenQuantity(r);
                    r.updateBindings(true)
                }.bind(this),
                error: function () {
                    sap.m.MessageToast.show(this._i18nText("MSG_BATCH_SRV_ERROR"));
                    s.StorageLocation = "";
                    s.Batch = "";
                    s.SupplierBatch = "";
                    s.WMLBin = "";
                    s.Quantity = 0;
                    r.updateBindings(true)
                }.bind(this)
            })
        },
        handleStorageLocationChange: function (e) {
            if (e.getSource().getCustomData().length === 0) {
                return
            }
            var t = e.getSource().getCustomData()[0].getValue();
            var i = this.oView;
            var n = i.getModel();
            var r = i.getModel("splitData");
            var o = r.getObject("/NewSplitItems");
            var s = o.find(e => e.Index === t);
            var l = [new a("Plant", "EQ", s.Plant), new a("StorageLocation", "EQ", s.StorageLocation)];
            n.read("/ZC_WML_STLOC", {
                method: "GET",
                filters: l,
                success: function (e) {
                    var t = e.results.find(() => true);
                    s.Batch = "";
                    s.SupplierBatch = "";
                    s.WMLBin = "";
                    s.WMLEnabled = t !== undefined && (t.WMLEnabled === "X" || t.WMLEnabled === true);
                    s.SalesOrder = "";
                    s.SalesOrderItem = "";
                    s.SalesOrderVisible = s.SalesOrder !== "";
                    s.Quantity = s.AutoQuantity ? 0 : s.Quantity;
                    r.updateBindings(true)
                },
                error: function () {
                    sap.m.MessageToast.show("Failed to retrieve storage location information all options are enabled.");
                    s.Batch = "";
                    s.SupplierBatch = "";
                    s.WMLBin = "";
                    s.WMLEnabled = true;
                    s.SalesOrder = "";
                    s.SalesOrderItem = "";
                    s.SalesOrderVisible = true;
                    s.Quantity = s.AutoQuantity ? 0 : s.Quantity;
                    r.updateBindings(true)
                }
            })
        },
        handleBinChange: function (e) {
            if (e.getSource().getCustomData().length === 0) {
                return
            }
            var t = e.getSource().getCustomData()[0].getValue();
            var i = this.oView;
            var n = i.getModel();
            var r = i.getModel("splitData");
            var o = r.getObject("/NewSplitItems");
            var s = o.find(e => e.Index === t);
            var l = [new a("Material", "EQ", s.Material), new a("Plant", "EQ", s.Plant), new a("StorageLocation", "EQ", s.StorageLocation), new a("StorageBin", "EQ", s.WMLBin), new a("Quantity", "GT", 0)];
            n.read("/ZI_WMLSTOCK", {
                method: "GET",
                filters: l,
                success: function (e) {
                    var t = e.results.find(e => e.Quantity > 0);
                    s.StorageLocation = t.StorageLocation;
                    s.Batch = t.Batch;
                    s.SupplierBatch = t.BatchBySupplier;
                    s.WMLBin = t.StorageBin;
                    s.SalesOrder = t.SalesOrder;
                    s.SalesOrderItem = t.SalesOrderItem;
                    s.SalesOrderVisible = s.SalesOrder !== "";
                    var i = [new a("Material", "EQ", s.Material), new a("Batch", "EQ", s.Batch)];
                    n.read("/ZI_MATBATCH_VH", {
                        method: "GET",
                        filters: i,
                        urlParameters: {
                            $expand: "to_WmlStock"
                        },
                        success: function (a) {
                            var i = e.results.find(() => true);
                            if (i !== undefined) {
                                var n = parseFloat(i.Quantity, 10);
                                var o = parseFloat(t.Quantity, 10);
                                var l = n > o ? o : n;
                                s.Quantity = s.AutoQuantity ? l : s.Quantity;
                                s.Quantity = !s.AutoQuantity && s.Quantity > l ? l : s.Quantity
                            } else {
                                s.Quantity = 0
                            }
                            this.updateOpenQuantity(r);
                            r.updateBindings(true)
                        }.bind(this),
                        error: function () {
                            sap.m.MessageToast.show("Quantity set to zero due to failure to get batch information.");
                            s.Quantity = 0;
                            this.updateOpenQuantity(r);
                            r.updateBindings(true)
                        }
                    })
                }.bind(this),
                error: function () {
                    sap.m.MessageToast.show("Failed to retrieve batch information.");
                    s.StorageLocation = "";
                    s.Batch = "";
                    s.WMLBin = "";
                    s.Quantity = 0;
                    r.updateBindings(true)
                }
            })
        },
        updateOpenQuantity: function (e) {
            var t = e.getObject("/UnplannedCommon");
            var a = e.getObject("/NewSplitCommon");
            var i = e.getObject("/NewSplitItems");
            var n = 0;
            if (t.Material && t.Material !== "") {
                i.forEach(e => {
                    n += parseFloat(e.Quantity, 10)
                });
                t.Quantity = n
            } else {
                n = 0;
                i.forEach(e => {
                    n += parseFloat(e.Quantity, 10)
                });
                var r = parseFloat(a.OrderOpenedQuantity, 10);
                r -= n;
                a.Quantity = r
            }
        },
        createAddDistributionsBatch: function (e, t, a) {
            var i = "/AddDistribution";
            var n = "POST";
            if (t.length > 0) {
                e.setDeferredGroups([a]);
                jQuery.each(t, function (t, r) {
                    if (r.Unsaved) {
                        var o = {
                            Batch: r.Batch,
                            Index: r.Index,
                            ProductionOrder: r.ProductionOrder,
                            Quantity: r.Quantity,
                            Reservation: r.IsUnplanned === false ? r.Reservation : "",
                            ReservationItem: r.IsUnplanned === false ? r.ReservationItem : "",
                            StockType: r.StockType,
                            SpecialStock: r.SpecialStock,
                            StorageLocation: r.StorageLocation,
                            UnitOfMeasure: r.Unit,
                            Material: r.Material,
                            Plant: r.Plant,
                            SalesOrder: r.SalesOrder,
                            SalesOrderItem: r.SalesOrderItem,
                            WMLBin: r.WMLBin !== "" ? r.WMLBin : "",
                            "Strand": r.Strand !== undefined ? r.Strand : "na",	//oItem.Strand,		//++tsinghag1
							"Road" : r.Road !== undefined ? r.Road : "na"		//oItem.Road			//++tsinghag1
                            // "Strand": r.Strand,
                            // "Road": r.Road
                        };
                        e.callFunction(i, {
                            method: n,
                            urlParameters: o,
                            batchGroupId: a,
                            changeSetId: a
                        })
                    }
                })
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
        submitDistributionsBatch: function (e, t, a) {
            var i = this;
            var n = this.oView;
            var r = n.getModel("splitData");
            var o = function (e) {
                   //++T_singhag1 GAP 82a
                   debugger;
                var sErrorMessage = "An error occurred, Please try again!";

				try {
					var oResponse = JSON.parse(e.responseText);
					if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
						sErrorMessage = oResponse.error.message.value;
					}
				} catch (e) {
					console.error("Failed to parse error response", e);
				}

				sap.m.MessageBox.error(sErrorMessage);
                //++T_singhag1 GAP 82a
                //console.log(e);
                t.setRefreshAfterChange(true)
            };
            var s = function (e) {
                var a = false;
                 //++T_singhag1 GAP 82a
				if (e.__batchResponses && e.__batchResponses.length > 0) {
                    if(e.__batchResponses[0].response !== undefined){
					if(e.__batchResponses[0].response.statusCode === '400'){
					var msg = JSON.parse(e.__batchResponses[0].response.body).error.message.value;
					sap.m.MessageBox.error(msg);
					return;
                    }
                }
				}
				 //++T_singhag1 GAP 82a
                if (e.__batchResponses && e.__batchResponses.length > 0) {
                    e.__batchResponses.forEach(e => {
                        if (e.__changeResponses && e.__changeResponses.length > 0) {
                            e.__changeResponses.forEach(e => {
                                if (e.data) {
                                    var t = e.data.AddDistribution;
                                    var i = r.getObject("/NewSplitItems").find(e => e.Index === t.Index + "");
                                    a = true;
                                    if (t.ErrorCode === 0) {
                                        i.Editable = false;
                                        i.Unsaved = false;
                                        i.SplitStatus = "Success";
                                        i.SplitStatusIcon = "sap-icon://sys-enter-2";
                                        var n = "Distribution success";
                                        n += t.MaterialDocument !== undefined ? " - Material document " + t.MaterialDocument + "/" + t.DocumentYear : "";
                                        n += ".";
                                        i.SplitStatusTooltip = n
                                    } else {
                                        i.Editable = t.ErrorType === "E";
                                        i.Unsaved = i.Editable;
                                        i.SplitStatus = "Error";
                                        i.SplitStatusIcon = "sap-icon://error";
                                        i.SplitStatusTooltip = t.ErrorMessage
                                    }
                                }
                            })
                        }
                    })
                }
                if (a) {
                    r.updateBindings(true);
                    t.refresh(true)
                }
            };
            t.setRefreshAfterChange(false);
            t.submitChanges({
                batchGroupId: a,
                success: jQuery.proxy(s, this),
                error: jQuery.proxy(o, this)
            })
        },
        _i18nText: function (e) {
            if (!this.getView()) {
                return e
            }
            var t = this.getView().getModel("i18n");
            if (arguments.length > 1) {
                var a = t.getProperty(arguments[0]);
                if (a) {
                    for (var i = 1; i < arguments.length; ++i) {
                        a = a.replace("{" + i + "}", arguments[i])
                    }
                }
                return a
            } else {
                return t.getProperty(e)
            }
        }
    })
});
//# sourceMappingURL=ListReportExt.controller.js.map