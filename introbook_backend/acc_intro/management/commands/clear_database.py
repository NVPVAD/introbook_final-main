from django.core.management.base import BaseCommand
from django.db import transaction
from django.contrib.auth.models import User
from acc_intro.models import (
    UserProfile, OTP, Family, FamilyMember, NewPersonalProfile, 
    NewFamilyMember, FamilyMemberAuth, FeaturedFamily, FamilyConnection,
    CommunityActivity, PrivateMessage, FamilyEvent, EventInvitation, FamilyUpdate
)

class Command(BaseCommand):
    help = 'Clears all data from database tables while preserving table structure'

    def handle(self, *args, **options):
        self.stdout.write(self.style.WARNING('⚠️  This will delete ALL data from the database!'))
        self.stdout.write(self.style.WARNING('Tables will remain intact, only data will be removed.'))
        
        confirm = input('Are you sure you want to continue? Type "yes" to confirm: ')
        
        if confirm.lower() != 'yes':
            self.stdout.write(self.style.ERROR('❌ Operation cancelled.'))
            return
        
        try:
            with transaction.atomic():
                # Delete in reverse order of dependencies to avoid foreign key constraints
                models_to_clear = [
                    ('EventInvitation', EventInvitation),
                    ('FamilyEvent', FamilyEvent),
                    ('FamilyUpdate', FamilyUpdate),
                    ('PrivateMessage', PrivateMessage),
                    ('CommunityActivity', CommunityActivity),
                    ('FamilyConnection', FamilyConnection),
                    ('FeaturedFamily', FeaturedFamily),
                    ('FamilyMemberAuth', FamilyMemberAuth),
                    ('NewFamilyMember', NewFamilyMember),
                    ('NewPersonalProfile', NewPersonalProfile),
                    ('FamilyMember', FamilyMember),
                    ('Family', Family),
                    ('OTP', OTP),
                    ('UserProfile', UserProfile),
                    ('User', User),
                ]
                
                total_deleted = 0
                
                for model_name, model_class in models_to_clear:
                    count = model_class.objects.count()
                    if count > 0:
                        model_class.objects.all().delete()
                        total_deleted += count
                        self.stdout.write(
                            self.style.SUCCESS(f'✅ Cleared {count} records from {model_name}')
                        )
                    else:
                        self.stdout.write(f'ℹ️  {model_name} was already empty')
                
                self.stdout.write(
                    self.style.SUCCESS(f'\n🎉 Successfully cleared {total_deleted} total records from database!')
                )
                self.stdout.write(
                    self.style.SUCCESS('📋 All table structures have been preserved.')
                )
                
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Error occurred while clearing database: {str(e)}')
            )