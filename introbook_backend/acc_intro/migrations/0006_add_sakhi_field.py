# Generated migration for adding sakhi field

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('acc_intro', '0005_add_user_numbers'),
    ]

    operations = [
        migrations.AddField(
            model_name='newpersonalprofile',
            name='sakhi',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='sakhi',
            field=models.CharField(blank=True, max_length=100),
        ),
    ]