/***********************************************
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 *          Introduction to Developments        *
 *                                              *
 * -------------------------------------------- *
 * |  Module Name:       | zbarcutting        | *
 * |---------------------|---------------------| *
 * |  Developer Name:    | GOURAB SINGHA,      | *
 * |                     | ANUBHAV MITRA       | *
 * |---------------------|---------------------| *
 * |  Project Manager:   | Manas Mishra        | *
 * |---------------------|---------------------| *
 * |  Component Name:    | com.ami.zbarcutting  | *
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
        "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel", "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator", "sap/m/Input",
        "sap/m/Label",
        "sap/m/Button", "sap/m/SelectDialog", "sap/m/Dialog"
    ],
    function (Controller, JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel, Filter, FilterOperator, Input, Label, Button, SelectDialog, Dialog) {
        "use strict";
        var prefixId;
        var oScanResultText;
        var gContrem = ""; // Global variable to store Contrem value
        return Controller.extend("com.ami.zbarcutting.controller.Home", {
            onInit: function () {
                // Create JSON model for barcodes
                this._Page = this.byId("page");
                //var oModel = new JSONModel({ barcodes: [] });
                // this.getView().byId("barcodeList").setModel(oModel);
                var sDefaultLanguage = sap.ui.getCore().getConfiguration().getLanguage();
                this._wizard = this.byId("wizard");
                this._backButton = this.byId("backButton");
                this._nextButton = this.byId("nextButton");
                this._finishButton = this.byId("finishButton");

                this._setLanguage(sDefaultLanguage);
                prefixId = this.createId();
                if (prefixId) {
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
            onBeforeRendering: function () {
                // this.onCheckPlant('DEF');
                //this.onCheckPrinter('0');
                this.onCheckWh();
                this.onWarehouseChange();
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
                        if (oData.results[0].lgnum === "$NULL" || oData.results.length === 0) {
                            MessageToast.show("Default Warehouse hasn't been set to your User Profile(LRFMD)");
                        } else {
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
                        if (oData.Padest === "$NULL") {
                            MessageToast.show("Default Printer hasn't been set to your User Profile");
                        } else {
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
            onLanguageChange: function (oEvent) {
                var sSelectedLanguage = oEvent.getParameter("selectedItem").getKey();
                this._setLanguage(sSelectedLanguage);
            },

            _setLanguage: function (sLanguage) {
                var i18nModel = new ResourceModel({
                    bundleName: "com.ami.zbarcutting.i18n.i18n",
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
            onWarehouseChange: function (oEvent) {
                // var sSelectedWarehouse = oEvent.getSource().getSelectedKey();
                var sSelectedWarehouse = this.byId("warehouse").getSelectedKey();
                var oModel = this.getView().getModel();
                BusyIndicator.show(0);
                // Load Storage Type data based on selected Warehouse
                oModel.read("/storageTypeSet", {
                    filters: [new Filter("lgnum", FilterOperator.EQ, sSelectedWarehouse)],
                    success: function (oData) {
                        BusyIndicator.hide();
                        var oStorageTypeModel = new sap.ui.model.json.JSONModel(oData);
                        this.getView().setModel(oStorageTypeModel, "storageType");

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

                        MessageBox.error(sErrorMessage);

                        console.error(oError);
                    }
                });

                // Clear Storage Bin data
                this.getView().setModel(new sap.ui.model.json.JSONModel({
                    results: []
                }), "storageBin");
                this.getView().setModel(new sap.ui.model.json.JSONModel({
                    results: []
                }), "storageType");
                this.byId("stbin").setValue("");
                this.byId("sttyp").setValue("");
                this.byId("printerStep").setValidated(false);
            },

            onStorageTypeChange: function (oEvent) {
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
                    success: function (oData) {
                        BusyIndicator.hide();
                        var oStorageBinModel = new sap.ui.model.json.JSONModel(oData);
                        this.getView().setModel(oStorageBinModel, "storageBin");
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

                        MessageBox.error(sErrorMessage);

                        console.error(oError);
                    }
                });
            },
            //No relation to cutting code based on wrkcentre
            // onWorkCentChange: function(oEvent) {
            //     var sSelectedStorageType = oEvent.getSource().getSelectedKey();
            //     var sSelectedWarehouse = this.byId("workcent").getSelectedKey();
            //     var oModel = this.getView().getModel();
            //     BusyIndicator.show(0);
            //     // Load Storage Bin data based on selected Warehouse and Storage Type
            //     oModel.read("/ZshCuttingCodeSet", {
            //         filters: [
            //             new Filter("Value", FilterOperator.EQ, sSelectedWarehouse)
            //             //new Filter("lgtyp", FilterOperator.EQ, sSelectedStorageType)
            //         ],
            //         success: function(oData) {
            //             BusyIndicator.hide();
            //             var oSrepaircodeModel = new sap.ui.model.json.JSONModel(oData);
            //             this.getView().setModel(oSrepaircodeModel, "repaircode");
            //         }.bind(this),
            //         error: function(oError) {
            //             // Handle error
            //             BusyIndicator.hide();
            //             var sErrorMessage = "An error occurred,Please try again!";

            //             try {
            //                 var oResponse = JSON.parse(oError.responseText);
            //                 if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
            //                     sErrorMessage = oResponse.error.message.value;
            //                 }
            //             } catch (e) {
            //                 console.error("Failed to parse error response", e);
            //             }

            //             MessageBox.error(sErrorMessage);

            //             console.error(oError);
            //         }
            //     });
            // },

            onInfoPress: function () {
                MessageBox.information("Press Enter to Add more Barcodes.");
            },
            toggleVisibility: function () {
                this._Page.setShowFooter(!this._Page.getShowFooter());
            },
            //show buttons on next page
            onActivate: function (oEvent) {
                var sCurrentStepId = oEvent.getParameter("id");
                var currentStepId = sCurrentStepId.split('-').pop();

                // this.toggleVisibility();
                const oBack = this.byId("backButton");
                const oNext = this.byId("nextButton");
                const oFinish = this.byId("finishButton");
                const oSkip = this.byId("skipButton");

                // Reset all visibility
                oBack.setVisible(false);
                oNext.setVisible(false);
                oFinish.setVisible(false);
                oSkip.setVisible(false);

                // Determine visibility based on step ID
                if (currentStepId.includes("printerStep")) {
                    oNext.setVisible(true);
                } else if (currentStepId.includes("Step2")) {
                    oBack.setVisible(true);
                    oNext.setVisible(true);
                } else if (currentStepId.includes("barcodeStep")) {
                    oBack.setVisible(true);
                    oFinish.setVisible(true);
                    oSkip.setVisible(true);
                }
                if (currentStepId === 'Step2') {
                    this.onCheckPlant("def");
                }
            },
            //on check Barcode from backend 
            onCheckBarcode: function (sBarcode) {
                var srepcode = this.getView().byId("repairc").getValue();
                var oModel = this.getView().getModel();
                var sPath = "/checkBarSet(BAR_NBR='" + sBarcode + "',CutCode='" + srepcode + "')";
                var that = this;
                // Show Busy Indicator
                BusyIndicator.show(0);
                oModel.read(sPath, {
                    success: function (oData, response) {
                        BusyIndicator.hide();
                        if (response.headers["sap-message"]) {
                            const parsedMessage = JSON.parse(response.headers["sap-message"]);

                            if (parsedMessage.severity === 'warning') {
                                // Show the warning message using MessageBox.warning
                                sap.m.MessageBox.warning(parsedMessage.message, {
                                    title: parsedMessage.code,
                                    actions: [sap.m.MessageBox.Action.OK],
                                    onClose: function (oAction) {
                                        var formdata = new JSONModel(oData);
                                        that.getView().byId("cuttingdata").setModel(formdata, "checkBarModel");
                                    }
                                });
                            }
                        } else {

                            //that.onAddBarcode(sBarcode);      //not needed as single bar code to be scanned
                            MessageToast.show("Barcode is Valid!");
                            var formdata = new JSONModel(oData);
                            that.getView().byId("cuttingdata").setModel(formdata, "checkBarModel");
                            // Handle successful barcode check here
                            //console.log(oData);
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
                        var formdata = new JSONModel();
                        that.getView().byId("cuttingdata").setModel(formdata, "checkBarModel");
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
                    aBarcodes.push({
                        barcode: sBarcode
                    });
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
                    aBarcodes.push({
                        barcode: sBarcode
                    });
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
                // var oModel = this.getView().byId("barcodeList").getModel();
                // oModel.setProperty("/barcodes", []);
                this.byId("barcodeInput").setValue("");
                var oView = this.getView();

                oView.byId("warehouse").getValue();
                oView.byId("sttyp").setValue();
                oView.byId("stbin").setValue();
                oView.byId("workcent").setValue();
                //oView.byId("plant").setValue();
                oView.byId("repairc").setValue();
                var formdata = new JSONModel();
                this.getView().byId("cuttingdata").setModel(formdata, "checkBarModel");
                this.byId("printerStep").setValidated(false);
            },
            onSkip: function () {
                // Implement skip logic for skipping
                this.byId("barcodeInput").setValue("");
                var formdata = new JSONModel();
                this.getView().byId("cuttingdata").setModel(formdata, "checkBarModel");
            },
            onConfirm: function () {
                // Implement Confirm logic for main post
                this.onPostData("/cutLengthSet");
            },
            onPostData: function (spath) {
                var oView = this.getView();
                var oModel = this.getView().getModel();
                var checkBarModel = this.getView().byId('cuttingdata').getModel("checkBarModel");
                var cuttingdata = checkBarModel.getData();
                var sWarehouseNo = oView.byId("warehouse").getValue();
                var sStorageType = oView.byId("sttyp").getValue();
                var sStorageBin = oView.byId("stbin").getValue();
                var sWorkCenter = oView.byId("workcent").getValue();
                var sWerks = oView.byId("plant").getValue();
                var sRepaircode = oView.byId("repairc").getValue();
                var sPrinter = oView.byId("printer").getSelectedKey();
                var aBarcodes = oView.byId("barcodeInput").getValue();
                //var aBarcodes = this.getView().byId("barcodeList").getModel().getData().barcodes;
                if (!aBarcodes) {
                    MessageBox.error("Scan the Barcodes first before Transfer");
                    return;
                }
                //  // Display  selected BAR_NBR values by comma separated
                // var abar_no = aBarcodes.map(function(oData) {
                // return oData.barcode;
                //  });

                var oData = {
                    lgnum: sWarehouseNo,
                    lgtyp: sStorageType,
                    lgpla: sStorageBin,
                    BAR_NBR: aBarcodes,
                    WorkCenter: sWorkCenter,
                    Werks: sWerks,
                    Padest: sPrinter,
                    CutCode: sRepaircode,
                    Repaircode: cuttingdata.Repaircode,
                    charg: cuttingdata.charg,
                    ratio: cuttingdata.ratio,
                    cut_length: cuttingdata.cut_length,
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
                    target: {
                        shellHash: "#"
                    } // Navigate to the Fiori Launchpad home
                });
            },
            // Reset to the first step
            resetWizard: function () {
                var wizard = this.getView().byId("wizard");

                // Reset wizard steps
                wizard.setCurrentStep(wizard.getSteps()[0]);
                this.onClearAll();
                this._updateFooterButtons();
                //this.toggleVisibility();
            },
            onClear: function () {
                this.byId("barcodeInput").setValue("");
            },

            // Code was coomented because we will not be using camera module
            onScanSuccess: function (oEvent) {
                if (oEvent.getParameter("cancelled")) {
                    MessageToast.show("Scan cancelled", {
                        duration: 1000
                    });
                } else {
                    if (oEvent.getParameter("text")) {
                        this.byId("barcodeInput").setValue(oEvent.getParameter("text"));
                        this.onCheckBarcode(oEvent.getParameter("text"));
                    } else {
                        MessageToast.show("Scan failed, Please try again!");
                    }
                }
            },

            onScanError: function (oEvent) {
                MessageToast.show("Scan failed: " + oEvent, {
                    duration: 1000
                });
            },

            onScanLiveupdate: function (oEvent) {
                // User can implement the validation about inputting value
            },

            onAfterRendering: function () {
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
            _updateFooterButtons: function () {
                const currentStepId = this.byId("wizard").getCurrentStep();

                const oBack = this.byId("backButton");
                const oNext = this.byId("nextButton");
                const oFinish = this.byId("finishButton");
                const oSkip = this.byId("skipButton");

                oBack.setVisible(false);
                oNext.setVisible(false);
                oFinish.setVisible(false);
                oSkip.setVisible(false);

                if (currentStepId.includes("printerStep")) {
                    oNext.setVisible(true);
                } else if (currentStepId.includes("Step2")) {
                    oBack.setVisible(true);
                    oNext.setVisible(true);
                } else if (currentStepId.includes("barcodeStep")) {
                    oBack.setVisible(true);
                    oFinish.setVisible(true);
                    oSkip.setVisible(true);
                }
            },
            onNextPress: function () {
                this._wizard.nextStep();
            },

            onBackPress: function () {
                this._wizard.previousStep();
                this._updateFooterButtons();
            },

            onFinishPress: function () {
                this.onConfirm();
            },
            fnComputeCutlength: function () {
                // Get the model instance
                var oCheckBarModel = this.getView().byId("cuttingdata").getModel("checkBarModel");

                // Get the current data from the model
                var oData = oCheckBarModel.getData();

                // Extract the key fields from the current data
                var sBarNbr = oData.BAR_NBR;
                var sRatio = oData.ratio;
                var sCutLength = oData.cut_length;
                //var sCutCode = oData.pairing;
                var sCutCode = this.getView().byId("repairc").getValue();
                BusyIndicator.show(0);
                // Construct the OData path
                var sPath = "/computeScrapLenSet(BAR_NBR='" + encodeURIComponent(sBarNbr) +
                    "',Ratio='" + encodeURIComponent(sRatio) +
                    "',CutLength='" + encodeURIComponent(sCutLength) +
                    "',CutCode='" + encodeURIComponent(sCutCode) + "')";

                // Perform the OData read and update the model on success
                this.getView().getModel().read(sPath, {
                    success: function (oData,oResponse) {
                        BusyIndicator.hide();
                        oCheckBarModel.setProperty("/remain", oData.remain.trim());
                        oCheckBarModel.setProperty("/scrap", oData.scrap.trim());    
                        oCheckBarModel.setProperty("/ratio", oData.Ratio.trim());  
                        oCheckBarModel.setProperty("/cut_length", oData.CutLength.trim());     
                        // Set updated data back to the model
                        //oCheckBarModel.setData(oData);
                        oCheckBarModel.refresh(true);   
                        console.log("Model updated with scrap length response:", oResponse);
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        console.error("Error retrieving scrap length data:", oError);
                    }
                });

            }

        });
    });