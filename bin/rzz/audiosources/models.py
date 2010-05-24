from django.db import models
from rzz.utils.str import sanitize_filename, sanitize_filestring
from rzz.artists.models import Artist

def audio_file_name(instance, filename):
	ext = filename.split('.')[-1]
	if instance.title or instance.artist:
		artist = sanitize_filestring(instance.artist if instance.artist else 'unknown_artist')
		title = sanitize_filestring(instance.title if instance.title else 'unknown_title')
		return 'audiofiles/{0}-{1}.{2}'.format(artist, title,ext)
	else:
		return 'audiofiles/{0}'.format(sanitize_filename(filename))

class AudioModel(models.Model):
	length = models.IntegerField()

	def formatted_length(self):
		hours = self.length / 3600
		minutes = (self.length % 3600) / 60
		seconds = (self.length % 60)
		output = '{0}:{1}'.format(minutes, seconds)
		output = '{0}:'.format(hours) + (output if hours else '')
		return output

	class Meta:
		abstract = True

class AudioFile(AudioModel):
	title = models.CharField('Audiofile title :', max_length=400)
	artist = models.CharField('Audiofile artist :', max_length=200)
	rzz_artist = models.ForeignKey(Artist, null=True)
	file = models.FileField(upload_to=audio_file_name)

class AudioSource(AudioModel):
	title = models.CharField('AudioSource title :', max_length=400)
	rzz_artist = models.ForeignKey(Artist, null=True)
	audio_files = models.ManyToManyField(AudioFile, through='SourceElement')

class SourceElement(models.Model):
	position = models.IntegerField()
	audiofile = models.ForeignKey(AudioFile)
	audiosource = models.ForeignKey(AudioSource)
