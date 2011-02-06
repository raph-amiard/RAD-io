from django.conf.urls.defaults import *

from django.contrib import admin
from django.conf import settings
from rzz.utils.views import upload_progress
from rzz.admin.views import admin_root
from rzz.audiosources.views import listen

admin.autodiscover()

urlpatterns = patterns('',
    (r'^grappelli/', include('grappelli.urls')),
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
    url(r'^listen/$',listen , name='listen'),
    url(r'^$', 'django.views.generic.simple.redirect_to', {'url':'news/'}),
    url(r'^admin_root/$', admin_root, name="admin-root"),
    url(r'^login/$', 'django.contrib.auth.views.login', name="login"),
)
