# Generated migration to rename sakhi field to sakh

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('acc_intro', '0006_add_sakhi_field'),
    ]

    operations = [
        migrations.RenameField(
            model_name='newpersonalprofile',
            old_name='sakhi',
            new_name='sakh',
        ),
        migrations.RenameField(
            model_name='newfamilymember',
            old_name='sakhi',
            new_name='sakh',
        ),
    ]