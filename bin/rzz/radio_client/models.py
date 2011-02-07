from django.db import models

class RadioStats(models.Model):
    """
    Represents the number of listeners at a given point in time
    """
    when = models.DateTimeField()
    listeners = models.IntegerField()
