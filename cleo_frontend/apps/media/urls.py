from django.urls import path
from . import views

app_name = "media"

urlpatterns = [
    path("gallery/", views.gallery, name="gallery"),
    path("photos/search/", views.photo_search, name="photo_search"),
    path("edit/<int:media_id>/", views.edit_media, name="edit_media"),
    path("save-rotate/<int:media_id>/", views.save_rotation, name="save_rotation"),
    path('fetch-tags/<int:media_id>/', views.fetch_tags, name='fetch_tags'),
    path('update-tags/', views.update_tags, name='update_tags'),
    path('fetch-face-locations/<int:media_id>/', views.fetch_face_locations, name='fetch_face_locations'),
    path('search-faces/<int:media_id>/', views.search_faces, name='search_faces'),
    path('update-face-name/', views.update_face_name, name='update_face_name'),
    path('update-face-validity/', views.update_face_validity, name='update_face_validity'),
    path('manual-face-recognition/', views.manual_face_recognition, name='manual_face_recognition'),
    path('get_tags/', views.get_tags, name='get_tags'),
    path('manage_tag/', views.manage_tag, name='manage_tag'),
    path('delete_tag/<int:tag_id>/', views.delete_tag, name='delete_tag'),
    path('delete_image/<int:media_id>/', views.delete_image, name='delete_image'),
    path('download/<int:media_id>/', views.download_image, name='download_image'),
    path('download-selected/', views.download_selected_images, name='download_selected_images'),
    path('get-location-data/<int:media_id>/', views.get_location_data, name='get_location_data'),
]
