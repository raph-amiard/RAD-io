def append_to_key(dct, key, val): 
    if dct.has_key(key): 
        dct[key].append(val) 
    else: 
        dct[key] = [val] 
    return dct 

def process_tags(tags_string):
    if tags_string == u'':
        return {}
    splitted_tags = [tag.strip().split(':') 
                     for tag in tags_string.split(',') if not tag.isspace()]
    output = {}
    for tag in splitted_tags:
        l = len(tag)
        append_to_key(output, tag[0] if l > 1 else 'general', tag[1] if l > 1 else tag[0])
    return output

def add_tags_to_model(tags_string, audiomodel):
    from rzz.audiosources.models import TagCategory, Tag
    for category, tags in process_tags(tags_string).items():
        c, _ = TagCategory.objects.get_or_create(name=category)
        for tag in tags:
            t, _ = Tag.objects.get_or_create(category=c,name=tag)
            audiomodel.tags.add(t)
