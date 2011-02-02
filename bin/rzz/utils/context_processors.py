from rzz import radio_settings as r_settings

def radio_settings(request):
    d = {}
    print dir(r_settings)
    for key in dir(r_settings):
        if not key.startswith("__"):
            d[key.lower()] = getattr(r_settings, key)

    return d
