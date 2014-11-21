var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var pastWords = [];
var potentials = {};
var mySockets = {};
var votes = {};
var counter = 10;

app.get('/', function(req, res){
  res.sendfile(__dirname + '/index.html');
});

io.on('connection', function(socket){
  // console.log(socket);
  mySockets[socket.id] = socket;
  console.log(new Date().getTime());

  socket.emit('initialize', votes, pastWords);
  
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

function updateWord(){
    var empty = true;
    for (var key in votes){
      if (votes.hasOwnProperty(key)){
         empty = false;
         break;
      }
    }
    if (empty){
        return;
    }

    var voteToAdd = 0;
    var wordToAdd = "";
    for (var word in votes){
      if (votes[word] > voteToAdd){
        voteToAdd = votes[word];
        wordToAdd = word;
      }
    }

    io.emit('server update', wordToAdd);
    pastWords.push(wordToAdd);
    votes = {};
    potentials = {};

}


  function updateTime(){

    counter --;
    io.emit('update time', counter);
    if (counter === 0){
      updateWord();
      counter = 10;
    }

  }


http.listen(3000, function(){
  console.log('listening on *:3000');
  setInterval(updateTime,1000);
});























