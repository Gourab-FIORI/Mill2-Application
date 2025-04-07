sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'com.ami.zschdetlreport',
            componentId: 'ZI_SCHEDULINGRUNDETAILEDREPORTList',
            contextPath: '/ZI_SCHEDULINGRUNDETAILEDREPORT'
        },
        CustomPageDefinitions
    );
});