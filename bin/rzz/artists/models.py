from django.db import models
from django.template.defaultfilters import slugify


def artist_image_path(instance, filename):
	return 'img/artists/{0}.{1}'.format(slugify(instance.name), 
									filename.split('.')[-1])


class Artist(models.Model):

	name = models.CharField('Artist name', max_length=200)
	biography = models.CharField('Artist biography', max_length=10000)
	picture = models.ImageField(upload_to=artist_image_path)

	def __unicode__(self):
		return self.name
