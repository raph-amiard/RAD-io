from django.contrib import admin
from django import forms

from rzz.artists.models import Artist

class ArtistForm(forms.ModelForm):
	biography = forms.CharField(widget=forms.Textarea)	

class ArtistAdmin(admin.ModelAdmin):
	form = ArtistForm

admin.site.register(Artist, ArtistAdmin)
