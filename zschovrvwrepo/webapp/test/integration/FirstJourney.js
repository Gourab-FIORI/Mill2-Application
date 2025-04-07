sap.ui.define([
    "sap/ui/test/opaQunit"
], function (opaTest) {
    "use strict";

    var Journey = {
        run: function() {
            QUnit.module("First journey");

            opaTest("Start application", function (Given, When, Then) {
                Given.iStartMyApp();

                Then.onTheZI_SCHEDULINGRUNOVERVIEWREPORTList.iSeeThisPage();

            });


            opaTest("Navigate to ObjectPage", function (Given, When, Then) {
                // Note: this test will fail if the ListReport page doesn't show any data
                
                When.onTheZI_SCHEDULINGRUNOVERVIEWREPORTList.onFilterBar().iExecuteSearch();
                
                Then.onTheZI_SCHEDULINGRUNOVERVIEWREPORTList.onTable().iCheckRows();

                When.onTheZI_SCHEDULINGRUNOVERVIEWREPORTList.onTable().iPressRow(0);
                Then.onTheZI_SCHEDULINGRUNOVERVIEWREPORTObjectPage.iSeeThisPage();

            });

            opaTest("Teardown", function (Given, When, Then) { 
                // Cleanup
                Given.iTearDownMyApp();
            });
        }
    }

    return Journey;
});