import os
import json
import logging
from datetime import datetime
from pathlib import Path
from dif import build, search  # Assuming dif.py has build and search classes in the same script

# Setup logging
logging.basicConfig(
    filename='difpy_progress.log',
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s'
)

# Suppress PIL/Pillow debug logs (including EXIF)
logging.getLogger("PIL").setLevel(logging.WARNING)

def run_dif_search(image_folder, output_directory=None):
    logging.info(f"Starting duplicate search in folder: {image_folder}")

    # Initialize difPy
    dif = build(image_folder, recursive=False, in_folder=False, limit_extensions=True, px_size=50, show_progress=True)

    # Perform search
    se = search(dif, similarity='duplicates', rotate=True, lazy=True, processes=None)

    # Timestamp for output files
    timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
    result_file = f'difPy_{timestamp}_results.json'
    lq_file = f'difPy_{timestamp}_lower_quality.txt'
    stats_file = f'difPy_{timestamp}_stats.json'

    if output_directory:
        if not os.path.exists(output_directory):
            os.makedirs(output_directory)
        result_file = os.path.join(output_directory, result_file)
        lq_file = os.path.join(output_directory, lq_file)
        stats_file = os.path.join(output_directory, stats_file)

    # Output search results to files
    with open(result_file, 'w') as file:
        json.dump(se.result, file)
        logging.info(f"Results saved to {result_file}")

    with open(stats_file, 'w') as file:
        json.dump(se.stats, file)
        logging.info(f"Stats saved to {stats_file}")

    with open(lq_file, 'w') as file:
        json.dump(se.lower_quality, file)
        logging.info(f"Lower quality images saved to {lq_file}")

    logging.info("Duplicate search completed successfully.")

if __name__ == "__main__":
    # Directory to search
    image_folder = "/mnt/MOM/Images"
    output_directory = "/mnt/MOM/dif_output"  # Change this to your desired output directory

    # Run the duplicate search
    run_dif_search(image_folder, output_directory)