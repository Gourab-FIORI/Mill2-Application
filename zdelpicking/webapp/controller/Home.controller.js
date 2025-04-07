/***********************************************
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 *          Introduction to Developments        *
 *                                              *
 * -------------------------------------------- *
 * |  Module Name:       | zdelpicking          |
 * |---------------------|----------------------|
 * |  Developer Name:    | GOURAB SINGHA,       |
 * |                     | ANUBHAV MITRA        |
 * |---------------------|----------------------|
 * |  Project Manager:   | Manas Mishra         |
 * |---------------------|----------------------|
 * |  Component Name:    | com.ami.zdelpicking  |
 * |---------------------|----------------------|
 * |  Package Name:      | Zmm_amws             |
 * |---------------------|----------------------|
 * |  Development Date:  | 14.11.2024           |
 * -------------------------------------------- *
 *                                              *
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 ***********************************************/
sap.ui.define([
        "sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox",
        "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel", "sap/m/Dialog",
        "sap/m/Label",
        "sap/m/Input",
        "sap/m/Button"
    ],
    function (Controller, JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel, Dialog, Label, Input, Button) {
        "use strict";

        return Controller.extend("com.ami.zdelpicking.controller.Home", {
            onInit: function () {
                // Create JSON model for barcodes
                //  this._Page = this.byId("page");
                //  this._wizard=this.byId("wizard");
                //  var oModel = new JSONModel({ barcodes: [] });
                //  this.getView().byId("barcodeList").setModel(oModel);
                var sDefaultLanguage = sap.ui.getCore().getConfiguration().getLanguage();
                this._setLanguage(sDefaultLanguage);
                
            },
            onLanguageChange: function (oEvent) {
                var sSelectedLanguage = oEvent.getParameter("selectedItem").getKey();
                this._setLanguage(sSelectedLanguage);
            },

            _setLanguage: function (sLanguage) {
                var i18nModel = new ResourceModel({
                    bundleName: "com.ami.zdelpicking.i18n.i18n",
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
            onScanError: function (oEvent) {
                MessageToast.show("Scan failed: " + oEvent, {
                    duration: 1000
                });
            },

            // for Delivery item access the scan camera
            onScanSuccessDD: function (oEvent) {
                if (oEvent.getParameter("cancelled")) {
                    MessageToast.show("Scan cancelled", {
                        duration: 1000
                    });
                } else {
                    if (oEvent.getParameter("text")) {
                        this.fnDeliveryData(oEvent.getParameter("text"));
                    } else {
                        MessageToast.show("Scan failed, Please try again!");
                    }
                }
            },
            // fnDeliveryData:function(code){

            //         var oModel = this.getView().getModel();
            //         var sPath = "/DeliveryItemSet('" + code + "')";
            //         var that = this;
            //         // Show Busy Indicator
            //         BusyIndicator.show(0);
            //         oModel.read(sPath, {
            //             success: function (oData) {
            //                 BusyIndicator.hide();
            //                 MessageToast.show("Delivery Item No. is Valid!");
            //                 var data = new JSONModel(oData);
            //                 that.byId("simpleFormId").setModel(data,"deliveryModel");
            //                  that._wizard.validateStep(that.byId("Step1"));
            //                  //that.onAddBarcode(sBarcode);
            //                 // Handle successful barcode check here
            //                 //console.log(oData);
            //             },
            //             error: function (oError) {
            //                 BusyIndicator.hide();
            //                 var sErrorMessage = "An error occurred,Please try again!";
            //                 //that._wizard.invalidateStep(that.byId("barcodeStep"));
            //                 try {
            //                     var oResponse = JSON.parse(oError.responseText);
            //                     if (oResponse.error && oResponse.error.message && oResponse.error.message.value) {
            //                         sErrorMessage = oResponse.error.message.value;
            //                     }
            //                 } catch (e) {
            //                     console.error("Failed to parse error response", e);
            //                 }

            //                 MessageBox.error(sErrorMessage);
            //                 that.byId("barcodeInputDD").setValue("");
            //                 var data = new JSONModel();
            //                 that.byId("simpleFormId").setModel(data,"deliveryModel");
            //                 that._wizard.invalidateStep(that.byId("Step1"));
            //                 console.error(oError);
            //             }
            //         });
            // },
            fnDeliveryData: function (code) {
                var oModel = this.getView().getModel(); // OData model
                var oFilter = new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, code); // Create filter for Vbeln eq 'code'
                var oFilter1 = new sap.ui.model.Filter("Function", sap.ui.model.FilterOperator.EQ, "Item");
                var sPath = "/DeliveryItemSet"; // OData service path 
                var that = this;

                // Show Busy Indicator
                BusyIndicator.show(0);

                oModel.read(sPath, {
                    filters: [oFilter, oFilter1], // Apply the filter to the read call
                    success: function (oData) {
                        BusyIndicator.hide();
                        MessageToast.show("Delivery Item No. is Valid!");

                        // Bind data directly to the table model
                        var oTableModel = new JSONModel(oData.results);
                        that.getView().byId("simpleFormId").setModel(oTableModel, "deliveryModel");

                        // Validate the wizard step
                        // that._wizard.validateStep(that.byId("Step1"));
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

                        MessageBox.error(sErrorMessage);

                        // Reset table model
                        var oTableModel = new JSONModel();
                        that.getView().byId("simpleFormId").setModel(oTableModel, "deliveryModel");

                        //that._wizard.invalidateStep(that.byId("Step1"));
                        console.error(oError);
                    },
                });
            },

            onPGI: function () {
                this.fnPost("PGI");
            },
            // onFC: function () {
            //     // Create a Dialog dynamically if it doesn't exist
            //     if (!this._oForceCompleteDialog) {
            //         this._oForceCompleteDialog = new Dialog({
            //             title: this.getView().getModel("i18n").getProperty("Force_Complete_Title"),
            //             content: [
            //                 new Label({
            //                     text: this.getView().getModel("i18n").getProperty("Delivered_Qty"),
            //                     labelFor: "deliveredQtyInput"
            //                 }),
            //                 new Input("deliveredQtyInput", {
            //                     value: "{pickingModel>/Lfimg}", // Bind to Delivered Quantity
            //                     type: "Number",
            //                 })
            //             ],
            //             beginButton: new Button({
            //                 text: this.getView().getModel("i18n").getProperty("OK_Button"),
            //                 press: this.onForceCompleteConfirm.bind(this) // Ensure `this` is bound properly here
            //             }),
            //             endButton: new Button({
            //                 text: this.getView().getModel("i18n").getProperty("Cancel_Button"),
            //                 press: function () {
            //                     this._oForceCompleteDialog.close();
            //                 }.bind(this)
            //             })
            //         });

            //         // Add the dialog to the View
            //         this.getView().addDependent(this._oForceCompleteDialog);
            //     }

            //     // Open the dialog
            //     this._oForceCompleteDialog.open();
            // },

            onFC: function () {
                // Get the updated Delivered Quantity
                // var sUpdatedQty = sap.ui.getCore().byId("deliveredQtyInput").getValue();

                // // Validate the input
                // if (!sUpdatedQty || parseFloat(sUpdatedQty) <= 0) {
                //     MessageToast.show(this.getView().getModel("i18n").getProperty("Invalid_Qty_Message"));
                //     return;
                // }

                // // Update the Delivered Quantity in the model
                // var oModel = this.getView().byId("simpleForm").getModel("pickingModel");
                // oModel.setProperty("/Lfimg", sUpdatedQty);

                // // Close the dialog
                // this._oForceCompleteDialog.close();
                var that = this;
                MessageBox.success("Confirm Force Complete?",{
                    actions: ["Yes", "Exit"],
                    emphasizedAction: "Yes",
                    onClose: function (sAction) {
                        if (sAction === "Yes") {
                            that.onPick("FCOMPLETE");
                        } 
                    },
                    dependentOn: this.getView()
                });
                

                // Show a success message
                //MessageToast.show(this.getView().getModel("i18n").getProperty("Force_Complete_Success_Message"));
            },
            //on add
            onAdd: function (str) {
                var oView = this.getView();
                var payload = oView.byId("simpleForm").getModel("pickingModel").getData();

                // Check for barcode list lengths
                if (!payload.Batch) {
                    MessageBox.error("Enter Batch first before Adding");
                    return;
                }

                this.onPick("ADD");
            },
            onPick: function (str) {
                var oView = this.getView();

                var payload = oView.byId("simpleForm").getModel("pickingModel").getData();

                // Get the OData model
                var oModel = oView.getModel();
                payload.Function = str;
                // Show a busy indicator while the request is being processed
                sap.ui.core.BusyIndicator.show(0);
                var that = this;
                // Make the OData POST request
                oModel.create("/DeliveryItemSet", payload, {
                    success: function (oData, response) {
                        // Hide the busy indicator
                        sap.ui.core.BusyIndicator.hide();

                        // Show success message
                        //that.onSuccessMessageBoxPress("Update Was Successful!");
                        MessageBox.success("Update Was Successful!");
                        that.fnPickData(payload.Vbeln,payload.Posnr);
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
                            } else {
                                sErrorMessage = JSON.parse(oError.responseText).error.message.value;
                            }

                        } catch (e) {
                            // Log or handle parsing error if needed
                            console.error("Error parsing the XML response:", e);
                        }

                        // Show error message
                        MessageBox.error(sErrorMessage);

                        console.error(oError);
                    }
                });

            },
            onSave: function (oEvent) {
                // Get the table item (row) where the Save button was pressed
                var oTableItem = oEvent.getSource().getParent();

                // Access the model and the corresponding row context
                var oDetailsModel = this.getView().byId("pickTable").getModel("detailsModel");
                var sPath = oTableItem.getBindingContext("detailsModel").getPath(); // Path to the specific item in the model

                // Set Busy state for the row
                oDetailsModel.setProperty(sPath + "/busy", true);

                // Retrieve the data for the specific item
                var oRowData = oDetailsModel.getProperty(sPath);

                // Construct the payload for this row
                var oPayload = {
                    Posnr: oRowData.Posnr, // Item Number
                    Vbeln: oRowData.Vbeln, // Batch
                    Meins: oRowData.Meins, // Unit of Measure
                    Pickqty: oRowData.Pickqty,
                    Function: "SUBITEMUPD" // Picked Quantity
                };
                if(oPayload.Pickqty===""||oPayload.Pickqty===0){
                    oPayload.Pickqty="0.000"
                }
                var that = this;
                // Make an OData call to update this specific item
                var oModel = this.getView().getModel(); // Assuming the default OData model is set
                oModel.create("/DeliveryItemSet", oPayload, {
                    success: function () {
                        MessageBox.success("Line item updated successfully.");

                        // Remove Busy state after success
                        oDetailsModel.setProperty(sPath + "/busy", false);
                    },
                    error: function (oError) {
                        // Parse the error message from XML
                        var sErrorMessage = "An error occurred. Please try again.";

                        try {
                            // Parse the XML response
                            var oParser = new DOMParser();
                            var oXmlDoc = oParser.parseFromString(oError.responseText, "application/xml");
                            var oMessage = oXmlDoc.getElementsByTagName("message")[0];
                            if (oMessage && oMessage.textContent) {
                                sErrorMessage = oMessage.textContent;
                            } else {
                                sErrorMessage = JSON.parse(oError.responseText).error.message.value;
                            }

                        } catch (e) {
                            // Log or handle parsing error if needed
                            console.error("Error parsing the XML response:", e);
                        }

                        // Show error message
                        MessageBox.error(sErrorMessage);

                        console.error(oError);

                        oDetailsModel.setProperty(sPath + "/busy", false);
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
                    target: {
                        shellHash: "#"
                    } // Navigate to the Fiori Launchpad home
                });
            },
            // Reset to the first step
            resetWizard: function () {
                // var wizard = this.getView().byId("wizard");
                var navCon = this.byId("navCon");
                navCon.to(this.byId("page"), "slide");

                // // Reset wizard steps
                // wizard.setCurrentStep(wizard.getSteps()[0]);
                this._resetStep2Fields();
                // //this._disableStep2Fields(true);
                // // this.getView().byId("confirmPrint").setSelected(false);
                // this.byId("Step1").setValidated(false);


            },
            _resetStep2Fields: function () {
                var oView = this.getView();

                // // Reset all fields in Step1,2
                // var oModel = this.getView().byId("barcodeList").getModel();
                // oModel.setProperty("/barcodes", []);
                var data = new JSONModel();
                this.getView().byId("simpleFormId").setModel(data, "deliveryModel");
                this.getView().byId("simpleForm").setModel(data, "pickingModel");
                oView.byId("barcodeInputDD").setValue("");
                // oView.byId("barcodeInput").setValue("");

            },
            onInfoPress: function () {
                MessageBox.information("Press Enter to Fetch Delivery Details.");
            },
            onClearAll: function () {

                this.byId("barcodeInput").setValue("");
                var oModel = this.getView().byId("barcodeList").getModel();
                oModel.setProperty("/barcodes", []);

            },
            onClearDD: function () {

                this.byId("barcodeInputDD").setValue("");
                var data = new JSONModel();
                this.byId("simpleFormId").setModel(data, "deliveryModel");
                this.byId("Step1").setValidated(false);
            },
            onNavigationFinished: function (evt) {
                var toPage = evt.getParameter("to");
                //MessageToast.show("Navigation to page '" + toPage.getTitle() + "' finished");
            },

            handleNav: function (page) {
                var navCon = this.byId("navCon");
                navCon.to(this.byId(page), "slide");
            },
            onPickPress: function (Ev) {
                var sVbeln = Ev.getSource().getParent().getParent().getBindingContext("deliveryModel").getObject().Vbeln;
                var sPosnr = Ev.getSource().getParent().getParent().getBindingContext("deliveryModel").getObject().Posnr;
                this.fnPickData(sVbeln, sPosnr);
                this.handleNav("Pick");
            },
            onDetailsPress: function (Ev) {
               // var sVbeln = Ev.getSource().getParent().getParent().getBindingContext("deliveryModel").getObject().Vbeln;
                //var sPosnr = Ev.getSource().getParent().getParent().getBindingContext("deliveryModel").getObject().Posnr;  // As details is directed through line item click
                var sVbeln = Ev.getSource().getBindingContext("deliveryModel").getObject().Vbeln;
                var sPosnr = Ev.getSource().getBindingContext("deliveryModel").getObject().Posnr;
                this.fnSubItemData(sVbeln, sPosnr);
                this.handleNav("Details");
            },
            navBack: function () {
                this.byId("navCon").back();
            },
            fnSubItemData: function (code, sPosnr) {
                var oModel = this.getView().getModel(); // OData model
                var oFilter = new sap.ui.model.Filter("Vbeln", sap.ui.model.FilterOperator.EQ, code); // Create filter for Vbeln eq 'code'
                var oFilter1 = new sap.ui.model.Filter("Function", sap.ui.model.FilterOperator.EQ, "Subitem");
                var oFilter2 = new sap.ui.model.Filter("Posnr", sap.ui.model.FilterOperator.EQ, sPosnr);
                var sPath = "/DeliveryItemSet"; // OData service path 
                var that = this;

                // Show Busy Indicator
                BusyIndicator.show(0);

                oModel.read(sPath, {
                    filters: [oFilter, oFilter1, oFilter2], // Apply the filter to the read call
                    success: function (oData) {
                        BusyIndicator.hide();
                        //  MessageToast.show("Delivery Item No. is Valid!");

                        // Bind data directly to the table model
                        var oTableModel = new JSONModel(oData.results);
                        that.getView().byId("pickTable").setModel(oTableModel, "detailsModel");

                        // Validate the wizard step
                        // that._wizard.validateStep(that.byId("Step1"));
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

                        MessageBox.error(sErrorMessage);

                        // Reset table model
                        var oTableModel = new JSONModel();
                        that.getView().byId("pickTable").setModel(oTableModel, "detailsModel");

                        //that._wizard.invalidateStep(that.byId("Step1"));
                        console.error(oError);
                    },
                });
            },
            fnPickData: function (code, sPosnr) {
                var oModel = this.getView().getModel(); // OData model
                var sFunction = "Item"; // Function
                // Construct the OData path
                var sPath = "/DeliveryItemSet(Vbeln='" + code + "',Posnr='" + sPosnr + "',Function='" + sFunction + "')";
                var that = this;

                // Show Busy Indicator
                BusyIndicator.show(0);

                oModel.read(sPath, {
                    success: function (oData) {
                        BusyIndicator.hide();
                        //  MessageToast.show("Delivery Item No. is Valid!");

                        // Bind data directly to the table model
                        var oTableModel = new JSONModel(oData);
                        that.getView().byId("simpleForm").setModel(oTableModel, "pickingModel");

                        // Validate the wizard step
                        // that._wizard.validateStep(that.byId("Step1"));
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

                        MessageBox.error(sErrorMessage);

                        // Reset table model
                        var oTableModel = new JSONModel();
                        that.getView().byId("simpleForm").setModel(oTableModel, "pickingModel");

                        //that._wizard.invalidateStep(that.byId("Step1"));
                        console.error(oError);
                    },
                });
            },



        });
    });