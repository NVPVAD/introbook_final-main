from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from acc_intro.models import NewPersonalProfile
import re

class Command(BaseCommand):
    help = 'Migrate existing users to use mobile number as username for login'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be changed without making changes',
        )

    def is_mobile_number(self, text):
        """Check if a string looks like a mobile number"""
        if not text:
            return False
        # Remove any non-digit characters
        digits_only = re.sub(r'\D', '', text)
        # Check if it's 10-15 digits (typical mobile number length)
        return 10 <= len(digits_only) <= 15

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        if dry_run:
            self.stdout.write(self.style.WARNING("DRY RUN MODE - No changes will be made"))
        
        self.stdout.write("Starting user migration to mobile number-based login...")
        
        # Get all users
        users = User.objects.all()
        migrated_count = 0
        skipped_count = 0
        error_count = 0
        
        for user in users:
            self.stdout.write(f"\nProcessing user: {user.username} (ID: {user.id})")
            
            # Check if username is already a mobile number
            if self.is_mobile_number(user.username):
                self.stdout.write(
                    self.style.SUCCESS(f"  ✓ Username '{user.username}' is already a mobile number")
                )
                skipped_count += 1
                continue
            
            # Try to find user's profile and mobile number
            try:
                profile = NewPersonalProfile.objects.get(user=user)
                mobile_number = profile.mobileNumber
                
                if not mobile_number:
                    self.stdout.write(
                        self.style.WARNING(f"  ⚠ No mobile number found in profile for user '{user.username}'")
                    )
                    skipped_count += 1
                    continue
                
                # Check if mobile number is valid
                if not self.is_mobile_number(mobile_number):
                    self.stdout.write(
                        self.style.WARNING(f"  ⚠ Invalid mobile number format: '{mobile_number}' for user '{user.username}'")
                    )
                    skipped_count += 1
                    continue
                
                # Check if another user already has this mobile number as username
                if User.objects.filter(username=mobile_number).exclude(id=user.id).exists():
                    self.stdout.write(
                        self.style.ERROR(f"  ❌ Mobile number '{mobile_number}' is already used by another user")
                    )
                    error_count += 1
                    continue
                
                if dry_run:
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ Would update username from '{user.username}' to '{mobile_number}'")
                    )
                else:
                    # Update username to mobile number
                    old_username = user.username
                    user.username = mobile_number
                    user.save()
                    
                    self.stdout.write(
                        self.style.SUCCESS(f"  ✓ Updated username from '{old_username}' to '{mobile_number}'")
                    )
                
                migrated_count += 1
                
            except NewPersonalProfile.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f"  ⚠ No profile found for user '{user.username}'")
                )
                skipped_count += 1
                continue
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"  ❌ Error processing user '{user.username}': {str(e)}")
                )
                error_count += 1
                continue
        
        # Print summary
        self.stdout.write(f"\n{'='*50}")
        self.stdout.write("MIGRATION SUMMARY")
        self.stdout.write(f"{'='*50}")
        self.stdout.write(f"Total users processed: {len(users)}")
        self.stdout.write(f"Successfully migrated: {migrated_count}")
        self.stdout.write(f"Skipped: {skipped_count}")
        self.stdout.write(f"Errors: {error_count}")
        self.stdout.write(f"{'='*50}")
        
        if migrated_count > 0:
            if dry_run:
                self.stdout.write(
                    self.style.SUCCESS("\n✅ Dry run completed! Run without --dry-run to apply changes.")
                )
            else:
                self.stdout.write(
                    self.style.SUCCESS("\n✅ Migration completed successfully!")
                )
                self.stdout.write("Users can now login using their mobile number instead of username.")
        else:
            self.stdout.write("\nℹ No users needed migration.") 