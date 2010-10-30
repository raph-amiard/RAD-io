
        set("log.file.path", "/home/raph/Projects/rzz_website_new/log/liquidsoap.log")
        set("server.telnet",true)
        program_queue = request.equeue(id="program_queue")
        back_queue = request.equeue(id="back_queue")
        jingles_queue = request.equeue(id="jingles_queue")
        timed_jingles = delay(300., jingles_queue)
        security = single("/home/raph/Projects/rzz_website_new/share/media/security.mp3")
        full = fallback(track_sensitive = false, [timed_jingles, program_queue, back_queue , security])
    
        output.icecast(%vorbis,
            host = "localhost",
            port = 8100,
            password = "zero",
            mount = "zero.ogg",
            full
        )
        
        output.icecast(%mp3,
            host = "localhost",
            port = 8100,
            password = "zero",
            mount = "zero.mp3",
            full
        )
        