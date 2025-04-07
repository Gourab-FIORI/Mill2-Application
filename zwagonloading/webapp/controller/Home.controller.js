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
    "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel"
],
function (Controller, JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel) {
    "use strict";

    return Controller.extend("com.ami.zwagonloading.controller.Home", {
        onInit: function () {

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
      }
    });
});
