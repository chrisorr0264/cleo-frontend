# forms.py
from django import forms

class RegistrationForm(forms.Form):
    name = forms.CharField(max_length=100, label="Full Name")
    telephone = forms.CharField(max_length=15, label="Telephone Number")
    email = forms.EmailField(label="Email Address")
