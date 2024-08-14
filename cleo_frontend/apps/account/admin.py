# In the same app's admin.py (e.g., media/admin.py)

from django.contrib import admin
from .models import GallerySettings

@admin.register(GallerySettings)
class GallerySettingsAdmin(admin.ModelAdmin):
    list_display = ('order_by',)
    list_editable = ('order_by',)
