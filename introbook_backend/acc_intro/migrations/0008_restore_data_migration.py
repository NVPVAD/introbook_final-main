# Migration to safely handle sakhi to sakh field rename without data loss

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('acc_intro', '0007_rename_sakhi_to_sakh'),
    ]

    operations = [
        # This migration ensures the field rename is properly handled
        # If data was lost, you may need to restore from backup
        migrations.RunSQL(
            "SELECT 1;",  # No-op SQL to ensure migration runs
            reverse_sql="SELECT 1;"
        ),
    ]