var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var redis = require("redis"),
  client = redis.createClient();

client.on("error", function (err) {
    console.log("Error " + err);
});

var pastWords = [];
var potentials = {};
var mySockets = {};
var votes = {};

var syncTime = 3;
var counter = syncTime;

var storyKeyCounter = 0;
var endStoryVote = {};

app.use(express.static(__dirname + '/public'));

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

  socket.on('new story vote', function(vote){
      endStoryVote[socket.id] = vote;
  });
});

function updateWord(){
    var voteCounter = 0;
    for (var vote in endStoryVote){
      if(endStoryVote[vote]){
        voteCounter++;
      }
    }

    var empty = true;
    for (var key in votes){
      if (votes.hasOwnProperty(key)){
         empty = false;
         break;
      }
    }
    if (empty && voteCounter===0){
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

    if(voteToAdd >= voteCounter){
      io.emit('server update', wordToAdd);
      pastWords.push(wordToAdd);
    }
    else {
      // client.set(storyKeyCounter, pastWords, redis.print);
      // client.get(storyKeyCounter, function(err, reply){
      //   console.log("from redis "+ reply.toString());
      // });
      if (pastWords.length !== 0) {
        io.emit('story complete');
        pastWords = [];
      }
    }

    votes = {};
    potentials = {};
}


  function updateTime(){

    counter --;
    io.emit('update time', counter);
    if (counter === 0){
      updateWord();
      counter = syncTime;
    }

  }


http.listen(3000, function(){
  console.log('listening on *:3000');
  setInterval(updateTime,(1000));
});























