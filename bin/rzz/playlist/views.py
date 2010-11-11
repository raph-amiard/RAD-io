from datetime import date
from django.views.generic.simple import direct_to_template
from rzz.playlist.models import PlaylistElement

class CurrentGroup(object):
    def __init__(self, source = None, elements = []):
        self.source = source
        self.elements = elements

class PlaylistRow(object):
    def __init__(self, tupl):
        self.on_air ,self.artist , self.title , self.source = tupl

def playlist_now(request):
    from django.db import connection
    cursor = connection.cursor()

    cursor.execute("""
        SELECT p_el.on_air, audiofile.artist, audiofile.title, audiosource.title
        FROM playlist_playlistelement AS p_el,
            audiosources_audiosource AS audiosource,
            audiosources_audiofile AS audiofile
        WHERE p_el.audiofile_id = audiofile.audiomodel_ptr_id
            AND p_el.audiosource_id = audiosource.audiomodel_ptr_id
        ORDER BY on_air DESC LIMIT 50;
    """)

    playlist_rows = (PlaylistRow(tupl) for tupl in cursor.fetchall())

    current_group = CurrentGroup()
    elements_by_source = []

    for playlist_row in playlist_rows:

        if current_group.source == playlist_row.source:
            current_group.elements.append(playlist_row)
        else:
            current_group = CurrentGroup(playlist_row.source, [playlist_row])
            elements_by_source.append(current_group)

    return direct_to_template(request,
        'playlist/playlist_now.html',
        extra_context={'elements_by_source':elements_by_source}
    )
