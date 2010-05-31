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
            ('name', self.gf('django.db.models.fields.CharField')(max_length=50)),
        ))
        db.send_create_signal('audiosources', ['TagCategory'])

        # Deleting field 'Tag.isgenre'
        db.delete_column('audiosources_tag', 'isgenre')

        # Adding field 'Tag.category'
        db.add_column('audiosources_tag', 'category', self.gf('django.db.models.fields.related.ForeignKey')(default=0, to=orm['audiosources.TagCategory']), keep_default=False)


    def backwards(self, orm):
        
        # Deleting model 'TagCategory'
        db.delete_table('audiosources_tagcategory')

        # Adding field 'Tag.isgenre'
        db.add_column('audiosources_tag', 'isgenre', self.gf('django.db.models.fields.BooleanField')(default=False, blank=True), keep_default=False)

        # Deleting field 'Tag.category'
        db.delete_column('audiosources_tag', 'category_id')


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
            'category': ('django.db.models.fields.related.ForeignKey', [], {'to': "orm['audiosources.TagCategory']"}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        },
        'audiosources.tagcategory': {
            'Meta': {'object_name': 'TagCategory'},
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '50'})
        }
    }

    complete_apps = ['audiosources']
