
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

        for footer_model, footer of @footers
            @container.append footer
            footer.hide()

        @update()

    update: () ->
        audiomodel = Widgets.audiomodels.current_model
        @active_footer?.hide()
        @active_footer = @footers[audiomodel]
        @active_footer.show()
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
                previous_top = 0; previous_left = 0; column=0

                @ui.bind 'dragstart', (e, dd) =>

                    height = @length / 60
                    width = planning.tds.first().width()
                    proxy = div @title, class:'audiofile_proxy'

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
                    el.remove()
                    p_el = planning.create_element
                        audiosource:@audiomodel_base
                        type: planning.active_type
                        time_start:
                            hour: parseInt(previous_top /60)
                            minute: previous_top % 60
                        day: column


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
            @ui.find('.audiofile_play').click handle_audiofile_play

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

    create_link:"/audiosources/json/create-planning"
    edit_link:"/audiosources/json/edit-planning"

    show_hide: ->
        for planning_element in @planning_elements.values()
            if planning_element.type == @active_type
                planning_element.ui.show()
            else
                planning_element.ui.hide()

    bind_events: ->

        @submit_button.click =>
            success_function = => =>
                name = @title_input.val()
                Application.load "main"
                post_message "Le planning #{name} a été #{if @mode=="creation" then "créé" else "édité"} avec succes"

            if @mode == "creation"
                $.post @create_link, {planning_data:@to_json()}, success_function()
            else if @mode == "edition"
                $.post "#{@edit_link}/#{@id}", {planning_data:@to_json()}, success_function()

        @show_choices.find("input").click (e) =>
            @active_type = e.target.id.split(/planning_show_/)[1]
            @show_hide()

        $(window).resize () => @update_height()

    init_components: ->
        @board = $ '#main_planning_board'
        @container = $ '#main_planning_board_container'
        @tds = $ '#planning_board td'
        @board_table = $ '#planning_board'
        @submit_button = $ '#planning_submit'
        @title_input = $ '#planning_title'
        @tags_input = $ '#planning_tags'
        @tags_table_container = $ '#planning_edit_content .tags_table_container'
        @show_choices = $ '#planning_show_choices'
        @show_choices.buttonset()
        @show_choices.disableTextSelect()
        @submit_button.button()
        @update_height()

    update_height: ->
        @container.height $(document).height() - @container.offset().top - 20

    add_grid: ->
        for h in [0...24]
            for i in [1..6]
                div_class = {3:'half',6:'hour'}[i] or 'tenth'
                content = if i == 1 then "#{format_number h, 2}h00" else ""
                gridiv = div content, class:"grid_time grid_#{div_class}"
                @board.append(gridiv)

    init_data: (data) ->
        if data.name
            @title_input.val data.name
        if data.planning_elements
            @add_elements(data.planning_elements)

    add_elements: (planning_elements) ->
        for planning_element in planning_elements
            @create_element planning_element

    constructor: (data) ->
        super template: "planning"
        @planning_elements = new Set()
        @init_components()
        @add_grid()
        @bind_events()
        if data
            @tags_table = new TagsTable(data.tags_by_category)
            @tags_table_container.append(tag 'p' , 'Tags').append @tags_table.ui
            @id = data.id
            @mode = "edition"
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
        planning_element = new PlanningElement @, json_model
        @planning_elements.add planning_element

    delete_element: (planning_element) ->
        @planning_elements.remove planning_element
        planning_element.ui.remove()

    to_json: ->
        pl_els = el.serialize() for el in @planning_elements.values()
        to_stringify = 
            planning_elements: pl_els
            title: @title_input.val()
            tags: @tags_input.val()
        if @mode == "edition"
            to_stringify.to_delete_tags = @tags_table.to_delete_tags_array() 
        return JSON.stringify to_stringify


class PlanningElement extends Audiomodel

    constructor: (planning, json_model) ->
        super template: "planning_element", context: json_model
        @string_id = "planning_element_#{gen_uuid()}"

        @planning = planning
        @type = "single"
        $.extend this, json_model

        @init_components()
        if @time_end == null then @time_end = {}

        @set_column_from_day()
        @set_pos_from_time()
        @ui.width @column.width()

        if @type == "single"
            @ui.height @audiosource.length / 60
            @make_single()
        else

            if not @time_end
                @time_end = {}
                @ui.height @audiosource.length / 60

            if @time_end.hour == 0 then @time_end.hour = 24
            @set_height_from_time_end()
            @make_continuous()

        @bind_events()

    init_components: ->
        @ui_head = @ui.find('.planning_element_head')
        @ui_foot = @ui.find('.planning_element_foot')
        @delete_button = @ui.find('.delete_button')
        @delete_button.button()

    edit_properties: -> =>
        form = div ""

    make_continuous: ->
        @ui_head.show(); @ui_foot.show()
        @set_time_end_from_height step(@ui.height(), 10)
        @ui.css opacity:0.75
        @ui.css 'z-index': 200

    make_single: ->
        @ui_head.hide(); @ui_foot.hide()
        @time_end = {}
        @ui.css opacity:0.9
        @ui.css 'z-index':400
        @ui.height @audiosource.length / 60

    bind_events: ->
        color = null; z_index=null
        td_positions = []

        $(window).resize => @ui.width @column.width()

        @ui.bind 'dragstart', (e, dd) =>
            e.stopPropagation();e.preventDefault()
            color = @ui.css 'background-color'
            z_index = @ui.css 'z-index'
            @ui.css 'background-color':'#EBC'
            @ui.css 'z-index': z_index + 10
            td_positions = new GridPositionner(@planning.tds)

        @ui.bind 'drag', (e, dd) =>
            e.stopPropagation();e.preventDefault()
            rel_cpos = @planning.pos top:dd.offsetY, left:dd.offsetX
            top = step(rel_cpos.top, 10)
            top = if top > 0 then top else 0
            [column] = td_positions.closest(rel_cpos.left)
            if column != @day
                @set_day_from_column column
                @ui.width @column.width()
            @set_time_from_pos top
            if @type == "continuous" then @refresh_time_end()

        @ui.bind 'dragend', (e, dd) =>
            e.stopPropagation();e.preventDefault()
            @ui.css 'background-color':color
            @ui.css "z-index": z_index

        orig_height = null; orig_top = null

        @ui_head.bind 'dragstart', (e, dd) =>
            e.stopPropagation();e.preventDefault()
            orig_height = @ui.height()
            orig_top = @top

        @ui_head.bind 'drag', (e, dd) =>
            e.stopPropagation();e.preventDefault()
            difference = step(dd.deltaY, 10)
            @set_time_from_pos(orig_top + difference)
            @set_time_end_from_height orig_height - difference

        @ui_foot.bind 'dragstart', (e, dd) =>
            e.stopPropagation();e.preventDefault()
            orig_height = @ui.height()

        @ui_foot.bind 'drag', (e, dd) =>
            e.stopPropagation();e.preventDefault()
            difference = step(dd.deltaY, 10)
            @set_time_end_from_height orig_height + difference

        @delete_button.click (e, dd) =>
            @planning.delete_element @

    set_day_from_column: (column) ->
        @day = column
        @set_column_from_day()

    set_column_from_day: ->
        @column = $(@planning.tds[@day])
        @column.append @ui

    set_time_from_pos : (top_pos) ->
        @time_start.hour = parseInt top_pos / 60
        @time_start.minute = top_pos % 60
        @set_pos_from_time()

    set_pos_from_time: ->
        @top = @time_start.minute + @time_start.hour * 60
        @ui.css top: @top

    set_time_end_from_height: (height) ->
        @time_end.hour = (parseInt height / 60) + @time_start.hour
        @time_end.minute = (height + @time_start.minute) % 60 
        @ui.height height

    set_height_from_time_end: ->
        height = (@time_end.hour - @time_start.hour) * 60
        height += @time_end.minute - @time_start.minute
        @ui.height height

    refresh_time_end: -> @set_time_end_from_height @ui.height()

    serialize : ->
        o = object_with_keys @, ['day', 'time_start', 'time_end', 'type']
        o.audiosource_id = @audiosource.id
        return o

    formatted_time: -> "#{format_number @time_start.hour, 2}h#{format_number @time_start.minute, 2}"

    toString: -> @string_id


class GridPositionner

    constructor: (tds) ->
        @steps = Math.round($(el).position().left) for el in tds

    closest: (num) ->

        ret = null; col = null

        $.each @steps, (i) =>
            if @steps[i] <= num < @steps[i +1]
                if num - @steps[i] < @steps[i + 1] - num
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

        return [col, ret]

step = (num, step) -> num - (num % step)

# ========================================= DOCUMENT READY PART ======================================== #

$ ->
    # Load every widget
    for cname, widget of Widgets
        console.log "Loading component #{cname}"
        widget.load()

    # Load main component

    Application.load "main"
