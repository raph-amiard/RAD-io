debug = yes
print = if debug and console? then console.log else () -> false

gen_uuid = -> (Math.floor(Math.random() * 16).toString(16) for _ in [0...32]).join ''
js_template = (t) -> "/site_media/js_templates/#{t}.ejs"
split = (val) -> val.split /,\s*/
extractLast = (term) -> split(term).pop()

render_template = (template_name, context) ->
    template(template_name).render context

template = (template_name) ->
    @cache ?= {}
    cache = @cache[template_name]
    if cache then cache
    else
        @cache[template_name] = new EJS url: js_template template_name

tag = (node, content, attrs) ->
    # Creates a basic jquery tag object
    # With optional content and class attributes

    if not(typeof content is 'string') and not(content?.html?)
        attrs = content
        content = no

    tag = $("<#{node}>")

    for attr_name, attr_value of attrs
        tag.attr(attr_name, attr_value)

    if content then tag.html(content)
    return tag

div = (content, opts_map) ->
    tag 'div', content, opts_map

class Set
    constructor: (tab) ->
        @map= {}
        for i, el of tab
            @map[el] = el
    add: (el) -> @map[el] = el

    remove: (el) ->
        delete @map[el]

    has: (el) -> @map[el]?
    values: () -> return (value for key,value of @map)

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

format_number = (num, length) ->
    strnum = num + ''
    len = strnum.length
    zeroes = if length > len then length - len else 0
    strnum = ("0" for _ in [0...zeroes]).join('') + strnum


format_length = (l) ->
    fnum = (num) -> format_number num, 2
    num_hours = Math.floor l / 3600
    hours = fnum num_hours
    minutes = fnum Math.floor (l % 3600) / 60
    seconds = fnum Math.floor l % 60

    if num_hours then "#{hours}h#{minutes}m#{seconds}" else "#{minutes}m#{seconds}"

d$ = (selector) ->
    obj = {selector: selector}
    $ ->
        obj = $.extend obj, $(selector)
    return obj

make_xps_menu = (opts) ->

    ###
    Creates a menu div from an opts object
    The menu div is meant to be dialogified with jquery.ui and the show_menu function
    the 'actions' options is a map from button labels to function handlers for these buttons
    ###

    defaults = {
        actions: {}
        validate_text: "Valider"
        show_validate: yes
        validate_action: ->
        on_show: ->
    }

    opts = $.extend defaults, opts
    id = "xps_menu_#{opts.name}"

    txt = opts["text"]
    if $.isArray(txt)
        txt = ($("<p></p>").html(p)[0] for p in txt)
    text = tag("div", txt)

    title = tag("h2", opts["title"])
    mdiv = tag("div", '', class:"xps_menu")
    mdiv.attr('id', id)

    # If the menu is supposed to have a validate button, add it to the actions
    if opts["show_validate"]
        val_text = opts["validate_text"]
        val_func = (e) ->
            opts["validate_action"].apply($(mdiv), [e])
            $("##{id}").dialog("close").remove()
        opts.actions[val_text] = val_func

    return {
        div:mdiv.append(title).append(text).attr "id", id
        buttons: opts.actions
        on_show: opts.on_show
    }

show_menu = (xps_menu, opts) ->

    ###
    Show a menu made with xps_menu
    Uses jquery.ui's Dialog extension
    Modal by default
    ###

    opts = $.extend({modal:yes, buttons:xps_menu.buttons}, opts)
    $('body').append(xps_menu.div)
    $(xps_menu.div).dialog(opts)
    xps_menu.on_show.apply($(xps_menu.div))


object_with_keys = (obj, keys) ->
    new_obj = {}
    for key in keys
        new_obj[key] = obj[key]
    new_obj
