modal_action = (name, content, handler) ->
    $menu = $('#modal_menu').show()
    $menu_content = $('#modal_menu_content').html content
    $hider = $('#modal_menu_hider').show()
    $menu_title = $('#modal_menu_title')
    clear_everything = ->
        $menu_content.html ''
        $menu_title.text ''
        $menu.hide()
        $hider.hide()

    $menu_title.text name

    $menu.css 'margin-left', - ($menu.outerWidth() / 2)
    $menu.css 'margin-top', - ($menu.outerHeight() / 2)
    $('#modal_menu_close').click clear_everything
    handler(clear_everything)
