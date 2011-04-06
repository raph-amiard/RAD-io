from django.db import models

def friend_image_path(instance, filename):
    return 'img/friends/{0}.{1}'.format(instance.name,
									filename.split('.')[-1])

class Friend(models.Model):

    name = models.CharField('Friend name', max_length=200)
    url = models.URLField(verify_exists=False, max_length=300)
    description = models.CharField('Artist biography', max_length=10000)
    picture = models.ImageField(upload_to=friend_image_path, null=True,blank=True)

    def __unicode__(self):
        return self.name
