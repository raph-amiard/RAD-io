import re
from time import sleep
from urllib import urlopen
from datetime import datetime

from django.core.management.base import BaseCommand
from django.conf import settings

from radio_client.models import RadioStats

RADIO_URL = "http://"+settings.RADIO_HOST

def get_nb_listeners():
    html = urlopen(RADIO_URL).read()
    return int(re.findall("\d+", html.split("Current")[1])[0])

class Command(BaseCommand):

    def handle(self, *args, **options):
        while True:
            nbl = get_nb_listeners()
            d = datetime.now()
            print d.strftime("[%d/%m/%Y %H:%M] - record stats : {0} listeners").format(nbl)
            RadioStats(when=d, listeners=nbl).save()
            sleep(60 * 60)
