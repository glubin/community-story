var socket = io();

var newStoryVote = false;

$('#newStory').click(function(){
  newStoryVote = !newStoryVote;
  if (newStoryVote) {
    $('newStory').css('color','red');
  }
  console.log('hey');
  socket.emit('new story vote', newStoryVote);
});

$("#getStories").click(function(e){
    socket.emit('get past stories')
});

socket.on('return stories from DB', function(stories) {
  console.log('Old Stories: ' + JSON.stringify(stories, null, 4));
})

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
      // This needs to be changed to iterate over each word in each story
      //  rather than just each story
      $('#pastStories').append(
        "<span class=\"parent\">" + 
          recentStories[s] +
          "<div class=\"popup\">" +
          /* username, votes */ "PLACEHOLDER" +
          "</div>" +
        "</span>"); 
    }
  }

  $('#newWord').empty(); 
  makeString(msg);

  for(var i=0; i<pastWords.length; i++) {
    $('#messages').append(
        "<span class=\"parent\">" + 
          pastWords[i] + " " +
          "<div class=\"popup\">" +
          /* username, votes */ "PLACEHOLDER" +
          "</div>" +
        "</span>");    
  }
});

socket.on('server update', function(word){
  word = escapeHtml(word)
  $('#messages').append(
        "<span class=\"parent\">" + 
          word + " " +
          "<div class=\"popup\">" +
          /* username, votes */ "PLACEHOLDER" +
          "</div>" +
        "</span>");
  $('#newWord').empty();
        // $('#newWord').append( document.createTextNode('['));    
        // $('#newWord').append( document.createTextNode(']'));

});

socket.on('update time', function(counter){
  $('#countdown').empty();
  $('#countdown').append( document.createTextNode("Countdown: " + counter));
});


socket.on('story complete', function(){
  var oldHTML = $('#pastStories').html();
  var newStory = $('#messages').text();
  $('#newStory').prop('checked', false);

  var newHTML = appendNewStory(oldHTML, newStory)
  $('#pastStories').html(newHTML);

  $('#messages').empty();
  $('#newWord').empty();
});

function appendNewStory(oldHTML, newStory) {
  var html = oldHTML;

  html = '<p>' +
  newStory +
  '</p>' +
  html;
  return html;
}

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

// helper function to make sure that user input is safe
function escapeHtml(str) {
    var div = document.createElement('div');
    div.appendChild(document.createTextNode(str));
    return div.innerHTML;
};
