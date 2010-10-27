class Scheduler:
    def __init__(self, liquidsoap_agent):
        self.liquidsoap_agent = liquidsoap_agent
        self.liquidsoap_agent.start()
        self.liquidsoap_agent.connect()


