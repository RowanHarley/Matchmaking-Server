var WebSocketServer = require('ws').Server;
var express = require('express');
var http = require('http').createServer();
var server = new WebSocketServer({server: http});
var counter = 0;
var clients = [];
var clientsSearching = [];
var app = express();

app.get('/', function(req, res){
  res.sendFile(__dirname + '/client/index.html');
});

server.on("connection", function(conn){
	conn.id = counter++;
	clients[conn.id] = conn;
	console.log("Clients: " + clients);
	function close(id){
		console.log("Connection with id " + id + " has been closed");
		delete clients[id];
	}
	conn.on('message', handleMessage.bind(this, conn));
	conn.on('error', function(e){
		console.log("[ERROR] " + e);
	});
	conn.on('close', close.bind(conn.id));
});
function readInt8(offset, data){
	return data[offset];
}
function readString(offset, data, length){
	var i, string;
	string = '';
	i = offset;
	while (i < length) {
		string += String.fromCharCode(data[i]);
		i++;
	}
	return string;
}
function handleMessage(conn, data){
	if(data.length === 0){
		console.log("[ERROR] No data to handle!");
		return;
	}
	else {
		var firstByte = readInt8(0, data);
		
		// 109 == "m"
		if(firstByte === 109){
			var score = readInt8(1, data);
			var name = readString(2, data, data.byteLength);
			conn.name = name;
			conn.score = score;
			console.log("Finding a match for " + conn.name + " with a score of " + conn.score);
			clientsSearching[conn.id] = conn;
			console.log("Player id: " + conn.id);
			console.log("Player's searching are " + clientsSearching[0] + ", " + clientsSearching[1]);
			if(clientsSearching.length > 1){
				//setInterval(function(){
					for(var i = 0,j = 25; ; j+= 25){
						if(j > 500){
							clientsSearching[conn.id].send("MatchNotFound");
							break;
						}else {
							if(clientsSearching[conn.id].score < clientsSearching[i].score + j && clientsSearching[conn.id].score > clientsSearching[i].score - j && clientsSearching[i] != conn){
								clientsSearching[conn.id].send(("MatchFound+" + clientsSearching[i].name));
								break;
							}else{
								i++;
							}
						}
					}
				//}, 5000);
			}else{
				clientsSearching[conn.id].send("MatchNotFound");
				console.log("No matches found for " + conn.name + ".");
			}
		}
	}
}
function findMatch(clientsSearching, connId){
	
}
http.on('request', app);
http.listen(8080, function () { console.log('[SERVER] Listening on ' + http.address().port) });
