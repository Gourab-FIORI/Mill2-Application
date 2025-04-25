/***********************************************
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 *          Introduction to Developments        *
 *                                              *
 * -------------------------------------------- *
 * |  Module Name:       | ZBARREPAIR        | *
 * |---------------------|---------------------| *
 * |  Developer Name:    | GOURAB SINGHA,      | *
 * |                     | ANUBHAV MITRA       | *
 * |---------------------|---------------------| *
 * |  Project Manager:   | Manas Mishra        | *
 * |---------------------|---------------------| *
 * |  Component Name:    | com.ami.zbarrepair  | *
 * |---------------------|---------------------| *
 * |  Package Name:      | ZFIODEV             | *
 * |---------------------|---------------------| *
 * |  Development Date:  | 12.10.2024          | *
 * -------------------------------------------- *
 *                                              *
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

 *  * Change Requests:
 * - CR-001: [Mention description here].
 *           User IDs: [Enter User IDs], Date: [Enter Date]
 *
 * - CR-002: [Mention description here].
 *           User IDs: [Enter User IDs], Date: [Enter Date]
 ***********************************************/

sap.ui.define([
    "sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox",
    "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel",  "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator","sap/m/Input",
    "sap/m/Label",
    "sap/m/Button","sap/m/SelectDialog","sap/m/Dialog"
],
    function (Controller, JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel,Filter,FilterOperator,Input, Label, Button,SelectDialog,Dialog) {
        "use strict";
        var prefixId;
        	var oScanResultText;
            var gContrem = ""; // Global variable to store Contrem value
        return Controller.extend("com.ami.zbarrepair.controller.Home", {
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
                     // Open the Contrem dialog for user input ++09.04.2025
                // This function displays a dialog that prompts the user to enter a Contrem value.
                // The entered value will be stored in a global variable for later use.
                this._openContremDialog();
            },
            onBeforeRendering:function(){
               // this.onCheckPlant('DEF');
            },
            onLanguageChange: function (oEvent) {
                var sSelectedLanguage = oEvent.getParameter("selectedItem").getKey();
                this._setLanguage(sSelectedLanguage);
            },

            _setLanguage: function (sLanguage) {
                var i18nModel = new ResourceModel({
                    bundleName: "com.ami.zbarrepair.i18n.i18n",
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
            onrepaircChange: function (oEvent) {
                var oComboBox = oEvent.getSource();
                var sSelectedKey = oComboBox.getSelectedKey();
                var oWizardStep1 = this.byId("Step2");
    
                if (sSelectedKey) {
                    oWizardStep1.setValidated(true);
                } else {
                    oWizardStep1.setValidated(false);
                }
            },
            onWarehouseChange: function(oEvent) {
                var sSelectedWarehouse = oEvent.getSource().getSelectedKey();
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
                this.byId("printerStep").setValidated(false);
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
            onWorkCentChange: function(oEvent) {
                this.byId("nextBtn").setEnabled(true);
                var sSelectedStorageType = oEvent.getSource().getSelectedKey();
                var sSelectedWarehouse = this.byId("workcent").getSelectedKey();
                var oModel = this.getView().getModel();
                BusyIndicator.show(0);
                // Load Storage Bin data based on selected Warehouse and Storage Type
                oModel.read("/ZshRepairCodeSet", {
                    filters: [
                        new Filter("WorkCenter", FilterOperator.EQ, sSelectedWarehouse)
                        //new Filter("lgtyp", FilterOperator.EQ, sSelectedStorageType)
                    ],
                    success: function(oData) {
                        BusyIndicator.hide();
                        var oSrepaircodeModel = new sap.ui.model.json.JSONModel(oData);
                        this.getView().setModel(oSrepaircodeModel, "repaircode");
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
    
            onInfoPress: function () {
                MessageBox.information("Press Enter to Add more Barcodes.");
            },
            toggleVisibility: function () {
                this._Page.setShowFooter(!this._Page.getShowFooter());
            },
            //show buttons on next page
            onActivate_old: function (oEvent) {
                var sCurrentStepId = oEvent.getParameter("id");
                sCurrentStepId = sCurrentStepId.split('-').pop();

               // this.toggleVisibility();

                 if (sCurrentStepId === 'Step2') {
                    //this.onCheckPlant("def");
                 }
            },
            //new Wizard button static
            onActivate: function (oEvent) {
                const sCurrentStepId = oEvent.getParameter("id").split("-").pop();
               
                const oBackBtn = this.byId("backBtn");
                const oNextBtn = this.byId("nextBtn");
                const oScrapBtn = this.byId("scrapBtn");
                const oFinishBtn = this.byId("finishBtn");
            
                if (sCurrentStepId === "Step2") {
                    oBackBtn.setVisible(false);
                    oNextBtn.setVisible(true);
                    oScrapBtn.setVisible(false);
                    oFinishBtn.setVisible(false);
                } else if (sCurrentStepId === "barcodeStep") {
                    oBackBtn.setVisible(true);
                    oNextBtn.setVisible(false);
                    oScrapBtn.setVisible(true);
                    oFinishBtn.setVisible(true);
                }
            },
             //new Wizard button static
             wizardhandler: function (oEvent) {
                var oWizard = this.byId("wizard");
                // const sCurrentStepId = oEvent.getParameter("id").split("-").pop();
                 var sCurrentStepId = oWizard.getCurrentStep().split("-").pop();
                 const oBackBtn = this.byId("backBtn");
                 const oNextBtn = this.byId("nextBtn");
                 const oScrapBtn = this.byId("scrapBtn");
                 const oFinishBtn = this.byId("finishBtn");
             
                 if (sCurrentStepId === "Step2") {
                     oBackBtn.setVisible(false);
                     oNextBtn.setVisible(true);
                     oScrapBtn.setVisible(false);
                     oFinishBtn.setVisible(false);
                 } else if (sCurrentStepId === "barcodeStep") {
                     oBackBtn.setVisible(true);
                     oNextBtn.setVisible(false);
                     oScrapBtn.setVisible(true);
                     oFinishBtn.setVisible(true);
                 }
             },
            onNextPress: function () {
                var oWizard = this.byId("wizard");
                oWizard.nextStep();
               this.wizardhandler();
            },
            
            onBackPress: function () {
                var oWizard = this.byId("wizard");
                oWizard.previousStep();
                this.wizardhandler();
            },
            
            
            
            //on check Barcode from backend 
            onCheckBarcode: function (sBarcode) {
                //var srepcode =this.getView().byId("repairc").getValue();          //++T-singhag1 24.04.2025
                var oModel = this.getView().getModel();
                // var sPath = "/checkBarSet(BAR_NBR='" + sBarcode + "',Repaircode='" + srepcode + "')";
                var sPath = "/checkBarSet(BAR_NBR='" + sBarcode + "')";
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
                                        that.onAddBarcode(sBarcode);
                                    }
                                });
                            }
                        } else {
                        that.onAddBarcode(sBarcode);
                        MessageToast.show("Barcode is Valid!");
                        }
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
              //on check default plant 
              onCheckPlant: function (code) {
                var oModel = this.getView().getModel();
                var sPath = "/ZshPlantSet('" + code + "')";
                var that = this;
                // Show Busy Indicator
                BusyIndicator.show(0);
                oModel.read(sPath, {
                    success: function (oData) {
                        BusyIndicator.hide();
                     
                        that.getView().byId("plant").setSelectedKey(oData.Werks);
                        
                      
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
                var oView = this.getView();
               
     oView.byId("warehouse").getValue();
                oView.byId("sttyp").setValue();
                oView.byId("stbin").setValue();
               oView.byId("workcent").setValue();
                 //oView.byId("plant").getValue();
               oView.byId("repairc").setValue();
            },
            onScrap: function () {
                // Implement scrap logic for scrapping
                this.onPostData("/checkBarSet",'SCRAP');
            },
            onConfirm: function () {
                // Implement Confirm logic for main post
                this.onPostData("/checkBarSet",'CONFIRM');
            },
            onPostData: function (spath,testflag) {
                var oView = this.getView();
                var oModel = this.getView().getModel();
    
                // var sWarehouseNo = oView.byId("warehouse").getValue();
                // var sStorageType = oView.byId("sttyp").getValue();
                // var sStorageBin = oView.byId("stbin").getValue();
                var sWorkCenter = oView.byId("workcent").getValue();
                // var sWerks = oView.byId("plant").getValue();
                //var sRepaircode = oView.byId("repairc").getValue();

                var aBarcodes = this.getView().byId("barcodeList").getModel().getData().barcodes;
                if (aBarcodes.length === 0) {
                    MessageBox.error("Scan the Barcodes first before Transfer");
                    return;
                }
                 // Display  selected BAR_NBR values by comma separated
                var abar_no = aBarcodes.map(function(oData) {
                return oData.barcode;
                 });
    
                // var oData = {
                //     lgnum: sWarehouseNo,
                //     lgtyp: sStorageType,
                //     lgpla: sStorageBin,
                //     function : testflag,
                //     BAR_NBR: abar_no.join(","),
                //     Repaircode: sRepaircode,
                //     WorkCenter:sWorkCenter               
                //     Werks:sWerks
                // };
                var oData = {
                    
                    function : testflag,
                    BAR_NBR: abar_no.join(","),
                    WorkCenter:sWorkCenter,
                    contrem : this.getContremValue()
                    
                };
                BusyIndicator.show(0);
                var that = this;
                oModel.create(spath, oData, {
                    success: function (oResponse) {
                        BusyIndicator.hide();
                        // if(testflag === 'Confirm'){
                        //     that.onValidMessageBoxPress("Bar Transfer Validation Successfull, Do you want to Confirm Transfer?");
                        // }else{
                        //     that.onSuccessMessageBoxPress("Bar Transfer is Successfull.");
                        // }
                        that.onSuccessMessageBoxPress("Selected Operation is Successful.");
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
            onValidMessageBoxPress: function (msg) {
                var that = this;
                MessageBox.success(msg, {
                    actions: ["Confirm", "Start Over"],
                    emphasizedAction: "Confirm",
                    onClose: function (sAction) {
                        if (sAction === "Confirm") {
                           that.onConfirm();
                        } else {
                            that.resetWizard();
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
                this.wizardhandler();
                //this.byId("nextBtn").setEnabled(false);
                this.onClearAll();
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

            onScanLiveupdate: function(oEvent) {
                // User can implement the validation about inputting value
            },

            onAfterRendering: function() {
                // Reset the scan result
                // var oScanButton = Element.getElementById(prefixId + 'sampleBarcodeScannerButton');
                // if (oScanButton) {
                //     $(oScanButton.getDomRef()).on("click", function(){
                //         oScanResultText.setText('');
                //     });
                // }
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
      
        });
    });
