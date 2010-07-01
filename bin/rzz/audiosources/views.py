import logging as log
import json

from django.contrib.admin.views.decorators import staff_member_required
from django.views.generic.simple import direct_to_template
from django.http import HttpResponse
from django.core.urlresolvers import reverse
from django.template import Context, loader
from django.shortcuts import get_object_or_404

from rzz.artists.models import Artist
from rzz.audiosources.models import AudioModel, AudioFile, AudioSource, SourceElement,Tag, TagCategory, tag_list
from rzz.audiosources.forms import AudioFileForm, EditAudioFileForm
from rzz.utils.jsonutils import instance_to_json, instance_to_dict, JSONResponse
from rzz.utils.queries import Q_or
from rzz.audiosources.utils import process_tags

@staff_member_required
def create_audio_source(request):
    """
    View for dynamic creation of an audio source
    """
    if request.method == 'POST':
        audio_source = AudioSource(title=request.POST['title'], length=0)
        audio_source.save()
        for key, val in request.POST.items():
            try:
                pos, id = int(key),  int(val)
                audiofile = AudioFile.objects.get(pk=id)
                source_element = SourceElement(position=pos,
                                               audiosource=audio_source,
                                               audiofile=audiofile)
                source_element.save()
                audio_source.length += audiofile.length 
            except ValueError:
                pass
        audio_source.save()
    return direct_to_template(request, 
                              'audiosources/create_audiosource.html', 
                              extra_context={'form':AudioFileForm()})

@staff_member_required
def create_audio_file(request):
    """
    AJAX
    View for creation of audio files 
    Returns a simple form to be integrated by ajax on GET
    on POST, returns a json representation of the audiofile
    """
    # TODO: Do two/three views : 
    # 1. Music control center view
    # 2. Form view
    # 3. Ajax response ?
    if request.method == 'POST':
        form = AudioFileForm(request.POST, request.FILES)
        if form.is_valid():
            audiofile = form.save()
            return JSONResponse({'audiofile':audiofile.to_dict(),
                                            'status':'ok'})
        else:
            return JSONResponse(dict(form.errors.items() 
                                     + [('status', 'error')]))
    return direct_to_template(request,
                              'audiosources/audiofile_form.html',
                              extra_context={'form':AudioFileForm()})

def audio_models_list(request,audiomodel_klass, page):
    """
    AJAX
    Displays a list of audio files depending on filter clauses
    """
    nb_items = 50
    bottom = nb_items * page
    top = bottom + nb_items
    text_filter = request.GET['text_filter'] if request.GET.has_key('text_filter') else None
    tags = Tag.objects.filter(id__in=[int(el) for key, el in request.GET.items() if "tag_" in key])

    if text_filter:
        search_clauses = ['title']
        if audiomodel_klass == AudioFile:
            search_clauses += ['artist']
        search_dict = dict([(sc + '__icontains', text_filter) for sc in search_clauses])
        audiofiles = audiomodel_klass.objects.filter(Q_or(**search_dict))
    else:
        audiofiles = audiomodel_klass.objects.all()
    for tag in tags:
        audiofiles = audiofiles.filter(tags=tag)

    cnt = audiofiles.count()
    if bottom > cnt:
        raise Http404
    audiofiles = audiofiles[bottom:top if top <= cnt else cnt]

    return JSONResponse([af.to_dict() for af in audiofiles])

def delete_audiomodel_tag(request, audiomodel_id, tag_id):
    audiomodel = get_object_or_404(AudioModel, pk=audiomodel_id);
    tag = get_object_or_404(Tag, pk=tag_id);
    try:
        audiomodel.tags.remove(tag);
        return JSONResponse({'status':'ok'})
    except:
        return JSONResponse({'status':'errors'})

def edit_audio_file(request, audiofile_id):
    """
    AJAX
    Returns a form to edit audiofile
    """
    # TODO : Use js templating instead of django templating
    audiofile = get_object_or_404(AudioFile, pk=audiofile_id)
    form = EditAudioFileForm(initial= {'title':audiofile.title,
                                       'artist':audiofile.artist})
    if request.method =='POST':
        form = EditAudioFileForm(request.POST)
        if form.is_valid():
            artist = form.cleaned_data['artist']
            title = form.cleaned_data['title']
            if artist != audiofile.artist or title != audiofile.title:
                audiofile.title = title
                audiofile.artist = artist
                audiofile.save_and_update_file()
            for category, tags in process_tags(form.cleaned_data['tags']).items():
                c, _ = TagCategory.objects.get_or_create(name=category)
                for tag in tags:
                    t, _ = Tag.objects.get_or_create(category=c,name=tag)
                    audiofile.tags.add(t)
            audiofile.save()
            return JSONResponse({'audiofile':audiofile.to_dict(),
                                 'status':'ok'})
        else:
            return JSONResponse(dict(form.errors.items() 
                                     + [('status','errors')]))
    template = loader.get_template('audiosources/audiofile_edit_form.html')
    ctx = Context({'form':form, 'audiofile':audiofile})
    return JSONResponse({'html':template.render(ctx),
                         'tag_list':tag_list(),
                         'artist_list':[a.name for a in Artist.objects.all()]})
