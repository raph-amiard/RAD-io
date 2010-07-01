from django.core.urlresolvers import reverse
from django.conf.urls.defaults import *

import rzz.audiosources.views as views
from rzz.audiosources.forms import AudioFileForm
from rzz.audiosources.models import AudioFile, TagCategory, AudioSource

urlpatterns = patterns('',
    url(r'^main/$', 'django.views.generic.simple.direct_to_template', {'template':'audiosources/main.html'}),
	url(r'^audiofile/add/$',views.create_audio_file, name='create-audio-file'),
    url(r'^audiosource/add/$', views.create_audio_source, name='create-audio-source'),
    url(r'^audiosource/edit/(?P<audiosource_id>\d+)/$', views.edit_audio_source, name='edit-audio-source'),
    url(r'^audiofile/list/$', views.audio_models_list, {'audiomodel_klass':AudioFile,
                                                        'page':0} , name='audio-files-list'),
    url(r'^audiosource/list/$', views.audio_models_list, {'audiomodel_klass':AudioSource,
                                                        'page':0} , name='audio-files-list'),
    url(r'^audiofile/list/(?P<page>\d+)/$', views.audio_models_list, {'audiomodel_klass':AudioFile} , name='audio-files-list'),
    url(r'^audiosource/list/(?P<page>\d+)/$', views.audio_models_list, {'audiomodel_klass':AudioSource} , name='audio-files-list'),
    url(r'^audiofile/(?P<audiofile_id>\d+)/edit/$', views.edit_audio_file, name='audio-file-edit'),
    url(r'^audiomodel/(?P<audiomodel_id>\d+)/tag/(?P<tag_id>\d+)/delete/$', views.delete_audiomodel_tag, name='delete-audiomodel-tag'),
    url(r'^audiofile/tag/list/$', views.tags_list,{'audiomodel_klass':AudioFile}, name='audiofile-tags-list'),
    url(r'^audiosource/tag/list/$', views.tags_list,{'audiomodel_klass':AudioSource}, name='audiosource-tags-list')
    )
