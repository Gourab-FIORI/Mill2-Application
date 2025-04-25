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
    "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel", "sap/m/Input",
    "sap/m/Label",
    "sap/m/Button","sap/m/SelectDialog","sap/m/Dialog"
],
function (Controller, JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel,Input, Label, Button,SelectDialog,Dialog) {
    "use strict";
    var gContrem = ""; // Global variable to store Contrem value
    return Controller.extend("com.ami.zdeliverypicking.controller.Main", {
        onInit: function () {
             // Create JSON model for barcodes
             this._Page = this.byId("page");
             this._wizard=this.byId("wizard");
             var oModel = new JSONModel({ barcodes: [] });
             this.getView().byId("barcodeList").setModel(oModel);
             var sDefaultLanguage = sap.ui.getCore().getConfiguration().getLanguage();
             this._setLanguage(sDefaultLanguage);
              // Open the Contrem dialog for user input ++09.04.2025
                // This function displays a dialog that prompts the user to enter a Contrem value.
                // The entered value will be stored in a global variable for later use.
                this._openContremDialog();
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
            success: function (oData,response) {
                BusyIndicator.hide();
                if (response.headers["sap-message"]) {
                    const parsedMessage = JSON.parse(response.headers["sap-message"]);
                    
                    if (parsedMessage.severity === 'warning') {
                        // Show the warning message using MessageBox.warning
                        sap.m.MessageBox.warning(parsedMessage.message, {
                            title: parsedMessage.code,
                            actions: [sap.m.MessageBox.Action.OK],
                            onClose: function (oAction) {
                                // Optionally handle the close action if needed
                                that.onAddBarcode(sBarcode);
                               
                                that.byId("Step2").setValidated(true);
                                that._updateWizardButtons(); // update buttons
                            }
                        });
                    }
                } else {
                that.onAddBarcode(sBarcode);
                MessageToast.show("Barcode is Valid!");
                that.byId("Step2").setValidated(true);
                that._updateWizardButtons(); // update buttons
                }
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
                that._updateWizardButtons(); // update buttons
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
    // onAddBarcode: function (sBarcode) {
    //     var oInput = this.byId("barcodeInput");
    //     // var sBarcode = oInput.getValue();
    //     if (sBarcode) {
    //         var oModel = this.getView().byId("barcodeList").getModel();
    //         var aBarcodes = oModel.getProperty("/barcodes");
    //         aBarcodes.push({ barcode: sBarcode });
    //         oModel.setProperty("/barcodes", aBarcodes);
    //         oInput.setValue("");
    //     }
    // },
    //Check duplicate entries
    onAddBarcode: function (sBarcode) {
        var oInput = this.byId("barcodeInput");
    
        if (sBarcode) {
            var oModel = this.getView().byId("barcodeList").getModel();
            var aBarcodes = oModel.getProperty("/barcodes") || [];
    
            // Check for duplicates
            var bExists = aBarcodes.some(function (oItem) {
                return oItem.barcode === sBarcode;
            });
    
            if (bExists) {
                MessageBox.warning("This barcode already exists.");
                oInput.setValue("");
                return;
            }
    
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
                success: function (oData,response) {
                    BusyIndicator.hide();
                    if (response.headers["sap-message"]) {
                        const parsedMessage = JSON.parse(response.headers["sap-message"]);
                        
                        if (parsedMessage.severity === 'warning') {
                            // Show the warning message using MessageBox.warning
                            sap.m.MessageBox.warning(parsedMessage.message, {
                                title: parsedMessage.code,
                                actions: [sap.m.MessageBox.Action.OK],
                                onClose: function (oAction) {
                                    // Optionally handle the close action if needed
                                    var data = new JSONModel(oData);
                                    that.byId("simpleFormId").setModel(data,"deliveryModel");
                                     that._wizard.validateStep(that.byId("Step1"));
                                     that._updateWizardButtons(); // update buttons
                                }
                            });
                        }
                    } else {
                    MessageToast.show("Delivery Item No. is Valid!");
                    var data = new JSONModel(oData);
                    that.byId("simpleFormId").setModel(data,"deliveryModel");
                     that._wizard.validateStep(that.byId("Step1"));
                     that._updateWizardButtons(); // update buttons
                    }
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
                    that._updateWizardButtons(); // update buttons
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
        Function : str,
        contrem : this.getContremValue()
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
        that._updateWizardButtons(); // update buttons
        
      
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
                    this._wizard.discardProgress(this.byId("Step1"));
                    this._updateWizardButtons(); // update buttons
    },
    _openContremDialog: function () {
        if (!this._oContremDialog) {
          this._oContremDialog = new Dialog({
            title: "Select Contrem",
            type: "Message",
            content: [
              new Label({ text: "Contrem", labelFor: "contremInput" }),
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
            }.bind(this),
            cancel: function () {}
          });
  
          // Load OData model if not already
          var oModel = this.getView().getModel(); // Assuming your OData model is set to default
          this._oContremVHDialog.setModel(oModel);
        }
  
        this._oContremVHDialog.open();
      },
  
      getContremValue: function () {
        return gContrem;
      },
      _updateWizardButtons: function () {
        var oWizard = this.byId("wizard");
        var oNextButton = this.byId("btnNext");
        var oBackButton = this.byId("btnBack");
        var oConfirmButton = this.byId("btnConfirm");
        var oCurrentStep = oWizard.getCurrentStep();
    
        // Step references
        var oStep1 = this.byId("Step1");
        var oStep2 = this.byId("Step2");
    
        // Back button should be visible after first step
        oBackButton.setVisible(oCurrentStep !== oStep1.getId());
    
        if (oCurrentStep === oStep1.getId()) {
            oNextButton.setVisible(true);
            oNextButton.setEnabled(oStep1.getValidated());
            oConfirmButton.setVisible(false);
        } else if (oCurrentStep === oStep2.getId()) {
            oNextButton.setVisible(false);
            oConfirmButton.setVisible(true);
            oConfirmButton.setEnabled(oStep2.getValidated());
        }
    },
    onNextPress: function () {
        var oWizard = this.byId("wizard");
        oWizard.nextStep();
        this._updateWizardButtons();
    },
    
    onBackPress: function () {
        var oWizard = this.byId("wizard");
        oWizard.previousStep();
        this._updateWizardButtons();
    }
    
    
    });
});
