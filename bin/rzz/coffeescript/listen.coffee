$ ->
    program = new Program()
    program.show_program()
    setInterval (-> program.show_program()), 60000

class Program

    current_program_url: '/audiosources/json/get-playing-element/'
    current_program_el: d$ "#current_program"

    show_program: (opts) ->
        $.getJSON @current_program_url, (json) =>
            if json.playing_element
                pe = json.playing_element
                pe.ftime_start = format_time pe.time_start
                pe.ftime_end = format_time(if pe.time_end? then pe.time_end else time_add_length pe.time_start, pe.audiosource.length)
                dom = render_template "listen_program", json.playing_element
                @current_program_el.html dom
            else
                @current_program_el.html "<p>No current program</p>"
