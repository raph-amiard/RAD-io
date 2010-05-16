# encoding: utf-8
import datetime
from south.db import db
from south.v2 import SchemaMigration
from django.db import models

class Migration(SchemaMigration):
    
    def forwards(self, orm):
        
        # Adding model 'Friend'
        db.create_table('friends_friend', (
            ('picture', self.gf('django.db.models.fields.files.ImageField')(max_length=100, null=True)),
            ('description', self.gf('django.db.models.fields.CharField')(max_length=10000)),
            ('id', self.gf('django.db.models.fields.AutoField')(primary_key=True)),
            ('name', self.gf('django.db.models.fields.CharField')(max_length=200)),
        ))
        db.send_create_signal('friends', ['Friend'])
    
    
    def backwards(self, orm):
        
        # Deleting model 'Friend'
        db.delete_table('friends_friend')
    
    
    models = {
        'friends.friend': {
            'Meta': {'object_name': 'Friend'},
            'description': ('django.db.models.fields.CharField', [], {'max_length': '10000'}),
            'id': ('django.db.models.fields.AutoField', [], {'primary_key': 'True'}),
            'name': ('django.db.models.fields.CharField', [], {'max_length': '200'}),
            'picture': ('django.db.models.fields.files.ImageField', [], {'max_length': '100', 'null': 'True'})
        }
    }
    
    complete_apps = ['friends']
