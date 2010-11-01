from django.conf.urls.defaults import *
from rzz.artists import views

urlpatterns = patterns('',
    url(r'^list/$', views.artists_list, {'page':1}),
    url(r'^list/(?P<page>\d+)$', views.artists_list, name="artist-list"),
    url(r'^detail/(?P<artist_id>\d+)$', views.artist_detail, name="artist-detail"),
    url(r'$', 'django.views.generic.simple.redirect_to', {'url':'list/'}),
)
