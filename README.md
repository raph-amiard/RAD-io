RAD|io : Radio Administration Deck
----------------------------------

RAD|io aims to be a full web interface to create and administrate your web radio. It was created to be used for the [RadioZeroZero][rzz] web radio, and for the moment, it is quite tied to the RadioZeroZero source code.

### What it is at the moment

It is a full Django/Python application, that provides both a backend for administrating your radio, and a frontend site (with news section, and various things). You can take a look at what the front-end looks like on the [RadioZeroZero][rzz] website.

Installation process is fully undocumented, and almost downright impossible for anybody else than myself. If you wan't to try it anyway, here are some of the important dependencies :

- Python 2 (>= 2.6)
- [Django][django] (>= 1.2)
- [LiquidSoap][liquidsoap] current version
- [CoffeeScript][coffee]

[django]: https://www.djangoproject.com/
[liquidsoap]:  http://savonet.sourceforge.net/
[coffeescript]: http://coffeescript.org/

I'm probably forgetting some right now, streamlining the dependencies is on my todo list.

### What it aims to be and TODO LIST

RAD|io aims to be just the administration side of the current code base. The todo list to reach that stage is :

- Remove the front end part of the web-site
- Create a public facing REST API (probably with tastypie) which enables the access of useful radio information (number of listeners, current playing song, and a lot of other things) in order to create fully featured user facing radio sites.
- Adapt the front end to use the api, maybe do a separate open-source project with it.
- I18nize the interface. For the moment it's all hard coded french ! (i know, yuck ...)
- Then, and then only, add new features ! Because there are a lot more features i want to add to RAD|io

### Screenshots !

Main screen
![Main screen](http://radiozerozero.com/site_media/public/radiosc1.jpg)

Playlist editing
![Playlist editing](http://radiozerozero.com/site_media/public/radiosc2.jpg)

Planning editing
![Planning editing](http://radiozerozero.com/site_media/public/radiosc3.jpg)

### Installation instructions

Not done yet ...
