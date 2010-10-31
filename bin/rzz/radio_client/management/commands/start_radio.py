from django.core.management.base import NoArgsCommand
from rzz.radio_client.radio_client import start_radio

class Command(NoArgsCommand):
    help = """
    This command starts the radio on the active planning
    """

    def handle_noargs(self, *args, **kwargs):
        start_radio()
