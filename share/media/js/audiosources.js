var TOTAL_PLAYLIST_LENGTH = 0;
var AUDIOMODELS = {};
var AUDIOMODELS_BY_ID = {}
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

function js_template(t) { return '/site_media/js_templates/' + t + '.ejs'; }

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

function format_number(num, size) {
    stringnum = num + "";
    len = stringnum.length;
    zeroes = size > len ? size - len : 0;
    for(var i = 0; i < zeroes; i+=1) {
        stringnum = "0" + stringnum;
    }
    return stringnum
}

function format_length(l) {
    var fnum = function(num) {return format_number(num, 2)};

    num_hours = Math.floor(l / 3600)
    hours = fnum(num_hours)
    minutes = fnum(Math.floor((l % 3600) / 60))
    seconds = fnum(Math.floor(l % 60))

    if (num_hours) {
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
function handle_tag_delete (e) {
    e.preventDefault();
    var $audiofile_tag = $(this).parents('.audiofile_tag').first();
    if($audiofile_tag.siblings().length == 0) {
        $audiofile_tag.parents('tr').first().hide();
    } else {
        $audiofile_tag.hide();
    }
    var tag_id = $audiofile_tag[0].id.split(/_/)[1];
    $audiofile_tag.append('<input type="hidden" name="to_delete_tag_'+tag_id+'" value="'+tag_id+'">')
}

function handle_audiofile_edit (e) {
    e.stopPropagation();
    e.preventDefault();

    $pl_element = $(this).parents('.ui-state-default').first()
    $.getJSON(this.href, function(data) {
        $('#audiofiles_actions_container').html(data.html);
        $('#id_tags').autocomplete(autocomp_params_multi(data.tag_list));
        $('#id_artist').autocomplete({source:data.artist_list});
        $('#audiofiles_actions_container form').ajaxForm({
            dataType:'json',
            success: function(form_res) {
                // TODO: Add error handling
                if ($pl_element) {
                    $('#audiofile_title', $pl_element).text(form_res.audiofile.title);
                    $('#audiofile_artist', $pl_element).text(form_res.audiofile.artist);
                }
                $('#audiofiles_actions_container').html('');
                if(AUDIOMODEL == "audiofile_select") {
                    update_sources_list();
                }
                post_message('Le morceau ' + form_res.audiofile.artist + ' - ' + form_res.audiofile.title + ' a été modifié avec succès');
            }
        });
    });
}

function append_to_playlist(audiofile, fresh, to_replace_element) {
    fresh = fresh == false ? false : true;
    var html = new EJS({ url: js_template('playlist_element') }).render({'audiofile':audiofile, 'fresh':fresh});
    var $html = $(html);
    if (to_replace_element) {
      var af_div = to_replace_element.replaceWith($html);
    } else {
      var af_div = $('#uploaded_audiofiles').append($html);
    }
    $('.audiofile_edit', $html).click(handle_audiofile_edit);
    $('.source_element_delete', $html).click(function(e) {
        e.preventDefault();
        $source_element_li = $(this).parents('li:first');

        if($source_element_li.hasClass('fresh_source_element')) {
            $source_element_li.remove()
        } else {
            $source_element_li.addClass('to_delete_source_element');
        }
        TOTAL_PLAYLIST_LENGTH -= audiofile.length
        $('#playlist_length').text(format_length(TOTAL_PLAYLIST_LENGTH))

    });
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
                    post_message('Le morceau ' + response.audiofile.artist + ' - ' + response.audiofile.title + ' à été ajouté avec succès');
                    form.hide();
                    append_to_playlist(response.audiofile, true);
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

function audiomodel_selector_update (audiomodels_list) {
    var html ='<ul>';
    AUDIOMODELS = audiomodels_list;
    $.each(audiomodels_list, function(i, audiomodel) {
        AUDIOMODELS_BY_ID[audiomodel.id] = audiomodel;
    });
    ejs_template = new EJS({url:audiomodel_route().template_url});
    for(var i in audiomodels_list) {
        html += ejs_template.render({'audiomodel':audiomodels_list[i]});
    }
    html +='</ul>';

    $('#track_selector').html(html);
    $('#track_selector ul').make_selectable();
    $('#track_selector ul li').draggable({
        helper:'clone', 
        appendTo:'body', 
        scroll:false,
        connectToSortable:'ul#uploaded_audiofiles',
        zIndex:'257'
    });
    $('#uploaded_audiofiles').sortable('refresh');
    $('.audiomodel_delete').click(handle_audiomodel_delete);
    $('.audiofile_edit').click(handle_audiofile_edit);
    $('.audiosource_edit').click(function(e) {
        e.stopPropagation();
        e.preventDefault();
        $.get(this.href, playlist_view);
    });
    $('.audiofile_play').click(handle_audiofile_play);
}

function handle_audiofile_play (e) {
    e.preventDefault();
    e.stopPropagation();
    var player = document.getElementById('audiofile_player');
    if (player!=null) {player.dewset(e.target.href);}
}

function add_tracks_to_playlist() {
    $('#track_selector li').each(function(i, el) {
        if($(el).hasClass('ui-selected')) {
            append_to_playlist(AUDIOMODELS[i], true);
        }
    });
}

function handle_audiomodel_delete(e) {
    e.stopPropagation();
    e.preventDefault();
    $audiomodel_li = $(this).parents('li:first');
    $('#audiofiles_actions_container').html(new EJS({url:js_template('confirm')}).render({action:"supprimer cet element",
                                                                                          confirm_url:e.target.href }));
    $('.cancel_action').click(function(e) {e.preventDefault();$('#audiofiles_actions_container').html('');});
    $('.confirm_action').click(function(e) {
        e.preventDefault();
        $.getJSON(e.target.href, function(json) {
            if (json.status == 'ok') {
                $audiomodel_li.remove();
            }
            $('#audiofiles_actions_container').html('');
        });
    });
}

var sel_data = {};

function tag_sel_handler (html) {

    $('#tag_selector').html(html);
    var sel_handler = function(event, ui) {
        sel_data = {text_filter: sel_data['text_filter']};
        $.each($('#tag_selector ul li.ui-selected input'), function(i, input) {sel_data['tag_'+i] = input.value});
        update_sources_list();
    }

    $('#tag_selector ul').make_selectable({handler:sel_handler}); 
}

function playlist_edit_handler () {

    function submit_playlist (e) {
        e.preventDefault();
        data = {};
        $.each($('#uploaded_audiofiles li'), function(i, li) {
            if(!$(li).hasClass('to_delete_source_element')) {
                data["source_element_" + i] = $(li).children('input')[0].value;
            }
        });
        $form = $(this);
        $(this).ajaxSubmit({
            data: data,
            success: function(response) {
                         if (AUDIOMODEL == "audiosource_select") {
                             update_sources_list();
                         }
                         $('#playlist_edit').hide();
                         $('#main_content').show();
                         post_message('La playlist ' + response.audiosource.title + ' à été ' + (response.action=='edition'?'modifiée':'ajoutée') + ' avec succès');
                     }
        });
    }

    $('#uploaded_audiofiles').sortable({ 
        axis: 'y' , 
        containment:$('.playlist_box'),
        connectWith:'#track_selector ul li',
        cursor:"crosshair",
        stop: function(event, ui) {
            if (ui.item.hasClass('ui-draggable')) {
                append_to_playlist(AUDIOMODELS_BY_ID[ui.item.children('input').val()],
                                   true,
                                   ui.item);
            }
        }
    });
    $('.audiofile_edit').click(handle_audiofile_edit);
    $('#audiosource_form', document).submit(submit_playlist);
}

function audiofileform_handler (i) {
    var options = gen_ajaxform_options($(this), $(this).clone());
    $(this).ajaxForm(options);
}

function playlist_view (json) {
    var $pl_div = $('#playlist_edit');
    $pl_div.show();
    $('#main_content').hide();

    TOTAL_PLAYLIST_LENGTH = 0;
    $('#audiofile_forms').html(new EJS({ url: js_template('audiofile_form') }).render(json));
    $('#playlist_edit_title', $pl_div).html(json.title)
    $('#audiosource_form')[0].action = json.form_url
    $('#uploaded_audiofiles').html('');
    $('#playlist_title').val(json.mode == "edition" ? json.audiosource.title : "");
    $('#tags_table_container', $pl_div).html("");
    $('#audiosource_tags').val('').autocomplete(autocomp_params_multi(json.tag_list));
    $('#audiosource_tags').unbind("blur.autocomplete");

    if(json.mode == "edition") {
        $.each(json.audiosource.sorted_audiofiles, function(i, audiofile) {
            append_to_playlist(audiofile, false);
        });
        $('#tags_table_container', $pl_div).html(new EJS({url: js_template('tags_table')}).render({'audiomodel':json.audiosource}));
    }
    $('.audiofileform').each(audiofileform_handler);
}

function update_sources_list() {
    $.getJSON(audiomodel_route().view_url,sel_data,audiomodel_selector_update);
}

function update_tags_list() {
    $.get(audiomodel_route().tags_url, tag_sel_handler);
}

$(function() {

    playlist_edit_handler();
    // Get tags and sources
    update_sources_list();
    $.get(audiomodel_route().tags_url, tag_sel_handler);
    $('#text_selector').keyup(function(e) {
        sel_data['text_filter'] = $('#text_selector').val();
        update_sources_list();
    });

    // Add event handlers
    $('#add_to_playlist_button').click(add_tracks_to_playlist);
    $('.audiofile_tag_delete').live('click', handle_tag_delete);
    $('#create_playlist_button').click(function(e) {
        $.get('/audiosources/json/create-audio-source', playlist_view);
    });

    $('#uploaded_audiofiles .audiofile_play').live('click', handle_audiofile_play);

    $('#source_type').make_selectable({
        unique_select:true,
        select_class:'choice_selected',
        handler:function(e) {
            AUDIOMODEL = e.target.id;
            sel_data = {text_filter: sel_data['text_filter']};
            update_sources_list();
            update_tags_list();
            $('[id$="select_footer"]').hide();
            $('#' + AUDIOMODEL + '_footer').show();
        }
    });
});
