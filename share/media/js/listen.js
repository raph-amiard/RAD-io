var Program;
var __bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; };
$(function() {
  var program;
  program = new Program();
  program.show_program();
  return setInterval((function() {
    return program.show_program();
  }), 60000);
});
Program = (function() {
  function Program() {}
  Program.prototype.current_program_url = '/audiosources/json/get-playing-element/';
  Program.prototype.current_program_el = d$("#current_program");
  Program.prototype.show_program = function(opts) {
    return $.getJSON(this.current_program_url, __bind(function(json) {
      var dom, pe;
      if (json.playing_element) {
        pe = json.playing_element;
        pe.ftime_start = format_time(pe.time_start);
        pe.ftime_end = format_time(pe.time_end != null ? pe.time_end : time_add_length(pe.time_start, pe.audiosource.length));
        dom = render_template("listen_program", json.playing_element);
        return this.current_program_el.html(dom);
      } else {
        return this.current_program_el.html("<p>No current program</p>");
      }
    }, this));
  };
  return Program;
})();