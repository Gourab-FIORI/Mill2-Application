/***********************************************
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
*                                              *
*          Introduction to Developments        *
*                                              *
* -------------------------------------------- *
* |  Module Name:       | ZWAGONLOADING        |
* |---------------------|----------------------|
* |  Developer Name:    | GOURAB SINGHA,       |
* |                     | ANUBHAV MITRA        |
* |---------------------|----------------------|
* |  Project Manager:   | Manas Mishra         |
* |---------------------|----------------------|
* |  Component Name:    | com.ami.zWAGONLOADING|
* |---------------------|----------------------|
* |  Package Name:      | ZFIODEV              |
* |---------------------|----------------------|
* |  Development Date:  | 25.08.2024           |
* -------------------------------------------- *
*                                              *
xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

/**
 * Wagon Load Fiori App: Stylish Overview
 * 
 * This app facilitates loading, shipment, and unloading processes 
 * for wagon data using SAP Fiori screens. Each step of the flow involves 
 * interaction through buttons and input fields, verified by backend methods.
 */

// Screen 1: Action Menu
// Four key buttons trigger different actions:
// 1. "Internal Loading" -> Screen 2a
// 2. "Shipment" -> Screen 2b
// 3. "Unloading" -> Screen 2c
// 4. "Exit" -> Terminates the app

// Screen 2a: Internal Loading
// - Wagon ID (manual/scan) is checked via CHECK_WAGON_INTERNAL.
// - Loading Code auto-fetched from GET_WAGON_DATA, modifiable.
// - Buttons: "Confirm" -> Screen 3 | "Back" -> Screen 1

// Screen 2b: Shipment
// - Same Wagon ID logic as 2a.
// - Buttons: "Confirm" -> Screen 3 | "Back" -> Screen 1

// Screen 2c: Unloading (Internal)
// - Fields: Warehouse (LGNUM), Storage Type (LGTYP), Storage Bin (LGPLA).
// - Buttons: "Confirm" -> Next Screen | "Back" -> Screen 1

// Screen 3: Bar Numbers
// - Input/scan bar numbers, validated by CHECK_BAR.
// - Operation types: Internal Loading (LOAD_BAR_ON_WAGON_INTERNAL), Shipment (LOAD_BAR_ON_WAGON_EXTERNAL), Unloading (UNLOAD_BAR_FROM_WAGON).
// - Buttons: "Confirm" -> Screen 4/exit | "Back" -> Screen 2x

// Screen 4: Wagon Data Overview
// - Display info: Wagon ID, Handling Unit, Warehouse, Status, Loading Code, Lane, Tare/Allowed/Loading/Total Weight.
// - Buttons: "Confirm" -> Save & exit | "Back" -> Screen 3

/***********************************************/

sap.ui.define([
    "sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox",
    "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel", "sap/m/Input",
    "sap/m/Label",
    "sap/m/Button", "sap/m/SelectDialog", "sap/m/Dialog"
  ],
  function (Controller, JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel, Input, Label, Button, SelectDialog, Dialog) {
    "use strict";
    var gContrem = ""; // Global variable to store Contrem value
    return Controller.extend("com.ami.zwagonloading.controller.Home", {
      onInit: function () {
        // This function displays a dialog that prompts the user to enter a Contrem value.
        // The entered value will be stored in a global variable for later use.
        
        // Create model if not already done
        var oModel = new sap.ui.model.json.JSONModel({
          contrem: gContrem
        });
        this.getOwnerComponent().setModel(oModel, "globalData"); // attach as named model

        this._openContremDialog();
      },
      onLanguageChange: function (oEvent) {
        var sSelectedLanguage = oEvent.getParameter("selectedItem").getKey();
        this._setLanguage(sSelectedLanguage);
      },

      _setLanguage: function (sLanguage) {
        var i18nModel = new ResourceModel({
          bundleName: "com.ami.zwagonloading.i18n.i18n",
          bundleLocale: sLanguage
        });
        this.getView().setModel(i18nModel, "i18n");
      },
      /**
       * Navigates to the Internal view
       */
      onNavToInternal: function () {
        this.getOwnerComponent().getRouter().navTo("RouteInternal");
      },

      /**
       * Navigates to the Shipping view
       */
      onNavToShipping: function () {
        this.getOwnerComponent().getRouter().navTo("RouteShipping");
      },

      /**
       * Navigates to the Unload view
       */
      onNavToUnload: function () {
        this.getOwnerComponent().getRouter().navTo("RouteUnload");
      },
      _openContremDialog: function () {
        if (!this._oContremDialog) {
            this._oContremDialog = new Dialog({
                title: "Select Contrem",
                type: "Message",
                content: [
                    new Label({
                        text: "Contrem",
                        labelFor: "contremInput"
                    }),
                    new Input("contremInput", {
                        showValueHelp: true,
                        valueHelpOnly: true,
                        editable: true,
                        placeholder: "Choose from list...",
                        valueHelpRequest: this._onContremValueHelp.bind(this)
                    })
                ],
                beginButton: new Button({
                    text: "Continue",
                    enabled: false,
                    press: function () {
                        gContrem = sap.ui.getCore().byId("contremInput").getValue(); // Save to global
                        this._oContremDialog.close();
                    }.bind(this)
                }),
                escapeHandler: function (oPromise) {
                    oPromise.reject(); // Prevent closing without input
                },
                afterClose: function () {
                    this._oContremDialog.destroy();
                    this._oContremDialog = null;
                }.bind(this)
            });

            this._oContremDialog.open();
        }
    },

    _onContremValueHelp: function () {
        if (!this._oContremVHDialog) {
            this._oContremVHDialog = new SelectDialog({
                title: "Select Contrem",
                items: {
                    path: "/ZzarpsContremSet",
                    template: new sap.m.StandardListItem({
                        title: "{ZzarpsCtrm}" // Adjust if different field name
                        //description: "{Description}" // Optional
                    })
                },
                search: function (oEvent) {
                    var sValue = oEvent.getParameter("value");
                    var oFilter = new sap.ui.model.Filter("ZzarpsCtrm", sap.ui.model.FilterOperator.Contains, sValue);
                    oEvent.getSource().getBinding("items").filter([oFilter]);
                },
                confirm: function (oEvent) {
                    var sSelected = oEvent.getParameter("selectedItem").getTitle();
                    sap.ui.getCore().byId("contremInput").setValue(sSelected);
                    this._oContremDialog.getBeginButton().setEnabled(true);
                    this.getContremValue(sSelected);
                }.bind(this),
                cancel: function () {}
            });

            // Load OData model if not already
            var oModel = this.getView().getModel(); // Assuming your OData model is set to default
            this._oContremVHDialog.setModel(oModel);
        }

        this._oContremVHDialog.open();
    },

    getContremValue: function (contrem) {
      this.getOwnerComponent().getModel("globalData").setProperty("/contrem", contrem);
    },
    });
  });