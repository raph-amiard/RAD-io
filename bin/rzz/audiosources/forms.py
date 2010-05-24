import eyeD3
import shutil, os
from django import forms
from rzz.audiosources.models import AudioFile

class AudioFileForm(forms.ModelForm):
	
	def save(self, force_insert=False, force_update=False, commit=True):
		"""
		"""
		audiofile = self.instance

		tmp_path = self.files['file'].temporary_file_path()
		tmp_path_2 = '{0}{1}'.format(''.join(tmp_path.split('.')[:-1]), '.mp3')
		shutil.copy(tmp_path, tmp_path_2)

		mp3_file = eyeD3.Mp3AudioFile(tmp_path_2)
		tag = mp3_file.getTag()
		audiofile.title = tag.getTitle()
		audiofile.artist = tag.getArtist()
		audiofile.length = mp3_file.getPlayTime()
		
		os.remove(tmp_path_2)
		audiofile = super(AudioFileForm, self).save(commit=False)

		if commit:
			audiofile.save()
		return audiofile

	class Meta:
		model = AudioFile
		fields = ['file']
