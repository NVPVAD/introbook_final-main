# Safe migration to rename sakhi to sakh without data loss

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('acc_intro', '0008_restore_data_migration'),
    ]

    operations = [
        # Check if sakhi column exists and rename it to sakh
        migrations.RunSQL(
            """
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'acc_intro_newpersonalprofile' 
                    AND column_name = 'sakhi'
                ) THEN
                    ALTER TABLE acc_intro_newpersonalprofile RENAME COLUMN sakhi TO sakh;
                END IF;
                
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'acc_intro_newfamilymember' 
                    AND column_name = 'sakhi'
                ) THEN
                    ALTER TABLE acc_intro_newfamilymember RENAME COLUMN sakhi TO sakh;
                END IF;
            END $$;
            """,
            reverse_sql="""
            DO $$
            BEGIN
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'acc_intro_newpersonalprofile' 
                    AND column_name = 'sakh'
                ) THEN
                    ALTER TABLE acc_intro_newpersonalprofile RENAME COLUMN sakh TO sakhi;
                END IF;
                
                IF EXISTS (
                    SELECT 1 FROM information_schema.columns 
                    WHERE table_name = 'acc_intro_newfamilymember' 
                    AND column_name = 'sakh'
                ) THEN
                    ALTER TABLE acc_intro_newfamilymember RENAME COLUMN sakh TO sakhi;
                END IF;
            END $$;
            """
        ),
    ]