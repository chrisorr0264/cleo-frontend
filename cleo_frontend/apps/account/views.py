from django.contrib.auth import authenticate, login
from django.shortcuts import render, redirect
from django.contrib.auth.forms import AuthenticationForm
from django.shortcuts import render, redirect
from django.core.mail import send_mail
from django.contrib import messages
from .forms import RegistrationForm
from .models import UserRegistrationRequest
import random
import string

def login_view(request):
    if request.method == 'POST':
        form = AuthenticationForm(request, data=request.POST)
        if form.is_valid():
            username = form.cleaned_data.get('username')
            password = form.cleaned_data.get('password')
            user = authenticate(username=username, password=password)
            if user is not None:
                login(request, user)
                next_url = request.GET.get('next', 'home')
                return redirect(next_url)  
    else:
        form = AuthenticationForm()
    return render(request, 'login.html', {'form': form})

def register(request):
    if request.method == 'POST':
        form = RegistrationForm(request.POST)
        if form.is_valid():
            # Save the registration request
            registration_request = UserRegistrationRequest(
                name=form.cleaned_data['name'],
                telephone=form.cleaned_data['telephone'],
                email=form.cleaned_data['email']
            )
            registration_request.save()

            # Notify the administrator for approval
            send_mail(
                'New User Registration Request',
                f'New registration request from {registration_request.name}. Approve at /admin/url/to/approve',
                'admin@yourdomain.com',
                ['admin@yourdomain.com'],
                fail_silently=False,
            )

            messages.success(request, 'Your registration request has been submitted and is pending approval.')
            return redirect('home')
    else:
        form = RegistrationForm()

    return render(request, 'registration/register.html', {'form': form})