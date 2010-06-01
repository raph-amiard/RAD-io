var TOTAL_PLAYLIST_LENGTH = 0

function split(val) {
    return val.split(/,\s*/);
}

function extractLast(term) {
    return split(term).pop();
}

function gen_uuid() {
    var uuid = ""
    for (var i=0; i < 32; i++) {
        uuid += Math.floor(Math.random() * 16).toString(16); 
    }
    return uuid
}

function playlist_element(audio_file, inner) {
  out1 = '<li class="ui-state-default">'
  out2 = '</li>'
  console.log(audio_file);
  output = '<input type="hidden" value="' + 
         audio_file.id + '"/> <p> Titre: ' +
         audio_file.title + ' Artiste: ' + audio_file.artist + 
         ' Durée: ' + format_length(audio_file.length) +
         '<div class="audiofile_actions">' + '<a href="' + audio_file.form_url+'">Edit</a>' + 
         '</div>';
  if (inner) {
      return output;
  } else {
      return out1 + output + out2;
  }
}

function format_length(l) {
    hours = Math.floor(l / 3600)
    minutes = Math.floor((l % 3600) / 60)
    seconds = Math.floor(l % 60)
    if (hours) {
        return hours + 'h' + minutes + 'm' + seconds
    } else {
        return minutes + 'm' + seconds
    }
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

function handle_audiofiles_actions (e) {
    $pl_element = $(this).parents('.ui-state-default').first()
    e.preventDefault();
    $.getJSON(this.href, function(data) {
        $('#audiofiles_actions_container').html(data.html);
        availableTags = data.tag_list;
        $('#id_tags').autocomplete({
			minLength: 0,
			source: function(request, response) {
				// delegate back to autocomplete, but extract the last term
				response($.ui.autocomplete.filter(availableTags, extractLast(request.term)));
			},
			focus: function() {
				// prevent value inserted on focus
				return false;
			},
			select: function(event, ui) {
				var terms = split( this.value );
				// remove the current input
				terms.pop();
				// add the selected item
				terms.push( ui.item.value );
				// add placeholder to get the comma-and-space at the end
				terms.push("");
				this.value = terms.join(", ");
				return false;
			}
		});
        $('#audiofiles_actions_container form').ajaxForm({
            success: function(form_res) {
                console.log(form_res);
                $pl_element.html(playlist_element(form_res, true));
                $('#audiofiles_actions_container').html('');
                $('.audiofile_actions a').click(handle_audiofiles_actions);
            },
            dataType:'json'
        });
    });
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
                    $('#uploaded_audiofiles').append(playlist_element(response));
                    TOTAL_PLAYLIST_LENGTH += response.length
                    $('#playlist_length').text(format_length(TOTAL_PLAYLIST_LENGTH))
                    $('.audiofile_actions a').click(handle_audiofiles_actions);
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
    $('#uploaded_audiofiles').sortable({ axis: 'y' , containment:$('.playlist_box')});
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

