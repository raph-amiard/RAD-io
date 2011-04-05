from django.conf.urls.defaults import *
from django.views.generic.simple import direct_to_template

urlpatterns = patterns('',
    url(r'^tinymce_setup.js$', direct_to_template, {'template':'js/tinymce_setup.js'}, name="tinymce-setup"),
)
