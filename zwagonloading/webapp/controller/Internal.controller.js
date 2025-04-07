sap.ui.define([
    "sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox",
    "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel", "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
function (Controller, JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel,Filter,FilterOperator) {
    "use strict";
    var prefixId;

    return Controller.extend("com.ami.zwagonloading.controller.Internal", {
        onInit: function () {
                // Create JSON model for barcodes
                this._Page = this.byId("page");
                this._wizard=this.byId("wizard1");
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
        onActivate: function (oEvent) {
            var sCurrentStepId = oEvent.getParameter("id");
            sCurrentStepId = sCurrentStepId.split('-').pop();
            var oInput = this.byId("wagonID").getValue();

            if (sCurrentStepId === 'Step3') {
                this.fnBarcodeUpdate("INTERNAL_LOADING");
                this.onLoadingWagonData(oInput);

            }
            if (sCurrentStepId === 'Step2') {
               

                //MessageToast.show("hit Valid!"); 

            }
        },
        //filter wagonid on loading codes
        onLoadingCode:function(){
            
            var oInput = this.byId("wagonID").getValue();
                
                var oModel = this.getView().getModel();
                BusyIndicator.show(0);
                // Load Storage Bin data based on selected Warehouse and Storage Type
                oModel.read("/ZshLoadingCode1Set", {
                    // filters: [
                    //     new Filter("Exidv2", FilterOperator.EQ, oInput)
                       
                    // ],
                    success: function(oData) {
                        BusyIndicator.hide();
                        var oLoadingCodeModel = new sap.ui.model.json.JSONModel(oData.results);
                       // this.getView().byId("loadingcode").setModel(oLoadingCodeModel, "oLoadingCodeModel");
                       // this.getView().byId("loadingcodestatic").setModel(oLoadingCodeModel, "oLoadingCodeModel");
                        this.getView().setModel(oLoadingCodeModel, "oLoadingCodeModel");
                        //this.getView().setModel(oLoadingCodeModel, "oLoadingCodeModel");
                    
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
        onLoadingCodeGet:function(Code){
            
                
                var oModel = this.getView().getModel();
                BusyIndicator.show(0);
                var that=this;
                // Load Storage Bin data based on selected Warehouse and Storage Type
                oModel.read("/ZshLoadingCodeSet('"+Code+"')", {
                    // filters: [
                    //     new Filter("Exidv2", FilterOperator.EQ, oInput)
                       
                    // ],
                    success: function(oData) {
                        BusyIndicator.hide();
                       that.byId("loadingcode").setValue(oData.Vegr4);
                       this.byId("loadingcodestatic").setValue(oData.Vegr4);      //To set the Loading code as per screen 1 
                    
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
         //filter wagonid on loading Status
         onLoadingStatus:function(){
            
            var oInput = this.byId("wagonID").getValue();
                
                var oModel = this.getView().getModel();
                BusyIndicator.show(0);
                // Load Storage Bin data based on selected Warehouse and Storage Type
                oModel.read("/ZshLoadingStatus1Set", {
                    // filters: [
                    //     new Filter("Exidv2", FilterOperator.EQ, oInput)
                       
                    // ],
                    success: function(oData) {
                        BusyIndicator.hide();
                        var oLoadingStatusModel = new sap.ui.model.json.JSONModel(oData.results);
                        this.getView().byId("loadingstatus").setModel(oLoadingStatusModel, "oLoadingStatusModel");
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
        onLoadingStatusGet:function(Code){
            
            //var oInput = this.byId("wagonID").getValue();
                
                var oModel = this.getView().getModel();
                BusyIndicator.show(0);
                // Load Storage Bin data based on selected Warehouse and Storage Type
                oModel.read("/ZshLoadingStatusSet('"+Code+"')", {
                    // filters: [
                    //     new Filter("Exidv2", FilterOperator.EQ, oInput)
                       
                    // ],
                    success: function(oData) {
                        BusyIndicator.hide();
                        this.byId("loadingstatus").setSelectedKey(oData.Vegr1);
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
        onLoadingCodeChange:function(oEvent){
            var loadingcode = oEvent.getSource().getValue();
            this.byId("loadingcodestatic").setValue(loadingcode);
            this._wizard.validateStep(this.byId("Step1"));
        },
        onLoadingStatusChange:function(){
            if(this.byId("loadingstatus").getSelectedKey() ){
            this._wizard.validateStep(this.byId("Step3"));
            }
        },
        //wagon data retrieval on filter with wagon ID
         //filter wagonid on loading codes
         onLoadingWagonData:function(wagonID){
            
            var oInput = this.byId("wagonID").getValue();
                
                var oModel = this.getView().getModel();
                BusyIndicator.show(0);
                // Load Storage Bin data based on selected Warehouse and Storage Type
                oModel.read("/wagonDataSet(Exidv2='" + oInput + "',Function='INTERNAL')", {
                    success: function(oData) {
                        BusyIndicator.hide();
                        var oWagonIdModel = new sap.ui.model.json.JSONModel(oData);
                        this.getView().byId("wagondataform").setModel(oWagonIdModel, "oWagonIdModel");
                        //this.byId("loadingcodestatic").setValue(oData.Vegr4);
                        this.byId("loadingstatus").setSelectedKey(oData.Vegr1);
                        
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
        onCheckWagon: function (sBarcode,id) {
            var oModel = this.getView().getModel();
            
            var sPath = "/wagonIdSet(Exidv2='" + sBarcode + "',Function='INTERNAL_LOADING')";
            var that = this;
            // Show Busy Indicator
            BusyIndicator.show(0);
            oModel.read(sPath, {
                success: function (oData) {
                    BusyIndicator.hide();
                   
                    MessageToast.show("Wagon ID is Valid!");
                    that.byId(id).setEditable(false);
                    that.byId(id).setValue(sBarcode);
                    that.onLoadingCode();
                    that.onLoadingCodeGet(sBarcode);        //Added for 
                    that.onLoadingStatusGet(sBarcode);
                    that.onLoadingStatus();
                     that._wizard.validateStep(that.byId("Step1"));
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
                    that._wizard.validateStep(!that.byId("Step1"));
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
          // for wagon access the scan camera
          onScanSuccessWG: function(oEvent) {
            if (oEvent.getParameter("cancelled")) {
                MessageToast.show("Scan cancelled", { duration:1000 });
            } else {
                if (oEvent.getParameter("text")) {
                    this.onCheckWagon(oEvent.getParameter("text"),"wagonID");
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
        onScanWagon: function (ev) {
            var sBarcode = ev.getSource().getValue();
            var inputID= ev.getSource().getId();
            this.onCheckWagon(sBarcode,inputID);
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
            // this._wizard.discardProgress(this.byId("barcodeStep"));
            // this.byId("barcodeInput").setEditable(true);
            // this.byId("barcodeInput").setValue("");
            //  this._wizard.invalidateStep(this.byId("barcodeStep"));

            // this._wizard.validateStep(this.byId("barcodeStep1"));
            // this._wizard.validateStep(this.byId("barcodeStep2"));
            this.fnWagonDataUpdate();


        
        },
        //Final confirm button function
        fnWagonDataUpdate : function(){
            var oPayload = {
                Exidv2: this.byId("wagonID").getValue(),
                Vegr4 : this.byId("loadingcodestatic").getValue(),
                Vegr1 :this.byId("loadingstatus").getSelectedKey()
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
        //Replaced loading Code Dropdown Data with Valuehelp and freeText 14.10.2024
        onLoadingCodeVH:function(){
            this._getDialog2().open();
        },
        _getDialog2: function () {
			if (!this._oDialog2) {
				this._oDialog2 = sap.ui.xmlfragment("com.ami.zwagonloading.view.fragment.LoadincgCodeVH", this);
				this.getView().addDependent(this._oDialog2);
			}
			return this._oDialog2;
		},
		onCloseDialogIO: function () {
			
            this._getDialog2().destroy();
           this._oDialog2= null;
            this._getDialog2().close();
		},
        onRowSelect: function (oEvent) {
			var oModel = this.getOwnerComponent().getModel("app");
			var Selectedrow = oEvent.getParameter("listItem").getBindingContext("oLoadingCodeModel").getObject();
			this.getView().byId("loadingcodestatic").setValue(Selectedrow.Vegr4);
			this.getView().byId("loadingcode").setValue(Selectedrow.Vegr4);
            this.onCloseDialogIO();
			
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
            // Iterate through each BAR_NBR value and create filter
            var bar_nbr = barNumbers.map(item => item.barcode).join(",");
            var oPayload = {
                BAR_NBR: bar_nbr,
                Exidv2 : wagonID,
                Function : Func 
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
            MessageBox.success("Internal Loading Successfull", {
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
            var wizard = this.getView().byId("wizard1");

            // Reset wizard steps
            wizard.setCurrentStep(wizard.getSteps()[0]);
            this._resetStep1Fields();
            this.onClearAll();
            this.onClear();
            
            this.byId("Step1").setValidated(false);
            this.byId("Step2").setValidated(false);
          
        },
        _resetStep1Fields: function () {
            var oView = this.getView();

            // Reset all fields in Step1
            oView.byId("loadingcode").setValue("");
            oView.byId("loadingcodestatic").setValue("");
            oView.byId("loadingstatus").setSelectedKey(null);
            
        },
        //back to launchpad
        onExit: function () {
            var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
            oCrossAppNav.toExternal({
                target: { shellHash: "#" } // Navigate to the Fiori Launchpad home
            });
        },
        onHomePress:function(){
            this.resetWizard();
            this.getOwnerComponent().getRouter().navTo("RouteHome");
        },
        onClearAll: function () {
            this.byId("barcodeInput").setEditable(true);
            this.byId("barcodeInput").setValue("");
            var oModel = this.getView().byId("barcodeList").getModel();
            oModel.setProperty("/barcodes", []);
            this._wizard.invalidateStep(this.byId("Step2")); 
            this.onCloseDialogIO();  
        },
        onInfoPress: function () {
            MessageBox.information("Press Enter to Add more Barcodes.");
        },
        onClear: function () {
            this.byId("wagonID").setEditable(true);
            this.byId("wagonID").setValue("");
            this._wizard.invalidateStep(this.byId("Step1"));
        },
        onAfterRendering: function() {
            this.onLoadingCode();
            
        },
    });
});
