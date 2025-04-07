sap.ui.define(['sap/fe/test/ObjectPage'], function(ObjectPage) {
    'use strict';

    var CustomPageDefinitions = {
        actions: {},
        assertions: {}
    };

    return new ObjectPage(
        {
            appId: 'com.ami.zschovrvwrepo',
            componentId: 'ZI_SCHEDULINGRUNOVERVIEWREPORTObjectPage',
            contextPath: '/ZI_SCHEDULINGRUNOVERVIEWREPORT'
        },
        CustomPageDefinitions
    );
});