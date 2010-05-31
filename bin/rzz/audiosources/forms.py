from django import forms
from rzz.audiosources.models import AudioFile
from rzz.utils.file import get_mp3_metadata
import logging as log

class AudioFileForm(forms.ModelForm):
    def clean(self):
        """
        """
        af = self.instance
        path = self.files['file'].temporary_file_path()
        af.artist, af.title, af.length = get_mp3_metadata(path)
        af.save()
        return self.cleaned_data
    
    class Meta:
        model = AudioFile
        fields = ['file']
        
class EditAudioFileForm(forms.Form):
    artist = forms.CharField(max_length=200)
    title = forms.CharField(max_length=400)
    tags = forms.CharField(max_length=300, required=False)
