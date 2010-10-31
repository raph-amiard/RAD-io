from django.db import models


class PlaylistElementManager(models.Manager):

    def last_on_air(self):
        return self.order_by('-on_air')[0]
