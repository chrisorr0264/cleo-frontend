from django.urls import path
from . import views

app_name = "media"

urlpatterns = [
    path("photos/", views.photos, name="photos"),
    path("photos/search/", views.photo_search, name="photo_search"),
    path("edit/<int:media_id>/", views.edit_media, name="edit_media"),
    path("save-rotate/<int:media_id>/", views.save_rotation, name="save_rotation"),
    path('fetch-tags/<int:media_id>/', views.fetch_tags, name='fetch_tags'),
    path('update-tags/', views.update_tags, name='update_tags'),
    path('fetch-face-locations/<int:media_id>/', views.fetch_face_locations, name='fetch_face_locations'),
    path('search-faces/<int:media_id>/', views.search_faces, name='search_faces'),
    path('update-face-name/', views.update_face_name, name='update_face_name'),
    path('update-face-validity/', views.update_face_validity, name='update_face_validity'),
    path("show-urls/", views.show_urls, name="show_urls"),
]
