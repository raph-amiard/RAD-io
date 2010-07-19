from django.core.urlresolvers import reverse
from django.conf.urls.defaults import *

import rzz.audiosources.views as views
from rzz.audiosources.forms import AudioFileForm
from rzz.audiosources.models import AudioFile, TagCategory, AudioSource, SourceElement
from rzz.utils.views import delete_model_JSON

def url_delete_model(model_klass, model_name):
    n = 'delete-{0}'.format(model_name)
    return url(r'json/{0}/(?P<model_id>\d+)$'.format(n), delete_model_JSON,{'model_klass':model_klass}, name=n)

urlpatterns = patterns('',
    url(r'^main/$', 'django.views.generic.simple.direct_to_template', {'template':'audiosources/main.html'}),
	url(r'^json/create-audio-file$',views.create_audio_file, name='create-audio-file'),
    url(r'^json/create-audio-source$', views.create_audio_source, name='create-audio-source'),
    url(r'^json/edit-audio-source/(?P<audiosource_id>\d+)$', views.edit_audio_source, name='edit-audio-source'),
    url_delete_model(AudioFile, 'audio-file'),
    url_delete_model(AudioSource, 'audio-source'),
    url_delete_model(SourceElement, 'source-element'),
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
