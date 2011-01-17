def radio_settings(request):
    from django.conf import settings
    return {
        'radio_short_name': settings.RADIO_SHORT_NAME,
        'radio_long_name': settings.RADIO_LONG_NAME,
        'is_friend_app_activated': settings.IS_FRIENDS_APP_ACTIVATED,
        'is_artists_app_activated': settings.IS_ARTISTS_APP_ACTIVATED,
        'artists_app_menu_name': settings.ARTISTS_APP_MENU_NAME,
        'friends_app_menu_name': settings.FRIENDS_APP_MENU_NAME,
    }
