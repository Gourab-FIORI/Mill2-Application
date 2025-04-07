/***********************************************
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 *          Introduction to Developments        *
 *                                              *
 * -------------------------------------------- *
 * |  Module Name:       | ZMOVETOSINGLEUNIT   | *
 * |---------------------|---------------------| *
 * |  Developer Name:    | GOURAB SINGHA,      | *
 * |                     | ANUBHAV MITRA       | *
 * |---------------------|---------------------| *
 * |  Project Manager:   | Manas Mishra        | *
 * |---------------------|---------------------| *
 * |  Component Name:    | com.movetosingleunit.movetosingleunit| *
 * |---------------------|---------------------| *
 * |  Package Name:      | ZFIODEV             | *
 * |---------------------|---------------------| *
 * |  Development Date:  | 13.08.2024          | *
 * -------------------------------------------- *
 *                                              *
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 * ```

/*
 * Key Features of the Move to Single Unit Application:
 *
 * 1. Warehouse Selection: Choose the warehouse for the inventory move.
 * 2. Storage Type Selection: Specify the type of storage within the selected warehouse.
 * 3. Storage Bin Selection: Select the exact storage bin for the items.
 * 4. Batch Print: Print batch labels for the selected items.
 * 5. Batch Information Display: Review detailed information of the batch being moved.
 * 6. Confirmation and Print: Confirm the move and execute the print action to complete the process.



 *  * Change Requests:
 * - CR-001: CR chnages for Wizard button to static button replacement.
 *           User IDs: [T_SINGHAG1], Date: [18.03.2025]
 *
 * - CR-002: [Mention description here].
 *           User IDs: [Enter User IDs], Date: [Enter Date]
 ***********************************************/

sap.ui.define([
    "sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox",
    "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel",  "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
function (Controller,JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel,Filter,FilterOperator) {
    "use strict";
    var bar_flag;
    return Controller.extend("com.movetosingleunit.movetosingleunit.controller.Main", {
        onInit: function () {
            this._Page = this.byId("page");
            var oModel = new JSONModel({ barcodes: [] });
            var sDefaultLanguage = sap.ui.getCore().getConfiguration().getLanguage();
            this._setLanguage(sDefaultLanguage);
            this._wizard = this.byId("wizard");
        },
        onLanguageChange: function (oEvent) {
            var sSelectedLanguage = oEvent.getParameter("selectedItem").getKey();
            this._setLanguage(sSelectedLanguage);
        },
        _setLanguage: function (sLanguage) {
            var i18nModel = new ResourceModel({
                bundleName: "com.movetosingleunit.movetosingleunit.i18n.i18n",
                bundleLocale: sLanguage
            });
            this.getView().setModel(i18nModel,"i18n");
        },
        onWarehouseChange: function(oEvent) {
            //var sSelectedWarehouse = oEvent.getSource().getSelectedKey();
            var sSelectedWarehouse = this.byId("warehouse").getSelectedKey();
            var oModel = this.getView().getModel();
            BusyIndicator.show(0);
            // Load Storage Type data based on selected Warehouse
            oModel.read("/storageTypeSet", {
                filters: [new Filter("lgnum", FilterOperator.EQ, sSelectedWarehouse)],
                success: function(oData) {
                    BusyIndicator.hide();
                    var oStorageTypeModel = new sap.ui.model.json.JSONModel(oData);
                    this.getView().setModel(oStorageTypeModel, "storageType");

                }.bind(this),
                error: function(oError) {
                    // Handle error
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
                   
                    console.error(oError);
                }
            });

            // Clear Storage Bin data
            this.getView().setModel(new sap.ui.model.json.JSONModel({results: []}), "storageBin");
            this.getView().setModel(new sap.ui.model.json.JSONModel({results: []}), "storageType");
            this.byId("stbin").setValue("");
            this.byId("sttyp").setValue("");
            //this.byId("Step1").setValidated(true);
        },

        onStorageTypeChange: function(oEvent) {
            var sSelectedStorageType = oEvent.getSource().getSelectedKey();
            var sSelectedWarehouse = this.byId("warehouse").getSelectedKey();
            var oModel = this.getView().getModel();
            BusyIndicator.show(0);
            // Load Storage Bin data based on selected Warehouse and Storage Type
            oModel.read("/storageBinSet", {
                filters: [
                    new Filter("lgnum", FilterOperator.EQ, sSelectedWarehouse),
                    new Filter("lgtyp", FilterOperator.EQ, sSelectedStorageType)
                ],
                success: function(oData) {
                    BusyIndicator.hide();
                    var oStorageBinModel = new sap.ui.model.json.JSONModel(oData);
                    this.getView().setModel(oStorageBinModel, "storageBin");
                }.bind(this),
                error: function(oError) {
                    // Handle error
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
                    
                    console.error(oError);
                }
            });
        },
        checkbarcode:function(){
            var oInput = this.byId("barcodeInput").getValue();
                this._fetchBarcodeData(oInput);
        },
        fntranslate: function(txt){
            var oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
            var sTxt = oResourceBundle.getText(txt);
            return sTxt;
        },
        _fetchBarcodeData: function (sBarcode) {
            var sPath = "/genInfoBarSet('" + sBarcode + "')"; // OData Entity Set path
            var oModel = this.getView().getModel();
            var that = this;
            // Show the BusyIndicator before the OData call
            BusyIndicator.show(0);

            oModel.read(sPath, {
                success: function (oData) {
                    // Hide the BusyIndicator after the OData call is successful
                    BusyIndicator.hide();

                    // Handle successful read
                    MessageToast.show(that.fntranslate("Msg1"));

                    // Get the SimpleForm by its ID
                    var oSimpleForm = this.getView().byId("GenInfo");

                    // Set the data to the SimpleForm's model
                    var oViewModel = new sap.ui.model.json.JSONModel(oData);
                    oSimpleForm.setModel(oViewModel);

                    // Bind the data to the fields in the SimpleForm
                    oSimpleForm.bindElement("/");
                  
                    // this.byId("Step1").setValidated(true);  //--20.03.2025 t_singhaG1 CR chnages for Wizard button to static button replacement.
                    this._validateStep();
                    //this.byId("idNextStep").setEnabled(true);  //++20.03.2025 t_singhaG1 CR chnages for Wizard button to static button replacement.
                    
                }.bind(this),
                error: function (oError) {
                   // Handle error
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
                  
                   MessageToast.show(sErrorMessage);
                   that.byId("barcodeInput").setValue("");
                //    that.byId("Step1").setValidated(false); //--20.03.2025 t_singhaG1 CR chnages for Wizard button to static button replacement.
                        that.byId("idNextStep").setEnabled(false);                           //++20.03.2025 t_singhaG1 CR chnages for Wizard button to static button replacement.
                   console.error(oError);
                }
            });
        },
        // Event handler for the activation of an obsolete feature or component
        onActivate: function (oEvent) {
            var sCurrentStepId = oEvent.getParameter("id");
            sCurrentStepId = sCurrentStepId.split('-').pop();
            var oInput = this.byId("barcodeInput").getValue();
            if (sCurrentStepId === 'Step1') {

                this._disableStep1Fields(true);
                this.byId("idFinalStep").setVisible(false);
                this.byId("idNextStep").setVisible(true);

            }
            if (sCurrentStepId === 'Step2') {
                // this._disableStep1Fields(false);
                // this._fetchBarcodeData(oInput);
                this.byId("idFinalStep").setVisible(true);
                this.byId("idNextStep").setVisible(false);

            }
          
        },
        //++BOC: 20.03.2025 t_singhaG1 CR chnages for Wizard button to static button replacement.
        onNextPress:function(){
            var oInput = this.byId("barcodeInput").getValue();
            // this._disableStep1Fields(false);

                //this._fetchBarcodeData(oInput);
                this._disableStep1Fields(false);    //++20.03.2025 t_singhaG1
                    this.byId("idFinalStep").setEnabled(true);
                    this.byId("idFinalStep").setVisible(true);
                    this._wizard.nextStep();        //++18.03.2025 T_singhag1 CR Changes by Loic
               
        },
        //++ EOC : 20.03.2025 t_singhaG1 CR chnages for Wizard button to static button replacement.
        onConfirmSelect: function (oEvent) {
            // Get the state of the checkbox
            var bSelected = oEvent.getParameter("selected");
            this.byId("Step2").setValidated(bSelected);
        },
        onComboBoxChange: function () {
            // Validate all required fields
            this._validateStep();
        },

        _validateStep: function () {
            var oView = this.getView();
            var bValidated = true;

            // Get all required fields
            var aFields = [
                oView.byId("warehouse"),
                oView.byId("sttyp"),
                oView.byId("stbin"),
                oView.byId("barcodeInput"),
                oView.byId("printer")
            ];

            // Loop through the fields and check if any are empty or invalid
            aFields.forEach(function (oField) {
                if (!oField.getSelectedKey() && oField.getRequired() && oField.getValue) {
                    // If the field is empty and required, set validation to false
                    bValidated = false;
                } else if (!oField.getValue() && oField.getRequired()) {
                    // If the input field is empty and required, set validation to false
                    bValidated = false;
                }
                else if (oField.getValue() === '') {
                    // If the input field is empty and required, set validation to false
                    bValidated = false;
                }
            });

            // Update the validated property of the WizardStep
            // oView.byId("Step1").setValidated(bValidated);  //++20.03.2025 t_singhaG1 CR chnages for Wizard button to static button replacement.
            oView.byId("idNextStep").setEnabled(bValidated);    
        },
        onPostMoveToSuBatch: function () {
            var oView = this.getView();

            // Get the data from the view or model
            var sBarNbr = oView.byId("barcodeInput").getValue();
            var sLgnum = oView.byId("warehouse").getSelectedKey();
            var sLgtyp = oView.byId("sttyp").getSelectedKey();
            var sLgpla = oView.byId("stbin").getSelectedKey();
            var sPrinter = oView.byId("printer").getSelectedKey();
            var rmark= oView.byId("idrmark").getValue();
            var ryear= oView.byId("idryear").getValue();
            var rlifnr= oView.byId("idrlifnr").getValue();

            // Validate the inputs before making the POST request
            if (!sBarNbr || !sLgnum || !sLgtyp || !sLgpla || !sPrinter) {
                MessageBox.error("Please fill in all required fields.");
                return;
            }

            // Prepare the data payload
            var oPayload = {
                BAR_NBR: sBarNbr,
                Lgnum: sLgnum,
                Lgtyp: sLgtyp,
                Lgpla: sLgpla,
                PRINTER: sPrinter,
                rollingyear: ryear,
                asiaLifnr: rlifnr,
                rollmark: rmark
            };

            // Get the OData model
            var oModel = oView.getModel();

            // Show a busy indicator while the request is being processed
            sap.ui.core.BusyIndicator.show(0);
            var that = this;
            // Make the OData POST request
            oModel.create("/moveToSuBatchSet", oPayload, {
                success: function (oData, response) {
                    // Hide the busy indicator
                    sap.ui.core.BusyIndicator.hide();

                    // Show success message
                    that.onSuccessMessageBoxPress(that.fntranslate("SuccessMsg"));
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
        _disableStep1Fields: function (flag) {
            var oView = this.getView();
            
            // Disable all fields in Step1
            oView.byId("warehouse").setEnabled(flag);
            oView.byId("sttyp").setEnabled(flag);
            oView.byId("stbin").setEnabled(flag);
            oView.byId("barcodeInput").setEnabled(flag);
            oView.byId("printer").setEnabled(flag);
            oView.byId("idrmark").setEnabled(flag);
            oView.byId("idryear").setEnabled(flag);
            oView.byId("idrlifnr").setEnabled(flag);
        },
        onSuccessMessageBoxPress: function (msg) {
            var that = this;
            MessageBox.success(msg, {
                actions: [that.fntranslate("Start_over"), that.fntranslate("Exit1")],
                emphasizedAction:that.fntranslate("Start_over"),
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
        onErrorMessageBoxPress: function (msg) {
            var that = this;
            MessageBox.error(msg, {
                actions: [that.fntranslate("Start_over"), that.fntranslate("Exit1")],
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
            this._resetStep1Fields();
            this._disableStep1Fields(true);
            //this.getView().byId("confirmPrint").setSelected(false);
            // this.byId("Step1").setValidated(false);  //--20.03.2025 t_singhaG1 CR chnages for Wizard button to static button replacement.
            this.byId("idNextStep").setEnabled(false);  //++20.03.2025 t_singhaG1 CR chnages for Wizard button to static button replacement.
            this.byId("idFinalStep").setVisible(false);//++20.03.2025 t_singhaG1
            this.byId("idNextStep").setVisible(true);//++20.03.2025 t_singhaG1
            //this.byId("Step2").setValidated(false);
          
        },
        _resetStep1Fields: function () {
            var oView = this.getView();

            // Reset all fields in Step1
            //oView.byId("warehouse").setSelectedKey(null);
            oView.byId("sttyp").setSelectedKey(null);
            oView.byId("stbin").setSelectedKey(null);
            oView.byId("barcodeInput").setValue("");
            //oView.byId("printer").setSelectedKey(null);
            oView.byId("idrmark").setValue("");
            oView.byId("idryear").setValue("");
            oView.byId("idrlifnr").setValue("");
        },
        onBeforeRendering:function(){
            this.onCheckPrinter('0');
            this.onCheckWh();
        },
          //on check default printner 
          onCheckPrinter: function (code) {
            var oModel = this.getView().getModel();
            var sPath = "/ZshOutputDeviceSet('" + code + "')";
            var that = this;
            // Show Busy Indicator
            BusyIndicator.show(0);
            oModel.read(sPath, {
                success: function (oData) {
                    BusyIndicator.hide();
                  if(oData.Padest === "$NULL"){
                    MessageToast.show("Default Printer hasn't been set to your User Profile");
                  }else{
                    that.getView().byId("printer").setSelectedKey(oData.Padest);
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
              
                    console.error(oError);
                }
            });
        },
         //on check default warehouse 
         onCheckWh: function (code) {
            var oModel = this.getView().getModel();
            var sPath = "/warehouseNoSet";
            var that = this;
            // Show Busy Indicator
            BusyIndicator.show(0);
            oModel.read(sPath, {
                success: function (oData) {
                    BusyIndicator.hide();
                  if(oData.results[0].lgnum === "$NULL" || oData.results.length===0){
                    MessageToast.show("Default Warehouse hasn't been set to your User Profile(LRFMD)");
                  }else{
                    that.getView().byId("warehouse").setSelectedKey(oData.results[0].lgnum);
                    that.onWarehouseChange();
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
              
                    console.error(oError);
                }
            });
        },
    });
});
