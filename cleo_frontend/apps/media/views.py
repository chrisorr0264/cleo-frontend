from django.core.paginator import Paginator
from django.shortcuts import render, get_object_or_404
from django.urls import get_resolver
from django.http import JsonResponse, HttpRequest, HttpResponse
from .models import TblMediaObjects, TblTags, TblTagsToMedia, TblFaceLocations, TblFaceMatches, TblKnownFaces
from django.conf import settings
from django.db.models import Q
from django.views.decorators.csrf import csrf_exempt
from PIL import Image
import os
import random
import json
from ...utils.facelabeler import FaceLabeler 
import numpy as np
import hashlib

def generate_paths(media):
    media.full_path = os.path.join(settings.IMAGE_PATH, media.new_name)
    media.thumbnail_path = os.path.join(settings.THUMBNAIL_PATH, media.new_name)
    width, height = media.width, media.height

    if width and height and height != 0:
        media.aspect_ratio = width / height
    else:
        media.aspect_ratio = 1  # Default ratio if width or height is None or height is zero

    # Assign column class based on aspect ratio
    if media.aspect_ratio > 2.0:
        media.col_class = 'col-lg-8 col-md-12'
    elif media.aspect_ratio > 1.5:
        media.col_class = 'col-lg-6 col-md-12'
    elif media.aspect_ratio > 1.0:
        media.col_class = 'col-lg-4 col-md-6'
    else:
        media.col_class = 'col-lg-3 col-md-6'

def home_view(request: HttpRequest) -> HttpResponse:
    # Randomly select one image to display as the main focus
    media_files = TblMediaObjects.objects.using('media').filter(media_type='image')
    main_image = random.choice(media_files)

    generate_paths(main_image)

    tags = TblTags.objects.all()
    names = TblFaceMatches.objects.values('face_name').distinct()

    return render(request, "index.html", {
        'main_image': main_image,
        'tags': tags,
        'names': names,
    })

def gallery(request: HttpRequest) -> HttpResponse:
    media_files = list(TblMediaObjects.objects.using('media').filter(media_type='image'))
    random.shuffle(media_files)
    media_files = media_files[:100]

    # Pagination
    paginator = Paginator(media_files, 20)  # Show 20 images per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    for media in page_obj:
        generate_paths(media)
        print(media.full_path) # Debug

    tags = TblTags.objects.all()
    names = TblFaceMatches.objects.values('face_name').distinct()

    return render(request, "gallery.html", {
        'page_obj': page_obj,
        'tags': tags,
        'names': names,
        'title': "Photos",
        'show_search': True,
        'show_navbar': True
    })

def photo_search(request: HttpRequest) -> HttpResponse:
    from_date = request.GET.get('from_date')
    to_date = request.GET.get('to_date')
    tags = request.GET.getlist('tags')
    names = request.GET.getlist('names')
    filename = request.GET.get('filename')

    filters = Q(media_type='image')
    title_parts = []

    if from_date:
        filters &= Q(media_create_date__gte=from_date)
        title_parts.append(f"From {from_date}")
    if to_date:
        filters &= Q(media_create_date__lte=to_date)
        title_parts.append(f"To {to_date}")

    media_files = TblMediaObjects.objects.using('media').filter(filters).distinct()

    if filename:
        filters &= Q(orig_name__icontains=filename)
        media_files = media_files.filter(filters)
        title_parts.append(f"Filename: {filename}")

    if tags:
        tags = [tag for tag in tags if tag]
        if tags:
            for tag in tags:
                media_files = media_files.filter(tbltagstomedia__tag__tag_id=tag)
            tag_names = TblTags.objects.filter(tag_id__in=tags).values_list('tag_name', flat=True)
            title_parts.append(f"Tags: {', '.join(tag_names)}")
    if names:
        names = [name for name in names if name]
        if names:
            for name in names:
                media_files = media_files.filter(tblfacematches__face_name=name)
            title_parts.append(f"Names: {', '.join(names)}")

    media_files = media_files.order_by('media_object_id')

    paginator = Paginator(media_files, 20)  # Show 20 images per page
    page_number = request.GET.get('page')
    page_obj = paginator.get_page(page_number)

    for media in page_obj:
        generate_paths(media)
        media.has_tags = media.tbltagstomedia_set.exists()

    title = "Photos"
    if title_parts:
        title += " - " + " | ".join(title_parts)

    tags = TblTags.objects.all()
    names = TblFaceMatches.objects.values('face_name').distinct()

    return render(request, "photos.html", {
        'page_obj': page_obj,
        'tags': tags,
        'names': names,
        'title': title,
        'show_search': True,
        'show_navbar': True
    })


def edit_media(request, media_id):
    media = get_object_or_404(TblMediaObjects, media_object_id=media_id)
    generate_paths(media)

    face_matches = TblFaceMatches.objects.filter(face_location__media_object=media)

    return render(request, 'edit_media.html', {
        'media': media,
        'face_matches': face_matches,
        'show_navbar': False,  # Hide the navbar
    })

def save_rotation(request, media_id):
    if request.method == 'POST':
        media = get_object_or_404(TblMediaObjects, media_object_id=media_id)
        image_path = os.path.join(settings.MEDIA_ROOT, media.new_name)
        thumbnail_path = os.path.join(settings.MEDIA_ROOT, 'thumbnails', media.new_name)

        try:
            angle = int(request.POST.get('angle', 0))
            with Image.open(image_path) as img:
                img = img.rotate(angle, expand=True)
                img.save(image_path)

            with Image.open(thumbnail_path) as thumbnail:
                thumbnail = thumbnail.rotate(angle, expand=True)
                thumbnail.save(thumbnail_path)

            return JsonResponse({'status': 'success'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    else:
        return JsonResponse({'status': 'error', 'message': 'Invalid request method'})

def fetch_tags(request, media_id):
    media_object = get_object_or_404(TblMediaObjects, pk=media_id)
    assigned_tags = TblTags.objects.filter(tbltagstomedia__media_object=media_object)
    available_tags = TblTags.objects.exclude(tbltagstomedia__media_object=media_object)

    assigned_tags_list = [{'id': tag.tag_id, 'name': tag.tag_name} for tag in assigned_tags]
    available_tags_list = [{'id': tag.tag_id, 'name': tag.tag_name} for tag in available_tags]

    return JsonResponse({
        'assigned_tags': assigned_tags_list,
        'available_tags': available_tags_list
    })

def update_tags(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        media_object_id = data['media_object_id']
        assigned_tags = data['assigned_tags']

        media_object = get_object_or_404(TblMediaObjects, pk=media_object_id)
        TblTagsToMedia.objects.filter(media_object=media_object).delete()

        for tag_id in assigned_tags:
            tag = get_object_or_404(TblTags, pk=tag_id)
            TblTagsToMedia.objects.create(media_object=media_object, tag=tag)

        return JsonResponse({'success': True})

    return JsonResponse({'success': False})

def fetch_face_locations(request, media_id):
    media_object = get_object_or_404(TblMediaObjects, pk=media_id)
    face_type = request.GET.get('type', 'all')

    face_locations = []
    if face_type == 'identified':
        identified_faces = TblFaceMatches.objects.filter(face_location__media_object=media_object, is_invalid=False)
        for face in identified_faces:
            face_location = face.face_location
            face_locations.append({
                'top': face_location.top,
                'right': face_location.right,
                'bottom': face_location.bottom,
                'left': face_location.left,
                'name': face.face_name
            })
    else:
        all_faces = TblFaceLocations.objects.filter(media_object=media_object)
        for face_location in all_faces:
            face_name = 'Invalid' if face_location.is_invalid else None
            face_locations.append({
                'top': face_location.top,
                'right': face_location.right,
                'bottom': face_location.bottom,
                'left': face_location.left,
                'name': face_name
            })

    return JsonResponse({
        'status': 'success',
        'face_locations': face_locations
    })

def search_faces(request, media_id):
    media_object = get_object_or_404(TblMediaObjects, pk=media_id)
    image_path = os.path.join(media_object.new_path, media_object.new_name)

    face_labeler = FaceLabeler()
    identified_faces = face_labeler.label_faces_in_image(image_path, media_id)

    response_data = {'faces': []}
    for face in identified_faces:
        response_data['faces'].append({
            'top': face['top'],
            'right': face['right'],
            'bottom': face['bottom'],
            'left': face['left'],
            'name': face['name'],
            'encoding': face['encoding'].tolist(),
            'is_invalid': face['is_invalid']
        })

    return JsonResponse(response_data)

def update_face_name(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            media_id = data.get('media_id')
            face_location = data.get('face')
            new_name = data.get('new_name')
            face_encoding = data.get('face_encoding')

            if not (media_id and face_location and new_name and face_encoding):
                return JsonResponse({'success': False, 'error': 'Missing required parameters'})

            if isinstance(face_encoding, list):
                face_encoding_np = np.array(face_encoding, dtype=np.float64)
                face_encoding_bytes = face_encoding_np.tobytes()
            else:
                face_encoding_bytes = face_encoding

            encoding_hash = hashlib.sha256(face_encoding_bytes).hexdigest()
            unknown_name = f"unknown_{media_id}_{encoding_hash[:8]}"

            tolerance = 5

            face_match = TblFaceMatches.objects.filter(
                face_location__media_object_id=media_id,
                face_location__top__gte=face_location['top'] - tolerance,
                face_location__top__lte=face_location['top'] + tolerance,
                face_location__right__gte=face_location['right'] - tolerance,
                face_location__right__lte=face_location['right'] + tolerance,
                face_location__bottom__gte=face_location['bottom'] - tolerance,
                face_location__bottom__lte=face_location['bottom'] + tolerance,
                face_location__left__gte=face_location['left'] - tolerance,
                face_location__left__lte=face_location['left'] + tolerance,
            ).first()

            if not face_match:
                return JsonResponse({'success': False, 'error': 'Face location not found'})

            if face_match.face_location.is_invalid:
                return JsonResponse({'success': False, 'error': 'Cannot update invalid face location'})

            if not new_name or new_name.lower().startswith('unknown_'):
                new_name = unknown_name

            known_face, _ = TblKnownFaces.objects.update_or_create(
                encoding=face_encoding_bytes,
                defaults={'name': new_name}
            )

            TblFaceMatches.objects.update_or_create(
                face_location=face_match.face_location,
                defaults={'known_face': known_face, 'face_name': new_name}
            )

            return JsonResponse({'success': True})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})

@csrf_exempt
def update_face_validity(request):
    if request.method == 'POST':
        try:
            data = json.loads(request.body)
            media_id = data.get('media_id')
            face_location = data.get('face')
            is_invalid = data.get('is_invalid', False)

            if not media_id or not face_location:
                return JsonResponse({'success': False, 'error': 'Missing required parameters'})

            tolerance = 5

            face_match = TblFaceMatches.objects.filter(
                face_location__media_object_id=media_id,
                face_location__top__gte=face_location['top'] - tolerance,
                face_location__top__lte=face_location['top'] + tolerance,
                face_location__right__gte=face_location['right'] - tolerance,
                face_location__right__lte=face_location['right'] + tolerance,
                face_location__bottom__gte=face_location['bottom'] - tolerance,
                face_location__bottom__lte=face_location['bottom'] + tolerance,
                face_location__left__gte=face_location['left'] - tolerance,
                face_location__left__lte=face_location['left'] + tolerance,
            ).first()

            if not face_match:
                return JsonResponse({'success': False, 'error': 'Face location not found'})

            face_location_obj = face_match.face_location
            face_location_obj.is_invalid = is_invalid
            face_location_obj.save()

            face_match.is_invalid = is_invalid
            face_match.save()

            if is_invalid:
                face_encoding_bytes = face_match.known_face.encoding
                encoding_hash = hashlib.sha256(face_encoding_bytes).hexdigest()
                unknown_name = f"unknown_{media_id}_{encoding_hash[:8]}"

                face_match.known_face.name = unknown_name
                face_match.known_face.save()

                face_match.face_name = unknown_name
                face_match.save()

            return JsonResponse({'success': True})

        except Exception as e:
            return JsonResponse({'success': False, 'error': str(e)})

    return JsonResponse({'success': False, 'error': 'Invalid request method'})

