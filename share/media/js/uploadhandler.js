function gen_uuid() {
    var uuid = ""
    for (var i=0; i < 32; i++) {
        uuid += Math.floor(Math.random() * 16).toString(16); 
    }
    return uuid
}

function populate_form_errors(errors, form) {
    for(error in errors) {
        if(error != 'status') {
            var $ul = $('input[name="'+ error + '"]',form).parent().before('<ul> </ul>');
            for(msg in errors[error]) {
                $ul.before('<li>' + errors[error][msg] + '</li>'); 
            }
        }
    }
}

function gen_ajaxform_options(target_form, new_form)
{
    var uuid = gen_uuid();
    var freq = 1000;
    var progress_url = '/upload-progress/'; 
    var prg_bar = $('.progress_bar', target_form);
    var update_progress_info = function() {
        $.getJSON(progress_url, {'X-Progress-ID': uuid}, function(data, status){
            if (data) {
                var progress = parseInt(data.received) / parseInt(data.size);
                prg_bar.progressbar("option","value", progress * 100);
                window.setTimeout(update_progress_info, freq);
            }
        });
    };

    target_form[0].action += '?X-Progress-ID=' + uuid;

    return {
        dataType:'json',
        target: target_form,
        success: function(response, statusText, form) {
            if(response.status) {
                prg_bar.hide();
                if(response.status == 'error') {
                    populate_form_errors(response,form);
                } else {
                    form.html('<p> Upload Successful </p>');
                    form.hide(1000);
                    $('#uploaded_audiofiles').append('<li class="ui-state-default"> <input type="hidden" value="'+response.id+'"/> <p> Titre: '+response.title+' Artiste: '+response.artist+'</li>');
                }
            } else {
                form.html(response);
            }
        },
        beforeSubmit: function(arr, $form, options) {
            $form.after(new_form);
            var $newform = $('.audiofileform:last');
            $newform.ajaxForm(gen_ajaxform_options($newform, new_form.clone()));
            prg_bar.progressbar({progress:0});
            window.setTimeout(update_progress_info, freq);
        }
    }
}

// Add upload progress for multipart forms.
$(document).ready(function() {
    $('#uploaded_audiofiles').sortable({ axis: 'y' });
    var audiofileforms = $('.audiofileform');
    var newform = $('.audiofileform:first').clone();
    audiofileforms.each(function(i) {
        var options = gen_ajaxform_options($(this), newform);
        $(this).ajaxForm(options);
    });
    $('input[name="playlist_submit"]').click(function(e) {
        data = {'title' :$('input[name="playlist_title"]').val()};
        $.each($('#uploaded_audiofiles li input'), function(i, input) {data[i] = input.value;});
        console.log(data);
        $.post(location.href,data, function(response) {
            alert('post successfull');
            alert(response);
        });
    });
});

