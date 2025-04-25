/***********************************************
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 *          Introduction to Developments        *
 *                                              *
 * -------------------------------------------- *
 * |  Module Name:       | Zupdatedefect             |
 * |---------------------|----------------------|
 * |  Developer Name:    | GOURAB SINGHA,       |
 * |                     | ANUBHAV MITRA        |
 * |---------------------|----------------------|
 * |  Project Manager:   | Manas Mishra         |
 * |---------------------|----------------------|
 * |  Component Name:    | com.ami.zupdatedefect|
 * |---------------------|----------------------|
 * |  Package Name:      | ZFIODEV              |
 * |---------------------|----------------------|
 * |  Development Date:  | 23.09.2024           |
 * -------------------------------------------- *
 *                                              *
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 ***********************************************/

sap.ui.define([
        "sap/ui/core/mvc/Controller", "sap/ui/model/json/JSONModel", "sap/m/MessageBox",
        "sap/ui/core/Element", "sap/m/MessageToast", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel", "sap/m/Dialog",
        "sap/m/Input",
        "sap/m/Label",
        "sap/m/Button","sap/m/SelectDialog",
    ],
    function (Controller, JSONModel, MessageBox, Element, MessageToast, BusyIndicator, ResourceModel, Dialog, Input, Label, Button,SelectDialog) {
        "use strict";
        var gContrem = ""; // Global variable to store Contrem value
        return Controller.extend("com.ami.zupdatedefect.controller.View1", {
            onInit: function () {
                // Create JSON model for barcodes
                this._Page = this.byId("page");
                this._wizard = this.byId("wizard");
                // var oModel = new JSONModel({ barcodes: [] });
                // this.getView().byId("barcodeList").setModel(oModel);
                var sDefaultLanguage = sap.ui.getCore().getConfiguration().getLanguage();
                this._setLanguage(sDefaultLanguage);

                // Open the Contrem dialog for user input ++09.04.2025
                // This function displays a dialog that prompts the user to enter a Contrem value.
                // The entered value will be stored in a global variable for later use.
                this._openContremDialog();
            },
            onLanguageChange: function (oEvent) {
                var sSelectedLanguage = oEvent.getParameter("selectedItem").getKey();
                this._setLanguage(sSelectedLanguage);
            },
       
            _setLanguage: function (sLanguage) {
                var i18nModel = new ResourceModel({
                    bundleName: "com.ami.zupdatedefect.i18n.i18n",
                    bundleLocale: sLanguage
                });
                this.getView().setModel(i18nModel, "i18n");
            },
            fntranslate: function(txt){
               var oResourceBundle = this.getOwnerComponent().getModel("i18n").getResourceBundle();
               var sTxt = oResourceBundle.getText(txt);
               return sTxt;
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
                      //that.onAddBarcode(sBarcode);
                      that.byId("barcodeInput").setValue(sBarcode);
                      that.byId("barcodeInput").setEditable(false);
                      MessageToast.show(that.fntranslate("Msg1"));
                      that.onFilterTable(sBarcode);
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
          onScanError: function(oEvent) {
              MessageToast.show("Scan failed: " + oEvent, { duration:1000 });
          },
          onClearAll: function () {
           //    var oModel = this.getView().byId("barcodeList").getModel();
           //    oModel.setProperty("/barcodes", []);
               this.onFilterTable();
               this.byId("barcodeInput").setEditable(true);
              this.byId("barcodeInput").setValue("");
          },
          onTypeChange: function(oEvent) {
           // Get the selected type value
           var sSelectedType = oEvent.getSource().getSelectedKey();
           
           // if (!sSelectedType) {
           //     sap.m.MessageToast.show("Please select a Type.");
           //     return;
           // }
           //this.byId("idType").setSelectedKey(null);
           this.byId("idPosition").setSelectedKey(null);
           this.byId("idDetailedposition").setSelectedKey(null);
           this.byId("idDetailedpositionleng").setSelectedKey(null);
           this.byId("idDetailedpositionRep").setSelectedKey(null);
       
           // Show busy indicator while updating the dropdowns
           this.byId("idPosition").setBusy(true);
           this.byId("idDetailedposition").setBusy(true);
           this.byId("idDetailedpositionleng").setBusy(true);
           this.byId("idDetailedpositionRep").setBusy(true);
       
           // Create filter based on selected Type
           var oFilter = new sap.ui.model.Filter("Value", sap.ui.model.FilterOperator.EQ, sSelectedType);
       
           // Get the section dropdown binding and apply the filter
           var oSectionDropdown = this.byId("idPosition").getBinding("items");
           oSectionDropdown.filter([oFilter]);
       
           // Get the jaw dropdown binding and apply the filter
           var oJawDropdown = this.byId("idDetailedposition").getBinding("items");
           oJawDropdown.filter([oFilter]);
       
           // Get the length dropdown binding and apply the filter
           var oLengthDropdown = this.byId("idDetailedpositionleng").getBinding("items");
           oLengthDropdown.filter([oFilter]);
           // Get the Repair dropdown binding and apply the filter
           var oRepDropdown = this.byId("idDetailedpositionRep").getBinding("items");       // ++added T_singhaG1 23.04.2025 ZshDefRepairCodeSet by Rahul 
           oRepDropdown.filter([oFilter]);
       
       
           // Remove the busy indicator after data is received
           oSectionDropdown.attachDataReceived(function() {
               this.byId("idPosition").setBusy(false);
           }.bind(this));
           
           oJawDropdown.attachDataReceived(function() {
               this.byId("idDetailedposition").setBusy(false);
           }.bind(this));
           
           oLengthDropdown.attachDataReceived(function() {
               this.byId("idDetailedpositionleng").setBusy(false);
           }.bind(this));
       
           oRepDropdown.attachDataReceived(function() {
               this.byId("idDetailedpositionRep").setBusy(false);
           }.bind(this));
       
       },
       /*
          onTypeChange: function(oEvent) {
           var sSelectedType = oEvent.getSource().getSelectedKey();
           
           // Set busy indicator on dependent dropdowns
           this._setBusyComboBoxes(["idPosition", "idDetailedposition", "idDetailedpositionleng", "idDetailedpositionRep"], true);
       
           // Reset Section, Jaw, and Length dropdowns
           this._resetComboBoxes(["idPosition", "idDetailedposition", "idDetailedpositionleng", "idDetailedpositionRep"]);
       
           // Filter Section ComboBox based on selected Type
           var oSectionComboBox = this.byId("idPosition");
           var oBinding = oSectionComboBox.getBinding("items");
           var oFilter = new sap.ui.model.Filter("Value", sap.ui.model.FilterOperator.EQ, sSelectedType);
       
           // Apply filter and handle busy indicator
           oBinding.filter([oFilter], "Application").attachEventOnce("dataReceived", function() {
               // Turn off the busy indicator once the data is received
               this._setBusyComboBoxes(["idPosition"], false);
           }.bind(this));
       },
       
       onPositionChange: function(oEvent) {
           var sSelectedSection = oEvent.getSource().getSelectedKey();
           
           // Set busy indicator on dependent dropdowns
           this._setBusyComboBoxes(["idDetailedposition", "idDetailedpositionleng", "idDetailedpositionRep"], true);
       
           // Reset Jaw and Length dropdowns
           this._resetComboBoxes(["idDetailedposition", "idDetailedpositionleng", "idDetailedpositionRep"]);
       
           // Filter Jaw ComboBox based on selected Section
           var oJawComboBox = this.byId("idDetailedposition");
           var oBinding = oJawComboBox.getBinding("items");
           var oFilter = new sap.ui.model.Filter("Value", sap.ui.model.FilterOperator.EQ, sSelectedSection);
       
           // Apply filter and handle busy indicator
           oBinding.filter([oFilter], "Application").attachEventOnce("dataReceived", function() {
               // Turn off the busy indicator once the data is received
               this._setBusyComboBoxes(["idDetailedposition"], false);
           }.bind(this));
       },
       
       onJawChange: function(oEvent) {
           var sSelectedJaw = oEvent.getSource().getSelectedKey();
           
           // Set busy indicator on Length dropdown
           this._setBusyComboBoxes(["idDetailedpositionleng", "idDetailedpositionRep"], true);
       
           // Reset Length dropdown
           this._resetComboBoxes(["idDetailedpositionleng", "idDetailedpositionRep"]);
       
           // Filter Length ComboBox based on selected Jaw
           var oLengthComboBox = this.byId("idDetailedpositionleng");
           var oBinding = oLengthComboBox.getBinding("items");
           var oFilter = new sap.ui.model.Filter("Value", sap.ui.model.FilterOperator.EQ, sSelectedJaw);
       
           // Apply filter and handle busy indicator
           oBinding.filter([oFilter], "Application").attachEventOnce("dataReceived", function() {
               // Turn off the busy indicator once the data is received
               this._setBusyComboBoxes(["idDetailedpositionleng"], false);
           }.bind(this));
       },
       onLengthChange: function(oEvent) {
           var sSelectedLen = oEvent.getSource().getSelectedKey();
           
           // Set busy indicator on Length dropdown
           this._setBusyComboBoxes(["idDetailedpositionleng", "idDetailedpositionRep"], true);
       
           // Reset Length dropdown
           this._resetComboBoxes(["idDetailedpositionleng", "idDetailedpositionRep"]);
       
           // Filter Length ComboBox based on selected length
           var oLengthComboBox = this.byId("idDetailedpositionRep");
           var oBinding = oLengthComboBox.getBinding("items");
           var oFilter = new sap.ui.model.Filter("Value", sap.ui.model.FilterOperator.EQ, sSelectedJaw);
       
           // Apply filter and handle busy indicator
           oBinding.filter([oFilter], "Application").attachEventOnce("dataReceived", function() {
               // Turn off the busy indicator once the data is received
               this._setBusyComboBoxes(["idDetailedpositionRep"], false);
           }.bind(this));
       },
       
       // Helper function to reset ComboBoxes
       _resetComboBoxes: function(aIds) {
           aIds.forEach(function(sId) {
               var oComboBox = this.byId(sId);
               if (oComboBox) {
                   oComboBox.setSelectedKey(""); // Clear selection
                   oComboBox.getBinding("items").filter([]); // Reset filter
               }
           }, this);
       },
       
       // Helper function to set busy indicator for ComboBoxes
       _setBusyComboBoxes: function(aIds, bBusy) {
           aIds.forEach(function(sId) {
               var oComboBox = this.byId(sId);
               if (oComboBox) {
                   oComboBox.setBusy(bBusy); // Set or clear busy state
               }
           }, this);
       },
       */ //Commented as sequential entry not needed.
       onFilterTable: function(sBarNbr) {
           // Get the input value from the Input field for BAR_NBR
           //var sBarNbr = this.byId("barNbrInput").getValue();
           
           // Create an array of filters
           var aFilters = [];
       
           // If there is a value in the input, add the filter for BAR_NBR
           if (sBarNbr) {
               var oFilter = new sap.ui.model.Filter("BAR_NBR", sap.ui.model.FilterOperator.EQ, sBarNbr);
               aFilters.push(oFilter);
           }else{
               var oFilter = new sap.ui.model.Filter("BAR_NBR", sap.ui.model.FilterOperator.EQ, '0000000');
               aFilters.push(oFilter);
           }
       
           // Get the table and its binding
           var oTable = this.byId("barDefectsTable");
           var oBinding = oTable.getBinding("items");
       
           // Apply the filter to the binding
           oBinding.filter(aFilters);
       
           // Optionally show a busy indicator while the filter is being applied
           oTable.setBusy(true);
           
           // Once the data is loaded, remove the busy indicator
           oBinding.attachDataReceived(function() {
               oTable.setBusy(false);
           });
       },
       
       onNew:function(){
           var sBarNbr = this.byId("barcodeInput").getValue();
            // // Validate the inputs before making the POST request
          if (!sBarNbr) {
                MessageBox.error("Please Scan Barcode Before Processing!");
               return;
            }
            this._wizard.validateStep(true);
           this._wizard.nextStep();
       
       },
       onRemove:function(){
        var oTable = this.byId("barDefectsTable");
       // oTable.setMode("MultiSelect");
       // oTable.setMultiSelectMode();
       if(!oTable.getSelectedItem()){
           sap.m.MessageToast.show(this.fntranslate("Msg4"))
       } else {
       this.fnRemove();
       }
       
       },
       /// to remove the defects
       fnRemove :function(){
           var oView = this.getView();
       
           // Get the data from the view or model
           var sBarNbr = oView.byId("barcodeInput").getValue();
           // var sType = oView.byId("idType").getSelectedKey();
           // var sPos_Sec = oView.byId("idPosition").getSelectedKey();
           // var sPos_Jaw = oView.byId("idDetailedposition").getSelectedKey();
           // var sPos_Len = oView.byId("idDetailedpositionleng").getSelectedKey();
       
           // // Validate the inputs before making the POST request
           // if (!sBarNbr || !sType || !sPos_Sec || !sPos_Jaw || !sPos_Len) {
           //     MessageBox.error("Please fill in all required fields.");
           //     return;
           // }
            // Get the reference to the table
            var oTable = this.byId("barDefectsTable");
       
            // Get the selected items
            var aSelectedItems = oTable.getSelectedItems();
        
            // Check if any items are selected
            if (aSelectedItems.length === 0) {
                sap.m.MessageToast.show("No items selected");
                return;
            }
        
            // Loop through the selected items and get their data
            var aSelectedObjects = aSelectedItems.map(function(oItem) {
                // Get the binding context of the item and use `getObject` to get the data
                return oItem.getBindingContext().getObject();
            });
        
            // Log the selected objects or process them further as needed
            console.log(aSelectedObjects);
        
            // Display a MessageToast showing the selected BAR_NBR values (just as an example)
            var atype = aSelectedObjects.map(function(oData) {
                return oData.Type;
            });
            var aPos_Sec = aSelectedObjects.map(function(oData) {
               return oData.Pos_Sec;
           });
           var aPos_Jaw = aSelectedObjects.map(function(oData) {
               return oData.Pos_Jaw;
           });
           var aPos_Len = aSelectedObjects.map(function(oData) {
               return oData.Pos_Len;
           });
           var aPos_Rep = aSelectedObjects.map(function(oData) {
               return oData.Pos_Rep;
           });
           var aPos_Mit = aSelectedObjects.map(function(oData) {
               return oData.Pos_Mit;
           });
           // sap.m.MessageToast.show("Selected BAR_NBRs: " + aBarNbrs.join(", "));
       
           // Prepare the data payload
           var oPayload = {
               BAR_NBR: sBarNbr,
               Type: atype.join(","),
               Pos_Sec: aPos_Sec.join(","),
               Pos_Jaw: aPos_Jaw.join(","),
               Pos_Len: aPos_Len.join(","),
               Pos_Rep: aPos_Rep.join(","),
               Pos_Mit: aPos_Mit.join(","),
               contrem : this.getContremValue()
               
              
           };
       
           // Get the OData model
           var oModel = oView.getModel();
       
           // Show a busy indicator while the request is being processed
           sap.ui.core.BusyIndicator.show(0);
           var that = this;
           // Make the OData POST request
           oModel.update("/recordDefectSet('" + sBarNbr + "')", oPayload, {
               success: function (oData, response) {
                   // Hide the busy indicator
                   sap.ui.core.BusyIndicator.hide();
       
                   // Show success message
                   // that.onSuccessMessageBoxPress("Removing the Defects was successful!");
                   MessageBox.success(that.fntranslate("Msg3"));
                   that.onFilterTable(sBarNbr);
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
       onConfirm :function(){
           var oView = this.getView();
       
           // Get the data from the view or model
           var sBarNbr = oView.byId("barcodeInput").getValue();
           var sType = oView.byId("idType").getSelectedKey();
           var sPos_Sec = oView.byId("idPosition").getSelectedKey();
           var sPos_Jaw = oView.byId("idDetailedposition").getSelectedKey();
           var sPos_Len = oView.byId("idDetailedpositionleng").getSelectedKey();
           var sPos_Rep = oView.byId("idDetailedpositionRep").getSelectedKey();
           var sMit = oView.byId("idMIT").getValue();
       
            //Validate the inputs before making the POST request
          // if (!sBarNbr || !sType || !sPos_Sec || !sPos_Jaw || !sPos_Len || !sPos_Rep || !sMit) {
           if ( !sType  ){
               MessageBox.error(this.fntranslate("Msg2"));
                return;
            }
       
           // Prepare the data payload
           var oPayload = {
               BAR_NBR: sBarNbr,
               Type: sType,
               Pos_Sec: sPos_Sec,
               Pos_Jaw: sPos_Jaw,
               Pos_Len: sPos_Len,
               Pos_Rep : sPos_Rep,
               Pos_Mit : sMit,
               contrem : this.getContremValue()
               
           };
       
           // Get the OData model
           var oModel = oView.getModel();
       
           // Show a busy indicator while the request is being processed
           sap.ui.core.BusyIndicator.show(0);
           var that = this;
           // Make the OData POST request
           oModel.create("/recordDefectSet", oPayload, {
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
       onSuccessMessageBoxPress: function (msg) {
           var that = this;
           MessageBox.success(msg, {
               actions: [that.fntranslate("Start_over"), that.fntranslate("Exit")],
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
       onErrorMessageBoxPress: function (msg) {
           var that = this;
           MessageBox.error(msg, {
               actions: [that.fntranslate("Start_over"), that.fntranslate("Exit")],
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
           this._resetStep2Fields();
           //this._disableStep2Fields(true);
           // this.getView().byId("confirmPrint").setSelected(false);
           // this.byId("Step1").setValidated(false);
           // this.byId("Step2").setValidated(false);
         
       },
       _resetStep2Fields: function () {
           var oView = this.getView();
       
           // Reset all fields in Step1
           oView.byId("idType").setSelectedKey(null);
           oView.byId("idPosition").setSelectedKey(null);
           oView.byId("idDetailedposition").setSelectedKey(null);
           // oView.byId("barcodeInput").setValue("");
           oView.byId("barcodeInput").setEditable(false);
           oView.byId("idMIT").setValue("");
           oView.byId("idDetailedpositionleng").setSelectedKey(null);
           oView.byId("idDetailedpositionRep").setSelectedKey(null);
           this.onFilterTable(oView.byId("barcodeInput").getValue());
       
       },
       onInfoPress: function () {
           MessageBox.information("Press Enter to Add more Barcodes.");
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
      onSchemaPress: function () {
        if (!this._oSchemaDialog) {
          var isMobile = sap.ui.Device.system.phone || sap.ui.Device.system.tablet;
      
          var createZoomableImage = function (src) {
            var oImage = new sap.m.Image({
              src: src,
              width: isMobile ? "100%" : "auto",
              height: isMobile ? "auto" : "auto",
              densityAware: false,
              press: function () {
                this.setWidth(isMobile ? "100%" : "auto");
                this.setHeight("auto");
              },
              customData: [
                new sap.ui.core.CustomData({
                  key: "style",
                  value: isMobile
                    ? "display: block; max-width: 100%; height: auto; margin: auto;"
                    : "display: block; max-width: 100%; max-height: 100%; margin: auto;"
                })
              ]
            });
      
            return new sap.m.ScrollContainer({
              vertical: true,
              horizontal: true,
              content: [oImage],
              width: "100%",
              height: "100%"
            });
          };
      
          var oCarousel = new sap.m.Carousel({
            pages: [
              createZoomableImage(sap.ui.require.toUrl("com/ami/zupdatedefect/images/schema1.png")),
              createZoomableImage(sap.ui.require.toUrl("com/ami/zupdatedefect/images/schema2.png"))
            ]
          });
      
          this._bSchemaFullScreen = false;
      
          this._oSchemaDialog = new sap.m.Dialog({
            title: "Schema",
            contentWidth: isMobile ? "100%" : "80%",
            contentHeight: isMobile ? "100%" : "80%",
            stretch: isMobile,
            content: [oCarousel],
            buttons: [
              new sap.m.Button({
                icon: "sap-icon://full-screen",
                tooltip: "Toggle Full Screen",
                press: function (oEvent) {
                  this._bSchemaFullScreen = !this._bSchemaFullScreen;
      
                  if (this._bSchemaFullScreen) {
                    this._oSchemaDialog.setStretch(true);
                    this._oSchemaDialog.setContentWidth("100%");
                    this._oSchemaDialog.setContentHeight("100%");
                    oEvent.getSource().setIcon("sap-icon://exit-full-screen");
                  } else {
                    this._oSchemaDialog.setStretch(isMobile);
                    this._oSchemaDialog.setContentWidth(isMobile ? "100%" : "80%");
                    this._oSchemaDialog.setContentHeight(isMobile ? "100%" : "80%");
                    oEvent.getSource().setIcon("sap-icon://full-screen");
                  }
                }.bind(this)
              }),
              new sap.m.Button({
                text: "Close",
                press: function () {
                  this._oSchemaDialog.close();
                }.bind(this)
              })
            ],
            afterClose: function () {
              this._oSchemaDialog.destroy();
              this._oSchemaDialog = null;
            }.bind(this)
          });
        }
      
        this._oSchemaDialog.open();
      }
      
      
      
        });
    });