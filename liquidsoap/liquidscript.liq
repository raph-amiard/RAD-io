
        set("log.file.path", "/home/raph/Projects/rzz_website_new/log/liquidsoap.log")
        set("server.telnet",true)
        queue = request.equeue(id="main_queue")
        security = single("/home/raph/Projects/rzz_website_new/share/media/security.mp3")
        full = fallback(track_sensitive = false, [queue, security])
    
        output.icecast.vorbis(
            host = "localhost",
            port = 8100,
            password = "zero",
            mount = "zero.ogg",
            full
        )
        
        output.icecast.lame(
            host = "localhost",
            port = 8100,
            password = "zero",
            bitrate = 128,
		mount = "zero.mp3",
            full
        )
        