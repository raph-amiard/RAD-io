from django.views.generic.list_detail import object_list, object_detail
from rzz.news.models import NewsPost

def news_posts_list(request, page):
    return object_list(request, 
        queryset = NewsPost.objects.all().order_by('-date_created'),
        paginate_by = 20,
        page = page,
        template_name="news/news_post_list.html",
        template_object_name="news_post"
    )

def news_post_detail(request, news_post_id):
    return object_detail(request, 
        queryset = NewsPost.objects.all(),
        object_id = news_post_id,
        template_name="news/news_post_detail.html",
        template_object_name="news_post"
        )
