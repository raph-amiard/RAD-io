var Set, d$, debug, div, extractLast, format_length, format_number, gen_uuid, js_template, make_xps_menu, multicomplete_params, print, render_template, show_menu, split, tag, template;
var __hasProp = Object.prototype.hasOwnProperty;
debug = true;
print = debug && (typeof console !== "undefined" && console !== null) ? console.log : function() {
  return false;
};
gen_uuid = function() {
  var _, _result;
  return (function() {
    _result = [];
    for (_ = 0; _ < 32; _++) {
      _result.push(Math.floor(Math.random() * 16).toString(16));
    }
    return _result;
  })().join('');
};
js_template = function(t) {
  return "/site_media/js_templates/" + t + ".ejs";
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
  var _ref, cache;
  ((_ref = this.cache) != null) ? _ref : (this.cache = {});
  cache = this.cache[template_name];
  return cache ? cache : (this.cache[template_name] = new EJS({
    url: js_template(template_name)
  }));
};
tag = function(node, content, attrs) {
  var attr_name, attr_value, tag;
  if (!(typeof content === 'string') && !(((content != null) ? content.html : undefined) != null)) {
    attrs = content;
    content = false;
  }
  tag = $("<" + node + "></" + node + ">");
  for (attr_name in attrs) {
    if (!__hasProp.call(attrs, attr_name)) continue;
    attr_value = attrs[attr_name];
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
Set = (function() {
  function Set(tab) {
    var el, i;
    this.map = {};
    for (i in tab) {
      if (!__hasProp.call(tab, i)) continue;
      el = tab[i];
      this.map[el] = el;
    }
    return this;
  };
  return Set;
})();
Set.prototype.add = function(el) {
  return (this.map[el] = el);
};
Set.prototype.remove = function(el) {
  return delete this.map[el];
};
Set.prototype.has = function(el) {
  return (this.map[el] != null);
};
Set.prototype.values = function() {
  var _ref, _result, key, value;
  _result = [];
  for (key in _ref = this.map) {
    if (!__hasProp.call(_ref, key)) continue;
    value = _ref[key];
    _result.push(value);
  }
  return _result;
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
format_number = function(num, length) {
  var _, _result, len, strnum, zeroes;
  strnum = num + '';
  len = strnum.length;
  zeroes = length > len ? length - len : 0;
  return (strnum = (function() {
    _result = [];
    for (_ = 0; (0 <= zeroes ? _ < zeroes : _ > zeroes); (0 <= zeroes ? _ += 1 : _ -= 1)) {
      _result.push("0");
    }
    return _result;
  })().join('') + strnum);
};
format_length = function(l) {
  var fnum, hours, minutes, num_hours, seconds;
  fnum = function(num) {
    return format_number(num, 2);
  };
  num_hours = Math.floor(l / 3600);
  hours = fnum(num_hours);
  minutes = fnum(Math.floor((l % 3600) / 60));
  seconds = fnum(Math.floor(l % 60));
  return num_hours ? ("" + hours + "h" + minutes + "m" + seconds) : ("" + minutes + "m" + seconds);
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
  var _i, _len, _result, defaults, id, p, text, title, txt, val_func, val_text;
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
      _result = [];
      for (_i = 0, _len = txt.length; _i < _len; _i++) {
        p = txt[_i];
        _result.push($("<p></p>").html(p)[0]);
      }
      return _result;
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
      opts["validate_action"].apply($(div), [e]);
      return $("#" + id).dialog("close").remove();
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