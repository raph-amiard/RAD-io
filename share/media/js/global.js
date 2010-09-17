var Set, d$, debug, div, extractLast, format_length, gen_uuid, js_template, make_xps_menu, multicomplete_params, print, render_template, show_menu, split, tag, template;
var __hasProp = Object.prototype.hasOwnProperty;
debug = true;
print = debug && (typeof console !== "undefined" && console !== null) ? console.log : function() {
  return false;
};
gen_uuid = function() {
  var _, _a;
  return (function() {
    _a = [];
    for (_ = 0; _ < 32; _++) {
      _a.push(Math.floor(Math.random() * 16).toString(16));
    }
    return _a;
  })().join('');
};
js_template = function(t) {
  return "/site_media/js_templates/" + (t) + ".ejs";
};
split = function(val) {
  return val.split(/,\s*/);
};
extractLast = function(term) {
  return split(term).pop();
};
render_template = function(template_name, context) {
  return template(template_name).render(context);
};
template = function(template_name) {
  var cache;
  this.cache = (typeof this.cache !== "undefined" && this.cache !== null) ? this.cache : {};
  cache = this.cache[template_name];
  return cache ? cache : (this.cache[template_name] = new EJS({
    url: js_template(template_name)
  }));
};
tag = function(node, content, attrs) {
  var _a, attr_name, attr_value, tag;
  if (!(typeof content === 'string')) {
    attrs = content;
    content = false;
  }
  tag = $("<" + (node) + "></" + (node) + ">");
  _a = attrs;
  for (attr_name in _a) {
    if (!__hasProp.call(_a, attr_name)) continue;
    attr_value = _a[attr_name];
    tag.attr(attr_name, attr_value);
  }
  if (content) {
    tag.html(content);
  }
  return tag;
};
div = function(content, opts_map) {
  return tag('div', content, opts_map);
};
Set = function(tab) {
  var _a, el, i;
  _a = tab;
  for (i in _a) {
    if (!__hasProp.call(_a, i)) continue;
    el = _a[i];
    this.map[el] = true;
  }
  return this;
};
Set.prototype.map = {};
Set.prototype.add = function(el) {
  return (this.map[el] = true);
};
Set.prototype.remove = function(el) {
  return delete this.map[el];
};
Set.prototype.has = function(el) {
  var _a;
  return (typeof (_a = this.map[el]) !== "undefined" && _a !== null);
};
multicomplete_params = function(list) {
  return {
    minLength: 0,
    source: function(request, response) {
      return response($.ui.autocomplete.filter(list, extractLast(request.term)));
    },
    focus: function() {
      return false;
    },
    select: function(event, ui) {
      var terms;
      terms = split(this.value);
      terms.pop();
      terms.push(ui.item.value);
      terms.push("");
      this.value = terms.join(", ");
      return false;
    }
  };
};
format_length = function(l) {
  var fnum, format_number, hours, minutes, num_hours, seconds;
  format_number = function(num, length) {
    var _, _a, len, strnum, zeroes;
    strnum = num + '';
    len = strnum.length;
    zeroes = length > len ? length - len : 0;
    return (strnum = (function() {
      _a = [];
      for (_ = 0; (0 <= zeroes ? _ < zeroes : _ > zeroes); (0 <= zeroes ? _ += 1 : _ -= 1)) {
        _a.push("0");
      }
      return _a;
    })().join('') + strnum);
  };
  fnum = function(num) {
    return format_number(num, 2);
  };
  num_hours = Math.floor(l / 3600);
  hours = fnum(num_hours);
  minutes = fnum(Math.floor((l % 3600) / 60));
  seconds = fnum(Math.floor(l % 60));
  return num_hours ? ("" + (hours) + "h" + (minutes) + "m" + (seconds)) : ("" + (minutes) + "m" + (seconds));
};
d$ = function(selector) {
  var obj;
  obj = {
    selector: selector
  };
  $(function() {
    console.log(obj);
    return (obj = $.extend(obj, $(selector)));
  });
  return obj;
};
make_xps_menu = function(opts) {
  var _a, _b, _c, _d, defaults, id, p, text, title, txt, val_func, val_text;
  /*
  Creates a menu div from an opts object
  The menu div is meant to be dialogified with jquery.ui and the show_menu function
  the 'actions' options is a map from button labels to function handlers for these buttons
  */
  defaults = {
    actions: {},
    validate_text: "Valider",
    show_validate: true,
    validate_action: function() {},
    on_show: function() {}
  };
  opts = $.extend(defaults, opts);
  id = ("xps_menu_" + (opts.name));
  txt = opts["text"];
  if ($.isArray(txt)) {
    txt = (function() {
      _a = []; _c = txt;
      for (_b = 0, _d = _c.length; _b < _d; _b++) {
        p = _c[_b];
        _a.push($("<p></p>").html(p)[0]);
      }
      return _a;
    })();
  }
  text = tag("div", txt);
  title = tag("h2", opts["title"]);
  div = tag("div", '', {
    "class": "xps_menu"
  });
  div.attr('id', id);
  if (opts["show_validate"]) {
    val_text = opts["validate_text"];
    val_func = function(e) {
      $("#" + (id)).dialog("close").remove();
      return opts["validate_action"].apply($(div), [e]);
    };
    opts.actions[val_text] = val_func;
  }
  return {
    div: div.append(title).append(text).attr("id", id),
    buttons: opts.actions,
    on_show: opts.on_show
  };
};
show_menu = function(xps_menu, opts) {
  /*
  Show a menu made with xps_menu
  Uses jquery.ui's Dialog extension
  Modal by default
  */
  opts = $.extend({
    modal: true,
    buttons: xps_menu.buttons
  }, opts);
  $('body').append(xps_menu.div);
  $(xps_menu.div).dialog(opts);
  return xps_menu.on_show.apply($(xps_menu.div));
};