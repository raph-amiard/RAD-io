from django.conf.urls.defaults import *
from rzz.user_media import views

urlpatterns = patterns('',
    url(r'add/$', views.add_user_media, name='add-user-media'),
)
