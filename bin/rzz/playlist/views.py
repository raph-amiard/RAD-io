from datetime import date
from django.views.generic.simple import direct_to_template
from rzz.playlist.models import PlaylistElement

class CurrentGroup(object):
    def __init__(self, source = -1, elements = []):
        self.source = source
        self.elements = elements

def playlist_now(request):

    playlist_elements = PlaylistElement.objects.filter(on_air__gte=date.today()).order_by('-on_air')[:50]
    elements_by_source = []
    current_group = CurrentGroup(-1, [])

    for pl_el in playlist_elements:
        if current_group.source == pl_el.audiosource_id:
            current_group.elements.append(pl_el)
        else:
            current_group = CurrentGroup(pl_el.audiosource_id, [pl_el])
            elements_by_source.append(current_group)

    return direct_to_template(request,
        'playlist/playlist_now.html',
        extra_context={'elements_by_source':elements_by_source}
    )
