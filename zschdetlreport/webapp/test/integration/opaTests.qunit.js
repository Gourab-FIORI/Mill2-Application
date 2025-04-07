sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'com/ami/zschdetlreport/test/integration/FirstJourney',
		'com/ami/zschdetlreport/test/integration/pages/ZI_SCHEDULINGRUNDETAILEDREPORTList',
		'com/ami/zschdetlreport/test/integration/pages/ZI_SCHEDULINGRUNDETAILEDREPORTObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZI_SCHEDULINGRUNDETAILEDREPORTList, ZI_SCHEDULINGRUNDETAILEDREPORTObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('com/ami/zschdetlreport') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZI_SCHEDULINGRUNDETAILEDREPORTList: ZI_SCHEDULINGRUNDETAILEDREPORTList,
					onTheZI_SCHEDULINGRUNDETAILEDREPORTObjectPage: ZI_SCHEDULINGRUNDETAILEDREPORTObjectPage
                }
            },
            opaJourney.run
        );
    }
);