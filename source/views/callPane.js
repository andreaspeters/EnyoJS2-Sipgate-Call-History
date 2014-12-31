/*
	Author: 	Andreas Peters
	EMail:  	mailbox[@]andreas-peters[dot]net
	Homepage:	www.andreas-peters.net
*/
/*
	This program is free software: you can redistribute it and/or modify
	it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/
enyo.kind({
	name: "MyApps.CallPane",
	kind: "FittableRows",
	fit: true,
	mainMenuPanelsCount: 0,
	config: {'user': '', 'passwd': ''},
	menu: [],
	authtoken: "",
	sudoersFiles: {},
	fileModified: false,
	dbStorage: "",
	components:[
		{kind: "onyx.Toolbar", style:"height: 45px; font-size: 17px;", components: [
			{content: "Call History"},
			{name: "balance"},
			{name: "balanceCurrency"}
		]},
		{kind: "List", count: 2000, name: "callList", fit: true, onSetupItem: "setupCallList", components: [
			{class: "item", name: "item", components: [
				{name: "callStatus", classes: "nice-padding", allowHtml: true},
				{name: "callUri", classes: "nice-padding", allowHtml: true},
				{name: "callTime", classes: "nice-padding", allowHtml: true},
				{name: "callType", classes: "nice-padding", allowHtml: true}
			]}
		]},
		{kind: "onyx.Toolbar", style: "height: 45px", components: [
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", name: "btnSettings", ondown: "clickSettings", src:"assets/enyo-icons-master/spaz_enyo1_icons/icon-settings.png", style: "margin-top: -6px;"},
				{kind: "onyx.Tooltip", content: "Konfiguration"}
			]},
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", name: "btnReload", ondown: "clickReload", src:"assets/enyo-icons-master/spaz_enyo1_icons/icon-refresh.png", style: "margin-top: -6px;"},
				{kind: "onyx.Tooltip", content: "Reload"}
			]},
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", name: "btnInfo", ondown: "clickInfo", src:"assets/enyo-icons-master/sample_enyo2_icons/menu-icon-info.png", style: "margin-top: -6px;"},
				{kind: "onyx.Tooltip", content: "Info"}
			]}
		]},


		// Konfigurations Dialog 
		{kind: "onyx.Popup", name: "settings", floating: true, centered: true, modal: true, scrim:true, components: [
			{tag: "hr", content: "Sipgate Login Information"},
			{tag: "p", components: [
				{kind: "onyx.InputDecorator", style: "width:91%", components: [
					{kind: "onyx.Input", name: "username", placeholder: "Your Username"}
				]}
			]},
			{kind: "onyx.InputDecorator", style: "width:91%", components: [
				{kind: "onyx.Input", name: "password", placeholder: "Your Password", type: "password"}
			]},
			{tag: "p", components: [
				{kind: "onyx.Button", name: "btnSaveSettings", ondown: "btnClickSaveSettings", style: "width: 50%;", content: "Save", classes: "onyx-affirmative"},
				{kind: "onyx.Button", name: "btnCancelSettings", ondown: "btnClickCancelSettings", style: "width: 40%; margin-left: 15px;", content: "Cancel", classes: "onyx-negative"}
			]}
		]},

		// Call2Click Dialog
		{kind: "onyx.Popup", name: "callPhone", floating: true, centered: true, modal: true, scrim:true, components: [
			{tag: "hr", content: "Call2Click"},
			{name: "phoneNumber"},
			{tag: "p", components: [
				{kind: "onyx.Button", name: "btnStartCallPhone", ondown: "btnClickStartCallPhone", style: "width: 50%;", content: "CALL", classes: "onyx-affirmative"},
				{kind: "onyx.Button", name: "btnCancelCallPhone", ondown: "btnClickCancelCallPhone", style: "width: 40%; margin-left: 15px;", content: "Cancel", classes: "onyx-negative"}
			]}
		]},

		// Info Dialog 
		{kind: "onyx.Popup", name: "info", floating: true, centered: true, modal: true, scrim:true, components: [
			{content: "Info"},
			{tag: "hr"},
			{content: "Callmanager for Sipgate - Version 0.0.1"},
			{content: "by avEnter UG (haftungsbeschraenkt)"},
			{content: "License: GNU General Public License"},
			{content: 'Please Donate: <a href="https://www.aventer.biz/104-0-donate.html">https://www.aventer.biz/104-0-donate.html</a> ', allowHtml: true}
			
		]},
	],

    makeAuthToken: function(username, password) {
        var tok = username + ":" + password;
        var hash = base64_encode(tok);
        return "Basic " + hash;
    },

	xmlCall: function(method, para, successFunction, errorFunction) {
		$.xmlrpc({
    			url: 'https://@samurai.sipgate.net/RPC2',
				methodName: method,
    			params: para,
				headers: { 'Authorization': this.authtoken },
			    success: successFunction,
    			error: errorFunction
		});
	},

	successLogin: function(response, status, jqXHR) {
		this.session = response;
		this.loadHistory(this)
	},

	successGetHistory: function(response, status, jqXHR) {
		this.session = response;
		this.calls = $.xmlrpc.parseDocument(jqXHR.responseXML);
		this.$.callList.setCount(this.calls[0].History.length);
		this.$.callList.render();

		this.$.callList.scrollToBottom();
	},

	successGetBalance: function(response, status, jqXHR) {
		this.session = response;
		this.balance = $.xmlrpc.parseDocument(jqXHR.responseXML);

		this.$.balance.setContent(this.balance[0].CurrentBalance.TotalIncludingVat);
		this.$.balanceCurrency.setContent(this.balance[0].CurrentBalance.Currency);
	},

	successTakeCall: function(response, status, jqXHR) {
		this.session = response;
		this.call2click = $.xmlrpc.parseDocument(jqXHR.responseXML);

		console.log(this.call2click);
	},

	setupCallList: function(inSender, inEvent) {
		switch (this.calls[0].History[inEvent.index].Status) {	
			case "missed":
				this.$.callStatus.setClasses("callmissed");
				break;
			case "outgoing":
				this.$.callStatus.setClasses("calloutgoing");
				break;
			case "accepted":
				this.$.callStatus.setClasses("callaccepted");
				break;
		}
		this.$.callUri.setContent(this.calls[0].History[inEvent.index].RemoteUri);
		this.$.callTime.setContent(this.calls[0].History[inEvent.index].Timestamp);

		if (inSender.isSelected(inEvent.index)) {
			this.remoteUri = this.calls[0].History[inEvent.index].RemoteUri;
			this.localUri = this.calls[0].History[inEvent.index].LocalUri;

			this.$.callPhone.show();
			this.$.phoneNumber.setContent(this.remoteUri);
		}
    },

	error: function(jqXHR, status, error) {
		console.log("Error: "+error+status);
	},

	clickSettings: function(inSender, inEvent) {
		this.$.settings.show();

		this.$.username.setValue(localStorage.getItem('username'));
		this.$.password.setValue(localStorage.getItem('password'));
	},

	btnClickCancelSettings: function(inSender, inEvent) {
		this.$.settings.hide();
	},

	btnClickCancelCallPhone: function(inSender, inEvent) {
		this.$.callPhone.hide();
	},

	btnClickStartCallPhone: function(inSender, inEvent) {
		//curl -u USERNAME:PASSWORD https://api.sipgate.net/my/xmlrpcfacade/samurai.SessionInitiate/ -d '{"RemoteUri":"tel:492111234567","TOS":"voice","LocalUri":"sip:12...@sipgate.de"}'	
		var param = new Array();

		param[0] = new Object();
		param[0]["RemoteUri"] = this.remoteUri;
		param[0]["TOS"] = "voice";
		param[0]["LocalUri"] = this.localUri;


		this.xmlCall("samurai.SessionInitiate", param, enyo.bind(this,"successTakeCall"), enyo.bind(this,"error"));
	},

	clickReload: function(inSender, inEvent) {
		this.loadHistory(this);
	},

	clickInfo: function(inSender, inEvent) {
		this.$.info.show();
	},

	loadHistory: function(inSender) {
		var param = new Array();

		param[0] = new Object();
		param[0]["LocalUriList"] = new Array();
		param[0]["StatusList"] = new Array();

		this.xmlCall("samurai.HistoryGetByDate", param, enyo.bind(this,"successGetHistory"), enyo.bind(this,"error"));
	},

/*
	Function:		btsSaveSettings
	Description:	Save the user credentials and serverstring into a html5 localdb
	Parameter:		Button object Sender and Event
*/
	btnClickSaveSettings: function(inSender, inEvent) {
		localStorage.setItem("username", this.$.username.value);
		localStorage.setItem("password", this.$.password.value);

		this.$.settings.hide();

		this.render();
	},


	rendered: function() {
		// Get out user credentials from the localstorage 
		try {
			this.config['user']   = localStorage.getItem('username');
			this.config['passwd'] = localStorage.getItem('password');
		} catch (e) {
		}

		this.authtoken = this.makeAuthToken(this.config['user'], this.config['passwd']);

		var param = new Array();

		param[0] = new Object();
		param[0]["ClientName"] = "Sipgate WebOS";
		param[0]["ClientVersion"] = "0.0.1";
		param[0]["ClientVendor"] = "www.aventer.biz";

		this.xmlCall("samurai.ClientIdentify", param, enyo.bind(this,"successLogin"), enyo.bind(this,"error"));

		this.xmlCall("samurai.BalanceGet", new Array(), enyo.bind(this,"successGetBalance"), enyo.bind(this,"error"));
	},
});
