# Generated migration to add missing fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('acc_intro', '0012_familyevent_visible_to_all_delete_sharedphoto'),
    ]

    operations = [
        # Add missing fields to NewPersonalProfile
        migrations.AddField(
            model_name='newpersonalprofile',
            name='skills',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='emergencyContact',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='state',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='pincode',
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='specialization',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='medicalConditions',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='facebookProfile',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='instagramProfile',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='linkedinProfile',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='aboutMe',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='achievements',
            field=models.TextField(blank=True),
        ),
        
        # Add missing fields to NewFamilyMember
        migrations.AddField(
            model_name='newfamilymember',
            name='skills',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='emergencyContact',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='state',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='pincode',
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='specialization',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='medicalConditions',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='aboutMember',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='achievements',
            field=models.TextField(blank=True),
        ),
    ]