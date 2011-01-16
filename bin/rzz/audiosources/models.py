from os import path

from django.db import models, transaction
from django.db.models.signals import post_save
from django.core.cache import cache
from django.core.urlresolvers import reverse

from rzz.utils.str import sanitize_filename, sanitize_filestring
from rzz.utils.file import move_field_file, set_mp3_metadata, first_available_filename
from rzz.utils.jsonutils import instance_to_dict
from rzz.utils.collections import dict_union
from rzz.audiosources.utils import append_to_key
from rzz.audiosources.manager import PlanningManager
from rzz.artists.models import Artist

def tag_list():
    # TODO: Cache this shit
    output = []
    for cat in TagCategory.objects.all():
        output += [u'{0}:{1}'.format(cat.name, tag.name)
                   for tag in cat.tag_set.all()]
    return output


def audio_file_name(instance, filename):

    ext = filename.split('.')[-1]
    if instance.title or instance.artist:
        artist = sanitize_filestring(instance.artist if instance.artist else 'unknown_artist')
        title = sanitize_filestring(instance.title if instance.title else 'unknown_title')
        filename = 'audiofiles/{0}-{1}.{2}'.format(artist, title,ext)
    else:
        filename = 'audiofiles/{0}'.format(sanitize_filename(filename))

    return first_available_filename(filename)


class TagCategory(models.Model):
    name = models.CharField('Categorie', max_length=50, unique=True)

    def __unicode__(self):
        return self.name


class Tag(models.Model):
    category = models.ForeignKey(TagCategory)
    name = models.CharField('Tag', max_length=50)

    def __unicode__(self):
        return self.name
    class Meta:
        unique_together = ("category", "name")


class TaggedModel(models.Model):
    tags = models.ManyToManyField(Tag)

    def tags_by_category(self):
        output = {}
        for tag in self.tags.all():
            append_to_key(output, tag.category.name, instance_to_dict(tag))
        return output

    def to_dict(self, with_tags=False, **kwargs):
        d = instance_to_dict(self)
        if with_tags:
            d.update({'tags_by_category': self.tags_by_category()})
        return d

    def autocomplete_list(self):
        output = []
        for category,tags in self.tags_by_category().items():
            output += ['{0}:{1}'.format(category, tag.name) for tag in tags]
        return output


class AudioModel(TaggedModel):
    length = models.IntegerField(default=0)

    def formatted_length(self):
        hours = self.length / 3600
        minutes = (self.length % 3600) / 60
        seconds = (self.length % 60)
        output = '{0:0>2}:{1:0>2}'.format(minutes, seconds)
        output = '{0:0>2}:'.format(hours) + output if hours else output
        return output


class AudioFile(AudioModel):

    title = models.CharField('Audiofile title', max_length=400)
    artist = models.CharField('Audiofile artist', max_length=200)
    rzz_artist = models.ForeignKey(Artist, null=True)
    file = models.FileField(upload_to=audio_file_name, max_length=300)
    original_filename = models.CharField('Original File Name', max_length=250, null=True)

    def __unicode__(self):
        return u'%s - %s' % (self.artist, self.title)

    def form_url(self):
        return reverse('audio-file-edit',args=[self.id])

    def save_and_update_file(self):
        self.save()
        self.update_file()

    def update_file(self):
        set_mp3_metadata(self.file.path, self.artist, self.title)
        move_field_file(self.file,
                          audio_file_name(self,
                                          path.split(self.file.name)[1]))

    def to_dict(self, **kwargs):
        d = super(AudioFile, self).to_dict(**kwargs)
        d.update({'form_url':self.form_url(),
                  'file_url':self.file.url})
        return d


class AudioSource(AudioModel):
    title = models.CharField('AudioSource title', max_length=400)
    rzz_artist = models.ForeignKey(Artist, null=True)
    audio_files = models.ManyToManyField(AudioFile, through='SourceElement')

    def __unicode__(self):
        return self.title

    def form_url(self):
        return reverse('edit-audio-source',args=[self.id])

    def to_dict(self, with_audiofiles=False, **kwargs):
        d = super(AudioSource, self).to_dict(**kwargs)
        d.update({'form_url':self.form_url()})
        if with_audiofiles:
            d.update({'sorted_audiofiles':self.sorted_audiofiles_dict()})
        return d

    def sorted_audiofiles(self):
        return [s.audiofile for s in self.sourceelement_set.order_by('position')]

    def sorted_audiofiles_dict(self):
        return [dict_union(s.audiofile.to_dict(), source_element_id=s.id)
                for s in self.sourceelement_set.order_by('position')]


class SourceElement(models.Model):
    position = models.IntegerField()
    audiofile = models.ForeignKey(AudioFile)
    audiosource = models.ForeignKey(AudioSource)

class Planning(TaggedModel):
    name = models.CharField('Name of the planning', max_length=100)
    planning_elements = models.ManyToManyField(AudioSource, through='PlanningElement')
    active = models.BooleanField()
    objects = PlanningManager()

    def set_active(self):
        self._default_manager.all().update(active=False)
        self.active = True
        self.save()

    def form_url(self):
        return reverse('edit-planning',args=[self.id])

    def to_dict(self, **kwargs):
        d = super(Planning, self).to_dict(**kwargs)
        d.update({'form_url':self.form_url()})
        return d

    @transaction.commit_on_success()
    def add_elements(self, elements):
        from datetime import time as Time

        for element in elements:
            time_start = element["time_start"]
            type = element["type"]
            planning_element = PlanningElement(
                planning = self,
                type = 'single',
                time_start = Time(time_start["hour"], time_start["minute"]),
                day = element["day"],
                random = False
            )
            planning_element.source_id = element["audiosource_id"]

            if type in ["continuous", "jingle"]:
                time_end = element["time_end"]

                if time_end["hour"] == 24:
                    planning_element.time_end = Time(23, 59)
                else:
                    planning_element.time_end = Time(time_end["hour"], time_end["minute"])

                planning_element.random = True
                planning_element.type = type

            planning_element.save()


class PlanningElement(models.Model):

    TYPES = (
        ('single', 'single'),
        ('continuous', 'continuous'),
        ('jingle', 'jingle')
    )

    planning = models.ForeignKey(Planning)
    source = models.ForeignKey(AudioSource)
    type = models.CharField(choices=TYPES, max_length=10)
    time_start = models.TimeField()
    time_end = models.TimeField(null=True)
    day = models.IntegerField()
    random = models.BooleanField()

    def to_dict(self, with_tags=False, **kwargs):
        d = instance_to_dict(self)
        d.pop('source_id')
        d['audiosource'] = self.source.to_dict()
        return d

def planning_changed_handler(sender, **kwargs):
    cache.set('planning_change', True)

post_save.connect(planning_changed_handler, sender=Planning)
