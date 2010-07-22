import json
import logging as log

from django.core.cache import cache
from django.shortcuts import get_object_or_404
from django.http import HttpResponse, HttpResponseServerError, HttpResponseBadRequest 
from django.views.generic.simple import direct_to_template
from django.forms.fields import FileField

from rzz.utils.jsonutils import JSONResponse, instance_to_dict

def upload_progress(request):
    """
    Return JSON object with information about the progress of an upload.
    """
    progress_id = None
    if 'X-Progress-ID' in request.GET:
        progress_id = request.GET['X-Progress-ID']
    elif 'X-Progress-ID' in request.META:
        progress_id = request.META['X-Progress-ID']
    if progress_id:
        cache_key = "%s_%s" % (request.META['REMOTE_ADDR'], progress_id)
        data = cache.get(cache_key)
        jsn = json.dumps(data)
        return HttpResponse(jsn)
    else:
        return HttpResponseBadRequest('Server Error: You must provide X-Progress-ID header or query param.')

def delete_model_JSON(request,model_klass, model_id):
    """
    Generic JSON view for model deletion.
    Returns a status indicator and the model JSONized.
    """
    model = get_object_or_404(model_klass, pk=model_id)
    model_dump = instance_to_dict(model)
    model.delete()
    return JSONResponse({'status': 'ok', 'object': model_dump})
