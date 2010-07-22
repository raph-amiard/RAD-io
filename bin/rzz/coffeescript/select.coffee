$ ->
    $.fn.extend {
        disableTextSelect: ->
            @each ->
                if $.browser.mozilla then $(@).css 'MozUserSelect', 'none'
                else if $.browser.msie then $(@).bind 'selectstart', -> no
                else if $.browser.webkit
                    $(@).css '-webkit-user-select', 'none'
                    $(@).mousedown -> no
                else $(@).mousedown -> no
                return @

        make_selectable: (opts) ->
            defaults: {
                handler: undefined
                unique_select: no
                select_class: 'ui-selected'
            }
            opts: $.extend defaults, opts
            container: @
            @children().click (e) ->
                if opts.unique_select
                    if not $(@).hasClass opts.select_class
                        container.children().removeClass opts.select_class
                        $(@).addClass opts.select_class
                else $(@).toggleClass opts.select_class
                if opts.handler then opts.handler e
            @children().disableTextSelect()

        renderTemplate: (template_name, context) ->
            @html(new EJS({url:js_template(template_name)}).render context)
    }
