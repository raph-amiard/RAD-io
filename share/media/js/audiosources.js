var TOTAL_PLAYLIST_LENGTH = 0;
var AUDIOMODELS = {};
var AUDIOMODEL = "audiofile_select";
var AUDIOMODELS_ROUTES = {
    'audiofile_select':{'view_url':'/audiosources/audiofile/list/',
                        'template_url': '/site_media/js_templates/audiofile_list_element.ejs',
                        'tags_url':'/audiosources/audiofile/tag/list/'},
    'audiosource_select':{'view_url':'/audiosources/audiosource/list/',
                          'template_url':'/site_media/js_templates/audiosource_list_element.ejs',
                          'tags_url':'/audiosources/audiosource/tag/list/'}
};

function audiomodel_route() { return AUDIOMODELS_ROUTES[AUDIOMODEL]; }

function autocomp_params_multi(list) {
return {
			minLength: 0,
			source: function(request, response) {
				// delegate back to autocomplete, but extract the last term
				response($.ui.autocomplete.filter(list, extractLast(request.term)));
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
				terms.push(ui.item.value);
				// add placeholder to get the comma-and-space at the end
				terms.push("");
				this.value = terms.join(", ");
				return false;
			}
		}
}

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
    e.stopPropagation();
    $pl_element = $(this).parents('.ui-state-default').first()
    e.preventDefault();
    $.getJSON(this.href, function(data) {
        $('#audiofiles_actions_container').html(data.html);
        $('#id_tags').autocomplete(autocomp_params_multi(data.tag_list));
        $('#id_artist').autocomplete({source:data.artist_list});
        $('.audiofile_tag_delete').click(function(e) {
            e.preventDefault();
            $audiofile_tag = $(this).parents('.audiofile_tag').first();
            $.getJSON(this.href, function(response) {
                if (response.status == 'ok') {
                    if($audiofile_tag.siblings().length == 0) {
                        $audiofile_tag.parents('tr').first().remove();
                    } else {
                        $audiofile_tag.remove();
                    }
                }
            });
        });
        $('#audiofiles_actions_container form').ajaxForm({
            dataType:'json',
            success: function(form_res) {
                // TODO: Add error handling
                $('#audiofile_title', $pl_element).text(form_res.audiofile.title);
                $('#audiofile_artist', $pl_element).text(form_res.audiofile.artist);
                $('#audiofiles_actions_container').html('');
            }
        });
    });
}

function append_to_playlist(audiofile) {
    var html = new EJS({ url: '/site_media/js_templates/playlist_element.ejs'}).render({'audiofile':audiofile});
    af_div = $('#uploaded_audiofiles').append(html);
    $('.audiofile_actions a', af_div).click(handle_audiofiles_actions);
    TOTAL_PLAYLIST_LENGTH += audiofile.length
    $('#playlist_length').text(format_length(TOTAL_PLAYLIST_LENGTH))
    $('#uploaded_audiofiles ul').children().disableTextSelect();
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
                    append_to_playlist(response.audiofile);
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

function track_selector_update (audiomodels_list) {
    var html ='<ul>';
    AUDIOMODELS = audiomodels_list;
    ejs_template = new EJS({url:audiomodel_route().template_url});
    for(var i in audiomodels_list) {
        html += ejs_template.render({'audiomodel':audiomodels_list[i]});
    }
    html +='</ul>';

    $('#track_selector').html(html);
    $('#track_selector ul').make_selectable();
    $('.audiofile_actions a').click(handle_audiofiles_actions);
}

function add_tracks_to_playlist() {
    $('#track_selector li').each(function(i, el) {
        if($(el).hasClass('ui-selected')) {
            append_to_playlist(AUDIOMODELS[i]);
        }
    });
}


var sel_data = {};

function tag_sel_handler (html) {

    $('#tag_selector').html(html);
    var sel_handler = function(event, ui) {
        sel_data = {text_filter: sel_data['text_filter']};
        $.each($('#tag_selector ul li.ui-selected input'), function(i, input) {sel_data['tag_'+i] = input.value});
        $.getJSON(audiomodel_route().view_url,sel_data,track_selector_update);
    }

    $('#tag_selector ul').make_selectable({handler:sel_handler}); 
}

function playlist_edit_handler () {

      function submit_playlist (e) {
          e.preventDefault();
          data = {};
          $.each($('#uploaded_audiofiles li input'), function(i, input) {data["audiofile_" + i] = input.value;});
          $(this).ajaxSubmit({
              success: function(response) {
                           alert('post successfull');
                       },
              data: data
          });
      }

    $('#uploaded_audiofiles').sortable({ axis: 'y' , containment:$('.playlist_box')});
    $('#audiosource_form', document).submit(submit_playlist);
}

function audiofileform_handler (i) {
    var options = gen_ajaxform_options($(this), $(this).clone());
    $(this).ajaxForm(options);
}

// Add upload progress for multipart forms.
$(function() {

    $('.audiofileform').each(audiofileform_handler);
    
    playlist_edit_handler();

    $.getJSON(audiomodel_route().view_url, track_selector_update);
    
    $('#text_selector').keyup(function(e) {
        sel_data['text_filter'] = $('#text_selector').val();
        $.getJSON(audiomodel_route().view_url,sel_data, track_selector_update);
    });

    $.get(audiomodel_route().tags_url, tag_sel_handler);
    
    $('#add_to_playlist_button').click(add_tracks_to_playlist);

    $('#create_playlist_button').click(function(e) {
        $.get('/audiosources/audiosource/add/', function(html) {
            $('#main').html(html);
            playlist_edit_handler();
            $('.audiofileform').each(audiofileform_handler);
        });
    });
    
    $('#source_type').make_selectable({
        unique_select:true,
        select_class:'choice_selected',
        handler:function(e) {
            AUDIOMODEL = e.target.id;
            sel_data = {text_filter: sel_data['text_filter']};
            $.get(audiomodel_route().tags_url, tag_sel_handler);
            $.getJSON(audiomodel_route().view_url,sel_data,track_selector_update);
            $('[id$="select_footer"]').hide();
            $('#' + AUDIOMODEL + '_footer').show();
        }
    });
});

