// Fool the script into thinking Cordova is running (since we don't actually need it for webOS)
var cordova = {};

// Add our deviceready event
document.addEventListener('DOMContentLoaded', function () {
    // fire deviceready event; taken straight from phonegap-iphone
    // put on a different stack so it always fires after DOMContentLoaded
    window.setTimeout(function () {
        var e = document.createEvent('Events');
        e.initEvent('deviceready');
        document.dispatchEvent(e);
    }, 10);
});

// Subscribe to the deviceready event
enyo.dispatcher.listen(document, 'deviceready');

// Setup our custom webOS-to-Cordova event mappings
(function() {
    // Initialize our potentially-shared Mojo variable
    Mojo = window.Mojo || {};
    
    // Setup our generic event dispatching code
    var fireEvent = function(name, windowParams) {
        // Working with DOM-friendly browser
        var event = document.createEvent('Event');
        event.initEvent(name, true, true);
        if (typeof windowParams !== 'undefined') {
            event.windowParams = windowParams;
        }
        document.dispatchEvent(event);
    };
    
    // LunaSysMgr calls this when the windows is maximized or opened.
    Mojo.stageActivated = function() {
        fireEvent('resume');
    };

    // LunaSysMgr calls this when the windows is minimized or closed.
    Mojo.stageDeactivated = function() {
        fireEvent('pause');
    };

    // LunaSysMgr calls this whenever an app is "launched;" 
    Mojo.relaunch = function() {
        var windowParams = {};
        try {
            windowParams = enyo.json.parse(PalmSystem.launchParams);
        } catch (error) {
            enyo.error('applicationLaunch windowParams object is not valid JSON');
        }
        fireEvent('applicationrelaunch', windowParams);
        // need to return true to tell sysmgr the relaunch succeeded.
        // otherwise, it'll try to focus the app, which will focus the first
        // opened window of an app with multiple windows.
        return true;
    };
    
    // And finally setup our Enyo listeners
    enyo.dispatcher.listen(document, 'resume');
    enyo.dispatcher.listen(document, 'pause');
    enyo.dispatcher.listen(document, 'applicationrelaunch');
})();