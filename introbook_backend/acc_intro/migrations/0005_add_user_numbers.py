# Generated migration for adding user and member numbers

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('acc_intro', '0004_add_comprehensive_profile_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='newpersonalprofile',
            name='user_number',
            field=models.PositiveIntegerField(blank=True, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='member_number',
            field=models.PositiveIntegerField(blank=True, null=True, unique=True),
        ),
    ]