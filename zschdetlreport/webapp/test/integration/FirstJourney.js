sap.ui.define([
    "sap/ui/test/opaQunit"
], function (opaTest) {
    "use strict";

    var Journey = {
        run: function() {
            QUnit.module("First journey");

            opaTest("Start application", function (Given, When, Then) {
                Given.iStartMyApp();

                Then.onTheZI_SCHEDULINGRUNDETAILEDREPORTList.iSeeThisPage();

            });


            opaTest("Navigate to ObjectPage", function (Given, When, Then) {
                // Note: this test will fail if the ListReport page doesn't show any data
                
                When.onTheZI_SCHEDULINGRUNDETAILEDREPORTList.onFilterBar().iExecuteSearch();
                
                Then.onTheZI_SCHEDULINGRUNDETAILEDREPORTList.onTable().iCheckRows();

                When.onTheZI_SCHEDULINGRUNDETAILEDREPORTList.onTable().iPressRow(0);
                Then.onTheZI_SCHEDULINGRUNDETAILEDREPORTObjectPage.iSeeThisPage();

            });

            opaTest("Teardown", function (Given, When, Then) { 
                // Cleanup
                Given.iTearDownMyApp();
            });
        }
    }

    return Journey;
});