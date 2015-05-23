var socket = io();

$('#newStory').change(function(){      
  socket.emit('new story vote', this.checked);
});

$('form').submit(function(){
  var input = $('#m').val().split(" ");
  socket.emit('propose word', input[0]);
  $('#m').val('');
  return false;
});

socket.on('update proposed words', function(msg){
  console.log('newWord contains: '+$('#newWord').text());
  $('#newWord').empty();

  makeString(msg);
});

socket.on('initialize', function(msg, pastWords, recentStories) {
  console.log('init');
  console.log('Recent Stories: '+recentStories);

  if (recentStories.length > 0) {
    for (s in recentStories) {
      $('#pastStories').append (document.createTextNode(recentStories[s]));
      $('#pastStories').append (document.createTextNode('\n'));
    }
  }

  $('#newWord').empty(); 
  makeString(msg);

  for(var i=0; i<pastWords.length; i++) {
    $('#messages').append( document.createTextNode(pastWords[i]+' '));    
  }
});

socket.on('server update', function(word){
  $('#messages').append( document.createTextNode(word + " "));
  $('#newWord').empty();
        // $('#newWord').append( document.createTextNode('['));    
        // $('#newWord').append( document.createTextNode(']'));

});

socket.on('update time', function(counter){
  $('#countdown').empty();
  $('#countdown').append( document.createTextNode("Countdown: " + counter));
});


socket.on('story complete', function(){
  $('#pastStories').append( document.createTextNode('\n'));
  $('#pastStories').append( document.createTextNode($('#messages').text()));
  $('#messages').empty();
  $('#newWord').empty();
});

// put your string in to the potential list
function makeString(msg) {
  var innerString = "";
  $('#newWord').append( document.createTextNode('['));    

  for (var key in msg){
    innerString += (key+':'+msg[key]+',');  
  }
  innerString = innerString.substring(0,innerString.length-1);
  $('#newWord').append( document.createTextNode(innerString));
  $('#newWord').append( document.createTextNode(']'));

}