sap.ui.define([
    "sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox",
    "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel", "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator"
],
function (Controller, JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel,Filter,FilterOperator) {
    "use strict";
    var prefixId;
    return Controller.extend("com.ami.zwagonloading.controller.Unload", {
        onInit: function () {
            // Create JSON model for barcodes
            this._Page = this.byId("page3");
            this._wizard=this.byId("wizard3");
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
        },
        onBeforeRendering:function(){
            //  this.onCheckPrinter('0');
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
          onComboBoxChange: function (oEvent) {
              var oComboBox = oEvent.getSource();
              var sSelectedKey = oComboBox.getSelectedKey();
              var oWizardStep1 = this.byId("Step1");
  
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
              this.byId("Step1").setValidated(false);
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

              //this.toggleVisibility();

              // if (sCurrentStepId === 'Step1') {

              // }
          },
    //Final confirm button function
    fnWagonDataUpdate : function(){
          // Get the data from the view or model
          var oView = this.getView();
          var barNumbers = this.getView().byId("barcodeList").getModel().getData().barcodes;
          if (barNumbers.length === 0) {
            MessageBox.error("Scan the Barcodes first before Confirming");
            return;
        }
        // Iterate through each BAR_NBR value and create filter
        var sBarNbr = barNumbers.map(item => item.barcode).join(",");
          var sLgnum = oView.byId("warehouse").getSelectedKey();
          var sLgtyp = oView.byId("sttyp").getSelectedKey();
          var sLgpla = oView.byId("stbin").getSelectedKey();
            // Validate the inputs before making the POST request
            if (!sBarNbr || !sLgnum || !sLgtyp || !sLgpla) {
                MessageBox.error("Please fill in all required fields.");
                return;
            }
        // Prepare the data payload
        var oPayload = {
            BAR_NBR: sBarNbr,
            Exidv2: "",
            Lgnum: sLgnum,
            Lgtyp: sLgtyp,
            Lgpla: sLgpla,
            Function: "UNLOADING"
        };
      
        BusyIndicator.show(0);
        var that = this;
        // Execute OData request with the filter
        var oModel = this.getView().getModel(); // Assuming the model is already set on the view
        oModel.create("/Check_BarSet", oPayload, {
            success: function (oData) {
                BusyIndicator.hide();
                that.onSuccessMessageBoxPress();
                
                // Optional: If oData is needed for further processing
                console.log("Created successfully", oData);
        
                // MessageToast.show("Unloading Confirmed Successfully");
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
              var oWizardStep1 = this.byId("Step2");
              // var sBarcode = oInput.getValue();
              if (sBarcode) {
                  var oModel = this.getView().byId("barcodeList").getModel();
                  var aBarcodes = oModel.getProperty("/barcodes");
                  aBarcodes.push({ barcode: sBarcode });
                  oModel.setProperty("/barcodes", aBarcodes);
                  oInput.setValue("");
                  oWizardStep1.setValidated(true);
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
        
          //back to launchpad
          onExit: function () {
              var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
              oCrossAppNav.toExternal({
                  target: { shellHash: "#" } // Navigate to the Fiori Launchpad home
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
          onSuccessMessageBoxPress: function () {
            var that = this;
            MessageBox.success(" Unloading Successfull", {
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
            var wizard = this.getView().byId("wizard3");

            // Reset wizard steps
            wizard.setCurrentStep(wizard.getSteps()[0]);
            this._resetStep1Fields();
            this.onClearAll();
            
            
            this.byId("Step1").setValidated(false);
            this.byId("Step2").setValidated(false);
          
        },
        _resetStep1Fields: function () {
            var oView = this.getView();

            // Reset all fields in Step1
            oView.byId("warehouse").setSelectedKey(null);
            oView.byId("sttyp").setSelectedKey(null);
            oView.byId("stbin").setSelectedKey(null);
            
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
        },
       
    });
});
