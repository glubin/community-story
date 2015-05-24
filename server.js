var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var mysql = require('mysql');

// mysql stuff
var connection = mysql.createConnection({
  host     : process.env.MYSQL_HOSTNAME,
  user     : process.env.MYSQL_USERNAME,
  password : process.env.MYSQL_PASSWORD,
  database : 'storiesDB'
});

connection.connect( function(err) {
  if (err) {
    console.error('error connecting: ' + err.stack);
    return;
  }
  console.log('connected to mysql server, id: ' + connection.threadId);
});

// keep the past [numRecentStories] stories in 
// memory for quick loading when new clients join
var numRecentStories = 3
var recentStories = []

var pastWords = [];
// dictionary mapping socket to votes for a word
var potentials = {};
// maps socket id to socket
var mySockets = {};
// maps word to the number of votes it has
var votes = {};


var syncTime = 6;
var counter = syncTime;

// dictionary mapping socket -> a vote to end the story
var endStoryVote = {};

app.use(express.static(__dirname + '/public'));

io.on('connection', function(socket){
  // Keep track of all current clients
  mySockets[socket.id] = socket;
  console.log(new Date().getTime());

  // Make sure new clients get current state of story/storyboard
  // *** need to add stuff for retrieving info from DB ***
  socket.emit('initialize', votes, pastWords, recentStories);

  socket.on('propose word', function(msg){
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

    io.emit('update proposed words', votes);
    // pastWords.push(msg);
      // io.emit('chat message', msg);
    });

  socket.on('new story vote', function(vote){
    endStoryVote[socket.id] = vote;
  });

  socket.on('get past stories', function() {
    connection.query('SELECT * FROM stories', function (err,res,fields) {
      if (err) {
        console.log('Query error: ' + err);
      }
      socket.emit('return stories from DB', res)
    });
  });
});

function updateWord(){
    // counts number of votes to end story
    var endCounter = 0;

    // goes through votes on all current votes
    // and counts # of people who want to end
    for (var vote in endStoryVote){
      if(endStoryVote[vote]){
        endCounter++;
      }
    }

    var empty = true;

    // check if there are any votes
    for (var key in votes){
      if (votes.hasOwnProperty(key)){
       empty = false;
       break;
     }
   }

    // no one voted, do nothing
    if (empty && endCounter===0){
      return;
    }

    // find most popular word
    var voteToAdd = 0;
    var wordToAdd = "";
    for (var word in votes){
      if (votes[word] > voteToAdd){
        voteToAdd = votes[word];
        wordToAdd = word;
      }
    }

    // decide whether to end story or add new word
    if(voteToAdd >= endCounter){
      // send update to all clients
      io.emit('server update', wordToAdd);
      // store new word in past words list
      pastWords.push(wordToAdd);
    } else {
      if (pastWords.length !== 0) {
        sendToDB(pastWords);

        // maintain recent stories queue
        if (recentStories.length >= numRecentStories) {
          recentStories.shift();
        }
        recentStories.push(pastWords.join(' '));

        // reset past words and send update to clients
        io.emit('story complete');
        pastWords = [];
      }
    }

  // clear dicts
  votes = {};
  potentials = {};
}

function sendToDB(pastWords) {
  var newEntry = {story: pastWords.join(' ')}
  connection.query('INSERT INTO stories SET ?', newEntry, function(err,res) {
    if (err) {
      console.log('Insert error: ' + err);
    }
  });
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
  // All execution after initial connection happens here
  setInterval(updateTime,1000);
});























