sap.ui.define(['sap/fe/test/ListReport'], function(ListReport) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ListReport(
        {
            appId: 'com.ami.zschovrvwrepo',
            componentId: 'ZI_SCHEDULINGRUNOVERVIEWREPORTList',
            contextPath: '/ZI_SCHEDULINGRUNOVERVIEWREPORT'
        },
        CustomPageDefinitions
    );
});