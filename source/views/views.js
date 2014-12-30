enyo.kind({
	name: "MyApps.MainView",
	kind: "Panels",
	classes: "enyo-unselectable enyo-fit",
	arrangerKind: "CollapsingArranger",
	components:[
		{kind: "enyo.Panels", fit: true, arrangerKind: "CollapsingArranger", components: [
			{name: "callPane", kind: "MyApps.CallPane", style: "min-width: 10px"},
		]}
	]
});
