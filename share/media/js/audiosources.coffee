total_playlist_length: 0
audiomodels: {}
audiomodels_by_id: {}
audiomodel: 'audiofile_select'
audiomodels_routes: {
  audiofile_select: {
    view_url:'/audiosources/audiofile/list/'
    template_url: '/site_media/js_templates/audiofile_list_element.ejs'
    tags_url:'/audiosources/audiofile/tag/list/'
  }
  audiosource_select: {
    view_url:'/audiosources/audiosource/list/'
    template_url:'/site_media/js_templates/audiosource_list_element.ejs'
    tags_url:'/audiosources/audiosource/tag/list/'
  }
}

audiomodel_route: -> audiomodels_routes[audiomodel]

js_template: (t) -> "/site_media/js_templates/${t}.ejs"

split: (val) -> val.split /,\s*/
extractLast: (term) -> split(term).pop()

multicomplete_params: (list) -> {
  minLength:0
  source: (request, response) -> response(
    $.ui.autocomplete.filter(list, extractLast request.term)
  )
  focus: -> no
  select: (event, ui) ->
    terms: split @value
    terms.pop()
    terms.push ui.item.value
    terms.push ""
    @value: terms.join(", ");
    false
}

format_length: (l) ->
  format_number: (num, length) ->
    strnum: num + ''
    len: strnum.length
    zeroes: if size > len then size - len else 0
    strnum: strnum + ("0" for _ in [0..zeroes])

  fnum: (num) -> format_number(num, 2)
  num_hours: Math.floor l / 3600
  hours: fnum num_hours
  minutes: fnum Math.floor((l % 3600) / 60)
  seconds: fnum(Math.floor(l % 60))

  if num_hours then "${hours}h${minutes}m${seconds}" else "${minutes}m${seconds}"

populate_form_errors: (errors, form) ->
  for error in errors
    if error != 'status'
      $ul: $("input[name=${error}]", form).parent().before '<ul> </ul>'
      for msg in error
        $ul.before "<li>${msg}</li>"

handle_tag_delete: (e) ->
  e.preventDefault()
  $audiofile_tag: $(this).parents('.audiofile_tag').first()

  if $audiofile_tag.siblings().length == 0
    $audiofile_tag.parents('tr').first().hide()
  else
    $audiofile_tag.hide()

  tag_id: $audiofile_tag[0].id.split(/_/)[1]
  $audiofile_tag.append "<input type=\"hidden\" name=\"to_delete_tag_$tag_id\" value=\"$tag_id\">"

audiofile_edit_handler: (e) ->
  e.stopPropagation(); e.preventDefault()
  #TODO : Use another class than ui-state-default
  $pl_element: $(this).parents('.ui-state-default').first()

  on_edit_sucess: (data) ->
    if $pl_element
      $('#audiofile_title', $pl_element).text form_res.audiofile.title
      $('#audiofile_artist', $pl_element).text form_res.audiofile.artist
    $('#audiofiles_actions_container').html ''
    if audiomodel == "audiofile_select" then update_sources_list()
    post_message "Le morceau $form_res.audiofile.artist - $form_res.audiofile.title a été modifié avec succès"

  edit_handler: (data) ->
    $('#audiofiles_actions_container').html(data.html)
    $('#id_tags').autocomplete multicomplete_params(data.tag_list)
    $('#id_artist').autocomplete {source: data.artist_list}
    $('audiofiles_actions_container form').ajaxForm {dataType:'json', success:on_edit_sucess}

  $.getJSON(@href, edit_handler)


append_to_playlist: (audiofile, fresh, to_replace_element) ->
  fresh: if fresh then true else false
  $html: $(new EJS({url: js_template 'playlist_element'}).render{audiofile:audiofile, fresh:fresh})

  if to_replace_element
    af_div: replace_el.replaceWith($html)
  else
    af_div: $('#uploaded_audiofiles').append($html)

  $('.source_element_delete', $html).click (e) ->
    e.preventDefault()
    $li: $(this).parents('li:first')
    if $li.hasClass('fresh_source_element') then $li.remove()
    else $li.addClass('to_delete_source_element')
    total_playlist_length -= audiofile.length
    update_playlist_length()

  $('.audiofile_edit', $html).click(audiofile_edit_handler)
  $('#uploaded_audiofiles ul').children().disableTextSelect()

  total_playlist_length += audiofile.length
  update_playlist_length()

gen_ajaxform_options: (target_form, new_form) ->
  uuid: gen_uuid()
  freq: 1000
  prg_bar: $('.progress_bar', target_form)

  update_progress_info: ->
    $.getJSON '/upload-progress/', {'X-Progress-ID': uuid}, (data, status) ->
      if data
        progress: parseInt(data.received) / parseInt(data.size)
        prg_bar.progressbar "option", "value", progress * 100
        setTimeout update_progress_info, freq

  target_form[0].action += "?X-Progress-ID=$uuid"

  {
    dataType:'json'
    target: target_form
    success: (response, statusText, form) ->
      if response.status
        prg_bar.hide()
        if response.status == "error" then populate_form_errors(response, form)
        else
          post_message "Le morceau $response.audiofile.artist - $response.audiofile.title a été ajouté avec succès"
          form.hide()
          append_to_playlist response.audiofile, true
      else
        form.html(response)
    beforeSubmit: (arr, $form, options) ->
      $newform: $(new_form)
      $form.after($newform)
      $newform.ajaxForm(gen_ajaxform_options $newform, $newform.clone())
      prg_bar.progressbar {progress: 0}
      setTimeout update_progress_info freq
  }

audiomodel_selector_update: (audiomodels_list) ->
  audiomodels: audiomodels_list
  for audiomodel in audiomodels_list
    audiomodels_by_id[audiomodel.id]: audiomodel

  ejs_template: new EJS {url:audiomodels_route().template_url}
  lis: ejs_template.render {audiomodel: audiomodel} for audiomodel in audiomodels
  html: "<li>${lis.join('')}</li>"

  $('#track_selector').html(html).filter('ul').make_selectable();
  $('#track_selector ul li').draggable {
    helper:'clone'
    appendTo:'body'
    scroll:no
    connectToSortable:'ul#uploaded_audiofiles'
    zIndex:257
  }
  $('.audiomodel_delete').click(handle_audiomodel_delete)
  $('.audiofile_edit').click(audiofile_edit_handler)
  $('.audiosource_edit').click (e) ->
    e.stopPropagation(); e.preventDefault()
    $.get @href, playlist_view
  $('.audiofile_play').click(handle_audiofile_play)
