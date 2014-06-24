enyo.kind({
	name: "MyApps.FilesPane",
	kind: "FittableRows",
	fit: true,
	mainMenuPanelsCount: 0,
	config: {'smserver': "susemgr-ppd.ov.otto.de", 'smuser': 'andpeter', 'smpasswd': 'HARRIE'},
	menu: [],
	components:[
		{kind: "onyx.Toolbar", style:"height: 45px; font-size: 17px;", components: [
			{content: "Channels"}
		]},
		{kind: "enyo.Panels", name: "mainMenuPanels", fit: true, style: "background: url(assets/bg.png);", components: [
			{content:0, components: [
				{kind: "enyo.List", name: "channelList", fit: true, onSetupItem: "setupChannelList", components: [
					{class: "item", name: "item", components: [
						{name: "channelName", classes: "nice-padding", allowHtml: true}
					]}
				]}
			]}
		]},
		{kind: "onyx.Toolbar", style: "height: 45px", components: [
			{kind: "onyx.TooltipDecorator", components: [
				{kind: "onyx.IconButton", name: "btnSettings", ondown: "clickSettings", src:"assets/enyo-icons-master/spaz_enyo1_icons/icon-settings.png", style: "margin-top: -6px;"},
				{kind: "onyx.Tooltip", content: "Konfiguration"}
			]}
		]},


		// Konfigurations Dialog 
		{kind: "onyx.Popup", name: "settings", floating: true, centered: true, modal: true, scrim:true, components: [
			{tag: "hr", content: "SuSE Manager Login Information"},
			{tag: "p", components: [
				{kind: "onyx.InputDecorator", style: "width:91%", components: [
					{kind: "onyx.Input", name: "server", placeholder: "SuSE Manager Server Name"}
				]}
			]},
			{tag: "p", components: [
				{kind: "onyx.InputDecorator", style: "width:91%", components: [
					{kind: "onyx.Input", name: "username", placeholder: "Your Username"}
				]}
			]},
			{kind: "onyx.InputDecorator", style: "width:91%", components: [
				{kind: "onyx.Input", name: "password", placeholder: "Your Password", type: "password"}
			]},
			{tag: "p", components: [
				{kind: "onyx.Button", name: "btnSaveSettings", style: "width: 50%;", content: "Save", classes: "onyx-affirmative"},
				{kind: "onyx.Button", name: "btnCancelSettings", style: "width: 40%; margin-left: 15px;", content: "Cancel", classes: "onyx-negative"}
			]}
		]}
	],

	xmlCall: function(method, para, successFunction, errorFunction) {
		//console.log(JSON.stringify(para));
		$.xmlrpc({
    			url: 'http://'+this.config['smserver']+'/rpc/api',
			    methodName: method,
    			params: para,
			    success: successFunction,
    			error: errorFunction
		});
	},


	successSMLogin: function(response, status, jqXHR) {
		this.session = response;

		// Get config channel list
		this.xmlCall("configchannel.listGlobals", this.session, enyo.bind(this,"successGetConfigChannel"), enyo.bind(this,"errorSM"));
	},

	successGetConfigChannel: function(response, status, jqXHR) {
		this.channels = $.xmlrpc.parseDocument(jqXHR.responseXML);
		this.$.channelList.setCount(this.channels[0].length);
		this.$.channelList.render();
	},

	successGetFileList: function(response, status, jqXHR) {
		this.files = $.xmlrpc.parseDocument(jqXHR.responseXML);
		this.addPanel([this.files]);
	},

	successGetFileInfo: function(response, status, jqXHR) {
		this.fileInfo = $.xmlrpc.parseDocument(jqXHR.responseXML);
		var content = this.fileInfo[0][0].contents;
		var path = this.fileInfo[0][0].path;
		this.owner.$.sudoEdit.file = this.fileInfo;

		var res = content.replace(/\n/g,"<br />");

		this.owner.$.sudoEdit.$.title.setContent("File: "+path);

		// Editor Komponente Loeschen (falls vorhanden)
		try {
			this.owner.$.sudoEdit.$.edit.destroy();
			this.owner.$.sudoEdit.$.saveFile.destroy();
			this.owner.$.sudoEdit.$.checkFile.destroy();
		} catch (e) {
		}
		this.owner.$.sudoEdit.$.fileEdit.createComponent([{kind: "onyx.RichText", name: "edit"}], {owner: this.owner.$.sudoEdit});
		this.owner.$.sudoEdit.$.buttonDecorator.createComponent([{kind: "onyx.Button", name: "saveFile", onclick: "btnClickSaveFile", content: "SAVE", classes: "onyx-affirmative"}], {owner: this.owner.$.sudoEdit});
		this.owner.$.sudoEdit.$.buttonDecorator.createComponent([{kind: "onyx.Button", name: "checkFile", onclick: "btnClickCheckFile", content: "CHECK", classes: "onyx-blue"}], {owner: this.owner.$.sudoEdit});
		this.owner.$.sudoEdit.$.fileEdit.render();
		this.owner.$.sudoEdit.$.buttonDecorator.render();
		this.owner.$.sudoEdit.$.edit.setContent(res);
		CKEDITOR.replace("app_mainView_sudoEdit_edit", {toolbar: [[ 'Cut', 'Copy', 'Paste', 'PasteText', '-', 'Undo', 'Redo' ]]});
		CKEDITOR.config.height = 300;
		this.owner.$.sudoEdit.reflow();
	},

	setupChannelList: function(inSender, inEvent) {
		this.$.channelName.setContent(this.channels[0][inEvent.index].label);
		if (!this.files) {
			this.xmlCall("configchannel.listFiles", [this.session[0],this.channels[0][inEvent.index].label], enyo.bind(this, "successGetFileList"), enyo.bind(this, "errorSM"));
		}

		if (inSender.isSelected(inEvent.index)) {
			this.$.mainMenuPanels.setIndex(inEvent.index+1);
		}
	},

	setupFileList: function(inSender, inEvent) {
		if (this.$.mainMenuPanels.index > 0) {
			var item = this.menu[this.$.mainMenuPanels.index-1][0][0][inEvent.index];
			var i = this.$.mainMenuPanels.index - 1;


		 	eval("this.$.fileName_"+i+".setContent(\""+item.path+"\")");
			if (item.type == "file") {
			 	eval("this.$.fileType_"+i+".setSrc(\"source/style/file.png\")");
			} else {
			 	eval("this.$.fileType_"+i+".setSrc(\"source/style/folder.png\")");
			}
			if (inSender.isSelected(inEvent.index) && item.type == "file" ) {
				this.xmlCall("configchannel.lookupFileInfo", [this.session[0],this.channels[0][i].label,[item.path]], enyo.bind(this,"successGetFileInfo"), enyo.bind(this, "errorSM"));
			}	
		}
	},

	addPanel: function(item) {
		var i = this.mainMenuPanelsCount++;
		this.menu[i] = item;
		var newPanel = this.$.mainMenuPanels.createComponent([
				{kind: "enyo.List", name: "fileList_"+i, onSetupItem: "setupFileList", components: [
					{kind:"FittableColumns", components:[
						{name: "fileType_"+i, kind: "Image"}, 
						{name: "fileName_"+i, fit:true}
					]}
				]}
		], {owner: this});
		newPanel.setCount(item[0][0].length);
		newPanel.render();
		this.$.mainMenuPanels.reflow();
	},

	clickSettings: function(inSender, inEvent) {
		this.$.settings.show();
	},

	errorSM: function(jqXHR, status, error) {
		console.log("Error: "+error);
	},


	rendered: function() {
		// Login to SuSE Manager
		this.xmlCall("auth.login", [this.config['smuser'], this.config['smpasswd']], enyo.bind(this,"successSMLogin"), enyo.bind(this,"errorSM"));

	},
});
