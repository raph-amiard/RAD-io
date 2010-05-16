from django.contrib import admin
from django import forms

from rzz.friends.models import Friend

class FriendForm(forms.ModelForm):
	description = forms.CharField(widget=forms.Textarea)

class FriendAdmin(admin.ModelAdmin):
	form = FriendForm

admin.site.register(Friend, FriendAdmin)
