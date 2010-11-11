get_os = () ->
    oses =
        linux:"Linux"
        windows:"Win"
        macos:"MacOs"
        unix:"X11"
    for os, os_name of oses
        if navigator.appVersion.indexOf(os_name) != -1 then return os

if get_os() == "windows"
    $ -> $('body').css 'font-family':'arial, serif'
