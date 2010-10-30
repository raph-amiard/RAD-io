from django.db import models

class PlanningManager(models.Manager):
    def active_planning(self):
        return self.get(active=True)
