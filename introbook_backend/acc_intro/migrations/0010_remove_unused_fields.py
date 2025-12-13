# Generated migration to remove unused fields

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('acc_intro', '0009_safe_sakhi_to_sakh'),
    ]

    operations = [
        # Remove unused fields from NewPersonalProfile
        migrations.RemoveField(
            model_name='newpersonalprofile',
            name='emergencyContact',
        ),
        migrations.RemoveField(
            model_name='newpersonalprofile',
            name='state',
        ),
        migrations.RemoveField(
            model_name='newpersonalprofile',
            name='pincode',
        ),
        migrations.RemoveField(
            model_name='newpersonalprofile',
            name='specialization',
        ),
        migrations.RemoveField(
            model_name='newpersonalprofile',
            name='medicalConditions',
        ),
        migrations.RemoveField(
            model_name='newpersonalprofile',
            name='skills',
        ),
        migrations.RemoveField(
            model_name='newpersonalprofile',
            name='facebookProfile',
        ),
        migrations.RemoveField(
            model_name='newpersonalprofile',
            name='instagramProfile',
        ),
        migrations.RemoveField(
            model_name='newpersonalprofile',
            name='linkedinProfile',
        ),
        migrations.RemoveField(
            model_name='newpersonalprofile',
            name='aboutMe',
        ),
        migrations.RemoveField(
            model_name='newpersonalprofile',
            name='familyTraditions',
        ),
        migrations.RemoveField(
            model_name='newpersonalprofile',
            name='achievements',
        ),
        
        # Remove unused fields from NewFamilyMember
        migrations.RemoveField(
            model_name='newfamilymember',
            name='emergencyContact',
        ),
        migrations.RemoveField(
            model_name='newfamilymember',
            name='state',
        ),
        migrations.RemoveField(
            model_name='newfamilymember',
            name='pincode',
        ),
        migrations.RemoveField(
            model_name='newfamilymember',
            name='specialization',
        ),
        migrations.RemoveField(
            model_name='newfamilymember',
            name='medicalConditions',
        ),
        migrations.RemoveField(
            model_name='newfamilymember',
            name='skills',
        ),
        migrations.RemoveField(
            model_name='newfamilymember',
            name='aboutMember',
        ),
        migrations.RemoveField(
            model_name='newfamilymember',
            name='achievements',
        ),
    ]