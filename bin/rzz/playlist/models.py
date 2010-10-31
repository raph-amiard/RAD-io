from django.db import models
from rzz.audiosources.models import AudioFile, AudioSource
from rzz.playlist.manager import PlaylistElementManager

class PlaylistElement(models.Model):
    objects = PlaylistElementManager()
    audiofile = models.ForeignKey(AudioFile)
    audiosource = models.ForeignKey(AudioSource)
    on_air = models.DateTimeField(auto_now=True)
