from django.db.models import Q

def Q_or(**kwargs):
    q_ret = None
    for clause, value in kwargs.items():
        q_current = Q(**dict([(clause, value)]))
        q_ret = q_ret|q_current if q_ret else q_current
    return q_ret
