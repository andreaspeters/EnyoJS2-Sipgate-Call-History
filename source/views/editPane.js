enyo.kind({
	name: "MyApps.EditPane",
	kind: "FittableRows",
	fit: true,
	style: "background: url(assets/bg.png);", 
	param : [],
	components:[
		{kind: "onyx.Toolbar", style:"height: 45px; font-size: 17px;", components: [
			{content: "Editor"}
		]},
		{tag: "h1", name: "title", content: ""},
		{kind: "onyx.InputDecorator", name: "fileEdit", fit: true},
		{kind: "onyx.MenuDecorator", name: "buttonDecorator"},
		{kind: "onyx.Toolbar", components: [
			{name: "fileStatus", fit: true}
		]},

		// Syntax Check Popup
		{kind: "onyx.Popup", name: "check", floating: true, centered: true, modal: true, scrim:true, components: [
			{tag: "hr", content: "Check sudo Files"},
			{tag: "p", components: [
			]}
		]}
	],

	rendered: function() {
	},

	successUpdateConfigChannel: function(response, status, jqXHR) {
		this.$.fileStatus.setContent("File Saved");
	},

	btnClickSaveFile: function(inSender, inEvent) {
		var content = CKEDITOR.instances['app_mainView_sudoEdit_edit'].getData();

		this.param[0] = this.owner.$.sudoFiles.session[0];
		this.param[1] = this.file[0][0].channel;
		this.param[2] = this.file[0][0].path;
		this.param[3] = false;
		this.param[4] = { 
							'contents' : $(content).text(),
							'owner' : this.file[0][0].owner,
							'group' : this.file[0][0].group,
							'permissions' : $.xmlrpc.force('string',this.file[0][0].permissions),
							'binary' : false
						}
		

		this.owner.$.sudoFiles.xmlCall("configchannel.createOrUpdatePath", this.param, enyo.bind(this,"successUpdateConfigChannel"), enyo.bind(this.owner.$.sudoFiles,"errorSM"));
	},

	btnClickCheckFile: function(inSender, inEvent) {
		this.$.check.show();
	},

});
