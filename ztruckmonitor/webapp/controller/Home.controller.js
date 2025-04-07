/***********************************************
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 *          Introduction to Developments        *
 *                                              *
 * -------------------------------------------- *
 * |  Module Name:       | ztruckmonitor        |
 * |---------------------|----------------------|
 * |  Developer Name:    | GOURAB SINGHA,       |
 * |                     | ANUBHAV MITRA        |
 * |---------------------|----------------------|
 * |  Project Manager:   | Manas Mishra         |
 * |---------------------|----------------------|
 * |  Component Name:    | com.ami.ztruckmonitor|
 * |---------------------|----------------------|
 * |  Package Name:      | Zmm_amws             |
 * |---------------------|----------------------|
 * |  Development Date:  | 23.11.2024           |
 * -------------------------------------------- *
 *                                              *
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 ***********************************************/
sap.ui.define([
    "sap/ui/core/mvc/Controller","sap/ui/model/json/JSONModel", "sap/m/MessageBox",
        "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel", "sap/m/Dialog",
        "sap/m/Label",
        "sap/m/Input",
        "sap/m/Button"
],
function (Controller,JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel, Dialog, Label, Input, Button) {
    "use strict";

    return Controller.extend("com.ami.ztruckmonitor.controller.Home", {
        onInit: function () {

            var sDefaultLanguage = sap.ui.getCore().getConfiguration().getLanguage();
            this._setLanguage(sDefaultLanguage);
        },
        onLanguageChange: function (oEvent) {
            var sSelectedLanguage = oEvent.getParameter("selectedItem").getKey();
            this._setLanguage(sSelectedLanguage);
        },

        _setLanguage: function (sLanguage) {
            var i18nModel = new ResourceModel({
                bundleName: "com.ami.ztruckmonitor.i18n.i18n",
                bundleLocale: sLanguage
            });
            this.getView().setModel(i18nModel, "i18n");
        },
        onValidate:function(){
            this.fnGateData();
        },
        onInfoPress: function () {
            MessageBox.information("Press Enter to Fetch Freight Order Details.");
        },
        fnGateData: function () {
            var FO = this.getView().byId("barcodeInputDD").getValue();
            var oModel = this.getView().getModel(); // OData model
            var oFilter = new sap.ui.model.Filter("Freightorder", sap.ui.model.FilterOperator.EQ, FO); 
           
            var sPath = "/GateListSet"; // OData service path 
            var that = this;

            // Show Busy Indicator
            BusyIndicator.show(0);

            oModel.read(sPath, {
                filters: [oFilter], // Apply the filter to the read call
                success: function (oData) {
                    BusyIndicator.hide();
                   // MessageToast.show("Freight Order is Valid!");
                    if(oData.results[0].Messagetype === 'E'){
                        MessageBox.error(oData.results[0].Message);
                         // Reset table model
                    var oTableModel = new JSONModel();
                    that.getView().setModel(oTableModel, "GateList");
                        return;
                    }

                    // Bind data directly to the table model
                    var oTableModel = new JSONModel(oData.results);
                    that.getView().setModel(oTableModel, "GateList");

                    // Validate the wizard step
                    // that._wizard.validateStep(that.byId("Step1"));
                },
                error: function (oError) {
                    BusyIndicator.hide();
                    var sErrorMessage = "An error occurred, Please try again!";

                    try {
                        var oResponse = JSON.parse(oError.responseText);
                        if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
                            sErrorMessage = oResponse.error.message.value;
                        }
                    } catch (e) {
                        console.error("Failed to parse error response", e);
                    }

                    MessageBox.error(sErrorMessage);

                    // Reset table model
                    var oTableModel = new JSONModel();
                    that.getView().setModel(oTableModel, "GateList");

                    //that._wizard.invalidateStep(that.byId("Step1"));
                    console.error(oError);
                },
            });
        },
        onButtonPress:function(Ev){
                var selected = Ev.getSource().getParent().getBindingContext("GateList").getObject();
                var FO= selected.Freightorder;
                var gate=selected.Zzgate;
                this.fnItemData(FO,gate);
                this.handleNav("Details");
            },
            navBack: function () {
                this.byId("navCon").back();
                this.fnGateData();
            },
            onRefreshTriggered: function (tableId) {
                this.byId(tableId).getBinding("items").refresh();
            },
            handleNav: function (page) {
                var navCon = this.byId("navCon");
                navCon.to(this.byId(page), "slide");
            },
            onFinal:function(Ev){
                var selected = Ev.getSource().getParent().getBindingContext("ItemList").getObject();
                // selected.SetItemNotLoaded = true;
                // selected.SetItemLoaded=false;
                this.fnFinalPress(selected);
            },
            onEnd:function(Ev){
                var selected = Ev.getSource().getParent().getBindingContext("ItemList").getObject();
                // selected.SetItemLoaded=true;
                // selected.SetItemNotLoaded = false;
                this.fnFinalPress(selected);
            },
            fnFinalPress: function (payload) {
                // var btn= this.getView().byId("idCancel").getText();
                if (payload.IsLoaded === true){
                    payload.SetItemNotLoaded = true;
                    payload.SetItemLoaded=false;
                } else{
                    payload.SetItemLoaded=true;
                    payload.SetItemNotLoaded = false;
                }
                var oModel = this.getView().getModel(); // OData model
              var sPath = "/FOValidateSet"; // OData service path 
                var that = this;
    
                // Show Busy Indicator
                BusyIndicator.show(0);
    
                oModel.create(sPath, payload,{
                   
                    success: function (oData) {
                        BusyIndicator.hide();
                        if(oData.Messagetype === 'E'){
                            MessageBox.error(oData.Message);
                            return;
                        }else{
                            MessageBox.success(oData.Message);
                        }
                        that.fnItemData(payload.Freightorder,payload.Zzgate);
                     
    
                        // Validate the wizard step
                        // that._wizard.validateStep(that.byId("Step1"));
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        var sErrorMessage = "An error occurred, Please try again!";
    
                        try {
                            var oResponse = JSON.parse(oError.responseText);
                            if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
                                sErrorMessage = oResponse.error.message.value;
                            }
                        } catch (e) {
                            console.error("Failed to parse error response", e);
                        }
    
                        MessageBox.error(sErrorMessage);
    
                        // Reset table model
                        // var oTableModel = new JSONModel();
                        // that.getView().setModel(oTableModel, "ItemList");
    
                        //that._wizard.invalidateStep(that.byId("Step1"));
                        console.error(oError);
                    },
                });
            },
        fnItemData: function (FO,gate) {
            //var FO = this.getView().byId("barcodeInputDD").getValue();
            var oModel = this.getView().getModel(); // OData model
            var oFilter = new sap.ui.model.Filter("Freightorder", sap.ui.model.FilterOperator.EQ, FO); 
            var oFilter1 = new sap.ui.model.Filter("Zzgate", sap.ui.model.FilterOperator.EQ, gate);
           
            var sPath = "/FOValidateSet"; // OData service path 
            var that = this;

            // Show Busy Indicator
            BusyIndicator.show(0);

            oModel.read(sPath, {
                filters: [oFilter,oFilter1], // Apply the filter to the read call
                success: function (oData) {
                    BusyIndicator.hide();
                    //MessageToast.show("Freight Order is Valid!");

                    // Bind data directly to the table model
                    var oTableModel = new JSONModel(oData.results);
                    that.getView().setModel(oTableModel, "ItemList");

                    // Validate the wizard step
                    // that._wizard.validateStep(that.byId("Step1"));
                },
                error: function (oError) {
                    BusyIndicator.hide();
                    var sErrorMessage = "An error occurred, Please try again!";

                    try {
                        var oResponse = JSON.parse(oError.responseText);
                        if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
                            sErrorMessage = oResponse.error.message.value;
                        }
                    } catch (e) {
                        console.error("Failed to parse error response", e);
                    }

                    MessageBox.error(sErrorMessage);

                    // Reset table model
                    var oTableModel = new JSONModel();
                    that.getView().setModel(oTableModel, "ItemList");

                    //that._wizard.invalidateStep(that.byId("Step1"));
                    console.error(oError);
                },
            });
        },
    });
});
