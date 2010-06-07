import json
from django.db import models
from django.db.models.fields.files import FieldFile

def instance_to_dict(instance, *args, **kwargs):
    fields = [f.attname for f in instance._meta._fields()]
    return dict([(f, instance.__dict__[f]) for f in fields] + kwargs.items())

def instance_to_json(instance, *args, **kwargs):
    """
    Takes a model instance and returns the corresponding json object
    """
    d = instance_to_dict(instance, *args, **kwargs)
    d = dict([pair for pair in d.items() if type(pair[1]) != FieldFile])
    return json.dumps(d)
