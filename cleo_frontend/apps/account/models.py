# account/models.py
from django.db import models

class UserRegistrationRequest(models.Model):
    name = models.CharField(max_length=100)
    telephone = models.CharField(max_length=15)
    email = models.EmailField(unique=True)
    is_approved = models.BooleanField(default=False)

    def __str__(self):
        return self.name

class GallerySettings(models.Model):
    SORT_OPTIONS = [
        ('date_asc', 'Oldest First'),
        ('date_desc', 'Most Recent First'),
    ]
    
    order_by = models.CharField(max_length=20, choices=SORT_OPTIONS, default='date_desc')

    def __str__(self):
        return f"Gallery Order: {self.get_order_by_display()}"