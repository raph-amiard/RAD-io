from django.contrib import admin
from django import forms
from django.contrib.auth.models import User

from rzz.news.models import NewsPost, Comment

class NewsPostForm(forms.ModelForm):
	content = forms.CharField(widget=forms.Textarea)
	class Meta:
		model = NewsPost

class NewsPostAdmin(admin.ModelAdmin):
	form = NewsPostForm
	list_display = ('title', 'poster')
	fields = ['title','content']

	def save_model(self, request, obj, form, change):
		instance = form.save(commit=False)
		if not hasattr(instance, 'poster'):
			instance.poster = request.user
			instance.save()
		else:
			instance.editor = request.user
			instance.save()
		return instance
	
admin.site.register(NewsPost, NewsPostAdmin)
admin.site.register(Comment)
