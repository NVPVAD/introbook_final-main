from django.core.management.base import BaseCommand
from acc_intro.models import NewPersonalProfile, NewFamilyMember
from acc_intro.relation_utils import transform_family_relations_when_member_becomes_main, check_if_main_member_has_no_main

class Command(BaseCommand):
    help = 'Apply relation transformation logic when પોતે has no main member'

    def add_arguments(self, parser):
        parser.add_argument(
            '--profile-id',
            type=int,
            help='Specific profile ID to check and transform'
        )
        parser.add_argument(
            '--member-id',
            type=int,
            help='Specific family member ID to make main member'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Show what would be done without making changes'
        )

    def handle(self, *args, **options):
        if options['member_id']:
            # Transform specific family member to main member
            try:
                member = NewFamilyMember.objects.get(id=options['member_id'])
                
                if options['dry_run']:
                    self.stdout.write(
                        f"DRY RUN: Would transform {member.surname} {member.name} "
                        f"({member.relation}) to main member"
                    )
                else:
                    new_main_profile = transform_family_relations_when_member_becomes_main(member)
                    self.stdout.write(
                        self.style.SUCCESS(
                            f"Successfully transformed {member.surname} {member.name} "
                            f"to main member. New profile ID: {new_main_profile.id}"
                        )
                    )
            except NewFamilyMember.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"Family member with ID {options['member_id']} not found")
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f"Error transforming member: {str(e)}")
                )
                
        elif options['profile_id']:
            # Check specific profile
            try:
                profile = NewPersonalProfile.objects.get(id=options['profile_id'])
                has_no_main = check_if_main_member_has_no_main(profile)
                
                self.stdout.write(
                    f"Profile {profile.surname} {profile.name} "
                    f"{'has no main member' if has_no_main else 'has main member'}"
                )
                
                if has_no_main:
                    family_members = profile.family_members.all()
                    self.stdout.write("Family members who could become main:")
                    for member in family_members:
                        self.stdout.write(
                            f"  - {member.surname} {member.name} ({member.relation}) "
                            f"[ID: {member.id}]"
                        )
                        
            except NewPersonalProfile.DoesNotExist:
                self.stdout.write(
                    self.style.ERROR(f"Profile with ID {options['profile_id']} not found")
                )
        else:
            # Check all profiles for those with no main member
            profiles_with_no_main = []
            
            for profile in NewPersonalProfile.objects.all():
                if check_if_main_member_has_no_main(profile):
                    profiles_with_no_main.append(profile)
            
            if profiles_with_no_main:
                self.stdout.write(
                    f"Found {len(profiles_with_no_main)} profiles with no main member:"
                )
                for profile in profiles_with_no_main:
                    self.stdout.write(
                        f"  - {profile.surname} {profile.name} [ID: {profile.id}]"
                    )
                    family_members = profile.family_members.all()
                    for member in family_members:
                        self.stdout.write(
                            f"    └─ {member.surname} {member.name} ({member.relation}) "
                            f"[Member ID: {member.id}]"
                        )
            else:
                self.stdout.write("No profiles found with no main member")