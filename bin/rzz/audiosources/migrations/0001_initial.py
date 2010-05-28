# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'Tag'
        db.create_table('audiosources_tag', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
            ('isgenre', self.gf('django.db.models.fields.BooleanField')(default=False, blank=True)),
        ))
        db.send_create_signal('audiosources', ['Tag'])

        # Adding model 'AudioFile'
        db.create_table('audiosources_audiofile', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('length', self.gf('django.db.models.fields.IntegerField')()),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=400)),
            ('artist', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('rzz_artist', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['artists.Artist'], null=True)),
            ('file', self.gf('django.db.models.fields.files.FileField')(max_length=100)),
        ))
        db.send_create_signal('audiosources', ['AudioFile'])

        # Adding M2M table for field tags on 'AudioFile'
        db.create_table('audiosources_audiofile_tags', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('audiofile', models.ForeignKey(orm['audiosources.audiofile'], null=False)),
            ('tag', models.ForeignKey(orm['audiosources.tag'], null=False))
        ))
        db.create_unique('audiosources_audiofile_tags', ['audiofile_id', 'tag_id'])

        # Adding model 'AudioSource'
        db.create_table('audiosources_audiosource', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('length', self.gf('django.db.models.fields.IntegerField')()),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=400)),
            ('rzz_artist', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['artists.Artist'], null=True)),
        ))
        db.send_create_signal('audiosources', ['AudioSource'])

        # Adding M2M table for field tags on 'AudioSource'
        db.create_table('audiosources_audiosource_tags', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('audiosource', models.ForeignKey(orm['audiosources.audiosource'], null=False)),
            ('tag', models.ForeignKey(orm['audiosources.tag'], null=False))
        ))
        db.create_unique('audiosources_audiosource_tags', ['audiosource_id', 'tag_id'])

        # Adding model 'SourceElement'
        db.create_table('audiosources_sourceelement', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('position', self.gf('django.db.models.fields.IntegerField')()),
            ('audiofile', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['audiosources.AudioFile'])),
            ('audiosource', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['audiosources.AudioSource'])),
        ))
        db.send_create_signal('audiosources', ['SourceElement'])


    def backwards(self, orm):
        
        # Deleting model 'Tag'
        db.delete_table('audiosources_tag')

        # Deleting model 'AudioFile'
        db.delete_table('audiosources_audiofile')

        # Removing M2M table for field tags on 'AudioFile'
        db.delete_table('audiosources_audiofile_tags')

        # Deleting model 'AudioSource'
        db.delete_table('audiosources_audiosource')

        # Removing M2M table for field tags on 'AudioSource'
        db.delete_table('audiosources_audiosource_tags')

        # Deleting model 'SourceElement'
        db.delete_table('audiosources_sourceelement')


    models = {
        'artists.artist': {
            'Meta': {'object_name': 'Artist'},
            'biography': ('django.db.models.fields.CharField', [], {'max_length': '10000'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200', 'primary_key': 'True'}),
            'picture': ('django.db.models.fields.files.ImageField', [], {'max_length': '100'})
        },
        'audiosources.audiofile': {
            'Meta': {'object_name': 'AudioFile'},
            'artist': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'file': ('django.db.models.fields.files.FileField', [], {'max_length': '100'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'length': ('django.db.models.fields.IntegerField', [], {}),
            'rzz_artist': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['artists.Artist']", 'null': 'True'}),
            'tags': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['audiosources.Tag']", 'symmetrical': 'False'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '400'})
        },
        'audiosources.audiosource': {
            'Meta': {'object_name': 'AudioSource'},
            'audio_files': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['audiosources.AudioFile']", 'through': "orm['audiosources.SourceElement']", 'symmetrical': 'False'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'length': ('django.db.models.fields.IntegerField', [], {}),
            'rzz_artist': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['artists.Artist']", 'null': 'True'}),
            'tags': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['audiosources.Tag']", 'symmetrical': 'False'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '400'})
        },
        'audiosources.sourceelement': {
            'Meta': {'object_name': 'SourceElement'},
            'audiofile': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['audiosources.AudioFile']"}),
            'audiosource': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['audiosources.AudioSource']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'position': ('django.db.models.fields.IntegerField', [], {})
        },
        'audiosources.tag': {
            'Meta': {'object_name': 'Tag'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'isgenre': ('django.db.models.fields.BooleanField', [], {'default': 'False', 'blank': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        }
    }

    complete_apps = ['audiosources']
