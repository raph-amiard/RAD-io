# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):
    
    def forwards(self, orm):
        
        # Deleting field 'Artist.id'
        db.delete_column('artists_artist', 'id')

        # Changing field 'Artist.name'
        db.alter_column('artists_artist', 'name', self.gf('django.db.models.fields.CharField')(max_length=200, primary_key=True))

        # Adding unique constraint on 'Artist', fields ['name']
        db.create_unique('artists_artist', ['name'])
    
    
    def backwards(self, orm):
        
        # Adding field 'Artist.id'
        db.add_column('artists_artist', 'id', self.gf('django.db.models.fields.AutoField')(default=0, primary_key=True), keep_default=False)

        # Changing field 'Artist.name'
        db.alter_column('artists_artist', 'name', self.gf('django.db.models.fields.CharField')(max_length=200))

        # Removing unique constraint on 'Artist', fields ['name']
        db.delete_unique('artists_artist', ['name'])
    
    
    models = {
        'artists.artist': {
            'Meta': {'object_name': 'Artist'},
            'biography': ('django.db.models.fields.CharField', [], {'max_length': '10000'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200', 'primary_key': 'True'}),
            'picture': ('django.db.models.fields.files.ImageField', [], {'max_length': '100'})
        }
    }
    
    complete_apps = ['artists']
