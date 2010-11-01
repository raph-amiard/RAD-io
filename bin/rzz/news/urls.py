from django.conf.urls.defaults import *
from rzz.news import views

urlpatterns = patterns('',
    url(r'^list/$', views.news_posts_list, {'page':1}),
    url(r'^list/(?P<page>\d+)$', views.news_posts_list, name="news-post-list"),
    url(r'^detail/(?P<news_post_id>\d+)$', views.news_post_detail, name="news-post-detail")
)
