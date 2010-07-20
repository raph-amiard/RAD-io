gen_uuid: -> (Math.floor(Math.random() * 16).toString(16) for _ in [0...32]).join ''
js_template: (t) -> "/site_media/js_templates/${t}.ejs"
split: (val) -> val.split /,\s*/
extractLast: (term) -> split(term).pop()

