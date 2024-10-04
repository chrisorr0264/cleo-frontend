"""
WSGI config for cleo_frontend project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/wsgi/
"""

import os
import sys
import traceback
import time

# Add project and virtual environment paths
sys.path.append('/var/www/cleo')
sys.path.append('/var/www/cleo/cleo_frontend')
sys.path.append('/var/www/cleo/var/venv/lib/python3.12/site-packages')

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cleo_frontend.settings')

from django.core.wsgi import get_wsgi_application

def application(environ, start_response):
    try:
        _application = get_wsgi_application()
        return _application(environ, start_response)
    except Exception as e:
        # Log the exception to a file
        with open('/var/log/cleo/wsgi.error.log', 'a') as f:
            f.write(f"{time.ctime()} - Exception: {str(e)}\n")
            f.write(traceback.format_exc())
        raise e  # Re-raise the exception so it gets handled as usual

