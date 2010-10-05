var AppComponent, Application, AudioFileForm, Audiomodel, ListAudiomodel, PlaylistComponent, PlaylistElement, TagsTable, TemplateComponent, TrackList, Widgets, audiofile_form_options, closest, el_pos_on_pboard, handle_audiofile_play, playlist_edit_handler, populate_form_errors, pos_on_pboard, show_edit_planning, step;
var __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  }, __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __hasProp = Object.prototype.hasOwnProperty;
Application = {
  views_components: function(name) {
    var cmap;
    cmap = {
      playlist: PlaylistComponent
    };
    return cmap[name];
  },
  current_view: 'main',
  current_component: undefined,
  load: function(name, view_params) {
    var klass;
    this.current_component == null ? undefined : this.current_component.close();
    klass = this.views_components(name);
    this.current_component = new klass(view_params);
    this.current_component.bind_events();
    return (this.current_view = name);
  },
  view: function(view_name) {
    return (typeof view_name !== "undefined" && view_name !== null) ? (this.current_view = view_name) : this.current_view;
  }
};
TemplateComponent = function(opts) {
  this.dom = render_template(opts.template, opts.context);
  this.ui = $(this.dom);
  return this;
};
TemplateComponent.prototype.dom = null;
Audiomodel = function(opts) {
  Audiomodel.__super__.constructor.call(this, opts);
  return this;
};
__extends(Audiomodel, TemplateComponent);
Audiomodel.prototype.set_title = function(title) {
  this.title = title;
  return this.ui.find("." + (this.type) + "_title").text(this.title);
};
Audiomodel.prototype.set_artist = function(artist) {
  if (this.type === "audiofile") {
    this.artist = artist;
    return this.ui.find("." + (this.type) + "_artist").text(this.artist);
  }
};
Audiomodel.prototype.make_audiofile_edit_menu = function(data) {
  var audiomodel, form, tags_table;
  tags_table = new TagsTable(data.audiofile.tags_by_category);
  form = $(data.html).append(tags_table.ui);
  audiomodel = this;
  return make_xps_menu({
    name: ("edit_audiomodel_" + (audiomodel.id)),
    text: form,
    title: "Edition d'un morceau",
    on_show: function() {
      $(this).find('#id_tags').autocomplete(multicomplete_params(data.tag_list));
      return $(this).find('#id_artist').autocomplete({
        source: data.artist_list
      });
    },
    validate_action: function() {
      return $(this).find('form').ajaxSubmit({
        dataType: 'json',
        data: tags_table.to_delete_tags,
        success: function(json) {
          var af;
          af = json.audiofile;
          audiomodel.set_title(af.title);
          audiomodel.set_artist(af.artist);
          return post_message("Le morceau " + (af.artist) + " - " + (af.title) + " a été modifié avec succès");
        }
      });
    }
  });
};
Audiomodel.prototype.handle_audiofile_edit = function() {
  var audiomodel;
  audiomodel = this;
  return function(e) {
    e.preventDefault();
    return $.getJSON(this.href, function(data) {
      var menu;
      menu = audiomodel.make_audiofile_edit_menu(data);
      return show_menu(menu);
    });
  };
};
ListAudiomodel = function(type, json_model) {
  this.type = type;
  $.extend(this, json_model);
  ListAudiomodel.__super__.constructor.call(this, {
    template: ("" + (this.type) + "_list_element"),
    context: {
      audiomodel: json_model
    }
  });
  return this;
};
__extends(ListAudiomodel, Audiomodel);
ListAudiomodel.prototype.handle_delete = function() {
  var _a, audiomodel, delete_menu, msg;
  audiomodel = this;
  msg = ("L'élément " + ((typeof (_a = this.artist) !== "undefined" && _a !== null) ? ("" + (this.artist) + " -") : null) + " " + (this.title) + " a bien été supprimé");
  delete_menu = make_xps_menu({
    name: ("delete_audiomodel_" + (this.id)),
    text: ("Etes vous sur de vouloir supprimer ce" + (this.type === "audiofile" ? " morceau" : "tte playlist") + " ?"),
    title: ("Suppression d'un" + (this.type === "audiofile" ? " morceau" : "e playlist")),
    show_validate: false,
    actions: {
      "Oui": function() {
        return $.getJSON(e.target.href, __bind(function(json) {
          post_message(msg);
          audiomodel.ui.remove();
          return $(this).dialog('close').remove();
        }, this));
      },
      "Non": function() {
        return $(this).dialog('close').remove();
      }
    }
  });
  return function(e) {
    e.preventDefault();
    return show_menu(delete_menu);
  };
};
ListAudiomodel.prototype.bind_events = function() {
  this.ui.find('.audiomodel_delete').click(this.handle_delete());
  if (this.type === "audiofile") {
    this.ui.find('.audiofile_edit').click(this.handle_audiofile_edit());
    return this.ui.find('.audiofile_play').click(handle_audiofile_play);
  } else if (this.type === "audiosource") {
    return this.ui.find('.audiosource_edit').click(function(e) {
      e.stopPropagation();
      e.preventDefault();
      return $.get(this.href, function(json) {
        return Application.load('playlist', json);
      });
    });
  }
};
TagsTable = function(tags_by_category) {
  this.tags_by_category = tags_by_category;
  this.to_delete_tags = {};
  this.make_table();
  this.ui = this.table;
  this.dom = this.table[0];
  return this;
};
TagsTable.prototype.make_table = function() {
  var _a, _b, _c, category;
  this.table = $(render_template("tags_table"));
  _a = []; _c = this.tags_by_category;
  for (_b in _c) {
    if (!__hasProp.call(_c, _b)) continue;
    (function() {
      var _d, _e, _f, category_tr, tags_td;
      var category = _b;
      var tags = _c[_b];
      return _a.push((function() {
        category_tr = tag("tr");
        tags_td = tag("td");
        tags.remaining = 0;
        _e = tags;
        for (_d = 0, _f = _e.length; _d < _f; _d++) {
          (function() {
            var delete_link, tag_span;
            var ctag = _e[_d];
            tag_span = tag("span", "" + (ctag.name) + " ", {
              "class": "audiofile_tag",
              id: ("tag_" + (ctag.id))
            });
            delete_link = tag("a", "x ", {
              "class": "audiofile_tag_delete",
              href: ""
            });
            tag_span.append(delete_link);
            tags_td.append(tag_span);
            tags.remaining += 1;
            return delete_link.click(__bind(function(e) {
              e.preventDefault();
              tag_span.remove();
              tags.remaining -= 1;
              if (tags.remaining === 0) {
                category_tr.remove();
              }
              return (this.to_delete_tags[("to_delete_tag_" + (ctag.id))] = ctag.id);
            }, this));
          }).call(this);
        }
        category_tr.append(tag("td", category)).append(tags_td);
        return this.table.append(category_tr);
      }).call(this));
    }).call(this);
  }
  return _a;
};
AudioFileForm = function() {
  return TemplateComponent.apply(this, arguments);
};
__extends(AudioFileForm, TemplateComponent);
PlaylistElement = function(audiofile, container, fresh) {
  this.container = container;
  this.type = "audiofile";
  this.fresh = fresh ? fresh : false;
  this.audiofile = audiofile;
  PlaylistElement.__super__.constructor.call(this, {
    template: 'playlist_element',
    context: {
      fresh: this.fresh,
      audiofile: audiofile
    }
  });
  return this;
};
__extends(PlaylistElement, Audiomodel);
PlaylistElement.prototype.bind_events = function() {
  this.ui.find('.audiofile_edit').click(this.handle_audiofile_edit());
  this.ui.find('.audiofile_play').click(handle_audiofile_play);
  return this.ui.find('.source_element_delete').click(__bind(function(e) {
    e.preventDefault();
    if (this.fresh) {
      this.ui.remove();
    } else {
      this.ui.addClass('to_delete_source_element');
    }
    return this.container.remove(this);
  }, this));
};
PlaylistElement.prototype.toString = function() {
  return "playlist_element_" + (gen_uuid());
};
TrackList = function() {
  var tracklist;
  this.length = 0;
  this.elements = new Set();
  this.binded_elements = new Set();
  this.container = $("#uploaded_audiofiles");
  this.outer_container = $(".playlist_box");
  this.length_container = $("#playlist_length");
  tracklist = this;
  this.container.find('li').disableTextSelect();
  this.container.sortable({
    axis: 'y',
    containment: this.outer_container,
    connectWith: '#track_selector ul li',
    cursor: "crosshair",
    stop: function(e, ui) {
      var audiomodel, new_el;
      if (ui.item.hasClass('ui-draggable')) {
        audiomodel = Widgets.audiomodels.by_id[ui.item.children('input').val()];
        new_el = new PlaylistElement(audiomodel, this, true);
        ui.item.replaceWith(new_el.ui);
        new_el.bind_events();
        tracklist.elements.add(new_el);
        tracklist.length += audiomodel.length;
        return tracklist.update_length();
      }
    }
  });
  return this;
};
TrackList.prototype.update_length = function() {
  return this.length_container.text(format_length(this.length));
};
TrackList.prototype.append = function(audiofile, fresh) {
  var pl_element;
  pl_element = new PlaylistElement(audiofile, this, fresh);
  this.elements.add(pl_element);
  this.length += audiofile.length;
  this.container.append(pl_element.ui);
  return this.update_length();
};
TrackList.prototype.remove = function(el) {
  this.elements.remove(el);
  this.length -= el.audiofile.length;
  return this.update_length();
};
TrackList.prototype.bind_events = function() {
  var _a, _b, _c, _d, el;
  _a = []; _c = this.elements.values();
  for (_b = 0, _d = _c.length; _b < _d; _b++) {
    el = _c[_b];
    _a.push((function() {
      if (!(this.binded_elements.has(el))) {
        this.binded_elements.add(el);
        return el.bind_events();
      }
    }).call(this));
  }
  return _a;
};
Widgets = {
  tags: {
    view_url: function() {
      return "/audiosources/" + (Widgets.audiomodels.current_model) + "/tag/list";
    },
    selected_tags: {},
    clear: function() {
      return (this.selected_tags = {});
    },
    load: function() {
      var select_handler;
      select_handler = __bind(function(event, ui) {
        var _a, _b, _c, _d, i;
        this.selected_tags = (function() {
          _a = []; _c = $('#tag_selector li.ui-selected input');
          for (_b = 0, _d = _c.length; _b < _d; _b++) {
            i = _c[_b];
            _a.push(i.value);
          }
          return _a;
        })();
        return Widgets.audiomodels.load();
      }, this);
      return $.get(this.view_url(), function(html_data) {
        $('#tag_selector').html(html_data);
        return $('#tag_selector ul').make_selectable({
          handler: select_handler
        });
      });
    }
  },
  audiomodel_selector: {
    container: d$('#source_type'),
    button_class: "audiomodel_selector",
    selected_class: "audiomodel_selected",
    load: function() {
      var _a, _b, model_name;
      _b = Widgets.audiomodels.models;
      for (_a in _b) {
        if (!__hasProp.call(_b, _a)) continue;
        (function() {
          var dom;
          var model_name = _a;
          var button_name = _b[_a];
          dom = tag('span', button_name, {
            "class": this.button_class
          });
          this.container.append(dom);
          $(dom).button();
          return dom.click(function(e) {
            Widgets.audiomodels.current_model = model_name;
            Widgets.tags.clear();
            Widgets.audiomodels.clear_filter();
            Widgets.audiomodels.load();
            return Widgets.tags.load();
          });
        }).call(this);
      }
      return this.container.make_selectable({
        unique_select: true,
        select_class: this.selected_class
      });
    }
  },
  audiomodels: {
    container: d$('#track_selector'),
    models: {
      audiofile: "Tracks",
      audiosource: "Playlists"
    },
    current_model: 'audiofile',
    view_url: function() {
      return "/audiosources/" + (this.current_model) + "/list/";
    },
    all: [],
    by_id: {},
    text_filter: "",
    clear_filter: function() {
      return (this.text_filter = "");
    },
    filter_to_params: function() {
      var _a, idx, map, tag;
      map = {};
      _a = Widgets.tags.selected_tags;
      for (idx in _a) {
        if (!__hasProp.call(_a, idx)) continue;
        tag = _a[idx];
        map[("tag_" + (idx))] = tag;
      }
      if (this.text_filter) {
        map["text"] = this.text_filter;
      }
      return map;
    },
    views_actions: {
      playlist: function() {
        var tracklist;
        tracklist = Application.current_component.tracklist;
        tracklist.container.sortable('refresh');
        return Widgets.audiomodels.current_model === "audiofile" ? $('#track_selector ul li').draggable({
          connectToSortable: tracklist.container,
          helper: 'clone',
          appendTo: 'body',
          scroll: false,
          zIndex: '257'
        }) : null;
      }
    },
    load: function() {
      return $.getJSON(this.view_url(), this.filter_to_params(), __bind(function(audiomodels_list) {
        var _a, _b, _c, _d, audiomodel, json_audiomodel, ul;
        this.all = [];
        this.by_id = {};
        ul = tag('ul');
        this.container.html('');
        this.container.append(ul);
        _b = audiomodels_list;
        for (_a = 0, _c = _b.length; _a < _c; _a++) {
          json_audiomodel = _b[_a];
          audiomodel = new ListAudiomodel(this.current_model, json_audiomodel);
          this.all.push(audiomodel);
          this.by_id[audiomodel.id] = audiomodel;
          ul.append(audiomodel.ui);
          audiomodel.bind_events();
        }
        $('[id$="select_footer"]').hide();
        $("#" + (this.current_model) + "_select_footer").show();
        return (typeof (_d = this.views_actions[Application.current_view]) === "function" ? _d() : undefined);
      }, this));
    }
  }
};
AppComponent = function(opts) {
  AppComponent.__super__.constructor.call(this, opts);
  this.main_content_holder.append(this.ui);
  return this;
};
__extends(AppComponent, TemplateComponent);
AppComponent.prototype.main_content_holder = d$("#main_container");
AppComponent.prototype.bind_events = function() {};
AppComponent.prototype.close = function() {
  return this.ui.remove();
};
PlaylistComponent = function(json) {
  var _a, _b, _c, audiofile, tags_table;
  PlaylistComponent.__super__.constructor.call(this, {
    template: "audiosource_base",
    context: json
  });
  this.init_components();
  this.fields.file_forms.html(render_template('audiofile_form', json));
  $('.audiofileform').each(function() {
    return $(this).ajaxForm(audiofile_form_options($(this), $(this).clone()));
  });
  this.inputs.tags.autocomplete(multicomplete_params(json.tag_list)).unbind('blur.autocomplete');
  if (json.mode === "edition") {
    this.inputs.title.val(json.mode === "edition" ? json.audiosource.title : null);
    _b = json.audiosource.sorted_audiofiles;
    for (_a = 0, _c = _b.length; _a < _c; _a++) {
      audiofile = _b[_a];
      this.tracklist.append(audiofile, false);
    }
    tags_table = new TagsTable(json.audiosource.tags_by_category);
    this.fields.tags.append(tags_table.ui);
  }
  return this;
};
__extends(PlaylistComponent, AppComponent);
PlaylistComponent.prototype.init_components = function() {
  this.tracklist = new TrackList();
  this.container = $('#playlist_edit');
  this.inputs = {
    title: $('#playlist_title'),
    tags: $('#audiosource_tags')
  };
  this.fields = {
    title: $('#playlist_edit_title'),
    audiofiles: this.tracklist.container,
    tags: $('#tags_table_container'),
    file_forms: $('#audiofile_forms')
  };
  return (this.form = $('#audiosource_form'));
};
PlaylistComponent.prototype.bind_events = function() {
  return this.tracklist.bind_events();
};
playlist_edit_handler = function() {
  return $('#audiosource_form', document).submit(function(e) {
    var _a, _b, data, i, li;
    e.preventDefault();
    data = {};
    _a = $('#uploaded_audiofiles li');
    for (i = 0, _b = _a.length; i < _b; i++) {
      li = _a[i];
      if (!$(li).hasClass("to_delete_source_element")) {
        data[("source_element_" + (i))] = $(li).children('input').val();
      }
    }
    return $(this).ajaxSubmit({
      data: data,
      success: function(r) {
        var current_mode;
        if (current_audiomodel === "audiosource_select") {
          update_sources_list();
        }
        $('#playlist_edit').hide();
        $('#main_content').show();
        ({
          action: r.action === "edition" ? "modifiée" : "ajoutée"
        });
        post_message("La playlist " + (r.audiosource.title) + " à été " + (action) + " avec succès");
        return (current_mode = "main");
      }
    });
  });
};
populate_form_errors = function(errors, form) {
  var $ul, _a, _b, _c, _d, _e, _f, _g, _h, error, msg;
  _a = []; _c = errors;
  for (_b = 0, _d = _c.length; _b < _d; _b++) {
    error = _c[_b];
    _a.push((function() {
      if (error !== 'status') {
        $ul = $("input[name=" + (error) + "]", form).parent().before('<ul> </ul>');
        _e = []; _g = error;
        for (_f = 0, _h = _g.length; _f < _h; _f++) {
          msg = _g[_f];
          _e.push($ul.before("<li>" + (msg) + "</li>"));
        }
        return _e;
      }
    })());
  }
  return _a;
};
handle_audiofile_play = function(e) {
  var player;
  e.preventDefault();
  e.stopPropagation();
  player = document.getElementById('audiofile_player');
  return player ? player.dewset(e.target.href) : null;
};
audiofile_form_options = function(target_form, new_form) {
  var UPDATE_FREQ, prg_bar, update_progress_info, uuid;
  update_progress_info = function() {
    return $.getJSON('/upload-progress/', {
      'X-Progress-ID': uuid
    }, function(data, status) {
      var progress;
      if (data) {
        progress = parseInt(data.received) / parseInt(data.size);
        prg_bar.progressbar("option", "value", progress * 100);
        return setTimeout(update_progress_info, UPDATE_FREQ);
      }
    });
  };
  UPDATE_FREQ = 1000;
  uuid = gen_uuid();
  prg_bar = $('.progress_bar', target_form);
  target_form[0].action += ("?X-Progress-ID=" + (uuid));
  return {
    dataType: 'json',
    target: target_form,
    success: function(response, statusText, form) {
      if (response.status) {
        prg_bar.hide();
        if (response.status === "error") {
          return populate_form_errors(response, form);
        } else {
          post_message("Le morceau " + (response.audiofile.artist) + " - " + (response.audiofile.title) + " a été ajouté avec succès");
          form.hide();
          return append_to_playlist(response.audiofile, true);
        }
      } else {
        return form.html(response);
      }
    },
    beforeSubmit: function(arr, $form, options) {
      var $newform;
      $newform = $(new_form);
      $form.after($newform);
      $newform.ajaxForm(audiofile_form_options($newform, $newform.clone()));
      prg_bar.progressbar({
        progress: 0
      });
      return setTimeout(update_progress_info(UPDATE_FREQ));
    }
  };
};
show_edit_planning = function() {
  var _, board, ct, current_mode, div_class, i;
  board = $('#main_planning_board');
  ct = $('#main_planning_board_container');
  for (_ = 0; _ < 24; _++) {
    for (i = 1; i <= 6; i++) {
      div_class = (({
        3: 'half',
        6: 'hour'
      })[i]) || 'tenth';
      board.append(div({
        "class": ("grid_time grid_" + (div_class))
      }));
    }
  }
  $('#main_content').hide();
  $('#planning_edit').show();
  ct.height($(document).height() - ct.offset().top - 20);
  $('#main_planning_board').droppable({
    over: function(e, ui) {
      var dropped_el;
      return (dropped_el = ui.helper);
    },
    drop: function(e, ui) {},
    tolerance: 'fit'
  });
  return (current_mode = "planning_edit");
};
pos_on_pboard = function(el_pos) {
  var pboard_off;
  pboard_off = $('#planning_board').offset();
  el_pos.top -= pboard_off.top;
  el_pos.left -= pboard_off.left;
  return el_pos;
};
el_pos_on_pboard = function(el, pos) {
  var el_off, pboard_off;
  pboard_off = $('#planning_board').offset();
  el_off = el.offset();
  if (pos) {
    return el.css({
      top: pboard_off.top + pos.top,
      left: pboard_off.left + pos.left
    });
  } else {
    el_off.top -= pboard_off.top;
    el_off.left -= pboard_off.left;
    return el_off;
  }
};
closest = function(num, steps) {
  var ret;
  ret = null;
  $.each(steps, function(i) {
    return (steps[i] < num) && (num < steps[i + 1]) ? (num - steps[i] < steps[i + 1] - num ? (ret = steps[i]) : (ret = steps[i + 1])) : null;
  });
  return ret;
};
step = function(num, step) {
  return num - (num % step);
};
$(function() {
  var _a, cname, component;
  _a = Widgets;
  for (cname in _a) {
    if (!__hasProp.call(_a, cname)) continue;
    component = _a[cname];
    console.log("Loading component " + (cname));
    component.load();
  }
  $('#text_selector').keyup(function(e) {
    sel_data['text_filter'] = $(this).val();
    return update_sources_list();
  });
  $('#create_playlist_button').click(function(e) {
    return $.get('/audiosources/json/create-audio-source', playlist_view);
  });
  return $('#uploaded_audiofiles .audiofile_play').live('click', handle_audiofile_play);
});