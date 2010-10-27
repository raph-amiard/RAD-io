import telnetlib
import subprocess
from time import sleep
from datetime import datetime, timedelta
from threading import Thread

from django.conf import settings

from rzz.radio_client.liquidsoap_utils import create_temp_script_file, RandomAudioSourceWrapper
from rzz.audiosources.models import Planning, PlanningElement
from rzz.utils.cron import CronTab, Event

def start_radio():
    agent = LiquidsoapAgent()
    agent.start()
    sleep(1)
    #agent.connect()
    #scheduler = Scheduler(Planning.objects.get(name="AAAAA"), agent.queue)
    #scheduler.start()
    return agent

class LiquidsoapAgent(object):
    status = "stopped"

    def __init__(self):
        self.script = create_temp_script_file(settings.RADIO_MOUNT_NAME, settings.RADIO_OUTPUTS)
        self.liquidsoap_process = None

    def start(self):
        if not self.liquidsoap_process:
            self.liquidsoap_process = subprocess.Popen([settings.LIQUIDSOAP_BIN, "-t", self.script.name])
            self.status = "started"

    def connect(self):
        if self.status == "started":
            self.connection = telnetlib.Telnet('localhost', 1234, 1000)
            self.queue = RadioQueue(self.connection, settings.LIQUIDSOAP_QUEUE_NAME)

    def stop(self):
        if self.liquidsoap_process:
            self.liquidsoap_process.kill()
            self.status = "stopped"

class QueueCommandWrapper(object):
    queue_size = 0
    queue_list = []

    def __init__(self, connection, queue_name):
        self.connection = connection
        self.queue_name = queue_name

    def make_command(self, command_str):
        print "COMMAND : \"{0}\"".format(command_str)
        self.connection.write(command_str+'\n')
        response = self.connection.read_until('END')[:-3].replace('\n', '')
        print "REPONSE : \"{0}\"".format(response)
        return response

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
        if not response == 'OK':
            print 'There is no source with the given id'

    def flush(self):
        for track_id in self.get_secondary_queue():
            self.remove(track_id)

    def move(self, id, position):
        """
        """


class RadioQueue(QueueCommandWrapper):

    queue_list = []
    audiofiles = {}

    def insert(self, position, audiofile):

        print len(self.queue_list)

        if position >= len(self.queue_list):
            print 'You inserted beyond the queue size. uri appended at the end'
            return self.push(audiofile)

        id = super(RadioQueue, self).insert(position, audiofile.file.path)

        sleep(0.1)
        self.queue_list = self.get_secondary_queue()
        self.audiofiles[id] = audiofile

        if id in self.queue_list:
            return True
        else:
            return False


    def push(self, audiofile):
        id = super(RadioQueue, self).push(audiofile.file.path)

        sleep(0.1)
        self.queue_list = self.get_secondary_queue()
        self.audiofiles[id] = audiofile

        if id in self.queue_list:
            return True
        else:
            return False


class RadioSource(object):

    def __init__(self, scheduler, planning_element):
        self.queue = scheduler.radio_queue
        self.planning_element = planning_element
        self.audiosource = planning_element.source
        self.scheduler = scheduler

    def refresh(self):
        self.planning_element = PlanningElement.objects.get(id=self.planning_element.id)
        self.audiosource = self.planning_element.source

    def set_active(self):
        self.refresh()
        self.queue.flush()


class ProgramSource(RadioSource):

    def set_inactive(self):
        print u"Program source {0} set inactive".format(self.audiosource.title)
        while self.queue.get_secondary_queue():
            sleep(60)
        if self.scheduler.active_backsource:
            self.scheduler.active_backsource.set_active()
        self.scheduler.active_programsource = None

    def set_active(self):

        print u"Program source {0} set active".format(self.audiosource.title)
        super(ProgramSource, self).set_active()

        self.scheduler.active_programsource = self
        time = 0

        for audiofile in self.audiosource.sorted_audiofiles():
            self.queue.push(audiofile)
            time += audiofile.length

        if self.scheduler.active_jinglesource:
            self.scheduler.active_jinglesource.insert_jingles()

        Thread(target=self.set_inactive).start()


class BackSource(RadioSource):

    def set_active(self):
        print u"Back source {0} set active".format(self.audiosource.title)
        super(BackSource, self).set_active()
        audiofiles = RandomAudioSourceWrapper(self.audiosource)
        now = datetime.now()
        time_end = self.planning_element.time_end

        self.scheduler.active_backsource = self
        print "TIME_END LOL : {0}".format(time_end)

        while now.time() < time_end and now.weekday() == self.planning_element.day:
            audiofile = audiofiles.get_next_random_audiofile()
            self.queue.push(audiofile)
            now = now + timedelta(seconds=audiofile.length)

        if self.scheduler.active_jinglesource:
            self.scheduler.active_jinglesource.insert_jingles()

    def set_inactive(self):
        print u"Back source {0} set inactive".format(self.audiosource.title)
        self.scheduler.active_backsource = None


class JingleSource(RadioSource):

    def set_active(self):
        print u"Jingle source {0} set active".format(self.audiosource.title)
        self.scheduler.active_jinglesource = self

    def set_inactive(self):
        print u"Jingle source {0} set inactive".format(self.audiosource.title)
        self.scheduler.active_jinglesource = None

    def insert_jingles(self):

        self.refresh()
        audiofiles = RandomAudioSourceWrapper(self.audiosource)
        frequency = settings.RADIO_JINGLES_FREQUENCY
        limit = 0
        queue_list = self.queue.get_queue()
        time_end = self.planning_element.time_end
        now = datetime.now()
        jingle_index = 0

        for i in range(0, len(queue_list) -1):

            if now.time() > time_end:
                break

            audiofile = self.queue.audiofiles[queue_list[i]]
            limit += audiofile.length
            now = now + timedelta(seconds=audiofile.length)

            if limit > frequency:
                limit = 0
                jingle = audiofiles.get_next_random_audiofile()
                self.queue.insert(jingle_index+1, jingle)
                jingle_index += 1

            jingle_index += 1


class Scheduler(object):

    active_backsource = None
    active_programsource = None
    active_jinglesource = None

    TYPES_TO_CLASSES = {
        "single": ProgramSource,
        "continuous": BackSource,
        "jingle": JingleSource
    }

    def __init__(self, planning, radio_queue):
        self.planning = planning
        self.radio_queue = radio_queue

    def start(self):
        time_now = datetime.now().time()
        self.cron_tab = CronTab()
        for pe in self.planning.planningelement_set.all():
            source = self.TYPES_TO_CLASSES[pe.type](self, pe)
            print "TREATING SOURCE {0}".format(pe.source.title.encode('utf8','replace'))
            print "TYPE : {0}".format(pe.type)
            print "TIME_START : {0}".format(pe.time_start)

            if pe.type in ["continuous", "jingle"] and pe.time_start < time_now < pe.time_end:
                print "PUTTING ON PLAY NOW"
                if pe.type == "jingle":
                    now_jingle_source = source
                else:
                    now_back_source = source

            else:
                print "ADDING CRON JOB FOR TIME START"
                self.cron_tab.add_event(Event(
                    source.set_active, min=pe.time_start.minute, hour=pe.time_start.hour, dow=pe.day))

            if pe.type in ["continuous", "jingle"]:
                print "TIME_END : {0}".format(pe.time_end)
                print "ADDING CRON JOB FOR TIME END"
                self.cron_tab.add_event(Event(
                    source.set_inactive,
                    min=pe.time_end.minute-1,
                    hour=pe.time_end.hour,
                    dow=pe.day
                ))
            print "\n"

        now_jingle_source.set_active()
        now_back_source.set_active()

        self.cron_tab.run()
