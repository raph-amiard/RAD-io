total_playlist_length: 0
# Rename sel_data
sel_data: {}
audiomodels: {}
audiomodels_by_id: {}
current_audiomodel: 'audiofile_select'
audiomodels_routes: {
    audiofile_select: {
        view_url:'/audiosources/audiofile/list/'
        template_url: '/site_media/js_templates/audiofile_list_element.ejs'
        tags_url:'/audiosources/audiofile/tag/list/'
    }
    audiosource_select: {
        view_url:'/audiosources/audiosource/list/'
        template_url:'/site_media/js_templates/audiosource_list_element.ejs'
        tags_url:'/audiosources/audiosource/tag/list/'
    }
}

audiomodel_route: -> audiomodels_routes[current_audiomodel]
update_sources_list: -> $.getJSON audiomodel_route().view_url, sel_data, audiomodel_selector_update
update_tags_list: -> $.get audiomodel_route().tags_url, tag_sel_handler
update_playlist_length: -> $('#playlist_length').text format_length(total_playlist_length)

multicomplete_params: (list) -> {
    minLength:0
    source: (request, response) -> response(
        $.ui.autocomplete.filter(list, extractLast request.term)
    )
    focus: -> no
    select: (event, ui) ->
        terms: split @value
        terms.pop()
        terms.push ui.item.value
        terms.push ""
        @value: terms.join(", ")
        false
}

format_length: (l) ->
    format_number: (num, length) ->
        strnum: num + ''
        len: strnum.length
        zeroes: if length > len then length - len else 0
        strnum: ("0" for _ in [0...zeroes]).join('') + strnum

    fnum: (num) -> format_number(num, 2)
    num_hours: Math.floor l / 3600
    hours: fnum num_hours
    minutes: fnum Math.floor((l % 3600) / 60)
    seconds: fnum(Math.floor(l % 60))

    if num_hours then "${hours}h${minutes}m${seconds}" else "${minutes}m${seconds}"

populate_form_errors: (errors, form) ->
    for error in errors
        if error != 'status'
            $ul: $("input[name=${error}]", form).parent().before '<ul> </ul>'
            for msg in error
                $ul.before "<li>${msg}</li>"

handle_tag_delete: (e) ->
    e.preventDefault()
    $audiofile_tag: $(this).parents('.audiofile_tag').first()

    if $audiofile_tag.siblings().length == 0
        $audiofile_tag.parents('tr').first().hide()
    else
        $audiofile_tag.hide()

    tag_id: $audiofile_tag[0].id.split(/_/)[1]
    $audiofile_tag.append "<input type=\"hidden\" name=\"to_delete_tag_$tag_id\" value=\"$tag_id\">"

audiofile_edit_handler: (e) ->
    e.stopPropagation(); e.preventDefault()
    #TODO : Use another class than ui-state-default
    $pl_element: $(this).parents('.ui-state-default').first()

    $.getJSON @href, (data) ->
        modal_action "Editer un morceau", data.html, (close_func) ->

            on_edit_success: (data) ->
                close_func()
                if $pl_element
                    $('#audiofile_title', $pl_element).text data.audiofile.title
                    $('#audiofile_artist', $pl_element).text data.audiofile.artist
                $('#audiofiles_actions_container').html ''
                if current_audiomodel == "audiofile_select" then update_sources_list()
                post_message "Le morceau $data.audiofile.artist - $data.audiofile.title a été modifié avec succès"

            $('#id_tags').autocomplete multicomplete_params(data.tag_list)
            $('#id_artist').autocomplete {source: data.artist_list}
            $('#audiofile_edit_form').ajaxForm {dataType:'json', success:on_edit_success}



append_to_playlist: (audiofile, fresh, to_replace_element) ->
    fresh: if fresh then true else false
    $html: $(new EJS({url: js_template 'playlist_element'}).render {audiofile:audiofile, fresh:fresh})

    if to_replace_element
        af_div: to_replace_element.replaceWith($html)
    else
        af_div: $('#uploaded_audiofiles').append($html)

    $('.source_element_delete', $html).click (e) ->
        e.preventDefault()
        $li: $(this).parents('li:first')
        if $li.hasClass('fresh_source_element') then $li.remove()
        else $li.addClass('to_delete_source_element')
        total_playlist_length -= audiofile.length
        update_playlist_length()

    $('.audiofile_edit', $html).click(audiofile_edit_handler)
    $('#uploaded_audiofiles ul').children().disableTextSelect()

    total_playlist_length += audiofile.length
    update_playlist_length()

gen_ajaxform_options: (target_form, new_form) ->
    uuid: gen_uuid()
    freq: 1000
    prg_bar: $('.progress_bar', target_form)

    update_progress_info: ->
        $.getJSON '/upload-progress/', {'X-Progress-ID': uuid}, (data, status) ->
            if data
                progress: parseInt(data.received) / parseInt(data.size)
                prg_bar.progressbar "option", "value", progress * 100
                setTimeout update_progress_info, freq

    target_form[0].action += "?X-Progress-ID=$uuid"
    {
        dataType:'json'
        target: target_form
        success: (response, statusText, form) ->
          if response.status
              prg_bar.hide()
              if response.status == "error" then populate_form_errors(response, form)
              else
                  post_message "Le morceau $response.audiofile.artist - $response.audiofile.title a été ajouté avec succès"
                  form.hide()
                  append_to_playlist response.audiofile, true
          else
              form.html(response)
        beforeSubmit: (arr, $form, options) ->
            $newform: $(new_form)
            $form.after($newform)
            $newform.ajaxForm(gen_ajaxform_options $newform, $newform.clone())
            prg_bar.progressbar {progress: 0}
            setTimeout update_progress_info freq
    }

audiomodel_selector_update: (audiomodels_list) ->
    audiomodels: audiomodels_list
    for audiomodel in audiomodels_list
        audiomodels_by_id[audiomodel.id]: audiomodel

    ejs_template: new EJS {url:audiomodel_route().template_url}
    lis: ejs_template.render {audiomodel: audiomodel} for audiomodel in audiomodels
    html: "<ul>${lis.join('')}</ul>"

    $('#track_selector').html(html)
    $('#track_selector ul').make_selectable()
    if current_audiomodel == "audiofile_select"
        $('#track_selector ul li').draggable {
            helper:'clone'
            appendTo:'body'
            scroll:no
            connectToSortable:'ul#uploaded_audiofiles'
            zIndex:'257'
        }
    $('#uploaded_audiofiles').sortable('refresh')
    $('.audiomodel_delete').click(handle_audiomodel_delete)
    $('.audiofile_edit').click(audiofile_edit_handler)
    $('.audiosource_edit').click (e) ->
        e.stopPropagation(); e.preventDefault()
        $.get @href, playlist_view
    $('.audiofile_play').click(handle_audiofile_play)

handle_audiofile_play: (e) ->
    e.preventDefault(); e.stopPropagation()
    player: document.getElementById 'audiofile_player'
    if player then player.dewset e.target.href

add_tracks_to_playlist: ->
    for el, i in $('#track_selector li') when $(el).hasClass 'ui-selected'
        append_to_playlist audiomodels[i], true

handle_audiomodel_delete: (e) ->
    e.stopPropagation(); e.preventDefault()
    $li: $(this).parents('li:first')

    content: new EJS({url:js_template('confirm')}).render({
        action:"Supprimer cet element"
        confirm_url: e.target.href
    })

    modal_action "Supprimer un elément", content, (clear_func) ->
        $('.cancel_action').click (e) -> e.preventDefault(); clear_func()
        $('.confirm_action').click (e) ->
            e.preventDefault()
            $.getJSON e.target.href, (json) ->
                if json.status == "ok"
                    clear_func()
                    $li.remove()
                    artist: json.object.artist
                    post_message "L'élément ${if artist? then "$artist -"} $json.object.title a bien été supprimé"

tag_sel_handler: (html_data) ->
    $('#tag_selector').html html_data

    $('#tag_selector ul').make_selectable {
        handler: (event, ui) ->
            sel_data: {text_filter: sel_data['text_filter']}
            for input, i in $('#tag_selector ul li.ui-selected input')
                sel_data["tag_$i"]: input.value
            update_sources_list()
    }

playlist_edit_handler: ->
    $('#uploaded_audiofiles').sortable {
        axis: 'y'
        containment: $('.playlist_box')
        connectWith: '#track_selector ul li'
        cursor:"crosshair"
        stop: (e, ui) ->
            if ui.item.hasClass 'ui-draggable'
                append_to_playlist audiomodels_by_id[ui.item.children('input').val()], true, ui.item
    }

    $('.audiofile_edit').click audiofile_edit_handler
    $('#audiosource_form', document).submit (e) ->
        e.preventDefault()
        data: {}

        for li, i in $('#uploaded_audiofiles li') when not $(li).hasClass "to_delete_source_element"
            data["source_element_$i"] = $(li).children('input').val()

        $(this).ajaxSubmit {
            data: data
            success: (r) ->
                if current_audiomodel == "audiosource_select" then update_sources_list()
                $('#playlist_edit').hide()
                $('#main_content').show()
                action: if r.action=="edition" then "modifiée" else "ajoutée"
                post_message "La playlist $r.audiosource.title à été $action avec succès"
        }

playlist_view: (json) ->
    audiofileform_handler: (i) -> $(this).ajaxForm(gen_ajaxform_options $(this), $(this).clone())
    $pl_div: $('#playlist_edit')
    total_playlist_length: 0

    $pl_div.show()
    $('#main_content').hide()
    $('#audiofile_forms').html new EJS({url: js_template 'audiofile_form'}).render json
    $('#playlist_edit_title', $pl_div).html json.title
    $('#audiosource_form')[0].action: json.form_url
    $('#uploaded_audiofiles').html ''
    $('#playlist_title').val(if json.mode == "edition" then json.audiosource.title else "")
    $('#tags_table_container', $pl_div).html ''
    $('#audiosource_tags').val('').autocomplete(multicomplete_params json.tag_list).unbind 'blur.autocomplete'

    if json.mode == "edition"
        append_to_playlist(audiofile, no) for audiofile in json.audiosource.sorted_audiofiles
        $('#tags_table_container').html new EJS({url: js_template 'tags_table'}).render {audiomodel:json.audiosource}

    $('.audiofileform').each audiofileform_handler


$ ->
    playlist_edit_handler()
    update_sources_list()
    update_tags_list()

    $('#text_selector').keyup (e) -> sel_data['text_filter'] = $(this).val(); update_sources_list()
    $('#add_to_playlist_button').click add_tracks_to_playlist
    $('.audiofile_tag_delete').live 'click', handle_tag_delete
    $('#create_playlist_button').click (e) -> $.get '/audiosources/json/create-audio-source', playlist_view
    $('#uploaded_audiofiles .audiofile_play').live 'click', handle_audiofile_play
    $('#planning_board').resizable {
        alsoResize: '#main_planning_board, #grid_container'
    }

    $('#source_type').make_selectable {
        unique_select:yes
        select_class:'choice_selected'
        handler: (e) ->
            current_audiomodel: e.target.id
            sel_data: {text_filter: sel_data['text_filter']}
            update_sources_list()
            update_tags_list()
            $('[id$="select_footer"]').hide()
            $("#${current_audiomodel}_footer").show()
    }

