function post_message(msg) {
    var id = "message_" + gen_uuid();
    $message = $('<div class="message" id="' + id + '">' + msg + '</div>');
    $('#messages').append($message);
    setTimeout(function() {
        $('#'+id).hide(1000);
    }, 2000);
}
