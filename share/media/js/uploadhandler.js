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

function gen_ajaxform_options(target_form)
{
    var uuid = gen_uuid();
    var freq = 500;
    var progress_url = '/upload-progress/'; 
    var prg_bar = $('.progress_bar', target_form);
    var update_progress_info = function() {
        prg_bar.progressbar({progress:0});
        $.getJSON(progress_url, {'X-Progress-ID': uuid}, function(data, status){
            if (data) {
                var progress = parseInt(data.received) / parseInt(data.size);
                prg_bar.progressbar("option","value", progress * 100);
            }
            window.setTimeout(update_progress_info, freq);
        });
    };

    console.log(target_form);
    target_form[0].action += '?X-Progress-ID=' + uuid;

    return {
        dataType:'json',
        target: target_form,
        success: function(response, statusText, form) {
            if(response.status == 'error') {
                populate_form_errors(response,form);
            } else {
                form.html('<p> Upload Successful </p>');
            }
        },
        beforeSubmit: function(arr, $form, options) {
            window.setTimeout(update_progress_info, freq);
        }
    }
}

// Add upload progress for multipart forms.
$(document).ready(function() {

    var audiofileforms = $('.audiofileform');
    audiofileforms.each(function(i) {
        var options = gen_ajaxform_options($(this));
        $(this).ajaxForm(options);
    });
});

