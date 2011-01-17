def radio_settings(request):
    from django.conf import settings
    return {
        'radio_short_name': settings.RADIO_SHORT_NAME,
        'radio_long_name': settings.RADIO_LONG_NAME
    }
