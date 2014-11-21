var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);


var potentials = {};
var mySockets = {};
var votes = {};

app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  // console.log(socket);
  mySockets[socket.id] = socket;

  socket.emit('initialize', votes);
  
  // socket.on('get chat history', function(msg) {
  //  // io.emit('initialize', pastWords);  
  //  console.log('passes');
  // }); 
  
  socket.on('chat message', function(msg){
    var sendList = {};

    // quits function if user submits same word
    if(potentials[socket.id] === msg) {
		return;
    }

    if(potentials[socket.id] in votes){
		votes[potentials[socket.id]]--;
    }
    
    if(votes[potentials[socket.id]] === 0) {
		delete votes[potentials[socket.id]];
    }

    // counts vote or adds new word
    if (msg in votes){
		votes[msg]++;
    } else {
		votes[msg] = 1;
    }

    // registers what you voted for
    potentials[socket.id] = msg;

    io.emit('chat message', votes);
    // pastWords.push(msg);
      // io.emit('chat message', msg);
    });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
