from django.contrib import admin
from django import forms
from django.contrib.auth.models import User

from rzz.user_media.models import UserMedia

class UserMediaAdmin(admin.ModelAdmin):

    fields = ['media']

    def save_model(self, request, obj, form, change):
        instance = form.save(commit=False)

        if not hasattr(instance, 'user'):
            instance.user = request.user
            instance.save()

        return instance


admin.site.register(UserMedia, UserMediaAdmin)
