var post_message;
post_message = function(msg) {
  var $message, id;
  id = ("message_" + (gen_uuid()));
  $message = $("<div class=\"message\" id=\"" + id + "\">" + msg + "</div>");
  $('#messages').append($message);
  return setTimeout(function() {
    return $("#" + id).hide(1000);
  }, 2000);
};