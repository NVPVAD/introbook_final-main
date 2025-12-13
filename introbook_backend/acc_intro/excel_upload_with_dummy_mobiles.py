from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.contrib.auth.models import User
from .models import NewPersonalProfile, NewFamilyMember
import pandas as pd
import random

def parse_name(full_name):
    """Parse Gujarati name"""
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
    """Parse address"""
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
    """Extract mobile number from multiple columns"""
    for mobile_col in range(start_col, min(end_col, len(row))):
        if not pd.isna(row.iloc[mobile_col]):
            mobile_val = str(row.iloc[mobile_col]).strip()
            clean_mobile = mobile_val.replace(' ', '').replace('-', '').replace('+', '').replace('(', '').replace(')', '')
            if clean_mobile.isdigit() and len(clean_mobile) >= 10:
                return clean_mobile
    return ''

def extract_address(row, start_col=8, end_col=15):
    """Extract address from multiple columns"""
    for addr_col in range(start_col, min(end_col, len(row))):
        if not pd.isna(row.iloc[addr_col]):
            addr_val = str(row.iloc[addr_col]).strip()
            if addr_val and addr_val != 'nan' and len(addr_val) > 5:
                return addr_val
    return ''

def generate_dummy_mobile():
    """Generate a dummy mobile number for testing"""
    return f"98765{random.randint(10000, 99999)}"

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
            
            # Clear existing test data
            # PRESERVE EXISTING DATA - No clearing of existing users
            records_skipped = 0
            print("Cleared existing test users")
            
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
                        
                        # Try to extract mobile number
                        main_mobile = extract_mobile_number(row)
                        
                        # If no mobile found, generate dummy mobile
                        if not main_mobile:
                            main_mobile = generate_dummy_mobile()
                            print(f"Generated dummy mobile {main_mobile} for {current_main}")
                        
                        # Parse main member name
                        surname, name, father_name, sakh = parse_name(current_main)
                        
                        # Create main user
                        user = User.objects.create_user(
                            username=main_mobile,
                            password='temp123',
                            first_name=name or current_main
                        )
                        
                        # Extract address
                        full_address = extract_address(row)
                        if not full_address:
                            full_address = f"Test Address {records_created + 1}, Test Area, Ahmedabad"
                        
                        address_details, area, city = parse_address(full_address)
                        
                        current_profile = NewPersonalProfile.objects.create(
                            user=user,
                            surname=surname,
                            name=name,
                            fatherName=father_name,
                            mobileNumber=main_mobile,
                            email=f"{main_mobile}@temp.com",
                            age=30,
                            sakh=sakh,
                            address=address_details or full_address,
                            area=area,
                            city=city,
                            maritalStatus='married'
                        )
                        
                        records_created += 1
                        print(f"Created main user: {name} with mobile: {main_mobile}, address: {address_details or full_address}")
                    
                    # If col0 is empty but we have current_main, it's a family member
                    elif current_main and current_profile and member_name and relation != 'પોતે':
                        try:
                            # Parse family member name
                            f_surname, f_name, f_father_name, f_sakh = parse_name(member_name)
                            
                            # Extract mobile number or generate dummy
                            member_mobile = extract_mobile_number(row)
                            if not member_mobile:
                                member_mobile = generate_dummy_mobile()
                                print(f"Generated dummy mobile {member_mobile} for family member {f_name}")
                            
                            # Extract address
                            member_full_address = extract_address(row)
                            if not member_full_address:
                                member_full_address = f"Family Address {f_name}, Test Area, Ahmedabad"
                            
                            member_address_details, member_area, member_city = parse_address(member_full_address)
                            
                            NewFamilyMember.objects.create(
                                profile=current_profile,
                                surname=f_surname or current_profile.surname,
                                name=f_name or member_name,
                                fatherName=f_father_name or current_profile.fatherName,
                                relation=relation,
                                memberAge=25,
                                mobileNumber=member_mobile,
                                maritalStatus='single',
                                sakh=f_sakh,
                                address=member_address_details or member_full_address,
                                area=member_area,
                                city=member_city
                            )
                            
                            print(f"Created family member: {f_name} ({relation}) with mobile: {member_mobile}, address: {member_address_details or member_full_address}")
                        except Exception as family_error:
                            print(f"Family member error: {str(family_error)}")
                            continue
                    
                except Exception as e:
                    print(f"Row error at index {index}: {str(e)}")
                    continue
            
            return Response({
                'success': True,
                'records_created': records_created,
                'message': f'Successfully imported {records_created} records with mobile numbers and addresses'
            })
            
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=500)