# -*- coding: utf-8 -*-

import telnetlib
import subprocess
import logging
from time import sleep
from datetime import datetime, timedelta
from threading import Thread, Timer, Event

from django.conf import settings
from django.core.cache import cache
from django.utils.encoding import smart_unicode

from rzz.radio_client.liquidsoap_utils import create_temp_script_file, RandomAudioSourceWrapper
from rzz.audiosources.models import Planning, PlanningElement
from rzz.playlist.models import PlaylistElement
from rzz.utils.cron import CronTab, CronEvent

# TODO : Find something better than a global to handle audiofiles
audiofiles = {}

def log(strn):
    strn = u"{0} -- {1}".format(datetime.now().strftime("[%d/%m/%Y %H:%M:%S]"), smart_unicode(strn))
    print strn.encode('utf-8')

def connection():
    return telnetlib.Telnet(settings.LIQUIDSOAP_HOST, settings.LIQUIDSOAP_TELNET_PORT, 1000)

def start_radio():
    agent = LiquidsoapAgent()
    agent.start()
    sleep(1)
    scheduler = Scheduler(Planning.objects.active_planning())
    scheduler.start()
    return agent

class LiquidsoapAgent(object):
    status = "stopped"
    queues = {}

    def __init__(self):
        self.script = create_temp_script_file(settings.RADIO_MOUNT_NAME, settings.RADIO_OUTPUTS)
        self.liquidsoap_process = None

    def start(self):
        if not self.liquidsoap_process:
            self.liquidsoap_process = subprocess.Popen([settings.LIQUIDSOAP_BIN, "-t", self.script.name])
            self.status = "started"

    def stop(self):
        if self.liquidsoap_process:
            self.liquidsoap_process.kill()
            self.status = "stopped"

class CommandWrapper(object):

    def __init__(self):
        self.connection = connection()

    def make_command(self, command_str, do_log=True):

        def dprint(arg):
            if do_log:
                log(arg)

        dprint("COMMAND : \"{0}\"".format(command_str))
        self.connection.write(command_str+'\n')
        response = self.connection.read_until('END')[:-3].replace('\n', '')
        dprint("REPONSE : \"{0}\"".format(response))
        return response


class RequestCommandWrapper(CommandWrapper):

    def on_air(self):
        response = self.make_command("request.on_air", do_log=False).strip()
        if response:
            try:
                request_id = int(response.split(' ')[0])
                return request_id, audiofiles[request_id]
            except KeyError:
                return None, None
        else:
            return None, None

class PlaylistLogger(object):

    current_rid = None

    def __init__(self):
        self.request_handler = RequestCommandWrapper()

    def log(self):
        from django.db import connection,transaction
        cursor = connection.cursor()

        while True:
            rid, playlist_element = self.request_handler.on_air()

            if not(rid is None) and rid != self.current_rid and\
                    not(playlist_element["planning_element"].type == "jingle"):
                audiofile = playlist_element["audiofile"]
                audiosource = playlist_element["audiosource"]
                self.current_rid = rid

                log("Logging a file in the playlist")
                cursor.execute("""
                    INSERT INTO playlist_playlistelement
                    (audiofile_id, on_air, audiosource_id)
                    VALUES (%s, %s , %s)
                    """, [audiofile.id, datetime.now(), audiosource.id]
                )
                cursor = connection.cursor()
                transaction.commit_unless_managed()
                log("Logging done")

            sleep(0.5)

    def start(self):
        Thread(target=self.log).start()


class QueueCommandWrapper(CommandWrapper):
    queue_size = 0
    queue_list = []

    def __init__(self, queue_name):
        CommandWrapper.__init__(self)
        self.queue_name = queue_name

    def insert(self, position, uri):
        """
        Insert a source at the corresponding position into the queue
        Returns the source id
        """

        command = '{0}.insert {1} {2}'.format(self.queue_name, position, uri)
        response = self.make_command(command)
        return int(response)

    def push(self, uri):
        """
        Push a source with the corresponding uri into the queue
        Returns the source id
        """
        command = '{0}.push {1}'.format(self.queue_name, uri)
        response = self.make_command(command)
        return int(response)

    def get_queue(self):
        """
        Returns a list of the ids currently queued
        """
        response = self.make_command('{0}.queue'.format(self.queue_name))
        response = response.strip()
        return [int(t) for t in response.split(' ')] if response else []
        if not response == 'OK':
            log('There is no source with the given id')

    def get_secondary_queue(self):
        """
        Returns a list of the ids currently queued
        """
        response = self.make_command('{0}.secondary_queue'.format(self.queue_name))
        response = response.strip()
        return [int(t) for t in response.split(' ')] if response else []

    def remove(self, id):
        """
        Remove the source with given id
        """
        response = self.make_command('{0}.remove {1}'.format(self.queue_name, id))

    def flush(self):

        for track_id in self.get_secondary_queue():
            self.remove(track_id)

    def move(self, id, position):
        """
        """


class RadioQueue(QueueCommandWrapper):

    queue_list = []

    def insert(self, position, audiofile):

        log(len(self.queue_list))

        if position >= len(self.queue_list):
            log('You inserted beyond the queue size. uri appended at the end')
            return self.push(audiofile)

        id = super(RadioQueue, self).insert(position, audiofile.file.path)
        sleep(0.1)
        self.queue_list = self.get_secondary_queue()
        return id

    def push(self, audiofile):
        id = super(RadioQueue, self).push(audiofile.file.path)
        sleep(0.1)
        self.queue_list = self.get_secondary_queue()
        return id

class RadioSource(object):

    def __init__(self, queue, planning_element):
        self.queue = queue
        self.planning_element = planning_element
        self.audiosource = planning_element.source

    def refresh(self):
        self.planning_element = PlanningElement.objects.get(id=self.planning_element.id)
        self.audiosource = self.planning_element.source

    def set_active(self):
        self.refresh()
        log(self.queue.get_secondary_queue())
        self.queue.flush()

    def push_in_queue(self, audiofile):
        rid = self.queue.push(audiofile)
        audiofiles[rid] = {
            "audiofile": audiofile,
            "audiosource": self.audiosource,
            "planning_element":self.planning_element
        }


class ProgramSource(RadioSource):

    def set_active(self):
        log(u"Program source {0} set active".format(self.audiosource.title))
        super(ProgramSource, self).set_active()
        for audiofile in self.audiosource.sorted_audiofiles():
            self.push_in_queue(audiofile)


class BackSource(RadioSource):

    def set_active(self):
        log(u"Back source {0} set active".format(self.audiosource.title))
        super(BackSource, self).set_active()
        audiofiles = RandomAudioSourceWrapper(self.audiosource)
        now = datetime.now()
        time_end = self.planning_element.time_end

        while now.time() < time_end and now.weekday() == self.planning_element.day:
            audiofile = audiofiles.get_next_random_audiofile()
            self.push_in_queue(audiofile)
            now = now + timedelta(seconds=audiofile.length)


class JingleSource(RadioSource):

    CHUNK_SIZE = 10
    CALLBACK_TIME = 60

    def set_active(self):
        log(u"Jingle source {0} set active".format(self.audiosource.title))
        super(JingleSource, self).set_active()

        self.audiofiles = RandomAudioSourceWrapper(self.audiosource)
        Thread(target=self.insert_jingles).start()

    def insert_jingles(self):
        time_current = datetime.now()

        while time_current.time() < self.planning_element.time_end:
            log("INSERT JINGLES CALLBACK")
            time_current = datetime.now()

            if len(self.queue.get_secondary_queue()) <= 1:
                log("JINGLES QUEUE EMPTY")
                for i in range(0, self.CHUNK_SIZE):
                    self.push_in_queue(self.audiofiles.get_next_random_audiofile())

            sleep(self.CALLBACK_TIME)

        self.queue.flush()


class Scheduler(object):

    TYPES_TO_CLASSES = {
        "single": ProgramSource,
        "continuous": BackSource,
        "jingle": JingleSource
    }

    def __init__(self, planning):
        self.planning = planning
        self.queues = {}
        self.queues["single"] = RadioQueue(settings.LIQUIDSOAP_PROGRAM_QUEUE_NAME)
        self.queues["continuous"] = RadioQueue(settings.LIQUIDSOAP_BACK_QUEUE_NAME)
        self.queues["jingle"] = RadioQueue(settings.LIQUIDSOAP_JINGLES_QUEUE_NAME)

    def reload_cron_events(self):
        self.cron_tab.flush()
        self.create_cron_events()

    def create_cron_events(self):

        now = datetime.now()
        time_now = now.time()
        now_jingle_source = None
        now_back_source = None

        for pe in self.planning.planningelement_set.all():

            source = self.TYPES_TO_CLASSES[pe.type](self.queues[pe.type], pe)

            log(u"TREATING SOURCE {0}".format(pe.source.title))
            log(u"TYPE : {0}".format(pe.type))
            log(u"TIME_START : {0}".format(pe.time_start))

            if pe.type in ["continuous", "jingle"] \
                    and pe.time_start < time_now < pe.time_end \
                    and pe.day == now.weekday() :

                log(u"PUTTING ON PLAY NOW")
                if pe.type == "jingle":
                    now_jingle_source = source
                else:
                    now_back_source = source
            else:

                log(u"ADDING CRON JOB FOR TIME START")
                self.cron_tab.add_event(CronEvent(
                    source.set_active, min=pe.time_start.minute, hour=pe.time_start.hour, dow=pe.day))

            print "\n"

        if now_jingle_source:
            now_jingle_source.set_active()
        if now_back_source:
            now_back_source.set_active()

    def watch_planning_changes(self):
        while 1:
            log(u"WATCHING FOR PLANNING CHANGES")

            if cache.get('planning_change'):
                log(u"PLANNING CHANGED: RELOADING ELEMENTS")

                # Reset the cache key
                cache.delete('planning_change')

                # Get the active planning to get the changes
                self.planning = Planning.objects.active_planning()

                # If there is a single program playing, flush it
                self.queues["single"].flush()

                # Reload all cron events
                self.reload_cron_events()

            sleep(60)

    def start(self):
        self.cron_tab = CronTab()

        # Create all crons events
        self.create_cron_events()

        # Watch for any planning changes, for dynamic crons reloading
        Thread(target=self.watch_planning_changes).start()

        # Record events for the playlist
        PlaylistLogger().start()

        self.cron_tab.run()

