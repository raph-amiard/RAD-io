from django.conf.urls.defaults import *
from rzz.playlist import views

urlpatterns = patterns('',
    url(r'now/$', views.playlist_now, name="playlist-now")
)
