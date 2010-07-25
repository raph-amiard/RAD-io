var add_tracks_to_playlist, append_to_playlist, audiofile_edit_handler, audiomodel_route, audiomodel_selector_update, audiomodels, audiomodels_by_id, audiomodels_routes, browser_draggable_update, current_audiomodel, current_mode, format_length, gen_ajaxform_options, handle_audiofile_play, handle_audiomodel_delete, handle_tag_delete, multicomplete_params, playlist_edit_handler, playlist_view, populate_form_errors, sel_data, show_edit_planning, tag_sel_handler, total_playlist_length, update_playlist_length, update_sources_list, update_tags_list;
total_playlist_length = 0;
sel_data = {};
audiomodels = {};
audiomodels_by_id = {};
current_audiomodel = 'audiofile_select';
current_mode = 'main';
audiomodels_routes = {
  audiofile_select: {
    view_url: '/audiosources/audiofile/list/',
    template_url: '/site_media/js_templates/audiofile_list_element.ejs',
    tags_url: '/audiosources/audiofile/tag/list/'
  },
  audiosource_select: {
    view_url: '/audiosources/audiosource/list/',
    template_url: '/site_media/js_templates/audiosource_list_element.ejs',
    tags_url: '/audiosources/audiosource/tag/list/'
  }
};
audiomodel_route = function() {
  return audiomodels_routes[current_audiomodel];
};
update_sources_list = function() {
  return $.getJSON(audiomodel_route().view_url, sel_data, audiomodel_selector_update);
};
update_tags_list = function() {
  return $.get(audiomodel_route().tags_url, tag_sel_handler);
};
update_playlist_length = function() {
  return $('#playlist_length').text(format_length(total_playlist_length));
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
    strnum = (function() {
      _a = [];
      for (_ = 0; (0 <= zeroes ? _ < zeroes : _ > zeroes); (0 <= zeroes ? _ += 1 : _ -= 1)) {
        _a.push("0");
      }
      return _a;
    })().join('') + strnum;
    return strnum;
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
populate_form_errors = function(errors, form) {
  var $ul, _a, _b, _c, _d, _e, _f, _g, _h, error, msg;
  _a = []; _c = errors;
  for (_b = 0, _d = _c.length; _b < _d; _b++) {
    error = _c[_b];
    _a.push((function() {
      if (error !== 'status') {
        $ul = $(("input[name=" + (error) + "]"), form).parent().before('<ul> </ul>');
        _e = []; _g = error;
        for (_f = 0, _h = _g.length; _f < _h; _f++) {
          msg = _g[_f];
          _e.push($ul.before(("<li>" + (msg) + "</li>")));
        }
        return _e;
      }
    })());
  }
  return _a;
};
handle_tag_delete = function(e) {
  var $audiofile_tag, tag_id;
  e.preventDefault();
  $audiofile_tag = $(this).parents('.audiofile_tag').first();
  $audiofile_tag.siblings().length === 0 ? $audiofile_tag.parents('tr').first().hide() : $audiofile_tag.hide();
  tag_id = $audiofile_tag[0].id.split(/_/)[1];
  return $audiofile_tag.append("<input type=\"hidden\" name=\"to_delete_tag_" + tag_id + "\" value=\"" + tag_id + "\">");
};
audiofile_edit_handler = function(e) {
  var $pl_element;
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
        current_audiomodel === "audiofile_select" ? update_sources_list() : null;
        return post_message("Le morceau " + data.audiofile.artist + " - " + data.audiofile.title + " a été modifié avec succès");
      };
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
append_to_playlist = function(audiofile, fresh, to_replace_element) {
  var $html, af_div;
  fresh = fresh ? true : false;
  $html = $(new EJS({
    url: js_template('playlist_element')
  }).render({
    audiofile: audiofile,
    fresh: fresh
  }));
  to_replace_element ? (af_div = to_replace_element.replaceWith($html)) : (af_div = $('#uploaded_audiofiles').append($html));
  $('.source_element_delete', $html).click(function(e) {
    var $li;
    e.preventDefault();
    $li = $(this).parents('li:first');
    $li.hasClass('fresh_source_element') ? $li.remove() : $li.addClass('to_delete_source_element');
    total_playlist_length -= audiofile.length;
    return update_playlist_length();
  });
  $('.audiofile_edit', $html).click(audiofile_edit_handler);
  $('#uploaded_audiofiles ul').children().disableTextSelect();
  total_playlist_length += audiofile.length;
  return update_playlist_length();
};
gen_ajaxform_options = function(target_form, new_form) {
  var freq, prg_bar, update_progress_info, uuid;
  uuid = gen_uuid();
  freq = 1000;
  prg_bar = $('.progress_bar', target_form);
  update_progress_info = function() {
    return $.getJSON('/upload-progress/', {
      'X-Progress-ID': uuid
    }, function(data, status) {
      var progress;
      if (data) {
        progress = parseInt(data.received) / parseInt(data.size);
        prg_bar.progressbar("option", "value", progress * 100);
        return setTimeout(update_progress_info, freq);
      }
    });
  };
  target_form[0].action += ("?X-Progress-ID=" + uuid);
  return {
    dataType: 'json',
    target: target_form,
    success: function(response, statusText, form) {
      if (response.status) {
        prg_bar.hide();
        if (response.status === "error") {
          return populate_form_errors(response, form);
        } else {
          post_message("Le morceau " + response.audiofile.artist + " - " + response.audiofile.title + " a été ajouté avec succès");
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
      $newform.ajaxForm(gen_ajaxform_options($newform, $newform.clone()));
      prg_bar.progressbar({
        progress: 0
      });
      return setTimeout(update_progress_info(freq));
    }
  };
};
browser_draggable_update = function() {
  current_mode === "playlist_edit" && current_audiomodel === "audiofile_select" ? $('#track_selector ul li').draggable({
    helper: 'clone',
    appendTo: 'body',
    scroll: false,
    connectToSortable: 'ul#uploaded_audiofiles',
    zIndex: '257'
  }) : null;
  return current_mode === "planning_edit" && current_audiomodel === "audiosource_select" ? $('#track_selector ul li').draggable({
    helper: 'clone',
    appendTo: 'body',
    snap: '#planning_board td',
    scroll: false,
    zIndex: '257',
    drag: function(event, ui) {
      console.log(event);
      return console.log(ui);
    }
  }) : null;
};
audiomodel_selector_update = function(audiomodels_list) {
  var _a, _b, _c, _d, _e, _f, _g, audiomodel, ejs_template, html, lis;
  audiomodels = audiomodels_list;
  _b = audiomodels_list;
  for (_a = 0, _c = _b.length; _a < _c; _a++) {
    audiomodel = _b[_a];
    audiomodels_by_id[audiomodel.id] = audiomodel;
  }
  ejs_template = new EJS({
    url: audiomodel_route().template_url
  });
  lis = (function() {
    _d = []; _f = audiomodels;
    for (_e = 0, _g = _f.length; _e < _g; _e++) {
      audiomodel = _f[_e];
      _d.push(ejs_template.render({
        audiomodel: audiomodel
      }));
    }
    return _d;
  })();
  html = ("<ul>" + (lis.join('')) + "</ul>");
  $('#track_selector').html(html);
  $('#track_selector ul').make_selectable();
  browser_draggable_update();
  $('#uploaded_audiofiles').sortable('refresh');
  $('.audiomodel_delete').click(handle_audiomodel_delete);
  $('.audiofile_edit').click(audiofile_edit_handler);
  $('.audiosource_edit').click(function(e) {
    e.stopPropagation();
    e.preventDefault();
    return $.get(this.href, playlist_view);
  });
  return $('.audiofile_play').click(handle_audiofile_play);
};
handle_audiofile_play = function(e) {
  var player;
  e.preventDefault();
  e.stopPropagation();
  player = document.getElementById('audiofile_player');
  return player ? player.dewset(e.target.href) : null;
};
add_tracks_to_playlist = function() {
  var _a, _b, _c, el, i;
  _a = []; _b = $('#track_selector li');
  for (i = 0, _c = _b.length; i < _c; i++) {
    el = _b[i];
    $(el).hasClass('ui-selected') ? _a.push(append_to_playlist(audiomodels[i], true)) : null;
  }
  return _a;
};
handle_audiomodel_delete = function(e) {
  var $li, content;
  e.stopPropagation();
  e.preventDefault();
  $li = $(this).parents('li:first');
  content = new EJS({
    url: js_template('confirm')
  }).render({
    action: "Supprimer cet element",
    confirm_url: e.target.href
  });
  return modal_action("Supprimer un elément", content, function(clear_func) {
    $('.cancel_action').click(function(e) {
      e.preventDefault();
      return clear_func();
    });
    return $('.confirm_action').click(function(e) {
      e.preventDefault();
      return $.getJSON(e.target.href, function(json) {
        var artist;
        if (json.status === "ok") {
          clear_func();
          $li.remove();
          artist = json.object.artist;
          return post_message(("L'élément " + ((typeof artist !== "undefined" && artist !== null) ? ("" + artist + " -") : null) + " " + json.object.title + " a bien été supprimé"));
        }
      });
    });
  });
};
tag_sel_handler = function(html_data) {
  $('#tag_selector').html(html_data);
  return $('#tag_selector ul').make_selectable({
    handler: function(event, ui) {
      var _a, _b, i, input;
      sel_data = {
        text_filter: sel_data['text_filter']
      };
      _a = $('#tag_selector ul li.ui-selected input');
      for (i = 0, _b = _a.length; i < _b; i++) {
        input = _a[i];
        sel_data[("tag_" + i)] = input.value;
      }
      return update_sources_list();
    }
  });
};
playlist_edit_handler = function() {
  $('#uploaded_audiofiles').sortable({
    axis: 'y',
    containment: $('.playlist_box'),
    connectWith: '#track_selector ul li',
    cursor: "crosshair",
    stop: function(e, ui) {
      return ui.item.hasClass('ui-draggable') ? append_to_playlist(audiomodels_by_id[ui.item.children('input').val()], true, ui.item) : null;
    }
  });
  $('.audiofile_edit').click(audiofile_edit_handler);
  return $('#audiosource_form', document).submit(function(e) {
    var _a, _b, data, i, li;
    e.preventDefault();
    data = {};
    _a = $('#uploaded_audiofiles li');
    for (i = 0, _b = _a.length; i < _b; i++) {
      li = _a[i];
      !$(li).hasClass("to_delete_source_element") ? (data[("source_element_" + i)] = $(li).children('input').val()) : null;
    }
    return $(this).ajaxSubmit({
      data: data,
      success: function(r) {
        var action;
        current_audiomodel === "audiosource_select" ? update_sources_list() : null;
        $('#playlist_edit').hide();
        $('#main_content').show();
        action = r.action === "edition" ? "modifiée" : "ajoutée";
        post_message("La playlist " + r.audiosource.title + " à été " + action + " avec succès");
        current_mode = "main";
        return current_mode;
      }
    });
  });
};
playlist_view = function(json) {
  var $pl_div, _a, _b, _c, audiofile, audiofileform_handler;
  audiofileform_handler = function(i) {
    return $(this).ajaxForm(gen_ajaxform_options($(this), $(this).clone()));
  };
  $pl_div = $('#playlist_edit');
  total_playlist_length = 0;
  current_mode = "playlist_edit";
  $pl_div.show();
  $('#main_content').hide();
  $('#audiofile_forms').html(new EJS({
    url: js_template('audiofile_form')
  }).render(json));
  $('#playlist_edit_title', $pl_div).html(json.title);
  $('#audiosource_form')[0].action = json.form_url;
  $('#uploaded_audiofiles').html('');
  $('#playlist_title').val(json.mode === "edition" ? json.audiosource.title : "");
  $('#tags_table_container', $pl_div).html('');
  $('#audiosource_tags').val('').autocomplete(multicomplete_params(json.tag_list)).unbind('blur.autocomplete');
  if (json.mode === "edition") {
    _b = json.audiosource.sorted_audiofiles;
    for (_a = 0, _c = _b.length; _a < _c; _a++) {
      audiofile = _b[_a];
      append_to_playlist(audiofile, false);
    }
    $('#tags_table_container').html(new EJS({
      url: js_template('tags_table')
    }).render({
      audiomodel: json.audiosource
    }));
  }
  return $('.audiofileform').each(audiofileform_handler);
};
show_edit_planning = function() {
  var _, board, ct, i;
  board = $('#main_planning_board');
  ct = $('#main_planning_board_container');
  for (_ = 0; _ < 24; _++) {
    for (i = 1; i <= 6; i++) {
      board.append(("<div class='grid_time " + (function() {
        if (i === 3) {
          return "grid_half";
        } else if (i === 6) {
          return "grid_hour";
        } else {
          return "grid_tenth";
        }
      })() + "'></div>"));
    }
  }
  $('#main_content').hide();
  $('#planning_edit').show();
  ct.height($(document).height() - ct.offset().top - 20);
  current_mode = "planning_edit";
  return current_mode;
};
$(function() {
  playlist_edit_handler();
  update_sources_list();
  update_tags_list();
  $('#text_selector').keyup(function(e) {
    sel_data['text_filter'] = $(this).val();
    return update_sources_list();
  });
  $('#add_to_playlist_button').click(add_tracks_to_playlist);
  $('.audiofile_tag_delete').live('click', handle_tag_delete);
  $('#create_playlist_button').click(function(e) {
    return $.get('/audiosources/json/create-audio-source', playlist_view);
  });
  $('#uploaded_audiofiles .audiofile_play').live('click', handle_audiofile_play);
  return $('#source_type').make_selectable({
    unique_select: true,
    select_class: 'choice_selected',
    handler: function(e) {
      current_audiomodel = e.target.id;
      sel_data = {
        text_filter: sel_data['text_filter']
      };
      update_sources_list();
      update_tags_list();
      $('[id$="select_footer"]').hide();
      return $(("#" + (current_audiomodel) + "_footer")).show();
    }
  });
});