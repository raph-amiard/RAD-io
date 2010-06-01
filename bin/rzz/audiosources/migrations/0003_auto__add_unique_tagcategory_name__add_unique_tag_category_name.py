# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):

    def forwards(self, orm):
        
        # Adding unique constraint on 'TagCategory', fields ['name']
        db.create_unique('audiosources_tagcategory', ['name'])

        # Adding unique constraint on 'Tag', fields ['category', 'name']
        db.create_unique('audiosources_tag', ['category_id', 'name'])


    def backwards(self, orm):
        
        # Removing unique constraint on 'TagCategory', fields ['name']
        db.delete_unique('audiosources_tagcategory', ['name'])

        # Removing unique constraint on 'Tag', fields ['category', 'name']
        db.delete_unique('audiosources_tag', ['category_id', 'name'])


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
