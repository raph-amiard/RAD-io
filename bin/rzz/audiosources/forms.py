from django import forms
from rzz.audiosources.models import AudioFile
from rzz.utils.file import get_mp3_metadata
import logging as log

class EditAudioFileForm(forms.Form):
    artist = forms.CharField(max_length=200)
    title = forms.CharField(max_length=400)
    tags = forms.CharField(max_length=300, required=False)
