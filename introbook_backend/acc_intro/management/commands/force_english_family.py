from django.core.management.base import BaseCommand
from acc_intro.models import NewPersonalProfile, NewFamilyMember

class Command(BaseCommand):
    help = 'Force all family member data to English'

    def handle(self, *args, **options):
        try:
            profile = NewPersonalProfile.objects.get(mobileNumber='+919104499432')
            family_members = NewFamilyMember.objects.filter(profile=profile)
            
            for member in family_members:
                # Force all text fields to English
                member.surname = 'Moradiya'
                member.name = 'Family Member'
                member.fatherName = 'Mansukhbhai'
                member.motherName = 'Prafulaben'
                member.gender = 'Male'
                member.maritalStatus = 'Single'
                member.relation = 'Son'
                member.address = 'umiya town ship'
                member.city = 'surendranagar'
                member.hometown = 'Surendranagar'
                member.state = 'Gujarat'
                member.country = 'India'
                member.occupation = 'Student'
                member.companyName = 'LDRP Institute'
                member.workAddress = 'sector 23'
                member.education = "Bachelor's Degree"
                member.instituteName = 'LDRP Institute'
                member.specialization = 'Computer engineering'
                member.caste = 'Kadva Patel'
                member.subcaste = 'Moradiya'
                member.religion = 'Hindu'
                member.hobbies = 'time pass'
                member.languagesKnown = 'English, Hindi, Gujarati'
                member.skills = 'Programming'
                member.aboutMember = 'Family member'
                member.achievements = 'None'
                member.medicalConditions = 'NO'
                member.save()
            
            self.stdout.write(self.style.SUCCESS(f'Forced {family_members.count()} family members to English'))
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))