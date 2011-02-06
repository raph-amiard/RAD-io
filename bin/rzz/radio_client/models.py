from django.db import models
from audiosources.models import Planning

class RadioStats(models.Model):
    """
    Represents the number of listeners at a given point in time
    """
    when = models.DateTimeField()
    listeners = models.IntegerField()

class PlanningStartEvent(models.Model):
    """
    Represents the triggering of a planning as the active planning at a certain point in time
    """
    when = models.DateTimeField()
    planning = models.ForeignKey(Planning)
