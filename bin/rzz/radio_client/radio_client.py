import telnetlib
import subprocess
from rzz.radio_client.liquidsoap_utils import create_temp_script_file
from django.conf import settings
from time import sleep
from datetime import datetime

def start_radio():
    agent = LiquidsoapAgent()
    agent.start()
    sleep(1)
    agent.connect()
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

    def __init__(self, connection, queue_name):
        self.connection = connection
        self.queue_name = queue_name

    def make_command(self, command_str):
        print command_str
        self.connection.write(command_str)


    def insert(self, position, uri):
        """
        Insert a source at the corresponding position into the queue
        Returns the source id
        """

        if position > self.queue_size:
            print 'You inserted beyond the queue size. uri appended at the end'

        command = '{0}.insert {1} {2} \n'.format(self.queue_name, position, uri)
        self.make_command(command)
        response = self.connection.read_until('END')[:-3]
        return int(response)

    def push(self, uri):
        """
        Push a source with the corresponding uri into the queue
        Returns the source id
        """
        command = '{0}.push {1}\n'.format(self.queue_name, uri)
        self.make_command(command)
        response = self.connection.read_until('END')[:-3]		
        return int(response)

    def get_queue(self):
        """
        Returns a list of the ids currently queued
        """
        self.make_command('{0}.queue\n'.format(self.queue_name))
        response = self.connection.read_until('END')[:-3]
        return [int(t) for t in response.split(' ')]

    def get_secondary_queue(self):
        """
        Returns a list of the ids currently queued
        """
        self.make_command('{0}.secondary_queue\n'.format(self.queue_name))
        response = self.connection.read_until('END')[:-3]
        return [int(t) for t in response.split(' ')]

    def remove(self, id):
        """
        Remove the source with given id
        """
        self.make_command('{0}.remove {1}\n'.format(self.queue_name, id))
        response = self.connection.read_until('END')[:-3]
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

    def __insert__(self, position, audiofile):
        id = super(RadioQueue, self).insert(position, audiofile.file.path)

    def push(self, audiofile):
        id = super(RadioQueue, self).push(audiofile.file.path)
        queue_list = self.get_queue()

        if id in self.queue_list: 
            self.audiofiles[id] = audiofile
            return True
        else:
            return False

class RadioSource(object):

    def __init__(self, radio_queue, planning_element):
        self.queue = radio_queue
        self.planning_element = planning_element
        self.audiosource = planning_element.source

    def set_active(self):
        self.queue.flush()

class ProgramSource(RadioSource):

    def set_active(self):
        super(ProgramSource, self).set_active()
        for audiofile in self.audiosource.sorted_audiofiles():
            radio_queue.push(audiofile)

class BackSource(RadioSource):

    def set_active(self):
        super(BackSource, self).set_active()
        audiofiles = self.audiosource.sorted_audiofiles()
        now = datetime.now()
        time_end = self.planning_element.time_end
        while now.time() < 
