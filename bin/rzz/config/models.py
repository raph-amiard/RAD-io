from django.db import models

class ConfigProperty(models.Model):
    name = models.CharField('Name', max_length=50, unique=True)
    value = models.CharField('Value', max_length=500)
