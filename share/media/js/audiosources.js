var Application, AudioFileForm, Audiomodel, Playlist, PlaylistElement, TagsTable, TemplateComponent, Widgets, app_view, audiofile_edit_handler, audiofile_form_options, closest, el_pos_on_pboard, handle_audiofile_play, playlist_edit_handler, playlist_view, populate_form_errors, pos_on_pboard, show_edit_planning, step, update_tags_list;
var __bind = function(func, context) {
    return function(){ return func.apply(context, arguments); };
  }, __extends = function(child, parent) {
    var ctor = function(){};
    ctor.prototype = parent.prototype;
    child.prototype = new ctor();
    child.prototype.constructor = child;
    if (typeof parent.extended === "function") parent.extended(child);
    child.__super__ = parent.prototype;
  }, __hasProp = Object.prototype.hasOwnProperty;
Application = {
  views: {},
  current_view: 'main',
  show_view: function(name) {
    var _a, _b, view, view_name;
    _a = this.views;
    for (view = 0, _b = _a.length; view < _b; view++) {
      view_name = _a[view];
      if (view_name === name) {
        view.show();
      } else {
        view.hide();
      }
    }
    return this.view(name);
  },
  load: function(name, view_params) {
    this.views[name].load(view_params);
    return this.show_view(name);
  },
  view: function(view_name) {
    return (typeof view_name !== "undefined" && view_name !== null) ? (this.current_view = view_name) : this.current_view;
  },
  component_action: function(component_name) {
    return this.views[this.current_view] == null ? undefined : this.views[this.current_view].components_actions[component_name];
  }
};
TemplateComponent = function(opts) {
  this.dom = render_template(opts.template, opts.context);
  this.ui = $(this.dom);
  return this;
};
TemplateComponent.prototype.dom = null;
Audiomodel = function(type, json_model) {
  this.type = type;
  $.extend(this, json_model);
  Audiomodel.__super__.constructor.call(this, {
    template: ("" + (this.type) + "_list_element"),
    context: {
      audiomodel: json_model
    }
  });
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
Audiomodel.prototype.handle_delete = function() {
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
Audiomodel.prototype.make_audiofile_edit_menu = function(data, to_delete_tags) {
  var audiomodel;
  audiomodel = this;
  return make_xps_menu({
    name: ("edit_audiomodel_" + (audiomodel.id)),
    text: data.html,
    title: "Edition d'un morceau",
    on_show: function() {
      $(this).find('.audiofile_tag_delete').click(handle_tag_delete);
      $(this).find('#id_tags').autocomplete(multicomplete_params(data.tag_list));
      return $(this).find('#id_artist').autocomplete({
        source: data.artist_list
      });
    },
    validate_action: function() {
      return $(this).find('form').ajaxSubmit({
        dataType: 'json',
        data: to_delete_tags,
        success: function(json) {
          var af;
          console.log("LOL IM IN TEH SUCCESS");
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
  var audiomodel, handle_tag_delete, to_delete_tags;
  to_delete_tags = {};
  audiomodel = this;
  handle_tag_delete = function(e) {
    var $audiofile_tag, tag_id;
    /*
        Does the necessary action when a tag is marked for deletion :
        1. Hides it, and the category if necessary
        2. Adds an hidden input for when the form is submitted
    */
    e.preventDefault();
    $audiofile_tag = $(this).parents('.audiofile_tag').first();
    if ($audiofile_tag.siblings().length === 0) {
      $audiofile_tag.parents('tr').first().hide();
    } else {
      $audiofile_tag.hide();
    }
    tag_id = $audiofile_tag[0].id.split(/_/)[1];
    to_delete_tags[("to_delete_tag_" + (tag_id))] = tag_id;
    return show_menu(menu);
  };
  return function(e) {
    e.preventDefault();
    return $.getJSON(this.href, function(data) {
      var menu;
      menu = audiomodel.make_audiofile_edit_menu(data, to_delete_tags);
      return show_menu(menu);
    });
  };
};
Audiomodel.prototype.bind_events = function() {
  this.ui.find('.audiomodel_delete').click(this.handle_delete());
  if (this.type === "audiofile") {
    this.ui.find('.audiofile_edit').click(this.handle_audiofile_edit());
    return this.ui.find('.audiofile_play').click(handle_audiofile_play);
  } else if (this.type === "audiosource") {
    return this.ui.find('.audiosource_edit').click(function(e) {
      e.stopPropagation();
      e.preventDefault();
      return $.get(this.href, function(json) {
        console.log(json);
        return Application.load('playlist', json);
      });
    });
  }
};
TagsTable = function(audiomodel) {
  TagsTable.__super__.constructor.call(this, {
    template: 'tags_table',
    context: {
      audiomodel: audiomodel
    }
  });
  return this;
};
__extends(TagsTable, TemplateComponent);
AudioFileForm = function() {
  return TemplateComponent.apply(this, arguments);
};
__extends(AudioFileForm, TemplateComponent);
PlaylistElement = function(audiofile, fresh) {
  this.fresh = (typeof fresh !== "undefined" && fresh !== null);
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
__extends(PlaylistElement, TemplateComponent);
Playlist = function() {};
Playlist.prototype.length = 0;
Playlist.prototype.elements = new Set();
Playlist.prototype.element_update = function(el) {
  el.ui.find('.source_element_delete').click(__bind(function(e) {
    e.preventDefault();
    return this.remove(el);
  }, this));
  el.ui.find('.audiofile_edit').click(audiofile_edit_handler);
  Playlist.container.find('li').disableTextSelect();
  return this.update_length();
};
Playlist.prototype.update_length = function() {
  return Playlist.length_container.text(format_length(this.length));
};
Playlist.prototype.append = function(audiofile, fresh) {
  var pl_element;
  pl_element = new PlaylistElement(audiofile, fresh);
  this.elements.add(pl_element);
  this.length += audiofile.length;
  return Playlist.container.append(pl_element.dom);
};
Playlist.prototype.replace = function(audiofile, old_element, fresh) {
  var new_el;
  if (this.elements.has(old_element)) {
    new_el = new PlaylistElement(audiofile, fresh);
    this.length += audiofile.length - old_element.audiofile.length;
    this.elements.remove(old_element);
    this.elements.add(new_el);
    return old_element.ui.replaceWith(new_el.dom);
  }
};
Playlist.prototype.remove = function(el) {
  if (el.fresh) {
    el.ui.remove();
  } else {
    el.ui.addClass('to_delete_source_element');
  }
  this.elements.remove(el);
  this.length -= el.audiofile.length;
  return this.update_length();
};
Playlist.container = $('#uploaded_audiofiles');
Playlist.length_container = $('#playlist_length');
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
          audiomodel = new Audiomodel(this.current_model, json_audiomodel);
          this.all.push(audiomodel);
          this.by_id[audiomodel.id] = audiomodel;
          ul.append(audiomodel.ui);
          audiomodel.bind_events();
        }
        $('[id$="select_footer"]').hide();
        $("#" + (this.current_model) + "_select_footer").show();
        this.component_action = Application.component_action('audiomodels');
        this.component_action == null ? undefined : this.component_action.call();
        return delete this.component_action;
      }, this));
    }
  }
};
app_view = function(map) {
  this.show = function() {
    return this.container.show();
  };
  this.hide = function() {
    return this.container.hide();
  };
  $.extend(this, map);
  return this;
};
Application.views.playlist = app_view({
  container: $('#playlist_edit'),
  inputs: {
    title: $('#playlist_title'),
    tags: $('#audiosource_tags')
  },
  fields: {
    title: $('#playlist_edit_title'),
    audiofiles: Playlist.container,
    tags: '#tags_table_container',
    file_forms: $('#audiofile_forms')
  },
  form: $('#audiosource_form'),
  components_actions: {
    audiomodels: function() {
      Playlist.container.sortable('refresh');
      return this.current_model === "audiofile" ? $('#track_selector ul li').draggable({
        connectToSortable: Playlist.container,
        helper: 'clone',
        appendTo: 'body',
        scroll: false,
        zIndex: '257'
      }) : null;
    }
  },
  load: function(json) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _i, audiofile, f, i;
    this.playlist = new Playlist();
    this.fields.file_forms.html(render_template('audiofile_form', json));
    $('.audiofileform').each(function() {
      return $(this).ajaxForm(audiofile_form_options($(this), $(this).clone()));
    });
    _b = this.fields;
    for (_a = 0, _c = _b.length; _a < _c; _a++) {
      f = _b[_a];
      f.html('');
    }
    _e = this.inputs;
    for (_d = 0, _f = _e.length; _d < _f; _d++) {
      i = _e[_d];
      i.val('');
    }
    this.fields.title.html(json.title);
    this.form[0].action = json.form_url;
    this.inputs.tags.autocomplete(multicomplete_params(json.tag_list)).unbind('blur.autocomplete');
    if (json.mode === "edition") {
      this.inputs.title.val(json.mode === "edition" ? json.audiosource.title : null);
      _h = json.audiosource.sorted_audiofiles;
      for (_g = 0, _i = _h.length; _g < _i; _g++) {
        audiofile = _h[_g];
        append_to_playlist(audiofile, false);
      }
      return this.fields.tags.html(new TagsTable(json.audiosource).dom());
    }
  }
});
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
audiofile_edit_handler = function(e) {
  var $pl_element, handle_tag_delete;
  handle_tag_delete = function(e) {
    var $audiofile_tag, tag_id;
    e.preventDefault();
    $audiofile_tag = $(this).parents('.audiofile_tag').first();
    if ($audiofile_tag.siblings().length === 0) {
      $audiofile_tag.parents('tr').first().hide();
    } else {
      $audiofile_tag.hide();
    }
    tag_id = $audiofile_tag[0].id.split(/_/)[1];
    return $audiofile_tag.append("<input type=\"hidden\" name=\"to_delete_tag_" + (tag_id) + "\" value=\"" + (tag_id) + "\">");
  };
  e.stopPropagation();
  e.preventDefault();
  $pl_element = $(this).parents('.ui-state-default').first();
  return $.getJSON(this.href, function(data) {
    return modal_action("Editer un morceau", data.html, function(close_func) {
      var on_edit_success;
      on_edit_success = function(data) {
        close_func();
        if ($pl_element) {
          $('#audiofile_title', $pl_element).text(data.audiofile.title);
          $('#audiofile_artist', $pl_element).text(data.audiofile.artist);
        }
        $('#audiofiles_actions_container').html('');
        if (current_audiomodel === "audiofile_select") {
          update_sources_list();
        }
        return post_message("Le morceau " + (data.audiofile.artist) + " - " + (data.audiofile.title) + " a été modifié avec succès");
      };
      $('.audiofile_tag_delete').click(handle_tag_delete);
      $('#id_tags').autocomplete(multicomplete_params(data.tag_list));
      $('#id_artist').autocomplete({
        source: data.artist_list
      });
      return $('#audiofile_edit_form').ajaxForm({
        dataType: 'json',
        success: on_edit_success
      });
    });
  });
};
update_tags_list = function() {
  return $.get(audiomodel_route().tags_url, function(html_data) {
    $('#tag_selector').html(html_data);
    return $('#tag_selector ul').make_selectable({
      handler: function(event, ui) {
        var _a, _b, i, input, sel_data;
        sel_data = {
          text_filter: sel_data['text_filter']
        };
        _a = $('#tag_selector ul li.ui-selected input');
        for (i = 0, _b = _a.length; i < _b; i++) {
          input = _a[i];
          sel_data[("tag_" + (i))] = input.value;
        }
        return update_sources_list();
      }
    });
  });
};
handle_audiofile_play = function(e) {
  var player;
  e.preventDefault();
  e.stopPropagation();
  player = document.getElementById('audiofile_player');
  return player ? player.dewset(e.target.href) : null;
};
playlist_edit_handler = function() {
  $('.audiofile_edit').click(audiofile_edit_handler);
  $('#uploaded_audiofiles').sortable({
    axis: 'y',
    containment: $('.playlist_box'),
    connectWith: '#track_selector ul li',
    cursor: "crosshair",
    stop: function(e, ui) {
      return ui.item.hasClass('ui-draggable') ? append_to_playlist(audiomodels_by_id[ui.item.children('input').val()], true, ui.item) : null;
    }
  });
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
playlist_view = function(json) {
  var $pl_div, _a, _b, _c, audiofile, current_mode, total_playlist_length;
  current_mode = "playlist_edit";
  $pl_div = $('#playlist_edit');
  total_playlist_length = 0;
  $pl_div.show();
  $('#main_content').hide();
  $('#audiofile_forms').html(render_template('audiofile_form', json));
  $('.audiofileform').each(function() {
    return $(this).ajaxForm(audiofile_form_options($(this), $(this).clone()));
  });
  $('#uploaded_audiofiles').html('');
  $('#playlist_title').val('');
  $('#tags_table_container', $pl_div).html('');
  $('#audiosource_tags').val('');
  $('#playlist_edit_title', $pl_div).html(json.title);
  $('#audiosource_form')[0].action = json.form_url;
  $('#audiosource_tags').autocomplete(multicomplete_params(json.tag_list)).unbind('blur.autocomplete');
  if (json.mode === "edition") {
    $('#playlist_title').val(json.mode === "edition" ? json.audiosource.title : null);
    _b = json.audiosource.sorted_audiofiles;
    for (_a = 0, _c = _b.length; _a < _c; _a++) {
      audiofile = _b[_a];
      append_to_playlist(audiofile, false);
    }
    return $('#tags_table_container').html(render_template('tags_table', {
      audiomodel: json.audiosource
    }));
  }
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
  var _a, add_tracks_to_playlist, cname, component;
  add_tracks_to_playlist = function() {
    var _a, _b, _c, el, i;
    _a = []; _b = $('#track_selector li');
    for (i = 0, _c = _b.length; i < _c; i++) {
      el = _b[i];
      if ($(el).hasClass('ui-selected')) {
        _a.push(append_to_playlist(audiomodels[i], true));
      }
    }
    return _a;
  };
  playlist_edit_handler();
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
  $('#uploaded_audiofiles .audiofile_play').live('click', handle_audiofile_play);
  $('#add_to_playlist_button').click(add_tracks_to_playlist);
  return show_edit_planning();
});