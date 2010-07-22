post_message: (msg) ->
    id: "message_${gen_uuid()}"
    $message: $("<div class=\"message\" id=\"$id\">$msg</div>")
    $('#messages').append $message
    setTimeout (-> $("#$id").hide 1000), 2000
