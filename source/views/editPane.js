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
	name: "MyApps.EditPane",
	kind: "FittableRows",
	fit: true,
	style: "background: url(assets/bg.png);", 
	param : [],
	dupUsersMap: [], // dupUsersMap['fileX'] = {user1, user2}
	dupCmndsMap: [], // dupCmndsMap['fileY'] = {cmnd1, cmnd2}
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
		{kind: "onyx.Popup", name: "check", onShow: "showPopup", floating: true, centered: true, modal: true, scrim:true, 
		 style: "border: solid 1px; background-color: green;", components: [
			{tag: "p", components: [
				{kind: "enyo.Control", name: "popupContent", allowHtml: true, content: "This content is changed dynamically"}
			]}	
		]},

	],

	rendered: function() {
	},

	successUpdateConfigChannel: function(response, status, jqXHR) {
		this.$.fileStatus.setContent("File Saved");
	},

	btnClickSaveFile: function(inSender, inEvent) {
		var content = this.owner.$.sudoFiles.cm.getValue();

//		var content = CKEDITOR.instances['app_mainView_sudoEdit_edit'].getData();

		this.param[0] = this.owner.$.sudoFiles.session[0];
		this.param[1] = this.file[0][0].channel;
		this.param[2] = this.file[0][0].path;
		this.param[3] = false;
		this.param[4] = { 
							'contents' : content,
							'owner' : this.file[0][0].owner,
							'group' : this.file[0][0].group,
							'permissions' : $.xmlrpc.force('string',this.file[0][0].permissions),
							'binary' : false
						}
		
		// update sudoersFile
		this.owner.$.sudoFiles.sudoersFiles[this.file[0][0].path] = content;

		// mark modifications as saved
		this.owner.$.sudoFiles.fileModified=false;

		// transfer changes to SuSe-Manager
		this.owner.$.sudoFiles.xmlCall("configchannel.createOrUpdatePath", this.param, enyo.bind(this,"successUpdateConfigChannel"), enyo.bind(this.owner.$.sudoFiles,"errorSM"));
	},

	// Returns the first element from a list
	first: function(obj) {
		for( var a in obj) return a;
	},

	// Returns matches from a regular expression
	// If regex contains a groups you select a specific one with 'pos'
	getMatchesFrom: function( regex, lines, pos ) {
		var matches = [];
		while( nextMatch = regex.exec(lines) ) {
			matches.push( nextMatch[pos] );
		}
		return matches;
	},


	// Returns a list of sudoers 
	getUsersFrom : function( sudoersFile ) {
		var sudoers = this.owner.$.sudoFiles.sudoersFiles;
		var re = /User_Alias\s*(\w+)/g;
		var lines = sudoers[sudoersFile];
		var users = this.getMatchesFrom( re, lines, 1);
		return users;
	},

	// Returns a list of commands
	getCmndsFrom: function( sudoersFile ) {
		var sudoers = this.owner.$.sudoFiles.sudoersFiles;
		var re = /Cmnd_Alias\s*(\w+)\s*/g;
		var lines = sudoers[sudoersFile];
		var commands = this.getMatchesFrom( re, lines, 1);
		return commands;
	},

	// Returns duplicate items within list
	getDuplicatesFrom : function( list ) {
		var duplicates = [];
		list.sort();
		for( var i=0; i < list.length-1; i++) {
			if(list[i] == list[i+1]) {
				duplicates.push(list[i]);	
			}
		}
		return duplicates;
	},

	// Get Intersection of two arrays
	intersect : function(a, b) {
    	var t;
    	if (b.length > a.length) t = b, b = a, a = t; // indexOf to loop over shorter
    		return a.filter(function (e) {
        		if (b.indexOf(e) !== -1) return true;
    		});
	},	


	btnClickCheckFile: function(inSender, inEvent) {
		var sudoers = this.owner.$.sudoFiles.sudoersFiles;
		this.dupUsersMap = [];
		this.dupCmndsMap = [];


		// Get a list of users and commands from the current sudoers sample
		var sudoersSample = this.first(sudoers);
		var sampleUsers = this.getUsersFrom ( sudoersSample );
		var sampleCmnds = this.getCmndsFrom ( sudoersSample );

		// Check for duplicates within the same file
		var dupUsers = this.getDuplicatesFrom ( sampleUsers );	
		if(dupUsers.length>0) {
			this.dupUsersMap[sudoersSample] = dupUsers;
		}
		var dupCmnds = this.getDuplicatesFrom ( sampleCmnds );
		if(dupCmnds.length>0) {
			this.dupCmndsMap[sudoersSample] = dupCmnds;
		}


		// Match these users against all others in remaining sudoers-files
		for( var sudoFile in sudoers) {
			if(sudoFile!=sudoersSample) {
			
				/* USERS CHECK */	
				// Get users from current sudoers-file for comparison
				var curUsers = this.getUsersFrom ( sudoFile );
				var dupCurUsers = this.getDuplicatesFrom (curUsers); 
				// Get the intersection which are the duplicate users
				var dupUsers = this.intersect( sampleUsers, curUsers );
				if(dupCurUsers.length || dupUsers.length)
					this.dupUsersMap[sudoFile] = dupCurUsers.concat(dupUsers); 


				/* COMMANDS CHECK */
				var curCmnds = this.getCmndsFrom ( sudoFile );
				var dupCurCmnds = this.getDuplicatesFrom( curCmnds ); 
				var dupCmnds = this.intersect( sampleCmnds, curCmnds ); 
				if(dupCurCmnds.length || dupCmnds.length)
					this.dupCmndsMap[sudoFile] = dupCurCmnds.concat(dupCmnds);  

			}
		}

		this.$.check.show();
	},

	showPopup:	function() {
		/* Duplicate Users? */	
		// get number of keys of an associative-array
		var numDupUsers = Object.keys(this.dupUsersMap).length;
		var numDupCmnds = Object.keys(this.dupCmndsMap).length;
		var Msg = "";


		if(numDupUsers || numDupCmnds) {
			this.$.check.applyStyle("background-color", "red");
			if(numDupUsers)
				Msg = "<b>Duplicates User:</b></br>";
			for( var file in this.dupUsersMap) {
				Msg = Msg + this.dupUsersMap[file] + " in " + file + "</br>";
			}
			if(numDupUsers)
				Msg = Msg + "</br></br>";


			if(numDupCmnds)
				Msg = Msg+ "<b>Duplicate Command:</b></br>";
			for( var file in this.dupCmndsMap) {
				Msg = Msg + this.dupCmndsMap[file] + " in " + file + "</br>"; 
			}
		
		}
		else { 
			this.$.check.applyStyle("background-color", "green");
			Msg="All OK, there are no duplicates!";
		}

		this.$.popupContent.setContent(Msg);

	},

	contentChanged : function() {
		console.log("ContentChanged!!");

	},

});
