from django.conf import settings
from random import shuffle

EXTENSIONS_TO_FORMATS = {
    "ogg":"vorbis",
    "mp3":"mp3"
}

EXTENSIONS_TO_PACKAGES = {
    "ogg":"icecast",
    "mp3":"shoutcast"
}

EXTENSIONS_TO_QUALITY = {
    "ogg":"quality",
    "mp3":"bitrate"
}

def create_temp_script_file(*args, **kwargs):
    script_string = generate_script(*args, **kwargs)
    script_file = file(settings.LIQUIDSOAP_WORKING_DIRECTORY + "liquidscript.liq", "w")
    script_file.write(script_string)
    script_file.close()
    return script_file

def generate_script(mount_point_name, outputs):
    """
    Generates a liquidsoap script for the given mount point and outputs
    outputs is a list containing dicts of the structure:
    {
        format: "ogg" or "mp3"
        bitrate: the bitrate of the output
    }
    """

    base_string = """
        set("log.file.path", "{LOG_PATH}")
        set("server.telnet",true)
        set("server.telnet.port",{TELNET_PORT})
        program_queue = request.equeue(id="{PROGRAM_QUEUE_NAME}")
        back_queue = request.equeue(id="{BACK_QUEUE_NAME}")
        jingles_queue = request.equeue(id="{JINGLES_QUEUE_NAME}")
        timed_jingles = delay({JINGLES_FREQUENCY}., jingles_queue)
        security = single("{SECURITY}")
        radio = fallback(track_sensitive = true, [timed_jingles, program_queue, back_queue])
        with_live = fallback(track_sensitive=false, [input.http("{RADIO_HOST}/live.mp3"), radio])
        full = fallback(track_sensitive = false, [with_live, security])
    """.format(
        LOG_PATH = settings.LIQUIDSOAP_LOG_PATH,
        PROGRAM_QUEUE_NAME = settings.LIQUIDSOAP_PROGRAM_QUEUE_NAME,
        BACK_QUEUE_NAME = settings.LIQUIDSOAP_BACK_QUEUE_NAME,
        JINGLES_QUEUE_NAME = settings.LIQUIDSOAP_JINGLES_QUEUE_NAME,
        SECURITY = settings.LIQUIDSOAP_SECURITY_AUDIOFILE,
        JINGLES_FREQUENCY = settings.RADIO_JINGLES_FREQUENCY,
        TELNET_PORT = settings.LIQUIDSOAP_TELNET_PORT,
        RADIO_HOST = settings.RADIO_HOST
    )

    print "TELNET PORT :", settings.LIQUIDSOAP_TELNET_PORT

    for output in outputs:

        format = output["format"]
        quality_param = EXTENSIONS_TO_QUALITY[format]
        quality = output.get(quality_param, None)
        quality_string = "{0} = {1},\n\t\t".format(quality_param, quality) if quality else ""

        base_string += """
        output.icecast(%{STREAM_FORMAT},
            host = "{HOST}",
            port = {PORT},
            password = "{PASSWORD}",
            mount = "{MOUNT_POINT_NAME}.{FORMAT}",
            full
        )
        """.format(
            STREAM_FORMAT = EXTENSIONS_TO_FORMATS[format],
            HOST = settings.ICECAST_HOST,
            PORT = settings.ICECAST_PORT,
            PASSWORD = settings.ICECAST_PWD,
            MOUNT_POINT_NAME = mount_point_name,
            FORMAT = format,
        )

    return base_string


class RandomAudioSourceWrapper(object):
    audiofiles = []

    def __init__(self, audiosource):
        self.audiofiles = audiosource.sorted_audiofiles()
        self.shuffled_audiofiles = list(self.audiofiles)
        shuffle(self.shuffled_audiofiles)

    def get_next_random_audiofile(self):
        if not self.shuffled_audiofiles:
            self.shuffled_audiofiles = list(self.audiofiles)
            shuffle(self.shuffled_audiofiles)
        return self.shuffled_audiofiles.pop()
