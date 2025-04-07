sap.ui.define([], function() {
    "use strict";
    return { 
        EditObject : function(vEdit) {
            var vEditFlag;
            if (vEdit !== "DE"){
                vEditFlag = false;
            } else {
                vEditFlag = true;                
            }
            return vEditFlag;
        }
    };
});