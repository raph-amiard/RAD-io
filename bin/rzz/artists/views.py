"""
Simple crud views for the artist app
"""
from django.views.generic.list_detail import object_list, object_detail
from rzz.artists.models import Artist

def artists_list(request, page):
    """
    Paginated artist list
    """
    return object_list(request,
        queryset = Artist.objects.all(),
        paginate_by = 20,
        page = page,
        template_object_name="artist"
    )

def artist_detail(request, artist_id):
    """
    Object detail view for artist
    """
    return object_detail(request,
        queryset = Artist.objects.all(),
        object_id = artist_id,
        template_object_name="artist"
        )
