from django.db import models


class TblMediaObjects(models.Model):
    media_object_id = models.AutoField(primary_key=True)
    orig_name = models.CharField(max_length=120)
    new_name = models.CharField(max_length=30, blank=True, null=True)
    new_path = models.CharField(max_length=120, blank=True, null=True)
    media_type = models.CharField(max_length=20, blank=True, null=True)
    media_create_date = models.DateTimeField(blank=True, null=True)
    location_class = models.CharField(max_length=60, blank=True, null=True)
    location_type = models.CharField(max_length=60, blank=True, null=True)
    location_name = models.CharField(max_length=200, blank=True, null=True)
    location_display_name = models.CharField(max_length=200, blank=True, null=True)
    location_city = models.CharField(max_length=60, blank=True, null=True)
    location_province = models.CharField(max_length=60, blank=True, null=True)
    location_country = models.CharField(max_length=60, blank=True, null=True)
    tag_assigned = models.IntegerField(blank=True, null=True)
    created_date = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=120, blank=True, null=True)
    created_ip = models.CharField(max_length=20, blank=True, null=True)
    is_active = models.BooleanField(blank=True, null=True)
    image_tensor = models.ForeignKey('TblImageTensors', models.DO_NOTHING, blank=True, null=True)
    movie_hash = models.ForeignKey('TblMovieHashes', models.DO_NOTHING, blank=True, null=True)
    latitude = models.FloatField(blank=True, null=True)
    longitude = models.FloatField(blank=True, null=True)
    width = models.IntegerField(blank=True, null=True)
    height = models.IntegerField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tbl_media_objects'


class TblFaceLocations(models.Model):
    media_object = models.ForeignKey(TblMediaObjects, models.DO_NOTHING, blank=True, null=True)
    top = models.IntegerField(blank=True, null=True)
    right = models.IntegerField(blank=True, null=True)
    bottom = models.IntegerField(blank=True, null=True)
    left = models.IntegerField(blank=True, null=True)
    encoding = models.BinaryField(blank=True, null=True)
    created_date = models.DateTimeField(blank=True, null=True)
    is_invalid = models.BooleanField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tbl_face_locations'
        unique_together = (('media_object', 'top', 'right', 'bottom', 'left'),)


class TblFaceMatches(models.Model):
    face_location = models.ForeignKey(TblFaceLocations, models.DO_NOTHING, blank=True, null=True)
    known_face_id = models.IntegerField(blank=True, null=True)
    face_name = models.CharField(max_length=255, blank=True, null=True)
    is_invalid = models.BooleanField(blank=True, null=True)
    created_date = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tbl_face_matches'
        unique_together = (('face_location', 'known_face_id'),)


class TblIdentities(models.Model):
    name = models.CharField(unique=True, max_length=255)
    created_at = models.DateTimeField(blank=True, null=True)
    updated_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tbl_identities'


class TblImageTensors(models.Model):
    filename = models.TextField()
    tensor_shape = models.TextField(blank=True, null=True)
    tensor_pil = models.BinaryField(blank=True, null=True)
    hash_pil = models.TextField(blank=True, null=True)
    tensor_cv2 = models.BinaryField(blank=True, null=True)
    hash_cv2 = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tbl_image_tensors'


class TblKnownFaces(models.Model):
    encoding = models.BinaryField()
    identity = models.ForeignKey(TblIdentities, models.DO_NOTHING, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tbl_known_faces'
        unique_together = (('identity', 'encoding'),)


class TblMediaMetadata(models.Model):
    media_metadata_id = models.AutoField(primary_key=True)
    media_object = models.ForeignKey(TblMediaObjects, models.DO_NOTHING)
    exif_tag = models.CharField(max_length=60, blank=True, null=True)
    exif_data = models.CharField(max_length=255, blank=True, null=True)
    created_date = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=30, blank=True, null=True)
    created_ip = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tbl_media_metadata'


class TblMovieHashes(models.Model):
    filename = models.TextField()
    media_hash = models.TextField(blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tbl_movie_hashes'


class TblTags(models.Model):
    tag_id = models.AutoField(primary_key=True)
    tag_name = models.CharField(unique=True, max_length=60)
    tag_desc = models.CharField(max_length=120, blank=True, null=True)
    created_date = models.DateTimeField(blank=True, null=True)
    created_by = models.CharField(max_length=30, blank=True, null=True)
    created_ip = models.CharField(max_length=20, blank=True, null=True)

    class Meta:
        managed = False
        db_table = 'tbl_tags'


class TblTagsToMedia(models.Model):
    tags_to_media_id = models.AutoField(primary_key=True)
    media_object = models.ForeignKey(TblMediaObjects, models.DO_NOTHING)
    tag = models.ForeignKey(TblTags, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'tbl_tags_to_media'
        unique_together = (('media_object', 'tag'),)
