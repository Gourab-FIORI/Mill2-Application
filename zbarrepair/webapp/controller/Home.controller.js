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
    "sap/ui/model/FilterOperator"
],
    function (Controller, JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel,Filter,FilterOperator) {
        "use strict";
        var prefixId;
        	var oScanResultText;
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
            onActivate: function (oEvent) {
                var sCurrentStepId = oEvent.getParameter("id");
                sCurrentStepId = sCurrentStepId.split('-').pop();

               // this.toggleVisibility();

                 if (sCurrentStepId === 'Step2') {
                    this.onCheckPlant("def");
                 }
            },
            //on check Barcode from backend 
            onCheckBarcode: function (sBarcode) {
                var srepcode =this.getView().byId("repairc").getValue();
                var oModel = this.getView().getModel();
                var sPath = "/checkBarSet(BAR_NBR='" + sBarcode + "',Repaircode='" + srepcode + "')";
                var that = this;
                // Show Busy Indicator
                BusyIndicator.show(0);
                oModel.read(sPath, {
                    success: function (oData) {
                        BusyIndicator.hide();
                        that.onAddBarcode(sBarcode);
                        MessageToast.show("Barcode is Valid!");
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
    
                var sWarehouseNo = oView.byId("warehouse").getValue();
                var sStorageType = oView.byId("sttyp").getValue();
                var sStorageBin = oView.byId("stbin").getValue();
                var sWorkCenter = oView.byId("workcent").getValue();
                var sWerks = oView.byId("plant").getValue();
                var sRepaircode = oView.byId("repairc").getValue();

                var aBarcodes = this.getView().byId("barcodeList").getModel().getData().barcodes;
                if (aBarcodes.length === 0) {
                    MessageBox.error("Scan the Barcodes first before Transfer");
                    return;
                }
                 // Display  selected BAR_NBR values by comma separated
                var abar_no = aBarcodes.map(function(oData) {
                return oData.barcode;
                 });
    
                var oData = {
                    lgnum: sWarehouseNo,
                    lgtyp: sStorageType,
                    lgpla: sStorageBin,
                    function : testflag,
                    BAR_NBR: abar_no.join(","),
                    Repaircode: sRepaircode,
                    WorkCenter:sWorkCenter,
                    Werks:sWerks
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
            }
      
        });
    });
