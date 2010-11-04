import os
import shutil

from mutagen.mp3 import HeaderNotFoundError
from django.core.management.base import BaseCommand
from django.conf import settings

from rzz.audiosources.models import AudioFile, Tag, TagCategory, audio_file_name
from rzz.utils.file import get_mp3_metadata

class Command(BaseCommand):

    def handle(self, *args, **options):
        log = file("bad_files.log", "w")
        tc, _= TagCategory.objects.get_or_create(name="status")
        bad_artist_tag, _ = Tag.objects.get_or_create(name="bad artist", category = tc)
        bad_title_tag, _ = Tag.objects.get_or_create(name="bad title", category = tc)
        collection_path = args[0]

        for path, child_dirs , filenames in os.walk(collection_path):

            audio_files = filter(lambda f: f.split(".")[-1] == "mp3", filenames)
            if not audio_files:
                continue

            os.chdir(path)

            for audio_file in audio_files:
                print "Processing file {0} in directory {1}".format(audio_file, path)
                af = AudioFile()
                file_path = "{0}/{1}".format(os.getcwd(), audio_file)

                try:
                    af.artist, af.title, af.length = get_mp3_metadata(file_path)
                except HeaderNotFoundError, e:
                    print "Couldn't process MP3 : {0}\n".format(e)
                    log.write("{0}, {1} \n".format(audio_file, path)
                    continue

                new_rel_file_path = audio_file_name(af, audio_file)
                new_file_path = os.path.join(settings.MEDIA_ROOT, new_rel_file_path)
                print new_file_path
                shutil.copy(file_path, new_file_path)
                af.file.name = new_rel_file_path
                af.original_filename = audio_file
                af.save()

                if af.artist == "unknown_artist":
                    af.tags.add(bad_artist_tag)
                    print "Added bad artist tag"
                if af.title == "unknown_title":
                    af.tags.add(bad_title_tag)
                    print "Added bad title tag"


                print "File successfully added to database !"

                print "\n"

        log.close()
