from django.core.cache import cache
from django.http import HttpResponse, HttpResponseServerError, HttpResponseBadRequest 
from django.views.generic.simple import direct_to_template
from django.forms.fields import FileField
import json
import logging as log

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
