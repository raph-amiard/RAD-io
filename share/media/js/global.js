var Set, d$, debug, div, extractLast, format_length, format_number, format_time, gen_uuid, js_template, make_xps_menu, multicomplete_params, object_transform, object_with_keys, print, render_template, show_menu, split, tag, template, time_add_length;
debug = true;
print = debug && (typeof console != "undefined" && console !== null) ? console.log : function() {
  return false;
};
gen_uuid = function() {
  var _;
  return ((function() {
    var _results;
    _results = [];
    for (_ = 0; _ < 32; _++) {
      _results.push(Math.floor(Math.random() * 16).toString(16));
    }
    return _results;
  })()).join('');
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
  var cache, _ref;
  (_ref = this.cache) != null ? _ref : this.cache = {};
  cache = this.cache[template_name];
  if (cache) {
    return cache;
  } else {
    return this.cache[template_name] = new EJS({
      url: js_template(template_name)
    });
  }
};
tag = function(node, content, attrs) {
  var attr_name, attr_value, tag;
  if (!(typeof content === 'string') && !((content != null ? content.html : void 0) != null)) {
    attrs = content;
    content = false;
  }
  tag = $("<" + node + ">");
  for (attr_name in attrs) {
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
      el = tab[i];
      this.map[el] = el;
    }
  }
  Set.prototype.add = function(el) {
    return this.map[el] = el;
  };
  Set.prototype.remove = function(el) {
    return delete this.map[el];
  };
  Set.prototype.has = function(el) {
    return this.map[el] != null;
  };
  Set.prototype.values = function() {
    var key, value, _ref, _results;
    _ref = this.map;
    _results = [];
    for (key in _ref) {
      value = _ref[key];
      _results.push(value);
    }
    return _results;
  };
  return Set;
})();
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
  var len, strnum, zeroes, _;
  strnum = num + '';
  len = strnum.length;
  zeroes = length > len ? length - len : 0;
  return strnum = ((function() {
    var _results;
    _results = [];
    for (_ = 0; (0 <= zeroes ? _ < zeroes : _ > zeroes); (0 <= zeroes ? _ += 1 : _ -= 1)) {
      _results.push("0");
    }
    return _results;
  })()).join('') + strnum;
};
format_time = function(time) {
  var fnum, nh, nm;
  fnum = function(num) {
    return format_number(num, 2);
  };
  nh = fnum(time.hour);
  nm = fnum(time.minute);
  return "" + nh + "h" + nm;
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
  return "" + minutes + "m" + seconds;
};
time_add_length = function(time, length) {
  var len_min, ntime;
  ntime = {};
  len_min = Math.floor(length / 60) + time.minute;
  ntime.minute = len_min % 60;
  ntime.hour = (time.hour + Math.floor(len_min / 60)) % 24;
  return ntime;
  if (num_hours) {
    return "" + hours + "h" + minutes + "m" + seconds;
  } else {
    return "" + minutes + "m" + seconds;
  }
};
d$ = function(selector) {
  var obj;
  obj = {
    selector: selector
  };
  $(function() {
    return obj = $.extend(obj, $(selector));
  });
  return obj;
};
make_xps_menu = function(opts) {
  /*
  Creates a menu div from an opts object
  The menu div is meant to be dialogified with jquery.ui and the show_menu function
  the 'actions' options is a map from button labels to function handlers for these buttons
  */  var defaults, id, mdiv, p, text, title, txt, val_func, val_text;
  defaults = {
    actions: {},
    validate_text: "Valider",
    show_validate: true,
    validate_action: function() {},
    on_show: function() {}
  };
  opts = $.extend(defaults, opts);
  id = "xps_menu_" + opts.name;
  txt = opts["text"];
  if ($.isArray(txt)) {
    txt = (function() {
      var _i, _len, _results;
      _results = [];
      for (_i = 0, _len = txt.length; _i < _len; _i++) {
        p = txt[_i];
        _results.push($("<p></p>").html(p)[0]);
      }
      return _results;
    })();
  }
  text = tag("div", txt);
  title = tag("h2", opts["title"]);
  mdiv = tag("div", '', {
    "class": "xps_menu"
  });
  mdiv.attr('id', id);
  if (opts["show_validate"]) {
    val_text = opts["validate_text"];
    val_func = function(e) {
      opts["validate_action"].apply($(mdiv), [e]);
      return $("#" + id).dialog("close").remove();
    };
    opts.actions[val_text] = val_func;
  }
  return {
    div: mdiv.append(title).append(text).attr("id", id),
    buttons: opts.actions,
    on_show: opts.on_show
  };
};
show_menu = function(xps_menu, opts) {
  /*
  Show a menu made with xps_menu
  Uses jquery.ui's Dialog extension
  Modal by default
  */  opts = $.extend({
    modal: true,
    buttons: xps_menu.buttons
  }, opts);
  $('body').append(xps_menu.div);
  $(xps_menu.div).dialog(opts);
  return xps_menu.on_show.apply($(xps_menu.div));
};
object_with_keys = function(obj, keys) {
  var key, new_obj, _i, _len;
  new_obj = {};
  for (_i = 0, _len = keys.length; _i < _len; _i++) {
    key = keys[_i];
    new_obj[key] = obj[key];
  }
  return new_obj;
};
object_transform = function(obj, mappings) {
  var func, key, new_obj, out_key, val;
  new_obj = {};
  for (key in mappings) {
    val = mappings[key];
    if ($.isArray(val)) {
      out_key = val[0], func = val[1];
    } else {
      func = val != null ? val : function(x) {
        return x;
      };
      out_key = key;
    }
    new_obj[out_key] = func(obj[key]);
  }
  return new_obj;
};