from mutagen.easyid3 import EasyID3
from mutagen.mp3 import MP3
from django import forms
from rzz.audiosources.models import AudioFile
import logging as log

class AudioFileForm(forms.ModelForm):
    def clean(self):
        """
        """
        audiofile = self.instance
        tmp_path = self.files['file'].temporary_file_path()
        
        mp3 = MP3(tmp_path, ID3=EasyID3)
        audiofile.length = int(mp3.info.length)
        audiofile.title = u' '.join(mp3['title']) if 'title' in mp3 else ''
        audiofile.artist = u' '.join(mp3['artist']) if 'artist' in mp3 else ''
        return self.cleaned_data
    
    class Meta:
        model = AudioFile
        fields = ['file']
        
class EditAudioFileForm(forms.Form):
    artist = forms.CharField(max_length=200)
    title = forms.CharField(max_length=400)
    tags = forms.CharField(max_length=300)
