from django.conf.urls.defaults import *
from rzz.audiosources.forms import AudioFileForm
from rzz.audiosources.views import create_audio_source, create_audio_file
from django.core.urlresolvers import reverse

urlpatterns = patterns('',
	url(r'^audiofile/add/$',create_audio_file, name='create-audio-file'),
    url(r'^audiosource/add/$', create_audio_source, name='create-audio-source')
	)
