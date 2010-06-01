def append_to_key(dct, key, val): 
    if dct.has_key(key): 
        dct[key].append(val) 
    else: 
        dct[key] = [val] 
    return dct 

def process_tags(tags_string):
    if tags_string == u'':
        return {}
    splitted_tags = [tag.split(':') for tag in tags_string.split(' ')]
    output = {}
    for tag in splitted_tags:
        l = len(tag)
        append_to_key(output, tag[0] if l > 1 else 'general', tag[1] if l > 1 else tag[0])
    return output

