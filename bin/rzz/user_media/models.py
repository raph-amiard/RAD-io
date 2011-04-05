from django.db import models
from django.contrib.auth.models import User
from rzz.utils.file import first_available_filename
from rzz.utils.str import sanitize_filename

def media_file_name(instance, filename):
    return "usermedia/" + first_available_filename(sanitize_filename(filename))

class UserMedia(models.Model):
    """
    an user uploaded media
    """
    media = models.FileField(upload_to=media_file_name, max_length=300)
    user = models.ForeignKey(User, related_name='user_media_set')

    def __unicode__(self):
        return self.media.name
