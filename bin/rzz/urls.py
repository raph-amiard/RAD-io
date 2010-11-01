from django.conf.urls.defaults import *

from django.contrib import admin
from django.conf import settings
from rzz.utils.views import upload_progress

admin.autodiscover()

urlpatterns = patterns('',
	(r'^admin/doc/', include('django.contrib.admindocs.urls')),
	(r'^admin/', include(admin.site.urls)),
	(r'^audiosources/', include('rzz.audiosources.urls')),
	(r'^artists/', include('rzz.artists.urls')),
	(r'^friends/', include('rzz.friends.urls')),
	(r'^playlist/', include('rzz.playlist.urls')),
	(r'^news/', include('rzz.news.urls')),
	(r'^site_media/(?P<path>.*)$', 'django.views.static.serve',
        {'document_root': settings.MEDIA_ROOT,
		 'show_indexes': True}),
    url(r'upload-progress/$', upload_progress, name='upload-progress'),
)
