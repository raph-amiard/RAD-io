from django import template
from rzz import settings

register = template.Library()

@register.simple_tag
def main_radio_adress(format_string):
    if format_string in ["ogg", "mp3"]:
        return "http://{0}/{1}.{2}.m3u".format(settings.RADIO_HOST, settings.RADIO_MOUNT_NAME, format_string)
    else:
        raise template.TemplateSyntaxError, "main_radio_adress tag requires a format either \"ogg\" or \"mp3\""


@register.simple_tag
def main_radio_adress_bare(format_string):
    if format_string in ["ogg", "mp3"]:
        return "http://{0}/{1}.{2}".format(settings.RADIO_HOST, settings.RADIO_MOUNT_NAME, format_string)
    else:
        raise template.TemplateSyntaxError, "main_radio_adress tag requires a format either \"ogg\" or \"mp3\""
