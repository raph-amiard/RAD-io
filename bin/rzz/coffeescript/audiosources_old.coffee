total_playlist_length = 0
# Rename sel_data
sel_data = {}
audiomodels = {}
audiomodels_by_id = {}
current_audiomodel = 'audiofile_select'
current_mode = 'main'
audiomodels_routes =
    audiofile_select:
        view_url:'/audiosources/audiofile/list/'
        template_name: 'audiofile_list_element'
        tags_url:'/audiosources/audiofile/tag/list/'
    audiosource_select:
        view_url:'/audiosources/audiosource/list/'
        template_name:'audiosource_list_element'
        tags_url:'/audiosources/audiosource/tag/list/'

audiomodel_route = -> audiomodels_routes[current_audiomodel]
update_playlist_length = -> $('#playlist_length').text format_length(total_playlist_length)

Application =
    views:
        playlist:
            components_actions:
        planning: {}
        main: {}
    current_view: 'main'

    view: (view_name) ->
        if view_name?
            @current_view = view_name
        else
            @current_view

    component_actions: (component_name) -> @view().component_actions

class Audiomodel
    constructor: (json_model, dom_template) ->
        for key, val of json_model
            @[key] = val
        @dom_element = dom_template.render audiomodel:json_model

Components =
    tags:
        reload: ->

    audiomodels:
        routes:
            view_url:'/audiosources/MODEL/list/'
            template_name:'MODEL_list_element'
            tags_url:'/audiosources/MODEL/tag/list'
        models: ['audiofile', 'audiosource']
        current_model: 'audiofile'
        all: {}
        by_id: {}

        filters:
            text: null
            tags: []

        init: ->
            for key, route of @routes:
                @[key] = -> return @routes[key].replace 'MODEL', current_model

        filter_to_params: ->
            map = {}
            map["tag_#{idx}"] = tag for idx, tag in @filter.tags
            map["text"] = @filter.text
            return map

        reload: ->
            $.getJSON @view_url(), @filters.to_params() , (audiomodels_list) ->

                dom_template = template @template_name

                for json_audiomodel in audiomodels_list
                    audiomodel = new Audiomodel(json_audiomodel, dom_template)
                    @all.push audiomodel
                    @by_id[audiomodel.id] = audiomodel

                # Put the audiomodels in a list into the audiomodel selector
                lis = (a.dom_element for a in @all)
                $('#track_selector').html "<ul>#{lis.join ''}</ul>"

                # View specific actions
                action() for action in Application.component_actions 'audiomodels'

                # Playlist action
                $('#uploaded_audiofiles').sortable('refresh')

                # General actions
                $('.audiomodel_delete'.click(handle_audiomodel_delete)
                $('.audiofile_edit').click(audiofile_edit_handler)
                $('.audiofile_play').click(handle_audiofile_play)

                # Maybe a main action ?
                $('.audiosource_edit').click (e) ->
                    e.stopPropagation(); e.preventDefault()
                    $.get @href, playlist_view

multicomplete_params = (list) ->
    minLength:0
    source: (request, response) -> response(
        $.ui.autocomplete.filter(list, extractLast request.term)
    )
    focus: -> no
    select: (event, ui) ->
        terms = split @value
        terms.pop()
        terms.push ui.item.value
        terms.push ""
        @value = terms.join ", "
        false

format_length = (l) ->
    format_number = (num, length) ->
        strnum = num + ''
        len = strnum.length
        zeroes = if length > len then length - len else 0
        strnum = ("0" for _ in [0...zeroes]).join('') + strnum

    fnum = (num) -> format_number num, 2
    num_hours = Math.floor l / 3600
    hours = fnum num_hours
    minutes = fnum Math.floor (l % 3600) / 60
    seconds = fnum Math.floor l % 60

    if num_hours then "#{hours}h#{minutes}m#{seconds}" else "#{minutes}m#{seconds}"

populate_form_errors = (errors, form) ->
    for error in errors
        if error != 'status'
            $ul = $("input[name=#{error}]", form).parent().before '<ul> </ul>'
            for msg in error
                $ul.before "<li>#{msg}</li>"

audiofile_edit_handler = (e) ->

    # On click on the edit button on any audiofile
    # handles showing the modal form and setting up appropriate actions for it
    # TODO : Use another class than ui-state-default for $pl_element selection

    handle_tag_delete = (e) ->

        # Does the necessary action when a tag is marked for deletion :
        # 1. Hides it, and the category if necessary
        # 2. Adds an hidden input for when the form is submitted

        e.preventDefault()
        $audiofile_tag = $(@).parents('.audiofile_tag').first()

        if $audiofile_tag.siblings().length == 0
            $audiofile_tag.parents('tr').first().hide()
        else
            $audiofile_tag.hide()

        tag_id = $audiofile_tag[0].id.split(/_/)[1]
        $audiofile_tag.append "<input type=\"hidden\" name=\"to_delete_tag_#{tag_id}\" value=\"#{tag_id}\">"

    e.stopPropagation(); e.preventDefault()
    $pl_element = $(@).parents('.ui-state-default').first()

    $.getJSON @href, (data) ->
        modal_action "Editer un morceau", data.html, (close_func) ->

            on_edit_success = (data) ->
                close_func()
                if $pl_element
                    $('#audiofile_title', $pl_element).text data.audiofile.title
                    $('#audiofile_artist', $pl_element).text data.audiofile.artist
                $('#audiofiles_actions_container').html ''
                if current_audiomodel == "audiofile_select" then update_sources_list()
                post_message "Le morceau #{data.audiofile.artist} - #{data.audiofile.title} a été modifié avec succès"

            $('.audiofile_tag_delete').click handle_tag_delete
            $('#id_tags').autocomplete multicomplete_params(data.tag_list)
            $('#id_artist').autocomplete source: data.artist_list
            $('#audiofile_edit_form').ajaxForm dataType:'json', success:on_edit_success



append_to_playlist = (audiofile, fresh, to_replace_element) ->
    # Append an audiofile object to the playlist
    # fresh: tells if it's a new audiofile in the playlist, of it's already in it
    # to_replace_element : if this arg is provided, this element in the playlist will be replaced by the new one

    fresh = fresh?
    $html = $(render_template 'playlist_element', audiofile:audiofile, fresh:fresh)

    if to_replace_element
        af_div = to_replace_element.replaceWith($html)
    else
        af_div = $('#uploaded_audiofiles').append($html)

    # Handle element deletion at form submission
    $('.source_element_delete', $html).click (e) ->
        e.preventDefault()
        $li = $(@).parents 'li:first'
        if $li.hasClass('fresh_source_element') then $li.remove()
        else $li.addClass 'to_delete_source_element'
        total_playlist_length -= audiofile.length
        update_playlist_length()

    $('.audiofile_edit', $html).click audiofile_edit_handler
    $('#uploaded_audiofiles ul').children().disableTextSelect()

    total_playlist_length += audiofile.length
    update_playlist_length()

update_sources_list = ->

    # Update the audiomodels list
    # TODO : Should be update_audiomodels_list ;)

    audiomodels_draggable_update = ->
        # Make the audiomodels draggable depending on the general situation
        drag_options = (opts) ->
            defaults = {helper:'clone', appendTo:'body', scroll:no, zIndex:'257'}
            $.extend defaults, opts

        if current_mode == "playlist_edit" and current_audiomodel == "audiofile_select"
            $('#track_selector ul li').draggable(drag_options connectToSortable:'ul#uploaded_audiofiles')
        if current_mode == "planning_edit" and current_audiomodel == "audiosource_select"
            lis = $('#track_selector ul li')
            td_positions = {}

            lis.bind 'dragstart', (e, dd) ->
                id = parseInt($('input', @).val())
                audiomodel = audiomodels_by_id[id]
                height = audiomodel.length / 60
                width = $('#planning_board td').width()
                proxy = div audiomodel.title, class:'audiofile_proxy'
                proxy.css top:dd.offsetY, left:dd.offsetX, position:'absolute'
                $('body').append(proxy)
                proxy.width(width).height(height)
                td_positions = Math.round($(el).position().left) for el in $('#planning_board td')
                return proxy

            lis.bind 'drag', (e, dd) ->
                el = $(dd.proxy)
                rel_pos = el_pos_on_pboard(el)
                if rel_pos.top + (el.height() / 2) > 0 and rel_pos.left + (el.width() / 2) > 0
                    rel_cpos = pos_on_pboard top:dd.offsetY, left:dd.offsetX
                    width = $('#planning_board td').width()
                    height = 10
                    el_pos_on_pboard(el, top: step(rel_cpos.top, height) , left:closest(rel_cpos.left, td_positions)+1)
                else
                    el.css top:dd.offsetY, left:dd.offsetX

    $.getJSON audiomodel_route().view_url, sel_data, (audiomodels_list) ->

        # Store the audiomodels in a GLOBALZ
        audiomodels = audiomodels_list

        # Another global for storing audiomodels by id
        for audiomodel in audiomodels
            audiomodels_by_id[audiomodel.id] = audiomodel

        # Create the template, render every audiomodel
        tmpl = template audiomodel_route().template_name
        lis = tmpl.render(audiomodel: audiomodel) for audiomodel in audiomodels

        # Put the audiomodels in a list into the audiomodel selector
        $('#track_selector').html "<ul>#{lis.join ''}</ul>"
        audiomodels_draggable_update()

        $('#uploaded_audiofiles').sortable('refresh')
        $('.audiomodel_delete').click(handle_audiomodel_delete)
        $('.audiofile_edit').click(audiofile_edit_handler)
        $('.audiofile_play').click(handle_audiofile_play)
        $('.audiosource_edit').click (e) ->
            e.stopPropagation(); e.preventDefault()
            $.get @href, playlist_view

update_tags_list = ->

    # Update the tags list, by requesting the server
    # Depending on the model type, show the appropriate tags

    $.get audiomodel_route().tags_url, (html_data) ->
        $('#tag_selector').html html_data
        $('#tag_selector ul').make_selectable
            handler: (event, ui) ->
                # Resets the filter_data object, keeping only the text filter
                sel_data = text_filter: sel_data['text_filter']

                # Adds every selected tag
                for input, i in $('#tag_selector ul li.ui-selected input')
                    sel_data["tag_#{i}"] = input.value

                # Updates the source with the new filters
                update_sources_list()

handle_audiofile_play = (e) ->
    # Plays an audiofile on the flash player 

    e.preventDefault(); e.stopPropagation()
    player = document.getElementById 'audiofile_player'
    if player then player.dewset e.target.href

handle_audiomodel_delete = (e) ->

    # Function for audiomodel deletion
    # Shows a confirmation dialog, then
    # Hits the proper server url, and remove the list element on sucess
    e.stopPropagation(); e.preventDefault()

    # Grabs the list element
    $li = $(@).parents('li:first')

    # Renders the dialog contents
    content = render_template 'confirm',
        action:"Supprimer cet element"
        confirm_url: e.target.href

    # Make a new dialog with the confirm template, add the handlers
    modal_action "Supprimer un elément", content, (clear_func) ->
        $('.cancel_action').click (e) -> e.preventDefault(); clear_func()
        $('.confirm_action').click (e) ->
            e.preventDefault()
            $.getJSON e.target.href, (json) ->
                if json.status == "ok"
                    # If the element was well suppressed, remove the li element and close the dialog
                    # And show a suppression message
                    clear_func()
                    $li.remove()
                    artist = json.object.artist
                    post_message "L'élément #{if artist? then "#{artist} -"} #{json.object.title} a bien été supprimé"

playlist_edit_handler = ->

    # This function is called ONLY ONCE, at document ready, because the playlist edit div is just hidden
    # Does all setting up for playlist editing
    # TODO : Name should be source_edit_handler ;)

    $('.audiofile_edit').click audiofile_edit_handler

    # Sets up sortability of files in the playlist
    $('#uploaded_audiofiles').sortable
        axis: 'y'
        containment: $('.playlist_box')
        connectWith: '#track_selector ul li'
        cursor:"crosshair"
        stop: (e, ui) ->
            # Used when an element is dragged from the audiofile selector
            if ui.item.hasClass 'ui-draggable'
                append_to_playlist audiomodels_by_id[ui.item.children('input').val()], true, ui.item

    # When the edit form is submitted
    $('#audiosource_form', document).submit (e) ->
        e.preventDefault()
        data = {}

        # Adds the playlist tracks to the data to be submitted, if they're not marked for deletion
        for li, i in $('#uploaded_audiofiles li') when not $(li).hasClass "to_delete_source_element"
            data["source_element_#{i}"] = $(li).children('input').val()

        $(@).ajaxSubmit
            data: data
            success: (r) ->
                # On success, hides  the playlist, and show the message and main content

                if current_audiomodel == "audiosource_select" then update_sources_list()
                $('#playlist_edit').hide()
                $('#main_content').show()
                action: if r.action=="edition" then "modifiée" else "ajoutée"

                post_message "La playlist #{r.audiosource.title} à été #{action} avec succès"
                current_mode = "main"

audiofile_form_options = (target_form, new_form) ->

    # Options for dynamic file upload
    # Displays a progress bar for the upload
    # TODO : Use a better form duplication mechanism
    #        First just get rid of this shitty second param
    #        Maybe store the form as an EJS template ?

    # Progress bar update function
    # TODO : Use setInterval instead of setTimeout, and dump the recursive tail call
    update_progress_info = ->
        $.getJSON '/upload-progress/', {'X-Progress-ID': uuid}, (data, status) ->
            if data
                progress = parseInt(data.received) / parseInt(data.size)
                prg_bar.progressbar "option", "value", progress * 100
                setTimeout update_progress_info, UPDATE_FREQ

    UPDATE_FREQ = 1000
    uuid = gen_uuid()
    prg_bar = $ '.progress_bar', target_form

    # Add the unique id to the form action
    target_form[0].action += "?X-Progress-ID=#{uuid}"

    # Option map
    dataType:'json'
    target: target_form
    success: (response, statusText, form) ->
        if response.status
          prg_bar.hide()
          if response.status == "error" then populate_form_errors(response, form)
          else
              post_message "Le morceau #{response.audiofile.artist} - #{response.audiofile.title} a été ajouté avec succès"
              form.hide()
              append_to_playlist response.audiofile, true
        else
          form.html(response)
    beforeSubmit: (arr, $form, options) ->
        # Appends a new form after the first one, for multiuploads
        $newform = $(new_form)
        $form.after($newform)

        # Recursive call to handle the new form upload
        $newform.ajaxForm(audiofile_form_options $newform, $newform.clone())
        prg_bar.progressbar {progress: 0}
        setTimeout update_progress_info UPDATE_FREQ

playlist_view = (json) ->

    # This function is called everytime a playlist is edited OR created
    # It sets the necessary CHANGING data and handlers for the playlist edition
    # For the global settings see playlist_edit_handler

    current_mode = "playlist_edit"
    $pl_div = $('#playlist_edit')

    # Resets playlist length
    total_playlist_length = 0
    # Switch the main divs
    $pl_div.show()
    $('#main_content').hide()

    # Add a form for audio file upload, and add the upload handler
    $('#audiofile_forms').html(render_template  'audiofile_form', json)
    $('.audiofileform').each ->
        $(@).ajaxForm(audiofile_form_options $(@), $(@).clone())

    # Reset all fields
    $('#uploaded_audiofiles').html ''
    $('#playlist_title').val('')
    $('#tags_table_container', $pl_div).html ''
    $('#audiosource_tags').val('')

    $('#playlist_edit_title', $pl_div).html json.title
    $('#audiosource_form')[0].action = json.form_url
    $('#audiosource_tags').autocomplete(multicomplete_params json.tag_list).unbind 'blur.autocomplete'

    # Add Necessary information for playlist, if in edition mode
    if json.mode == "edition"
        $('#playlist_title').val(if json.mode  == "edition" then json.audiosource.title)
        for audiofile in json.audiosource.sorted_audiofiles
            append_to_playlist(audiofile, no)
        $('#tags_table_container').html(render_template 'tags_table', audiomodel:json.audiosource)



# ========================================= PLANNINGS PART ======================================== #

show_edit_planning = () ->
    board = $('#main_planning_board')
    ct = $('#main_planning_board_container')

    for _ in [0...24]
        for i in [1..6]
            div_class = {3:'half',6:'hour'}[i] or 'tenth'
            board.append(div class:"grid_time grid_#{div_class}")

    $('#main_content').hide()
    $('#planning_edit').show()
    ct.height $(document).height() - ct.offset().top - 20

    $('#main_planning_board').droppable
        over: (e, ui) ->
            dropped_el = ui.helper

        drop: (e, ui) ->
        tolerance:'fit'

    current_mode = "planning_edit"

pos_on_pboard = (el_pos) ->

    # Takes a coordinates object as input -> {left:int, top:int}
    # Returns a coordinate object relative to the planning board

    pboard_off = $('#planning_board').offset()
    el_pos.top -= pboard_off.top
    el_pos.left -= pboard_off.left
    return el_pos

el_pos_on_pboard = (el, pos) ->

    # If only el is given, returns the position of el on the planning board
    # If pos is given as pos = {top:int, left:int},
    # then place el at the given pos relative to the board

    pboard_off = $('#planning_board').offset()
    el_off = el.offset()
    if pos
        el.css
            top: pboard_off.top + pos.top
            left: pboard_off.left + pos.left
    else
        el_off.top -= pboard_off.top
        el_off.left -= pboard_off.left
        return el_off

closest = (num, steps) ->

    # num: int, steps: [int]
    # Returns the step that is the closest to num

    ret = null
    $.each steps, (i) ->
        if steps[i] < num < steps[i +1]
            if num - steps[i] < steps[i + 1] - num
                ret = steps[i]
            else
                ret = steps[i + 1]
    return ret

step = (num, step) -> num - (num % step)

# ========================================= DOCUMENT READY PART ======================================== #

$ ->
    # Handler for adding selected sources to the playlist 
    # TODO : This sucks 
    add_tracks_to_playlist = ->
        for el, i in $('#track_selector li') when $(el).hasClass 'ui-selected'
            append_to_playlist audiomodels[i], true

    # Configure the playlist handling once and for all
    playlist_edit_handler()

    # Show tags and sources
    update_sources_list()
    update_tags_list()

    # Configure all sources filters, except for the Tag filter which is handled in update_tags_list
    # Text selector filter
    $('#text_selector').keyup (e) -> sel_data['text_filter'] = $(@).val(); update_sources_list()

    # Source type filter
    $('#source_type').make_selectable
        # TODO : Get that out of main
        unique_select:yes
        select_class:'choice_selected'
        handler: (e) ->
            current_audiomodel = e.target.id
            sel_data = text_filter: sel_data['text_filter']
            update_sources_list()
            update_tags_list()
            $('[id$="select_footer"]').hide()
            $("##{current_audiomodel}_footer").show()

    # Global click event handlers

    $('#create_playlist_button').click (e) -> $.get '/audiosources/json/create-audio-source', playlist_view
    $('#uploaded_audiofiles .audiofile_play').live 'click', handle_audiofile_play
    $('#add_to_playlist_button').click add_tracks_to_playlist

    show_edit_planning()
