import json
from django.db import models
from django.db.models.fields.files import FieldFile

def instance_to_dict(instance, *args, **kwargs):
    fields = [f.attname for f in instance._meta._fields()]
    return dict([(f, instance.__dict__[f]) 
              for f in fields 
              if type(instance.__dict__[f]) != FieldFile] + kwargs.items())

def instance_to_json(instance, *args, **kwargs):
    """
    Takes a model instance and returns the corresponding json object
    """
    return json.dumps(instance_to_dict(instance, *args, **kwargs))
