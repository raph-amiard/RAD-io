from django.db import models
from rzz.audiosources.models import AudioFile, PlanningElement
from rzz.playlist.manager import PlaylistElementManager

class PlaylistElement(models.Model):
    objects = PlaylistElementManager()
    audiofile = models.ForeignKey(AudioFile)
    planning_element = models.ForeignKey(PlanningElement)
    on_air = models.DateTimeField(auto_now=True)
