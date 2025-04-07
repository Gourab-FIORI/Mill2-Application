/***********************************************
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 *          Introduction to Developments        *
 *                                              *
 * -------------------------------------------- *
 * |  Module Name:       | ZSTAGEPAIRING         | *
 * |---------------------|---------------------| *
 * |  Developer Name:    | GOURAB SINGHA,      | *
 * |                     | ANUBHAV MITRA       | *
 * |---------------------|---------------------| *
 * |  Project Manager:   | Manas Mishra        | *
 * |---------------------|---------------------| *
 * |  Component Name:    | com.ami.zstagepairing | *
 * |---------------------|---------------------| *
 * |  Package Name:      | ZFIODEV             | *
 * |---------------------|---------------------| *
 * |  Development Date:  | 23.08.2024          | *
 * -------------------------------------------- *
 *                                              *
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 * This SAP UI5 Fiori application is designed to streamline the process of selecting a Pair,
 * entering barcodes, and printing labels. The application leverages the `sap.m.Wizard` control
 * to guide users through multiple steps in a user-friendly manner. Key features include:
 *
 * 1. Pair Selection:
 *    - A dropdown menu for selecting the desired Pair from a list.
 *
 * 2. Barcode Entry:
 *    - Functionality to enter multiple barcodes.
 *    - Options to delete individual barcodes or clear all entries at once.
 *    - Automatic barcode/QR code scanning to quickly add entries.
 *
 * 3. Start Pairing:
 *    - Buttons to pair labels for both Packages.
 *
 * 4. Accessibility:
 *    - The application is optimized for use on both mobile and desktop platforms.
 *
 * The aim is to provide an intuitive and efficient interface for users, ensuring that the
 * process of selecting a Pair and printing labels is as seamless as possible.
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

    return Controller.extend("com.ami.zstagepairing.controller.View1", {
        onInit: function () {
                // Create JSON model for barcodes
                this.onInitialLoad();
                this._Page = this.byId("page");
                var oModel = new JSONModel({ barcodes: [] });
                var oModel1 = new JSONModel({ barcodes: [] });
                this.getView().byId("barcodeList1").setModel(oModel);
                this.getView().byId("barcodeList2").setModel(oModel1);
                var sDefaultLanguage = sap.ui.getCore().getConfiguration().getLanguage();
                this._setLanguage(sDefaultLanguage);
                prefixId = this.createId();
                	if (prefixId){
                		prefixId = prefixId.split("--")[0] + "--";
                	} else {
                		prefixId = "";
            }
        },
        onLanguageChange: function (oEvent) {
            var sSelectedLanguage = oEvent.getParameter("selectedItem").getKey();
            this._setLanguage(sSelectedLanguage);
        },
        _setLanguage: function (sLanguage) {
            var i18nModel = new ResourceModel({
                bundleName: "com.ami.zstagepairing.i18n.i18n",
                bundleLocale: sLanguage
            });
            this.getView().setModel(i18nModel, "i18n");
        },
        onComboBoxChange: function (oEvent) {
            var oComboBox = oEvent.getSource();
            var sSelectedKey = oComboBox.getSelectedKey();
            var oWizardStep1 = this.byId("printerStep");

            if (sSelectedKey) {
                // oWizardStep1.setValidated(true);
                this.oNextBtn.setEnabled(true);
            } else {
                // oWizardStep1.setValidated(false);
                this.oNextBtn.setEnabled(false);
            }
        },
        onInfoPress: function () {
            MessageBox.information("Press Enter to Add more Barcodes.");
        },
        toggleVisibility: function () {
            this._Page.setShowFooter(!this._Page.getShowFooter());
        },

        onActivate_old: function (oEvent) {
            var sCurrentStepId = oEvent.getParameter("id");
            sCurrentStepId = sCurrentStepId.split('-').pop();
            if(sCurrentStepId === "Step2"){
                if(this.getView().byId("barcodeList1").getModel().getData().barcodes.length === 0){
                    MessageBox.information("Please enter a barcode first before proceeding.");
                     // Reset the wizard to Step 2 to block navigation
            var oWizard = this.getView().byId("wizard");
            oWizard.discardProgress(oWizard.getSteps()[1]); // Reset to Step 2
            oWizard.goToStep(oWizard.getSteps()[1], true);
                    return;
                }
            }
           
        },
        onCheckBarcode: function (sBarcode) {
            var oModel = this.getView().getModel();
            if(!sBarcode){
                MessageBox.error("Please enter a barcode first before proceeding.");
                return;
            }
            var sPath = "/Check_BarSet('" + sBarcode + "')";
            var that = this;
            // Show Busy Indicator
            BusyIndicator.show(0);
            oModel.read(sPath, {
                success: function (oData) {
                    BusyIndicator.hide();
                    that.onAddBarcode(sBarcode);
                    MessageToast.show("Barcode is Valid!");
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
                    that.byId("barcodeinput1").setValue("");
                    that.byId("barcodeinput2").setValue("");
                    
                    console.error(oError);
                }
            });
        },
        onScanBarcode: function (ev) {
            var sBarcode = ev.getSource().getValue();
            this.onCheckBarcode(sBarcode);
        },
        onAddBarcode: function (sBarcode) {
            var oInput1 = this.byId("barcodeinput1");
             var sBarcode1 = oInput1.getValue();
             var oInput2 = this.byId("barcodeinput2");
             var sBarcode2 = oInput2.getValue();
            if (sBarcode1) {
                var oModel = this.getView().byId("barcodeList1").getModel();
                var aBarcodes = oModel.getProperty("/barcodes");
                aBarcodes.push({ barcode: sBarcode });
                oModel.setProperty("/barcodes", aBarcodes);
                oInput1.setValue("");
            }else if (sBarcode2) {
                var oModel = this.getView().byId("barcodeList2").getModel();
                var aBarcodes = oModel.getProperty("/barcodes");
                aBarcodes.push({ barcode: sBarcode });
                oModel.setProperty("/barcodes", aBarcodes);
                oInput2.setValue("");
            }
        },
        //just for demo purpose
        onScanBarcode1: function (sBarcode) {
            var oInput = this.byId("barcodeinput1");
            var sBarcode = oInput.getValue();
            if (sBarcode) {
                var oModel = this.getView().byId("barcodeList1").getModel();
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
            var oModel = oEvent.getSource().getModel();
            var aBarcodes = oModel.getProperty("/barcodes");
            var iIndex = sPath.split("/").pop();
            aBarcodes.splice(iIndex, 1);
            oModel.setProperty("/barcodes", aBarcodes);
        },
        onClearAll: function (ev) {
            var ListID = 'barcodeList'+ev.getSource().getId().slice(-1);
            var InputID = 'barcodeinput'+ev.getSource().getId().slice(-1)
            var oModel = this.getView().byId(ListID).getModel();
            oModel.setProperty("/barcodes", []);
            this.byId(InputID).setValue("");
        },
        //Pairing function with get Entity set, now it's obsolete
        fnPair1: function () {
            // Define your filter parameters
            var filters = [];
            var spath= "/pairBarSet";
            var printer = this.getView().byId("printerSelect").getValue();
            // Add BAR_NBR filters (assuming BAR_NBR values are dynamic)
            var barNumbers1 = this.getView().byId("barcodeList1").getModel().getData().barcodes;
            var barNumbers2 = this.getView().byId("barcodeList2").getModel().getData().barcodes;
            if (barNumbers1.length === 0 || barNumbers2.length === 0) {
                MessageBox.error("Scan the Barcodes first before Pairing");
                return;
            }else if (barNumbers1.length !== barNumbers2.length) {
                MessageBox.error("Both packages Should Contain Same Numbers of BAR");
                return;
            }
            // Iterate through each BAR_NBR1 value and create filter
            barNumbers1.forEach(function (barNumber) {
                filters.push(new sap.ui.model.Filter('BAR_NBR1', sap.ui.model.FilterOperator.EQ, barNumber.barcode));
            });
            // Iterate through each BAR_NBR2 value and create filter
            barNumbers2.forEach(function (barNumber) {
                filters.push(new sap.ui.model.Filter('BAR_NBR2', sap.ui.model.FilterOperator.EQ, barNumber.barcode));
            });

            // Add PRINTER filter
            filters.push(new sap.ui.model.Filter('ZZARPS_ARBPL', sap.ui.model.FilterOperator.EQ, printer));

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
        //pairing function with Create entity set
        fnPair: function () {
            // Define your path and data object for the create request
            var spath = "/pairBarSet";
            var oDataPayload = {};
            
            // Get printer value
            var printer = this.getView().byId("printerSelect").getValue();
            
            // Get barcodes from both lists
            var barNumbers1 = this.getView().byId("barcodeList1").getModel().getData().barcodes;
            var barNumbers2 = this.getView().byId("barcodeList2").getModel().getData().barcodes;
            
            // Check for barcode list lengths
            if (barNumbers1.length === 0 || barNumbers2.length === 0) {
                MessageBox.error("Scan the Barcodes first before Pairing");
                return;
            } else if (barNumbers1.length !== barNumbers2.length) {
                MessageBox.error("Both packages should contain the same numbers of BAR");
                return;
            }
            
            // Combine barcodes into comma-separated strings
            var barNumbers1String = barNumbers1.map(function (barNumber) {
                return barNumber.barcode;
            }).join(",");
            
            var barNumbers2String = barNumbers2.map(function (barNumber) {
                return barNumber.barcode;
            }).join(",");
            
            // Set up data payload for the create request
            oDataPayload.BAR_NBR1 = barNumbers1String;
            oDataPayload.BAR_NBR2 = barNumbers2String;
            oDataPayload.ZZARPS_ARBPL = printer;
            
            // Show busy indicator
            BusyIndicator.show(0);
            
            var that = this;
            var oModel = this.getView().getModel(); // Assuming the model is already set on the view
            
            // Execute OData create request
            oModel.create(spath, oDataPayload, {
                success: function (oData) {
                    BusyIndicator.hide();
                    that.onSuccessMessageBoxPress();
                    // MessageToast.show("Label Printed Successfully"); // Uncomment if needed
                    // console.log(oData); // Uncomment if you want to log the success response
                },
                error: function (oError) {
                    BusyIndicator.hide();
                    var sErrorMessage = "An error occurred, please try again!";
                    
                    try {
                        var oResponse = JSON.parse(oError.responseText);
                        if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
                            sErrorMessage = oResponse.error.message.value;
                        }
                    } catch (e) {
                        console.error("Failed to parse error response", e);
                    }
                    
                    that.onErrorMessageBoxPress(sErrorMessage);
                    console.error(oError);
                }
            });
        },
        
        onSuccessMessageBoxPress: function () {
            var that = this;
            MessageBox.success("Stage Pairing Successfull", {
                actions: ["Start Over", "Exit"],
                emphasizedAction: "Start Over",
                onClose: function (sAction) {
                    if (sAction === "Start Over") {
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
            var oModel = this.getView().byId("barcodeList1").getModel();
            oModel.setProperty("/barcodes", []);
            var oModel1 = this.getView().byId("barcodeList2").getModel();
            oModel1.setProperty("/barcodes", []);
            //this.onClearAll();
            //this.toggleVisibility();
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
        onInitialLoad: function () {
            this.oWizard = this.byId("wizard");
            this.oNextBtn = this.byId("nextBtn");
            this.oBackBtn = this.byId("backBtn");
            this.oFinishBtn = this.byId("finishBtn");
        },
        
        onNextStep: function () {
            this.oWizard.nextStep();
            this._updateFooterButtons();
        },
        
        onBackStep: function () {
            this.oWizard.previousStep();
            this._updateFooterButtons();
        },
        
        onConfirmPair: function () {
            this.fnPair(); // triggers wizard completion logic
        },
        
        onActivate: function (oEvent) {
            const oWizard = this.byId("wizard");
            const sCurrentStepId = oEvent.getParameter("id").split('-').pop();
        
            // Step 2 validation: ensure Step 1 has at least one barcode
            if (sCurrentStepId === "Step2") {
                const oList = this.byId("barcodeList1");
                const oModel = oList.getModel();
                const aBarcodes = oModel && oModel.getData().barcodes;
        
                if (!aBarcodes || aBarcodes.length === 0) {
                    MessageBox.information("Please enter a barcode first before proceeding.");
                    oWizard.discardProgress(oWizard.getSteps()[1]); // Discard progress to Step 2
                    oWizard.goToStep(oWizard.getSteps()[1], true);  // Revert to Step 1
                    return;
                }
            }
        
            // Update footer buttons based on current step
            this._updateFooterButtons();
        },
        
        _updateFooterButtons: function () {
            const oWizard = this.byId("wizard");
            const aSteps = oWizard.getSteps();
            const oCurrentStep = oWizard.getCurrentStep();
            const iCurrentIndex = aSteps.indexOf(oCurrentStep);
        
            this.byId("backBtn").setVisible(iCurrentIndex > 0);
            this.byId("nextBtn").setVisible(iCurrentIndex < aSteps.length - 1);
            this.byId("finishBtn").setVisible(iCurrentIndex === aSteps.length - 1);
        },
       
        
  
    });
});
