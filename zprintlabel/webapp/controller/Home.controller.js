/***********************************************
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 *          Introduction to Developments        *
 *                                              *
 * -------------------------------------------- *
 * |  Module Name:       | ZPRINTLABEL         | *
 * |---------------------|---------------------| *
 * |  Developer Name:    | GOURAB SINGHA,      | *
 * |                     | ANUBHAV MITRA       | *
 * |---------------------|---------------------| *
 * |  Project Manager:   | Manas Mishra        | *
 * |---------------------|---------------------| *
 * |  Component Name:    | com.ami.zprintlabel | *
 * |---------------------|---------------------| *
 * |  Package Name:      | ZFIODEV             | *
 * |---------------------|---------------------| *
 * |  Development Date:  | 16.07.2024          | *
 * -------------------------------------------- *
 *                                              *
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 * This SAP UI5 Fiori application is designed to streamline the process of selecting a printer,
 * entering barcodes, and printing labels. The application leverages the `sap.m.Wizard` control
 * to guide users through multiple steps in a user-friendly manner. Key features include:
 *
 * 1. Printer Selection:
 *    - A dropdown menu for selecting the desired printer from a list.
 *
 * 2. Barcode Entry:
 *    - Functionality to enter multiple barcodes.
 *    - Options to delete individual barcodes or clear all entries at once.
 *    - Automatic barcode/QR code scanning to quickly add entries.
 *
 * 3. Label Printing:
 *    - Buttons to print labels for both plants and customers.
 *
 * 4. Accessibility:
 *    - The application is optimized for use on both mobile and desktop platforms.
 *
 * The aim is to provide an intuitive and efficient interface for users, ensuring that the
 * process of selecting a printer and printing labels is as seamless as possible.
 *  * Change Requests:
 * - CR-001: [Mention description here].
 *           User IDs: [Enter User IDs], Date: [Enter Date]
 *
 * - CR-002: [Mention description here].
 *           User IDs: [Enter User IDs], Date: [Enter Date]
 ***********************************************/

sap.ui.define([
    "sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox",
    "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel"
],
    function (Controller, JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel) {
        "use strict";
        var prefixId;
        	var oScanResultText;
        return Controller.extend("com.ami.zprintlabel.controller.Home", {
            onInit: function () {
                // Create JSON model for barcodes
                this._Page = this.byId("page");
                var oModel = new JSONModel({ barcodes: [] });
                this.getView().byId("barcodeList").setModel(oModel);
                var sDefaultLanguage = sap.ui.getCore().getConfiguration().getLanguage();
                this._setLanguage(sDefaultLanguage);
                prefixId = this.createId();
                	if (prefixId){
                		prefixId = prefixId.split("--")[0] + "--";
                	} else {
                		prefixId = "";
                	}
                	//oScanResultText = Element.getElementById(prefixId + 'sampleBarcodeScannerResult');
            },
            onBeforeRendering:function(){
                //this.onCheckPrinter('0');
            },
            onLanguageChange: function (oEvent) {
                var sSelectedLanguage = oEvent.getParameter("selectedItem").getKey();
                this._setLanguage(sSelectedLanguage);
            },

            _setLanguage: function (sLanguage) {
                var i18nModel = new ResourceModel({
                    bundleName: "com.ami.zprintlabel.i18n.i18n",
                    bundleLocale: sLanguage
                });
                this.getView().setModel(i18nModel, "i18n");
            },
            onComboBoxChange: function (oEvent) {
                var oComboBox = oEvent.getSource();
                var sSelectedKey = oComboBox.getSelectedKey();
                var oWizardStep1 = this.byId("printerStep");
    
                if (sSelectedKey) {
                    oWizardStep1.setValidated(true);
                } else {
                    oWizardStep1.setValidated(false);
                }
            },
            onInfoPress: function () {
                MessageBox.information("Press Enter to Add more Barcodes.");
            },
            toggleVisibility: function () {
                this._Page.setShowFooter(!this._Page.getShowFooter());
            },
            //show buttons on next page
            onActivate: function (oEvent) {
                var sCurrentStepId = oEvent.getParameter("id");
                sCurrentStepId = sCurrentStepId.split('-').pop();

                this.toggleVisibility();

                // if (sCurrentStepId === 'printerStep') {

                // }
            },
            fntranslate: function(txt){
                var oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                var sTxt = oResourceBundle.getText(txt);
                return sTxt;
            },
            //on check Barcode from backend 
            onCheckBarcode: function (sBarcode) {
                var oModel = this.getView().getModel();
                var sPath = "/Check_BarSet('" + sBarcode + "')";
                var that = this;
                // Show Busy Indicator
                BusyIndicator.show(0);
                oModel.read(sPath, {
                    success: function (oData) {
                        BusyIndicator.hide();
                        that.onAddBarcode(sBarcode);
                        MessageToast.show(that.fntranslate("Msg1"));
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
                        console.error(oError);
                    }
                });
            },
              //on check default printner 
              onCheckPrinter: function (code) {
                var oModel = this.getView().getModel();
                var sPath = "/ZshOutputDevice1Set('" + code + "')";
                var that = this;
                // Show Busy Indicator
                BusyIndicator.show(0);
                oModel.read(sPath, {
                    success: function (oData) {
                        BusyIndicator.hide();
                      if(oData.OutputDevice === "$NULL"){
                        MessageToast.show("Default Printer hasn't been set to your User Profile");
                        // MessageBox.warning("Default Printer hasn't been set to your User Profile or Printer ID is not Valid");
                      }else{
                        that.getView().byId("printerSelect").setSelectedKey(oData.OutputDevice);
                        that.byId("printerStep").setValidated(true);
                      }
                      
                        // Handle successful barcode check here
                        //console.log(oData);
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        var sErrorMessage = "An error occurred,Please reload!";

                        try {
                            var oResponse = JSON.parse(oError.responseText);
                            if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
                                sErrorMessage = oResponse.error.message.value;
                            }
                        } catch (e) {
                            console.error("Failed to parse error response", e);
                        }

                        MessageBox.error(sErrorMessage);
                        that.byId("printerStep").setValidated(false);
                        console.error(oError);
                    }
                });
            },
            //Triggering submit on scan of a barcode
            onScanBarcode: function (ev) {
                var sBarcode = ev.getSource().getValue();
                this.onCheckBarcode(sBarcode);
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
            //just for demo purpose
            onScanBarcode1: function (sBarcode) {
                var oInput = this.byId("barcodeInput");
                var sBarcode = oInput.getValue();
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
            onClearAll: function () {
                var oModel = this.getView().byId("barcodeList").getModel();
                oModel.setProperty("/barcodes", []);
                this.byId("barcodeInput").setValue("");
            },
            onPrintPlantLabel: function () {
                // Implement print logic for plant label
                this.fnPrintLabel("/plantLabelSet");
            },
            onPrintCustomerLabel: function () {
                // Implement print logic for customer label
                this.fnPrintLabel("/customerLabelSet");
            },
            //Printing label function
            fnPrintLabel: function (spath) {
                // Define your filter parameters
                var filters = [];
                var printer = this.getView().byId("printerSelect").getValue();
                // Add BAR_NBR filters (assuming BAR_NBR values are dynamic)
                var barNumbers = this.getView().byId("barcodeList").getModel().getData().barcodes;
                if (barNumbers.length === 0) {
                    MessageBox.error("Scan the Barcodes first before printing");
                    return;
                }
                // Iterate through each BAR_NBR value and create filter
                barNumbers.forEach(function (barNumber) {
                    filters.push(new sap.ui.model.Filter('BAR_NBR', sap.ui.model.FilterOperator.EQ, barNumber.barcode));
                });

                // Add PRINTER filter
                filters.push(new sap.ui.model.Filter('PRINTER', sap.ui.model.FilterOperator.EQ, printer));

                // Combine filters with 'and'
                var oFilter = new sap.ui.model.Filter({
                    filters: filters,
                    and: true
                });
                BusyIndicator.show(0);
                var that = this;
                // Execute OData request with the filter
                var oModel = this.getView().getModel(); // Assuming the model is already set on the view
                oModel.read(spath, {
                    filters: [oFilter],
                    success: function (oData) {
                        BusyIndicator.hide();
                        that.onSuccessMessageBoxPress();
                        // if (!oData.results) {
                        //     MessageToast.show("Label Printed Successfully");
                        // } else {
                        //     MessageToast.show("An error occurred,Please try again!");
                        // }
                        // console.log(oData);
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
                        that.onErrorMessageBoxPress(sErrorMessage);
                        //MessageBox.error(sErrorMessage);
                        console.error(oError);
                    }
                });

            },
            fntranslate: function(txt){
                var oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                var sTxt = oResourceBundle.getText(txt);
                return sTxt;
            },
            onSuccessMessageBoxPress: function () {
                var that = this;
                MessageBox.success(that.fntranslate("SuccessMsg"), {
                    actions: [that.fntranslate("Start_over"), that.fntranslate("Exit")],
                    emphasizedAction: that.fntranslate("Start_over"),
                    onClose: function (sAction) {
                        if (sAction === that.fntranslate("Start_over")) {
                            that.resetWizard();
                        } else {
                            window.history.back();
                        }

                    },
                    dependentOn: this.getView()
                });
            },
            onErrorMessageBoxPress: function (msg) {
                var that = this;
                MessageBox.error(msg, {
                    actions:  [that.fntranslate("Start_over"), that.fntranslate("Exit")],
                    emphasizedAction: that.fntranslate("Start_over"),
                    onClose: function (sAction) {
                        if (sAction === that.fntranslate("Start_over")) {
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
                this.onClearAll();
                this.toggleVisibility();
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
            
            // Handler for successful printer scan events
            onPrinterScanSuccess: function (oEvent) {
                var sScannedValue = oEvent.getParameter("text").toUpperCase(); // Force uppercase
                var oComboBox = this.byId("printerSelect");
                // Retrieve all items from the ComboBox
                var oItems = oComboBox.getItems();
                // Initialize a flag to track if a matching printer was found
                var bFound = false;

                // Loop through each item in the ComboBox to check for a match
                for (var i = 0; i < oItems.length; i++) {
                    var oItem = oItems[i];
                    // Compare the scanned value with the item's key (case-insensitive)
                    if (oItem.getKey().toUpperCase() === sScannedValue) {
                        oComboBox.setSelectedKey(oItem.getKey()); // Use original key (case-sensitive)
                        bFound = true;
                        this.byId("printerStep").setValidated(true);
                        break;
                    }
                }

                // If no matching printer was found, clear the selection
                if (!bFound) {
                    oComboBox.setSelectedKey(""); // Clear selection
                    this.byId("printerStep").setValidated(false);
                    sap.m.MessageBox.warning("Printer not found for scanned value: " + sScannedValue, {
                        title: "Scan Failed",
                        actions: [sap.m.MessageBox.Action.OK]
                    });
                }
            }
            
            
      
        });
    });
