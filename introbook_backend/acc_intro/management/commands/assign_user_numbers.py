from django.core.management.base import BaseCommand
from acc_intro.models import NewPersonalProfile, NewFamilyMember


class Command(BaseCommand):
    help = 'Assign sequential numbers to existing users and family members'

    def handle(self, *args, **options):
        # Assign user numbers to main users
        main_users = NewPersonalProfile.objects.filter(user_number__isnull=True).order_by('id')
        user_counter = 1
        
        # Get the highest existing user number
        last_user = NewPersonalProfile.objects.exclude(user_number__isnull=True).order_by('-user_number').first()
        if last_user:
            user_counter = last_user.user_number + 1
        
        for user in main_users:
            user.user_number = user_counter
            user.save()
            self.stdout.write(f'Assigned user number {user_counter} to {user.surname} {user.name}')
            user_counter += 1
        
        # Assign member numbers to family members
        family_members = NewFamilyMember.objects.filter(member_number__isnull=True).order_by('id')
        member_counter = 1
        
        # Get the highest existing member number
        last_member = NewFamilyMember.objects.exclude(member_number__isnull=True).order_by('-member_number').first()
        if last_member:
            member_counter = last_member.member_number + 1
        
        for member in family_members:
            member.member_number = member_counter
            member.save()
            self.stdout.write(f'Assigned member number {member_counter} to {member.surname} {member.name}')
            member_counter += 1
        
        self.stdout.write(
            self.style.SUCCESS(
                f'Successfully assigned numbers to {main_users.count()} users and {family_members.count()} family members'
            )
        )