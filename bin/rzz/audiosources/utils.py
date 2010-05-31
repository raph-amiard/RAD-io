def process_tags(tags_string):
    splitted_tags = [tag.split(':') for tag in tags_string.split(' ')]
    tags_with_category = dict([(tag[0], tag[1]) for tag in splitted_tags if len(tag) > 1])
    general_tags = dict([('general', tag[0]) for tag in splitted_tags if len(tag) == 1])
    tags_with_category.update(general_tags)
    return tags_with_category
