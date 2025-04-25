/***********************************************
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 *          Introduction to Developments        *
 *                                              *
 * -------------------------------------------- *
 * |  Module Name:       | ZBARINFO             |
 * |---------------------|----------------------|
 * |  Developer Name:    | GOURAB SINGHA,       |
 * |                     | ANUBHAV MITRA        |
 * |---------------------|----------------------|
 * |  Project Manager:   | Manas Mishra         |
 * |---------------------|----------------------|
 * |  Component Name:    | com.ami.zbarinformation.zbarinfo |
 * |---------------------|----------------------|
 * |  Package Name:      | ZFIODEV              |
 * |---------------------|----------------------|
 * |  Development Date:  | 05.08.2024           |
 * -------------------------------------------- *
 *                                              *
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 ***********************************************/

/*
 * Introduction to the “Bar information” Application
 *
 * Application Flow:
 * - By clicking on the Fiori “Bar information” tile, the user accesses the following screens:
 *   1. Screen 1: Scan bar number
 *   2. Screen 2: General info
 *   3. Screen 3: Characteristics
 *
 * Change Requests:
 * - CR-001: EXTCUT characteristic comes from after screen and must be moved to first screen (below “Emplacement”) 
 *           There is the need of removing steps buttons and to give directly all info to users once the bar is scanned
 *             usine field is to be removed from step2   
 *           User IDs: [T_Singhag1], Date: [18.03.2025]
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

        return Controller.extend("com.ami.zbarinformation.zbarinfo.controller.View1", {
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
                    bundleName: "com.ami.zbarinformation.zbarinfo.i18n.i18n",
                    bundleLocale: sLanguage
                });
                this.getView().setModel(i18nModel, "i18n");
            },
            onActivate_obsolete: function (oEvent) {
                var sCurrentStepId = oEvent.getParameter("id");
                sCurrentStepId = sCurrentStepId.split('-').pop();
                var oInput = this.byId("barcodeInput").getValue();

                if (sCurrentStepId === 'barcodeStep1') {

                    this.onCheckBar(oInput,"wmmmstock");

                }
                if (sCurrentStepId === 'barcodeStep2') {

                    this.onCheckBar(oInput,"batchchara");

                }
            },
            fntranslate: function(txt){
                var oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
                var sTxt = oResourceBundle.getText(txt);
                return sTxt;
            },
            onCheckBarcode: function (sBarcode) {
                var oModel = this.getView().getModel();
                var sPath = "/checkBarSet('" + sBarcode + "')";
                var that = this;
                // Show Busy Indicator
                BusyIndicator.show(0);
                oModel.read(sPath, {
                    success: function (oData,response) {
                        BusyIndicator.hide();

                        if(response.headers["sap-message"]){
                        if(JSON.parse(response.headers["sap-message"]).severity === 'warning'){
                           
                            that.onWarningMessageBoxPress(sBarcode,JSON.parse(response.headers["sap-message"]).code,JSON.parse(response.headers["sap-message"]).message)
                        }}
                        else{
                            MessageToast.show(that.fntranslate("Msg1"));
                            that.onCheckBar(sBarcode,"wmmmstock");                   //++18.03.2025 T_singhag1 CR Changes by Loic
                            that.onCheckBar(sBarcode,"batchchara");                  //++18.03.2025 T_singhag1 CR Changes by Loic
                            that._wizard.nextStep();        //++18.03.2025 T_singhag1 CR Changes by Loic
                        }

                        //that.onAddBarcode(sBarcode);
                        
                        that.byId("barcodeInput").setEditable(false);
                        that.byId("idStrtover").setEnabled(true);
                        that.byId("barcodeInput").setValue(sBarcode);
                        // that.onCheckBar(sBarcode,"wmmmstock");                   //++18.03.2025 T_singhag1 CR Changes by Loic
                        // that.onCheckBar(sBarcode,"batchchara");                  //++18.03.2025 T_singhag1 CR Changes by Loic
                        // that._wizard.nextStep();        //++18.03.2025 T_singhag1 CR Changes by Loic
                        // that._wizard.setCurrentStep("barcodeStep2");
                        //that._wizard.validateStep(that.byId("barcodeStep"));      //++18.03.2025 T_singhag1 CR Changes by Loic
                        // Handle successful barcode check here
                        //console.log(oData);
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        // var sErrorMessage = "An error occurred,Please try again!";
                        // // that._wizard.invalidateStep(that.byId("barcodeStep")); //++18.03.2025 T_singhag1 CR Changes by Loic
                        // try {
                        //     var oResponse = JSON.parse(oError.responseText);
                        //     if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
                        //         sErrorMessage = oResponse.error.message.value;
                        //     }
                        // } catch (e) {
                        //     console.error("Failed to parse error response", e);
                        // }

                        // MessageBox.error(sErrorMessage);
                        that.showBackendMessages(oError);
                        that.byId("barcodeInput").setValue("");
                        that.byId("idStrtover").setEnabled(false);
                        console.error(oError);
                    }
                });
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
            onScanBarcode: function (ev) {
                var sBarcode = ev.getSource().getValue();
                this.onCheckBarcode(sBarcode);
            },
            _handleNavigationToStep: function (iStepNumber) {
                var fnAfterNavigate = function () {
                    this._wizard.goToStep(this._wizard.getSteps()[iStepNumber]);
                    this._oNavContainer.detachAfterNavigate(fnAfterNavigate);
                }.bind(this);

                this._oNavContainer.attachAfterNavigate(fnAfterNavigate);
                this.backToWizardContent();
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
            wizardCompletedHandler: function () {
                this._wizard.discardProgress(this.byId("barcodeStep"));
                this.byId("barcodeInput").setEditable(true);
                this.byId("barcodeInput").setValue("");
                this.byId("idStrtover").setEnabled(false);
                 //this._wizard.invalidateStep(this.byId("barcodeStep"));       //++18.03.2025 T_singhag1 CR Changes by Loic

                 this._wizard.invalidateStep(this.byId("barcodeStep"));
                // this._wizard.validateStep(this.byId("barcodeStep2"));
            },
            onCheckBar: function (code,expand_entity) {
                var oModel = this.getView().getModel();
                var sPath = "/checkBarSet";
                // Create a filter using the Filter class
                var oFilter = new sap.ui.model.Filter("BAR_NBR", sap.ui.model.FilterOperator.EQ, code);

                // Define the parameters for the expand option
                var oParameters = {
                    "$expand": expand_entity
                   
                };
                var that = this;
                // Show Busy Indicator
                BusyIndicator.show(0);
                oModel.read(sPath, {
                    filters: [oFilter],  // Pass the filter array here
                    urlParameters: oParameters,
                    success: function (oData) {
                        if(expand_entity === "wmmmstock"){
                            var data = new JSONModel(oData);
                            that.getView().byId("SimpleFormInfo").setModel(data,"stockModel");
                        }else{
                            that._wizard.nextStep();  //++18.03.2025 T_singhag1 CR Changes by Loic       
                            var omodel = new JSONModel(oData.results[0].batchchara);
                            that.getView().byId("table").setModel(omodel);
                        }
                       
                       
                        BusyIndicator.hide();


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
            onClearAll: function () {
                this.byId("barcodeInput").setEditable(true);
                this.byId("barcodeInput").setValue("");
                this.byId("idStrtover").setEnabled(false);
                this._wizard.discardProgress(this.byId("barcodeStep")); //++18.03.2025 T_singhag1 CR Changes by Loic
                 this._wizard.invalidateStep(this.byId("barcodeStep"));       //++18.03.2025 T_singhag1 CR Changes by Loic
            },
            showBackendMessages: function (oError) {
                var sDefaultMsg = "An error occurred, please try again!";
                var aErrorDetails = [];
          
                try {
                  var oResponse = JSON.parse(oError.responseText);
                  aErrorDetails = oResponse?.error?.innererror?.errordetails || [];
          
                  if (aErrorDetails.length > 0) {
                    const getUniqueMessages = (arr) => {
                      const seen = new Set();
                      return arr.filter(item => {
                        if (!item.message || seen.has(item.message)) return false;
                        seen.add(item.message);
                        return true;
                      });
                    };
          
                    var aErrors = getUniqueMessages(aErrorDetails.filter(item => item.severity === "error"));
                    var aWarnings = getUniqueMessages(aErrorDetails.filter(item => item.severity === "warning"));
          
                    var sFormattedMessage = "";
          
                    if (aErrors.length > 0) {
                      sFormattedMessage += "❌ Errors:\n" + aErrors.map((item, i) => `${i + 1}. ${item.message}`).join("\n") + "\n\n";
                    }
          
                    if (aWarnings.length > 0) {
                      sFormattedMessage += "⚠️ Warnings:\n" + aWarnings.map((item, i) => `${i + 1}. ${item.message}`).join("\n");
                    }
          
                    MessageBox.show(sFormattedMessage, {
                      title: "System Messages",
                      icon: aErrors.length > 0 ? MessageBox.Icon.ERROR : MessageBox.Icon.WARNING,
                      styleClass: "sapUiSizeCompact",
                      actions: [MessageBox.Action.OK],
                      emphasizedAction: MessageBox.Action.OK
                    });
          
                  } else if (oResponse?.error?.message?.value) {
                    MessageBox.error(oResponse.error.message.value);
                  } else {
                    MessageBox.error(sDefaultMsg);
                  }
          
                } catch (e) {
                  console.error("Failed to parse error response", e);
                  MessageBox.error(sDefaultMsg);
                }
          
                console.error(oError);
              },
              onWarningMessageBoxPress: function (sBarcode,code,msg) {
                var that = this;
                MessageBox.warning(msg, {
                    title:code,
                    actions: ["Proceed", "Exit"],
                    emphasizedAction: "Proceed",
                    onClose: function (sAction) {
                        if (sAction === "Proceed") {
                            that.onCheckBar(sBarcode,"wmmmstock");                   //++14.04.2025 T_singhag1 CR Changes by Loic
                            that.onCheckBar(sBarcode,"batchchara");                  //++14.04.2025 T_singhag1 CR Changes by Loic
                            that._wizard.nextStep();        //++14.04.2025 T_singhag1 CR Changes by Loic
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
        });
    });
