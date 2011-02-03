def dict_union(*args, **kwargs):
    d = {}
    for arg in args:
        d.update(arg)
    for key, val in kwargs.items():
        d[key] = val
    return d

def dict_revert(d):
    return dict([(val, key) for key, val in d.items()])
