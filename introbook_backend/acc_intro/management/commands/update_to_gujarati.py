from django.core.management.base import BaseCommand
from acc_intro.models import NewPersonalProfile, NewFamilyMember

class Command(BaseCommand):
    help = 'Update profile data to Gujarati script'

    def handle(self, *args, **options):
        # Update your specific profile data to Gujarati
        try:
            # Find your profile by mobile number
            profile = NewPersonalProfile.objects.get(mobileNumber='+919104499432')
            
            # Update personal data to Gujarati
            profile.surname = 'મોરાડિયા'
            profile.name = 'ધર્મિક'
            profile.fatherName = 'મનસુખભાઈ'
            profile.motherName = 'પ્રફુલાબેન'
            profile.address = 'ઉમિયા ટાઉન શિપ'
            profile.city = 'સુરેન્દ્રનગર'
            profile.hometown = 'સુરેન્દ્રનગર'
            profile.state = 'ગુજરાત'
            profile.country = 'ભારત'
            profile.occupation = 'વિદ્યાર્થી'
            profile.companyName = 'એલડીઆરપી ઇન્સ્ટિટ્યૂટ ઓફ ટેકનોલોજી એન્ડ રિસર્ચ'
            profile.workAddress = 'સેક્ટર 23'
            profile.instituteName = 'એલડીઆરપી ઇન્સ્ટિટ્યૂટ ઓફ ટેકનોલોજી એન્ડ રિસર્ચ'
            profile.specialization = 'કમ્પ્યુટર એન્જિનિયરિંગ'
            profile.caste = 'કડવા પટેલ'
            profile.subcaste = 'મોરાડિયા'
            profile.religion = 'હિન્દુ'
            profile.hobbies = 'સમય પસાર'
            profile.languagesKnown = 'અંગ્રેજી, હિન્દી, ગુજરાતી, જર્મન'
            profile.skills = 'મશીન લર્નિંગ'
            profile.aboutMe = 'હું કમ્પ્યુટર એન્જિનિયર છું'
            profile.achievements = 'એનએસએસ'
            profile.medicalConditions = 'ના'
            
            profile.save()
            self.stdout.write(self.style.SUCCESS('Successfully updated profile to Gujarati'))
            
            # Update family members data to Gujarati
            family_members = NewFamilyMember.objects.filter(profile=profile)
            
            for member in family_members:
                # Convert common English names to Gujarati
                if member.surname:
                    member.surname = self.translate_name_to_gujarati(member.surname)
                if member.name:
                    member.name = self.translate_name_to_gujarati(member.name)
                if member.fatherName:
                    member.fatherName = self.translate_name_to_gujarati(member.fatherName)
                if member.motherName:
                    member.motherName = self.translate_name_to_gujarati(member.motherName)
                
                # Convert location data
                if member.address:
                    member.address = self.translate_location_to_gujarati(member.address)
                if member.city:
                    member.city = self.translate_location_to_gujarati(member.city)
                if member.hometown:
                    member.hometown = self.translate_location_to_gujarati(member.hometown)
                if member.state:
                    member.state = self.translate_location_to_gujarati(member.state)
                if member.country:
                    member.country = self.translate_location_to_gujarati(member.country)
                
                # Convert professional data
                if member.occupation:
                    member.occupation = self.translate_occupation_to_gujarati(member.occupation)
                if member.companyName:
                    member.companyName = self.translate_company_to_gujarati(member.companyName)
                if member.workAddress:
                    member.workAddress = self.translate_location_to_gujarati(member.workAddress)
                if member.instituteName:
                    member.instituteName = self.translate_company_to_gujarati(member.instituteName)
                if member.specialization:
                    member.specialization = self.translate_specialization_to_gujarati(member.specialization)
                
                # Convert cultural data
                if member.caste:
                    member.caste = self.translate_caste_to_gujarati(member.caste)
                if member.subcaste:
                    member.subcaste = self.translate_caste_to_gujarati(member.subcaste)
                if member.religion:
                    member.religion = self.translate_religion_to_gujarati(member.religion)
                
                # Convert personal data
                if member.hobbies:
                    member.hobbies = self.translate_hobbies_to_gujarati(member.hobbies)
                if member.languagesKnown:
                    member.languagesKnown = self.translate_languages_to_gujarati(member.languagesKnown)
                if member.skills:
                    member.skills = self.translate_skills_to_gujarati(member.skills)
                if member.aboutMember:
                    member.aboutMember = self.translate_about_to_gujarati(member.aboutMember)
                if member.achievements:
                    member.achievements = self.translate_achievements_to_gujarati(member.achievements)
                if member.medicalConditions:
                    member.medicalConditions = self.translate_medical_to_gujarati(member.medicalConditions)
                
                member.save()
            
            self.stdout.write(self.style.SUCCESS(f'Successfully updated {family_members.count()} family members to Gujarati'))
            
        except NewPersonalProfile.DoesNotExist:
            self.stdout.write(self.style.ERROR('Profile not found'))
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'Error: {str(e)}'))
    
    def translate_name_to_gujarati(self, name):
        """Translate common names to Gujarati"""
        name_translations = {
            'Dharmik': 'ધર્મિક',
            'Mansukhbhai': 'મનસુખભાઈ',
            'Prafulaben': 'પ્રફુલાબેન',
            'Moradiya': 'મોરાડિયા',
            'Patel': 'પટેલ',
            'Shah': 'શાહ',
            'Amit': 'અમિત',
            'Priya': 'પ્રિયા',
            'Ravi': 'રવિ',
            'Sita': 'સીતા',
            'Ram': 'રામ',
            'Krishna': 'કૃષ્ણ',
            'Radha': 'રાધા',
            'Arjun': 'અર્જુન',
            'Meera': 'મીરા'
        }
        return name_translations.get(name, name)
    
    def translate_location_to_gujarati(self, location):
        """Translate locations to Gujarati"""
        location_translations = {
            'Surendranagar': 'સુરેન્દ્રનગર',
            'Gujarat': 'ગુજરાત',
            'India': 'ભારત',
            'Ahmedabad': 'અમદાવાદ',
            'Rajkot': 'રાજકોટ',
            'Vadodara': 'વડોદરા',
            'Surat': 'સુરત',
            'Gandhinagar': 'ગાંધીનગર',
            'umiya town ship': 'ઉમિયા ટાઉન શિપ',
            'sector 23': 'સેક્ટર 23'
        }
        return location_translations.get(location, location)
    
    def translate_occupation_to_gujarati(self, occupation):
        """Translate occupations to Gujarati"""
        occupation_translations = {
            'Student': 'વિદ્યાર્થી',
            'Engineer': 'એન્જિનિયર',
            'Doctor': 'ડૉક્ટર',
            'Teacher': 'શિક્ષક',
            'Farmer': 'ખેડૂત',
            'Business': 'વ્યવસાય',
            'Housewife': 'ગૃહિણી'
        }
        return occupation_translations.get(occupation, occupation)
    
    def translate_company_to_gujarati(self, company):
        """Translate company names to Gujarati"""
        company_translations = {
            'LDRP Institute of technology and research': 'એલડીઆરપી ઇન્સ્ટિટ્યૂટ ઓફ ટેકનોલોજી એન્ડ રિસર્ચ'
        }
        return company_translations.get(company, company)
    
    def translate_specialization_to_gujarati(self, specialization):
        """Translate specializations to Gujarati"""
        specialization_translations = {
            'Computer engineering': 'કમ્પ્યુટર એન્જિનિયરિંગ',
            'Mechanical engineering': 'મિકેનિકલ એન્જિનિયરિંગ',
            'Civil engineering': 'સિવિલ એન્જિનિયરિંગ',
            'Electrical engineering': 'ઇલેક્ટ્રિકલ એન્જિનિયરિંગ'
        }
        return specialization_translations.get(specialization, specialization)
    
    def translate_caste_to_gujarati(self, caste):
        """Translate caste to Gujarati"""
        caste_translations = {
            'Kadva Patel': 'કડવા પટેલ',
            'Moradiya': 'મોરાડિયા',
            'Patel': 'પટેલ',
            'Shah': 'શાહ'
        }
        return caste_translations.get(caste, caste)
    
    def translate_religion_to_gujarati(self, religion):
        """Translate religion to Gujarati"""
        religion_translations = {
            'Hindu': 'હિન્દુ',
            'Muslim': 'મુસ્લિમ',
            'Christian': 'ખ્રિસ્તી',
            'Jain': 'જૈન'
        }
        return religion_translations.get(religion, religion)
    
    def translate_hobbies_to_gujarati(self, hobbies):
        """Translate hobbies to Gujarati"""
        hobbies_translations = {
            'time pass': 'સમય પસાર',
            'reading': 'વાંચન',
            'cricket': 'ક્રિકેટ',
            'music': 'સંગીત',
            'dancing': 'નૃત્ય'
        }
        return hobbies_translations.get(hobbies, hobbies)
    
    def translate_languages_to_gujarati(self, languages):
        """Translate languages to Gujarati"""
        languages_translations = {
            'English, Hindi, Gujarati, Germany': 'અંગ્રેજી, હિન્દી, ગુજરાતી, જર્મન',
            'English, Hindi, Gujarati': 'અંગ્રેજી, હિન્દી, ગુજરાતી',
            'Hindi, Gujarati': 'હિન્દી, ગુજરાતી'
        }
        return languages_translations.get(languages, languages)
    
    def translate_skills_to_gujarati(self, skills):
        """Translate skills to Gujarati"""
        skills_translations = {
            'Machine learning': 'મશીન લર્નિંગ',
            'Programming': 'પ્રોગ્રામિંગ',
            'Web development': 'વેબ ડેવલપમેન્ટ'
        }
        return skills_translations.get(skills, skills)
    
    def translate_about_to_gujarati(self, about):
        """Translate about section to Gujarati"""
        about_translations = {
            'I am coumputer engineer': 'હું કમ્પ્યુટર એન્જિનિયર છું',
            'I am student': 'હું વિદ્યાર્થી છું'
        }
        return about_translations.get(about, about)
    
    def translate_achievements_to_gujarati(self, achievements):
        """Translate achievements to Gujarati"""
        achievements_translations = {
            'Nss': 'એનએસએસ',
            'NSS': 'એનએસએસ'
        }
        return achievements_translations.get(achievements, achievements)
    
    def translate_medical_to_gujarati(self, medical):
        """Translate medical conditions to Gujarati"""
        medical_translations = {
            'NO': 'ના',
            'No': 'ના',
            'None': 'કંઈ નહીં'
        }
        return medical_translations.get(medical, medical)