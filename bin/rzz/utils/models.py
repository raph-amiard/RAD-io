from django.db import models
import json

def instance_to_json(instance, *args, **kwargs):
    """
    Takes a model instance and returns the corresponding json object
    """
    def instance_to_dict(i):
        fields = [f.attname for f in instance._meta._fields()]
        return dict([(f, instance.__dict__[f]) for f in fields] + kwargs.items())

    return json.dumps(instance_to_dict(instance))
