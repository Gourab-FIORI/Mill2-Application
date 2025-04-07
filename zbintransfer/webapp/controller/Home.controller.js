/***********************************************
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 *          Introduction to Developments        *
 *                                              *
 * -------------------------------------------- *
 * |  Module Name:       | zbintransfer        | *
 * |---------------------|---------------------| *
 * |  Developer Name:    | GOURAB SINGHA,      | *
 * |                     | ANUBHAV MITRA       | *
 * |---------------------|---------------------| *
 * |  Project Manager:   | Manas Mishra        | *
 * |---------------------|---------------------| *
 * |  Component Name:    | com.ami.zbintransfer| *
 * |---------------------|---------------------| *
 * |  Package Name:      | ZMM_AMWS            | *
 * |---------------------|---------------------| *
 * |  Development Date:  | 20.12.2024          | *
 * -------------------------------------------- *
 *                                              *
 * xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
 *                                              *
 * ```
// Introduction to the Bin-to-Bin Transfer Application */

sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast", "sap/m/MessageBox",
    "sap/ui/core/Fragment",
    "sap/ui/core/routing/History", "sap/ui/core/BusyIndicator", "sap/ui/model/resource/ResourceModel", "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",  "sap/ui/comp/valuehelpdialog/ValueHelpDialog" 
], function (Controller, JSONModel, MessageToast, MessageBox,Fragment, History, BusyIndicator, ResourceModel, Filter, FilterOperator,ValueHelpDialog) {
    "use strict";
        var sWerks,sLgort;
    return Controller.extend("com.ami.zbintransfer.controller.Home", {
        onInit: function () {
             // Get the component's startup parameters
             var oComponentData = this.getOwnerComponent().getComponentData();
             var oStartupParameters = oComponentData ? oComponentData.startupParameters : null;
             sLgort='';
             // Retrieve the 'Werks' parameter
             sWerks = oStartupParameters && oStartupParameters.Werks ? oStartupParameters.Werks[0] : null;
             //sWerks="A300";           //it'll be removed as Plant is Dynamically defined with Tile Configs
             // Check if 'Werks' is provided
             if (!sWerks) {
                 // Exit to Fiori Launchpad if 'Werks' is not set
                 MessageToast.show("No plant is set. Redirecting to the Fiori Launchpad...");
                 sap.ushell.Container.getService("CrossApplicationNavigation").toExternal({
                     target: {
                         shellHash: "#"
                     }
                 });
             }else{
               
                MessageToast.show("Deafult Plant is :" + sWerks);
             } 
             // Initialize OData model for the application
            this.oModel = this.getOwnerComponent().getModel(); 
            // Initialize the wizard model
            var oWizardModel = new JSONModel({
                "Bin" : "",
                "BinGroup" : "",
                "Werks" : sWerks,
                "Lgort" : sLgort,
                "TrfBin" : "",
                "TrfBinGroup" : "",
                "NPDOMLIGHT": []
                });
            var sDefaultLanguage = sap.ui.getCore().getConfiguration().getLanguage();
            this._setLanguage(sDefaultLanguage);
            this.getView().setModel(oWizardModel, "wizardModel");
            
        },
        onLanguageChange: function (oEvent) {
            var sSelectedLanguage = oEvent.getParameter("selectedItem").getKey();
            this._setLanguage(sSelectedLanguage);
        },

        _setLanguage: function (sLanguage) {
            var i18nModel = new ResourceModel({
                bundleName: "com.ami.zbintransfer.i18n.i18n",
                bundleLocale: sLanguage
            });
            this.getView().setModel(i18nModel, "i18n");
        },

        onValueHelpRequested: function (oEvent) {
            var sInputValue = oEvent.getSource().getValue(),
                sFragmentName = oEvent.getSource().getCustomData()[0].getValue(),
               
               // sWerks = "A300", // Assuming Werks is from an input field
                sEntitySet, oBinding,
                oInputField = oEvent.getSource(), // Get the input field that triggered the value help
                sInputFieldId = oInputField.getId(); // Dynamically get the ID of the input field
                this.oModel = this.getView().getModel();
            // Show BusyIndicator
            sap.ui.core.BusyIndicator.show(0);

            // Check if the dialog is already created
            if (!this._oValueHelpDialog) {
                this._oValueHelpDialog = {};
            }

            // Create the dialog if it doesn't exist yet
            if (!this._oValueHelpDialog[sFragmentName]) {
                this._oValueHelpDialog[sFragmentName] = sap.ui.xmlfragment(
                    "com.ami.zbintransfer.fragment." + sFragmentName,
                    this
                );
                this.getView().addDependent(this._oValueHelpDialog[sFragmentName]);
            }
            //  Set dynamic entity set name based on a condition
            if (sFragmentName === "BinGroup" || sFragmentName === "TrfBinGroup") {
                sEntitySet = "/GTBINSet";
                //sEntitySet = "/GTBINGROUPSet"; // Change entity set if BinGroup is selected
                oBinding = "binGroupModel";
            } else {
                sEntitySet = "/GTBINSet";
                oBinding = "binModel";
            }
            // Read data from the OData service with a filter for Werks
            this.oModel.read(sEntitySet, {
                filters: [new sap.ui.model.Filter("Werks", sap.ui.model.FilterOperator.EQ, sWerks),new sap.ui.model.Filter("Type", sap.ui.model.FilterOperator.EQ, sFragmentName)],
                success: function (oData) {
                    // Create a named model for Bin data
                    var oBinModel = new sap.ui.model.json.JSONModel(oData.results);

                    // Set the model with the name oBinding
                    this.getView().setModel(oBinModel, oBinding);

                    // Set the model to the SelectDialog and open it
                    var oSelectDialog = this._oValueHelpDialog[sFragmentName];
                    oSelectDialog.setModel(oBinModel, oBinding); // Use the named model
                    oSelectDialog.open();
                    // Store the input field ID for later reference
                    oSelectDialog.data("inputFieldId", sInputFieldId);
                    // Hide BusyIndicator after data is loaded
                    sap.ui.core.BusyIndicator.hide();
                }.bind(this),
                error: function (oError) {
                    // Hide BusyIndicator on error
                    sap.ui.core.BusyIndicator.hide();
                    sap.m.MessageBox.error("Error fetching data");
                }
            });
        },



        onValueHelpSearchB: function (oEvent) {
            var sValue = oEvent.getParameter("value"),
                oFilter = new sap.ui.model.Filter({
                    filters: [
                        new sap.ui.model.Filter("Bin", sap.ui.model.FilterOperator.Contains, sValue)

                    ],
                    and: false
                });

            oEvent.getSource().getBinding("items").filter(oFilter);
        },
        onValueHelpSearchBG: function (oEvent) {
            var sValue = oEvent.getParameter("value"),
                oFilter = new sap.ui.model.Filter({
                    filters: [

                        new sap.ui.model.Filter("BinGroup", sap.ui.model.FilterOperator.Contains, sValue)
                    ],
                    and: false
                });

            oEvent.getSource().getBinding("items").filter(oFilter);
        },
        // To search for 'Bin Group' first, then 'Bin'
        identifyBinOrBinGroup:function(inputString) {
            // Define the regular expressions to search for 'Bin Group' first, then 'Bin'
            var regexBinGroup = /\bSource Bin Group\b/i;
            var regexBin = /\bSource Bin\b/i;
            var TregexBinGroup = /\bTransfer Bin Group\b/i;
            var TregexBin = /\bTransfer Bin\b/i;
        
            // Check for 'Bin Group' first
            if (regexBinGroup.test(inputString)) {
                return "BinGroup";
            }
        
            // Check for 'Bin' if 'Bin Group' is not found
            else if (regexBin.test(inputString)) {
                return "Bin";
            }
             // Check for 'Bin Group' first
            else if (TregexBinGroup.test(inputString)) {
                return "TrfBinGroup";
            }
        
            // Check for 'Bin' if 'Bin Group' is not found
            else if (TregexBin.test(inputString)) {
                return "TrfBin";
            }
        
            // Return null if neither is found
            return null;
        },

        onValueHelpClose: function (oEvent) {
            var oSelectedItem = oEvent.getParameter("selectedItem");

            if (oSelectedItem) {
                // Get the value from the selected item
                var sSelectedBin = oSelectedItem.getTitle(); // Assuming 'Bin' is the title
                var oSelectDialog = oEvent.getSource();
                var sType = this.identifyBinOrBinGroup(oSelectDialog.getTitle());
               
                // Retrieve the dynamically stored input field ID
                var sInputFieldId = oSelectDialog.data("inputFieldId");
                var oInputField = this.getView().byId(sInputFieldId); // Dynamically find the input field
                this._checkBinUniqueness(sType,sSelectedBin,sWerks,oInputField);
                // if (oInputField) {
                //     // Set the selected value to the input field
                //     oInputField.setValue(sSelectedBin);
                // }
            }
        },
        onInputPreventChange: function (oEvent) {
            // Clear any manual input
            oEvent.getSource().setValue("");
            sap.m.MessageToast.show("Manual input is not allowed. Please use the value help.");
        },
        _checkBinUniqueness: function (sType,sBin, sWerks,oInputField) {
            // Path to check Bin uniqueness
            const sPath = `/GTBINSet(Type='${sType}',Werks='${sWerks}')`;
            const aFilters = [new Filter(sType, FilterOperator.EQ, sBin)];
            if(sType === 'TrfBinGroup' || sType === 'TrfBin'){
                aFilters.push(new Filter('Lgort', FilterOperator.EQ, sLgort));
            }
            var that=this;
                 // Show BusyIndicator
            sap.ui.core.BusyIndicator.show(0);
            this.oModel.read(sPath, {
                filters: aFilters,
                success: (oData) => {
                     // Hide BusyIndicator on error
                     sap.ui.core.BusyIndicator.hide();
                     if(sType === 'TrfBinGroup' || sType === 'TrfBin'){
                                            
                        that.getView().getModel("wizardModel").setProperty("/TrfBin",oData.TrfBin);
                        that.getView().getModel("wizardModel").setProperty("/TrfBinGroup",oData.TrfBinGroup);
                        return;
                       }
                    if (oData.IsUnique === false) {
                        // Open secondary Value Help for storage location
                        that.getView().getModel("wizardModel").setProperty("/" + sType,oData[sType]);
                        that.getView().getModel("wizardModel").setProperty("/BinGroup",oData.Bingroup);
                        that._openStorageLocationValueHelp(sWerks,oData.Bin);
                    } else {
                         // Hide BusyIndicator on error
                        sap.ui.core.BusyIndicator.hide();
                        //MessageBox.success(`Bin ${sBin} is unique.`);
                        sLgort=oData.Lgort;
                         if(sType === 'BinGroup' || sType === 'Bin'){
                        that.getView().getModel("wizardModel").setProperty("/Lgort",sLgort);
                        that.getView().getModel("wizardModel").setProperty("/Bin",oData.Bin);
                        that.getView().getModel("wizardModel").setProperty("/BinGroup",oData.BinGroup);
                       }
                      
                //     if (oInputField) {
                //     // Set the selected value to the input field
                //     oInputField.setValue(oData.Bin);
                // }
                       // that.getView().getModel("wizardModel").setProperty("/Bin",oData.Bin);
                       // that.getView().getModel("wizardModel").setProperty("/BinGroup",oData.BinGroup);
                    }   
                },
                error: (oError) => {
                    MessageBox.error("Failed to check Bin uniqueness");
                }
            });
        },

        _openStorageLocationValueHelp: function (sWerks,sBin) {
            // Create Value Help Dialog for storage locations
            var that =this;
            const oValueHelpDialog = new ValueHelpDialog({
                title: "Select Storage Location",
                supportMultiselect: false,
                key: "Lgort",
                descriptionKey: "Bin",
                ok: (oEvent) => {
                    const aTokens = oEvent.getParameter("tokens");
                    if (aTokens.length) {
                        const sSelectedLgort = aTokens[0].getKey();
                        sLgort=sSelectedLgort;
                        that.getView().getModel("wizardModel").setProperty("/Lgort",sLgort);
                        MessageBox.success(`Selected Storage Location: ${sSelectedLgort}`);
                    }
                    oValueHelpDialog.close();
                },
                cancel: () => oValueHelpDialog.close()
            });

            // Fetch Storage Location data from OData service
              // Show BusyIndicator
              sap.ui.core.BusyIndicator.show(0);
            this.oModel.read("/GTBINSet", {
                filters: [
                    new Filter("Type", FilterOperator.EQ, "BinLgort"),
                    new Filter("Werks", FilterOperator.EQ, sWerks),
                    new Filter("Bin", FilterOperator.EQ, sBin)
                ],
                success: (oData) => {
              // Prepare JSON model for the fetched data
              // Hide BusyIndicator on error
              sap.ui.core.BusyIndicator.hide();
            const oDataModel = new sap.ui.model.json.JSONModel(oData.results);

            // Set the model to the Value Help Dialog
            oValueHelpDialog.setModel(oDataModel);

            // Define the table columns for the Value Help Dialog
            oValueHelpDialog.getTable().setModel(oDataModel);
            //oValueHelpDialog.getTable().bindRows("/");

            // Configure the table's column headers and cell bindings
            const oTable = oValueHelpDialog.getTable();
            if (oTable.bindItems) {
                // For sap.m.Table
                oTable.addColumn(new sap.m.Column({
                    header: new sap.m.Text({ text: "Bin" })
                }));
                oTable.addColumn(new sap.m.Column({
                    header: new sap.m.Text({ text: "Storage Location" })
                }));

                oTable.bindItems("/", new sap.m.ColumnListItem({
                    cells: [
                        new sap.m.Text({ text: "{Bin}" }),
                        new sap.m.Text({ text: "{Lgort}" })
                    ]
                }));
            } else if (oTable.bindRows) {
                // For sap.ui.table.Table
                oTable.addColumn(new sap.ui.table.Column({
                    label: new sap.m.Label({ text: "Bin" }),
                    template: new sap.m.Text({ text: "{Bin}" }),
                    sortProperty: "Bin",
                    filterProperty: "Bin"
                }));
                oTable.addColumn(new sap.ui.table.Column({
                    label: new sap.m.Label({ text: "Storage Location" }),
                    template: new sap.m.Text({ text: "{Lgort}" }),
                    sortProperty: "Lgort",
                    filterProperty: "Lgort"
                }));
                oTable.bindRows("/");
            }

            oValueHelpDialog.open();
                },
                error: (oError) => {
                    // Hide BusyIndicator on error
                    sap.ui.core.BusyIndicator.hide();
                    MessageBox.error("Failed to fetch Storage Location data");
                }
            });
        },
        //Load table data after Bin Selections
        onStep2Press: function () {
            // Get the wizard model and table reference
            var oModel = this.getView().getModel("wizardModel");
            var sBin = oModel.getProperty("/Bin");
            var oTable = this.getView().byId("itemTable");

            // Define filters
            var oFilters = [
                new Filter("Werks", FilterOperator.EQ, sWerks), // Replace with dynamic value
                new Filter("Lgort", FilterOperator.EQ, sLgort), // Replace with dynamic value
                new Filter("Bin", FilterOperator.EQ, sBin)   // Replace with dynamic value
            ];
              // Show BusyIndicator
              sap.ui.core.BusyIndicator.show(0);
            // Make an OData call to fetch data
       //     this.oModel.read("/GTBINSTOCKSet", {              //++ Hiren chnaged the entity set
                this.oModel.read("/GTWMLIGHTLINESet", {
                filters: oFilters,
                success: function (oData) {
                     // Hide BusyIndicator on error
                     sap.ui.core.BusyIndicator.hide();
                    // Bind data to the table
                    oModel.setProperty("/NPDOMLIGHT", oData.results);
                    MessageToast.show("Data fetched successfully for Step 2!");
                },
                error: function (oError) {
                     // Hide BusyIndicator on error
                     sap.ui.core.BusyIndicator.hide();
                    MessageToast.show("Error fetching data for Step 2.");
                    console.error(oError);
                }
            });
        },
        onCheckAllPress: function () {
            // Select all items in the table
            var oTable = this.byId("itemTable");
            oTable.selectAll();
        },

        onUncheckAllPress: function () {
            // Deselect all items in the table
            var oTable = this.byId("itemTable");
            oTable.removeSelections(true);
        },
        onItemSelectionChange: function (oEvent) {
            // Optional: handle individual item selection change
            var oSelectedItem = oEvent.getParameter("listItem");
            var bSelected = oEvent.getParameter("selected");
            console.log("Item selected: ", oSelectedItem.getBindingContext("wizardModel").getObject(), "Selected: ", bSelected);
        },
        onItemSelectionChange1: function (oEvent) {
            var aSelectedContexts = oEvent.getSource().getSelectedContexts(),
                aSelectedItems = aSelectedContexts.map(function (oContext) {
                    return oContext.getObject();
                });

            this.getView().getModel("wizardModel").setProperty("/selectedItems", aSelectedItems);
        },

        onTransfer: function () {
             // Get the table control
             var oTable = this.byId("itemTable");

             // Get the selected items
             var aSelectedItems = oTable.getSelectedItems();
 
             // Prepare an array to hold the selected data
             var aSelectedData = [];
 
             // Iterate over the selected items
             aSelectedItems.forEach(function (oItem) {
                 // Get the binding context of the selected item
                 var oContext = oItem.getBindingContext("wizardModel");
 
                 // If context exists, get the object data
                 if (oContext) {
                     aSelectedData.push(oContext.getObject());
                 }
             });
            var oWizardData = this.getView().getModel("wizardModel").getData();
            oWizardData.NPDOMLIGHT=aSelectedData;

            if (!oWizardData.Bin || !oWizardData.TrfBin || oWizardData.NPDOMLIGHT.length === 0) {
                MessageBox.error(this.getView().getModel("i18n").getResourceBundle().getText("transferError"));
                return;
            }

            BusyIndicator.show(0);
            var that = this;
            this.oModel.create("/GHWMLIGHTHEADERSet", oWizardData, {
                success: function (oData,oResponse) {
                    BusyIndicator.hide();
                     // Step 2: Access the response headers
    var headers = oResponse.headers;
    var message = headers["sap-message"]; // This header contains the OData messages

    if (message) {
      // Step 3: Parse the message (if needed)
      var parsedMessage = JSON.parse(message);
      console.log("Message Details:", parsedMessage);

      // Step 4: Display the message to the user
      that.onSuccessMessageBoxPress(parsedMessage.message);
    } else {
      console.log("No messages in the response headers.");
    }
                 
                       // MessageBox.success("Bin to Bin Transfer Successfull.");
                   
                    
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
    this.resetWizard();
    var oCrossAppNav = sap.ushell.Container.getService("CrossApplicationNavigation");
    oCrossAppNav.toExternal({
        target: { shellHash: "#" } // Navigate to the Fiori Launchpad home
    });
},

// // Reset to the first step
// resetWizard: function () {
//     this.resetWizard();
//      //var wizard = this.getView().byId("wizard");

//     // // Reset wizard steps
//      //wizard.setCurrentStep(wizard.getSteps()[0]);
//     // this.onClearAll();
//     // this.toggleVisibility();
// },


        onNavBack: function () {
            var oHistory = History.getInstance();
            var sPreviousHash = oHistory.getPreviousHash();

            if (sPreviousHash !== undefined) {
                window.history.go(-1);
            } else {
                sap.ui.core.UIComponent.getRouterFor(this).navTo("home", {}, true);
            }
        },
        resetWizard: function () {
            // Get a reference to the wizard model
            var oModel = this.getView().getModel("wizardModel");
        
            // Reset all model data to null
            oModel.setData({
                Werks: sWerks,
                Lgort: "",
                Bin: "",
                BinGroup: "",
                NPDOMLIGHT: [], // Clear the table data
                TrfBin: "",
                TrfBinGroup: ""
            });
        
            // Reset table selections
            var oTable = this.byId("itemTable");
            if (oTable) {
                oTable.removeSelections(true);
            }
        
            // Reset wizard to the first step
            var oWizard = this.byId("wizard");
            if (oWizard) {
                oWizard.discardProgress(oWizard.getSteps()[0]);
            }
            
            sap.m.MessageToast.show("Wizard reset successfully.");
        }
        
    });
});