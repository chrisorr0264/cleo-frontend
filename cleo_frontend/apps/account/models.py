# account/models.py
from django.db import models

class UserRegistrationRequest(models.Model):
    name = models.CharField(max_length=100)
    telephone = models.CharField(max_length=15)
    email = models.EmailField(unique=True)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return self.name
