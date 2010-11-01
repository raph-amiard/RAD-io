import os
import sys

sys.path.append('/home/raph/Projects/rzz_website_new/bin')
os.environ['DJANGO_SETTINGS_MODULE']= 'rzz.settings'

import django.core.handlers.wsgi

application = django.core.handlers.wsgi.WSGIHandler()
