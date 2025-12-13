from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .models import NewPersonalProfile, NewFamilyMember
import pandas as pd

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
    if not full_address or pd.isna(full_address):
        return '', '', ''
    
    address = str(full_address).strip()
    parts = [part.strip() for part in address.split(',')]
    
    if len(parts) < 2:
        return address, '', ''
    
    city = parts[-1].strip()  # અમદાવાદ (last part)
    area = parts[-2].strip() if len(parts) > 1 else ''  # મણીનગર (second to last)
    
    # Remaining parts as address details
    address_details = ', '.join(parts[:-2]) if len(parts) > 2 else ''
    
    return address_details, area, city

def extract_mobile_number(row, start_col=7, end_col=12):
    """Extract mobile number from multiple columns"""
    for mobile_col in range(start_col, min(end_col, len(row))):
        if not pd.isna(row.iloc[mobile_col]):
            mobile_val = str(row.iloc[mobile_col]).strip()
            # Check if it looks like a mobile number
            clean_mobile = mobile_val.replace(' ', '').replace('-', '').replace('+', '').replace('(', '').replace(')', '')
            if clean_mobile.isdigit() and len(clean_mobile) >= 10:
                return clean_mobile
    return ''

def extract_address(row, start_col=8, end_col=13):
    """Extract address from multiple columns"""
    for addr_col in range(start_col, min(end_col, len(row))):
        if not pd.isna(row.iloc[addr_col]):
            addr_val = str(row.iloc[addr_col]).strip()
            if addr_val and addr_val != 'nan' and len(addr_val) > 5:  # Looks like address
                return addr_val
    return ''

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
            # REMOVED: Clear existing test data - now preserving all data
            
            # Debug: Print first few rows to understand structure
            print("Excel structure:")
            for i in range(min(5, len(df))):
                print(f"Row {i}: Col0={df.iloc[i, 0]}, Col1={df.iloc[i, 1]}, Col2={df.iloc[i, 2]}")
            
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
                        
                        # Get mobile number using improved function
                        main_mobile = extract_mobile_number(row)
                        
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
                                        fam_mobile = extract_mobile_number(fam_row)
                                        
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
                                        fam_mobile = extract_mobile_number(fam_row)
                                        
                                        if fam_mobile and len(fam_mobile) >= 10:
                                            selected_member = fam_row
                                            main_mobile = fam_mobile
                                            main_name_to_use = str(fam_row.iloc[1]).strip()
                                            main_row_to_use = fam_row
                                            print(f"Making {main_name_to_use} ({fam_relation}) the main user with mobile: {main_mobile}")
                                            break
                            
                            if selected_member is None:
                                print(f"No family member with mobile found for {current_main}, skipping...")
                                continue
                        
                        # Parse the selected main member name
                        surname, name, father_name, sakh = parse_name(main_name_to_use)
                        
                        if not main_mobile or len(main_mobile) < 10:
                            print(f"Invalid mobile for {current_main}: {main_mobile}")
                            continue
                        
                        # Check if user already exists - PRESERVE EXISTING DATA
                        clean_main_mobile = main_mobile.replace('+', '').replace(' ', '').replace('-', '')
                        if clean_main_mobile.startswith('91') and len(clean_main_mobile) == 12:
                            clean_main_mobile = clean_main_mobile[2:]
                        
                        mobile_check_variants = [main_mobile, clean_main_mobile]
                        if main_mobile.startswith('+91'):
                            mobile_check_variants.append(main_mobile[3:])
                        
                        # Check if any variant already exists - PRESERVE EXISTING DATA
                        user_exists = False
                        for variant in mobile_check_variants:
                            if (User.objects.filter(username=variant).exists() or 
                                NewPersonalProfile.objects.filter(mobileNumber=variant).exists()):
                                print(f"✓ PRESERVING: User with mobile {variant} already exists, keeping existing data intact")
                                user_exists = True
                                break
                        
                        if user_exists:
                            records_skipped += 1
                            current_profile = None
                            continue
                        
                        # Create main user
                        user = User.objects.create_user(
                            username=main_mobile,
                            password='temp123',
                            first_name=name or current_main
                        )
                        
                        # Extract marital status from the selected main row
                        marital_status_raw = str(main_row_to_use.iloc[5]).strip() if not pd.isna(main_row_to_use.iloc[5]) else ''
                        print(f"Raw marital status: '{marital_status_raw}'")
                        
                        # Check for Gujarati terms
                        if 'પરણીત' in marital_status_raw:
                            marital_status = 'married'
                        elif 'અપરણીત' in marital_status_raw:
                            marital_status = 'unmarried'
                        elif marital_status_raw.lower() in ['married', 'unmarried']:
                            marital_status = 'married' if marital_status_raw.lower() == 'married' else 'unmarried'
                        else:
                            marital_status = ''
                        
                        print(f"Processed marital status: '{marital_status}'")
                        
                        # Parse birthdate if available
                        main_birthdate = None
                        if not pd.isna(main_row_to_use.iloc[3]):
                            try:
                                # Handle dd/mm/yyyy format
                                date_str = str(main_row_to_use.iloc[3]).strip()
                                if '/' in date_str:
                                    # dd/mm/yyyy format
                                    main_birthdate = pd.to_datetime(date_str, format='%d/%m/%Y').date()
                                else:
                                    # Try default parsing
                                    main_birthdate = pd.to_datetime(date_str).date()
                                print(f"Parsed birthdate: {main_birthdate}")
                            except Exception as date_error:
                                print(f"Date parsing error: {date_error}")
                                main_birthdate = None
                        
                        # Parse address using improved function
                        full_address = extract_address(main_row_to_use)
                        address_details, area, city = parse_address(full_address)
                        print(f"Parsed address - Details: '{address_details}', Area: '{area}', City: '{city}'")
                        
                        current_profile = NewPersonalProfile.objects.create(
                            user=user,
                            surname=surname,
                            name=name,
                            fatherName=father_name,
                            mobileNumber=main_mobile,
                            email=f"{main_mobile}@temp.com",
                            age=30,
                            dateOfBirth=main_birthdate,
                            sakh=sakh,
                            education=str(main_row_to_use.iloc[8]).strip() if not pd.isna(main_row_to_use.iloc[8]) else '',
                            occupation=str(main_row_to_use.iloc[9]).strip() if not pd.isna(main_row_to_use.iloc[9]) else '',
                            address=address_details or full_address,
                            area=area,
                            city=city,
                            bloodGroup=str(main_row_to_use.iloc[4]).strip() if not pd.isna(main_row_to_use.iloc[4]) else '',
                            maritalStatus=marital_status
                        )
                        
                        records_created += 1
                        print(f"Created main user: {name} with mobile: {main_mobile}, address: {address_details or full_address}, area: {area}, city: {city}")
                        
                        # If we selected a family member as main user, add original પોતે and other family members
                        if main_name_to_use != current_main:
                            # Add original પોતે as father
                            orig_surname, orig_name, orig_father_name, orig_sakh = parse_name(current_main)
                            
                            NewFamilyMember.objects.create(
                                profile=current_profile,
                                surname=orig_surname,
                                name=orig_name,
                                fatherName=orig_father_name,
                                relation='પિતા',  # Father
                                memberAge=55,
                                bloodGroup='',
                                maritalStatus='married',
                                sakh=orig_sakh,
                                education='',
                                occupation='',
                                address='',
                                area='',
                                city='',
                                mobileNumber=''
                            )
                            print(f"Added original પોતે {orig_name} as father")
                            
                            # Add other family members based on who became main user
                            selected_relation = str(main_row_to_use.iloc[2]).strip() if not pd.isna(main_row_to_use.iloc[2]) else ''
                            
                            for _, fam_row in family_rows.iterrows():
                                fam_relation = str(fam_row.iloc[2]).strip() if not pd.isna(fam_row.iloc[2]) else ''
                                fam_name = str(fam_row.iloc[1]).strip() if not pd.isna(fam_row.iloc[1]) else ''
                                
                                # Skip if this is the selected main user or પોતે
                                if fam_name == main_name_to_use or fam_relation == 'પોતે':
                                    continue
                                
                                # Determine relationship to new main user
                                new_relation = fam_relation
                                if 'પત્ની' in fam_relation:
                                    if 'પુત્ર' in selected_relation:
                                        new_relation = 'માતા'  # Mother (if son became main)
                                    else:
                                        new_relation = 'પત્ની'  # Wife
                                elif 'પુત્ર' in fam_relation:
                                    if 'પત્ની' in selected_relation:
                                        new_relation = 'પુત્ર'  # Son
                                    else:
                                        new_relation = 'ભાઈ'  # Brother
                                
                                if fam_name:
                                    f_surname, f_name, f_father_name, f_sakh = parse_name(fam_name)
                                    
                                    # Extract marital status
                                    fam_marital_raw = str(fam_row.iloc[5]).strip() if not pd.isna(fam_row.iloc[5]) else ''
                                    if 'પરણીત' in fam_marital_raw:
                                        fam_marital_status = 'married'
                                    elif 'અપરણીત' in fam_marital_raw:
                                        fam_marital_status = 'unmarried'
                                    elif fam_marital_raw.lower() in ['married', 'unmarried']:
                                        fam_marital_status = 'married' if fam_marital_raw.lower() == 'married' else 'unmarried'
                                    else:
                                        fam_marital_status = ''
                                    
                                    # Parse birthdate if available
                                    fam_birthdate = None
                                    if not pd.isna(fam_row.iloc[3]):
                                        try:
                                            # Handle dd/mm/yyyy format
                                            date_str = str(fam_row.iloc[3]).strip()
                                            if '/' in date_str:
                                                # dd/mm/yyyy format
                                                fam_birthdate = pd.to_datetime(date_str, format='%d/%m/%Y').date()
                                            else:
                                                # Try default parsing
                                                fam_birthdate = pd.to_datetime(date_str).date()
                                        except Exception as date_error:
                                            print(f"Family member date parsing error: {date_error}")
                                            fam_birthdate = None
                                    
                                    # Extract mobile number and address using improved functions
                                    fam_mobile = extract_mobile_number(fam_row)
                                    fam_full_address = extract_address(fam_row)
                                    fam_address_details, fam_area, fam_city = parse_address(fam_full_address)
                                    
                                    NewFamilyMember.objects.create(
                                        profile=current_profile,
                                        surname=f_surname or current_profile.surname,
                                        name=f_name,
                                        fatherName=f_father_name,
                                        relation=new_relation,
                                        memberAge=45,
                                        dateOfBirth=fam_birthdate,
                                        mobileNumber=fam_mobile,
                                        bloodGroup=str(fam_row.iloc[4]).strip() if not pd.isna(fam_row.iloc[4]) else '',
                                        maritalStatus=fam_marital_status,
                                        sakh=f_sakh,
                                        education=str(fam_row.iloc[8]).strip() if not pd.isna(fam_row.iloc[8]) else '',
                                        occupation=str(fam_row.iloc[9]).strip() if not pd.isna(fam_row.iloc[9]) else '',
                                        address=fam_address_details or fam_full_address,
                                        area=fam_area,
                                        city=fam_city
                                    )
                                    print(f"Added {f_name} as {new_relation} with mobile: {fam_mobile}, address: {fam_address_details or fam_full_address}")
                    
                    # If col0 is empty but we have current_main, it's a family member
                    elif current_main and current_profile and member_name and relation != 'પોતે':
                        try:
                            # Skip if this member was already added as main user
                            if member_name == main_name_to_use:
                                print(f"Skipping {member_name} as they are the main user")
                                continue
                                
                            # Parse family member name
                            f_surname, f_name, f_father_name, f_sakh = parse_name(member_name)
                            
                            # Parse birthdate if available
                            birthdate = None
                            if not pd.isna(row.iloc[3]):
                                try:
                                    # Handle dd/mm/yyyy format
                                    date_str = str(row.iloc[3]).strip()
                                    if '/' in date_str:
                                        # dd/mm/yyyy format
                                        birthdate = pd.to_datetime(date_str, format='%d/%m/%Y').date()
                                    else:
                                        # Try default parsing
                                        birthdate = pd.to_datetime(date_str).date()
                                except Exception as date_error:
                                    print(f"Family member date parsing error: {date_error}")
                                    birthdate = None
                            
                            # Extract marital status for family member
                            fam_marital_raw = str(row.iloc[5]).strip() if not pd.isna(row.iloc[5]) else ''
                            print(f"Family member raw marital status: '{fam_marital_raw}'")
                            
                            # Check for Gujarati terms
                            if 'પરણીત' in fam_marital_raw:
                                fam_marital_status = 'married'
                            elif 'અપરણીત' in fam_marital_raw:
                                fam_marital_status = 'unmarried'
                            elif fam_marital_raw.lower() in ['married', 'unmarried']:
                                fam_marital_status = 'married' if fam_marital_raw.lower() == 'married' else 'unmarried'
                            else:
                                fam_marital_status = ''
                            
                            print(f"Family member processed marital status: '{fam_marital_status}'")
                            
                            # Extract mobile number and address using improved functions
                            member_mobile = extract_mobile_number(row)
                            member_full_address = extract_address(row)
                            member_address_details, member_area, member_city = parse_address(member_full_address)
                            
                            family_member = NewFamilyMember.objects.create(
                                profile=current_profile,
                                surname=f_surname or current_profile.surname,
                                name=f_name or member_name,
                                fatherName=f_father_name or current_profile.fatherName,
                                relation=relation,
                                memberAge=25,
                                dateOfBirth=birthdate,
                                mobileNumber=member_mobile,
                                bloodGroup=str(row.iloc[4]).strip() if not pd.isna(row.iloc[4]) else '',
                                maritalStatus=fam_marital_status,
                                sakh=f_sakh,
                                education=str(row.iloc[8]).strip() if not pd.isna(row.iloc[8]) else '',
                                occupation=str(row.iloc[9]).strip() if not pd.isna(row.iloc[9]) else '',
                                address=member_address_details or member_full_address,
                                area=member_area,
                                city=member_city
                            )
                                
                            print(f"Created family member: {f_name} ({relation}) with mobile: {member_mobile}, address: {member_address_details or member_full_address} for {current_profile.name}")
                        except Exception as family_error:
                            print(f"Family member error: {str(family_error)}")
                            continue
                    
                except Exception as e:
                    print(f"Row error at index {index}: {str(e)}")
                    import traceback
                    traceback.print_exc()
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
                'message': f'Excel upload completed! Created {records_created} new users, preserved {records_skipped} existing users. Total: {NewPersonalProfile.objects.count()}'
            })
            
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=500)