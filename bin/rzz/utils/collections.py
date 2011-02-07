def dict_union(*args, **kwargs):
    d = {}
    for arg in args:
        d.update(arg)
    for key, val in kwargs.items():
        d[key] = val
    return d

def dict_revert(d):
    return dict([(val, key) for key, val in d.items()])

def dict_transform(tdict, mappings):
    """
    """
    ndict = {}

    for key, val in mappings.items():
        if type(val) is tuple:
            out_key, func = val
        else:
            func = val if val else lambda x: x
            out_key = key

        ndict[out_key] = func(tdict.get(key, None))

    return ndict

