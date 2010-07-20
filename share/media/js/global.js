var extractLast, gen_uuid, js_template, split;
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