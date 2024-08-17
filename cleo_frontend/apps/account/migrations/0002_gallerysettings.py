# Generated by Django 5.1 on 2024-08-14 23:27

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('account', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='GallerySettings',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('order_by', models.CharField(choices=[('date_asc', 'Oldest First'), ('date_desc', 'Most Recent First')], default='date_desc', max_length=20)),
            ],
        ),
    ]
