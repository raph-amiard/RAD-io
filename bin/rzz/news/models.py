from django.db import models
from django.contrib.auth.models import User

class NewsPost(models.Model):
	"""
	a public news post
	"""
	title = models.CharField('NewsPost''s title' , max_length=200)
	content = models.CharField('NewsPost''s content', max_length=10000)
	date_created = models.DateTimeField(auto_now_add=True)
	date_modified = models.DateTimeField(auto_now=True)
	poster = models.ForeignKey(User, related_name='created_newspost_set')
	editor = models.ForeignKey(User, null=True,related_name='modified_newspost_set')

	def __unicode__(self):
		return self.title

class Comment(models.Model):
	"""
	a NewsPost's comment
	"""
	poster_name = models.CharField('Name of the commenter', max_length=30)
	content = models.CharField('Content of the comment', max_length=300)
	date_created = models.DateTimeField(auto_now=True)
	news_post = models.ForeignKey(NewsPost)
