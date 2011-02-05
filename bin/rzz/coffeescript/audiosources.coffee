# Main Application singleton
# Regroups all the global mechanisms and window variables
Application =

    views_components: (name) ->
        cmap =
            playlist: PlaylistComponent
            main: MainComponent
            planning: PlanningComponent
        return cmap[name]

    active_components: {}

    current_view: 'main'
    current_component: undefined
    menu_items: {}
    is_ctrl_pressed: no

    init: ->
        $(document).keydown (e) =>
            if e.which == 17 then @is_ctrl_pressed = yes

        $(document).keyup (e) =>
            if e.which == 17 then @is_ctrl_pressed = no

        @views_menu = new Menu "Fenêtres actives", do_select:true
        @playlist_menu = new Playlist()

    load: (name, view_params, confirm) ->

        # If the view to load is the same, then destroy it
        if @current_view == name
            if @current_component?.has_changes and not confirm
                menu = make_xps_menu
                    text: "Attention ! vous risquez de perdre le résultat de votre édition, êtes vous sur de vouloir continuer ?"
                    actions:
                        oui:->
                            Application.load name, view_params, yes
                            $(@).dialog('close').remove()
                        non:->
                            $(@).dialog('close').remove()
                    show_validate:no
                show_menu menu
                return

            @current_component?.close()
        # If the view to load is a different one
        # Store the current view and hide it
        else
            @active_components[name]?.close()
            @active_components[@current_view] = @current_component
            @current_component?.hide()

        klass = @views_components(name)
        @current_component = new klass(view_params)
        @current_view = name

        if not(@menu_items[name])
            @menu_items[name] = @views_menu.add_link_element name, (=> @show name;return yes), yes
            @current_component.menu_el = @menu_items[name]

        @current_component.on_close =>
            @menu_items[name] = null

    show: (name) ->
        if not(@current_view == name) and @active_components[name]
            @active_components[@current_view] = @current_component
            @current_component?.hide()
            @current_view = name
            @current_component = @active_components[name]
            @current_component?.show()

    view: (view_name) ->
        if view_name?
            @current_view = view_name
        else
            @current_view

# Widgets
# =======

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
            do (model_name, button_name) =>
                dom = tag 'span', button_name, class:@button_class
                @container.append(dom)

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
        start = (new Date).getTime()
        $.getJSON @view_url(), @filter_to_params() , (audiomodels_list) =>

            @all = []
            @by_id = {}

            ul = tag 'ul'
            @container.html ''
            @container.append ul

            start = (new Date).getTime()
            for json_audiomodel in audiomodels_list
                audiomodel = new ListAudiomodel(@current_model, json_audiomodel)
                @all.push audiomodel
                @by_id[audiomodel.id] = audiomodel
                ul.append audiomodel.ui
                audiomodel.bind_events()

            ul.make_selectable
                select_class: 'selected-box'
                handler: =>
                    @selected_audiomodels = (parseInt(i.value) for i in ul.find('li.selected-box input'))

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
                "Editer selection":
                    action: ->
                        menu = new AudioFileGroupEditForm(Widgets.audiomodels.selected_audiomodels)
                        menu.show()

            global:{}

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
                        Application.load "planning"
            selection: null

    footers: {}
    container: d$ "#track_selector_footer"
    active_footer: undefined

    load: ->
        for model, actions_types of @actions
            footer = @footers[model] = div "", class:"head_and_foot"
            footer_container = div "", class:"footer_container"
            footer.append footer_container
            for action_type, actions of actions_types
                for action_name, properties of actions
                    if properties.predicate and not properties.predicate()
                        continue
                    action_button = tag "span", action_name, class:"bbutton"
                    action_button.click properties.action
                    footer_container.append action_button

        for footer_model, footer of @footers
            @container.append footer
            footer.hide()

        @update()

    update: () ->
        audiomodel = Widgets.audiomodels.current_model
        @active_footer?.hide()
        @active_footer = @footers[audiomodel]
        @active_footer.show()


class TemplateComponent
    # Abstract class for elements represented by an EJS template

    dom: null

    constructor: (opts) ->
        @dom = render_template opts.template, opts.context
        @ui = $(@dom)

    show_hook: ->
    hide_hook: ->

    hide: ->
        @hide_hook()
        @ui.hide()

    show: ->
        @show_hook()
        @ui.show()


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

    set_play_link: (play_link) ->
        if @type == "audiofile"
            @ui.find(".#{@type}_play").attr "href", play_link

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
                        audiomodel.set_play_link af.file_url
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
                previous_top = 0; previous_left = 0; column=0

                @ui.bind 'dragstart', (e, dd) =>

                    height = @length / 60
                    width = $(planning.tds[1]).width()
                    proxy = div @title, class:'planning_element'

                    proxy.css top:dd.offsetY, left:dd.offsetX, position:'absolute'
                    $('body').append proxy
                    proxy.width(width).height(height)
                    td_positions = new GridPositionner(planning.tds)

                @ui.bind 'drag', (e, dd) =>

                    el = $ proxy
                    rel_pos = planning.el_pos(el)
                    proxy_in_board = (rel_pos.top + (el.height() / 2) > 0 and rel_pos.left + (el.width() / 2) > 0)

                    if proxy_in_board
                        rel_cpos = planning.pos top:dd.offsetY, left:dd.offsetX
                        top = step(rel_cpos.top, 10)
                        [column, left] = td_positions.closest(rel_cpos.left)
                        left += 1

                        if top != previous_top or left != previous_left
                            planning.el_pos el, top: top, left: left
                            col_width = $(planning.tds[column]).width()
                            el.width(col_width)
                            previous_top = top; previous_left = left
                    else
                        el.css top:dd.offsetY, left:dd.offsetX

                @ui.bind 'drop', (e, dd) =>

                    el = $ proxy
                    rel_pos = planning.el_pos(el)
                    proxy_in_board = (rel_pos.top + (el.height() / 2) > 0 and rel_pos.left + (el.width() / 2) > 0)

                    el.remove()

                    # Only create an element if the proxy is inside the planning board
                    if proxy_in_board
                        p_el = planning.create_element
                            audiosource:@audiomodel_base
                            type: planning.active_type
                            time_start:
                                hour: parseInt(previous_top /60)
                                minute: previous_top % 60
                            day: column-1


    constructor: (type, json_model) ->

        @type = type
        $.extend this, json_model
        @audiomodel_base = json_model

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
            @ui.find('.audiofile_play').click (e) =>
                e.preventDefault()
                Application.playlist_menu.add_audiofile @, yes

        else if @type == "audiosource"
            @ui.find('.audiosource_edit').click (e) ->
                e.stopPropagation(); e.preventDefault()
                $.get @href, (json) ->
                    Application.load 'playlist', json

        else if @type == "planning"
            @ui.find('.planning_edit').click (e) ->
                e.stopPropagation(); e.preventDefault()
                $.getJSON @href, (json) ->
                    Application.load "planning", json

            @ui.find('.planning_set_active').click (e) ->
                e.stopPropagation(); e.preventDefault()
                $.getJSON @href, (json) ->
                    if Widgets.audiomodels.current_model == "planning"
                        Widgets.audiomodels.load()



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

    to_delete_tags_array: -> id for _, id of @to_delete_tags

    make_table: () ->
        @table = $(render_template "tags_table")
        for category, tags of @tags_by_category

            # Build the table line
            category_tr = tag "tr"
            tags_td = tag "td"
            tags.remaining = 0

            for ctag in tags
                do (ctag) =>
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

class AudioFileGroupEditForm extends TemplateComponent

    url: "/audiosources/json/edit-audio-files"

    constructor: (selected_audiofiles) ->
        super template:'audiofile_group_edit_form'

        url = @url
        @menu = make_xps_menu
            name: "group_edit_audiomodels"
            text: @ui
            title: "Edition en groupe"
            validate_action: ->
                $(@).find('form').ajaxSubmit
                    dataType:'json'
                    data: {'audiofiles': selected_audiofiles}
                    url: url
                    success: (json) -> return null

    show: () ->
        show_menu @menu

class AudioFileForm extends TemplateComponent
    # Form for audio file upload

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
                opts.success?(response.audiofiles)
                if response.status == "error"
                    alert("Error with the file uploaded")
                else
                    @success_message response.audiofiles

    update_progress_info: ->
        =>
            $.getJSON @progress_url, {"X-Progress-ID": @uuid}, (data, status) =>
                if data
                    progress = parseInt(data.received) / parseInt(data.size)
                    @progress_bar.progressbar "option", "value", progress * 100

    success_message: (audiofiles) ->
        for af in audiofiles
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
        @menu_el?.remove()
        @hide_hook()
        @ui.remove()
        @on_close_func()

    on_close: (func) ->
        @on_close_func = func


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
            tags: $ '#playlist_edit_content .tags_table_container'
            file_forms: $ '#audiofile_forms'
        @form = $ '#audiosource_form'
        @submit_button = $ "#audiosource_form_submit"

    constructor: (json) ->
        super template: "audiosource_base", context: json
        @init_components()

        @action = json.action

        # Add a form for audio file upload
        gen_audiofile_form = =>
            return new AudioFileForm {
                beforeSubmit: () =>
                    @fields.file_forms.append gen_audiofile_form().ui
                success: (audiofiles) =>
                    for audiofile in audiofiles
                        @tracklist.append audiofile, yes
            }

        @fields.file_forms.append gen_audiofile_form().ui

        @inputs.tags.autocomplete(multicomplete_params json.tag_list)
        @inputs.tags.unbind 'blur.autocomplete'

        # Add Necessary information for playlist, if in edition mode
        if @action == "edition"

            @submit_button.text("Editer la playlist")
            @tags_table = new TagsTable(json.audiosource.tags_by_category)
            @fields.tags.append(@tags_table.ui)

            for audiofile in json.audiosource.sorted_audiofiles
                @tracklist.append(audiofile, no)
        else
            @submit_button.text("Créer la playlist")

        @submit_button.click (e) =>
            e.preventDefault();@submit()

    submit: () ->
        data = if @action == "edition" then @tags_table.to_delete_tags else {}
        $.extend data, @tracklist.get_tracks_map()
        @form.ajaxSubmit
            data: data
            success: (r) =>
                if Widgets.audiomodels.current_model == "audiosource"
                    Widgets.audiomodels.load()
                Application.load "main"
                action = if @action=="edition" then "modifiée" else "ajoutée"
                post_message "La playlist #{r.audiosource.title} à été #{action} avec succès"
                @close()


handle_audiofile_play = (e) ->
    # Plays an audiofile on the flash player 

    e.preventDefault(); e.stopPropagation()
    play_audiofile e.currentTarget.href


play_audiofile = (url) ->
    player = document.getElementById 'audiofile_player'
    if player then player.dewset url

get_player_pos = ->
    player = document.getElementById 'audiofile_player'
    if player then player.dewgetpos() else 0

player_stop = ->
    player = document.getElementById 'audiofile_player'
    if player then player.dewstop() else 0


# ================================ PLANNINGS PART ================================= #

class PlanningComponent extends AppComponent

    create_link:"/audiosources/json/create-planning"
    edit_link:"/audiosources/json/edit-planning"

    show_hide: ->
        for planning_element in @planning_elements.values()
            if planning_element.type == @active_type
                planning_element.ui.show()
            else
                planning_element.ui.hide()

    hide_hook: -> $("body").css overflow:"auto"

    bind_events: ->

        @submit_button.click =>
            success_function = => =>

                name = @title_input.val()
                Application.load "main"
                post_message "Le planning #{name} a été #{if @mode=="creation" then "créé" else "édité"} avec succes"
                @close()

            if @mode == "creation"
                $.post @create_link, {planning_data:@to_json()}, success_function()
            else if @mode == "edition"
                tjs = @to_json()
                $.post "#{@edit_link}/#{@id}", {planning_data:tjs}, success_function()

        str1 = "Montrer détails"
        str2 = "Cacher détails"
        @show_details_button.click =>
            @planning_more.toggle('fast', =>
                @update_height())
            @show_details_button.text(if @show_details_button.text() == str1 then str2 else str1)

        @show_choices.find("input").click (e) =>
            @active_type = e.target.id.split(/planning_show_/)[1]
            @show_hide()

        $(window).resize () => @update_height()

    init_components: ->
        @board = $ '#main_planning_board'
        @container = $ '#main_planning_board_container'
        @tds = $ '#planning_board td'
        @tds_width = @tds.map (i, el) -> $(el).width()
        @board_table = $ '#planning_board'
        @submit_button = $ '#planning_submit'
        @show_details_button = $ '#planning_show_details'
        @title_input = $ '#planning_title'
        @tags_input = $ '#planning_tags'
        @tags_table_container = $ '#planning_edit .tags_table_container'
        @show_choices = $ '#planning_show_choices'
        @show_choices.buttonset()
        @show_choices.disableTextSelect()
        @planning_more = $ "#planning_more"
        @update_height()

    update_height: ->
        @container.height $(window).height() - @container.offset().top - 20

    add_grid: ->
        for h in [0...24]
            for i in [1..6]
                div_class = {3:'half',6:'hour'}[i] or 'tenth'
                gridiv = div "", class:"grid_time grid_#{div_class}"
                @board.append(gridiv)
                if i == 1
                    timediv = div "#{format_number h, 2}h00", class:"grid_showtime"
                    @board.find(".hours_td").append(timediv)

    init_data: (data) ->
        if data.name
            @title_input.val data.name
        if data.planning_elements
            @add_elements(data.planning_elements)

    add_elements: (planning_elements) ->
        for planning_element in planning_elements
            @create_element planning_element

    constructor: (data) ->
        start = (new Date).getTime()
        super template: "planning"
        @planning_elements = new Set()
        @init_components()
        @add_grid()
        start = (new Date).getTime()
        @bind_events()
        $("body").css overflow:"hidden"

        if data
            @tags_table = new TagsTable(data.tags_by_category)
            @tags_table_container.append @tags_table.ui
            @id = data.id
            @mode = "edition"
            start = (new Date).getTime()
            @init_data data
        else
            @mode = "creation"
        @active_type = "single"
        @show_hide()

    pos: (el_pos) ->
        # Takes a coordinates object as input -> {left:int, top:int}
        # Returns a coordinate object relative to the planning board

        pboard_off = @board_table.offset()
        el_pos.top -= pboard_off.top
        el_pos.left -= pboard_off.left
        return el_pos

    el_pos: (el, pos) ->
        # If only el is given, returns the position of el on the planning board
        # If pos is given as pos = {top:int, left:int},
        # then place el at the given pos relative to the board

        pboard_off = @board_table.offset()
        el_off = el.offset()

        if pos
            el.css
                top: pboard_off.top + pos.top
                left: pboard_off.left + pos.left
        else
            el_off.top -= pboard_off.top
            el_off.left -= pboard_off.left
            return el_off

    create_element: (json_model) ->
        # Create a planning element
        # With current planning object as parent
        planning_element = new PlanningElement @, json_model
        @planning_elements.add planning_element
        planning_element

    delete_element: (planning_element) ->
        @planning_elements.remove planning_element
        planning_element.ui.remove()

    to_json: ->
        # Returns a string JSON representation of the planning
        # Including all the planning elements, the tags, and the planning title
        pl_els = (el.serialize() for el in @planning_elements.values())
        planning =
            planning_elements: pl_els
            title: @title_input.val()
            tags: @tags_input.val()

        if @mode == "edition"
            planning.to_delete_tags = @tags_table.to_delete_tags_array()

        return JSON.stringify planning


class PlanningElement extends Audiomodel

    is_dragged:no

    constructor: (planning, json_model) ->
        height = 0; handles = no; cl=""
        
        @string_id = "planning_element_#{gen_uuid()}"

        @planning = planning
        @type = "single"
        $.extend this, json_model

        if @type == "single"
            height = @audiosource.length /60
        else
            handles = yes
            if not @time_end
                @time_end = {}
                height = @audiosource.length /60
            else
                if @time_end.hour == 0 then @time_end.hour = 24
                height = @height_from_time_end()

        @_set_column_from_day()
        @top = @time_start.minute + @time_start.hour * 60
        @dom = "
        <div class='planning_element #{@type}' style='top:#{@top}px;width:#{@planning.tds_width[@day + 1]}px;height:#{height}px;'>
          <div class='planning_element_container' >
            <div class='phead'>
                <div style='position:relative;top:-3px;'>
                    <span class='planning_element_time'>#{format_time @time_start}</span>
                    <span>#{@audiosource.title}</span>
                    <span class='delete_button'>x</span>
                </div>
            </div>
            #{if handles then "<div class='planning_element_foot'></div>" else ""}
          </div>
        </div> "
        @ui = $(@dom)

        @init_components()
        if @time_end == null then @time_end = {}

        @bind_events()
        @column.append(@ui)
        @update_width()

    make_model: () ->
        # Returns every piece of information about the planning element
        # As a map of values
        time_start: $.extend {}, @time_start
        time_end: $.extend {}, @time_end
        type:@type
        random:@random
        day:@day
        audiosource:@audiosource
        planning_id:@planning_id

    init_components: ->
        @ui_head = @ui.find('.planning_element_head')
        @ui_phead = @ui.find('.phead')
        @ui_foot = @ui.find('.planning_element_foot')
        @delete_button = @ui.find('.delete_button')
        @time_span = @ui.find('.planning_element_time')

    edit_properties: -> =>
        form = div ""

    make_continuous: ->
        @ui_head.show(); @ui_foot.show()
        @ui.css opacity:0.75
        @ui.css 'z-index':200

    make_single: ->
        @ui_head.hide(); @ui_foot.hide()
        @time_end = {}
        @ui.css opacity:0.9
        @ui.css 'z-index':400
        @ui.height @audiosource.length / 60

    update_width: -> @ui.width @column.width()

    bind_events: ->
        color = null; z_index=null
        td_positions = []
        element = null

        phead_set_normal_size = => @ui_phead.animate {height:"10px"}, 200

        @ui.hover =>
            if not @is_dragged then @ui.addClass "planning_element_hover"
        , => @ui.removeClass "planning_element_hover"

        timeout = null
        @ui_phead.hover =>
            if not @is_dragged
                timeout = setTimeout (=>
                    height = @ui_phead.find('div').height() + 4
                    if (not @is_dragged) and height > 20 then @ui_phead.animate {height:"#{height}px"}, 200
                    timeout = null
                ), 400
        , =>
            if timeout then clearTimeout timeout
            else phead_set_normal_size()

        # Bind the resizing of the window 
        # to the resizing of the planning window
        $(window).resize => @update_width()

        # Planning drag routines
        # ----------------------
        #
        # These are the functions handling the dragging and dropping of elements in a planning
        # Doesn't use jquery ui draggable, but the lower level jquery.drag plugin

        @ui.bind 'dragstart', (e, dd) =>
            @planning.has_changes = yes
            phead_set_normal_size()
            # Drag start function. 
            # It has the responsibility of creating a new element if ctrl is pressed
            e.stopPropagation(); e.preventDefault()

            @is_dragged = yes

            if Application.is_ctrl_pressed
                element = @planning.create_element @make_model()
            else
                element = @

            z_index = element.ui.css 'z-index'

            # TODO: Remove hard-coded color element
            element.ui.addClass "planning_element_dragged"
            element.ui.css 'z-index': z_index + 10
            td_positions = new GridPositionner(@planning.tds)

        @ui.bind 'drag', (e, dd) =>
            # Drag function
            # Called while the button's pressed and the mouse moves
            e.stopPropagation();e.preventDefault()
            rel_cpos = element.planning.pos top:dd.offsetY, left:dd.offsetX
            top = step(rel_cpos.top, 10)
            top = if top > 0 then top else 0
            [column] = td_positions.closest(rel_cpos.left)
            if column-1 != @day and column > 0
                element.set_day_from_column column
                element.ui.width element.column.width()
            element.set_time_from_pos top
            @time_span.text format_time @time_start
            if element.type == "continuous" then element.refresh_time_end()

        @ui.bind 'dragend', (e, dd) =>
            # Drag end function
            # Called when the user releases the button

            @is_dragged = no

            e.stopPropagation();e.preventDefault()
            element.ui.removeClass "planning_element_dragged"
            element.ui.css "z-index": z_index

        orig_height = null; orig_top = null

        if @type == "continuous"
            @ui_phead.css cursor:"s-resize"
            @ui_phead.bind 'dragstart', (e, dd) =>
                phead_set_normal_size()
                @is_dragged = yes
                e.stopPropagation();e.preventDefault()
                orig_height = @ui.height()
                orig_top = @top

            @ui_phead.bind 'drag', (e, dd) =>
                e.stopPropagation();e.preventDefault()
                difference = step(dd.deltaY, 10)
                @set_time_from_pos(orig_top + difference)
                @set_time_end_from_height orig_height - difference

            @ui_phead.bind 'dragend', (e, dd) => @is_dragged = no

        @ui_foot.bind 'dragstart', (e, dd) =>
            phead_set_normal_size()
            @is_dragged = yes
            e.stopPropagation();e.preventDefault()
            orig_height = @ui.height()

        @ui_foot.bind 'drag', (e, dd) =>
            e.stopPropagation();e.preventDefault()
            difference = step(dd.deltaY, 10)
            @set_time_end_from_height orig_height + difference

        @ui_foot.bind 'dragend', (e, dd) => @is_dragged = no

        @delete_button.click (e, dd) =>
            @planning.delete_element @

    set_day_from_column: (column) ->
        @day = column - 1
        @set_column_from_day()

    _set_column_from_day: ->
        @column = $(@planning.tds[@day + 1])

    set_column_from_day: ->
        @column = $(@planning.tds[@day + 1])
        @column.append @ui

    set_time_from_pos : (top_pos) ->
        @time_start.hour = parseInt top_pos / 60
        @time_start.minute = top_pos % 60
        @set_pos_from_time()

    set_pos_from_time: ->
        @top = @time_start.minute + @time_start.hour * 60
        @ui.css top: @top

    set_time_end_from_height: (height) ->
        @time_end.hour = parseInt((height + @time_start.minute + @time_start.hour * 60)/ 60)
        @time_end.minute = (height + @time_start.minute) % 60
        @ui.height height

    height_from_time_end: ->
        height = (@time_end.hour - @time_start.hour) * 60
        height += @time_end.minute - @time_start.minute
        return height

    refresh_time_end: -> @set_time_end_from_height @ui.height()

    serialize : ->
        o = object_with_keys @, ['day', 'time_start', 'time_end', 'type']
        o.audiosource_id = @audiosource.id
        return o

    formatted_time: -> "#{format_number @time_start.hour, 2}h#{format_number @time_start.minute, 2}"

    toString: -> @string_id


class GridPositionner

    constructor: (tds) ->
        @steps = (Math.round($(el).position().left) for el in tds)

    closest: (num) ->
        ret = null; col = null

        $.each @steps, (i) =>
            if @steps[i] <= num < @steps[i+1]
                if num - @steps[i] < @steps[i+1] - num
                    ret = @steps[i]
                    col = i
                else
                    ret = @steps[i + 1]
                    col = i + 1

        if col == null
            last_i = @steps.length - 1

            if num > @steps[last_i]
                ret = @steps[last_i]
                col = last_i
            else
                ret = 0
                col = 0

        if col==0 then col=1;ret=@steps[col]

        return [col, ret]

step = (num, step) -> num - (num % step)


# ================================================ MENUS =============================================== #

class Menu extends TemplateComponent
    header: d$ '#headertools'
    
    constructor: (name, opts) ->
        if opts then $.extend this, opts
        super template:'menu_widget', context: {name:name}
        @header.append(@ui)
        @init_components()
        @bind_events()

    init_components: ->
        @ui_menu  = @ui.find("ul.menu-items")
        @ui_menu_head = @ui.find(".menu_head")
        @ui_menu.hide()

    set_selected: (el) ->
        @ui_menu.find("li").removeClass "menu_selected"
        el.addClass "menu_selected"

    add_link_element: (name, handler, do_set_selected) ->
        link_el = tag "a", name, href:"#"
        el = tag "li", link_el
        @ui_menu.append el

        if do_set_selected then @set_selected(el)

        if handler
            el.click (e) =>
                if (handler e) then @ui_menu.hide()
                if @do_select then @set_selected(el)

        return el

    bind_events: ->
        @ui_menu_head.click => @ui_menu.toggle()

class Playlist extends Menu

    constructor: ->
        super "Playlist", do_select:true
        @dragging = no
        @dont_playnext = false
        @audiofiles = []
        start_pos=null;stop_pos=null
        @ui_menu.sortable
            start: (e, ui) =>
                $.each @ui_menu.find("li"), (i, el) -> if el == ui.item[0] then start_pos = i
                @dragging = yes
            stop: (e, ui) =>
                $.each @ui_menu.find("li"), (i, el) -> if el == ui.item[0] then stop_pos = i
                el = @audiofiles.splice(start_pos, 1)[0]
                @audiofiles.splice(stop_pos, 0, el)


    play: (audiofile) ->
        play_audiofile audiofile.file_url
        @current = audiofile
        if not @inter
            @inter = setInterval (=>
                if get_player_pos() == 0
                    if @dont_playnext then @dont_playnext = false
                    else
                        i = @audiofiles.indexOf(@current) + 1
                        if i < @audiofiles.length
                            @current = @audiofiles[i]
                            play_audiofile @current.file_url
                            @set_selected $(@ui_menu.find("li")[i])
                ), 1000

    
    add_audiofile: (audiofile, do_play) ->
        do_play ?= no
        play = => @play audiofile

        el = @add_link_element "#{audiofile.title} - #{audiofile.artist}",null , do_play

        el.click (e) =>
            if @dragging then @dragging = no
            else
                @dont_playnext = true
                @set_selected(el)
                play()

        @audiofiles.push audiofile
        if do_play then play()
        @ui_menu.sortable('refresh')



create_menu = (name, elements) ->
    new Menu(name, elements)


# ========================================= DOCUMENT READY PART ======================================== #

$ ->
    # Init application singleton
    Application.init()

    # Load every widget
    for cname, widget of Widgets
        widget.load()

    # Load main component
    Application.load "main"
