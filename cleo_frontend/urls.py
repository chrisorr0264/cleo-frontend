
from django.contrib import admin
from django.urls import path, include
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.home_view, name='home'),
    path('media/', include('cleo_frontend.apps.media.urls')),  # Include the media app's URLs
    path('account/', include('cleo_frontend.apps.account.urls')), # Include the accounts app's URLs
]
