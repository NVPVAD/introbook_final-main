from django.core.management.base import BaseCommand
from acc_intro.models import NewPersonalProfile, NewFamilyMember

class Command(BaseCommand):
    help = 'Revert all data back to English'

    def handle(self, *args, **options):
        try:
            # Find your profile by mobile number
            profile = NewPersonalProfile.objects.get(mobileNumber='+919104499432')
            
            # Revert personal data back to English
            profile.surname = 'Moradiya'
            profile.name = 'Dharmik'
            profile.fatherName = 'Mansukhbhai'
            profile.motherName = 'Prafulaben'
            profile.address = 'umiya town ship'
            profile.city = 'surendranagar'
            profile.hometown = 'Surendranagar'
            profile.state = 'Gujarat'
            profile.country = 'India'
            profile.occupation = 'Student'
            profile.companyName = 'LDRP Institute of technology and research'
            profile.workAddress = 'sector 23'
            profile.instituteName = 'LDRP Institute of technology and research'
            profile.specialization = 'Computer engineering'
            profile.caste = 'Kadva Patel'
            profile.subcaste = 'Moradiya'
            profile.religion = 'Hindu'
            profile.hobbies = 'time pass'
            profile.languagesKnown = 'English, Hindi, Gujarati, Germany'
            profile.skills = 'Machine learning'
            profile.aboutMe = 'I am coumputer engineer'
            profile.achievements = 'Nss'
            profile.medicalConditions = 'NO'
            profile.gender = 'Male'
            profile.maritalStatus = 'Single'
            profile.education = "Bachelor's Degree"
            profile.incomeRange = 'Below 1 Lakh'
            profile.bloodGroup = 'A+'
            
            profile.save()
            self.stdout.write(self.style.SUCCESS('Successfully reverted profile to English'))
            
            # Revert family members data to English
            family_members = NewFamilyMember.objects.filter(profile=profile)
            
            for member in family_members:
                # Revert common fields back to English
                if member.state:
                    member.state = 'Gujarat'
                if member.country:
                    member.country = 'India'
                if member.religion:
                    member.religion = 'Hindu'
                if member.caste:
                    member.caste = 'Kadva Patel'
                if member.subcaste:
                    member.subcaste = 'Moradiya'
                if member.city and 'સુરેન્દ્રનગર' in member.city:
                    member.city = 'surendranagar'
                if member.hometown and 'સુરેન્દ્રનગર' in member.hometown:
                    member.hometown = 'Surendranagar'
                if member.occupation and 'વિદ્યાર્થી' in member.occupation:
                    member.occupation = 'Student'
                if member.gender:
                    if 'પુરુષ' in member.gender:
                        member.gender = 'Male'
                    elif 'સ્ત્રી' in member.gender:
                        member.gender = 'Female'
                if member.maritalStatus:
                    if 'અવિવાહિત' in member.maritalStatus:
                        member.maritalStatus = 'Single'
                    elif 'વિવાહિત' in member.maritalStatus:
                        member.maritalStatus = 'Married'
                if member.education:
                    if 'સ્નાતક' in member.education:
                        member.education = "Bachelor's Degree"
                
                member.save()
            
            self.stdout.write(self.style.SUCCESS(f'Successfully reverted {family_members.count()} family members to English'))
            
        except NewPersonalProfile.DoesNotExist:
            self.stdout.write(self.style.ERROR('Profile not found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))