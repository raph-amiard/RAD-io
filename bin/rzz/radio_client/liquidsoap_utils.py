from django.conf import settings

EXTENSIONS_TO_FORMATS = {
    "ogg":"vorbis",
    "mp3":"mp3"
}

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
        queue = request.equeue(id="{QUEUE_NAME}")
        security = single("{SECURITY}")
        full = fallback(track_sensitive = false, [queue, security])
    """.format(
        LOG_PATH = settings.LIQUIDSOAP_LOG_PATH,
        QUEUE_NAME = settings.LIQUIDSOAP_QUEUE_NAME,
        SECURITY = settings.LIQUIDSOAP_SECURITY_AUDIOFILE
    )

    for output in outputs:
        base_string += """
        output.icecast.{STREAM_FORMAT}(
            host = {HOST},
            port = {PORT},
            password = {PASSWORD},
            mount = "{MOUNT_POINT_NAME}.{STREAM_EXTENSION}",
            full
        )
        """.format(
            STREAM_FORMAT = EXTENSIONS_TO_FORMATS[output["format"]],
            HOST = settings.ICECAST_HOST,
            PORT = settings.ICECAST_PORT,
            PASSWORD = settings.ICECAST_PWD,
            MOUNT_POINT_NAME = mount_point_name,
            STREAM_EXTENSION = output["format"]
        )

    return base_string

