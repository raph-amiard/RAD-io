from django.views.generic.simple import direct_to_template
from django.contrib.auth.decorators import login_required

@login_required
def admin_root(request):
    return direct_to_template(request, 'admin_root.html')
