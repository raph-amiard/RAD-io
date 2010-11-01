from django.conf.urls.defaults import *
from rzz.friends import views

urlpatterns = patterns('',
    url(r'^list/$', views.friends_list, {'page':1}),
    url(r'^list/(?P<page>\d+)$', views.friends_list, name="friend-list"),
    url(r'$', 'django.views.generic.simple.redirect_to', {'url':'list/'}),
)
