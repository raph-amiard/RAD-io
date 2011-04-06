from django.views.generic.simple import direct_to_template
from django.http import HttpResponse

from rzz.utils.jsonutils import JSONResponse
from models import UserMedia

def add_user_media(request):

    if request.method == 'POST':
        print request.POST
        user_media = UserMedia(
            media=request.FILES["file"],
            user=request.user
        )
        user_media.save()
        return JSONResponse({'url':user_media.media.url, 'success':True}, mimetype=False)

    return direct_to_template(request, 'user_media/add.html')
