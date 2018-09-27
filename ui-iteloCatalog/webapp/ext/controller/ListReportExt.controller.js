sap.ui.define([
	"sap/ui/model/Filter",
	"sap/m/Token",
	"sap/m/RatingIndicator",
	"sap/m/MultiInput",
	"sap/ui/comp/smartfilterbar/SmartFilterBar"
], function(Filter, Token, RatingIndicator, MultiInput, SmartFilterBar) {
	"use strict";

	return sap.ui.controller("iteloCatalog.ext.controller.ListReportExt", {

		onInitSmartFilterBarExtension: function(oEvent) {
			// the custom field in the filter bar might have to be bound to a custom data model
			// if a value change in the field shall trigger a follow up action, this method is the place to define and bind an event handler to the field
		},

		onBeforeRebindTableExtension: function(oEvent) {
			// usually the value of the custom field should have an effect on the selected data in the table.
			// So this is the place to add a binding parameter depending on the value in the custom field.
			var oBindingParams = oEvent.getParameter("bindingParams");
			oBindingParams.parameters = oBindingParams.parameters || {};
			var oFilter,
				aFilters = [],
				oSmartTable = oEvent.getSource(),
				oSmartFilterBar = this.byId(oSmartTable.getSmartFilterId());

			if (oSmartFilterBar instanceof SmartFilterBar) {
				//Custom Supplier filter
				var oCustomControl = oSmartFilterBar.getControlByKey("supplier_ID");
				if (oCustomControl instanceof MultiInput) {
					aFilters = this._getTokens(oCustomControl, "supplier_ID");
					if (aFilters.length > 0) {
						oBindingParams.filters.push.apply(oBindingParams.filters, aFilters);
					}
				}
				//Custom average rating filter
				oCustomControl = oSmartFilterBar.getControlByKey("averageRating");
				if (oCustomControl instanceof RatingIndicator) {
					oFilter = this._getRatingFilter(oCustomControl);
					if (oFilter) {
						oBindingParams.filters.push(oFilter);
					}
				}
			}
		},

		onCustomSupplierDialogOpen: function() {
			if (!this._oSupplierDialog) {
				this._oSupplierDialog = sap.ui.xmlfragment("iteloCatalog.ext.fragment.CustomSupplierFilterSelectDialog", this);
			}
			this.getView().addDependent(this._oSupplierDialog);
			this._oSupplierDialog.open();
		},

		onHandleCustomSupplierDialogSearch: function(oEvent) {
			var sValue = oEvent.getParameter("value"),
				oFilter = new Filter("name", sap.ui.model.FilterOperator.Contains, sValue);
			oEvent.getSource().getBinding("items").filter([oFilter]);
		},

		onHandleCustomSupplierTableSelectDialogClose: function(oEvent) {
			var aSelectedContexts = oEvent.getParameter("selectedContexts");
			if (aSelectedContexts && aSelectedContexts.length >= 0) {
				var aTokens = [];
				for (var i = 0; i < aSelectedContexts.length; i++) {
					aTokens.push(new Token({
						key: aSelectedContexts[i].getObject().ID,
						text: aSelectedContexts[i].getObject().name
					}));
				}
				var oMultiInput = this.getView().byId("Supplier-multiinput");
				oMultiInput.setTokens(aTokens);
				oMultiInput.fireChange();
			}
			oEvent.getSource().getBinding("items").filter([]);
			this.getView().updateBindings();
		},

		getCustomAppStateDataExtension: function(oCustomData) {
			//the content of the custom field shall be stored in the app state, so that it can be restored later again e.g. after a back navigation.
			//The developer has to ensure, that the content of the field is stored in the object that is returned by this method.
			//Example:
			if (oCustomData) {
				var aKeyValues = [],
					oSmartFilterBar = this.byId("listReportFilter");
				if (oSmartFilterBar instanceof SmartFilterBar) {
					var oCustomControl = oSmartFilterBar.getControlByKey("averageRating");
					if (oCustomControl instanceof RatingIndicator) {
						oCustomData.AverageRatingValue = oCustomControl.getValue();
					}
					oCustomControl = oSmartFilterBar.getControlByKey("supplier_ID");
					if (oCustomControl instanceof MultiInput) {
						aKeyValues = this._getKeyValuePairs(oCustomControl);
						if (aKeyValues.length > 0) {
							oCustomData.Supplier = aKeyValues;
						}
					}
				}
			}
		},

		restoreCustomAppStateDataExtension: function(oCustomData) {
			//in order to to restore the content of the custom field in the filter bar e.g. after a back navigation,
			//an object with the content is handed over to this method and the developer has to ensure, that the content of the custom field is set accordingly
			//also, empty properties have to be set
			//Example:
			var oSmartFilterBar = this.byId("listReportFilter"),
				aTokens = [];

			if (oSmartFilterBar instanceof SmartFilterBar) {
				var oCustomControl;
				if (oCustomData.AverageRatingValue !== undefined) {
					oCustomControl = oSmartFilterBar.getControlByKey("averageRating");
					if (oCustomControl instanceof RatingIndicator) {
						oCustomControl.setValue(oCustomData.AverageRatingValue);
					}
				}
				if (oCustomData.Supplier !== undefined) {
					oCustomControl = oSmartFilterBar.getControlByKey("supplier_ID");
					if (oCustomControl instanceof MultiInput) {
						aTokens = this._createTokens(oCustomData.Supplier);
						if (aTokens.length > 0) {
							oCustomControl.setTokens(aTokens);
						}
					}
				}
			}
		},

		_getRatingFilter: function(oRatingSelect) {
			var sRating = oRatingSelect.getValue(),
				oFilter;
			if (sRating > 0) {
				//Apply lower and upper range for Average Rating filter
				var sRatingLower = sRating - 0.5;
				var sRatingUpper = sRating + 0.5;
				oFilter = new Filter("averageRating", sap.ui.model.FilterOperator.BT,
					sRatingLower, sRatingUpper);
			}
			return oFilter;
		},

		_getTokens: function(oControl, sName) {
			var aFilters = [],
				aTokens = oControl.getTokens();
			if (aTokens) {
				for (var i = 0; i < aTokens.length; i++) {
					aFilters.push(new Filter(sName, "EQ", aTokens[i].getProperty("key")));
				}
			}
			return aFilters;
		},

		_getKeyValuePairs: function(oCustomControl) {
			var aKeyValues = [],
				aTokens = oCustomControl.getTokens();
			if (aTokens) {
				for (var i = 0; i < aTokens.length; i++) {
					aKeyValues.push([aTokens[i].getProperty("key"), aTokens[i].getProperty("text")]);
				}
			}
			return aKeyValues;
		},

		_createTokens: function(oCustomField) {
			var aTokens = [];
			for (var i = 0; i < oCustomField.length; i++) {
				aTokens.push(new Token({
					key: oCustomField[i][0],
					text: oCustomField[i][1]
				}));
			}
			return aTokens;
		}

	});
});
