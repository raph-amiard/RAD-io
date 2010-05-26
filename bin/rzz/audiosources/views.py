import logging as log
import json

from django.contrib.admin.views.decorators import staff_member_required
from django.views.generic.simple import direct_to_template
from django.http import HttpResponse
from copy import copy

from rzz.audiosources.models import AudioFile, AudioSource, SourceElement
from rzz.audiosources.forms import AudioFileForm
from rzz.audiosources.forms import AudioFileForm
from rzz.utils.models import instance_to_json

@staff_member_required
def create_audio_source(request):
    """
    View for dynamic creation of an audio source
    """
    if request.method == 'POST':
        log.debug(request.POST)
        audio_source = AudioSource()
        log.debug(request.POST[u'title'])
        audio_source.title = request.POST['title']
        audio_source.length = 0
        audio_source.save()
        for key, val in request.POST.items():
            try:
                pos = int(key)
                id = int(val)
                audiofile = AudioFile.objects.get(pk=int(val))
                source_element = SourceElement()
                source_element.position = pos
                source_element.audiosource = audio_source
                source_element.audiofile = audiofile 
                source_element.save()
                audio_source.length += audiofile.length 
            except ValueError:
                pass
    return direct_to_template(request, 
                              'audiosources/create_audiosource.html', 
                              extra_context={'form':AudioFileForm()})

@staff_member_required
def create_audio_file(request):
    """
    View for creation of audio files (ajax)
    Returns a simple form to be integrated by ajax on GET
    on POST, returns a json representation of the audiofile
    """
    if request.method == 'POST':
        form = AudioFileForm(request.POST, request.FILES)
        if form.is_valid():
            audiofile = form.save()
            return HttpResponse(instance_to_json(audiofile, status='ok'))
        else:
            return HttpResponse(json.dumps(dict(form.errors.items() + [('status', 'error')])))
    return direct_to_template(request,
                              'audiosources/audiofile_form.html',
                              extra_context={'form':AudioFileForm()})

def audio_files_list(request):
    """
    Displays a list of audio files depending on filter clauses
    Meant to be used by ajax
    """
    opts = copy(request.GET)
    num_page = opts.pop('p', 0)
    nb_items = 50
    bottom = nb_items * num_page
    top = bottom + nb_items
    if opts:
        audiofiles = AudioFile.objects.filter(**opts)[bottom:top]
    else:
        audiofiles = AudioFile.objects.all()[bottom:top]
    return direct_to_template(request,
                              'audiosources/audiofile_list.html',
                              extra_context={'audiofiles': audiofiles})
