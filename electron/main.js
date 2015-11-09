var app = require('app'); 
var BrowserWindow = require('browser-window'); 
var request = require('request'); 
var ipc = require('ipc');
var crypto = require('crypto');
var request = require('request');
var dialog = require('dialog');
var exec = require('child_process').exec;


// Report crashes to our server.
require('crash-reporter').start();

var collection;

var mainWindow = null;
var collection_path = ""

app.on('ready', function() {
    mono = exec('mono ' + process.resourcesPath + '/Release/Traktor.exe', { cwd: undefined, env: '/usr/local/bin' }, function (error, stdout, stderr) {
    	dialog.showErrorBox('err', error.message);
    });

  	mainWindow = new BrowserWindow({width: 350, height: 600, resizable: false});
  	mainWindow.loadUrl('file://' + __dirname + '/app/index.html');

  	mainWindow.on('closed', function() {
		  mainWindow = null;
  	});
});

app.on('quit', function() {
	mono.kill('SIGINT');
});

app.on('window-all-closed', function() {
	app.quit();
});

ipc.on('collection-upload', function (event, arg) {
	collection_path = arg;
	request.post({
	  	headers: {'content-type' : 'application/x-www-form-urlencoded'},
	  	url:     'http://localhost:8083/collection',
	  	body:    arg
	}, function(error, response, body) {
		if (error != null) {
			console.log(error);
		}
		
		else {
			if (response.statusCode != 200) {
				console.log("Error: response was: " + response.statusCode);
				mainWindow.loadUrl('file://' + __dirname + '/app/index.html');
			}
			
			else {
				event.sender.send('collection-uploaded');
			}	
		}
	});
});

function createHash(s) {
    var sha256 = crypto.createHash("sha256");
    sha256.update(s, "utf8");
    return sha256.digest("base64");
}

ipc.on('song-drop', function (event, arg) {
	var hash = createHash(arg);
	
	request.get({
	  	url:     'http://localhost:8083/choose/' + hash,
	}, function(error, response, body) {
		if (error != null) {
			console.log(error);
		}
		
		else {
			event.sender.send('receive-transitions', body);
		}
	});
});