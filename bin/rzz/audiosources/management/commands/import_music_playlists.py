import os
import shutil

from mutagen.mp3 import HeaderNotFoundError
from django.core.management.base import BaseCommand
from django.conf import settings

from rzz.audiosources.models import AudioFile, AudioSource, SourceElement , audio_file_name
from rzz.utils.file import get_mp3_metadata

class Command(BaseCommand):

    def handle(self, *args, **options):
        collection_path = args[0]

        for path, child_dirs , filenames in os.walk(collection_path):

            playlists = filter(lambda f: f.split(".")[-1] == "m3u", filenames)

            if not playlists:
                continue

            os.chdir(path)

            for playlist in playlists:

                playlist_name = playlist.split(".")[0]
                playlist_path = "{0}/{1}".format(os.getcwd(), playlist)

                audio_source = AudioSource(title=playlist_name, length=0)
                audio_source.save()

                files = [l.split("/")[-1].strip()
                         for l in file(playlist_path).readlines()
                         if not l.startswith("#")]

                for i in range(len(files)):
                    f = files[i]
                    qs = AudioFile.objects.filter(original_filename=f)
                    qlen = len(qs)
                    audiofile = None
                    if qlen == 0:
                        print "No file found in the database for track {0}".format(f)
                        continue
                    elif qlen > 1:
                        print "Several files found for track {0}".format(f)
                        print "Which one do you want to select ? "
                        for i in range(qlen):
                            print "{0}. : {1}".format(i + 1, qs)
                        no = int(raw_input()) + 1
                        audiofile = qs[no]
                    else:
                        print "File found in the database for track {0}".format(f)
                        audiofile = qs[0]

                    source_element = SourceElement(position=i, audiosource = audio_source, audiofile=audiofile)
                    source_element.save()
                    audio_source.length += audiofile.length
                    print "File {0} added to playlist {1}".format(audiofile, audio_source)

                audio_source.save()
                print "Playlist {0} created".format(audio_source)

                if not len(audio_source.sourceelement_set.all()):
                    audio_source.delete()

