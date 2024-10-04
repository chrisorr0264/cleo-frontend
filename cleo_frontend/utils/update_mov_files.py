import os
import sys
import django
import hashlib
import subprocess
from django.conf import settings

import logging

# Add the project root to the Python path
sys.path.append('/var/www/cleo')  # Make sure this is the path where your project is located

# Set up Django environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleo_frontend.settings')
django.setup()

from cleo_frontend.apps.media.models import TblMediaObjects, TblMovieHashes

# Path to the directory where the videos are stored
MOVIES_DIR = '/mnt/MOM/Movies/'

# Set up logging
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(levelname)s - %(message)s', filename='mov_conversion.log')
logger = logging.getLogger(__name__)

def convert_mov_to_mp4(input_path, output_path):
    # Change the extension to .mp4
    mp4_output_path = output_path.replace('.mov', '.mp4').replace('.MOV', '.mp4')
    
    try:
        # Run FFmpeg conversion
        result = subprocess.run(
            ['ffmpeg', '-y', '-i', input_path, '-vcodec', 'h264', '-acodec', 'aac', mp4_output_path],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True, check=True
        )
        logger.info(f"Successfully converted {input_path} to {mp4_output_path}")
        
        # Return the new mp4 output path
        return mp4_output_path
    except subprocess.CalledProcessError as e:
        logger.error(f"Error converting {input_path}: {e}")
        logger.error(f"ffmpeg output: {e.stderr}")
        return None

# Function to generate an MD5 hash for a given file
def generate_md5_hash(file_path):
    try:
        hasher = hashlib.md5()
        with open(file_path, 'rb') as f:
            while chunk := f.read(8192):
                hasher.update(chunk)
        logger.info(f"Generated MD5 hash for {file_path}")
        return hasher.hexdigest()
    except Exception as e:
        logger.error(f"Error generating hash for {file_path}: {e}")
        return None

# Function to update movie hash in TblMovieHashes
def update_movie_hash(media_object, new_file_path):
    new_hash = generate_md5_hash(new_file_path)
    if new_hash:
        movie_hash_obj = media_object.movie_hash
        if movie_hash_obj:
            movie_hash_obj.media_hash = new_hash
            movie_hash_obj.filename = os.path.basename(new_file_path)
            movie_hash_obj.save()
            logger.info(f"Updated hash for {new_file_path} in TblMovieHashes")
        else:
            new_movie_hash = TblMovieHashes(filename=os.path.basename(new_file_path), media_hash=new_hash)
            new_movie_hash.save()
            media_object.movie_hash = new_movie_hash
            media_object.save()
            logger.info(f"Created new hash for {new_file_path} in TblMovieHashes")

# Function to process and update all .MOV files
def process_mov_files():
    logger.info("Starting the .MOV to .MP4 conversion process")

    # Get all the .MOV files
    mov_files = TblMediaObjects.objects.filter(new_name__iendswith='.MOV', is_active=True)
    logger.info(f"Found {mov_files.count()} .MOV files to process")
    
    for i, media_obj in enumerate(mov_files, start=1):
        input_file = os.path.join(MOVIES_DIR, media_obj.new_name)
        logger.info(f"Processing file {i}/{mov_files.count()}: {input_file}")
        
        mp4_file = convert_mov_to_mp4(input_file, input_file)
        
        if mp4_file:
            # If conversion is successful, update the database with new filename and hash
            new_hash = generate_md5_hash(mp4_file)
            if new_hash:
                media_obj.new_name = os.path.basename(mp4_file)
                media_obj.movie_hash.media_hash = new_hash[1]
                media_obj.movie_hash.save()
                media_obj.save()

                # Log success
                logger.info(f"Updated hash for {mp4_file} in TblMovieHashes")
                
                # Remove the original .MOV file
                try:
                    os.remove(input_file)
                    logger.info(f"Removed original file {input_file}")
                except Exception as e:
                    logger.error(f"Error removing original file {input_file}: {e}")
        else:
            logger.error(f"Failed to convert {input_file}")

if __name__ == "__main__":
    logger.info("Starting the .MOV to .MP4 conversion process")
    process_mov_files()
    logger.info("Completed the .MOV to .MP4 conversion process")
