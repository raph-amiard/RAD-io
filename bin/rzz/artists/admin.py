"""
Simple customizations of the admin for the artist application
"""
from django.contrib import admin
from django import forms

from rzz.artists.models import Artist

class ArtistForm(forms.ModelForm):
    """
    Use a textarea for the artist biography
    """
    biography = forms.CharField(widget=forms.Textarea)

class ArtistAdmin(admin.ModelAdmin):
    """
    Use the custom ArtistForm for artist edition
    """
    form = ArtistForm

admin.site.register(Artist, ArtistAdmin)
