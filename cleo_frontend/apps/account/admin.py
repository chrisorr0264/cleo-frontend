

from django.contrib import admin
from .models import GallerySettings

@admin.register(GallerySettings)
class GallerySettingsAdmin(admin.ModelAdmin):
    list_display = ('order_by',)
    list_display_links = ('order_by',)

