# Create your views here.

from django.views.generic.list_detail import object_list, object_detail
from rzz.friends.models import Friend

def friends_list(request, page):
    return object_list(request,
        queryset = Friend.objects.order_by("-priority"),
        paginate_by = 20,
        page = page,
        template_object_name="friend"
    )

def friend_detail(request, friend_id):
    return object_detail(request,
        queryset = Friend.objects.all(),
        object_id = friend_id,
        template_object_name="friend"
        )
