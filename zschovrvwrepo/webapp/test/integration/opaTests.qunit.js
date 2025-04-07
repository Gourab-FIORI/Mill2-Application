sap.ui.require(
    [
        'sap/fe/test/JourneyRunner',
        'com/ami/zschovrvwrepo/test/integration/FirstJourney',
		'com/ami/zschovrvwrepo/test/integration/pages/ZI_SCHEDULINGRUNOVERVIEWREPORTList',
		'com/ami/zschovrvwrepo/test/integration/pages/ZI_SCHEDULINGRUNOVERVIEWREPORTObjectPage'
    ],
    function(JourneyRunner, opaJourney, ZI_SCHEDULINGRUNOVERVIEWREPORTList, ZI_SCHEDULINGRUNOVERVIEWREPORTObjectPage) {
        'use strict';
        var JourneyRunner = new JourneyRunner({
            // start index.html in web folder
            launchUrl: sap.ui.require.toUrl('com/ami/zschovrvwrepo') + '/index.html'
        });

       
        JourneyRunner.run(
            {
                pages: { 
					onTheZI_SCHEDULINGRUNOVERVIEWREPORTList: ZI_SCHEDULINGRUNOVERVIEWREPORTList,
					onTheZI_SCHEDULINGRUNOVERVIEWREPORTObjectPage: ZI_SCHEDULINGRUNOVERVIEWREPORTObjectPage
                }
            },
            opaJourney.run
        );
    }
);