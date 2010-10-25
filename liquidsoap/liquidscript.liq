
        set("log.file.path", "/home/raph/Projects/django_rzz/log/liquidsoap.log")
        set("server.telnet",true)
        queue = request.equeue(id="main_queue")
        security = single("/home/raph/Projects/django_rzz/share/media/security.mp3")
        full = fallback(track_sensitive = false, [queue, security])
    
        output.icecast.vorbis(
            host = "localhost",
            port = 8150,
            password = "zero",
            quality = 8.0,
		mount = "zero.ogg",
            full
        )
        
        output.icecast.lame(
            host = "localhost",
            port = 8150,
            password = "zero",
            bitrate = 128,
		mount = "zero.mp3",
            full
        )
        