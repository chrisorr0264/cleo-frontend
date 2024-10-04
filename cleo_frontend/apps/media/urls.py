from django.urls import path
from . import views

app_name = "media"

urlpatterns = [
    path("gallery/", views.gallery, name="gallery"),
    path("photos/search/", views.photo_search, name="photo_search"),
    path("edit/<int:media_id>/", views.edit_media, name="edit_media"),
    path("save-rotate/<int:media_id>/", views.save_rotation, name="save_rotation"),
    path('fetch-tags/<int:media_id>/', views.fetch_tags, name='fetch_tags'),
    #path('update-tags/', views.update_tags, name='update_tags'),
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
    path('update_is_secret/<int:media_id>/', views.update_is_secret, name='update_is_secret'),
    path('update_date/', views.update_date, name='update_date'),
    path('update_media_date_and_filename/<int:media_id>/', views.update_media_date_and_filename, name='update_media_data_and_filename'),
    path('handle_media_update/<int:media_id>/', views.handle_media_update, name='handle_media_update'),
    path('photo_stream/', views.photo_stream, name='photo_stream'),
    path('update_secret_status/<int:media_object_id>/', views.update_secret_status, name='update_secret_status'),
    path('update_tags/<int:media_id>/', views.update_tags, name='update_tags'),
    path('get_tags/<int:media_id>/', views.get_tags, name='get_tags'),
    path('duplicate_search/', views.duplicate_images_view, name='duplicate_search'),
    path('duplicate_search/group/<int:group_number>/', views.get_duplicate_group, name='get_duplicate_group'),   
    path('photo_tag_stream/', views.photo_tag_stream, name='photo_tag_stream'), 
    path('copy_image/<int:media_id>/', views.copy_image, name='copy_image'),
    path('photo_stream_simple/', views.photo_stream_simple, name='photo_stream_simple'),
    path('video_stream_simple/', views.video_stream_simple, name='video_stream_simple'),
]
