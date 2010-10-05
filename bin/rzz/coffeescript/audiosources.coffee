
Application =
    # Main application singleton, regroups global mechanics

    views_components: (name) ->
        cmap = 
            playlist: PlaylistComponent
        return cmap[name]

    current_view: 'main'
    current_component: undefined

    load: (name, view_params) ->
        @current_component?.close()
        klass = @views_components(name)
        @current_component = new klass(view_params)
        @current_component.bind_events()
        @current_view = name

    view: (view_name) ->
        if view_name?
            @current_view = view_name
        else
            @current_view


class TemplateComponent
    # Abstract class for elements represented by an EJS template

    dom: null

    constructor: (opts) ->
        @dom = render_template opts.template, opts.context
        @ui = $(@dom)


class Audiomodel extends TemplateComponent

    constructor: (opts) ->
        super opts

    set_title: (title) ->
        @title = title
        @ui.find(".#{@type}_title").text(@title)

    set_artist: (artist) ->
        if @type == "audiofile"
            @artist = artist
            @ui.find(".#{@type}_artist").text(@artist)

    make_audiofile_edit_menu : (data) ->
        tags_table = new TagsTable(data.audiofile.tags_by_category)
        form = $(data.html).append(tags_table.ui)

        audiomodel = @
        make_xps_menu {

            name: "edit_audiomodel_#{audiomodel.id}"
            text: form
            title: "Edition d'un morceau"

            on_show: ->
                $(@).find('#id_tags').autocomplete multicomplete_params(data.tag_list)
                $(@).find('#id_artist').autocomplete source: data.artist_list

            validate_action: ->
                $(@).find('form').ajaxSubmit
                    dataType:'json'
                    data: tags_table.to_delete_tags
                    success: (json) ->
                        af = json.audiofile
                        audiomodel.set_title af.title
                        audiomodel.set_artist af.artist
                        post_message "Le morceau #{af.artist} - #{af.title} a été modifié avec succès"
        }


    handle_audiofile_edit: ->
        audiomodel = @
        return (e) ->
            e.preventDefault()
            $.getJSON @href, (data) ->
                menu = audiomodel.make_audiofile_edit_menu(data)
                show_menu menu



class ListAudiomodel extends Audiomodel
    # Represents an audiomodel in the audiomodel list

    constructor: (type, json_model) ->

        @type = type
        $.extend this, json_model

        super
            template: "#{@type}_list_element"
            context: {audiomodel:json_model}

    handle_delete: ->
        audiomodel = @
        msg = "L'élément #{if @artist? then "#{@artist} -"} #{@title} a bien été supprimé"
        delete_menu = make_xps_menu {
            name: "delete_audiomodel_#{@id}"
            text: "Etes vous sur de vouloir supprimer ce#{if @type=="audiofile" then " morceau" else "tte playlist"} ?"
            title: "Suppression d'un#{if @type=="audiofile" then " morceau" else "e playlist"}"
            show_validate:no
            actions:
                "Oui": ->
                    $.getJSON e.target.href, (json) =>
                        post_message msg
                        audiomodel.ui.remove()
                        $(@).dialog('close').remove()
                "Non": ->
                    $(@).dialog('close').remove()

        }
        return (e) ->
            e.preventDefault()
            show_menu delete_menu

    bind_events: ->

        @ui.find('.audiomodel_delete').click @handle_delete()

        if @type == "audiofile"
            @ui.find('.audiofile_edit').click @handle_audiofile_edit()
            @ui.find('.audiofile_play').click handle_audiofile_play

        else if @type == "audiosource"
            @ui.find('.audiosource_edit').click (e) ->
                e.stopPropagation(); e.preventDefault()
                $.get @href, (json) ->
                    Application.load 'playlist', json


class TagsTable
    # Represents a tags table
    # With dynamic suppression of tags
    # in: a map of category to tags

    constructor: (tags_by_category) ->
        @tags_by_category = tags_by_category
        @to_delete_tags = {}
        @make_table()
        @ui = @table
        @dom = @table[0]

    make_table: () ->
        @table = $(render_template "tags_table")
        for category, tags of @tags_by_category

            # Build the table line
            category_tr = tag "tr"
            tags_td = tag "td"
            tags.remaining = 0

            for ctag in tags

                # Build the tag column
                tag_span = tag "span", "#{ctag.name} ", class:"audiofile_tag", id:"tag_#{ctag.id}"
                delete_link = tag "a", "x ", class:"audiofile_tag_delete", href:""
                tag_span.append delete_link
                tags_td.append tag_span
                tags.remaining += 1

                delete_link.click (e) =>
                    # On click on the delete link
                    # Remove the tag
                    e.preventDefault()
                    tag_span.remove()
                    tags.remaining -= 1
                    if tags.remaining == 0
                        category_tr.remove()
                    @to_delete_tags["to_delete_tag_#{ctag.id}"] = ctag.id


            category_tr.append(tag "td", category).append(tags_td)
            @table.append category_tr


class AudioFileForm extends TemplateComponent


class PlaylistElement extends Audiomodel

    constructor: (audiofile, container, fresh) ->
        @container = container
        @type = "audiofile"
        @fresh = if fresh then fresh else false
        @audiofile = audiofile
        super template:'playlist_element', context: {fresh:@fresh, audiofile:audiofile}

    bind_events: ->
        @ui.find('.audiofile_edit').click @handle_audiofile_edit()
        @ui.find('.audiofile_play').click handle_audiofile_play
        @ui.find('.source_element_delete').click (e) =>
            e.preventDefault()
            if @fresh then @ui.remove()
            else @ui.addClass 'to_delete_source_element'
            @container.remove(@)

    toString: () -> "playlist_element_#{gen_uuid()}"

class TrackList

    constructor: ->
        @length = 0
        @elements = new Set()
        @binded_elements = new Set()
        @container = $ "#uploaded_audiofiles"
        @outer_container = $ ".playlist_box"
        @length_container = $ "#playlist_length"

        tracklist = @
        @container.find('li').disableTextSelect()
        @container.sortable
            axis: 'y', containment: @outer_container, connectWith: '#track_selector ul li', cursor:"crosshair"
            stop: (e, ui) ->
                # Used when an element is dragged from the audiofile selector
                if ui.item.hasClass 'ui-draggable'
                    audiomodel = Widgets.audiomodels.by_id[ui.item.children('input').val()]
                    new_el = new PlaylistElement(audiomodel, this, yes)
                    ui.item.replaceWith new_el.ui
                    new_el.bind_events()

                    tracklist.elements.add(new_el)
                    tracklist.length += audiomodel.length
                    tracklist.update_length()

    update_length: ->
        @length_container.text format_length(@length)

    append: (audiofile, fresh) ->
        pl_element = new PlaylistElement(audiofile, this, fresh)
        @elements.add(pl_element)
        @length += audiofile.length
        @container.append pl_element.ui
        @update_length()

    remove: (el) ->
        @elements.remove(el)
        @length -= el.audiofile.length
        @update_length()

    bind_events: () ->
        for el in @elements.values()
            if not(@binded_elements.has el)
                @binded_elements.add(el)
                el.bind_events()

Widgets =

    tags:
        view_url: -> "/audiosources/#{Widgets.audiomodels.current_model}/tag/list"
        selected_tags: {}
        clear: -> @selected_tags = {}
        load: ->
            select_handler =  (event, ui) =>
                @selected_tags = (i.value for i in $ '#tag_selector li.ui-selected input')
                Widgets.audiomodels.load()

            $.get @view_url(), (html_data) ->
                $('#tag_selector').html html_data
                $('#tag_selector ul').make_selectable handler:select_handler


    audiomodel_selector:
        container: d$ '#source_type'
        button_class: "audiomodel_selector"
        selected_class: "audiomodel_selected"

        load: ->
            for model_name, button_name of Widgets.audiomodels.models
                dom = tag 'span', button_name, class:@button_class
                @container.append(dom)
                $(dom).button()
                dom.click (e) ->
                    Widgets.audiomodels.current_model = model_name
                    Widgets.tags.clear()
                    Widgets.audiomodels.clear_filter()
                    Widgets.audiomodels.load()
                    Widgets.tags.load()

            @container.make_selectable
                unique_select: yes
                select_class: @selected_class


    audiomodels:
        container: d$ '#track_selector'
        models:
            audiofile: "Tracks"
            audiosource: "Playlists"
        current_model: 'audiofile'

        view_url: -> "/audiosources/#{@current_model}/list/"

        all: []
        by_id: {}

        text_filter: ""
        clear_filter: -> @text_filter = ""

        filter_to_params: ->
            map = {}
            for idx, tag of Widgets.tags.selected_tags
                map["tag_#{idx}"] = tag
            if @text_filter then map["text"] = @text_filter
            return map

        views_actions:
            playlist: ->
                tracklist = Application.current_component.tracklist
                tracklist.container.sortable('refresh')
                if Widgets.audiomodels.current_model == "audiofile"
                    $('#track_selector ul li').draggable
                        connectToSortable: tracklist.container
                        helper:'clone'
                        appendTo:'body'
                        scroll:no
                        zIndex:'257'

        load: ->
            $.getJSON @view_url(), @filter_to_params() , (audiomodels_list) =>

                @all = []
                @by_id = {}

                ul = tag 'ul'
                @container.html ''
                @container.append ul

                for json_audiomodel in audiomodels_list
                    audiomodel = new ListAudiomodel(@current_model, json_audiomodel)
                    @all.push audiomodel
                    @by_id[audiomodel.id] = audiomodel
                    ul.append audiomodel.ui
                    audiomodel.bind_events()

                $('[id$="select_footer"]').hide()
                $("##{@current_model}_select_footer").show()

                # View specific actions
                @views_actions[Application.current_view]?()

class AppComponent extends TemplateComponent
    main_content_holder: d$ "#main_container"
    bind_events: () ->
    constructor: (opts) ->
        super opts
        @main_content_holder.append(@ui)
    close: () ->
        @ui.remove()

class PlaylistComponent extends AppComponent

    init_components: ->
        @tracklist = new TrackList()
        @container = $ '#playlist_edit'
        @inputs =
            title: $ '#playlist_title'
            tags: $ '#audiosource_tags'
        @fields =
            title: $ '#playlist_edit_title'
            audiofiles: @tracklist.container
            tags: $ '#tags_table_container'
            file_forms: $ '#audiofile_forms'
        @form = $ '#audiosource_form'

    constructor: (json) ->
        super template: "audiosource_base", context: json
        @init_components()

        # Add a form for audio file upload, and add the upload handler
        @fields.file_forms.html(render_template  'audiofile_form', json)
        $('.audiofileform').each ->
            $(@).ajaxForm(audiofile_form_options $(@), $(@).clone())

        @inputs.tags.autocomplete(multicomplete_params json.tag_list).unbind 'blur.autocomplete'

        # Add Necessary information for playlist, if in edition mode
        if json.mode == "edition"
            @inputs.title.val(if json.mode  == "edition" then json.audiosource.title)
            for audiofile in json.audiosource.sorted_audiofiles
                @tracklist.append(audiofile, no)
            tags_table = new TagsTable(json.audiosource.tags_by_category)
            @fields.tags.append(tags_table.ui)

    bind_events: () ->
        @tracklist.bind_events()

playlist_edit_handler = ->

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

populate_form_errors = (errors, form) ->

    for error in errors
        if error != 'status'
            $ul = $("input[name=#{error}]", form).parent().before '<ul> </ul>'
            for msg in error
                $ul.before "<li>#{msg}</li>"

handle_audiofile_play = (e) ->
    # Plays an audiofile on the flash player 

    e.preventDefault(); e.stopPropagation()
    player = document.getElementById 'audiofile_player'
    if player then player.dewset e.target.href


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
    # Configure the playlist handling once and for all

    for cname, component of Widgets
        console.log "Loading component #{cname}"
        component.load()

    # Configure all sources filters, except for the Tag filter which is handled in update_tags_list
    # Text selector filter
    $('#text_selector').keyup (e) -> sel_data['text_filter'] = $(@).val(); update_sources_list()

    # Global click event handlers

    $('#create_playlist_button').click (e) -> $.get '/audiosources/json/create-audio-source', playlist_view
    $('#uploaded_audiofiles .audiofile_play').live 'click', handle_audiofile_play

    #show_edit_planning()
