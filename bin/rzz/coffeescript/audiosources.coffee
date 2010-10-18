
Application =
    # Main application singleton, regroups global mechanics

    views_components: (name) ->
        cmap =
            playlist: PlaylistComponent
            main: MainComponent
            planning: PlanningComponent
        return cmap[name]

    current_view: 'main'
    current_component: undefined

    load: (name, view_params) ->
        @current_component?.close()
        klass = @views_components(name)
        @current_component = new klass(view_params)
        @current_view = name

    view: (view_name) ->
        if view_name?
            @current_view = view_name
        else
            @current_view

Widgets = {}

Widgets.tags =
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


Widgets.audiomodel_selector =
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
                Widgets.footer_actions.update()

        @container.make_selectable
            unique_select: yes
            select_class: @selected_class


Widgets.text_selector =
    container: d$ '#text_selector'
    select_delay: 100

    select: ->
        =>
            Widgets.audiomodels.text_filter = @container.val()
            Widgets.audiomodels.load()
            @timeout_id = undefined

    reset: -> @container.val(""); Widgets.audiomodels.text_filter = ""

    load: ->
        @container.keyup (e) =>
            if @timeout_id
                clearTimeout(@timeout_id)
            @timeout_id = setTimeout @select(), @select_delay


Widgets.audiomodels =
    container: d$ '#track_selector'
    models:
        audiofile: "Tracks"
        audiosource: "Playlists"
        planning: "Plannings"
    current_model: 'audiofile'

    view_url: -> "/audiosources/#{@current_model}/list/"

    all: []
    by_id: {}

    text_filter: ""
    clear_filter: -> Widgets.text_selector.reset()

    filter_to_params: ->
        map = {}
        for idx, tag of Widgets.tags.selected_tags
            map["tag_#{idx}"] = tag
        if @text_filter then map["text_filter"] = @text_filter
        return map

    elements: -> @container.find("li")

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

            ul.make_selectable select_class: 'selected-box'

            $('[id$="select_footer"]').hide()
            $("##{@current_model}_select_footer").show()

Widgets.footer_actions =

    actions:
        audiofile:
            selection:
                "Jouer":
                    action: ->
                "Ajouter a la playlist":
                    predicate: -> Application.current_view == "playlist"
                    action: ->
                "Supprimer":
                    action: ->
                "Ajouter tags":
                    action: ->
            global:
                "Uploader des tracks":
                    action: ->
        audiosource:
            global:
                "Créer une playlist":
                    action: ->
                        $.getJSON "/audiosources/json/create-audio-source", (data) ->
                            Application.load "playlist", data
            selection:
                "Supprimer":
                    action: ->
                "Ajouter tags":
                    action: ->
        planning:
            global:
                "Creer un planning":
                    action: ->
                        console.log "LOLDUDE"
                        Application.load "planning"
            selection: null

    footers: {}
    container: d$ "#track_selector_footer"
    active_footer: undefined

    load: ->
        for model, actions_types of @actions
            footer = @footers[model] = div "", class:"head_and_foot"
            for action_type, actions of actions_types
                for action_name, properties of actions
                    if properties.predicate and not properties.predicate()
                        continue
                    action_button = tag "button", action_name, class:"footer_button"
                    action_button.click properties.action
                    footer.append action_button
        @update()

    update: () ->
        audiomodel = Widgets.audiomodels.current_model
        @active_footer?.remove()
        @active_footer = @footers[audiomodel]
        @container.append @active_footer
        @active_footer.find(".footer_button").button()


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

    post_message: (af) ->
        post_message "Le morceau #{af.artist} - #{af.title} a été modifié avec succès"

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
                        audiomodel.post_message af
        }


    handle_audiofile_edit: ->
        audiomodel = @
        return (e) ->
            e.preventDefault()
            e.stopPropagation()
            $.getJSON @href, (data) ->
                menu = audiomodel.make_audiofile_edit_menu(data)
                show_menu menu


class ListAudiomodel extends Audiomodel
    # Represents an audiomodel in the audiomodel list

    view_events:
        playlist: ->
            tracklist = Application.current_component.tracklist
            tracklist.container.sortable('refresh')
            if @type == "audiofile"
                @ui.draggable
                    connectToSortable: tracklist.container
                    helper:'clone'
                    appendTo:'body'
                    scroll:no
                    zIndex:'257'

        planning: ->
            if @type == "audiosource"

                td_positions = []
                planning = Application.current_component
                proxy = null

                @ui.bind 'dragstart', (e, dd) =>
                    console.log @
                    height = @length / 60
                    width = planning.board.width()
                    proxy = div @title, class:'audiofile_proxy'
                    proxy.css top:dd.offsetY, left:dd.offsetX, position:'absolute'
                    $('body').append proxy
                    proxy.width(width).height(height)
                    td_positions = Math.round($(el).position().left) for el in planning.tds

                @ui.bind 'drag', (e, dd) =>
                    el = $ proxy
                    rel_pos = planning.el_pos(el)
                    proxy_in_board = (rel_pos.top + (el.height() / 2) > 0 and rel_pos.left + (el.width() / 2) > 0
                    if proxy_in_board
                        rel_cpos = planning.pos top:dd.offsetY, left:dd.offsetX
                        planning.el_pos el,
                            top: step(rel_cpos.top, 10)
                            left: closest(rel_cpos.left, td_positions)+1
                    else
                        el.css top:dd.offsetY, left:dd.offsetX


    constructor: (type, json_model) ->

        @type = type
        $.extend this, json_model

        super
            template: "#{@type}_list_element"
            context: {audiomodel:json_model}

        @view_events[Application.current_view]?.apply(@, [])

    handle_delete: ->
        audiomodel = @
        msg = "L'élément #{if @artist? then "#{@artist} -"} #{@title} a bien été supprimé"
        delete_menu = (delete_link) ->
            make_xps_menu {
                name: "delete_audiomodel_#{@id}"
                text: "Etes vous sur de vouloir supprimer ce#{if @type=="audiofile" then " morceau" else "tte playlist"} ?"
                title: "Suppression d'un#{if @type=="audiofile" then " morceau" else "e playlist"}"
                show_validate:no
                actions:
                    "Oui": ->
                        $.getJSON delete_link, (json) =>
                            post_message msg
                            audiomodel.ui.remove()
                            $(@).dialog('close').remove()
                    "Non": ->
                        $(@).dialog('close').remove()
            }
        return (e) ->
            e.preventDefault()
            e.stopPropagation()
            show_menu delete_menu(e.target.href)

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
                tag_span = tag "span", "#{ctag.name} ",
                    class:"audiofile_tag", id:"tag_#{ctag.id}"
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
    # Form for audio file upload
    # TODO: Make that shit work with a multiple file input

    progress_url: "/upload-progress/"
    update_freq: 1000

    constructor: (opts) ->
        @uuid = gen_uuid()
        super template:'audiofile_form', context: {uuid: @uuid}

        @progress_bar = if opts.progress_bar then opts.progress_bar
        else @ui.find '.progress_bar'

        @ui.ajaxForm
            dataType: 'json'
            target: @ui
            beforeSubmit: @
            success: @success

            beforeSubmit: (arr, form, options) =>
                opts.beforeSubmit?()
                @progress_bar.progressbar progress: 0
                @interval_id = setInterval @update_progress_info(), @update_freq
                return true

            success: (response, status_text, form) =>
                clearInterval @interval_id
                @progress_bar.hide()
                @ui.remove()
                opts.success?(response.audiofile)
                if response.status == "error"
                    alert("Error with the file uploaded")
                else
                    @success_message response.audiofile

    update_progress_info: ->
        =>
            $.getJSON @progress_url, {"X-Progress-ID": @uuid}, (data, status) =>
                if data
                    progress = parseInt(data.received) / parseInt(data.size)
                    @progress_bar.progressbar "option", "value", progress * 100

    success_message: (af) ->
        post_message "Le morceau #{af.artist} - #{af.title} a été ajouté avec succès"


class PlaylistElement extends Audiomodel

    constructor: (audiofile, container, fresh) ->
        @container = container
        @type = "audiofile"
        @fresh = if fresh then fresh else false
        @audiofile = audiofile
        super template:'playlist_element', context: {fresh:@fresh, audiofile:audiofile}
        @bind_events()

    bind_events: ->
        @ui.find('.audiofile_edit').click @handle_audiofile_edit()
        @ui.find('.audiofile_play').click handle_audiofile_play
        @ui.find('.source_element_delete').click (e) =>
            e.preventDefault()
            if @fresh then @ui.remove()
            else @ui.addClass 'to_delete_source_element'

    toString: () -> "playlist_element_#{gen_uuid()}"


class TrackList

    constructor: ->
        @length = 0
        @elements = new Set()
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

    get_tracks_map: () ->
        # Adds the playlist tracks to the data to be submitted, if they're not marked for deletion

        data = {}
        lis = @container.find("li")

        for li, i in lis when not $(li).hasClass "to_delete_source_element"
            data["source_element_#{i}"] = $(li).children('input').val()

        return data


class AppComponent extends TemplateComponent
    main_content_holder: d$ "#main_container"
    bind_events: () ->
    constructor: (opts) ->
        super opts
        @main_content_holder.append(@ui)
    close: () ->
        @ui.remove()


class MainComponent extends AppComponent

    constructor: () ->
        super template:"main_component"


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
        @submit_button = $ "#audiosource_form_submit"

    constructor: (json) ->
        super template: "audiosource_base", context: json
        @init_components()

        @action = json.action

        # Add a form for audio file upload
        audiofile_form = new AudioFileForm {
            success: (audiofile) =>
                @tracklist.append audiofile, yes
        }

        @fields.file_forms.append audiofile_form.ui

        @inputs.tags.autocomplete(multicomplete_params json.tag_list)
        @inputs.tags.unbind 'blur.autocomplete'

        # Add Necessary information for playlist, if in edition mode
        if @action == "edition"

            @tags_table = new TagsTable(json.audiosource.tags_by_category)
            @fields.tags.append(@tags_table.ui)

            for audiofile in json.audiosource.sorted_audiofiles
                @tracklist.append(audiofile, no)

        @submit_button.button()
        @submit_button.click (e) =>
            e.preventDefault();@submit()

    submit: () ->
        data = if @action == "edition" then @tags_table.to_delete_tags else {}
        $.extend data, @tracklist.get_tracks_map()
        @form.ajaxSubmit
            data: data
            success: (r) ->
                if Widgets.audiomodels.current_model == "audiosource"
                    Widgets.audiomodels.load()
                Application.load "main"
                action = if @action=="edition" then "modifiée" else "ajoutée"
                post_message "La playlist #{r.audiosource.title} à été #{action} avec succès"


handle_audiofile_play = (e) ->
    # Plays an audiofile on the flash player 

    e.preventDefault(); e.stopPropagation()
    player = document.getElementById 'audiofile_player'
    if player then player.dewset e.target.href


# ================================ PLANNINGS PART ================================= #

class PlanningComponent extends AppComponent

    init_components: ->
        @board = $ '#main_planning_board'
        @container = $ '#main_planning_board_container'
        @tds = $ '#planning_board td'

    update_height: ->
        @container.height $(document).height() - @container.offset().top - 20

    add_grid: ->
        for _ in [0...24]
            for i in [1..6]
                div_class = {3:'half',6:'hour'}[i] or 'tenth'
                @board.append(div class:"grid_time grid_#{div_class}")

    constructor: (init_data) ->
        super template: "planning"
        @init_components()
        @update_height()
        @add_grid()


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
    # Load every widget
    for cname, widget of Widgets
        console.log "Loading component #{cname}"
        widget.load()

    # Load main component

    Application.load "main"
