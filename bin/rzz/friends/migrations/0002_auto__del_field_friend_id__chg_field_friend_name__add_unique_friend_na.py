# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):
    
    def forwards(self, orm):
        
        # Deleting field 'Friend.id'
        db.delete_column('friends_friend', 'id')

        # Changing field 'Friend.name'
        db.alter_column('friends_friend', 'name', self.gf('django.db.models.fields.CharField')(max_length=200, primary_key=True))

        # Adding unique constraint on 'Friend', fields ['name']
        db.create_unique('friends_friend', ['name'])
    
    
    def backwards(self, orm):
        
        # Adding field 'Friend.id'
        db.add_column('friends_friend', 'id', self.gf('django.db.models.fields.AutoField')(default=0, primary_key=True), keep_default=False)

        # Changing field 'Friend.name'
        db.alter_column('friends_friend', 'name', self.gf('django.db.models.fields.CharField')(max_length=200))

        # Removing unique constraint on 'Friend', fields ['name']
        db.delete_unique('friends_friend', ['name'])
    
    
    models = {
        'friends.friend': {
            'Meta': {'object_name': 'Friend'},
            'description': ('django.db.models.fields.CharField', [], {'max_length': '10000'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200', 'primary_key': 'True'}),
            'picture': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'null': 'True'})
        }
    }
    
    complete_apps = ['friends']
