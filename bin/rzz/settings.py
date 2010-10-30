import os.path
from django.conf import global_settings 
import logging

CACHE_BACKEND = 'memcached://127.0.0.1:11211/'

PROJECT_PATH = '/home/raph/Projects/rzz_website_new/'

LOG_PATH = os.path.join(PROJECT_PATH, 'log/')
LOG_FILENAME = os.path.join(LOG_PATH, 'logging.out')
logging.basicConfig(filename=LOG_FILENAME,level=logging.DEBUG)

DEBUG = True
TEMPLATE_DEBUG = DEBUG

ADMINS = (
    # ('Your Name', 'your_email@domain.com'),
)

MANAGERS = ADMINS
DATABASE_ENGINE = 'postgresql_psycopg2' 
DATABASE_NAME = 'rzz'
DATABASE_USER = 'rzz'
DATABASE_PASSWORD = 'rzz'
DATABASE_HOST = 'localhost'
DATABASE_PORT = '5432'

# Local time zone for this installation. Choices can be found here:
# http://en.wikipedia.org/wiki/List_of_tz_zones_by_name
# although not all choices may be available on all operating systems.
# If running in a Windows environment this must be set to the same as your
# system time zone.
TIME_ZONE = 'Europe/Paris'

# Language code for this installation. All choices can be found here:
# http://www.i18nguy.com/unicode/language-identifiers.html
LANGUAGE_CODE = 'fr-fr'

SITE_ID = 1

# If you set this to False, Django will make some optimizations so as not
# to load the internationalization machinery.
USE_I18N = True

# Absolute path to the directory that holds media.
# Example: "/home/media/media.lawrence.com/"
MEDIA_ROOT = os.path.join(PROJECT_PATH, 'share/media/')

# URL that handles the media served from MEDIA_ROOT. Make sure to use a
# trailing slash if there is a path component (optional in other cases).
# Examples: "http://media.lawrence.com", "http://example.com/media/"
MEDIA_URL = '/site_media/'

# URL prefix for admin media -- CSS, JavaScript and images. Make sure to use a
# trailing slash.
# Examples: "http://foo.com/media/", "/media/".
ADMIN_MEDIA_PREFIX = '/media/'

# Make this unique, and don't share it with anybody.
SECRET_KEY = 'c&=+et6-23xc4g^er%pb_8*%r+-7to)2v&myi)s3)^2llq5b+g'

# List of callables that know how to import templates from various sources.
TEMPLATE_LOADERS = (
    'django.template.loaders.filesystem.load_template_source',
    'django.template.loaders.app_directories.load_template_source',
#     'django.template.loaders.eggs.load_template_source',
)

TEMPLATE_CONTEXT_PROCESSORS = (
	'django.core.context_processors.auth',
    'django.core.context_processors.media'
)

MIDDLEWARE_CLASSES = (
    'django.middleware.common.CommonMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
)

ROOT_URLCONF = 'rzz.urls'

TEMPLATE_DIRS = (
	os.path.join(PROJECT_PATH, 'bin/rzz/templates')
)

FILE_UPLOAD_HANDLERS = ('rzz.utils.handlers.UploadProgressCachedHandler', ) + global_settings.FILE_UPLOAD_HANDLERS
FILE_UPLOAD_MAX_MEMORY_SIZE = 10

INSTALLED_APPS = (
	'rzz.news',
	'rzz.artists',
	'rzz.friends',
    'rzz.audiosources',
    'rzz.utils',
    'django.contrib.auth',
	'django.contrib.admin',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'gunicorn',
)

ICECAST_HOST = "localhost"
ICECAST_PORT = 8100
ICECAST_PWD = "zero"

LIQUIDSOAP_LOG_PATH = os.path.join(LOG_PATH, "liquidsoap.log")
LIQUIDSOAP_JINGLES_QUEUE_NAME = "jingles_queue"
LIQUIDSOAP_BACK_QUEUE_NAME = "back_queue"
LIQUIDSOAP_PROGRAM_QUEUE_NAME = "program_queue"
LIQUIDSOAP_SECURITY_AUDIOFILE = os.path.join(PROJECT_PATH, "share/media/security.mp3")
LIQUIDSOAP_WORKING_DIRECTORY = os.path.join(PROJECT_PATH, "liquidsoap/")
LIQUIDSOAP_BIN = "liquidsoap"

RADIO_OUTPUTS = [
    { 'format':'ogg', 'quality':8.0 },
    { 'format':'mp3', 'bitrate':128 }
]
RADIO_MOUNT_NAME = "zero"
RADIO_JINGLES_FREQUENCY = 5 * 60
