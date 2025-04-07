sap.ui.define([
	"sap/ui/core/mvc/Controller",
	"sap/ui/model/json/JSONModel",
	"sap/m/MessageBox",
	"sap/m/TablePersoController",
	"./DemoPersoService",
	"GoodReceipt/Js/jspdf.min",
	"GoodReceipt/Js/jspdf.plugin.autotable",
	"GoodReceipt/Js/FileSaver",
	"GoodReceipt/Js/jquery.cookie"
], function (Controller, JSONModel, MessageBox, TablePersoController, DemoPersoService, jspdf, Autotable, FileSaver,
	Jcookie) {
	"use strict";
	var _that, displayFlag, displayMode, selectedIndex;
	return Controller.extend("GoodReceipt.controller.GoodReceiptDetails", {
		onInit: function () {
			_that = this;
			var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
			_that.oComponent = sap.ui.component(sComponentId);
			var oStartupParameters = _that.oComponent.getComponentData().startupParameters;

			_that.clnt = oStartupParameters["SYSALIAS "][0].split("\"")[1];
			// Begin of changes for DF#762 for Latchford by PANIGRAHIG
			if (_that.clnt === undefined) {
				_that.clnt = oStartupParameters["SYSALIAS "][0];
			}
			// End of changes for DF#762 for Latchford by PANIGRAHIG

			//-----DISPLAY MDOE---------START---
			var appModeIndex = sComponentId.indexOf("-display-");
			if (appModeIndex > -1) {
				displayMode = true;
				_that.getView().byId("goodPage").setTitle("Goods Receipt - Display");
			} else {
				displayMode = false;
				_that.getView().byId("goodPage").setTitle("Goods Receipt - Change");
			}
			//-----DISPLAY MDOE---------END---
			if (_that.clnt === undefined || _that.clnt === "") {
				_that.sServiceUrl = "/sap/opu/odata/sap/ZP2S_METALRECEIVING_SRV";
			} else {
				_that.sServiceUrl = "/sap/opu/odata/sap/ZP2S_METALRECEIVING_SRV;o=" + _that.clnt + "/";
			}
			this._setDefaultData();
			_that.IPrinterPlants = ["4211"];
			_that.OLatchFordPlant = ["4211"]; //changes by Sri for Latchford
			this._TableSettiing();
			this._TableDetailSetting();
			this.getView().byId("inputRefId").attachBrowserEvent("keypress", function (e) {
				if (e.which === 13) {
					_that.onGoodReceipt();
				}
			});
			this.getView().byId("datePicker1").attachBrowserEvent("keypress", function (e) {
				if (e.which === 13) {
					_that.onGoodReceipt();
				}
			});
			this.getView().byId("inputPlant").attachBrowserEvent("keypress", function (e) {
				if (e.which === 13) {
					_that.onGoodReceipt();
				}
			});
			// Begin of changes for DF#762 for Latchford by PANIGRAHIG
			if (_that.getOwnerComponent().getComponentData().startupParameters.RefId === undefined) {
				_that.flagNav = "";
			} else {
				_that.flagNav = "X";
			}
			// End of changes for DF#762 for Latchford by PANIGRAHIG
			_that.getView().byId("idGoodReceiptHeaderTable").onAfterRendering = function () {
				if (_that.getOwnerComponent().getComponentData().startupParameters.RefId) {
					_that.onTableRowSelection();
				}
			};
			var flag = true;
			// End of changes for DF#762 for Latchford by PANIGRAHIG
		},
		getMyComponent: function () {
			var sComponentId = sap.ui.core.Component.getOwnerIdFor(this.getView());
			return sap.ui.component(sComponentId);
		},
		_setDescription: function () {
			// var plant = _that.getView().byId("inputPlant").getValue();
			// var locDesc = _that.getView().byId("txtLoc");
			// if (plant === "") {
			// 	locDesc.setText("");
			// }
			// var oPlantModel = _that.getView().getModel("oPlantModel");
			// for (var i = 0; i < oPlantModel.getData().length; i++) {
			// 	if (oPlantModel.getData()[i].Plant === plant) {
			// 		locDesc.setText(oPlantModel.getData()[i].Name1);
			// 	}
			// }
			// Begin of change for Sri Latchford changes			
			var plant = _that.getView().byId("inputPlant").getValue();
			if (_that.OLatchFordPlant.indexOf(plant) !== -1) {
				_that.getView().byId("lblPw").setText("Anex7:");
			} else {
				_that.getView().byId("lblPw").setText("Paper Work:");
			}
			var locDesc = _that.getView().byId("txtLoc");
			if (plant === "") {
				locDesc.setText("");
			} else {
				var oPlantModel = _that.getView().getModel("oPlantModel");
				for (var i = 0; i < oPlantModel.getData().length; i++) {
					if (oPlantModel.getData()[i].Plant === plant) {
						locDesc.setText(oPlantModel.getData()[i].Name1);
					}
				}
			}
			// End of change for Sri Latchford changes					
		},
		onPlantChange: function () {
			this._setDescription();
		},
		_setDefaultData: function () {
			var oReadModel = new sap.ui.model.odata.ODataModel(_that.sServiceUrl);
			var URL = "/OnLoadSet('')?$expand=NavPlant";
			oReadModel.read(URL, null, null, true,
				function (oData) {
					if (oData) {
						var defaultModel = new JSONModel();
						defaultModel.setData(oData);
						_that.getView().byId("mainForm").setModel(defaultModel, "goodModel");
						_that.datePattern = oData.EPattern;
						var oPlantModel = new JSONModel();
						oPlantModel.setData(oData.NavPlant.results);
						_that.getView().setModel(oPlantModel, "oPlantModel");
						// changes starts from goodReceiptNav
						_that._setDescription();
						// var locDesc = _that.getView().byId("txtLoc");
						// for (var i = 0; i < oData.NavPlant.results.length; i++) {
						// 	if (oData.NavPlant.results[i].Plant === oData.EPlant) {
						// 		locDesc.setText(oData.NavPlant.results[i].Name1);
						// 	}
						// }
						// changes Ends from goodReceiptNav
					}
					var temp = oData.EPattern.replace(/D/gi, "d");
					var dateModel = new JSONModel();
					dateModel.setData({
						dateValueDRS1: new Date(),
						dateFormatDRS1: temp
					});
					_that.getView().byId("datePicker1").setModel(dateModel);
					// changes starts from goodReceiptNav
					_that._setCrossApp();
					// changes Ends from goodReceiptNav
				},
				function (response) {
					var r = $.parseXML(response.response.body);
					var msg = r.querySelector("message");
					MessageBox.error(msg.textContent);
				}
			);
		},
		// changes starts from goodReceiptNav
		_setCrossApp: function () {
			if (_that.getOwnerComponent().getComponentData().startupParameters.RefId) {
				var refId = _that.getOwnerComponent().getComponentData().startupParameters.RefId[0];
				_that.getView().byId("inputRefId").setValue(refId);
				// _that.getView().byId("inputRefId").setValue("S345555");
				_that.getView().byId("inputPlant").setValue("4211");
				_that._setDescription();
				_that.onGoodReceipt();
			}
		},
		// changes Ends from goodReceiptNav
		onClose: function () {
			this._oTPC.destroy();
			this._oTPC1.destroy();
		},
		handleOpenDialog: function (oEvent) {
			var oSource = oEvent.getSource().getTooltip();
			if (oSource === "Detail Settings") {
				this._oTPC1.openDialog();
			} else {
				this._oTPC.openDialog();
			}
		},
		_BindHeaderTable: function () {
			sap.ui.core.BusyIndicator.show();
			var oTable = this.getView().byId("idGoodReceiptHeaderTable");
			var refId = _that.getView().byId("inputRefId").getValue();
			var plant = _that.getView().byId("inputPlant").getValue();
			var path = "/MROverviewSet?$filter=(IReferenceid eq '" + refId + "' and IPlant eq '" + plant + "'";
			var datefrom, dateTo;
			var oDateFormat = sap.ui.core.format.DateFormat
				.getDateTimeInstance({
					pattern: "yyyy-MM-dd"
				});
			if (!(this.getView().byId("datePicker1").getSecondDateValue()) && this.getView().byId("datePicker1").getDateValue()) {
				datefrom = oDateFormat.format(new Date(_that.getView().byId("datePicker1").getDateValue())) + "T00:00:00";
				dateTo = datefrom;
				path += " and IDatefrom eq datetime'" + datefrom + "' and IDateto eq datetime'" + dateTo + "'";
			} else if (this.getView().byId("datePicker1").getSecondDateValue()) {
				datefrom = oDateFormat.format(new Date(_that.getView().byId("datePicker1").getDateValue())) + "T00:00:00";
				dateTo = oDateFormat.format(new Date(_that.getView().byId("datePicker1").getSecondDateValue())) + "T00:00:00";
				path += " and IDatefrom eq datetime'" + datefrom + "' and IDateto eq datetime'" + dateTo + "'";
			}
			path += ")";
			var oHeaderModel = new sap.ui.model.odata.ODataModel(_that.sServiceUrl);
			oHeaderModel.read(path, null, null, true,
				function (oData) {
					if (oData.results.length !== 0) {
						_that.getView().byId("sc1").setVisible(true);
						_that.byId("pnlGoodsHeader").setExpanded(true);
						_that.byId("sc2").setVisible(false);
						var headerModel = new JSONModel();
						headerModel.setData(oData);
						_that.getView().setModel(headerModel, "headerModel");
						if (oData.results[0].Sttrg === "1") {
							MessageBox.error("The Truck has not Checked-In, Goods receipt cannot be processed !");
						} else {
							var inwt = "Incoming weight";
							var outWt = "Outgoing weight";
							var NetWt = "Net weight";
							if (oData.results[0].Uom) {
								_that.byId("txtInWt").setText("");
								_that.byId("txtOutWt").setText("");
								_that.byId("txtNetWt").setText("");
								_that.byId("txtInWt").setText(inwt + "\n" + "(" + oData.results[0].Uom + ")");
								_that.byId("txtOutWt").setText(outWt + "\n" + "(" + oData.results[0].Uom + ")");
								_that.byId("txtNetWt").setText(NetWt + "\n" + "(" + oData.results[0].Uom + ")");
							}
							_that._setHeaderTableTemplate(headerModel);
						}
					} else {
						MessageBox.error("No Trucks for the Given selection !");
						_that.byId("sc1").setVisible(false);
						_that.byId("sc2").setVisible(false);
						oTable.unbindAggregation("items");
						oTable.unbindItems();
					}
					jQuery.sap.delayedCall(1500, _that, function () {
						sap.ui.core.BusyIndicator.hide();
					});
				},
				function (response) {
					var r = $.parseXML(response.response.body);
					var msg = r.querySelector("message");
					MessageBox.error(msg.textContent);
					jQuery.sap.delayedCall(1500, _that, function () {
						sap.ui.core.BusyIndicator.hide();
					});
				});
		},
		_setHeaderTableTemplate: function (headerModel) {
			var oTable = this.getView().byId("idGoodReceiptHeaderTable");
			var oTemplate = new sap.m.ColumnListItem({
				type: "Inactive",
				cells: [
					new sap.m.Text({
						text: "{Referenceid}"
					}),
					new sap.m.Text({
						text: "{Inbounddelno}"
					}),
					new sap.m.Text({
						text: "{Shipmentno}"
					}),
					new sap.m.Text({
						text: "{Status}"
					}),
					new sap.m.Text({
						text: {
							parts: [{
								path: "Actualcidt"
							}, {
								path: "Actualcitime"
							}],
							formatter: function (date, time) {
								if (!time && !date) {
									return "";
								} else {
									var otime = "";
									var odate = "";
									if (time) {
										otime = time.charAt(2) + time.charAt(3) + ":" + time.charAt(5) + time.charAt(6) + ":" + time.charAt(8) + time.charAt(9);
									}
									if (date) {
										var oDateFormat = sap.ui.core.format.DateFormat
											.getDateTimeInstance({
												pattern: _that.datePattern.replace(/D/gi, "d")
											});
										odate = oDateFormat.format(new Date(date));
									}
									return odate + "\n" + otime;
								}
							}
						}
					}),
					new sap.m.Text({
						text: "{Incomingwt}"
					}),
					new sap.m.Text({
						text: "{Outgoingwt}"
					}),
					new sap.m.Text({
						text: "{Netweight}"
					}),
					new sap.m.Text({
						text: "{Receivingpt}",
						textAlign: "Left"
					}),
					new sap.m.Text({
						text: "{Fwdagentname}",
						textAlign: "Left"
					}),
					new sap.m.Text({
						text: "{Carriername}"
					}),
					new sap.m.Text({
						text: "{Material}"
					}),
					new sap.m.Text({
						text: "{Trucknum}",
						textAlign: "Left"
					}),
					new sap.m.Text({
						text: "{Trailernum}",
						textAlign: "Left"
					})
				]
			}).addStyleClass("sapUiSizeCompact");
			oTable.setModel(headerModel);
			oTable.bindAggregation("items", {
				path: "/results",
				template: oTemplate
			});
		},
		_getDefaultStorageLoc: function () {
			var oHeaderModel = new sap.ui.model.odata.ODataModel(_that.sServiceUrl);
			_that.plant = _that.getView().byId("inputPlant").getValue();
			var path = "/BinlocSet?$filter=IPlant eq '" + _that.plant + "'";
			_that.sLoc = "";
			var oTable = _that.getView().byId("idGoodReceiptTable");
			oHeaderModel.read(path, null, null, true,
				function (oData) {
					for (var j = 0; j < oTable.getItems().length; j++) {
						oTable.getItems()[j].getCells()[13].setValue(oData.results[0].CLgort);
					}
					_that.sLoc = oData.results[0].CLgort;
				});
			return _that.sLoc;
		},
		onSelectDetail: function (oEvent) {
			var oTable = oEvent.getSource();
			if (displayFlag === "X") {
				_that._setDetailDisplayModeOnSel(oTable);
			} else {
				_that._setDetailEditModeOnSel(oTable);
			}
		},
		_setDetailDisplayModeOnSel: function (oTable) {
			_that.byId("inputDW").setEditable(false);
			_that.byId("rbYes").setEnabled(false);
			_that.byId("rbNo").setEnabled(false);
			var selectedFlag;
			for (var j = 0; j < oTable.getItems().length; j++) {
				oTable.getItems()[j].getCells()[3].setEditable(false);
				oTable.getItems()[j].getCells()[4].setEditable(false);
				oTable.getItems()[j].getCells()[7].setShowValueHelp(false);
				oTable.getItems()[j].getCells()[7].setEditable(false);
				oTable.getItems()[j].getCells()[8].setEnabled(false);
				oTable.getItems()[j].getCells()[12].setEditable(false);
				oTable.getItems()[j].getCells()[12].setShowValueHelp(false);
				selectedFlag = oTable.getItems()[j].getSelected();
				if (selectedFlag === false) {
					oTable.getItems()[j].getCells()[3].removeStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[3].addStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[12].removeStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[12].addStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[7].removeStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[7].addStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[4].removeStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[4].addStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[8].removeStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[8].addStyleClass("hideInputBorder");
				} else {
					oTable.getItems()[j].getCells()[3].removeStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[3].addStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[12].removeStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[12].addStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[7].removeStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[7].addStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[4].removeStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[4].addStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[8].removeStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[8].addStyleClass("hideSelectedInputBorder");
				}
			}
		},
		_setDetailEditModeOnSel: function (oTable) {
			_that.byId("inputDW").setEditable(true);
			_that.byId("rbYes").setEnabled(true);
			_that.byId("rbNo").setEnabled(true);
			var selectedFlag;
			for (var k = 0; k < oTable.getItems().length; k++) {
				oTable.getItems()[k].getCells()[4].setEditable(true);
				oTable.getItems()[k].getCells()[7].setEditable(true);
				oTable.getItems()[k].getCells()[7].setShowValueHelp(true);
				oTable.getItems()[k].getCells()[8].setEnabled(true);
				oTable.getItems()[k].getCells()[12].setShowValueHelp(true);
				oTable.getItems()[k].getCells()[12].setEditable(true);
				selectedFlag = oTable.getItems()[k].getSelected();
				if (selectedFlag === false) {
					oTable.getItems()[k].getCells()[3].removeStyleClass("hideInputBorder");
					oTable.getItems()[k].getCells()[12].removeStyleClass("hideInputBorder");
					oTable.getItems()[k].getCells()[7].removeStyleClass("hideInputBorder");
					oTable.getItems()[k].getCells()[8].removeStyleClass("hideInputBorder");
					oTable.getItems()[k].getCells()[4].removeStyleClass("hideInputBorder");
				} else {
					oTable.getItems()[k].getCells()[3].removeStyleClass("hideSelectedInputBorder");
					oTable.getItems()[k].getCells()[12].removeStyleClass("hideSelectedInputBorder");
					oTable.getItems()[k].getCells()[7].removeStyleClass("hideSelectedInputBorder");
					oTable.getItems()[k].getCells()[8].removeStyleClass("hideSelectedInputBorder");
					oTable.getItems()[k].getCells()[4].removeStyleClass("hideSelectedInputBorder");
				}
			}
		},
		_BindDetailtable: function (i) {
			var oTable = this.getView().byId("idGoodReceiptTable");
			_that.plant = _that.getView().byId("inputPlant").getValue();
			var oDetailModel = new sap.ui.model.odata.ODataModel(_that.sServiceUrl);
			var HeaderTable = this.getView().byId("idGoodReceiptHeaderTable");
			var refid = HeaderTable.getSelectedItem().getCells()[0].getText();
			var iDelivery = HeaderTable.getSelectedItem().getCells()[1].getText();
			var shipment = HeaderTable.getSelectedItem().getCells()[2].getText();
			// changes 06.05.2019 starts
			if (_that.flagNav === "X") {
				var oINavigation = "X";
			} else {
				oINavigation = "";
			}
			// changes 06.05.2019 ends and added  ["',INavigation='" + oINavigation] in below line
			var path = "/MRDetailSet(IDelivery='" + iDelivery + "',IReferenceid='" + refid + "',INavigation='" + oINavigation + "',IShipment='" +
				shipment +
				"')?$expand=NavMRDetail";
			_that.oBusy = new sap.m.BusyDialog();
			_that.oBusy.open();
			var paperWork;
			oDetailModel.read(path, null, null, true,
				function (oData) {
					if (oData) {
						var detailModel = new JSONModel();
						detailModel.setData(oData);
						_that.getView().setModel(detailModel, "detailModel");
						displayFlag = oData.EDisplay;
						paperWork = oData.Paperwork;
						_that.GoodssupplierCode = oData.Goodssupplier;
						_that.byId("textRefId").setText(oData.IReferenceid);
						_that.byId("txtIndelivery").setText(oData.Inbounddelno);
						_that.byId("txtShip").setText(oData.IShipment);
						_that.byId("textCarrier").setText(oData.Carrier);
						_that.byId("txtGs").setText(oData.Goodssuppliername);
						_that.byId("txtPlant").setText(oData.Recvpt);
						var custPlant = new sap.ui.core.CustomData({
							key: oData.Plant,
							value: oData.Plant
						});
						_that.byId("txtPlant").addCustomData(custPlant);
						_that.byId("txtTdate").setText(_that.dateTime(oData.Receiptdt));
						_that.recptdt = oData.Receiptdt;
						_that.byId("inputIW").setText(oData.Incomingwt);
						_that.byId("inputOW").setText(oData.Outgoingwt);
						_that.byId("inputDW").setValue(oData.Dunnagewt);
						_that.byId("inputNW").setText(oData.Netweight);
						if (oData.Zuom) {
							_that.byId("lblOutWeight").setText("Outgoing Weight" + "(" + oData.Zuom + "):");
							_that.byId("lblNetWeight").setText("Net Weight" + "(" + oData.Zuom + "):");
							_that.byId("lblInWeight").setText("Incoming Weight" + "(" + oData.Zuom + "):");
							_that.byId("lblDunnWeight").setText("Dunnage Weight" + "(" + oData.Zuom + "):");
						}
						_that.uom = oData.Zuom;
						var skid = "Skid Weight";
						var band = "Band Weight";
						var Ship = "Ship Weight";
						if (_that.uom) {
							_that.byId("txtSkidWt").setText("");
							_that.byId("txtBandWt").setText("");
							_that.byId("txtShipWt").setText("");
							_that.byId("txtSkidWt").setText(skid + "\n" + "(" + oData.Zuom + ")");
							_that.byId("txtBandWt").setText(band + "\n" + "(" + oData.Zuom + ")");
							_that.byId("txtShipWt").setText(Ship + "\n" + "(" + oData.Zuom + ")");
						}
						if (displayMode) {
							_that._setDetailDisplayTableTemplate(detailModel);
							oTable.setMode("None");
							_that._setFooterDisable();
							_that.getView().byId("rbYes").setEditable(false);
							_that.getView().byId("rbNo").setEditable(false);
							_that.byId("inputDW").setEditable(false);
						} else {
							_that._setDetailTableTemplate(detailModel);
							oTable.setMode("MultiSelect");
							// oTable.selectAll(true);
							_that._setFooterEnable();
							if (displayFlag === "X") {
								_that._setDetailDisplayModeOnInit(oData);
							} else {
								_that.setDetailEditModeOnInit(paperWork, oData);
							}
							if (paperWork === "X") {
								_that.getView().byId("rbYes").setEditable(false);
								_that.getView().byId("rbNo").setEditable(false);
							} else {
								_that.getView().byId("rbYes").setEditable(true);
								_that.getView().byId("rbNo").setEditable(true);
							}
						}
						if (paperWork === "Y") {
							_that.byId("rbYes").setSelected(true);
						} else if (paperWork === "N") {
							_that.byId("rbNo").setSelected(true);
						} else {
							_that.byId("rbYes").setSelected(true);
							_that.byId("rbNo").setSelected(false);
						}
						for (var j = 0; j < oTable.getItems().length; j++) {
							oTable.getItems()[j].getCells()[14].setSelectedIndex(0);
							if (oData.NavMRDetail.results[j].Mixstock === "Y") {
								oTable.getItems()[j].getCells()[9].setSelectedIndex(0);
							} else {
								oTable.getItems()[j].getCells()[9].setSelectedIndex(1);
							}
							if (oData.NavMRDetail.results[j].Moisturef === "Y") {
								oTable.getItems()[j].getCells()[14].setSelectedIndex(0);
							}
							if (oData.NavMRDetail.results[j].Moisturef === "N") {
								oTable.getItems()[j].getCells()[14].setSelectedIndex(1);
							}
							if (displayMode) {
								if (oData.NavMRDetail.results[j].Quality === "Y") {
									oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[0].setSelected(true);
									oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[1].setSelected(false);
								} else if (oData.NavMRDetail.results[j].Quality === "N") {
									oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[0].setSelected(false);
									oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[1].setSelected(true);
								} else {
									oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[0].setSelected(false);
									oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[1].setSelected(false);
								}
							}
						}
						jQuery.sap.delayedCall(1500, _that, function () {
							_that.oBusy.close();
						});
					} else {
						_that._setFooterDisable();
						jQuery.sap.delayedCall(1500, _that, function () {
							_that.oBusy.close();
						});
					}
				},
				function (response) {
					_that._setFooterDisable();
					var r = $.parseXML(response.response.body);
					var msg = r.querySelector("message");
					MessageBox.error(msg.textContent);
					jQuery.sap.delayedCall(1500, _that, function () {
						_that.oBusy.close();
					});
				});
		},
		_setDetailDisplayModeOnInit: function (oData) {
			var oTable = this.getView().byId("idGoodReceiptTable");
			_that.byId("inputDW").setEditable(false);
			_that.byId("rbYes").setEnabled(false);
			_that.byId("rbNo").setEnabled(false);
			for (var j = 0; j < oTable.getItems().length; j++) {
				// changes 14.05.2019  starts
				if (oData.NavMRDetail["results"][j].Itemflag === "X") {
					oTable.getItems()[j].setSelected(true);
				} else {
					oTable.getItems()[j].setSelected(false);
				}
				// changes 14.05.2019  ends
				var hb = oTable.getItems()[j].getCells()[7];
				hb.getItems()[1].setVisible(true);
				hb.getItems()[0].setVisible(false);
				if (oData.NavMRDetail.results[j].Quality === "Y") {
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[0].setSelected(true);
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[0].setEditable(true);
				} else if (oData.NavMRDetail.results[j].Quality === "N") {
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[1].setSelected(true);
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[1].setEditable(true);
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[0].setEditable(true);
				} else {
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[0].setEditable(true);
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[1].setEditable(true);
					oTable.getItems()[j].getCells()[1].getItems()[0].setSelectedIndex(-1);
				}
				oTable.getItems()[j].getCells()[4].setEditable(false);
				oTable.getItems()[j].getCells()[8].setEditable(false);
				oTable.getItems()[j].getCells()[8].setShowValueHelp(false);
				oTable.getItems()[j].getCells()[5].setEditable(false);
				oTable.getItems()[j].getCells()[5].setShowValueHelp(false);
				oTable.getItems()[j].getCells()[9].setEnabled(false);
				oTable.getItems()[j].getCells()[13].setEditable(false);
				oTable.getItems()[j].getCells()[13].setShowValueHelp(false);
				var selectedFlag = oTable.getItems()[j].getSelected();
				if (selectedFlag === false) {
					oTable.getItems()[j].getCells()[4].addStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[13].addStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[8].addStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[9].addStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[5].addStyleClass("hideInputBorder");
				} else {
					oTable.getItems()[j].getCells()[4].addStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[13].addStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[10].addStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[7].addStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[11].addStyleClass("hideSelectedInputBorder");
				}
			}
		},
		setDetailEditModeOnInit: function (paperWork, oData) {
			var oTable = this.getView().byId("idGoodReceiptTable");
			_that.byId("inputDW").setEditable(true);
			_that.byId("rbYes").setEnabled(true);
			_that.byId("rbNo").setEnabled(true);
			if (paperWork === "Y" || paperWork === "N") {
				_that.getView().byId("rbYes").setEditable(false);
			} else {
				_that.getView().byId("rbYes").setEditable(true);
			}
			for (var j = 0; j < oTable.getItems().length; j++) {
				// changes 03.05.2019  starts
				if (oData.NavMRDetail["results"][j].Itemflag === "X") {
					oTable.getItems()[j].setSelected(true);
				} else {
					oTable.getItems()[j].setSelected(false);
				}
				// changes 03.05.2019  ends
				oTable.getItems()[j].getCells()[7].getItems()[0].setVisible(true);
				oTable.getItems()[j].getCells()[7].getItems()[1].setVisible(false);
				oTable.getItems()[j].getCells()[13].setEditable(true);
				oTable.getItems()[j].getCells()[8].setEditable(true);
				oTable.getItems()[j].getCells()[5].setEditable(true);
				oTable.getItems()[j].getCells()[9].setEnabled(true);
				oTable.getItems()[j].getCells()[8].setShowValueHelp(true);
				oTable.getItems()[j].getCells()[13].setShowValueHelp(true);
				var selectedFlag = oTable.getItems()[j].getSelected();
				if (selectedFlag === false) {
					oTable.getItems()[j].getCells()[4].removeStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[5].removeStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[8].removeStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[9].removeStyleClass("hideInputBorder");
					oTable.getItems()[j].getCells()[13].removeStyleClass("hideInputBorder");
				} else {
					oTable.getItems()[j].getCells()[4].removeStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[5].removeStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[8].removeStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[9].removeStyleClass("hideSelectedInputBorder");
					oTable.getItems()[j].getCells()[13].removeStyleClass("hideSelectedInputBorder");
				}
				if (oData.NavMRDetail.results[j].Quality === "Y") {
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[0].setSelected(true);
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[0].setEditable(true);
				} else if (oData.NavMRDetail.results[j].Quality === "N") {
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[1].setSelected(true);
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[1].setEditable(true);
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[0].setEditable(true);
				} else {
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[0].setEditable(true);
					oTable.getItems()[j].getCells()[1].getItems()[0].getButtons()[1].setEditable(true);
					oTable.getItems()[j].getCells()[1].getItems()[0].setSelectedIndex(-1);
				}
			}
		},
		_setDetailTableTemplate: function (detailModel) {
			var oTable = this.getView().byId("idGoodReceiptTable");
			var oTemplate = new sap.m.ColumnListItem({
				type: "Inactive",
				cells: [
					new sap.m.Text({
						text: "{Description}"
					}),
					new sap.m.HBox({
						width: "100%",
						justifyContent: "Center",
						alignItems: "Center",
						items: [
							new sap.m.RadioButtonGroup({
								columns: 5,
								buttons: [
									new sap.m.RadioButton({
										text: "Y",
										value: ""
									}),
									new sap.m.RadioButton({
										text: "N",
										value: ""
									})
								]
							})
						]
					}),
					new sap.m.CheckBox({
						selected: {
							parts: [{
								path: "Fullrej"
							}],
							formatter: function (value) {
								if (value === "Y") {
									return true;
								} else if (value === "N") {
									return false;
								} else {
									return false;
								}
							}
						},
						select: this.onFullrejCheckSelect
					}),
					new sap.m.Text({
						text: "{Batch}"
					}),
					new sap.m.Input({
						value: {
							parts: [{
								path: "Quantity"
							}],
							formatter: function (Quantity) {
								if (Quantity === "000000") {
									return "";
								} else {
									return Quantity;
								}
							}
						},
						type: "Number",
						change: function (oEvent) {
							var qty = oEvent.getParameter("value");
							var matnr = oEvent.getSource().getParent().getCells()[11].getText();
							var plant = _that.getView().byId("inputPlant").getValue();
							var itemNo = oEvent.getSource().getParent().getCells()[10].getText();
							var inDelivery = _that.getView().byId("txtIndelivery").getText();
							var qtyModel = new sap.ui.model.odata.ODataModel(_that.sServiceUrl);
							_that.oBusy = new sap.m.BusyDialog();
							_that.oBusy.open();
							_that.itemPressed = oEvent.getSource().getParent();
							var path1 = "/DetailweightsSet(IMaterial='" + matnr + "',IPlant='" + plant + "',IQuantity='" + qty + "',IVbeln='" +
								inDelivery + "',IPosnr='" + itemNo + "')";
							qtyModel.read(path1, null, null, true,
								function (oData1) {
									jQuery.sap.delayedCall(2000, _that, function () {
										_that.oBusy.close();
									});
									if (oData1) {
										_that.itemPressed.getCells()[5].setValue(oData1.ESkidwt);
										_that.itemPressed.getCells()[6].setText(oData1.EBandingwt);
									}
								});
						}
					}),
					new sap.m.Input({
						value: "{Skidwt}",
						type: "Number"
					}),
					new sap.m.Text({
						text: "{Bandwt}"
					}),
					new sap.m.HBox({
						width: "100%",
						justifyContent: "Center",
						alignItems: "Center",
						items: [
							new sap.m.Input({
								value: "{Shipwt}",
								type: "Number"
							}),
							new sap.m.Text({
								text: "{Shipwt}"
							})
						]
					}),
					new sap.m.Input({
						value: "{Storagebin}",
						showValueHelp: true,
						valueHelpRequest: _that._handleStorageLoc,
						customData: [new sap.ui.core.CustomData({
							key: "Bin"
						})]
					}),
					new sap.m.Select({
						items: [
							new sap.ui.core.Item({
								key: "Y",
								text: "Y"
							}),
							new sap.ui.core.Item({
								key: "N",
								text: "N"
							})
						]
					}),
					new sap.m.Text({
						text: "{Item}"
					}),
					new sap.m.Text({
						text: "{Material}"
					}),
					new sap.m.Text({
						text: {
							parts: [{
								path: "Inventorywt"
							}],
							formatter: function (weight) {
								if (_that.uom === undefined || _that.uom === "") {
									return weight;
								} else {
									return (weight + "(" + _that.uom + ")");
								}
							}
						}
					}),
					new sap.m.Input({
						value: {
							parts: [{
								path: "Storageloc"
							}, {
								path: _that.sLoc
							}],
							formatter: function (Storageloc, sLoc) {
								if (Storageloc === undefined || Storageloc === "") {
									return sLoc;
								} else {
									return Storageloc;
								}
							}
						},
						showValueHelp: true,
						valueHelpRequest: _that._handleStorageLoc,
						customData: [new sap.ui.core.CustomData({
							key: "Loc"
						})]
					}),
					new sap.m.Select({
						items: [
							new sap.ui.core.Item({
								key: "Y",
								text: "Y"
							}),
							new sap.ui.core.Item({
								key: "N",
								text: "N"
							})
						]
					})
				]
			}).addStyleClass("sapUiSizeCompact");
			oTable.setModel(detailModel);
			oTable.bindAggregation("items", {
				path: "/NavMRDetail/results",
				template: oTemplate
			});
		},
		_setDetailDisplayTableTemplate: function (detailModel) {
			var oTable = this.getView().byId("idGoodReceiptTable");
			var oTemplate = new sap.m.ColumnListItem({
				type: "Inactive",
				cells: [
					new sap.m.Text({
						text: "{Description}"
					}),
					new sap.m.HBox({
						width: "100%",
						justifyContent: "Center",
						alignItems: "Center",
						items: [
							new sap.m.RadioButtonGroup({
								columns: 5,
								buttons: [
									new sap.m.RadioButton({
										enabled: false,
										text: "Y",
										value: ""
									}),
									new sap.m.RadioButton({
										enabled: false,
										text: "N",
										value: ""
									})
								]
							})
						]
					}),
					new sap.m.CheckBox({
						enabled: false,
						selected: {
							parts: [{
								path: "Fullrej"
							}],
							formatter: function (value) {
								if (value === "Y") {
									return true;
								} else if (value === "N") {
									return false;
								} else {
									return false;
								}
							}
						},
						select: this.onFullrejCheckSelect
					}),
					new sap.m.Text({
						text: "{Batch}"
					}),
					new sap.m.Text({
						text: {
							parts: [{
								path: "Quantity"
							}],
							formatter: function (Quantity) {
								if (Quantity === "000000") {
									return "";
								} else {
									return Quantity;
								}
							}
						}
					}),
					new sap.m.Text({
						text: "{Skidwt}"
					}),
					new sap.m.Text({
						text: "{Bandwt}"
					}),
					new sap.m.Text({
						text: "{Shipwt}"
					}),
					new sap.m.Text({
						text: "{Storagebin}"
					}),
					new sap.m.Select({
						enabled: false,
						items: [
							new sap.ui.core.Item({
								key: "Y",
								text: "Y"
							}),
							new sap.ui.core.Item({
								key: "N",
								text: "N"
							})
						]
					}),
					new sap.m.Text({
						text: "{Item}"
					}),
					new sap.m.Text({
						text: "{Material}"
					}),
					new sap.m.Text({
						text: {
							parts: [{
								path: "Inventorywt"
							}],
							formatter: function (weight) {
								if (_that.uom === undefined || _that.uom === "") {
									return weight;
								} else {
									return (weight + "(" + _that.uom + ")");
								}
							}
						}
					}),
					new sap.m.Text({
						text: {
							parts: [{
								path: "Storageloc"
							}, {
								path: _that.sLoc
							}],
							formatter: function (Storageloc, sLoc) {
								if (Storageloc === undefined || Storageloc === "") {
									return sLoc;
								} else {
									return Storageloc;
								}
							}
						}
					}),
					new sap.m.Select({
						enabled: false,
						items: [
							new sap.ui.core.Item({
								key: "Y",
								text: "Y"
							}),
							new sap.ui.core.Item({
								key: "N",
								text: "N"
							})
						]
					})
				]
			}).addStyleClass("sapUiSizeCompact");
			oTable.setModel(detailModel);
			oTable.bindAggregation("items", {
				path: "/NavMRDetail/results",
				template: oTemplate
			});
		},
		_weightUnit: function (weight, uom) {
			if (uom === undefined || uom === "") {
				if (weight === "" || weight === "0.000") {
					return "";
				} else {
					return weight;
				}
			} else {
				if (weight === "" || weight === "0.000") {
					return "";
				} else {
					return (weight + "(" + uom + ")");
				}
			}
		},
		handlesuggestSelect: function (oEvent) {
			_that.getView().byId("txtLoc").setText(oEvent.getParameter("selectedItem").getKey());
		},
		handleSuggest: function (oEvent) {
			var sTerm = oEvent.getParameter("suggestValue");
			var aFilters = [];
			if (sTerm) {
				aFilters.push(new sap.ui.model.Filter("Plant", sap.ui.model.FilterOperator.StartsWith, sTerm));
			}
			oEvent.getSource().getBinding("suggestionItems").filter(aFilters);
		},
		_handleStorageLoc: function (oEvent) {
			var plant = _that.getView().byId("inputPlant").getValue();
			_that.sid = oEvent.getSource();
			_that.valueHelpDialogLoc = new sap.m.SelectDialog({
				title: "Storage Location/Bin",
				contentWidth: "250px",
				growingThreshold: 1500,
				search: [_that._handleValueHelpSearchsLoc,
					_that
				],
				confirm: [_that._handleValueHelpClosesLoc,
					_that
				],
				cancel: [_that._handleValueHelpClosesLoc,
					_that
				]
			});
			sap.ui.core.BusyIndicator.show();
			var oReadModel = new sap.ui.model.odata.ODataModel(_that.sServiceUrl);
			var URL = "/BinlocSet?$filter=IPlant eq '" + plant + "'";
			var component;
			_that.cust = _that.sid.getAggregation("customData");
			var oItemTemplateE;
			if (_that.cust[0].getProperty("key") === "Loc") {
				oItemTemplateE = new sap.m.StandardListItem({
					title: "{BinLoc}",
					description: "{StorLoc}",
					customData: [new sap.ui.core.CustomData({
						key: "{BinLoc}"
					})]
				});
			} else {
				oItemTemplateE = new sap.m.StandardListItem({
					title: "{StorLoc}",
					description: "{BinLoc}",
					customData: [new sap.ui.core.CustomData({
						key: "{StorLoc}"
					})]
				});
			}
			oReadModel.read(URL, null, null, true,
				function (oData) {
					if (oData) {
						component = oData;
						var eModel = new sap.ui.model.json.JSONModel(component);
						eModel.setSizeLimit(component.results.length);
						_that.valueHelpDialogLoc.setModel(eModel);
						_that.valueHelpDialogLoc.bindAggregation("items",
							"/results", oItemTemplateE);
						jQuery.sap.delayedCall(1500, _that, function () {
							sap.ui.core.BusyIndicator.hide();
						});
						_that.valueHelpDialogLoc.open();
					}
				});
		},
		_handleValueHelpSearchsLoc: function (evt) {
			var sValue = evt.getParameter("value");
			sValue = sValue.toLowerCase();
			for (var i = 0; i < _that.valueHelpDialogLoc
				.getItems().length; i++) {
				var val1 = _that.valueHelpDialogLoc.getItems()[i]
					.getTitle();
				val1 = val1.toLowerCase();
				var val2 = _that.valueHelpDialogLoc.getItems()[i]
					.getDescription();
				val2 = val2.toLowerCase();
				if (val1.indexOf(sValue) > -1 || val2.indexOf(sValue) > -1) {
					_that.valueHelpDialogLoc.getItems()[i]
						.setVisible(true);
				} else {
					_that.valueHelpDialogLoc.getItems()[i]
						.setVisible(false);
				}
			}
		},
		_handleValueHelpClosesLoc: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				_that.sid.setValue(oSelectedItem.getDescription());
				if (_that.cust[0].getKey() === "Loc") {
					_that.sid.getParent().getCells()[8].setValue(oSelectedItem.getCustomData()[0].getProperty("key"));
				} else {
					_that.sid.getParent().getCells()[13].setValue(oSelectedItem.getCustomData()[0].getProperty("key"));
				}
			}
			evt.getSource().getBinding("items").filter([]);
		},
		_handleValueHelpPlant: function (oEvent) {
			_that.valueHelpDialogPlant = new sap.m.SelectDialog({
				title: "Plant",
				contentWidth: "250px",
				growingThreshold: 1500,
				search: [_that._handleValueHelpSearchPlant,
					_that
				],
				confirm: [_that._handleValueHelpClosePlant,
					_that
				],
				cancel: [_that._handleValueHelpClosePlant,
					_that
				]
			});
			//CustomData code was changed from GoodReceiptNav
			var oItemTemplateE = new sap.m.StandardListItem({
				title: "{Plant}",
				description: "{Name1}",
				customData: [new sap.ui.core.CustomData({
					key: "{Plant}"
				})]
			});
			_that.valueHelpDialogPlant.setModel(_that.getView().getModel("oPlantModel"));
			_that.valueHelpDialogPlant.bindAggregation("items",
				"/", oItemTemplateE);
			_that.valueHelpDialogPlant.open();
		},
		_handleValueHelpSearchPlant: function (evt) {
			var sValue = evt.getParameter("value");
			sValue = sValue.toLowerCase();
			for (var i = 0; i < _that.valueHelpDialogPlant
				.getItems().length; i++) {
				var val1 = _that.valueHelpDialogPlant.getItems()[i]
					.getTitle();
				val1 = val1.toLowerCase();
				var val2 = _that.valueHelpDialogPlant.getItems()[i]
					.getDescription();
				val2 = val2.toLowerCase();
				if (val1.indexOf(sValue) > -1 || val2.indexOf(sValue) > -1) {
					_that.valueHelpDialogPlant.getItems()[i]
						.setVisible(true);
				} else {
					_that.valueHelpDialogPlant.getItems()[i]
						.setVisible(false);
				}
			}
		},
		_handleValueHelpClosePlant: function (evt) {
			var oSelectedItem = evt.getParameter("selectedItem");
			if (oSelectedItem) {
				_that.getView().byId("inputPlant").setValue(oSelectedItem.getTitle());
			}
			evt.getSource().getBinding("items").filter([]);
		},
		onGoodReceipt: function () {
			var refid = _that.getView().byId("inputRefId").getValue();
			var plant = _that.getView().byId("inputPlant").getValue();
			var dateRange = _that.getView().byId("datePicker1").getDateValue();
			if ((dateRange === "" || dateRange === null) && refid === "") {
				MessageBox.error("Please enter refrence id or DateRange !");
			} else if (plant === "") {
				MessageBox.error("Please enter plant !");
			} else {
				_that._BindHeaderTable();
			}
		},
		onClearList: function () {
			_that.getView().byId("inputRefId").setValue("");
			_that.getView().byId("sc1").setVisible(false);
			_that.getView().byId("sc2").setVisible(false);
			_that._setFooterDisable();
			this.getView().byId("idGoodReceiptHeaderTable").unbindAggregation("items");
			this.getView().byId("idGoodReceiptHeaderTable").unbindItems();
			_that.getView().byId("printBtn").setVisible(false);
		},
		onTableRowSelection: function (oEvent) {
			// 	//changes starts from GoodReceipt
			if (oEvent) {
				selectedIndex = oEvent.getSource().getSelectedContexts()[0].sPath.split("/")[2];
			} else {
				var venitems = _that.getView().byId("idGoodReceiptHeaderTable").getItems();
				venitems[0].setSelected(true);
				selectedIndex = "0";
				// Begin of changes for Latchford by PANIGRAHIG 26.04.2019
				if (_that.flagNav === "X") {
					_that._setDetailTabColumn();
				}
				// End of changes for Latchford by PANIGRAHIG 26.04.2019
			}
			// //changes End from GoodReceipt
			_that.byId("pnlGoodsHeader").setExpanded(false);
			_that.getView().byId("sc2").setVisible(true);
			_that._getDefaultStorageLoc();
			_that._BindDetailtable();
			_that.addStyles();
			_that.getView().byId("printBtn").setVisible(true);
		},
		//changes starts from GoodReceipt 26.04.2019
		_setDetailTabColumn: function () {
			_that.getView().byId("ColEId_1").setVisible(false);
			_that.getView().byId("ColSCAC_5").setVisible(false);
			_that.getView().byId("ColType_7").setVisible(false);
			_that.getView().byId("ColTrailer_10").setVisible(false);
			_that.getView().byId("ColDelivery_12").setVisible(false);
			_that.getView().byId("Col_13").setVisible(false);
		},
		//changes End from GoodReceipt 26.04.2019
		addStyles: function () {
			_that.getView().byId("lblRDate").addStyleClass("boldLabel");
			_that.getView().byId("lblInDel").addStyleClass("boldLabel");
			_that.getView().byId("lblShip").addStyleClass("boldLabel");
			_that.getView().byId("lblGs").addStyleClass("boldLabel");
			_that.getView().byId("lblPlant").addStyleClass("boldLabel");
			_that.getView().byId("lblCarrier").addStyleClass("boldLabel");
			_that.getView().byId("lblInWeight").addStyleClass("boldLabel");
			_that.getView().byId("lblPw").addStyleClass("boldLabel");
			_that.getView().byId("lblOutWeight").addStyleClass("boldLabel");
			_that.getView().byId("lblDunnWeight").addStyleClass("boldLabel");
			_that.getView().byId("lblNetWeight").addStyleClass("boldLabel");
			_that.getView().byId("lblRefId1").addStyleClass("boldLabel");
		},
		onChangeDW: function (oEvent) {
			_that.dunnage = _that.getView().byId("inputDW");
			_that.outWeight = _that.getView().byId("inputOW");
			_that.oBusy1 = new sap.m.BusyDialog();
			_that.oBusy1.open();
			if (_that.getView().byId("inputIW").getText().indexOf("(") > -1) {
				_that.net = _that.getView().byId("inputIW").getText().split("(")[0];
				_that.um = "(" + _that.getView().byId("inputIW").getText().split("(")[1].split(")")[0] + ")";
			} else {
				_that.net = _that.getView().byId("inputIW").getText();
				_that.um = "";
			}
			if (_that.outWeight.getText().indexOf("(") > -1) {
				_that.out = _that.outWeight.getText().split("(")[0];
				_that.um = "(" + _that.outWeight.getText().split("(")[1].split(")")[0] + ")";
			} else {
				_that.out = _that.outWeight.getText();
				_that.um = "";
			}
			if (oEvent.getParameter("value").indexOf("(") > -1) {
				_that.dw = oEvent.getParameter("value").split("(")[0];
			} else {
				_that.dw = oEvent.getParameter("value");
			}
			_that.getView().byId("inputNW").setText((_that.net - _that.out - _that.dw) + _that.um); // chamged 4/9/2016
			jQuery.sap.delayedCall(1000, _that, function () {
				_that.oBusy1.close();
			});
		},
		onSave: function (oEvent) {
			var Y = _that.getView().byId("rbYes").getSelected();
			var N = _that.getView().byId("rbNo").getSelected();
			var Goods = {};
			var Items = [];
			var tableItem = _that.getView().byId("idGoodReceiptTable");
			// FR flag check
			var FR_flag = 0;
			var Q_flag = 0;
			var FR_pass = false;

			for (var k = 0; k < tableItem.getSelectedItems().length; k++) {
				var Fullrej = tableItem.getSelectedItems()[k].getCells()[2].getSelected();
				var QualityN = tableItem.getSelectedItems()[k].getCells()[1].getItems()[0].getButtons()[1].getSelected();

				if (Fullrej) {
					FR_flag++;
				}

				if (QualityN) {
					Q_flag++;
				}
			}

			if (FR_flag > 0 && FR_flag < tableItem.getSelectedItems().length) {
				MessageBox.error("Please select Full Reject checkbox for all items to proceed\nor un-check");
				FR_pass = false;
				return;
			} else if (FR_flag > 0 && FR_flag == tableItem.getSelectedItems().length) {
				FR_pass = true;
				if (Q_flag > 0) {
					_that.InfoMsg = "X";
				}

				_that.updateGoods(Goods, Items, N, tableItem);
				return;
			}

			if (N === false && Y === false) {
				MessageBox.error("Please select the paperwork !");
				return;
			}
			if (N === true) {
				var plant = _that.getView().byId("inputPlant").getValue();
				if (_that.OLatchFordPlant.indexOf(plant) === -1) { // Begin of changes by Sri DF#836
					var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
					MessageBox.show(
						"Continue without paperwork ?", {
							icon: MessageBox.Icon.WARNING,
							title: "Warning",
							actions: [MessageBox.Action.YES, MessageBox.Action.NO],
							styleClass: bCompact ? "sapUiSizeCompact" : "",
							onClose: function (oAction) {
								if (oAction === "YES") {
									_that.checkValidation(tableItem);
									if (_that.flagU === "") {
										_that.updateGoods(Goods, Items, N, tableItem);
									}
								} else {
									return;
								}
							}
						}
					);
				} else { // Begin of changes by Sri DF#836 
					_that.saveData();
				}
				// End of changes by Sri DF#836
			} else {
				// Begin of changes by Sri DF#836
				_that.saveData();
				// End of changes by Sri DF#836
			}
		},
		onFullrejCheckSelect: function (oEvent) {

			var aItems = _that.getView().byId("idGoodReceiptTable").getItems();

			if (oEvent.getParameter("selected")) {
				// If Unchecked -> Selected

				aItems.map(function (oItem) {
					var sPath = oItem.getBindingContextPath();
					_that.getView().byId("idGoodReceiptTable").getModel().setProperty(sPath + "/Fullrej", "Y");
					oItem.getCells()[1].getItems()[0].getButtons()[0].setSelected(false);
					oItem.getCells()[1].getItems()[0].getButtons()[1].setSelected(true);
				});

				// oEvent.getSource().getParent().getCells()[1].getItems()[0].getButtons()[0].setSelected(false);
				// oEvent.getSource().getParent().getCells()[1].getItems()[0].getButtons()[1].setSelected(true);
			} else {
				// If Selected -> Unchecked
				// debugger;
				aItems.map(function (oItem) {
					var sPath = oItem.getBindingContextPath();
					_that.getView().byId("idGoodReceiptTable").getModel().setProperty(sPath + "/Fullrej", "N");
					oItem.getCells()[1].getItems()[0].getButtons()[0].setSelected(true);
					oItem.getCells()[1].getItems()[0].getButtons()[1].setSelected(false);
				});

				// var qualityFlag = oEvent.getSource().getParent().getBindingContext().getObject().Quality;

				// if (qualityFlag === "Y") {
				// 	oEvent.getSource().getParent().getCells()[1].getItems()[0].getButtons()[0].setSelected(true);
				// 	oEvent.getSource().getParent().getCells()[1].getItems()[0].getButtons()[1].setSelected(false);
				// } else if (qualityFlag === "N") {
				// 	oEvent.getSource().getParent().getCells()[1].getItems()[0].getButtons()[0].setSelected(false);
				// 	oEvent.getSource().getParent().getCells()[1].getItems()[0].getButtons()[1].setSelected(true);
				// }

				// var sPath = oEvent.getSource().getParent().getBindingContextPath();
				// _that.getView().byId("idGoodReceiptTable").getModel().setProperty(sPath + "/Fullrej", "N");
			}
		},
		saveData: function () {
			var Y = _that.getView().byId("rbYes").getSelected();
			var N = _that.getView().byId("rbNo").getSelected();
			var Goods = {};
			var Items = [];
			var tableItem = _that.getView().byId("idGoodReceiptTable");
			var bCompact = !!this.getView().$().closest(".sapUiSizeCompact").length;
			_that.checkValidation(tableItem);
			// changes 01.05.2019 earlier condition was  _that.flagU === "fasle" changed to _that.flagU === "X"
			if (_that.flagU === "X") {
				if (_that.SelectedFlag === "X") {
					var bCompact1 = !!this.getView().$().closest(".sapUiSizeCompact").length;
					MessageBox.show(
						"Not all items are selected – Do you still want to save selected items?", {
							icon: MessageBox.Icon.WARNING,
							title: "Warning",
							actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
							styleClass: bCompact1 ? "sapUiSizeCompact" : "",
							onClose: function (oAction) {
								if (oAction === "OK") {
									_that.flagU = "";
									_that.updateGoods(Goods, Items, N, tableItem);
								} else {
									_that.flagU = "X";
								}
							}
						}
					);
				}
			}
			if (_that.flagU === "" && _that.warnQty === "X") {
				MessageBox.show(
					"Number of pieces is blank- Are you sure you want to save?", {
						icon: MessageBox.Icon.WARNING,
						title: "Warning",
						actions: [MessageBox.Action.YES, MessageBox.Action.NO],
						styleClass: bCompact ? "sapUiSizeCompact" : "",
						onClose: function (oAction) {
							if (oAction === "YES") {
								_that.checkValidation(tableItem);
								if (_that.flagU === "" && _that.warnSkid === "") {
									_that.updateGoods(Goods, Items, N, tableItem);
								} else {
									MessageBox.show(
										"Skid weight is blank- Are you sure you want to save?", {
											icon: MessageBox.Icon.WARNING,
											title: "Warning",
											actions: [MessageBox.Action.YES, MessageBox.Action.NO],
											styleClass: bCompact ? "sapUiSizeCompact" : "",
											onClose: function (oActionEvt) {
												if (oActionEvt === "YES") {
													_that.checkValidation(tableItem);
													if (_that.flagU === "") {
														_that.updateGoods(Goods, Items, N, tableItem);
													}
												} else {
													return;
												}
											}
										}
									);
								}
							} else {
								return;
							}
						}
					}
				);
			}
			if (_that.flagU === "" && _that.warnQty === "") {
				if (_that.warnSkid === "X") {
					MessageBox.show(
						"Skid weight is blank- Are you sure you want to save?", {
							icon: MessageBox.Icon.WARNING,
							title: "Warning",
							actions: [MessageBox.Action.YES, MessageBox.Action.NO],
							styleClass: bCompact ? "sapUiSizeCompact" : "",
							onClose: function (oAction) {
								if (oAction === "YES") {
									_that.checkValidation(tableItem);
									if (_that.flagU === "") {
										_that.updateGoods(Goods, Items, N, tableItem);
									}
								} else {
									return;
								}
							}
						}
					);
				}
			}
			if (_that.flagU === "" && _that.warnQty === "" && _that.warnSkid === "") {
				_that.updateGoods(Goods, Items, N, tableItem);
			}
		},
		checkValidation: function (tableItem) {
			if (_that.getView().byId("inputNW").getText().indexOf("-") > -1) {
				MessageBox.error("Net weight is in negative, please check the Incoming/outgoing weights !");
				_that.flagU = "X";
				return;
			}
			for (var i = 0; i < tableItem.getSelectedItems().length; i++) {
				if (tableItem.getSelectedItems()[i].getCells()[1].getItems()[0].getButtons()[0].getSelected() === false && tableItem.getSelectedItems()[
						i].getCells()[1].getItems()[0].getButtons()[1].getSelected() === false) {
					MessageBox.error("Please choose quality Y/N !");
					_that.flagU = "X";
					return;
				}
				if (tableItem.getSelectedItems()[i].getCells()[13].getProperty("value") === "") {
					// Begin of changes for DF#762 for Latchford by PANIGRAHIG
					if (_that.getOwnerComponent().getComponentData().startupParameters.RefId === undefined) {
						tableItem.getSelectedItems()[i].getCells()[13].setValueState(sap.ui.core.ValueState.Error);
						MessageBox.error("Please enter storage location and storage bin !");
						_that.flagU = "X";
						return;
					} else {
						tableItem.getSelectedItems()[i].getCells()[13].setValueState(sap.ui.core.ValueState.None);
						_that.flagU = "";
					}
					// End of changes for DF#762 for Latchford by PANIGRAHIG
				} else {
					tableItem.getSelectedItems()[i].getCells()[13].setValueState(sap.ui.core.ValueState.None);
					_that.flagU = "";
				}
				if (tableItem.getSelectedItems()[i].getCells()[8].getProperty("value") === "") {
					// Begin of changes for DF#762 for Latchford by PANIGRAHIG
					if (_that.getOwnerComponent().getComponentData().startupParameters.RefId === undefined) {
						tableItem.getSelectedItems()[i].getCells()[8].setValueState(sap.ui.core.ValueState.Error);
						MessageBox.error("Please enter storage location and storage bin !");
						_that.flagU = "X";
						return;
					} else {
						tableItem.getSelectedItems()[i].getCells()[8].setValueState(sap.ui.core.ValueState.None);
						_that.flagU = "";
					}
					// End of changes for DF#762 for Latchford by PANIGRAHIG
				} else {
					tableItem.getSelectedItems()[i].getCells()[8].setValueState(sap.ui.core.ValueState.None);
					_that.flagU = "";
				}
				if (tableItem.getSelectedItems()[i].getCells()[1].getItems()[0].getButtons()[1].getSelected() === true) {
					_that.InfoMsg = "X";
				} else {
					_that.InfoMsg = "";
				}
				if (tableItem.getSelectedItems()[i].getCells()[4].getValue() === "") {
					_that.flagU = "";
					_that.warnQty = "X";
				} else {
					_that.flagU = "";
					_that.warnQty = "";
				}
				if (tableItem.getSelectedItems()[i].getCells()[5].getValue() === "") {
					_that.flagU = "";
					_that.warnSkid = "X";
				} else {
					_that.flagU = "";
					_that.warnSkid = "";
				}
			}
			if (tableItem.getItems().length === tableItem.getSelectedItems().length) {
				_that.flagU = "";
				_that.SelectedFlag = "";
			} else {
				_that.flagU = "X";
				_that.SelectedFlag = "X";
				return;
			}
		},
		_getItemsData: function (Items, tableItem) {
			var shipwt, Skidwt, Bandwt, Inventorywt, qua;
			// MALLIKA Full rejection Flag check
			// var FR_flag = 0;

			for (var k = 0; k < tableItem.getSelectedItems().length; k++) {
				if (tableItem.getSelectedItems()[k].getCells()[1].getItems()[0].getButtons()[0].getSelected() === true) {
					qua = "Y";
				} else if (tableItem.getSelectedItems()[k].getCells()[1].getItems()[0].getButtons()[0].getSelected() === false) {
					qua = "N";
				} else {
					qua = "";
				}
				if (displayFlag === "X") {
					if (tableItem.getSelectedItems()[k].getCells()[7].getItems()[1].getText().indexOf("(") > -1) {
						shipwt = tableItem.getSelectedItems()[k].getCells()[7].getItems()[1].getText().split("(")[0];
					} else {
						shipwt = tableItem.getSelectedItems()[k].getCells()[7].getItems()[1].getText();
					}
				} else {
					if (tableItem.getSelectedItems()[k].getCells()[7].getItems()[0].getValue().indexOf("(") > -1) {
						shipwt = tableItem.getSelectedItems()[k].getCells()[7].getItems()[0].getValue().split("(")[0];
					} else {
						shipwt = tableItem.getSelectedItems()[k].getCells()[7].getItems()[0].getValue();
					}
				}
				if (tableItem.getSelectedItems()[k].getCells()[5].getValue().indexOf("(") > -1) {
					Skidwt = tableItem.getSelectedItems()[k].getCells()[5].getValue().split("(")[0];
				} else {
					Skidwt = tableItem.getSelectedItems()[k].getCells()[5].getValue();
				}
				if (Skidwt === "") {
					Skidwt = "0.000";
				}
				if (tableItem.getSelectedItems()[k].getCells()[6].getText().indexOf("(") > -1) {
					Bandwt = tableItem.getSelectedItems()[k].getCells()[6].getText().split("(")[0];
				} else {
					Bandwt = tableItem.getSelectedItems()[k].getCells()[6].getText();
				}
				if (tableItem.getSelectedItems()[k].getCells()[12].getText().indexOf("(") > -1) {
					Inventorywt = tableItem.getSelectedItems()[k].getCells()[12].getText().split("(")[0];
				} else {
					Inventorywt = tableItem.getSelectedItems()[k].getCells()[12].getText();
				}

				var Fullrej = tableItem.getSelectedItems()[k].getCells()[2].getSelected();

				// if (Fullrej) {
				// 	FR_flag++;
				// }

				Items.push({
					Referenceid: _that.getView().byId("textRefId").getText(),
					Inbounddelno: _that.getView().byId("txtIndelivery").getText(),
					Shipmentno: _that.getView().byId("txtShip").getText(),
					Item: tableItem.getSelectedItems()[k].getCells()[10].getText(),
					Material: tableItem.getSelectedItems()[k].getCells()[11].getText(),
					Description: tableItem.getSelectedItems()[k].getCells()[0].getText(),
					Shipwt: shipwt,
					Skidwt: Skidwt,
					Bandwt: Bandwt,
					Inventorywt: Inventorywt,
					Batch: tableItem.getSelectedItems()[k].getCells()[3].getText(),
					Quality: qua,
					Quantity: tableItem.getSelectedItems()[k].getCells()[4].getValue(),
					Storageloc: tableItem.getSelectedItems()[k].getCells()[13].getValue(),
					Storagebin: tableItem.getSelectedItems()[k].getCells()[8].getValue(),
					Mixstock: tableItem.getSelectedItems()[k].getCells()[9].getSelectedItem().getProperty("text"),
					Moisturef: tableItem.getSelectedItems()[k].getCells()[14].getSelectedItem().getProperty("text"),
					Fullrej: Fullrej ? "Y" : "N"
				});
			}

			// if (FR_flag > 0 && FR_flag < Items.length) {
			// 	MessageBox.error("Please select Full Reject checkbox for all items to proceed\nor un-check");
			// 	return [];
			// }

			return Items;
		},
		updateGoods: function (Goods, Items, N, tableItem) {
			_that.oBusy = new sap.m.BusyDialog();
			_that.oBusy.open();
			Goods.IDelivery = _that.getView().byId("txtIndelivery").getText();
			Goods.IReferenceid = _that.getView().byId("textRefId").getText();
			Goods.IShipment = _that.getView().byId("txtShip").getText();
			Goods.IUpdate = "X";
			// Begin of changes for DF#762 for Latchford by PANIGRAHIG
			Goods.INavigation = _that.flagNav;
			// End of changes for DF#762 for Latchford by PANIGRAHIG
			Goods.Referenceid = _that.getView().byId("textRefId").getText();
			Goods.Inbounddelno = _that.getView().byId("txtIndelivery").getText();
			Goods.Shipmentno = _that.getView().byId("txtShip").getText();
			Goods.Plant = _that.getView().byId("txtPlant").getCustomData()[0].getKey();
			Goods.Carrier = _that.getView().byId("textCarrier").getText();
			Goods.Goodssupplier = _that.GoodssupplierCode;
			var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
				pattern: "yyyy-MM-dd"
			});
			Goods.Receiptdt = oDateFormat.format(new Date(_that.recptdt)) + "T00:00:00";
			if (_that.getView().byId("rbYes").getSelected() === true) {
				Goods.Paperwork = "Y";
			} else if (_that.getView().byId("rbNo").getSelected() === true) {
				Goods.Paperwork = "N";
			} else {
				Goods.Paperwork = "";
			}
			Goods.Zuom = _that.uom;
			if (_that.getView().byId("inputDW").getValue().indexOf("(") > -1) {
				Goods.Dunnagewt = _that.getView().byId("inputDW").getValue().split("(")[0];
			} else {
				Goods.Dunnagewt = _that.getView().byId("inputDW").getValue();
			}
			if (Goods.Dunnagewt === "") {
				Goods.Dunnagewt = "0.000";
			}
			if (_that.getView().byId("inputNW").getText().indexOf("(") > -1) {
				Goods.Netweight = _that.getView().byId("inputNW").getText().split("(")[0];
			} else {
				Goods.Netweight = _that.getView().byId("inputNW").getText();
			}
			if (Goods.Netweight === "") {
				Goods.Netweight = "0.000";
			}
			if (_that.getView().byId("inputIW").getText().indexOf("(") > -1) {
				Goods.Incomingwt = _that.getView().byId("inputIW").getText().split("(")[0];
			} else {
				Goods.Incomingwt = _that.getView().byId("inputIW").getText();
			}
			if (Goods.Incomingwt === "") {
				Goods.Incomingwt = "0.000";
			}
			if (_that.getView().byId("inputOW").getText().indexOf("(") > -1) {
				Goods.Outgoingwt = _that.getView().byId("inputOW").getText().split("(")[0];
			} else {
				Goods.Outgoingwt = _that.getView().byId("inputOW").getText();
			}
			if (Goods.Outgoingwt === "") {
				Goods.Outgoingwt = "0.000";
			}
			var oItems = _that._getItemsData(Items, tableItem);
			// if (oItems.length == 0) {
			// 	jQuery.sap.delayedCall(1500, _that, function () {
			// 		_that.oBusy.close();
			// 	});
			// 	return;
			// }

			Goods.NavMRDetail = oItems;
			var saveModel = new sap.ui.model.odata.ODataModel(_that.sServiceUrl);
			var path = "/MRDetailSet";
			var parameter = {
				success: jQuery.proxy(this.handleSubmitSuccessPerm, this),
				error: jQuery.proxy(this.handleSubmitFailure, this),
				async: true
			};
			saveModel.create(path, Goods, parameter);

		},
		handleSubmitSuccessPerm: function (oData, oResponse) {
			jQuery.sap.delayedCall(1500, _that, function () {
			 	_that.oBusy.close();
			 });
			_that.getView().byId("btnSave").setBusy(false);
			// Begin of changes by Sri Save while print
			if (_that.print === "X") {
				if (_that.InfoMsg === "X") {
					MessageBox.show(
						"Please create NCR for the items quality ‘N’", {
							icon: sap.m.MessageBox.Icon.SUCCESS,
							title: "Information",
							onClose: function () {
								_that.onPrint();
							}
						}
					);
				} else {
					_that.onPrint();
				}
				_that.print = "";
			} else {
				//End of changes by Sri Save while print
				var message = oResponse.data.NavMRDetail.results[0].EMessage;
				sap.m.MessageBox.show(message, {
					icon: sap.m.MessageBox.Icon.SUCCESS,
					title: "Success",
					onClose: function () {
						if (_that.InfoMsg === "X") {
							MessageBox.information(
								"Please create NCR for the items quality ‘N��");
						}
					}
				});
			} // changes by Sri Save while print
		},
		handleSubmitFailure: function (response) {
			jQuery.sap.delayedCall(1500, _that, function () {
				_that.oBusy.close();
			});
			_that.getView().byId("btnSave").setBusy(false);
			var r = $.parseXML(response.response.body);
			var msg = r.querySelector("message");
			MessageBox.error(msg.textContent);
		},
		onMoisture: function (oEvent) {
			var tModel = new sap.ui.model.odata.ODataModel(_that.sServiceUrl);
			var tableItem = _that.getView().byId("idGoodReceiptTable");
			if (tableItem.getSelectedItems().length > 1) {
				MessageBox.error("Please select only one item !");
			} else {
				var matnr = tableItem.getSelectedItems()[0].getCells()[11].getProperty("text");
				var batch = tableItem.getSelectedItems()[0].getCells()[3].getProperty("text");
				var plant = _that.getView().byId("inputPlant").getValue();
				var path = "/MoistureSet(IBatch='" + batch + "',IMatnr='" + matnr + "',IPlant='" + plant + "')";
				tModel.read(path, null, null, true,
					function (oData) {
						var sURL;
						if (oData) {
							if (oData.ETcode === "") {
								MessageBox.error("No Insp. Lot Exists !");
							} else {
								sURL = oData.EHostname +
									"/sap/bc/gui/sap/its/webgui?~transaction=*" + oData.ETcode + " QALS-PRUEFLOS= " +
									oData.EPrueflos + ";DYNP_OKCODE= =ENT0";
								sap.m.URLHelper.redirect(sURL, true);
								//var tcodevalue = "*" + oData.ETcode + " QALS-PRUEFLOS=" + oData.EPrueflos + ";DYNP_OKCODE=/00";
								// var tcodevalue = "*QE02 QALS-PRUEFLOS=010000249673;DYNP_OKCODE=/00";
								//var sidDescvalue = "Novelis Global SAP \- D1E DEV\+1 ECC Single Sign\-on";
								//_that.onMoisture1(tcodevalue, sidDescvalue);
							}
						}
					});
			}
		},
		onMoisture1: function (tcodevalue, sidDescvalue) {
			var tcode = tcodevalue;
			_that.clnt = "D1ECLNT300";
			var sid = "";
			var client = "";
			if (_that.clnt) {
				var clientSplit = _that.clnt.split("CLNT");
				sid = clientSplit[0];
				client = clientSplit[1];
			}
			var string = "[System]" + "\r\n" + "Description=" + sidDescvalue + "\r\n" + "Name=" + sid + "\r\n" + "Client=" + client + "\r\n" +
				"[User]" + "\r\n" + "[Function]" + "\r\n" + "Command=" + tcode + "\r\n" + "Title=" + description + "\r\n" + "Type=Transaction" +
				"\r\n" +
				"[Configuration]" + "\r\n" + "[Options]" + "\r\n" + "Reuse=1" + "\r\n";
			var blob = new Blob([string], {
				type: "application/x-sapshortcut;charset=utf-8"
			});
			saveAs(blob, "launch.sap");
		},
		onNCR: function (oEvent) {
			var ncrModel = new sap.ui.model.odata.ODataModel(_that.sServiceUrl);
			var tableItem = _that.getView().byId("idGoodReceiptTable");
			var qualityY = tableItem.getSelectedItems()[0].getCells()[1].getItems()[0].getButtons()[0].getSelected();
			if (tableItem.getSelectedItems().length > 1) {
				MessageBox.error("Please select only one item !");
			} else {
				if (qualityY === true) {
					MessageBox.error("Please choose Quality ‘N’ to create NCR !");
					return;
				}
				var batch = tableItem.getSelectedItems()[0].getCells()[3].getText();
				var iDelivery = _that.getView().byId("txtIndelivery").getText();
				var Item = tableItem.getSelectedItems()[0].getCells()[10].getText();
				var matnr = tableItem.getSelectedItems()[0].getCells()[11].getText();
				var plant = _that.getView().byId("inputPlant").getValue();
				var storageLoc = tableItem.getSelectedItems()[0].getCells()[13].getValue();
				var referenceId = _that.getView().byId("textRefId").getText();
				_that.oBusy = new sap.m.BusyDialog();
				_that.oBusy.open();
				var path = "/NCRSet(IBatch='" + batch + "',IInbounddelivery='" + iDelivery + "',IItem='" + Item + "',IMaterial='" + matnr +
					"',IPlant='" + plant + "',IStoragelocation='" + storageLoc + "',IReferenceid='" + referenceId + "')";
				ncrModel.read(path, null, null, true,
					function (oData) {
						jQuery.sap.delayedCall(1500, _that, function () {
							_that.oBusy.close();
						});
						var sURL;
						if (oData) {
							if (oData.ETcode === "" || oData.ENotiftype === "" || oData.ENotification === "") {
								MessageBox.error("Notification not created for the selected item");
							} else {
								sURL = oData.EHostname + "/sap/bc/gui/sap/its/webgui?~transaction=*" + oData.ETcode + " RIWO00-QMNUM=" +
									oData.ENotification + ";DYNP_OKCODE= /00";
								sap.m.URLHelper.redirect(sURL, true);
								//var tcodevalue = "*" + oData.ETcode + " RIWO00-QMNUM=" + oData.ENotification + ";DYNP_OKCODE=/00";
								// var tcodevalue = "*QM02 RIWO00-QMNUM=200000132;DYNP_OKCODE=/00";
								//var sidDescvalue = "D1E300"; //"Novelis Global SAP \- D1E DEV\+1 ECC Single Sign\-on";
								//_that.onNCR1(tcodevalue, sidDescvalue);
							}
						}
					});
			}
		},
		onNCR1: function (tcodevalue, sidDescvalue) {
			var tcode = tcodevalue;
			_that.clnt = "D1ECLNT300";
			var sid = "";
			var client = "";
			if (_that.clnt) {
				var clientSplit = _that.clnt.split("CLNT");
				sid = clientSplit[0];
				client = clientSplit[1];
			}
			var string = "[System]" + "\r\n" + "Description=" + sidDescvalue + "\r\n" + "Name=" + sid + "\r\n" + "Client=" + client + "\r\n" +
				"[User]" + "\r\n" + "[Function]" + "\r\n" + "Command=" + tcode + "\r\n" + "Title=D1E" + "\r\n" + "Type=Transaction" +
				"\r\n" + "[Configuration]" + "\r\n" + "[Options]" + "\r\n" + "Reuse=1" + "\r\n";
			debugger;
			var blob = new Blob([string], {
				type: "application/x-sapshortcut;charset=utf-8"
			});
			saveAs(blob, "launch.sap");
		},
		enableSubmit: function (oEvent) {
			var printer = sap.ui.getCore().byId("printer").getSelectedKey();
			var labels = sap.ui.getCore().byId("nosLabels").getValue();
			var parent = oEvent.getSource().getParent().getParent().getParent().getParent().getParent();
			if (printer === -1 || labels.length === 0) {
				parent.getBeginButton().setEnabled(false);
			} else {
				parent.getBeginButton().setEnabled(true);
			}
		},
		closePrintersDialog: function () {
			_that.oPrinterDialog.destroy();
		},
		// Begin of changes for Sri save while print
		onPrintSave: function (oEvent) {
			_that.print = "X";
			_that.onSave(oEvent);
		},
		// End of changes for sri save while print
		onPrint: function () {
			var plant = this.getView().byId("inputPlant").getValue();
			if (_that.IPrinterPlants.indexOf(plant) === -1) {
				_that._onPrintSubmit();
			} else {
				_that._loadPrinters();
				_that.oPrinterDialog = sap.ui.xmlfragment("GoodReceipt.view.fragments.PrinterDialog", _that);
			}
		},
		_loadPrinters: function () {
			sap.ui.core.BusyIndicator.show();
			var plant = this.getView().byId("inputPlant").getValue();
			var URL = "/TprintersSet?$filter=IPlant eq '" + plant + "'";
			var oPrinterModel = new sap.ui.model.odata.ODataModel(_that.sServiceUrl);
			oPrinterModel.read(URL, null, null, true, function (oData) {
				if (oData) {
					var pModel = new JSONModel(oData.results);
					_that.oPrinterDialog.setModel(pModel, "oPrinterModel");
					jQuery.sap.delayedCall(1500, _that, function () {
						sap.ui.core.BusyIndicator.hide();
					});
					_that.oPrinterDialog.open();
				}
			});
		},
		_onPrintSubmit: function () {
		//	_that.oBusy = new sap.m.BusyDialog();
		//	_that.oBusy.open();
			var ItemTable = _that.getView().byId("idGoodReceiptTable");
			var oTable = this.getView().byId("idGoodReceiptHeaderTable");
			var oPrintModel = new sap.ui.model.odata.ODataModel(_that.sServiceUrl, true);
			var batchChanges = [];
			var oDateFormat = sap.ui.core.format.DateFormat
				.getDateTimeInstance({
					pattern: "yyyy-MM-dd"
				});
			var Receiptdt = oDateFormat.format(new Date(_that.recptdt)) + "T00:00:00";
			var plant = this.getView().byId("inputPlant").getValue();
			var printer, labels;
			if (_that.IPrinterPlants.indexOf(plant) === -1) {
				printer = "";
				labels = 1;
			} else {
				printer = sap.ui.getCore().byId("printer").getSelectedKey();
				labels = parseInt(sap.ui.getCore().byId("nosLabels").getValue(), 10);
			}
			for (var k = 0; k < ItemTable.getSelectedItems().length; k++) {
				var Entry = {
					// changes 17-04-2019 start
					Lifex: _that.getView().byId("textRefId").getText(),
					// changes 17-04-2019 end
					Matnr: ItemTable.getSelectedItems()[k].getCells()[11].getText(),
					Zbloc: ItemTable.getSelectedItems()[k].getCells()[8].getValue(),
					Charg: ItemTable.getSelectedItems()[k].getCells()[3].getText(),
					Zpieces: ItemTable.getSelectedItems()[k].getCells()[4].getValue(),
					Mixsf: ItemTable.getSelectedItems()[k].getCells()[9].getSelectedItem().getProperty("text"),
					Budat: Receiptdt,
					Maktx: ItemTable.getSelectedItems()[k].getCells()[0].getText(),
					Lifnr: _that.GoodssupplierCode,
					IPlant: plant,
					IPrinter: printer,
					ISheets: labels,
					// changes MALLIKA FY21Q1
					Znetgew: _that.getView().byId("inputNW").getText(),
					Zuom: _that.uom
				};
				batchChanges.push(oPrintModel.createBatchOperation("BatchLabelSet", "POST", Entry));
			}
			if (_that.oPrinterDialog) {
				_that.closePrintersDialog();
			}
			oPrintModel.addBatchChangeOperations(batchChanges);
			oPrintModel.setUseBatch(true);
			oPrintModel.submitBatch(function (data) {
				if (data.__batchResponses[0].response) {
					MessageBox.show(jQuery.parseJSON(data.__batchResponses[0].response.body).error.message.value, {
						icon: MessageBox.Icon.ERROR,
						title: "Error"
					});
				} else {
					MessageBox.show("Labels are printed successfully!!", {
						icon: MessageBox.Icon.SUCCESS,
						title: "Success"
					});
				}
				jQuery.sap.delayedCall(1500, _that, function () {
					_that.oBusy.close();
				});
			}, function (err) {
				MessageBox.error("Error!", {
					icon: MessageBox.Icon.ERROR,
					title: "Error!!"
				});
				jQuery.sap.delayedCall(1500, _that, function () {
					_that.oBusy.close();
				});
			});
		},
		_TableSettiing: function () {
			// set explored app's demo model on this sample
			var oGroupingModel = new sap.ui.model.json.JSONModel({
				hasGrouping: false
			});
			this.getView().setModel(oGroupingModel, "Grouping");
			if (!this._oTPC) {
				// init and activate controller
				this._oTPC = new TablePersoController({
					table: _that.getView().byId("idGoodReceiptHeaderTable"),
					componentName: "GoodReceipt",
					persoService: DemoPersoService
				}).activate();
			}
		},
		_TableDetailSetting: function () {
			// set explored app's demo model on this sample
			var oGroupingModel = new sap.ui.model.json.JSONModel({
				hasGrouping: false
			});
			this.getView().setModel(oGroupingModel, "Grouping");
			if (!this._oTPC1) {
				// init and activate controller
				this._oTPC1 = new TablePersoController({
					table: _that.getView().byId("idGoodReceiptTable"),
					componentName: "GoodReceipt",
					persoService: DemoPersoService
				}).activate();
			}
		},
		dateTime: function (date) {
			if (!date) {
				return null;
			} else {
				var oDateFormat = sap.ui.core.format.DateFormat.getDateTimeInstance({
					pattern: _that.datePattern.replace(/D/gi, "d")
				});
				return oDateFormat.format(new Date(date));
			}
		},
		_setFooterDisable: function () {
			_that.getView().byId("btnSave").setVisible(false);
			_that.getView().byId("btnPrint").setVisible(false);
			_that.getView().byId("btnNCR").setVisible(false);
			_that.getView().byId("btnMoisture").setVisible(false);
		},
		_setFooterEnable: function () {
			_that.getView().byId("btnSave").setVisible(true);
			_that.getView().byId("btnPrint").setVisible(true);
			_that.getView().byId("btnNCR").setVisible(true);
			_that.getView().byId("btnMoisture").setVisible(true);
		},
		onPrintJsBtn: function () {
			var headerModel = _that.getView().getModel("headerModel");
			var detailModel = _that.getView().getModel("detailModel").getData();
			var selItem = headerModel.getData().results[selectedIndex];
			var doc = new jsPDF("p", "pt", "a4");
			var columns = [{
				title: "Material",
				dataKey: "mat"
			}, {
				title: "Description",
				dataKey: "desc"
			}, {
				title: "Batch#",
				dataKey: "batch"
			}, {
				title: "Pieces",
				dataKey: "pieces"
			}, {
				title: "Skid Weight",
				dataKey: "skidw"
			}, {
				title: "Banding Weight",
				dataKey: "bandw"
			}, {
				title: "Ship Weight",
				dataKey: "shipw"
			}, {
				title: "Net Weight",
				dataKey: "netw"
			}];
			var data = [];
			var tableItem = _that.getView().byId("idGoodReceiptTable");
			for (var i = 0; i < detailModel.NavMRDetail.results.length; i++) {
				data.push({
					"mat": detailModel.NavMRDetail.results[i].Material,
					"desc": detailModel.NavMRDetail.results[i].Description,
					"batch": detailModel.NavMRDetail.results[i].Batch,
					"pieces": tableItem.getSelectedItems()[i].getCells()[4].getValue(),
					"skidw": detailModel.NavMRDetail.results[i].Skidwt,
					"bandw": detailModel.NavMRDetail.results[i].Bandwt,
					"shipw": detailModel.NavMRDetail.results[i].Shipwt,
					"netw": detailModel.NavMRDetail.results[i].Inventorywt
				});
			}
			doc.setFontSize(14);
			doc.setFontType("bold");
			doc.text(300, 40, "Receipt Report", "center");
			doc.setFontSize(10);
			doc.setFontType("normal");
			var rowH = 80;
			doc.text(40, rowH, "Reference ID : " + selItem.Referenceid);
			doc.text(300, rowH, "Check In Date and Time : " + _that.dateTimeConverter(selItem.Actualcidt, selItem.Actualcitime));
			doc.text(40, rowH + 20, "Truck Number : " + selItem.Trucknum);
			doc.text(300, rowH + 20, "Delivery Point : " + selItem.Receivingpt);
			doc.text(40, rowH + 40, "Trailer Number : " + selItem.Trailernum);
			doc.text(300, rowH + 40, "Incoming Weight : " + detailModel.Incomingwt);
			doc.text(40, rowH + 60, "Inbound Delivery : " + detailModel.IDelivery);
			doc.text(300, rowH + 60, "Outgoing Weight : " + detailModel.Outgoingwt);
			doc.text(40, rowH + 80, "Carrier : " + detailModel.Carrier);
			doc.text(300, rowH + 80, "Dunnage Weight : " + _that.getView().byId("inputDW").getValue());
			doc.text(40, rowH + 100, "Goods Supplier : " + detailModel.Goodssuppliername);
			doc.text(300, rowH + 100, "Net Weight : " + _that.getView().byId("inputNW").getText());
			doc.text(40, rowH + 120, "Shipment Number : " + selItem.Shipmentno);
			doc.text(300, rowH + 120, "Status : " + selItem.Status);
			var tabH = rowH + 120 + 30;
			doc.setFontSize(12);
			doc.setFontType("bold");
			doc.text(40, tabH, "Materials");
			doc.setFontType("normal");
			doc.autoTable(columns, data, {
				startY: tabH + 10,
				margin: {
					horizontal: 40
				},
				styles: {
					fontSize: 8,
					overflow: "linebreak"
				},
				headerStyles: {
					halign: "center"
				},
				columnStyles: {
					"mat": {
						columnWidth: 65
					},
					"desc": {
						columnWidth: 65
					},
					"batch": {
						columnWidth: 55,
						halign: "center"
					},
					"pieces": {
						columnWidth: 55,
						halign: "center"
					},
					"skidw": {
						columnWidth: 55,
						halign: "center"
					},
					"bandw": {
						columnWidth: 55,
						halign: "center"
					},
					"shipw": {
						columnWidth: 55
					},
					"netw": {
						columnWidth: 55
					}
				}
			});
			if (sap.ui.Device.browser.name === "ie") {
				doc.save("Receipt_Report.pdf");
			} else {
				window.open(doc.output("bloburl"));
			}
		},
		dateTimeConverter: function (date, time) {
			if (!time && !date) {
				return "";
			} else {
				var otime = "";
				var odate = "";
				if (time) {
					otime = time.charAt(2) + time.charAt(3) + ":" + time.charAt(5) + time.charAt(6) + ":" + time.charAt(8) + time.charAt(9);
				}
				if (date) {
					var oDateFormat = sap.ui.core.format.DateFormat
						.getDateTimeInstance({
							pattern: _that.datePattern.replace(/D/gi, "d")
						});
					odate = oDateFormat.format(new Date(date));
				}
				return odate + " " + otime;
			}
		},
		handleCommentsOpenDialog: function () {
			_that.oCommentsDialog = sap.ui.xmlfragment("GoodReceipt.view.fragments.CommentDialog", _that);
			_that._readComments();
			//_that.oCommentsDialog.open();
		},
		_readComments: function () {
			var oReadModel = new sap.ui.model.odata.ODataModel(_that.sServiceUrl);
			var IShipment = _that.getView().getModel("detailModel").getData().IShipment;
			var URL = "/LongtextSet?$filter=(ICico eq '' and ICreupd eq '' and IGr eq 'X' and IShipment eq '" + IShipment + "')";
			oReadModel.read(URL, null, null, true,
				function (oData) {
					if (oData) {
						var commentsModel = new JSONModel();
						if (oData.results.length > 0) {
							oData.results[0].OldTdline = oData.results[0].Comment;
						} else {
							oData.results.push({
								Comment: "",
								OldTdline: ""
							});
						}
						commentsModel.setData(oData.results[0]);
						_that.oCommentsDialog.setModel(commentsModel, "commentsModel");
						_that.oCommentsDialog.open();
					}
				},
				function (response) {
					var r = $.parseXML(response.response.body);
					var msg = r.querySelector("message");
					MessageBox.error(msg.textContent);
				}
			);
		},
		onCommentSubmit: function (oEvent) {
			var commentsNewVal = sap.ui.getCore().byId("commentTextA").getValue();
			var commentsOldVal = "";
			if (_that.oCommentsDialog.getModel("commentsModel").getData()) {
				commentsOldVal = _that.oCommentsDialog.getModel("commentsModel").getData().OldTdline;
			}
			_that.oBusy = new sap.m.BusyDialog();
			_that.oBusy.open();
			var saveCmtsModel = new sap.ui.model.odata.ODataModel(_that.sServiceUrl);
			var path = "/LongtextSet";
			var parameter = {
				success: jQuery.proxy(this.submitCommentsSuccessPerm, this),
				error: jQuery.proxy(this.submitCommentsFailure, this),
				async: true
			};
			var updateData = {};
			updateData.ICico = "";
			updateData.IGr = "X";
			updateData.IReferenceid = _that.getView().getModel("detailModel").getData().IReferenceid;
			updateData.IShipment = _that.getView().getModel("detailModel").getData().IShipment;
			// updateData.Tdformat = "*";
			updateData.Comment = commentsNewVal;
			if (commentsNewVal !== commentsOldVal && commentsOldVal === "") {
				updateData.ICreupd = "C";
				saveCmtsModel.create(path, updateData, parameter);
			} else if (commentsNewVal !== commentsOldVal && commentsOldVal !== "") {
				updateData.ICreupd = "U";
				saveCmtsModel.create(path, updateData, parameter);
			} else {
				_that.oCommentsDialog.destroy();
				_that.oBusy.close();
			}
		},
		submitCommentsSuccessPerm: function (oData, oResponse) {
			_that.oCommentsDialog.destroy();
			jQuery.sap.delayedCall(1500, _that, function () {
				_that.oBusy.close();
			});
			sap.m.MessageBox.success("Comments saved successfully!");
		},
		submitCommentsFailure: function (response) {
			_that.oCommentsDialog.destroy();
			jQuery.sap.delayedCall(1500, _that, function () {
				_that.oBusy.close();
			});
			var r = $.parseXML(response.response.body);
			var msg = r.querySelector("message");
			MessageBox.error(msg.textContent);
		},
		closeCommentDialog: function () {
			_that.oCommentsDialog.destroy();
		}
	});
});