/***********************************************
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 *          Introduction to Developments        *
 *                                              *
 * -------------------------------------------- *
 * |  Module Name:       | zdeliverypicking     |
 * |---------------------|----------------------|
 * |  Developer Name:    | GOURAB SINGHA,       |
 * |                     | ANUBHAV MITRA        |
 * |---------------------|----------------------|
 * |  Project Manager:   | Manas Mishra         |
 * |---------------------|----------------------|
 * |  Component Name:    | com.ami.zdeliverypicking|
 * |---------------------|----------------------|
 * |  Package Name:      | ZFIODEV              |
 * |---------------------|----------------------|
 * |  Development Date:  | 23.09.2024           |
 * -------------------------------------------- *
 *                                              *
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 ***********************************************/
sap.ui.define([
    "sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox",
    "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel"
],
function (Controller, JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel) {
    "use strict";

    return Controller.extend("com.ami.zdeliverypicking.controller.Main", {
        onInit: function () {
             // Create JSON model for barcodes
             this._Page = this.byId("page");
             this._wizard=this.byId("wizard");
             var oModel = new JSONModel({ barcodes: [] });
             this.getView().byId("barcodeList").setModel(oModel);
             var sDefaultLanguage = sap.ui.getCore().getConfiguration().getLanguage();
             this._setLanguage(sDefaultLanguage);
        },
        onLanguageChange: function (oEvent) {
          var sSelectedLanguage = oEvent.getParameter("selectedItem").getKey();
          this._setLanguage(sSelectedLanguage);
      },

      _setLanguage: function (sLanguage) {
          var i18nModel = new ResourceModel({
              bundleName: "com.ami.zdeliverypicking.i18n.i18n",
              bundleLocale: sLanguage
          });
          this.getView().setModel(i18nModel, "i18n");
      },
       //on check Barcode from backend 
       onCheckBarcode: function (sBarcode) {
        var oModel = this.getView().getModel();
        var sPath = "/checkBarSet('" + sBarcode + "')";
        var that = this;
        // Show Busy Indicator
        BusyIndicator.show(0);
        oModel.read(sPath, {
            success: function (oData) {
                BusyIndicator.hide();
                that.onAddBarcode(sBarcode);
                MessageToast.show("Barcode is Valid!");
                that.byId("Step2").setValidated(true);
                // Handle successful barcode check here
                //console.log(oData);
            },
            error: function (oError) {
                BusyIndicator.hide();
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
                that.byId("Step2").setValidated(false);
                console.error(oError);
            }
        });
    },
    //Triggering submit on scan of a barcode
    onScanBarcode: function (ev) {
        var sBarcode = ev.getSource().getValue();
        this.onCheckBarcode(sBarcode);
    },
     //Triggering submit on scan of a deliveryItem
     onScanBarcodeDD: function (ev) {
        var sBarcode = ev.getSource().getValue();
        this.fnDeliveryData(sBarcode);
    },
    onAddBarcode: function (sBarcode) {
        var oInput = this.byId("barcodeInput");
        // var sBarcode = oInput.getValue();
        if (sBarcode) {
            var oModel = this.getView().byId("barcodeList").getModel();
            var aBarcodes = oModel.getProperty("/barcodes");
            aBarcodes.push({ barcode: sBarcode });
            oModel.setProperty("/barcodes", aBarcodes);
            oInput.setValue("");
        }
    },
      //Deletes the barcode
      onDeleteBarcode: function (oEvent) {
        var oItem = oEvent.getSource().getParent();
        var sPath = oItem.getBindingContext().getPath();
        var oModel = this.getView().byId("barcodeList").getModel();
        var aBarcodes = oModel.getProperty("/barcodes");
        var iIndex = sPath.split("/").pop();
        aBarcodes.splice(iIndex, 1);
        oModel.setProperty("/barcodes", aBarcodes);
    },
  
      // Code was coomented because we will not be using camera module
      onScanSuccess: function(oEvent) {
        if (oEvent.getParameter("cancelled")) {
            MessageToast.show("Scan cancelled", { duration:1000 });
        } else {
            if (oEvent.getParameter("text")) {
                this.onCheckBarcode(oEvent.getParameter("text"));
            } else {
                MessageToast.show("Scan failed, Please try again!");
            }
        }
    },
    onScanError: function(oEvent) {
        MessageToast.show("Scan failed: " + oEvent, { duration:1000 });
    },
   
    // for Delivery item access the scan camera
    onScanSuccessDD: function(oEvent) {
        if (oEvent.getParameter("cancelled")) {
            MessageToast.show("Scan cancelled", { duration:1000 });
        } else {
            if (oEvent.getParameter("text")) {
                this.fnDeliveryData(oEvent.getParameter("text"));
            } else {
                MessageToast.show("Scan failed, Please try again!");
            }
        }
    },
    fnDeliveryData:function(code){
     
            var oModel = this.getView().getModel();
            var sPath = "/deliveryDataSet('" + code + "')";
            var that = this;
            // Show Busy Indicator
            BusyIndicator.show(0);
            oModel.read(sPath, {
                success: function (oData) {
                    BusyIndicator.hide();
                    MessageToast.show("Delivery Item No. is Valid!");
                    var data = new JSONModel(oData);
                    that.byId("simpleFormId").setModel(data,"deliveryModel");
                     that._wizard.validateStep(that.byId("Step1"));
                     //that.onAddBarcode(sBarcode);
                    // Handle successful barcode check here
                    //console.log(oData);
                },
                error: function (oError) {
                    BusyIndicator.hide();
                    var sErrorMessage = "An error occurred,Please try again!";
                    //that._wizard.invalidateStep(that.byId("barcodeStep"));
                    try {
                        var oResponse = JSON.parse(oError.responseText);
                        if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
                            sErrorMessage = oResponse.error.message.value;
                        }
                    } catch (e) {
                        console.error("Failed to parse error response", e);
                    }

                    MessageBox.error(sErrorMessage);
                    that.byId("barcodeInputDD").setValue("");
                    var data = new JSONModel();
                    that.byId("simpleFormId").setModel(data,"deliveryModel");
                    that._wizard.invalidateStep(that.byId("Step1"));
                    console.error(oError);
                }
            });
    },
    onPGI:function(){
        this.fnPost("PGI");
    },
    /// to Confirm selection
onConfirm :function(){
    this.fnPost("CONFIRM");
},
fnPost:function(str){
    var oView = this.getView();

    // Get the data from the view or model
   // var sBarNbr = oView.byId("barcodeInput").getValue();
    var sDelivery = oView.byId("barcodeInputDD").getValue();
         // Get barcodes from both lists
         var barNumbers = this.getView().byId("barcodeList").getModel().getData().barcodes;
        
         
         // Check for barcode list lengths
         if (barNumbers.length === 0) {
             MessageBox.error("Scan the Barcodes first before Confirming");
             return;
         }
         
         // Combine barcodes into comma-separated strings
         var barNumbers1String = barNumbers.map(function (barNumber) {
             return barNumber.barcode;
         }).join(",");
         
    // Prepare the data payload
    var oPayload = {
        BAR_NBR: barNumbers1String,
        ZZSD_DEL_ITEM: sDelivery,
        Function : str
    };

    // Get the OData model
    var oModel = oView.getModel();

    // Show a busy indicator while the request is being processed
    sap.ui.core.BusyIndicator.show(0);
    var that = this;
    // Make the OData POST request
    oModel.create("/checkBarSet", oPayload, {
        success: function (oData, response) {
            // Hide the busy indicator
            sap.ui.core.BusyIndicator.hide();

            // Show success message
            that.onSuccessMessageBoxPress("Delivery Picking Was Successful!");
        },
        error: function (oError) {
            BusyIndicator.hide();
         
            // Parse the error message from XML
            var sErrorMessage = "An error occurred. Please try again.";

            try {
                // Parse the XML response
                var oParser = new DOMParser();
                var oXmlDoc = oParser.parseFromString(oError.responseText, "application/xml");
                var oMessage = oXmlDoc.getElementsByTagName("message")[0];
                if (oMessage && oMessage.textContent) {
                    sErrorMessage = oMessage.textContent;
                } else{
                    sErrorMessage = JSON.parse(oError.responseText).error.message.value;
                }

            } catch (e) {
                // Log or handle parsing error if needed
                console.error("Error parsing the XML response:", e);
            }

            // Show error message
            that.onErrorMessageBoxPress(sErrorMessage);
           
           console.error(oError);
        }
    });

},
    onSuccessMessageBoxPress: function (msg) {
        var that = this;
        MessageBox.success(msg, {
            actions: ["Start Over", "Exit"],
            emphasizedAction: "Start Over",
            onClose: function (sAction) {
                if (sAction === "Start Over") {
                    that.resetWizard();
                } else {
                    that.onExit();
                }
    
            },
            dependentOn: this.getView()
        });
    },
    onErrorMessageBoxPress: function (msg) {
        var that = this;
        MessageBox.error(msg, {
            actions: ["Start Over", "Exit"],
            emphasizedAction: "Start Over",
            onClose: function (sAction) {
                if (sAction === "Start Over") {
                    that.resetWizard();
                } else {
                    that.onExit();
                }
    
            },
            dependentOn: this.getView()
        });
    },
    //back to launchpad
    onExit: function () {
        var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
        oCrossAppNav.toExternal({
            target: { shellHash: "#" } // Navigate to the Fiori Launchpad home
        });
    },
     // Reset to the first step
     resetWizard: function () {
        var wizard = this.getView().byId("wizard");
    
        // Reset wizard steps
        wizard.setCurrentStep(wizard.getSteps()[0]);
        this._resetStep2Fields();
        //this._disableStep2Fields(true);
        // this.getView().byId("confirmPrint").setSelected(false);
        this.byId("Step1").setValidated(false);
        
      
    },
    _resetStep2Fields: function () {
        var oView = this.getView();
    
        // Reset all fields in Step1,2
        var oModel = this.getView().byId("barcodeList").getModel();
            oModel.setProperty("/barcodes", []);
            var data = new JSONModel();
                    this.byId("simpleFormId").setModel(data,"deliveryModel");
            oView.byId("barcodeInputDD").setValue("");
        oView.byId("barcodeInput").setValue("");
    
    },
    onInfoPress: function () {
        MessageBox.information("Press Enter to Add more Barcodes.");
    },
    onClearAll: function () {
        
        this.byId("barcodeInput").setValue("");
        var oModel = this.getView().byId("barcodeList").getModel();
        oModel.setProperty("/barcodes", []);
        
    },
    onClearDD: function () {
        
        this.byId("barcodeInputDD").setValue("");
        var data = new JSONModel();
                    this.byId("simpleFormId").setModel(data,"deliveryModel");
                    this.byId("Step1").setValidated(false);
    },

    });
});
