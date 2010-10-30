var AppComponent, Application, AudioFileForm, Audiomodel, GridPositionner, ListAudiomodel, MainComponent, PlanningComponent, PlanningElement, PlaylistComponent, PlaylistElement, TagsTable, TemplateComponent, TrackList, Widgets, handle_audiofile_play, step;
var __bind = function(func, context) {
  return function() { return func.apply(context, arguments); };
}, __hasProp = Object.prototype.hasOwnProperty, __extends = function(child, parent) {
  function ctor() { this.constructor = child; }
  ctor.prototype = parent.prototype;
  child.prototype = new ctor;
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
    var _ref, klass;
    (((_ref = this.current_component) != null) ? _ref.close() : undefined);
    klass = this.views_components(name);
    this.current_component = new klass(view_params);
    return (this.current_view = name);
  },
  view: function(view_name) {
    return (view_name != null) ? (this.current_view = view_name) : this.current_view;
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
      var _i, _len, _ref, _result, i;
      this.selected_tags = (function() {
        _result = [];
        for (_i = 0, _len = (_ref = $('#tag_selector li.ui-selected input')).length; _i < _len; _i++) {
          i = _ref[_i];
          _result.push(i.value);
        }
        return _result;
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
    var _i, _ref, model_name;
    for (_i in _ref = Widgets.audiomodels.models) {
      if (!__hasProp.call(_ref, _i)) continue;
      (function() {
        var dom;
        var model_name = _i;
        var button_name = _ref[_i];
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
    var _ref, idx, map, tag;
    map = {};
    for (idx in _ref = Widgets.tags.selected_tags) {
      if (!__hasProp.call(_ref, idx)) continue;
      tag = _ref[idx];
      map[("tag_" + idx)] = tag;
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
      var _i, _len, audiomodel, json_audiomodel, ul;
      this.all = [];
      this.by_id = {};
      ul = tag('ul');
      this.container.html('');
      this.container.append(ul);
      for (_i = 0, _len = audiomodels_list.length; _i < _len; _i++) {
        json_audiomodel = audiomodels_list[_i];
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
    var _ref, _ref2, action_button, action_name, action_type, actions, actions_types, footer, footer_model, model, properties;
    for (model in _ref = this.actions) {
      if (!__hasProp.call(_ref, model)) continue;
      actions_types = _ref[model];
      footer = (this.footers[model] = div("", {
        "class": "head_and_foot"
      }));
      for (action_type in actions_types) {
        if (!__hasProp.call(actions_types, action_type)) continue;
        actions = actions_types[action_type];
        for (action_name in actions) {
          if (!__hasProp.call(actions, action_name)) continue;
          properties = actions[action_name];
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
    for (footer_model in _ref2 = this.footers) {
      if (!__hasProp.call(_ref2, footer_model)) continue;
      footer = _ref2[footer_model];
      this.container.append(footer);
      footer.hide();
    }
    return this.update();
  },
  update: function() {
    var _ref, audiomodel;
    audiomodel = Widgets.audiomodels.current_model;
    (((_ref = this.active_footer) != null) ? _ref.hide() : undefined);
    this.active_footer = this.footers[audiomodel];
    this.active_footer.show();
    return this.active_footer.find(".footer_button").button();
  }
};
TemplateComponent = (function() {
  function TemplateComponent(opts) {
    this.dom = render_template(opts.template, opts.context);
    this.ui = $(this.dom);
    return this;
  };
  return TemplateComponent;
})();
TemplateComponent.prototype.dom = null;
Audiomodel = (function() {
  function Audiomodel(opts) {
    Audiomodel.__super__.constructor.call(this, opts);
    return this;
  };
  return Audiomodel;
})();
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
ListAudiomodel = (function() {
  function ListAudiomodel(type, json_model) {
    var _ref;
    this.type = type;
    $.extend(this, json_model);
    this.audiomodel_base = json_model;
    ListAudiomodel.__super__.constructor.call(this, {
      template: ("" + (this.type) + "_list_element"),
      context: {
        audiomodel: json_model
      }
    });
    (((_ref = this.view_events[Application.current_view]) != null) ? _ref.apply(this, []) : undefined);
    return this;
  };
  return ListAudiomodel;
})();
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
    }) : undefined;
  },
  planning: function() {
    var column, planning, previous_left, previous_top, proxy, td_positions;
    if (this.type === "audiosource") {
      td_positions = [];
      planning = Application.current_component;
      proxy = null;
      previous_top = 0;
      previous_left = 0;
      column = 0;
      this.ui.bind('dragstart', __bind(function(e, dd) {
        var height, width;
        height = this.length / 60;
        width = planning.tds.first().width();
        proxy = div(this.title, {
          "class": 'audiofile_proxy'
        });
        proxy.css({
          top: dd.offsetY,
          left: dd.offsetX,
          position: 'absolute'
        });
        $('body').append(proxy);
        proxy.width(width).height(height);
        return (td_positions = new GridPositionner(planning.tds));
      }, this));
      this.ui.bind('drag', __bind(function(e, dd) {
        var _ref, col_width, el, left, proxy_in_board, rel_cpos, rel_pos, top;
        el = $(proxy);
        rel_pos = planning.el_pos(el);
        proxy_in_board = (rel_pos.top + (el.height() / 2) > 0 && rel_pos.left + (el.width() / 2) > 0);
        if (proxy_in_board) {
          rel_cpos = planning.pos({
            top: dd.offsetY,
            left: dd.offsetX
          });
          top = step(rel_cpos.top, 10);
          _ref = td_positions.closest(rel_cpos.left), column = _ref[0], left = _ref[1];
          left += 1;
          if (top !== previous_top || left !== previous_left) {
            planning.el_pos(el, {
              top: top,
              left: left
            });
            col_width = $(planning.tds[column]).width();
            el.width(col_width);
            previous_top = top;
            return (previous_left = left);
          }
        } else {
          return el.css({
            top: dd.offsetY,
            left: dd.offsetX
          });
        }
      }, this));
      return this.ui.bind('drop', __bind(function(e, dd) {
        var el, p_el;
        el = $(proxy);
        el.remove();
        return (p_el = planning.create_element({
          audiosource: this.audiomodel_base,
          type: planning.active_type,
          time_start: {
            hour: parseInt(previous_top / 60),
            minute: previous_top % 60
          },
          day: column
        }));
      }, this));
    }
  }
};
ListAudiomodel.prototype.handle_delete = function() {
  var audiomodel, delete_menu, msg;
  audiomodel = this;
  msg = ("L'élément " + ((this.artist != null) ? ("" + (this.artist) + " -") : undefined) + " " + (this.title) + " a bien été supprimé");
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
  } else   return this.type === "audiosource" ? this.ui.find('.audiosource_edit').click(function(e) {
    e.stopPropagation();
    e.preventDefault();
    return $.get(this.href, function(json) {
      return Application.load('playlist', json);
    });
  }) : (this.type === "planning" ? this.ui.find('.planning_edit').click(function(e) {
    e.stopPropagation();
    e.preventDefault();
    return $.getJSON(this.href, function(json) {
      return Application.load("planning", json);
    });
  }) : undefined);
};
TagsTable = (function() {
  function TagsTable(tags_by_category) {
    this.tags_by_category = tags_by_category;
    this.to_delete_tags = {};
    this.make_table();
    this.ui = this.table;
    this.dom = this.table[0];
    return this;
  };
  return TagsTable;
})();
TagsTable.prototype.to_delete_tags_array = function() {
  var _, _ref, _result, id;
  _result = [];
  for (_ in _ref = this.to_delete_tags) {
    if (!__hasProp.call(_ref, _)) continue;
    id = _ref[_];
    _result.push(id);
  }
  return _result;
};
TagsTable.prototype.make_table = function() {
  var _i, _ref, _result, category;
  this.table = $(render_template("tags_table"));
  _result = [];
  for (_i in _ref = this.tags_by_category) {
    if (!__hasProp.call(_ref, _i)) continue;
    (function() {
      var _j, _len, _ref2, category_tr, tags_td;
      var category = _i;
      var tags = _ref[_i];
      return _result.push((function() {
        category_tr = tag("tr");
        tags_td = tag("td");
        tags.remaining = 0;
        for (_j = 0, _len = (_ref2 = tags).length; _j < _len; _j++) {
          (function() {
            var delete_link, tag_span;
            var ctag = _ref2[_j];
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
  return _result;
};
AudioFileForm = (function() {
  function AudioFileForm(opts) {
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
        (typeof opts.beforeSubmit === "function" ? opts.beforeSubmit() : undefined);
        this.progress_bar.progressbar({
          progress: 0
        });
        this.interval_id = setInterval(this.update_progress_info(), this.update_freq);
        return true;
      }, this),
      success: __bind(function(response, status_text, form) {
        clearInterval(this.interval_id);
        this.progress_bar.hide();
        this.ui.remove();
        (typeof opts.success === "function" ? opts.success(response.audiofiles) : undefined);
        return response.status === "error" ? alert("Error with the file uploaded") : this.success_message(response.audiofiles);
      }, this)
    });
    return this;
  };
  return AudioFileForm;
})();
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
AudioFileForm.prototype.success_message = function(audiofiles) {
  var _i, _len, _result, af;
  _result = [];
  for (_i = 0, _len = audiofiles.length; _i < _len; _i++) {
    af = audiofiles[_i];
    _result.push(post_message("Le morceau " + (af.artist) + " - " + (af.title) + " a été ajouté avec succès"));
  }
  return _result;
};
PlaylistElement = (function() {
  function PlaylistElement(audiofile, container, fresh) {
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
  return PlaylistElement;
})();
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
TrackList = (function() {
  function TrackList() {
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
  return TrackList;
})();
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
  var _len, data, i, li, lis;
  data = {};
  lis = this.container.find("li");
  for (i = 0, _len = lis.length; i < _len; i++) {
    li = lis[i];
    if (!$(li).hasClass("to_delete_source_element")) {
      data[("source_element_" + i)] = $(li).children('input').val();
    }
  }
  return data;
};
AppComponent = (function() {
  function AppComponent(opts) {
    AppComponent.__super__.constructor.call(this, opts);
    this.main_content_holder.append(this.ui);
    return this;
  };
  return AppComponent;
})();
__extends(AppComponent, TemplateComponent);
AppComponent.prototype.main_content_holder = d$("#main_container");
AppComponent.prototype.bind_events = function() {};
AppComponent.prototype.close = function() {
  return this.ui.remove();
};
MainComponent = (function() {
  function MainComponent() {
    MainComponent.__super__.constructor.call(this, {
      template: "main_component"
    });
    return this;
  };
  return MainComponent;
})();
__extends(MainComponent, AppComponent);
PlaylistComponent = (function() {
  function PlaylistComponent(json) {
    var _i, _len, _ref, audiofile, gen_audiofile_form;
    PlaylistComponent.__super__.constructor.call(this, {
      template: "audiosource_base",
      context: json
    });
    this.init_components();
    this.action = json.action;
    gen_audiofile_form = __bind(function() {
      return new AudioFileForm({
        beforeSubmit: __bind(function() {
          return this.fields.file_forms.append(gen_audiofile_form().ui);
        }, this),
        success: __bind(function(audiofiles) {
          var _i, _len, _result, audiofile;
          _result = [];
          for (_i = 0, _len = audiofiles.length; _i < _len; _i++) {
            audiofile = audiofiles[_i];
            _result.push(this.tracklist.append(audiofile, true));
          }
          return _result;
        }, this)
      });
    }, this);
    this.fields.file_forms.append(gen_audiofile_form().ui);
    this.inputs.tags.autocomplete(multicomplete_params(json.tag_list));
    this.inputs.tags.unbind('blur.autocomplete');
    if (this.action === "edition") {
      this.tags_table = new TagsTable(json.audiosource.tags_by_category);
      this.fields.tags.append(this.tags_table.ui);
      for (_i = 0, _len = (_ref = json.audiosource.sorted_audiofiles).length; _i < _len; _i++) {
        audiofile = _ref[_i];
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
  return PlaylistComponent;
})();
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
      return post_message("La playlist " + (r.audiosource.title) + " à été " + action + " avec succès");
    }
  });
};
handle_audiofile_play = function(e) {
  var player;
  e.preventDefault();
  e.stopPropagation();
  player = document.getElementById('audiofile_player');
  return player ? player.dewset(e.target.href) : undefined;
};
PlanningComponent = (function() {
  function PlanningComponent(data) {
    PlanningComponent.__super__.constructor.call(this, {
      template: "planning"
    });
    this.planning_elements = new Set();
    this.init_components();
    this.add_grid();
    this.bind_events();
    if (data) {
      this.tags_table = new TagsTable(data.tags_by_category);
      this.tags_table_container.append(tag('p', 'Tags')).append(this.tags_table.ui);
      this.id = data.id;
      this.mode = "edition";
      this.init_data(data);
    } else {
      this.mode = "creation";
    }
    this.active_type = "single";
    this.show_hide();
    return this;
  };
  return PlanningComponent;
})();
__extends(PlanningComponent, AppComponent);
PlanningComponent.prototype.create_link = "/audiosources/json/create-planning";
PlanningComponent.prototype.edit_link = "/audiosources/json/edit-planning";
PlanningComponent.prototype.show_hide = function() {
  var _i, _len, _ref, _result, planning_element;
  _result = [];
  for (_i = 0, _len = (_ref = this.planning_elements.values()).length; _i < _len; _i++) {
    planning_element = _ref[_i];
    _result.push(planning_element.type === this.active_type ? planning_element.ui.show() : planning_element.ui.hide());
  }
  return _result;
};
PlanningComponent.prototype.bind_events = function() {
  this.submit_button.click(__bind(function() {
    var success_function;
    success_function = __bind(function() {
      return __bind(function() {
        var name;
        name = this.title_input.val();
        Application.load("main");
        return post_message("Le planning " + name + " a été " + (this.mode === "creation" ? "créé" : "édité") + " avec succes");
      }, this);
    }, this);
    return this.mode === "creation" ? $.post(this.create_link, {
      planning_data: this.to_json()
    }, success_function()) : (this.mode === "edition" ? $.post("" + (this.edit_link) + "/" + (this.id), {
      planning_data: this.to_json()
    }, success_function()) : undefined);
  }, this));
  this.show_choices.find("input").click(__bind(function(e) {
    this.active_type = e.target.id.split(/planning_show_/)[1];
    return this.show_hide();
  }, this));
  return $(window).resize(__bind(function() {
    return this.update_height();
  }, this));
};
PlanningComponent.prototype.init_components = function() {
  this.board = $('#main_planning_board');
  this.container = $('#main_planning_board_container');
  this.tds = $('#planning_board td');
  this.board_table = $('#planning_board');
  this.submit_button = $('#planning_submit');
  this.title_input = $('#planning_title');
  this.tags_input = $('#planning_tags');
  this.tags_table_container = $('#planning_edit_content .tags_table_container');
  this.show_choices = $('#planning_show_choices');
  this.show_choices.buttonset();
  this.show_choices.disableTextSelect();
  this.submit_button.button();
  return this.update_height();
};
PlanningComponent.prototype.update_height = function() {
  return this.container.height($(document).height() - this.container.offset().top - 20);
};
PlanningComponent.prototype.add_grid = function() {
  var _result, _result2, content, div_class, gridiv, h, i;
  _result = [];
  for (h = 0; h < 24; h++) {
    _result.push((function() {
      _result2 = [];
      for (i = 1; i <= 6; i++) {
        _result2.push((function() {
          div_class = {
            3: 'half',
            6: 'hour'
          }[i] || 'tenth';
          content = i === 1 ? ("" + (format_number(h, 2)) + "h00") : "";
          gridiv = div(content, {
            "class": ("grid_time grid_" + div_class)
          });
          return this.board.append(gridiv);
        }).call(this));
      }
      return _result2;
    }).call(this));
  }
  return _result;
};
PlanningComponent.prototype.init_data = function(data) {
  if (data.name) {
    this.title_input.val(data.name);
  }
  return data.planning_elements ? this.add_elements(data.planning_elements) : undefined;
};
PlanningComponent.prototype.add_elements = function(planning_elements) {
  var _i, _len, _result, planning_element;
  _result = [];
  for (_i = 0, _len = planning_elements.length; _i < _len; _i++) {
    planning_element = planning_elements[_i];
    _result.push(this.create_element(planning_element));
  }
  return _result;
};
PlanningComponent.prototype.pos = function(el_pos) {
  var pboard_off;
  pboard_off = this.board_table.offset();
  el_pos.top -= pboard_off.top;
  el_pos.left -= pboard_off.left;
  return el_pos;
};
PlanningComponent.prototype.el_pos = function(el, pos) {
  var el_off, pboard_off;
  pboard_off = this.board_table.offset();
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
PlanningComponent.prototype.create_element = function(json_model) {
  var planning_element;
  planning_element = new PlanningElement(this, json_model);
  return this.planning_elements.add(planning_element);
};
PlanningComponent.prototype.delete_element = function(planning_element) {
  this.planning_elements.remove(planning_element);
  return planning_element.ui.remove();
};
PlanningComponent.prototype.to_json = function() {
  var _i, _len, _ref, _result, el, pl_els, to_stringify;
  pl_els = (function() {
    _result = [];
    for (_i = 0, _len = (_ref = this.planning_elements.values()).length; _i < _len; _i++) {
      el = _ref[_i];
      _result.push(el.serialize());
    }
    return _result;
  }).call(this);
  to_stringify = {
    planning_elements: pl_els,
    title: this.title_input.val(),
    tags: this.tags_input.val()
  };
  if (this.mode === "edition") {
    to_stringify.to_delete_tags = this.tags_table.to_delete_tags_array();
  }
  return JSON.stringify(to_stringify);
};
PlanningElement = (function() {
  function PlanningElement(planning, json_model) {
    PlanningElement.__super__.constructor.call(this, {
      template: "planning_element",
      context: json_model
    });
    this.string_id = ("planning_element_" + (gen_uuid()));
    this.planning = planning;
    this.type = "single";
    $.extend(this, json_model);
    this.init_components();
    if (this.time_end === null) {
      this.time_end = {};
    }
    this.set_column_from_day();
    this.set_pos_from_time();
    this.ui.width(this.column.width());
    if (this.type === "single") {
      this.ui.height(this.audiosource.length / 60);
      this.make_single();
    } else {
      if (!this.time_end) {
        this.time_end = {};
        this.ui.height(this.audiosource.length / 60);
      }
      if (this.time_end.hour === 0) {
        this.time_end.hour = 24;
      }
      this.set_height_from_time_end();
      this.make_continuous();
    }
    this.bind_events();
    return this;
  };
  return PlanningElement;
})();
__extends(PlanningElement, Audiomodel);
PlanningElement.prototype.init_components = function() {
  this.ui_head = this.ui.find('.planning_element_head');
  this.ui_foot = this.ui.find('.planning_element_foot');
  this.delete_button = this.ui.find('.delete_button');
  return this.delete_button.button();
};
PlanningElement.prototype.edit_properties = function() {
  return __bind(function() {
    var form;
    return (form = div(""));
  }, this);
};
PlanningElement.prototype.make_continuous = function() {
  this.ui_head.show();
  this.ui_foot.show();
  this.set_time_end_from_height(step(this.ui.height(), 10));
  this.ui.css({
    opacity: 0.75
  });
  return this.ui.css({
    'z-index': 200
  });
};
PlanningElement.prototype.make_single = function() {
  this.ui_head.hide();
  this.ui_foot.hide();
  this.time_end = {};
  this.ui.css({
    opacity: 0.9
  });
  this.ui.css({
    'z-index': 400
  });
  return this.ui.height(this.audiosource.length / 60);
};
PlanningElement.prototype.bind_events = function() {
  var color, orig_height, orig_top, td_positions, z_index;
  color = null;
  z_index = null;
  td_positions = [];
  $(window).resize(__bind(function() {
    return this.ui.width(this.column.width());
  }, this));
  this.ui.bind('dragstart', __bind(function(e, dd) {
    e.stopPropagation();
    e.preventDefault();
    color = this.ui.css('background-color');
    z_index = this.ui.css('z-index');
    this.ui.css({
      'background-color': '#EBC'
    });
    this.ui.css({
      'z-index': z_index + 10
    });
    return (td_positions = new GridPositionner(this.planning.tds));
  }, this));
  this.ui.bind('drag', __bind(function(e, dd) {
    var column, rel_cpos, top;
    e.stopPropagation();
    e.preventDefault();
    rel_cpos = this.planning.pos({
      top: dd.offsetY,
      left: dd.offsetX
    });
    top = step(rel_cpos.top, 10);
    top = top > 0 ? top : 0;
    column = td_positions.closest(rel_cpos.left)[0];
    if (column !== this.day) {
      this.set_day_from_column(column);
      this.ui.width(this.column.width());
    }
    this.set_time_from_pos(top);
    return this.type === "continuous" ? this.refresh_time_end() : undefined;
  }, this));
  this.ui.bind('dragend', __bind(function(e, dd) {
    e.stopPropagation();
    e.preventDefault();
    this.ui.css({
      'background-color': color
    });
    return this.ui.css({
      "z-index": z_index
    });
  }, this));
  orig_height = null;
  orig_top = null;
  this.ui_head.bind('dragstart', __bind(function(e, dd) {
    e.stopPropagation();
    e.preventDefault();
    orig_height = this.ui.height();
    return (orig_top = this.top);
  }, this));
  this.ui_head.bind('drag', __bind(function(e, dd) {
    var difference;
    e.stopPropagation();
    e.preventDefault();
    difference = step(dd.deltaY, 10);
    this.set_time_from_pos(orig_top + difference);
    return this.set_time_end_from_height(orig_height - difference);
  }, this));
  this.ui_foot.bind('dragstart', __bind(function(e, dd) {
    e.stopPropagation();
    e.preventDefault();
    return (orig_height = this.ui.height());
  }, this));
  this.ui_foot.bind('drag', __bind(function(e, dd) {
    var difference;
    e.stopPropagation();
    e.preventDefault();
    difference = step(dd.deltaY, 10);
    return this.set_time_end_from_height(orig_height + difference);
  }, this));
  return this.delete_button.click(__bind(function(e, dd) {
    return this.planning.delete_element(this);
  }, this));
};
PlanningElement.prototype.set_day_from_column = function(column) {
  this.day = column;
  return this.set_column_from_day();
};
PlanningElement.prototype.set_column_from_day = function() {
  this.column = $(this.planning.tds[this.day]);
  return this.column.append(this.ui);
};
PlanningElement.prototype.set_time_from_pos = function(top_pos) {
  this.time_start.hour = parseInt(top_pos / 60);
  this.time_start.minute = top_pos % 60;
  return this.set_pos_from_time();
};
PlanningElement.prototype.set_pos_from_time = function() {
  this.top = this.time_start.minute + this.time_start.hour * 60;
  return this.ui.css({
    top: this.top
  });
};
PlanningElement.prototype.set_time_end_from_height = function(height) {
  this.time_end.hour = (parseInt(height / 60)) + this.time_start.hour;
  this.time_end.minute = (height + this.time_start.minute) % 60;
  return this.ui.height(height);
};
PlanningElement.prototype.set_height_from_time_end = function() {
  var height;
  height = (this.time_end.hour - this.time_start.hour) * 60;
  height += this.time_end.minute - this.time_start.minute;
  return this.ui.height(height);
};
PlanningElement.prototype.refresh_time_end = function() {
  return this.set_time_end_from_height(this.ui.height());
};
PlanningElement.prototype.serialize = function() {
  var o;
  o = object_with_keys(this, ['day', 'time_start', 'time_end', 'type']);
  o.audiosource_id = this.audiosource.id;
  return o;
};
PlanningElement.prototype.formatted_time = function() {
  return "" + (format_number(this.time_start.hour, 2)) + "h" + (format_number(this.time_start.minute, 2));
};
PlanningElement.prototype.toString = function() {
  return this.string_id;
};
GridPositionner = (function() {
  function GridPositionner(tds) {
    var _i, _len, _result, el;
    this.steps = (function() {
      _result = [];
      for (_i = 0, _len = tds.length; _i < _len; _i++) {
        el = tds[_i];
        _result.push(Math.round($(el).position().left));
      }
      return _result;
    })();
    return this;
  };
  return GridPositionner;
})();
GridPositionner.prototype.closest = function(num) {
  var col, last_i, ret;
  ret = null;
  col = null;
  $.each(this.steps, __bind(function(i) {
    if ((this.steps[i] <= num) && (num < this.steps[i + 1])) {
      if (num - this.steps[i] < this.steps[i + 1] - num) {
        ret = this.steps[i];
        return (col = i);
      } else {
        ret = this.steps[i + 1];
        return (col = i + 1);
      }
    }
  }, this));
  if (col === null) {
    last_i = this.steps.length - 1;
    if (num > this.steps[last_i]) {
      ret = this.steps[last_i];
      col = last_i;
    } else {
      ret = 0;
      col = 0;
    }
  }
  return [col, ret];
};
step = function(num, step) {
  return num - (num % step);
};
$(function() {
  var _ref, cname, widget;
  for (cname in _ref = Widgets) {
    if (!__hasProp.call(_ref, cname)) continue;
    widget = _ref[cname];
    console.log("Loading component " + cname);
    widget.load();
  }
  return Application.load("main");
});