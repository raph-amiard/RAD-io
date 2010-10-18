var AppComponent, Application, AudioFileForm, Audiomodel, ListAudiomodel, MainComponent, PlanningComponent, PlaylistComponent, PlaylistElement, TagsTable, TemplateComponent, TrackList, Widgets, closest, el_pos_on_pboard, handle_audiofile_play, pos_on_pboard, show_edit_planning, step;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  };
Application = {
  views_components: function(name) {
    var cmap;
    cmap = {
      playlist: PlaylistComponent,
      main: MainComponent,
      planning: PlanningComponent
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
    return (this.current_view = name);
  },
  view: function(view_name) {
    return (typeof view_name !== "undefined" && view_name !== null) ? (this.current_view = view_name) : this.current_view;
  }
};
Widgets = {};
Widgets.tags = {
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
};
Widgets.audiomodel_selector = {
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
          Widgets.tags.load();
          return Widgets.footer_actions.update();
        });
      }).call(this);
    }
    return this.container.make_selectable({
      unique_select: true,
      select_class: this.selected_class
    });
  }
};
Widgets.text_selector = {
  container: d$('#text_selector'),
  select_delay: 100,
  select: function() {
    return __bind(function() {
      Widgets.audiomodels.text_filter = this.container.val();
      Widgets.audiomodels.load();
      return (this.timeout_id = undefined);
    }, this);
  },
  reset: function() {
    this.container.val("");
    return (Widgets.audiomodels.text_filter = "");
  },
  load: function() {
    return this.container.keyup(__bind(function(e) {
      if (this.timeout_id) {
        clearTimeout(this.timeout_id);
      }
      return (this.timeout_id = setTimeout(this.select(), this.select_delay));
    }, this));
  }
};
Widgets.audiomodels = {
  container: d$('#track_selector'),
  models: {
    audiofile: "Tracks",
    audiosource: "Playlists",
    planning: "Plannings"
  },
  current_model: 'audiofile',
  view_url: function() {
    return "/audiosources/" + (this.current_model) + "/list/";
  },
  all: [],
  by_id: {},
  text_filter: "",
  clear_filter: function() {
    return Widgets.text_selector.reset();
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
      map["text_filter"] = this.text_filter;
    }
    return map;
  },
  elements: function() {
    return this.container.find("li");
  },
  load: function() {
    return $.getJSON(this.view_url(), this.filter_to_params(), __bind(function(audiomodels_list) {
      var _a, _b, _c, audiomodel, json_audiomodel, ul;
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
      ul.make_selectable({
        select_class: 'selected-box'
      });
      $('[id$="select_footer"]').hide();
      return $("#" + (this.current_model) + "_select_footer").show();
    }, this));
  }
};
Widgets.footer_actions = {
  actions: {
    audiofile: {
      selection: {
        "Jouer": {
          action: function() {}
        },
        "Ajouter a la playlist": {
          predicate: function() {
            return Application.current_view === "playlist";
          },
          action: function() {}
        },
        "Supprimer": {
          action: function() {}
        },
        "Ajouter tags": {
          action: function() {}
        }
      },
      global: {
        "Uploader des tracks": {
          action: function() {}
        }
      }
    },
    audiosource: {
      global: {
        "Créer une playlist": {
          action: function() {
            return $.getJSON("/audiosources/json/create-audio-source", function(data) {
              return Application.load("playlist", data);
            });
          }
        }
      },
      selection: {
        "Supprimer": {
          action: function() {}
        },
        "Ajouter tags": {
          action: function() {}
        }
      }
    },
    planning: {
      global: {
        "Creer un planning": {
          action: function() {
            console.log("LOLDUDE");
            return Application.load("planning");
          }
        }
      },
      selection: null
    }
  },
  footers: {},
  container: d$("#track_selector_footer"),
  active_footer: undefined,
  load: function() {
    var _a, _b, _c, action_button, action_name, action_type, actions, actions_types, footer, model, properties;
    _a = this.actions;
    for (model in _a) {
      if (!__hasProp.call(_a, model)) continue;
      actions_types = _a[model];
      footer = (this.footers[model] = div("", {
        "class": "head_and_foot"
      }));
      _b = actions_types;
      for (action_type in _b) {
        if (!__hasProp.call(_b, action_type)) continue;
        actions = _b[action_type];
        _c = actions;
        for (action_name in _c) {
          if (!__hasProp.call(_c, action_name)) continue;
          properties = _c[action_name];
          if (properties.predicate && !properties.predicate()) {
            continue;
          }
          action_button = tag("button", action_name, {
            "class": "footer_button"
          });
          action_button.click(properties.action);
          footer.append(action_button);
        }
      }
    }
    return this.update();
  },
  update: function() {
    var audiomodel;
    audiomodel = Widgets.audiomodels.current_model;
    this.active_footer == null ? undefined : this.active_footer.remove();
    this.active_footer = this.footers[audiomodel];
    this.container.append(this.active_footer);
    return this.active_footer.find(".footer_button").button();
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
Audiomodel.prototype.post_message = function(af) {
  return post_message("Le morceau " + (af.artist) + " - " + (af.title) + " a été modifié avec succès");
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
          return audiomodel.post_message(af);
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
    e.stopPropagation();
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
  this.view_events[Application.current_view] == null ? undefined : this.view_events[Application.current_view].apply(this, []);
  return this;
};
__extends(ListAudiomodel, Audiomodel);
ListAudiomodel.prototype.view_events = {
  playlist: function() {
    var tracklist;
    tracklist = Application.current_component.tracklist;
    tracklist.container.sortable('refresh');
    return this.type === "audiofile" ? this.ui.draggable({
      connectToSortable: tracklist.container,
      helper: 'clone',
      appendTo: 'body',
      scroll: false,
      zIndex: '257'
    }) : null;
  },
  planning: function() {
    var td_positions;
    if (this.type === "audiosource") {
      td_positions = [];
      return this.ui.bind('dragstart', __bind(function(e, dd) {
        var height, proxy, width;
        console.log(this);
        height = this.length / 60;
        width = Application.current_component.board.width();
        proxy = div(this.title, {
          "class": 'audiofile_proxy'
        });
        proxy.css({
          top: dd.offsetY,
          left: dd.offsetX,
          position: 'absolute'
        });
        $('body').append(proxy);
        return proxy.width(width).height(height);
      }, this));
    }
  }
};
ListAudiomodel.prototype.handle_delete = function() {
  var _a, audiomodel, delete_menu, msg;
  audiomodel = this;
  msg = ("L'élément " + ((typeof (_a = this.artist) !== "undefined" && _a !== null) ? ("" + (this.artist) + " -") : null) + " " + (this.title) + " a bien été supprimé");
  delete_menu = function(delete_link) {
    return make_xps_menu({
      name: ("delete_audiomodel_" + (this.id)),
      text: ("Etes vous sur de vouloir supprimer ce" + (this.type === "audiofile" ? " morceau" : "tte playlist") + " ?"),
      title: ("Suppression d'un" + (this.type === "audiofile" ? " morceau" : "e playlist")),
      show_validate: false,
      actions: {
        "Oui": function() {
          return $.getJSON(delete_link, __bind(function(json) {
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
  };
  return function(e) {
    e.preventDefault();
    e.stopPropagation();
    return show_menu(delete_menu(e.target.href));
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
AudioFileForm = function(opts) {
  this.uuid = gen_uuid();
  AudioFileForm.__super__.constructor.call(this, {
    template: 'audiofile_form',
    context: {
      uuid: this.uuid
    }
  });
  this.progress_bar = opts.progress_bar ? opts.progress_bar : this.ui.find('.progress_bar');
  this.ui.ajaxForm({
    dataType: 'json',
    target: this.ui,
    beforeSubmit: this,
    success: this.success,
    beforeSubmit: __bind(function(arr, form, options) {
      var _a;
      (typeof (_a = opts.beforeSubmit) === "function" ? _a() : undefined);
      this.progress_bar.progressbar({
        progress: 0
      });
      this.interval_id = setInterval(this.update_progress_info(), this.update_freq);
      return true;
    }, this),
    success: __bind(function(response, status_text, form) {
      var _a;
      clearInterval(this.interval_id);
      this.progress_bar.hide();
      this.ui.remove();
      (typeof (_a = opts.success) === "function" ? _a(response.audiofile) : undefined);
      return response.status === "error" ? alert("Error with the file uploaded") : this.success_message(response.audiofile);
    }, this)
  });
  return this;
};
__extends(AudioFileForm, TemplateComponent);
AudioFileForm.prototype.progress_url = "/upload-progress/";
AudioFileForm.prototype.update_freq = 1000;
AudioFileForm.prototype.update_progress_info = function() {
  return __bind(function() {
    return $.getJSON(this.progress_url, {
      "X-Progress-ID": this.uuid
    }, __bind(function(data, status) {
      var progress;
      if (data) {
        progress = parseInt(data.received) / parseInt(data.size);
        return this.progress_bar.progressbar("option", "value", progress * 100);
      }
    }, this));
  }, this);
};
AudioFileForm.prototype.success_message = function(af) {
  return post_message("Le morceau " + (af.artist) + " - " + (af.title) + " a été ajouté avec succès");
};
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
  this.bind_events();
  return this;
};
__extends(PlaylistElement, Audiomodel);
PlaylistElement.prototype.bind_events = function() {
  this.ui.find('.audiofile_edit').click(this.handle_audiofile_edit());
  this.ui.find('.audiofile_play').click(handle_audiofile_play);
  return this.ui.find('.source_element_delete').click(__bind(function(e) {
    e.preventDefault();
    return this.fresh ? this.ui.remove() : this.ui.addClass('to_delete_source_element');
  }, this));
};
PlaylistElement.prototype.toString = function() {
  return "playlist_element_" + (gen_uuid());
};
TrackList = function() {
  var tracklist;
  this.length = 0;
  this.elements = new Set();
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
TrackList.prototype.get_tracks_map = function() {
  var _a, _b, data, i, li, lis;
  data = {};
  lis = this.container.find("li");
  _a = lis;
  for (i = 0, _b = _a.length; i < _b; i++) {
    li = _a[i];
    if (!$(li).hasClass("to_delete_source_element")) {
      data[("source_element_" + (i))] = $(li).children('input').val();
    }
  }
  return data;
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
MainComponent = function() {
  MainComponent.__super__.constructor.call(this, {
    template: "main_component"
  });
  return this;
};
__extends(MainComponent, AppComponent);
PlaylistComponent = function(json) {
  var _a, _b, _c, audiofile, audiofile_form;
  PlaylistComponent.__super__.constructor.call(this, {
    template: "audiosource_base",
    context: json
  });
  this.init_components();
  this.action = json.action;
  audiofile_form = new AudioFileForm({
    success: __bind(function(audiofile) {
      return this.tracklist.append(audiofile, true);
    }, this)
  });
  this.fields.file_forms.append(audiofile_form.ui);
  this.inputs.tags.autocomplete(multicomplete_params(json.tag_list));
  this.inputs.tags.unbind('blur.autocomplete');
  if (this.action === "edition") {
    this.tags_table = new TagsTable(json.audiosource.tags_by_category);
    this.fields.tags.append(this.tags_table.ui);
    _b = json.audiosource.sorted_audiofiles;
    for (_a = 0, _c = _b.length; _a < _c; _a++) {
      audiofile = _b[_a];
      this.tracklist.append(audiofile, false);
    }
  }
  this.submit_button.button();
  this.submit_button.click(__bind(function(e) {
    e.preventDefault();
    return this.submit();
  }, this));
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
  this.form = $('#audiosource_form');
  return (this.submit_button = $("#audiosource_form_submit"));
};
PlaylistComponent.prototype.submit = function() {
  var data;
  data = this.action === "edition" ? this.tags_table.to_delete_tags : {};
  $.extend(data, this.tracklist.get_tracks_map());
  return this.form.ajaxSubmit({
    data: data,
    success: function(r) {
      var action;
      if (Widgets.audiomodels.current_model === "audiosource") {
        Widgets.audiomodels.load();
      }
      Application.load("main");
      action = this.action === "edition" ? "modifiée" : "ajoutée";
      return post_message("La playlist " + (r.audiosource.title) + " à été " + (action) + " avec succès");
    }
  });
};
handle_audiofile_play = function(e) {
  var player;
  e.preventDefault();
  e.stopPropagation();
  player = document.getElementById('audiofile_player');
  return player ? player.dewset(e.target.href) : null;
};
PlanningComponent = function(init_data) {
  PlanningComponent.__super__.constructor.call(this, {
    template: "planning"
  });
  this.init_components();
  this.update_height();
  this.add_grid();
  return this;
};
__extends(PlanningComponent, AppComponent);
PlanningComponent.prototype.init_components = function() {
  this.board = $('#main_planning_board');
  return (this.container = $('#main_planning_board_container'));
};
PlanningComponent.prototype.update_height = function() {
  return this.container.height($(document).height() - this.container.offset().top - 20);
};
PlanningComponent.prototype.add_grid = function() {
  var _, _a, _b, div_class, i;
  _a = [];
  for (_ = 0; _ < 24; _++) {
    _a.push((function() {
      _b = [];
      for (i = 1; i <= 6; i++) {
        _b.push((function() {
          div_class = (({
            3: 'half',
            6: 'hour'
          })[i]) || 'tenth';
          return this.board.append(div({
            "class": ("grid_time grid_" + (div_class))
          }));
        }).call(this));
      }
      return _b;
    }).call(this));
  }
  return _a;
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
  var _a, cname, widget;
  _a = Widgets;
  for (cname in _a) {
    if (!__hasProp.call(_a, cname)) continue;
    widget = _a[cname];
    console.log("Loading component " + (cname));
    widget.load();
  }
  return Application.load("main");
});