import json
import datetime

from django.db import models
from django.db.models.fields.files import FieldFile
from django.http import HttpResponse

def serialize(element):
    if type(element) == datetime.time:
        return {'minute':element.minute,'hour':element.hour}
    else:
        return element

def instance_to_dict(instance, *args, **kwargs):
    fields = [f.attname for f in instance._meta._fields()]
    return dict([(f, serialize(instance.__dict__[f]))
                 for f in fields
                 if type(instance.__dict__[f]) != FieldFile] + kwargs.items())

def instance_to_json(instance, *args, **kwargs):
    """
    Takes a model instance and returns the corresponding json object
    """
    return json.dumps(instance_to_dict(instance, *args, **kwargs))

def JSONResponse(dict, mimetype=True):
    """
    Encapsulates the common JSON HttpResponse pattern
    The mimetype arg is used to fix a dirty bug when using firefox with json.form
    where if the content is json, firefox will try to open the said content as a file
    """
    return HttpResponse(json.dumps(dict), mimetype="application/json" if mimetype else None)
