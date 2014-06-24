enyo.kind({
	name: "MyApps.MainView",
	kind: "Panels",
	classes: "enyo-unselectable enyo-fit",
	arrangerKind: "CollapsingArranger",
	components:[
		{kind: "enyo.Panels", fit: true, arrangerKind: "CollapsingArranger", components: [
			{name: "sudoFiles", kind: "MyApps.FilesPane", style: "min-width: 300px"},
			{name: "sudoEdit", kind: "MyApps.EditPane"}
		]}
	]
});
