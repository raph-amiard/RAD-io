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
from rzz.audiosources.utils import add_tags_to_model, add_audiofiles_to_audiosource, remove_tags_from_model

@staff_member_required
def create_audio_source(request):
    """
    View for dynamic creation of an audio source
    """
    if request.method == 'POST':
        audio_source = AudioSource(title=request.POST['title'], length=0)
        audio_source.save()

        add_tags_to_model(request.POST['tags'], audio_source)

        playlist_tuples = [(int(key.split('_')[-1]), int(val))
                           for key, val in request.POST.items()
                           if key.startswith('source_element_')]

        add_audiofiles_to_audiosource(playlist_tuples, audio_source)
        return JSONResponse({
            'status':'success', 
            'action':'creation', 
            'audiosource':audio_source.to_dict()
        })

    return JSONResponse({
        'audiofileform':AudioFileForm().as_p(), 
        'mode':'creation', 
        'tag_list':tag_list(), 
        'title':'Creation d''une nouvelle playlist', 
        'form_url': reverse('create-audio-source')
    })

@staff_member_required
def edit_audio_source(request, audiosource_id):
    """
    """
    audio_source = get_object_or_404(AudioSource, id=audiosource_id)
    if request.method == 'POST':
        audio_source.sourceelement_set.all().delete()
        audio_source.title = request.POST['title']
        audio_source.length = 0
        add_tags_to_model(request.POST['tags'], audio_source)
        # Save to be able to add audiofiles to source
        audio_source.save()

        playlist_tuples = [(int(key.split('_')[-1]), int(val)) 
                           for key, val in request.POST.items() 
                           if key.startswith('source_element_')]

        to_delete_tags = [val for key, val in request.POST.items()
                          if key.startswith('to_delete_tag')]

        remove_tags_from_model(audio_source, to_delete_tags)
        add_audiofiles_to_audiosource(playlist_tuples, audio_source)
        return JSONResponse({
            'status':'success', 
            'action':'edition', 
            'audiosource':audio_source.to_dict()
        })

    return JSONResponse({
        'audiofileform':AudioFileForm().as_p(), 
        'mode':'edition', 
        'tag_list':tag_list(), 
        'title': "Edition de la playlist %s" % audio_source.title,
        'audiosource':audio_source.to_dict(with_audiofiles=True, with_tags=True), 
        'form_url': reverse('edit-audio-source', args=[audiosource_id])
    })

@staff_member_required
def create_audio_file(request):
    """
    AJAX
    POST View for creation of audio files 
    Returns a json representation of the audiofile
    """
    #TODO: Add error handling
    if request.method == 'POST':
        form = AudioFileForm(request.POST, request.FILES)
        if form.is_valid():
            audiofile = form.save()
            return JSONResponse({
                'audiofile':audiofile.to_dict(), 
                'status':'ok'
                }, mimetype=False)
        else:
            return JSONResponse(dict(form.errors.items() + [('status', 'error')]),
                                mimetype=False)

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
        to_delete_tags = [val for key, val in request.POST.items()
                          if key.startswith('to_delete_tag')]

        remaining_dict = dict([(k, v) for k, v in request.POST.items()
                               if not key.startswith('to_delete_tag')])

        form = EditAudioFileForm(remaining_dict)
        
        if form.is_valid():
            artist = form.cleaned_data['artist']
            title = form.cleaned_data['title']

            if artist != audiofile.artist or title != audiofile.title:
                audiofile.title = title
                audiofile.artist = artist
                audiofile.save_and_update_file()

            add_tags_to_model(form.cleaned_data['tags'], audiofile)

            audiofile.save()
            remove_tags_from_model(audiofile, to_delete_tags)
            return JSONResponse({
                'audiofile':audiofile.to_dict(),
                'status':'ok'
            })
        else:
            return JSONResponse(dict(form.errors.items() 
                                     + [('status','errors')]))

    template = loader.get_template('audiosources/audiofile_edit_form.html')
    ctx = Context({'form':form, 'audiofile':audiofile})
    return JSONResponse({
        'html':template.render(ctx),
        'tag_list':tag_list(),
        'audiofile': audiofile.to_dict(with_tags=True),
        'artist_list':[a.name for a in Artist.objects.all()]
    })


def tags_list(request, audiomodel_klass):
    tags = Tag.objects.extra(where=[
        """
        id IN (SELECT tag_id 
               FROM audiosources_audiomodel_tags 
               WHERE audiomodel_id IN (SELECT audiomodel_ptr_id 
                                       FROM audiosources_%s))
        """ % ('audiofile' if audiomodel_klass == AudioFile else 'audiosource')
    ])
    categories = {}
    for tag in tags:
        try:
            categories[tag.category.name].append(tag)
        except KeyError:
            categories[tag.category.name] = [tag]

    return direct_to_template(request, 
                              'audiosources/tags_list.html',
                              extra_context={'categories':categories})
