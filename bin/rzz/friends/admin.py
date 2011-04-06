from django.contrib import admin
from django import forms

from rzz.friends.models import Friend

class FriendForm(forms.ModelForm):
	description = forms.CharField(widget=forms.Textarea)

class FriendAdmin(admin.ModelAdmin):
    class Media:
        js = (
            'tinymce/jscripts/tiny_mce/tiny_mce.js',
            '/templatejs/tinymce_setup.js'
        )
    form = FriendForm

admin.site.register(Friend, FriendAdmin)
