from django.conf.urls.defaults import *
from rzz.audiosources.forms import AudioFileForm
import rzz.audiosources.views as views
from django.core.urlresolvers import reverse

urlpatterns = patterns('',
	url(r'^audiofile/add/$',views.create_audio_file, name='create-audio-file'),
    url(r'^audiosource/add/$', views.create_audio_source, name='create-audio-source'),
    url(r'^audiofile/list/$', views.audio_files_list, name='audio-files-list'),
    url(r'^audiofile/(?P<audiofile_id>\d+)/edit/$', views.edit_audio_file, name='audio-file-edit'),
    )
