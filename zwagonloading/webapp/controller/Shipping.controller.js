sap.ui.define([
        "sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox",
        "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel", "sap/ui/model/Filter",
        "sap/ui/model/FilterOperator"
    ],
    function (Controller, JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel, Filter, FilterOperator) {
        "use strict";
        var prefixId;
        return Controller.extend("com.ami.zwagonloading.controller.Shipping", {
            onInit: function () {
                // Create JSON model for barcodes
                this._Page = this.byId("page2");
                this._wizard = this.byId("wizard2");
                var oModel = new JSONModel({
                    barcodes: []
                });
                this.getView().byId("barcodeList").setModel(oModel);
                var sDefaultLanguage = sap.ui.getCore().getConfiguration().getLanguage();
                this._setLanguage(sDefaultLanguage);
                prefixId = this.createId();
                if (prefixId) {
                    prefixId = prefixId.split("--")[0] + "--";
                } else {
                    prefixId = "";
                }
                //oScanResultText = Element.getElementById(prefixId + 'sampleBarcodeScannerResult');
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
            onActivate_old: function (oEvent) {
                var sCurrentStepId = oEvent.getParameter("id");
                sCurrentStepId = sCurrentStepId.split('-').pop();
                var oInput = this.byId("wagonID").getValue();

                if (sCurrentStepId === 'Step3') {
                    this.fnBarcodeUpdate("SHIPMENT");
                    this.onLoadingWagonData(oInput);

                }
                if (sCurrentStepId === 'Step2') {


                    //MessageToast.show("hit Valid!"); 

                }
            },
            //Static buttons to control Wizard
            onActivate: function (oEvent) {
                const sCurrentStepId = oEvent.getParameter("id").split("-").pop();
                const oInput = this.byId("wagonID").getValue();

                this._updateFooterButtons(sCurrentStepId);

                if (sCurrentStepId === 'Step3') {
                    this.fnBarcodeUpdate("SHIPMENT");
                    this.onLoadingWagonData(oInput);
                }
            },

            _updateFooterButtons: function (sCurrentStepId) {
                const oBackButton = this.byId("backButton");
                const oNextButton = this.byId("nextButton");
                const oConfirmButton = this.byId("finishButton");


                switch (sCurrentStepId) {
                    case "Step1":
                        oBackButton.setVisible(false);
                        oNextButton.setVisible(true);
                        oConfirmButton.setVisible(false);

                        break;

                    case "Step2":
                        oBackButton.setVisible(true);
                        oNextButton.setVisible(true);
                        oConfirmButton.setVisible(false);

                        break;

                    case "Step3":
                        oBackButton.setVisible(true);
                        oNextButton.setVisible(false);
                        oConfirmButton.setVisible(true);

                        break;
                }
            },


            onNextPress: function () {
                const wizard = this.byId("wizard2");
                wizard.nextStep();
                this._updateFooterButtons();
                this.byId("nextButton").setEnabled(false);
            },

            onBackPress: function () {
                const oWizard = this.byId("wizard2");
                oWizard.previousStep();
                const sStepId = oWizard.getCurrentStep().split("-").pop();
                this._updateFooterButtons(sStepId);
                this.byId("nextButton").setEnabled(true);
            },

            onLoadingStatusChange: function () {
                this._wizard.validateStep(this.byId("Step3"));
            },
            //wagon data retrieval on filter with wagon ID
            //filter wagonid on loading codes
            onLoadingWagonData: function (wagonID) {

                var oInput = this.byId("wagonID").getValue();

                var oModel = this.getView().getModel();
                BusyIndicator.show(0);
                // Load Storage Bin data based on selected Warehouse and Storage Type
                oModel.read("/wagonDataSet(Exidv2='" + oInput + "',Function='SHIPMENT')", {
                    success: function (oData) {
                        BusyIndicator.hide();
                        var oWagonIdModel = new sap.ui.model.json.JSONModel(oData);
                        this.getView().byId("wagondataform").setModel(oWagonIdModel, "oWagonIdModel");
                        this.byId("loadingstatus").setSelectedKey(oData.Vegr1);
                        var oWizardStep1 = this.byId("Step3");
                        oWizardStep1.setValidated(true);
                        this.byId("nextButton").setEnabled(true);
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
            onCheckWagon: function (sBarcode, id) {
                var oModel = this.getView().getModel();
                // var sPath = "/wagonIdSet('" + sBarcode + "')";
                var sPath = "/wagonIdSet(Exidv2='" + sBarcode + "',Function='SHIPMENT')";

                var that = this;
                // Show Busy Indicator
                BusyIndicator.show(0);
                oModel.read(sPath, {
                    success: function (oData) {
                        BusyIndicator.hide();

                        MessageToast.show("Wagon ID is Valid!");
                        that.byId(id).setEditable(false);
                        that.byId(id).setValue(sBarcode);
                        that.onLoadingStatus();
                        that.onLoadingStatusGet(sBarcode);
                        that._wizard.validateStep(that.byId("Step1"));
                        that.byId("nextButton").setEnabled(true);
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
                        that.byId(id).setValue("");
                        console.error(oError);
                    }
                });
            },
            //on check Barcode from backend 
            onCheckBarcode: function (sBarcode) {
                var oModel = this.getView().getModel();
                var sPath = "/Check_BarSet('" + sBarcode + "')";
                var that = this;
                // Show Busy Indicator
                BusyIndicator.show(0);
                oModel.read(sPath, {
                    success: function (oData, response) {
                        BusyIndicator.hide();
                        ///warning messsage code block

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
                                        that.byId("nextButton").setEnabled(true);
                                    }
                                });
                            }
                        } else {

                            that.onAddBarcode(sBarcode);
                            MessageToast.show("Barcode is Valid!");
                            that.byId("Step2").setValidated(true);
                            that.byId("nextButton").setEnabled(true);
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
            onScanSuccess: function (oEvent) {
                if (oEvent.getParameter("cancelled")) {
                    MessageToast.show("Scan cancelled", {
                        duration: 1000
                    });
                } else {
                    if (oEvent.getParameter("text")) {
                        this.onCheckBarcode(oEvent.getParameter("text"));
                    } else {
                        MessageToast.show("Scan failed, Please try again!");
                    }
                }
            },
            // for wagon access the scan camera
            onScanSuccessWG: function (oEvent) {
                if (oEvent.getParameter("cancelled")) {
                    MessageToast.show("Scan cancelled", {
                        duration: 1000
                    });
                } else {
                    if (oEvent.getParameter("text")) {
                        this.onCheckWagon(oEvent.getParameter("text"), "wagonID");
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
            onScanWagon: function (ev) {
                var sBarcode = ev.getSource().getValue();
                var inputID = ev.getSource().getId();
                this.onCheckWagon(sBarcode, inputID);
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
                    aBarcodes.push({
                        barcode: sBarcode
                    });
                    oModel.setProperty("/barcodes", aBarcodes);
                    oInput.setValue("");
                }
            },
            //filter wagonid on loading Status
            onLoadingStatus: function () {

                var oInput = this.byId("wagonID").getValue();

                var oModel = this.getView().getModel();
                BusyIndicator.show(0);
                // Load Storage Bin data based on selected Warehouse and Storage Type
                oModel.read("/ZshLoadingStatus1Set", {
                    // filters: [
                    //     new Filter("Exidv2", FilterOperator.EQ, oInput)

                    // ],
                    success: function (oData) {
                        BusyIndicator.hide();
                        var oLoadingStatusModel = new sap.ui.model.json.JSONModel(oData.results);
                        this.getView().byId("loadingstatus").setModel(oLoadingStatusModel, "oLoadingStatusModel");
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
            onLoadingStatusGet: function (Code) {

                // var oInput = this.byId("wagonID").getValue();

                var oModel = this.getView().getModel();
                BusyIndicator.show(0);
                // Load Storage Bin data based on selected Warehouse and Storage Type
                oModel.read("/ZshLoadingStatusSet('" + Code + "')", {
                    // filters: [
                    //     new Filter("Exidv2", FilterOperator.EQ, oInput)

                    // ],
                    success: function (oData) {
                        BusyIndicator.hide();
                        this.byId("loadingstatus").setSelectedKey(oData.Vegr1);
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
            wizardCompletedHandler: function () {
                // this._wizard.discardProgress(this.byId("barcodeStep"));
                // this.byId("barcodeInput").setEditable(true);
                // this.byId("barcodeInput").setValue("");
                //  this._wizard.invalidateStep(this.byId("barcodeStep"));

                // this._wizard.validateStep(this.byId("barcodeStep1"));
                // this._wizard.validateStep(this.byId("barcodeStep2"));
                this.fnWagonDataUpdate();



            },
            //Final confirm button function
            fnWagonDataUpdate: function () {
                var oPayload = {
                    Exidv2: this.byId("wagonID").getValue(),
                    Vegr1: this.byId("loadingstatus").getSelectedKey()
                };

                BusyIndicator.show(0);
                var that = this;
                // Execute OData request with the filter
                var oModel = this.getView().getModel(); // Assuming the model is already set on the view
                oModel.create("/wagonDataSet", oPayload, {
                    success: function (oData) {
                        BusyIndicator.hide();


                        // Optional: If oData is needed for further processing
                        console.log("Created successfully", oData);
                        that.onSuccessMessageBoxPress();
                        //MessageToast.show("Barcodes Confirmed Successfully");
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        var sErrorMessage = "An error occurred, Please try again!";

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

            //Barcode Update entity function
            fnBarcodeUpdate: function (Func) {
                // Define your filter parameters
                // var filters = [];
                // var printer = this.getView().byId("printerSelect").getValue();
                // Add BAR_NBR filters (assuming BAR_NBR values are dynamic)
                var wagonID = this.getView().byId("wagonID").getValue();
                var barNumbers = this.getView().byId("barcodeList").getModel().getData().barcodes;
                if (barNumbers.length === 0) {
                    MessageBox.error("Scan the Barcodes first before Confirming");
                    return;
                }
                 var contremValue = this.getOwnerComponent().getModel("globalData").getProperty("/contrem");
                // Iterate through each BAR_NBR value and create filter
                var bar_nbr = barNumbers.map(item => item.barcode).join(",");
                var oPayload = {
                    BAR_NBR: bar_nbr,
                    Exidv2: wagonID,
                    Function: Func,
                    contrem : contremValue
                };

                BusyIndicator.show(0);
                var that = this;
                // Execute OData request with the filter
                var oModel = this.getView().getModel(); // Assuming the model is already set on the view
                oModel.create("/Check_BarSet", oPayload, {
                    success: function (oData) {
                        BusyIndicator.hide();


                        // Optional: If oData is needed for further processing
                        console.log("Created successfully", oData);

                        MessageToast.show("Barcodes Confirmed Successfully");
                    },
                    error: function (oError) {
                        BusyIndicator.hide();
                        var sErrorMessage = "An error occurred, Please try again!";

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
                MessageBox.success("Shipment Successfull", {
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
            // Reset to the first step
            resetWizard: function () {
                var wizard = this.getView().byId("wizard2");

                // Reset wizard steps
                wizard.setCurrentStep(wizard.getSteps()[0]);
                this._resetStep1Fields();
                this.onClearAll();
                this.onClear();

                this.byId("Step1").setValidated(false);
                this.byId("Step2").setValidated(false);
                this.byId("nextButton").setEnabled(false);
            },
            _resetStep1Fields: function () {
                var oView = this.getView();

                // Reset all fields in Step1

                oView.byId("loadingstatus").setSelectedKey(null);

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
            onHomePress: function () {
                this.resetWizard();
                this.getOwnerComponent().getRouter().navTo("RouteHome");
            },
            onClearAll: function () {
                this.byId("barcodeInput").setEditable(true);
                this.byId("barcodeInput").setValue("");
                var oModel = this.getView().byId("barcodeList").getModel();
                oModel.setProperty("/barcodes", []);
                this._wizard.invalidateStep(this.byId("Step2"));
                this.byId("nextButton").setEnabled(false);
            },
            onClear: function () {
                this.byId("wagonID").setEditable(true);
                this.byId("wagonID").setValue("");
                this._wizard.invalidateStep(this.byId("Step1"));
                this.byId("nextButton").setEnabled(false);
            },

        });
    });