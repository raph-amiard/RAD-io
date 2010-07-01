from django.core.urlresolvers import reverse
from django.conf.urls.defaults import *

import rzz.audiosources.views as views
from rzz.audiosources.forms import AudioFileForm
from rzz.audiosources.models import AudioFile, TagCategory, AudioSource

urlpatterns = patterns('',
	url(r'^audiofile/add/$',views.create_audio_file, name='create-audio-file'),
    url(r'^audiosource/add/$', views.create_audio_source, name='create-audio-source'),
    url(r'^audiofile/list/$', views.audio_models_list, {'audiomodel_klass':AudioFile,
                                                        'page':0} , name='audio-files-list'),
    url(r'^audiosource/list/$', views.audio_models_list, {'audiomodel_klass':AudioSource,
                                                        'page':0} , name='audio-files-list'),
    url(r'^audiofile/list/(?P<page>\d+)/$', views.audio_models_list, {'audiomodel_klass':AudioFile} , name='audio-files-list'),
    url(r'^audiosource/list/(?P<page>\d+)/$', views.audio_models_list, {'audiomodel_klass':AudioSource} , name='audio-files-list'),
    url(r'^audiofile/(?P<audiofile_id>\d+)/edit/$', views.edit_audio_file, name='audio-file-edit'),
    url(r'^audiomodel/(?P<audiomodel_id>\d+)/tag/(?P<tag_id>\d+)/delete/$', views.delete_audiomodel_tag, name='delete-audiomodel-tag'),
    url(r'^tag/list/$', 'django.views.generic.list_detail.object_list' , 
        {'queryset': TagCategory.objects.all(),
         'template_name': 'audiosources/tags_list.html',
         'template_object_name': 'tag_categories'}),
    )
