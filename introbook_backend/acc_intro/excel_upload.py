from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .models import NewPersonalProfile, NewFamilyMember
import pandas as pd
from datetime import datetime

def parse_name(full_name):
    """Parse Gujarati name: પટેલ સ્વ. અમરતલાલ નારણદાસ ભોજાવત or રમાબેન અમરતલાલ ભોજાવત"""
    if not full_name or pd.isna(full_name):
        return '', '', '', ''
    
    name = str(full_name).strip()
    parts = name.split()
    
    if len(parts) < 2:
        return parts[0] if parts else '', '', '', ''
    
    sakh = parts[-1]    # ભોજાવત (last word)
    
    # Check if first word is a surname (like પટેલ, શાહ, etc.) or a name
    # Common Gujarati surnames: પટેલ, શાહ, દવે, જોશી, etc.
    common_surnames = ['પટેલ', 'શાહ', 'દવે', 'જોશી', 'મહેતા', 'પરમાર', 'ઠાકોર', 'વ્યાસ', 'ત્રિવેદી', 'ચૌધરી']
    
    if parts[0] in common_surnames:
        # Has explicit surname: પટેલ સ્વ. અમરતલાલ નારણદાસ ભોજાવત
        surname = parts[0]
    else:
        # No explicit surname: રમાબેન અમરતલાલ ભોજાવત - use sakh as surname
        surname = sakh
    
    # Handle સ્વ. prefix
    if 'સ્વ.' in name or 'સ્વ' in name:
        # Find સ્વ. and get the name after it
        sv_index = -1
        for i, part in enumerate(parts):
            if 'સ્વ' in part:
                sv_index = i
                break
        
        if sv_index >= 0 and sv_index + 1 < len(parts):
            # Name is સ્વ. + next word
            parsed_name = f"સ્વ. {parts[sv_index + 1]}"
            # Father name is the word after name (if exists)
            father_name = parts[sv_index + 2] if sv_index + 2 < len(parts) - 1 else ''
        else:
            parsed_name = 'સ્વ.'
            father_name = ''
    else:
        # No સ્વ., normal parsing
        if parts[0] in common_surnames:
            # Has surname: પટેલ રમાબેન અમરતલાલ ભોજાવત
            parsed_name = parts[1] if len(parts) > 1 else ''
            father_name = parts[2] if len(parts) > 2 else ''
        else:
            # No surname: રમાબેન અમરતલાલ ભોજાવત
            parsed_name = parts[0]
            father_name = parts[1] if len(parts) > 1 else ''
    
    return surname, parsed_name, father_name, sakh

def parse_address(full_address):
    """પાર્સ અડ્રેસ: વ, નીશીથ એપર્ટમેન્ટ, જયહિન્દ ચાર રસ્તા, મણીનગર, અમદાવાદ"""
    if not full_address or pd.isna(full_address) or str(full_address).strip() == 'nan':
        return '', '', ''
    
    address = str(full_address).strip()
    if not address:
        return '', '', ''
    
    # If no comma, treat entire address as address details
    if ',' not in address:
        return address, '', ''
    
    parts = [part.strip() for part in address.split(',')]
    parts = [part for part in parts if part]  # Remove empty parts
    
    if len(parts) == 1:
        return parts[0], '', ''
    elif len(parts) == 2:
        return parts[0], parts[1], ''
    else:
        city = parts[-1]  # Last part as city
        area = parts[-2]  # Second to last as area
        address_details = ', '.join(parts[:-2])  # Rest as address details
        return address_details, area, city

def parse_date(date_str):
    """Parse date from various formats to YYYY-MM-DD"""
    if not date_str or pd.isna(date_str):
        return None
    
    date_str = str(date_str).strip()
    if not date_str or date_str == 'nan':
        return None
    
    try:
        # Handle datetime objects from pandas
        if ' ' in date_str and ':' in date_str:
            date_obj = datetime.strptime(date_str.split(' ')[0], '%Y-%m-%d')
            return date_obj.date()
        # Try DD/MM/YYYY format
        elif '/' in date_str:
            date_obj = datetime.strptime(date_str, '%d/%m/%Y')
            return date_obj.date()
        # Try DD-MM-YYYY format
        elif '-' in date_str and len(date_str.split('-')[0]) <= 2:
            date_obj = datetime.strptime(date_str, '%d-%m-%Y')
            return date_obj.date()
        # Try YYYY-MM-DD format
        elif '-' in date_str:
            date_obj = datetime.strptime(date_str, '%Y-%m-%d')
            return date_obj.date()
    except ValueError:
        print(f"Could not parse date: {date_str}")
        return None
    
    return None

def calculate_age(birth_date):
    """Calculate age from birth date"""
    if not birth_date:
        return None  # No age if no birth date
    
    try:
        from datetime import date
        today = date.today()
        age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
        return max(age, 1)  # Minimum age 1
    except:
        return None  # No age if calculation fails

class UploadExcelView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        try:
            if 'file' not in request.FILES:
                return Response({'success': False, 'error': 'No file uploaded'}, status=400)
            
            uploaded_file = request.FILES['file']
            if not uploaded_file.name.endswith('.xlsx'):
                return Response({'success': False, 'error': 'Only .xlsx files are allowed'}, status=400)
            
            df = pd.read_excel(uploaded_file)
            records_created = 0
            records_skipped = 0
            
            print(f"\n=== EXCEL UPLOAD - PRESERVING EXISTING DATA ===")
            print(f"Current database has {NewPersonalProfile.objects.count()} existing users")
            print(f"Excel file has {len(df)} rows to process")
            
            # Process rows sequentially to handle main members and their families
            current_main = None
            current_profile = None
            
            for index, row in df.iterrows():
                try:
                    col0_value = str(row.iloc[0]).strip() if not pd.isna(row.iloc[0]) else ''
                    member_name = str(row.iloc[1]).strip() if not pd.isna(row.iloc[1]) else ''
                    relation = str(row.iloc[2]).strip() if not pd.isna(row.iloc[2]) else ''
                    
                    # If col0 has value, it's a new main member
                    if col0_value and col0_value != 'nan':
                        current_main = col0_value
                        
                        # Get mobile number - check if પોતે has mobile
                        main_mobile = ''
                        if not pd.isna(row.iloc[7]):
                            try:
                                main_mobile = str(int(row.iloc[7]))
                            except:
                                main_mobile = str(row.iloc[7]).strip()
                        
                        # Parse main member name and get details
                        main_name_to_use = current_main
                        main_row_to_use = row
                        
                        # If પોતે has no mobile, find family member with mobile
                        if not main_mobile or len(main_mobile) < 10:
                            print(f"પોતે {current_main} has no mobile, looking for family member...")
                            
                            # Get all rows for this family
                            family_rows = df[df.iloc[:, 0] == current_main]
                            if len(family_rows) == 0:
                                # Look for family members in subsequent rows
                                family_start = index
                                family_end = index + 1
                                while family_end < len(df) and (pd.isna(df.iloc[family_end, 0]) or df.iloc[family_end, 0] == ''):
                                    family_end += 1
                                family_rows = df.iloc[family_start:family_end]
                            
                            # Find family member with mobile (prioritize: પુત્ર, પત્ની, others)
                            selected_member = None
                            priority_relations = ['પુત્ર', 'પત્ની']  # son, wife
                            
                            # First try priority relations
                            for priority_rel in priority_relations:
                                for _, fam_row in family_rows.iterrows():
                                    fam_relation = str(fam_row.iloc[2]).strip() if not pd.isna(fam_row.iloc[2]) else ''
                                    if priority_rel in fam_relation:
                                        fam_mobile = ''
                                        if not pd.isna(fam_row.iloc[7]):
                                            try:
                                                fam_mobile = str(int(fam_row.iloc[7]))
                                            except:
                                                fam_mobile = str(fam_row.iloc[7]).strip()
                                        
                                        if fam_mobile and len(fam_mobile) >= 10:
                                            selected_member = fam_row
                                            main_mobile = fam_mobile
                                            main_name_to_use = str(fam_row.iloc[1]).strip()
                                            main_row_to_use = fam_row
                                            print(f"Making {main_name_to_use} ({priority_rel}) the main user with mobile: {main_mobile}")
                                            break
                                if selected_member is not None:
                                    break
                            
                            # If no priority relation found, try any family member with mobile
                            if selected_member is None:
                                for _, fam_row in family_rows.iterrows():
                                    fam_relation = str(fam_row.iloc[2]).strip() if not pd.isna(fam_row.iloc[2]) else ''
                                    if fam_relation != 'પોતે':  # Not self
                                        fam_mobile = ''
                                        if not pd.isna(fam_row.iloc[7]):
                                            try:
                                                fam_mobile = str(int(fam_row.iloc[7]))
                                            except:
                                                fam_mobile = str(fam_row.iloc[7]).strip()
                                        
                                        if fam_mobile and len(fam_mobile) >= 10:
                                            selected_member = fam_row
                                            main_mobile = fam_mobile
                                            main_name_to_use = str(fam_row.iloc[1]).strip()
                                            main_row_to_use = fam_row
                                            print(f"Making {main_name_to_use} ({fam_relation}) the main user with mobile: {main_mobile}")
                                            break
                            
                            # If no family member found with mobile
                            if not main_mobile or len(main_mobile) < 10:
                                print(f"No valid mobile found for family of {current_main}, skipping this family")
                                current_profile = None  # Reset to prevent family member processing
                                continue
                        
                        # Parse name and address for the selected main user
                        surname, parsed_name, father_name, sakh = parse_name(main_name_to_use)
                        birthdate = parse_date(main_row_to_use.iloc[3])
                        blood_group = str(main_row_to_use.iloc[4]).strip() if not pd.isna(main_row_to_use.iloc[4]) else ''
                        marital_status = str(main_row_to_use.iloc[5]).strip() if not pd.isna(main_row_to_use.iloc[5]) else ''
                        sakh_from_excel = str(main_row_to_use.iloc[6]).strip() if not pd.isna(main_row_to_use.iloc[6]) else sakh
                        education = str(main_row_to_use.iloc[8]).strip() if not pd.isna(main_row_to_use.iloc[8]) else ''
                        occupation = str(main_row_to_use.iloc[9]).strip() if not pd.isna(main_row_to_use.iloc[9]) else ''
                        full_address = str(main_row_to_use.iloc[10]) if not pd.isna(main_row_to_use.iloc[10]) else ''
                        address_details, area, city = parse_address(full_address)
                        print(f"Main user address parsed: '{full_address}' -> '{address_details}', '{area}', '{city}'")
                        
                        # If main user has no address, use original પોતે's address
                        if main_name_to_use != current_main and (not address_details or address_details.strip() == ''):
                            original_address = str(row.iloc[10]) if not pd.isna(row.iloc[10]) else ''
                            original_address_details, original_area, original_city = parse_address(original_address)
                            address_details, area, city = original_address_details, original_area, original_city
                        
                        # Check if user already exists - PRESERVE EXISTING DATA
                        if main_mobile and len(main_mobile) >= 10:
                            # Check all mobile variants to prevent duplicates
                            clean_main_mobile = main_mobile.replace('+', '').replace(' ', '').replace('-', '')
                            if clean_main_mobile.startswith('91') and len(clean_main_mobile) == 12:
                                clean_main_mobile = clean_main_mobile[2:]
                            
                            mobile_check_variants = [main_mobile, clean_main_mobile]
                            if main_mobile.startswith('+91'):
                                mobile_check_variants.append(main_mobile[3:])
                            
                            # Remove duplicates from check variants
                            mobile_check_variants = list(set(mobile_check_variants))
                            
                            # Check if any variant already exists - PRESERVE EXISTING DATA
                            user_exists = False
                            existing_variant = None
                            for variant in mobile_check_variants:
                                if (User.objects.filter(username=variant).exists() or 
                                    NewPersonalProfile.objects.filter(mobileNumber=variant).exists()):
                                    print(f"✓ PRESERVING: User with mobile {variant} already exists, keeping existing data intact")
                                    user_exists = True
                                    existing_variant = variant
                                    break
                            
                            if user_exists:
                                records_skipped += 1
                                print(f"✓ SKIPPED: {main_name_to_use} (mobile: {existing_variant}) - preserving existing data")
                                current_profile = None  # Reset to prevent family member processing
                                continue
                            
                            try:
                                user = User.objects.create_user(
                                    username=main_mobile,
                                    password='temp123',
                                    first_name=parsed_name[:30] if parsed_name else '',
                                    last_name=surname[:30] if surname else ''
                                )
                                
                                # Create profile for the selected main user
                                calculated_age = calculate_age(birthdate)
                                profile = NewPersonalProfile.objects.create(
                                    user=user,
                                    surname=surname,
                                    name=parsed_name,
                                    fatherName=father_name,
                                    sakh=sakh_from_excel,
                                    age=calculated_age,
                                    dateOfBirth=birthdate,
                                    bloodGroup=blood_group,
                                    maritalStatus='married' if marital_status and ('પરણીત' in marital_status or 'married' in marital_status.lower()) else 'widowed' if marital_status and ('વિધવા' in marital_status or 'widowed' in marital_status.lower()) else 'unmarried' if marital_status and ('અપરણીત' in marital_status or 'single' in marital_status.lower() or 'unmarried' in marital_status.lower()) else 'single' if not marital_status or marital_status.strip() == '' else marital_status.lower(),
                                    education=education,
                                    occupation=occupation,
                                    email=f"{main_mobile}@temp.com",
                                    mobileNumber=main_mobile,
                                    address=address_details,
                                    area=area,
                                    city=city,
                                    password_change_required=True
                                )
                                
                                print(f"✓ CREATED: New user #{profile.user_number} - {surname} {parsed_name} (mobile: {main_mobile})")
                                current_profile = profile
                                records_created += 1
                                
                                # If a family member became main, add original પોતે as family member
                                if main_name_to_use != current_main:
                                    original_surname, original_name, original_father, original_sakh = parse_name(current_main)
                                    
                                    # Get original પોતે's address from his own row
                                    original_address = str(row.iloc[10]) if not pd.isna(row.iloc[10]) else ''
                                    original_address_details, original_area, original_city = parse_address(original_address)
                                    print(f"Original પોતે address parsed: '{original_address}' -> '{original_address_details}', '{original_area}', '{original_city}'")
                                    
                                    # If original પોતે address is empty, use main user's address
                                    if not original_address_details and not original_area and not original_city:
                                        original_address_details, original_area, original_city = address_details, area, city
                                        print(f"Original પોતે had no address, using main user's address: '{address_details}', '{area}', '{city}'")
                                    else:
                                        print(f"Using original પોતે's address: '{original_address_details}', '{original_area}', '{original_city}'")
                                    original_birthdate = parse_date(row.iloc[3])
                                    
                                    # Determine relation of original પોતે to the new main user
                                    selected_relation = str(main_row_to_use.iloc[2]).strip() if not pd.isna(main_row_to_use.iloc[2]) else ''
                                    original_relation = 'other'  # Default
                                    
                                    if 'પુત્ર' in selected_relation:  # If son became main, original is father
                                        original_relation = 'father'
                                    elif 'પત્ની' in selected_relation:  # If wife became main, original is husband
                                        original_relation = 'spouse'
                                    elif 'પુત્રી' in selected_relation:  # If daughter became main, original is father
                                        original_relation = 'father'
                                    elif 'પિતા' in selected_relation:  # If father became main, original is son
                                        original_relation = 'son'
                                    elif 'માતા' in selected_relation:  # If mother became main, original is son
                                        original_relation = 'son'
                                    
                                    # Create family member for original પોતે
                                    original_calculated_age = calculate_age(original_birthdate)
                                    NewFamilyMember.objects.create(
                                        profile=profile,
                                        surname=original_surname,
                                        name=original_name,
                                        fatherName=original_father,
                                        sakh=original_sakh,
                                        memberAge=original_calculated_age,
                                        dateOfBirth=original_birthdate,
                                        relation=original_relation,
                                        email='',
                                        mobileNumber='',  # Original had no mobile
                                        address=original_address_details,
                                        area=original_area,
                                        city=original_city
                                    )
                                    
                                    print(f"Added original પોતે {original_surname} {original_name} as {original_relation} - Address: '{original_address_details}', '{original_area}', '{original_city}'")
                                    
                                    # Store the selected relation for adjusting other family members
                                    current_profile.selected_main_relation = selected_relation
                                    # Store original પોતે's address for family members to use
                                    current_profile.original_address = original_address_details
                                    current_profile.original_area = original_area
                                    current_profile.original_city = original_city
                                    print(f"Stored original પોતે address for inheritance: '{original_address_details}', '{original_area}', '{original_city}'")
                                else:
                                    current_profile.selected_main_relation = 'પોતે'
                                    # Store main user's address for family members to use
                                    current_profile.original_address = address_details
                                    current_profile.original_area = area
                                    current_profile.original_city = city
                                    print(f"Stored main user address for inheritance: '{address_details}', '{area}', '{city}'")
                                
                            except Exception as e:
                                print(f"Error creating user for {main_name_to_use}: {e}")
                                continue
                        
                        # Skip processing this row as family member since it's the main member
                        continue
                    
                    # Process family members (skip if this member became the main user)
                    if current_profile and member_name and relation and relation != 'પોતે' and member_name != main_name_to_use:
                        try:
                            surname, parsed_name, father_name, sakh = parse_name(member_name)
                            birthdate = parse_date(row.iloc[3])
                            blood_group = str(row.iloc[4]).strip() if not pd.isna(row.iloc[4]) else ''
                            marital_status = str(row.iloc[5]).strip() if not pd.isna(row.iloc[5]) and str(row.iloc[5]).strip() else ''
                            sakh_from_excel = str(row.iloc[6]).strip() if not pd.isna(row.iloc[6]) else sakh
                            education = str(row.iloc[8]).strip() if not pd.isna(row.iloc[8]) else ''
                            occupation = str(row.iloc[9]).strip() if not pd.isna(row.iloc[9]) else ''
                            full_address = str(row.iloc[10]) if not pd.isna(row.iloc[10]) else ''
                            address_details, area, city = parse_address(full_address)
                            # If family member has empty address, inherit from original પોતે
                            if not full_address or full_address.strip() == '' or full_address == 'nan':
                                original_address_details = getattr(current_profile, 'original_address', '')
                                original_area = getattr(current_profile, 'original_area', '')
                                original_city = getattr(current_profile, 'original_city', '')
                                address_details, area, city = original_address_details, original_area, original_city
                            
                            # Get mobile number for family member
                            member_mobile = str(row.iloc[7]).strip() if not pd.isna(row.iloc[7]) else ''
                            if member_mobile:
                                try:
                                    member_mobile = str(int(float(member_mobile)))
                                except:
                                    member_mobile = member_mobile.strip()
                            
                            # Only set mobile if it's valid (don't create dummy numbers)
                            if not member_mobile or len(member_mobile) < 10:
                                member_mobile = ''  # Leave empty instead of dummy
                            
                            # Adjust relation based on who became the main member
                            selected_main_relation = getattr(current_profile, 'selected_main_relation', 'પોતે')
                            adjusted_relation = relation
                            
                            # If son became main, adjust all relations relative to son
                            if 'પુત્ર' in selected_main_relation:
                                if relation == 'પત્ની' or relation == 'wife':  # Wife of original becomes mother
                                    adjusted_relation = 'માતા'
                                elif relation == 'પુત્રી' or relation == 'daughter':  # Daughter becomes sister
                                    adjusted_relation = 'બહેન'
                                elif relation == 'ભાઈ' or relation == 'brother':  # Brother becomes brother (stays same)
                                    adjusted_relation = 'brother'
                                elif 'પુત્રવધુ' in relation:  # Daughter-in-law becomes wife
                                    adjusted_relation = 'પત્ની'
                                elif relation == 'પૌત્રી' or relation == 'granddaughter':  # Granddaughter becomes daughter
                                    adjusted_relation = 'પુત્રી'
                                elif relation == 'પૌત્ર' or relation == 'grandson':  # Grandson becomes son
                                    adjusted_relation = 'પુત્ર'
                            
                            # Map both Gujarati and English relations to English
                            relation_mapping = {
                                # Gujarati relations
                                'પુત્ર': 'son',
                                'પુત્રી': 'daughter', 
                                'પત્ની': 'spouse',
                                'પતિ': 'spouse',
                                'પિતા': 'father',
                                'માતા': 'mother',
                                'ભાઈ': 'brother',
                                'ભાઇ': 'brother',
                                'બહેન': 'sister',
                                'દાદા': 'grandfather',
                                'દાદી': 'grandmother',
                                'નાના': 'uncle',
                                'નાની': 'aunt',
                                'પૌત્ર': 'grandson',
                                'પૌત્રી': 'granddaughter',
                                'પુત્રવધુ': 'daughter_in_law',
                                # English relations
                                'son': 'son',
                                'daughter': 'daughter',
                                'spouse': 'spouse',
                                'wife': 'spouse',
                                'husband': 'spouse',
                                'father': 'father',
                                'mother': 'mother',
                                'brother': 'brother',
                                'sister': 'sister',
                                'grandfather': 'grandfather',
                                'grandmother': 'grandmother',
                                'uncle': 'uncle',
                                'aunt': 'aunt',
                                'grandson': 'grandson',
                                'granddaughter': 'granddaughter',
                                'daughter_in_law': 'daughter_in_law'
                            }
                            
                            # Try exact match first, then partial match for Gujarati relations
                            english_relation = relation_mapping.get(adjusted_relation, None)
                            if not english_relation:
                                # Try partial matching for common variations
                                for gujarati_rel, english_rel in relation_mapping.items():
                                    if gujarati_rel in adjusted_relation or adjusted_relation in gujarati_rel:
                                        english_relation = english_rel
                                        break
                                if not english_relation:
                                    english_relation = 'other'
                            
                            if adjusted_relation != relation:
                                print(f"Relation adjusted: {relation} -> {adjusted_relation} -> {english_relation}")
                            
                            member_calculated_age = calculate_age(birthdate)
                            NewFamilyMember.objects.create(
                                profile=current_profile,
                                surname=surname,
                                name=parsed_name,
                                fatherName=father_name,
                                sakh=sakh_from_excel,
                                memberAge=member_calculated_age,
                                dateOfBirth=birthdate,
                                bloodGroup=blood_group,
                                maritalStatus='married' if marital_status and ('પરણીત' in marital_status or 'married' in marital_status.lower()) else 'widowed' if marital_status and ('વિધવા' in marital_status or 'widowed' in marital_status.lower()) else 'unmarried' if marital_status and ('અપરણીત' in marital_status or 'single' in marital_status.lower() or 'unmarried' in marital_status.lower()) else 'single' if not marital_status or marital_status.strip() == '' else marital_status.lower(),
                                education=education,
                                occupation=occupation,
                                relation=english_relation,
                                email=f"{member_mobile}@temp.com" if member_mobile else '',
                                mobileNumber=member_mobile,
                                address=address_details,
                                area=area,
                                city=city
                            )
                            
                            print(f"Added {parsed_name} with address: {address_details}")
                            
                        except Exception as e:
                            print(f"Error creating family member {member_name}: {e}")
                            continue
                        
                except Exception as e:
                    print(f"Error processing row {index}: {e}")
                    continue
            
            print(f"\n=== EXCEL UPLOAD COMPLETED ===")
            print(f"✓ NEW RECORDS CREATED: {records_created}")
            print(f"✓ EXISTING RECORDS PRESERVED: {records_skipped}")
            print(f"✓ TOTAL RECORDS IN DATABASE: {NewPersonalProfile.objects.count()}")
            print(f"================================\n")
            
            return Response({
                'success': True,
                'records_created': records_created,
                'records_skipped': records_skipped,
                'total_database_records': NewPersonalProfile.objects.count(),
                'message': f'Excel upload completed successfully! Created {records_created} new users, preserved {records_skipped} existing users. Total users in database: {NewPersonalProfile.objects.count()}'
            })
            
        except Exception as e:
            print(f"Error processing Excel file: {e}")
            import traceback
            traceback.print_exc()
            return Response({'success': False, 'error': str(e)}, status=500)