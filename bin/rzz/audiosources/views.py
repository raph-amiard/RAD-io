import logging as log
import json

from django.contrib.admin.views.decorators import staff_member_required
from django.views.generic.simple import direct_to_template
from django.http import HttpResponse

from rzz.audiosources.models import AudioFile
from rzz.audiosources.forms import AudioFileForm
from rzz.audiosources.forms import AudioFileForm
from rzz.utils.models import instance_to_json

@staff_member_required
def create_audio_source(request):
    """
    View for dynamic creation of an audio source
    """
    #FIXME: Work in progress
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
