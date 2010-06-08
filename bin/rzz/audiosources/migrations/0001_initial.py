# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding model 'TagCategory'
        db.create_table('audiosources_tagcategory', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(unique=True, max_length=50)),
        ))
        db.send_create_signal('audiosources', ['TagCategory'])

        # Adding model 'Tag'
        db.create_table('audiosources_tag', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('category', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['audiosources.TagCategory'])),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('audiosources', ['Tag'])

        # Adding unique constraint on 'Tag', fields ['category', 'name']
        db.create_unique('audiosources_tag', ['category_id', 'name'])

        # Adding model 'AudioModel'
        db.create_table('audiosources_audiomodel', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('length', self.gf('django.db.models.fields.IntegerField')(default=0)),
        ))
        db.send_create_signal('audiosources', ['AudioModel'])

        # Adding M2M table for field tags on 'AudioModel'
        db.create_table('audiosources_audiomodel_tags', (
            ('id', models.AutoField(verbose_name='ID', primary_key=True, auto_created=True)),
            ('audiomodel', models.ForeignKey(orm['audiosources.audiomodel'], null=False)),
            ('tag', models.ForeignKey(orm['audiosources.tag'], null=False))
        ))
        db.create_unique('audiosources_audiomodel_tags', ['audiomodel_id', 'tag_id'])

        # Adding model 'AudioFile'
        db.create_table('audiosources_audiofile', (
            ('audiomodel_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['audiosources.AudioModel'], unique=True, primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=400)),
            ('artist', self.gf('django.db.models.fields.CharField')(max_length=200)),
            ('rzz_artist', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['artists.Artist'], null=True)),
            ('file', self.gf('django.db.models.fields.files.FileField')(max_length=100)),
        ))
        db.send_create_signal('audiosources', ['AudioFile'])

        # Adding model 'AudioSource'
        db.create_table('audiosources_audiosource', (
            ('audiomodel_ptr', self.gf('django.db.models.fields.related.OneToOneField')(to=orm['audiosources.AudioModel'], unique=True, primary_key=True)),
            ('title', self.gf('django.db.models.fields.CharField')(max_length=400)),
            ('rzz_artist', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['artists.Artist'], null=True)),
        ))
        db.send_create_signal('audiosources', ['AudioSource'])

        # Adding model 'SourceElement'
        db.create_table('audiosources_sourceelement', (
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('position', self.gf('django.db.models.fields.IntegerField')()),
            ('audiofile', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['audiosources.AudioFile'])),
            ('audiosource', self.gf('django.db.models.fields.related.ForeignKey')(to=orm['audiosources.AudioSource'])),
        ))
        db.send_create_signal('audiosources', ['SourceElement'])


    def backwards(self, orm):
        
        # Deleting model 'TagCategory'
        db.delete_table('audiosources_tagcategory')

        # Deleting model 'Tag'
        db.delete_table('audiosources_tag')

        # Removing unique constraint on 'Tag', fields ['category', 'name']
        db.delete_unique('audiosources_tag', ['category_id', 'name'])

        # Deleting model 'AudioModel'
        db.delete_table('audiosources_audiomodel')

        # Removing M2M table for field tags on 'AudioModel'
        db.delete_table('audiosources_audiomodel_tags')

        # Deleting model 'AudioFile'
        db.delete_table('audiosources_audiofile')

        # Deleting model 'AudioSource'
        db.delete_table('audiosources_audiosource')

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
            'Meta': {'object_name': 'AudioFile', '_ormbases': ['audiosources.AudioModel']},
            'artist': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'audiomodel_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['audiosources.AudioModel']", 'unique': 'True', 'primary_key': 'True'}),
            'file': ('django.db.models.fields.files.FileField', [], {'max_length': '100'}),
            'rzz_artist': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['artists.Artist']", 'null': 'True'}),
            'title': ('django.db.models.fields.CharField', [], {'max_length': '400'})
        },
        'audiosources.audiomodel': {
            'Meta': {'object_name': 'AudioModel'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'length': ('django.db.models.fields.IntegerField', [], {'default': '0'}),
            'tags': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['audiosources.Tag']", 'symmetrical': 'False'})
        },
        'audiosources.audiosource': {
            'Meta': {'object_name': 'AudioSource', '_ormbases': ['audiosources.AudioModel']},
            'audio_files': ('django.db.models.fields.related.ManyToManyField', [], {'to': "orm['audiosources.AudioFile']", 'through': "orm['audiosources.SourceElement']", 'symmetrical': 'False'}),
            'audiomodel_ptr': ('django.db.models.fields.related.OneToOneField', [], {'to': "orm['audiosources.AudioModel']", 'unique': 'True', 'primary_key': 'True'}),
            'rzz_artist': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['artists.Artist']", 'null': 'True'}),
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
            'Meta': {'unique_together': "(('category', 'name'),)", 'object_name': 'Tag'},
            'category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['audiosources.TagCategory']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'audiosources.tagcategory': {
            'Meta': {'object_name': 'TagCategory'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'unique': 'True', 'max_length': '50'})
        }
    }

    complete_apps = ['audiosources']
