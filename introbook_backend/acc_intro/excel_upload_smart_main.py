from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .models import NewPersonalProfile, NewFamilyMember
import pandas as pd

def parse_name(full_name):
    if not full_name or pd.isna(full_name):
        return '', '', '', ''
    
    name = str(full_name).strip()
    parts = name.split()
    
    if len(parts) < 2:
        return parts[0] if parts else '', '', '', ''
    
    sakh = parts[-1]
    common_surnames = ['પટેલ', 'શાહ', 'દવે', 'જોશી', 'મહેતા', 'પરમાર', 'ઠાકોર', 'વ્યાસ', 'ત્રિવેદી', 'ચૌધરી']
    
    if parts[0] in common_surnames:
        surname = parts[0]
    else:
        surname = sakh
    
    if 'સ્વ.' in name or 'સ્વ' in name:
        sv_index = -1
        for i, part in enumerate(parts):
            if 'સ્વ' in part:
                sv_index = i
                break
        
        if sv_index >= 0 and sv_index + 1 < len(parts):
            parsed_name = f"સ્વ. {parts[sv_index + 1]}"
            father_name = parts[sv_index + 2] if sv_index + 2 < len(parts) - 1 else ''
        else:
            parsed_name = 'સ્વ.'
            father_name = ''
    else:
        if parts[0] in common_surnames:
            parsed_name = parts[1] if len(parts) > 1 else ''
            father_name = parts[2] if len(parts) > 2 else ''
        else:
            parsed_name = parts[0]
            father_name = parts[1] if len(parts) > 1 else ''
    
    return surname, parsed_name, father_name, sakh

def parse_address(full_address):
    if not full_address or pd.isna(full_address):
        return '', '', ''
    
    address = str(full_address).strip()
    parts = [part.strip() for part in address.split(',')]
    
    if len(parts) < 2:
        return address, '', ''
    
    city = parts[-1].strip()
    area = parts[-2].strip() if len(parts) > 1 else ''
    address_details = ', '.join(parts[:-2]) if len(parts) > 2 else ''
    
    return address_details, area, city

def extract_mobile_number(row, start_col=7, end_col=15):
    for mobile_col in range(start_col, min(end_col, len(row))):
        if not pd.isna(row.iloc[mobile_col]):
            mobile_val = str(row.iloc[mobile_col]).strip()
            clean_mobile = mobile_val.replace(' ', '').replace('-', '').replace('+', '').replace('(', '').replace(')', '')
            if clean_mobile.isdigit() and len(clean_mobile) >= 10:
                return clean_mobile
    return ''

def extract_address(row, start_col=8, end_col=15):
    for addr_col in range(start_col, min(end_col, len(row))):
        if not pd.isna(row.iloc[addr_col]):
            addr_val = str(row.iloc[addr_col]).strip()
            if addr_val and addr_val != 'nan' and len(addr_val) > 5:
                return addr_val
    return ''

def get_relation_mapping(selected_relation, original_relation):
    """Map relations when family member becomes main user"""
    if 'પુત્ર' in selected_relation:  # Son becomes main
        if 'પોતે' in original_relation:
            return 'પિતા'  # Father
        elif 'પત્ની' in original_relation:
            return 'માતા'  # Mother
        elif 'પુત્ર' in original_relation:
            return 'ભાઈ'  # Brother
        elif 'દીકરી' in original_relation:
            return 'બહેન'  # Sister
    elif 'પત્ની' in selected_relation:  # Wife becomes main
        if 'પોતે' in original_relation:
            return 'પતિ'  # Husband
        elif 'પુત્ર' in original_relation:
            return 'પુત્ર'  # Son
        elif 'દીકરી' in original_relation:
            return 'દીકરી'  # Daughter
    
    return original_relation  # Default

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
            
            print(f"\n=== PRESERVING EXISTING DATA ===")
            print(f"Current database has {NewPersonalProfile.objects.count()} existing users")
            print(f"Will only add NEW users from Excel file")
            
            current_main = None
            current_profile = None
            
            for index, row in df.iterrows():
                try:
                    col0_value = str(row.iloc[0]).strip() if not pd.isna(row.iloc[0]) else ''
                    member_name = str(row.iloc[1]).strip() if not pd.isna(row.iloc[1]) else ''
                    relation = str(row.iloc[2]).strip() if not pd.isna(row.iloc[2]) else ''
                    
                    if col0_value and col0_value != 'nan':
                        current_main = col0_value
                        
                        # Get all family rows
                        family_rows = df[df.iloc[:, 0] == current_main]
                        if len(family_rows) == 0:
                            family_start = index
                            family_end = index + 1
                            while family_end < len(df) and (pd.isna(df.iloc[family_end, 0]) or df.iloc[family_end, 0] == ''):
                                family_end += 1
                            family_rows = df.iloc[family_start:family_end]
                        
                        # Find member with mobile number
                        selected_member = None
                        selected_mobile = None
                        selected_name = None
                        selected_relation = None
                        
                        # Priority: પુત્ર, પત્ની, others
                        priority_relations = ['પુત્ર', 'પત્ની']
                        
                        for priority_rel in priority_relations:
                            for _, fam_row in family_rows.iterrows():
                                fam_relation = str(fam_row.iloc[2]).strip() if not pd.isna(fam_row.iloc[2]) else ''
                                if priority_rel in fam_relation:
                                    fam_mobile = extract_mobile_number(fam_row)
                                    if fam_mobile:
                                        selected_member = fam_row
                                        selected_mobile = fam_mobile
                                        selected_name = str(fam_row.iloc[1]).strip()
                                        selected_relation = fam_relation
                                        break
                            if selected_member is not None:
                                break
                        
                        # If no priority found, try any member with mobile
                        if selected_member is None:
                            for _, fam_row in family_rows.iterrows():
                                fam_mobile = extract_mobile_number(fam_row)
                                if fam_mobile:
                                    selected_member = fam_row
                                    selected_mobile = fam_mobile
                                    selected_name = str(fam_row.iloc[1]).strip()
                                    selected_relation = str(fam_row.iloc[2]).strip()
                                    break
                        
                        if selected_member is None:
                            # Skip this family if no member has mobile number
                            print(f"No mobile found for family {current_main}, skipping...")
                            continue
                        
                        # Check if user already exists - PRESERVE EXISTING DATA
                        clean_mobile = selected_mobile.replace('+', '').replace(' ', '').replace('-', '')
                        if clean_mobile.startswith('91') and len(clean_mobile) == 12:
                            clean_mobile = clean_mobile[2:]
                        
                        mobile_variants = [selected_mobile, clean_mobile]
                        if selected_mobile.startswith('+91'):
                            mobile_variants.append(selected_mobile[3:])
                        
                        user_exists = False
                        for variant in mobile_variants:
                            if (User.objects.filter(username=variant).exists() or 
                                NewPersonalProfile.objects.filter(mobileNumber=variant).exists()):
                                print(f"✓ PRESERVING: User with mobile {variant} already exists")
                                user_exists = True
                                break
                        
                        if user_exists:
                            records_skipped += 1
                            current_profile = None
                            continue
                        
                        # Create main user from selected member
                        surname, name, father_name, sakh = parse_name(selected_name)
                        
                        user = User.objects.create_user(
                            username=selected_mobile,
                            password='temp123',
                            first_name=name or selected_name
                        )
                        
                        full_address = extract_address(selected_member)
                        address_details, area, city = parse_address(full_address)
                        
                        current_profile = NewPersonalProfile.objects.create(
                            user=user,
                            surname=surname,
                            name=name,
                            fatherName=father_name,
                            mobileNumber=selected_mobile,
                            email=f"{selected_mobile}@temp.com",
                            age=30,
                            sakh=sakh,
                            address=address_details or full_address or f"Test Address, Test Area, Ahmedabad",
                            area=area or "Test Area",
                            city=city or "Ahmedabad",
                            maritalStatus='married'
                        )
                        
                        records_created += 1
                        print(f"Created main user: {name} ({selected_relation}) with mobile: {selected_mobile}")
                        
                        # Add other family members with correct relations
                        for _, fam_row in family_rows.iterrows():
                            fam_name = str(fam_row.iloc[1]).strip() if not pd.isna(fam_row.iloc[1]) else ''
                            fam_relation = str(fam_row.iloc[2]).strip() if not pd.isna(fam_row.iloc[2]) else ''
                            
                            # Skip the selected main user
                            if fam_name == selected_name:
                                continue
                            
                            if fam_name:
                                f_surname, f_name, f_father_name, f_sakh = parse_name(fam_name)
                                
                                # Map relation based on who became main user
                                new_relation = get_relation_mapping(selected_relation, fam_relation)
                                
                                fam_mobile = extract_mobile_number(fam_row)
                                fam_full_address = extract_address(fam_row)
                                fam_address_details, fam_area, fam_city = parse_address(fam_full_address)
                                
                                NewFamilyMember.objects.create(
                                    profile=current_profile,
                                    surname=f_surname or current_profile.surname,
                                    name=f_name,
                                    fatherName=f_father_name,
                                    relation=new_relation,
                                    memberAge=25,
                                    mobileNumber=fam_mobile or '',  # Leave empty if no mobile
                                    maritalStatus='single',
                                    sakh=f_sakh,
                                    address=fam_address_details or fam_full_address or f"Family Address, Test Area, Ahmedabad",
                                    area=fam_area or "Test Area",
                                    city=fam_city or "Ahmedabad"
                                )
                                
                                print(f"Added family member: {f_name} as {new_relation}")
                    
                except Exception as e:
                    print(f"Row error at index {index}: {str(e)}")
                    continue
            
            print(f"\n=== EXCEL UPLOAD COMPLETED ===")
            print(f"✓ NEW RECORDS CREATED: {records_created}")
            print(f"✓ EXISTING RECORDS PRESERVED: {records_skipped}")
            print(f"✓ TOTAL RECORDS IN DATABASE: {NewPersonalProfile.objects.count()}")
            
            return Response({
                'success': True,
                'records_created': records_created,
                'records_skipped': records_skipped,
                'total_database_records': NewPersonalProfile.objects.count(),
                'message': f'Excel upload completed! Created {records_created} new users, preserved {records_skipped} existing users. Total: {NewPersonalProfile.objects.count()}'
            })
            
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=500)