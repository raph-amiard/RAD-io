import os.path
from django.conf import global_settings 
import logging

REQUIRED_KEYS = ["PROJECT_PATH", "ICECAST_HOST", "ICECAST_PORT", "ICECAST_PWD", "RADIO_HOST"]
REQUIRED_RADIO_KEYS = ["RADIO_OUTPUTS", "RADIO_MOUNT_NAME", "RADIO_JINGLES_FREQUENCY", "RADIO_SHORT_NAME", "RADIO_LONG_NAME", "FRIENDS_APP_MENU_NAME", "ARTISTS_APP_MENU_NAME", "IS_ARTISTS_APP_ACTIVATED", "IS_FRIENDS_APP_ACTIVATED"]

# Import local settings
try:
    import socket
    host_name = socket.gethostname().replace('.', '_').replace('-','_')
    exec "import host_settings.%s as host_settings" % host_name
except ImportError, e:
    raise e

# Set the settings keys that are required
try:
    for key in REQUIRED_KEYS:
        globals()[key] = getattr(host_settings, key)
except AttributeError, e:
    raise e

try:
    import radio_settings
    for key in REQUIRED_RADIO_KEYS:
        globals()[key] = getattr(radio_settings, key)
except ImportError, e:
    print "Please make sure you have a radio_settings.py file defining the necessary settings for your radio"
    raise e
except AttributeError, e:
    raise e


CACHE_BACKEND = 'memcached://127.0.0.1:11211/'

LOG_PATH = os.path.join(PROJECT_PATH, 'log/')
LOG_FILENAME = os.path.join(LOG_PATH, 'logging.out')
RADIO_LOG_FILENAME = os.path.join(LOG_PATH, 'radio_log.out')
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
GRAPPELLI_ADMIN_TITLE = RADIO_LONG_NAME

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
    'django.core.context_processors.media',
    'rzz.utils.context_processors.radio_settings',
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
    'grappelli',
	'rzz.news',
	'rzz.artists',
	'rzz.friends',
    'rzz.audiosources',
    'rzz.utils',
    'rzz.config',
    'rzz.radio_client',
    'rzz.playlist',
    'rzz.admin',
    'django.contrib.auth',
	'django.contrib.admin',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.sites',
    'django.contrib.markup',
    'sorl.thumbnail',
)

#######################
# Liquidsoap settings #
#######################

LIQUIDSOAP_LOG_PATH = os.path.join(LOG_PATH, "liquidsoap.log")
LIQUIDSOAP_TELNET_PORT = 1234
LIQUIDSOAP_HOST = 'localhost'
LIQUIDSOAP_JINGLES_QUEUE_NAME = "jingles_queue"
LIQUIDSOAP_BACK_QUEUE_NAME = "back_queue"
LIQUIDSOAP_PROGRAM_QUEUE_NAME = "program_queue"
LIQUIDSOAP_SECURITY_AUDIOFILE = os.path.join(PROJECT_PATH, "share/media/security.mp3")
LIQUIDSOAP_WORKING_DIRECTORY = os.path.join(PROJECT_PATH, "liquidsoap/")
LIQUIDSOAP_BIN = "liquidsoap"

LOGIN_URL = "/login/"


# TODO : Factorize the two for loops into a function

# Set every other key defined in host_settings
# So you can redefine anything per host in the host_settings file
for el_name in dir(host_settings):
    if not(el_name in REQUIRED_KEYS) and not el_name.startswith('__'):
        # Get the element in the module
        el = getattr(host_settings, el_name)
        # Set a similar element in the current module
        globals()[el_name] = el

for el_name in dir(radio_settings):
    if not(el_name in REQUIRED_RADIO_KEYS) and not el_name.startswith('__'):
        # Get the element in the module
        el = getattr(radio_settings, el_name)
        # Set a similar element in the current module
        globals()[el_name] = el
