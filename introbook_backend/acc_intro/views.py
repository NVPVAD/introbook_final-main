from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework import generics, permissions
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token
from rest_framework import viewsets
from django.db import models
from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth import authenticate
from django.utils import timezone
from .models import (
    UserProfile, FamilyMember, NewPersonalProfile, NewFamilyMember, 
    PrivateMessage, FamilyEvent, EventInvitation, 
    FamilyUpdate, OTP, Family, FamilyMemberAuth, FamilyConnection
)
from .serializers import (
    UserProfileSerializer, NewPersonalProfileSerializer, 
    FamilySerializer, FamilyMemberSerializer, PrivateMessageSerializer,
    FamilyEventSerializer, FamilyUpdateSerializer
)
import random
import json
import os
from twilio.rest import Client
import pandas as pd


# In-memory OTP store (for demo; use a persistent store in production)
OTP_STORE = {}

class TestPublicView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        return Response({"message": "public"})

class EditProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            # Check if user is a family member
            try:
                family_auth = FamilyMemberAuth.objects.get(user=request.user, is_active=True)
                # Family member - return their family's data but mark as read-only
                family_member = family_auth.family_member
                main_profile = family_member.profile
                serializer = NewPersonalProfileSerializer(main_profile)
                data = serializer.data
                data['user_type'] = 'family_member'
                data['is_read_only'] = True
                data['user_number'] = main_profile.get_user_id()
                data['family_member_info'] = {
                    'id': family_member.id,
                    'name': f"{family_member.surname} {family_member.name}",
                    'relation': family_member.relation,
                    'member_number': family_member.member_number
                }
                
                # Ensure signup data is populated with main profile data for family members too
                data.update({
                    'signup_surname': main_profile.surname,
                    'signup_name': main_profile.name,
                    'signup_fatherName': main_profile.fatherName,
                    'signup_mobileNumber': main_profile.mobileNumber,
                    'signup_email': main_profile.email,
                    'signup_sakh': main_profile.sakh
                })
                
                # Add member numbers to family_members array
                if 'family_members' in data:
                    for i, member_data in enumerate(data['family_members']):
                        try:
                            member_obj = main_profile.family_members.all()[i]
                            member_data['member_number'] = member_obj.get_member_id()
                        except IndexError:
                            pass
                return Response(data)
            except FamilyMemberAuth.DoesNotExist:
                # Main user
                profile = NewPersonalProfile.objects.get(user=request.user)
                serializer = NewPersonalProfileSerializer(profile)
                data = serializer.data
                data['user_type'] = 'main_user'
                data['is_read_only'] = False
                data['user_number'] = profile.get_user_id()
                
                # Ensure signup data is populated with current profile data
                data.update({
                    'signup_surname': profile.surname,
                    'signup_name': profile.name,
                    'signup_fatherName': profile.fatherName,
                    'signup_mobileNumber': profile.mobileNumber,
                    'signup_email': profile.email,
                    'signup_sakh': profile.sakh
                })
                
                # Add member numbers to family_members array
                if 'family_members' in data:
                    for i, member_data in enumerate(data['family_members']):
                        try:
                            member_obj = profile.family_members.all()[i]
                            member_data['member_number'] = member_obj.get_member_id()
                        except IndexError:
                            pass
                return Response(data)
        except NewPersonalProfile.DoesNotExist:
            return Response({'detail': 'Profile not found.'}, status=status.HTTP_404_NOT_FOUND)

    def post(self, request):
        # Check if user is a family member - they cannot edit
        try:
            family_auth = FamilyMemberAuth.objects.get(user=request.user, is_active=True)
            return Response({
                'error': 'Family members cannot edit profile or family data. Only the main user has edit permissions.'
            }, status=status.HTTP_403_FORBIDDEN)
        except FamilyMemberAuth.DoesNotExist:
            pass  # User is main user, continue with edit
        print(f"EditProfile POST request received. Data: {request.data}")
        print(f"Files: {request.FILES}")

        # Handle both nested and flat data
        personal_data = request.data.get('personal', request.data.copy())
        family_data = request.data.get('family', [])
        
        # Extract family_members from personal_data if it exists there
        if 'family_members' in personal_data:
            family_members_data = personal_data.pop('family_members')
            # Handle QueryDict list format
            if isinstance(family_members_data, list) and len(family_members_data) > 0:
                family_members_str = family_members_data[0]  # Get the first (and likely only) item
            else:
                family_members_str = family_members_data
            
            if isinstance(family_members_str, str):
                import json
                try:
                    family_data = json.loads(family_members_str)
                except Exception as e:
                    print(f"Error parsing family_members: {e}")
                    family_data = []
            elif isinstance(family_members_str, list):
                family_data = family_members_str
        
        # If family_data is a string (from form), parse it
        if isinstance(family_data, str):
            import json
            try:
                family_data = json.loads(family_data)
            except Exception as e:
                print(f"Error parsing family_data: {e}")
                family_data = []
        if not isinstance(family_data, list):
            family_data = []

        print(f"Personal data: {personal_data}")
        print(f"Family data: {family_data}")
        
        try:
            profile = NewPersonalProfile.objects.get(user=request.user)
            print(f"Found existing profile for user: {request.user.username}")
            
            # Handle avatar upload
            if 'avatar' in request.FILES:
                profile.avatar = request.FILES['avatar']
                print(f"Avatar uploaded: {request.FILES['avatar'].name}")
            
            # Update existing profile
            for field, value in personal_data.items():
                if hasattr(profile, field) and field != 'avatar':  # Skip avatar as it's handled separately
                    # Convert empty strings to appropriate defaults for certain fields
                    if field == 'age' and (not value or value == ''):
                        value = 18  # Default age
                    elif field in ['mobileNumber', 'email'] and not value:
                        continue  # Skip empty required fields
                    setattr(profile, field, value)
                    print(f"Updated field {field} to {value}")
                else:
                    print(f"Warning: Field {field} does not exist on profile model")
            
            profile.save()
            print("Profile saved successfully")
            
            # Remove old family members
            old_count = profile.family_members.count()
            profile.family_members.all().delete()
            print(f"Deleted {old_count} old family members")
            
            # Add new family members
            family_members_created = 0
            for i, member in enumerate(family_data):
                # Save all available fields
                member_fields = {
                    'surname': member.get('surname', ''),
                    'name': member.get('name', ''),
                    'fatherName': member.get('fatherName', ''),
                    'motherName': member.get('motherName', ''),
                    'sakh': member.get('sakh', ''),
                    'gender': member.get('gender', ''),
                    'memberAge': int(member.get('memberAge', 18)) if member.get('memberAge') else 18,
                    'maritalStatus': member.get('maritalStatus', ''),
                    'relation': member.get('relation', ''),
                    'email': member.get('email', ''),
                    'mobileNumber': member.get('mobileNumber', ''),
                    'emergencyContact': member.get('emergencyContact', ''),
                    'address': member.get('address', ''),
                    'city': member.get('city', ''),
                    'hometown': member.get('hometown', ''),
                    'state': member.get('state', ''),
                    'country': member.get('country', 'India'),
                    'pincode': member.get('pincode', ''),
                    'occupation': member.get('occupation', ''),
                    'companyName': member.get('companyName', ''),
                    'workAddress': member.get('workAddress', ''),
                    'education': member.get('education', ''),
                    'instituteName': member.get('instituteName', ''),
                    'specialization': member.get('specialization', ''),
                    'caste': member.get('caste', ''),
                    'subcaste': member.get('subcaste', ''),
                    'religion': member.get('religion', ''),
                    'height': member.get('height', ''),
                    'weight': member.get('weight', ''),
                    'bloodGroup': member.get('bloodGroup', ''),
                    'medicalConditions': member.get('medicalConditions', ''),
                    'hobbies': member.get('hobbies', ''),
                    'languagesKnown': member.get('languagesKnown', ''),
                    'skills': member.get('skills', ''),
                    'aboutMember': member.get('aboutMember', ''),
                    'achievements': member.get('achievements', '')
                }
                
                # Handle date field separately
                if member.get('dateOfBirth'):
                    try:
                        from datetime import datetime
                        member_fields['dateOfBirth'] = datetime.strptime(member['dateOfBirth'], '%Y-%m-%d').date()
                    except (ValueError, TypeError):
                        pass  # Skip invalid dates
                
                NewFamilyMember.objects.create(profile=profile, **member_fields)
                family_members_created += 1
                print(f"Created family member {i+1}: {member.get('surname', 'Unknown')}")
            
            success_message = f'Profile updated successfully! Added {family_members_created} family member(s).'
            return Response({
                'success': True,
                'message': success_message,
                'profile_updated': True,
                'family_members_added': family_members_created
            }, status=status.HTTP_200_OK)
            
        except NewPersonalProfile.DoesNotExist:
            print(f"No profile found for user: {request.user.username}, creating new one")
            # Create new profile
            if hasattr(personal_data, 'dict'):
                data = personal_data.dict()
            else:
                data = dict(personal_data)
            data.pop('family_members', None)
            print("Data passed to serializer:", data)

            # Handle avatar upload for new profile
            if 'avatar' in request.FILES:
                data['avatar'] = request.FILES['avatar']
                print(f"Avatar uploaded for new profile: {request.FILES['avatar'].name}")

            serializer = NewPersonalProfileSerializer(data=data)
            if serializer.is_valid():
                profile = serializer.save(user=request.user)
                print("New profile created successfully")
                # Add new family members
                family_members_created = 0
                for i, member in enumerate(family_data):
                    # Save all available fields
                    member_fields = {
                        'surname': member.get('surname', ''),
                        'name': member.get('name', ''),
                        'fatherName': member.get('fatherName', ''),
                        'motherName': member.get('motherName', ''),
                        'sakh': member.get('sakh', ''),
                        'gender': member.get('gender', ''),
                        'memberAge': int(member.get('memberAge', 18)) if member.get('memberAge') else 18,
                        'maritalStatus': member.get('maritalStatus', ''),
                        'relation': member.get('relation', ''),
                        'email': member.get('email', ''),
                        'mobileNumber': member.get('mobileNumber', ''),
                        'emergencyContact': member.get('emergencyContact', ''),
                        'address': member.get('address', ''),
                        'city': member.get('city', ''),
                        'hometown': member.get('hometown', ''),
                        'state': member.get('state', ''),
                        'country': member.get('country', 'India'),
                        'pincode': member.get('pincode', ''),
                        'occupation': member.get('occupation', ''),
                        'companyName': member.get('companyName', ''),
                        'workAddress': member.get('workAddress', ''),
                        'education': member.get('education', ''),
                        'instituteName': member.get('instituteName', ''),
                        'specialization': member.get('specialization', ''),
                        'caste': member.get('caste', ''),
                        'subcaste': member.get('subcaste', ''),
                        'religion': member.get('religion', ''),
                        'height': member.get('height', ''),
                        'weight': member.get('weight', ''),
                        'bloodGroup': member.get('bloodGroup', ''),
                        'medicalConditions': member.get('medicalConditions', ''),
                        'hobbies': member.get('hobbies', ''),
                        'languagesKnown': member.get('languagesKnown', ''),
                        'skills': member.get('skills', ''),
                        'aboutMember': member.get('aboutMember', ''),
                        'achievements': member.get('achievements', '')
                    }
                    
                    # Handle date field separately
                    if member.get('dateOfBirth'):
                        try:
                            from datetime import datetime
                            member_fields['dateOfBirth'] = datetime.strptime(member['dateOfBirth'], '%Y-%m-%d').date()
                        except (ValueError, TypeError):
                            pass  # Skip invalid dates
                    
                    NewFamilyMember.objects.create(profile=profile, **member_fields)
                    family_members_created += 1
                    print(f"Created family member {i+1}: {member.get('surname', 'Unknown')}")
                
                success_message = f'Profile created successfully! Added {family_members_created} family member(s).'
                return Response({
                    'success': True,
                    'message': success_message,
                    'profile_created': True,
                    'family_members_added': family_members_created
                }, status=status.HTTP_201_CREATED)
            else:
                print(f"Serializer errors: {serializer.errors}")
                return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            print(f"Error in EditProfile POST: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class AllFamiliesView(APIView):
    permission_classes = [AllowAny]
    def get(self, request):
        # Only return main profiles (heads of families), not family members
        profiles = NewPersonalProfile.objects.all().order_by('user_number')
        serializer = NewPersonalProfileSerializer(profiles, many=True, context={'request': request})
        return Response(serializer.data)

class FamilyMemberListView(APIView):
    """View to list family members that can login"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get the user's profile
            profile = NewPersonalProfile.objects.get(user=request.user)
            
            # Get family members that have login access
            family_auths = FamilyMemberAuth.objects.filter(
                family_member__profile=profile,
                is_active=True
            ).select_related('family_member', 'user')
            
            family_members = []
            for auth in family_auths:
                family_members.append({
                    'id': auth.family_member.id,
                    'name': f"{auth.family_member.surname} {auth.family_member.name}",
                    'mobile': auth.mobile_number,
                    'can_login': auth.is_active,
                    'last_login': auth.last_login,
                    'member_number': auth.family_member.get_member_id()
                })
            
            return Response({
                'success': True,
                'family_members': family_members
            })
        except NewPersonalProfile.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Profile not found'
            }, status=404)

class FamilyMemberRemoveAccessView(APIView):
    """View to remove login access for family members"""
    permission_classes = [IsAuthenticated]
    
    def delete(self, request, member_id):
        try:
            # Get the main user's profile
            main_profile = NewPersonalProfile.objects.get(user=request.user)
            
            # Find the family member auth record
            family_auth = FamilyMemberAuth.objects.get(
                family_member__id=member_id,
                family_member__profile=main_profile,
                is_active=True
            )
            
            # Deactivate the login access
            family_auth.is_active = False
            family_auth.save()
            
            return Response({
                'success': True,
                'message': f'Login access removed for {family_auth.family_member.surname} {family_auth.family_member.name}'
            })
            
        except FamilyMemberAuth.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Family member login access not found'
            }, status=404)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to remove access: {str(e)}'
            }, status=500)

class FamilyMemberAvailableListView(APIView):
    """View to list family members available for login access"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get the main user's profile
            main_profile = NewPersonalProfile.objects.get(user=request.user)
            
            # Get all family members
            family_members = NewFamilyMember.objects.filter(profile=main_profile)
            
            # Get family members that already have login access
            existing_auths = FamilyMemberAuth.objects.filter(
                family_member__profile=main_profile,
                is_active=True
            ).values_list('family_member_id', flat=True)
            
            # Filter out family members that already have login access
            available_members = []
            for member in family_members:
                if member.id not in existing_auths:
                    available_members.append({
                        'id': member.id,
                        'name': f"{member.surname} {member.name}",
                        'relation': member.relation,
                        'mobile': member.mobileNumber,
                        'member_number': member.get_member_id()
                    })
            
            return Response({
                'success': True,
                'available_members': available_members
            })
            
        except NewPersonalProfile.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Profile not found'
            }, status=404)

class FamilyMemberRegistrationView(APIView):
    """View to register family members for login access"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            # Get the main user's profile
            main_profile = NewPersonalProfile.objects.get(user=request.user)
            
            # Get family member data
            family_member_id = request.data.get('family_member_id')
            mobile_number = request.data.get('mobile_number')
            password = request.data.get('password')
            
            if not all([family_member_id, mobile_number, password]):
                return Response({
                    'error': 'Missing required fields: family_member_id, mobile_number, password'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Check if family member exists and belongs to this user
            try:
                family_member = NewFamilyMember.objects.get(
                    id=family_member_id,
                    profile=main_profile
                )
            except NewFamilyMember.DoesNotExist:
                return Response({
                    'error': 'Family member not found or does not belong to you'
                }, status=status.HTTP_404_NOT_FOUND)
            
            # Check if mobile number is already registered for family member auth
            if FamilyMemberAuth.objects.filter(mobile_number=mobile_number).exists():
                return Response({
                    'error': 'Mobile number already registered for family member access'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Import make_password at the top of the function
            from django.contrib.auth.hashers import make_password
            
            # Check if a user with this mobile number already exists
            family_user = None
            try:
                # Try to find existing user with this mobile number as username
                family_user = User.objects.get(username=mobile_number)
                # Update the password for the existing user
                family_user.set_password(password)
                family_user.first_name = family_member.surname
                family_user.last_name = family_member.name
                family_user.email = family_member.email or f"{mobile_number}@family.com"
                family_user.save()
                print(f"Updated existing user: {mobile_number}")
            except User.DoesNotExist:
                # Create a new User for the family member
                family_user = User.objects.create_user(
                    username=mobile_number,
                    password=password,
                    first_name=family_member.surname,
                    last_name=family_member.name,
                    email=family_member.email or f"{mobile_number}@family.com"
                )
                print(f"Created new user: {mobile_number}")
            
            # Create FamilyMemberAuth record
            family_auth = FamilyMemberAuth.objects.create(
                family_member=family_member,
                user=family_user,
                mobile_number=mobile_number,
                password=make_password(password),
                is_active=True
            )
            
            return Response({
                'message': f'Family member {family_member.surname} {family_member.name} registered successfully',
                'family_member_id': family_member.id,
                'mobile_number': mobile_number
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            return Response({
                'error': f'Registration failed: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ActivitiesView(APIView):
    """View to get user activities"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from .models import CommunityActivity
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
                
                # Get user's activities
                activities = CommunityActivity.objects.filter(
                    profile=current_profile
                ).order_by('-created_at')[:5]  # Limit to 5 recent activities
                
                activities_data = []
                for activity in activities:
                    activities_data.append({
                        'id': activity.id,
                        'type': activity.activity_type,
                        'text': activity.description,
                        'title': activity.title,
                        'timestamp': activity.created_at.isoformat(),
                        'icon': self.get_activity_icon(activity.activity_type)
                    })
                
                return Response(activities_data)
                
            except NewPersonalProfile.DoesNotExist:
                # If no profile found, return empty activities
                return Response([])
                
        except Exception as e:
            return Response({
                'success': False,
                'message': 'Failed to fetch activities'
            }, status=500)
    
    def get_activity_icon(self, activity_type):
        """Get icon for activity type"""
        icon_map = {
            'profile_update': '✏️',
            'family_member_added': '👨‍👩‍👧‍👦',
            'connection_made': '🤝',
            'featured_family_update': '⭐',
            'community_event': '🎉'
        }
        return icon_map.get(activity_type, '📝')

class FamilyMemberFamilyView(APIView):
    """View for family members to see their family details"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Check if this user is a family member
            try:
                family_auth = FamilyMemberAuth.objects.get(user=request.user, is_active=True)
                family_member = family_auth.family_member
                main_profile = family_member.profile
                
                # Get all family members in this family
                all_family_members = NewFamilyMember.objects.filter(profile=main_profile)
                
                # Serialize the data
                family_data = {
                    'main_user': {
                        'id': main_profile.id,
                        'surname': main_profile.surname,
                        'name': main_profile.name,
                        'fatherName': main_profile.fatherName,
                        'occupation': main_profile.occupation,
                        'address': main_profile.address,
                        'email': main_profile.email,
                        'city': main_profile.city,
                        'age': main_profile.age,
                        'hometown': main_profile.hometown,
                        'mobileNumber': main_profile.mobileNumber,
                        'caste': main_profile.caste,
                        'subcaste': main_profile.subcaste,
                        'avatar': main_profile.avatar.url if main_profile.avatar else None
                    },
                    'family_members': []
                }
                
                for member in all_family_members:
                    family_data['family_members'].append({
                        'id': member.id,
                        'surname': member.surname,
                        'name': member.name,
                        'fatherName': member.fatherName,
                        'occupation': member.occupation,
                        'address': member.address,
                        'email': member.email,
                        'city': member.city,
                        'relation': member.relation,
                        'memberAge': member.memberAge,
                        'hometown': member.hometown,
                        'mobileNumber': member.mobileNumber,
                        'caste': member.caste,
                        'subcaste': member.subcaste
                    })
                
                return Response({
                    'success': True,
                    'user_type': 'family_member',
                    'family_member_info': {
                        'id': family_member.id,
                        'name': f"{family_member.surname} {family_member.name}",
                        'relation': family_member.relation
                    },
                    'family_data': family_data
                })
                
            except FamilyMemberAuth.DoesNotExist:
                # This is a main user, not a family member
                return Response({
                    'success': False,
                    'message': 'This endpoint is for family members only'
                }, status=403)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to fetch family data: {str(e)}'
            }, status=500)

class FeaturedFamiliesView(APIView):
    """View to get featured families in the community"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from .models import FeaturedFamily
            
            # Get featured families
            featured_families = FeaturedFamily.objects.filter(is_active=True).select_related('profile')[:6]
            
            families_data = []
            for featured in featured_families:
                profile = featured.profile
                # Count family members
                family_members_count = profile.family_members.count()
                
                families_data.append({
                    'id': profile.id,
                    'surname': profile.surname,
                    'name': profile.name,
                    'fullName': f"{profile.surname} {profile.name} Family",
                    'city': profile.city,
                    'membersCount': family_members_count + 1,  # +1 for main user
                    'avatar': profile.avatar.url if profile.avatar else None,
                    'hometown': profile.hometown,
                    'priority': featured.priority_level,
                    'featuredSince': featured.featured_since,
                    'reason': featured.reason
                })
            
            return Response({
                'success': True,
                'featured_families': families_data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to fetch featured families: {str(e)}'
            }, status=500)

class SuggestedConnectionsView(APIView):
    """View to get suggested family connections"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from .models import FamilyConnection
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            # Get existing connections
            existing_connections = FamilyConnection.objects.filter(
                initiator=current_profile
            ).values_list('receiver_id', flat=True)
            
            received_connections = FamilyConnection.objects.filter(
                receiver=current_profile
            ).values_list('initiator_id', flat=True)
            
            # Combine both lists to exclude all connected profiles
            excluded_ids = list(existing_connections) + list(received_connections) + [current_profile.id]
            
            # Get suggested connections based on similar location, caste, etc.
            suggestions = NewPersonalProfile.objects.exclude(id__in=excluded_ids)
            
            # Filter by similar attributes for better suggestions
            if current_profile.city:
                suggestions = suggestions.filter(city__icontains=current_profile.city)
            elif current_profile.hometown:
                suggestions = suggestions.filter(hometown__icontains=current_profile.hometown)
            
            suggestions = suggestions[:6]  # Limit to 6 suggestions
            
            suggestions_data = []
            for profile in suggestions:
                # Count mutual connections
                mutual_count = FamilyConnection.objects.filter(
                    initiator=current_profile,
                    receiver__in=FamilyConnection.objects.filter(
                        initiator=profile,
                        status='accepted'
                    ).values_list('receiver', flat=True),
                    status='accepted'
                ).count()
                
                family_members_count = profile.family_members.count()
                
                suggestions_data.append({
                    'id': profile.id,
                    'surname': profile.surname,
                    'name': profile.name,
                    'fullName': f"{profile.surname} {profile.name}",
                    'city': profile.city,
                    'hometown': profile.hometown,
                    'membersCount': family_members_count + 1,
                    'mutualConnections': mutual_count,
                    'avatar': profile.avatar.url if profile.avatar else None,
                    'commonInterests': self.get_common_interests(current_profile, profile)
                })
            
            return Response({
                'success': True,
                'suggested_connections': suggestions_data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to fetch suggested connections: {str(e)}'
            }, status=500)
    
    def get_common_interests(self, profile1, profile2):
        """Helper method to find common interests between profiles"""
        common = []
        if profile1.city and profile2.city and profile1.city.lower() == profile2.city.lower():
            common.append(f"Both from {profile1.city}")
        if profile1.caste and profile2.caste and profile1.caste.lower() == profile2.caste.lower():
            common.append(f"Same community")
        if profile1.occupation and profile2.occupation and profile1.occupation.lower() == profile2.occupation.lower():
            common.append(f"Similar profession")
        return common

class ConnectFamilyView(APIView):
    """View to send connection request to another family"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            from .models import FamilyConnection, CommunityActivity
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            receiver_id = request.data.get('receiver_id')
            message = request.data.get('message', '')
            
            if not receiver_id:
                return Response({
                    'success': False,
                    'message': 'Receiver ID is required'
                }, status=400)
            
            # Get receiver profile
            try:
                receiver_profile = NewPersonalProfile.objects.get(id=receiver_id)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Receiver profile not found'
                }, status=404)
            
            # Check if connection already exists
            existing_connection = FamilyConnection.objects.filter(
                initiator=current_profile,
                receiver=receiver_profile
            ).first()
            
            if existing_connection:
                return Response({
                    'success': False,
                    'message': 'Connection request already exists'
                }, status=400)
            
            # Create connection request
            connection = FamilyConnection.objects.create(
                initiator=current_profile,
                receiver=receiver_profile,
                message=message,
                status='pending'
            )
            
            # Create community activity
            CommunityActivity.objects.create(
                profile=current_profile,
                activity_type='connection_made',
                title='Connection Request Sent',
                description=f'Sent connection request to {receiver_profile.surname} {receiver_profile.name} family',
                is_public=True
            )
            
            return Response({
                'success': True,
                'message': f'Connection request sent to {receiver_profile.surname} {receiver_profile.name} family',
                'connection_id': connection.id
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to send connection request: {str(e)}'
            }, status=500)

class CommunityActivitiesView(APIView):
    """View to get community activities"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from .models import CommunityActivity
            
            # Get recent community activities
            activities = CommunityActivity.objects.filter(
                is_public=True
            ).select_related('profile').order_by('-created_at')[:10]
            
            activities_data = []
            for activity in activities:
                activities_data.append({
                    'id': activity.id,
                    'type': activity.activity_type,
                    'title': activity.title,
                    'description': activity.description,
                    'text': activity.description,  # For compatibility with frontend
                    'timestamp': activity.created_at.isoformat(),
                    'profile': {
                        'id': activity.profile.id,
                        'name': f"{activity.profile.surname} {activity.profile.name}",
                        'avatar': activity.profile.avatar.url if activity.profile.avatar else None
                    }
                })
            
            return Response({
                'success': True,
                'activities': activities_data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to fetch community activities: {str(e)}'
            }, status=500)

class AcceptedConnectionsView(APIView):
    """View to get accepted connections"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from .models import FamilyConnection
            
            current_profile = NewPersonalProfile.objects.get(user=request.user)
            
            # Get all accepted connections
            accepted_connections = FamilyConnection.objects.filter(
                (Q(initiator=current_profile) | Q(receiver=current_profile)),
                status='accepted'
            ).select_related('initiator', 'receiver')
            
            connections_data = []
            for connection in accepted_connections:
                other_profile = connection.receiver if connection.initiator == current_profile else connection.initiator
                connections_data.append({
                    'id': connection.id,
                    'profile': {
                        'id': other_profile.id,
                        'name': f"{other_profile.surname} {other_profile.name}",
                        'city': other_profile.city,
                        'avatar': other_profile.avatar.url if other_profile.avatar else None
                    },
                    'connected_at': connection.connected_at.isoformat() if connection.connected_at else connection.updated_at.isoformat()
                })
            
            return Response({'success': True, 'connections': connections_data})
            
        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=500)

class PendingRequestsView(APIView):
    """View to get pending requests (sent and received)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from .models import FamilyConnection
            
            current_profile = NewPersonalProfile.objects.get(user=request.user)
            
            # Get sent pending requests
            sent_requests = FamilyConnection.objects.filter(
                initiator=current_profile,
                status='pending'
            ).select_related('receiver')
            
            # Get received pending requests
            received_requests = FamilyConnection.objects.filter(
                receiver=current_profile,
                status='pending'
            ).select_related('initiator')
            
            sent_data = []
            for connection in sent_requests:
                sent_data.append({
                    'id': connection.id,
                    'profile': {
                        'id': connection.receiver.id,
                        'name': f"{connection.receiver.surname} {connection.receiver.name}",
                        'city': connection.receiver.city,
                        'avatar': connection.receiver.avatar.url if connection.receiver.avatar else None
                    },
                    'message': connection.message,
                    'created_at': connection.created_at.isoformat()
                })
            
            received_data = []
            for connection in received_requests:
                received_data.append({
                    'id': connection.id,
                    'profile': {
                        'id': connection.initiator.id,
                        'name': f"{connection.initiator.surname} {connection.initiator.name}",
                        'city': connection.initiator.city,
                        'avatar': connection.initiator.avatar.url if connection.initiator.avatar else None
                    },
                    'message': connection.message,
                    'created_at': connection.created_at.isoformat()
                })
            
            return Response({
                'success': True,
                'sent_requests': sent_data,
                'received_requests': received_data
            })
            
        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=500)

class FindConnectionsView(APIView):
    """View to find new connections (suggested families)"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from .models import FamilyConnection
            
            current_profile = NewPersonalProfile.objects.get(user=request.user)
            
            # Get existing connections
            existing_connections = FamilyConnection.objects.filter(
                Q(initiator=current_profile) | Q(receiver=current_profile)
            ).values_list('initiator_id', 'receiver_id')
            
            excluded_ids = set([current_profile.id])
            for initiator_id, receiver_id in existing_connections:
                excluded_ids.add(initiator_id)
                excluded_ids.add(receiver_id)
            
            # Get suggested families
            suggestions = NewPersonalProfile.objects.exclude(id__in=excluded_ids)[:20]
            
            suggestions_data = []
            for profile in suggestions:
                suggestions_data.append({
                    'id': profile.id,
                    'name': f"{profile.surname} {profile.name}",
                    'city': profile.city,
                    'hometown': profile.hometown,
                    'avatar': profile.avatar.url if profile.avatar else None,
                    'membersCount': profile.family_members.count() + 1
                })
            
            return Response({'success': True, 'suggestions': suggestions_data})
            
        except Exception as e:
            return Response({'success': False, 'message': str(e)}, status=500)

class ConnectionResponseView(APIView):
    """View to accept/decline connection requests"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, connection_id):
        try:
            from .models import FamilyConnection, CommunityActivity
            from django.utils import timezone
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            action = request.data.get('action')  # 'accept' or 'decline'
            
            if action not in ['accept', 'decline']:
                return Response({
                    'success': False,
                    'message': 'Invalid action. Use "accept" or "decline"'
                }, status=400)
            
            # Get connection request
            try:
                connection = FamilyConnection.objects.get(
                    id=connection_id,
                    receiver=current_profile,
                    status='pending'
                )
            except FamilyConnection.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Connection request not found or not pending'
                }, status=404)
            
            # Update connection status
            if action == 'accept':
                connection.status = 'accepted'
                connection.connected_at = timezone.now()
                message = f'Accepted connection request from {connection.initiator.surname} {connection.initiator.name} family'
                
                # Create community activity for both parties
                CommunityActivity.objects.create(
                    profile=current_profile,
                    activity_type='connection_made',
                    title='New Connection Made',
                    description=f'Connected with {connection.initiator.surname} {connection.initiator.name} family',
                    is_public=True
                )
                
                CommunityActivity.objects.create(
                    profile=connection.initiator,
                    activity_type='connection_made',
                    title='Connection Accepted',
                    description=f'Connection request accepted by {current_profile.surname} {current_profile.name} family',
                    is_public=True
                )
            else:
                connection.status = 'declined'
                message = f'Declined connection request from {connection.initiator.surname} {connection.initiator.name} family'
            
            connection.save()
            
            return Response({
                'success': True,
                'message': message,
                'connection_status': connection.status
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to respond to connection: {str(e)}'
            }, status=500)
    
    def delete(self, request, connection_id):
        """Delete/cancel a connection"""
        try:
            from .models import FamilyConnection
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            # Get connection (user can only delete connections they initiated or received)
            try:
                connection = FamilyConnection.objects.get(
                    id=connection_id,
                    initiator=current_profile
                )
                connection_type = 'sent'
            except FamilyConnection.DoesNotExist:
                try:
                    connection = FamilyConnection.objects.get(
                        id=connection_id,
                        receiver=current_profile
                    )
                    connection_type = 'received'
                except FamilyConnection.DoesNotExist:
                    return Response({
                        'success': False,
                        'message': 'Connection not found or you do not have permission to delete it'
                    }, status=404)
            
            # Store connection info for response
            other_family = connection.receiver if connection_type == 'sent' else connection.initiator
            
            # Delete the connection
            connection.delete()
            
            return Response({
                'success': True,
                'message': f'Connection with {other_family.surname} {other_family.name} family has been removed'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to delete connection: {str(e)}'
            }, status=500)

class PrivateMessagesView(APIView):
    """View to handle private messages between connected families"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from .serializers import PrivateMessageSerializer
            from django.db.models import Q
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            # Get conversation partner ID from query params
            partner_id = request.query_params.get('partner_id')
            
            if partner_id:
                # Get messages with specific partner
                messages = PrivateMessage.objects.filter(
                    (Q(sender=current_profile) & Q(receiver_id=partner_id)) |
                    (Q(sender_id=partner_id) & Q(receiver=current_profile))
                ).order_by('created_at')
                
                # Mark received messages as read
                PrivateMessage.objects.filter(
                    sender_id=partner_id,
                    receiver=current_profile,
                    is_read=False
                ).update(is_read=True)
                
                serializer = PrivateMessageSerializer(messages, many=True)
                return Response({
                    'success': True,
                    'messages': serializer.data
                })
            else:
                # Get all conversations - show all connected families, not just those with messages
                from .models import FamilyConnection
                
                # Get all connected families
                connected_families = FamilyConnection.objects.filter(
                    Q(initiator=current_profile, status='accepted') |
                    Q(receiver=current_profile, status='accepted')
                ).select_related('initiator', 'receiver')
                
                conversations = []
                for connection in connected_families:
                    # Get the other family (not current user)
                    partner = connection.receiver if connection.initiator == current_profile else connection.initiator
                    
                    # Get latest message with this partner (if any)
                    latest_message = PrivateMessage.objects.filter(
                        (Q(sender=current_profile) & Q(receiver=partner)) |
                        (Q(sender=partner) & Q(receiver=current_profile))
                    ).order_by('-created_at').first()
                    
                    # Get unread count
                    unread_count = PrivateMessage.objects.filter(
                        sender=partner,
                        receiver=current_profile,
                        is_read=False
                    ).count()
                    
                    # Create conversation entry
                    conversation = {
                        'partner': {
                            'id': partner.id,
                            'name': f"{partner.surname} {partner.name}",
                            'avatar': partner.avatar.url if partner.avatar else None
                        },
                        'unread_count': unread_count
                    }
                    
                    if latest_message:
                        conversation['latest_message'] = {
                            'message': latest_message.message,
                            'created_at': latest_message.created_at.isoformat(),
                            'is_sender': latest_message.sender == current_profile
                        }
                    else:
                        # No messages yet - show placeholder
                        conversation['latest_message'] = {
                            'message': 'No messages yet - start a conversation!',
                            'created_at': connection.updated_at.isoformat(),
                            'is_sender': False
                        }
                    
                    conversations.append(conversation)
                
                # Sort by latest message time (or connection time if no messages)
                conversations.sort(key=lambda x: x['latest_message']['created_at'], reverse=True)
                
                return Response({
                    'success': True,
                    'conversations': conversations
                })
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to fetch messages: {str(e)}'
            }, status=500)
    
    def post(self, request):
        try:
            from .models import PrivateMessage, FamilyConnection
            from django.db.models import Q
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            receiver_id = request.data.get('receiver_id')
            message = request.data.get('message')
            
            if not receiver_id or not message:
                return Response({
                    'success': False,
                    'message': 'Receiver ID and message are required'
                }, status=400)
            
            # Get receiver profile
            try:
                receiver_profile = NewPersonalProfile.objects.get(id=receiver_id)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Receiver not found'
                }, status=404)
            
            # Check if families are connected
            connection_exists = FamilyConnection.objects.filter(
                Q(initiator=current_profile, receiver=receiver_profile, status='accepted') |
                Q(initiator=receiver_profile, receiver=current_profile, status='accepted')
            ).exists()
            
            if not connection_exists:
                return Response({
                    'success': False,
                    'message': 'You can only message connected families'
                }, status=403)
            
            # Create message
            private_message = PrivateMessage.objects.create(
                sender=current_profile,
                receiver=receiver_profile,
                message=message
            )
            
            return Response({
                'success': True,
                'message': 'Message sent successfully',
                'message_id': private_message.id
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to send message: {str(e)}'
            }, status=500)

class FamilyEventsView(APIView):
    """View to handle family events"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from .models import FamilyEvent, EventInvitation
            from .serializers import FamilyEventSerializer
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            # Get events organized by user
            organized_events = FamilyEvent.objects.filter(organizer=current_profile)
            
            # Get events user is invited to (including public events that need invitations)
            invited_events = FamilyEvent.objects.filter(
                invitations__invitee=current_profile
            ).distinct()
            
            # Get public events from connected families
            from .models import FamilyConnection
            connected_families = FamilyConnection.objects.filter(
                (Q(initiator=current_profile) | Q(receiver=current_profile)),
                status='accepted'
            ).values_list('initiator_id', 'receiver_id')
            
            connected_ids = set()
            for initiator_id, receiver_id in connected_families:
                connected_ids.add(initiator_id if initiator_id != current_profile.id else receiver_id)
            
            # Public events (is_public=True) are invitation-only, so no auto-visible events from connected families
            public_events = FamilyEvent.objects.none()  # Empty queryset
            
            # Get events visible to ALL users (including own events)
            all_user_events = FamilyEvent.objects.filter(
                visible_to_all=True
            ).exclude(
                id__in=invited_events.values_list('id', flat=True)
            )
            
            # Combine all public events
            all_public_events = public_events.union(all_user_events) 
            public_events = all_public_events
            
            # Serialize all events
            organized_serializer = FamilyEventSerializer(organized_events, many=True)
            invited_serializer = FamilyEventSerializer(invited_events, many=True)
            public_serializer = FamilyEventSerializer(public_events, many=True)
            
            print(f"Events count - Organized: {len(organized_serializer.data)}, Invited: {len(invited_serializer.data)}, Public: {len(public_serializer.data)}")
            
            return Response({
                'success': True,
                'organized_events': organized_serializer.data,
                'invited_events': invited_serializer.data,
                'public_events': public_serializer.data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to fetch events: {str(e)}'
            }, status=500)
    
    def post(self, request):
        try:
            from .models import FamilyEvent
            from .serializers import FamilyEventSerializer
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            # Create event
            data = request.data.copy()
            data['organizer'] = current_profile.id
            
            # Handle datetime to prevent timezone conversion
            if 'event_date' in data:
                from datetime import datetime
                event_date_str = data['event_date']
                if 'T' in event_date_str and len(event_date_str) == 16:  # Format: YYYY-MM-DDTHH:mm
                    event_date_str += ':00'  # Add seconds
                data['event_date'] = event_date_str
            
            print(f"Event creation data received: {data}")
            print(f"Event date received: {data.get('event_date')}")
            
            serializer = FamilyEventSerializer(data=data)
            if serializer.is_valid():
                event = serializer.save(organizer=current_profile)
                print(f"Event created successfully with date: {event.event_date}")
                
                # Auto-invite connected families if is_public=True
                if event.is_public:
                    from .models import FamilyConnection, EventInvitation
                    
                    # Get all connected families
                    connected_families = FamilyConnection.objects.filter(
                        (Q(initiator=current_profile) | Q(receiver=current_profile)),
                        status='accepted'
                    )
                    
                    invitations_sent = 0
                    for connection in connected_families:
                        # Get the other family (not current user)
                        invitee = connection.receiver if connection.initiator == current_profile else connection.initiator
                        
                        # Create invitation if not already exists
                        invitation, created = EventInvitation.objects.get_or_create(
                            event=event,
                            invitee=invitee,
                            defaults={'message': 'You have been automatically invited to this event.'}
                        )
                        if created:
                            invitations_sent += 1
                    
                    print(f"Auto-invited {invitations_sent} connected families to event {event.title}")
                    message = f'Event created successfully! Automatically sent {invitations_sent} invitations to connected families.'
                else:
                    message = 'Event created successfully'
                
                return Response({
                    'success': True,
                    'message': message,
                    'event_id': event.id
                })
            else:
                print(f"Event creation failed with errors: {serializer.errors}")
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=400)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to create event: {str(e)}'
            }, status=500)

class EventInvitationsView(APIView):
    """View to handle event invitations"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id=None):
        """Get existing invitations for an event"""
        try:
            from .models import FamilyEvent, EventInvitation
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            if not event_id:
                return Response({
                    'success': False,
                    'message': 'Event ID is required'
                }, status=400)
            
            # Get event and verify ownership
            try:
                event = FamilyEvent.objects.get(id=event_id, organizer=current_profile)
            except FamilyEvent.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Event not found or you are not the organizer'
                }, status=404)
            
            # Get existing invitations for this event
            invitations = EventInvitation.objects.filter(event=event).select_related('invitee')
            
            invitations_data = []
            for invitation in invitations:
                invitations_data.append({
                    'id': invitation.id,
                    'invitee_id': invitation.invitee.id,
                    'invitee_name': f"{invitation.invitee.surname} {invitation.invitee.name}",
                    'status': invitation.status,
                    'created_at': invitation.created_at.isoformat()
                })
            
            return Response({
                'success': True,
                'invitations': invitations_data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to fetch invitations: {str(e)}'
            }, status=500)
    
    def post(self, request):
        try:
            from .models import FamilyEvent, EventInvitation, FamilyConnection
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            event_id = request.data.get('event_id')
            invitee_ids = request.data.get('invitee_ids', [])
            message = request.data.get('message', '')
            
            if not event_id or not invitee_ids:
                return Response({
                    'success': False,
                    'message': 'Event ID and invitee IDs are required'
                }, status=400)
            
            # Get event
            try:
                event = FamilyEvent.objects.get(id=event_id, organizer=current_profile)
            except FamilyEvent.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Event not found or you are not the organizer'
                }, status=404)
            
            # Send invitations
            invitations_sent = 0
            for invitee_id in invitee_ids:
                try:
                    invitee = NewPersonalProfile.objects.get(id=invitee_id)
                    
                    # Check if families are connected
                    connection_exists = FamilyConnection.objects.filter(
                        ((Q(initiator=current_profile) & Q(receiver=invitee)) |
                         (Q(initiator=invitee) & Q(receiver=current_profile))),
                        status='accepted'
                    ).exists()
                    
                    if connection_exists:
                        invitation, created = EventInvitation.objects.get_or_create(
                            event=event,
                            invitee=invitee,
                            defaults={'message': message}
                        )
                        if created:
                            invitations_sent += 1
                            
                except NewPersonalProfile.DoesNotExist:
                    continue
            
            return Response({
                'success': True,
                'message': f'{invitations_sent} invitations sent successfully',
                'invitations_sent': invitations_sent
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to send invitations: {str(e)}'
            }, status=500)
    
    def delete(self, request, invitation_id=None):
        """Remove an invitation"""
        try:
            from .models import EventInvitation
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            if not invitation_id:
                return Response({
                    'success': False,
                    'message': 'Invitation ID is required'
                }, status=400)
            
            # Get invitation and verify ownership
            try:
                invitation = EventInvitation.objects.get(
                    id=invitation_id,
                    event__organizer=current_profile
                )
            except EventInvitation.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Invitation not found or you are not the organizer'
                }, status=404)
            
            # Delete the invitation
            invitation.delete()
            
            return Response({
                'success': True,
                'message': 'Invitation removed successfully'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to remove invitation: {str(e)}'
            }, status=500)

class EventResponseView(APIView):
    """View to respond to event invitations"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request, invitation_id):
        try:
            from .models import EventInvitation
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            response = request.data.get('response')  # 'accepted', 'declined', 'maybe'
            
            if response not in ['accepted', 'declined', 'maybe']:
                return Response({
                    'success': False,
                    'message': 'Invalid response. Use "accepted", "declined", or "maybe"'
                }, status=400)
            
            # Get invitation
            try:
                invitation = EventInvitation.objects.get(
                    id=invitation_id,
                    invitee=current_profile
                )
            except EventInvitation.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Invitation not found'
                }, status=404)
            
            # Update invitation status
            invitation.status = response
            invitation.save()
            
            return Response({
                'success': True,
                'message': f'Event invitation {response}',
                'invitation_status': invitation.status
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to respond to invitation: {str(e)}'
            }, status=500)

class EventAttendeesView(APIView):
    """View to get attendees list for an event"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, event_id):
        try:
            from .models import FamilyEvent, EventInvitation, FamilyConnection
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            # Get event
            try:
                event = FamilyEvent.objects.get(id=event_id)
            except FamilyEvent.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Event not found'
                }, status=404)
            
            # Get attendees (accepted invitations + organizer)
            attendees = []
            
            # Add organizer
            attendees.append({
                'name': f"{event.organizer.surname} {event.organizer.name}",
                'status': 'organizer',
                'profile_id': event.organizer.id
            })
            
            # Get invitations
            invitations = EventInvitation.objects.filter(event=event).select_related('invitee')
            
            for invitation in invitations:
                attendees.append({
                    'name': f"{invitation.invitee.surname} {invitation.invitee.name}",
                    'status': invitation.status,
                    'profile_id': invitation.invitee.id
                })
            
            return Response({
                'success': True,
                'attendees': attendees
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to fetch attendees: {str(e)}'
            }, status=500)

class FamilyUpdatesView(APIView):
    """View to handle family updates"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            from .models import FamilyUpdate, FamilyConnection
            from .serializers import FamilyUpdateSerializer
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            # Get connected families
            connected_families = FamilyConnection.objects.filter(
                (Q(initiator=current_profile) | Q(receiver=current_profile)),
                status='accepted'
            ).values_list('initiator_id', 'receiver_id')
            
            connected_ids = set([current_profile.id])  # Include own updates
            for initiator_id, receiver_id in connected_families:
                connected_ids.add(initiator_id if initiator_id != current_profile.id else receiver_id)
            
            # Get updates from connected families
            updates = FamilyUpdate.objects.filter(
                family_id__in=connected_ids,
                is_public=True
            ).order_by('-created_at')[:20]  # Limit to 20 recent updates
            
            serializer = FamilyUpdateSerializer(updates, many=True)
            
            return Response({
                'success': True,
                'updates': serializer.data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to fetch updates: {str(e)}'
            }, status=500)
    
    def post(self, request):
        try:
            from .models import FamilyUpdate
            from .serializers import FamilyUpdateSerializer
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            # Create update
            data = request.data.copy()
            
            serializer = FamilyUpdateSerializer(data=data)
            if serializer.is_valid():
                update = serializer.save(family=current_profile)
                
                return Response({
                    'success': True,
                    'message': 'Family update posted successfully',
                    'update_id': update.id
                })
            else:
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=400)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to post update: {str(e)}'
            }, status=500)

class FamilyProfileView(APIView):
    """View to get another family's profile details"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request, profile_id):
        try:
            from .models import FamilyConnection
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Your profile not found'
                }, status=404)
            
            # Get the requested profile
            try:
                target_profile = NewPersonalProfile.objects.get(id=profile_id)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            # Check if families are connected
            connection_exists = FamilyConnection.objects.filter(
                ((Q(initiator=current_profile) & Q(receiver=target_profile)) |
                 (Q(initiator=target_profile) & Q(receiver=current_profile))),
                status='accepted'
            ).exists()
            
            if not connection_exists:
                return Response({
                    'success': False,
                    'message': 'You can only view profiles of connected families'
                }, status=403)
            
            # Get family members
            family_members = NewFamilyMember.objects.filter(profile=target_profile)
            
            # Serialize the data
            from .serializers import NewPersonalProfileSerializer, NewFamilyMemberSerializer
            profile_data = NewPersonalProfileSerializer(target_profile).data
            family_members_data = NewFamilyMemberSerializer(family_members, many=True).data
            
            return Response({
                'success': True,
                'profile': profile_data,
                'family_members': family_members_data,
                'is_connected': True
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to fetch profile: {str(e)}'
            }, status=500)

class SignupView(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        print("Received data:", request.data)
        first_name = request.data.get('first_name', '')
        middle_name = request.data.get('middle_name', '')
        last_name = request.data.get('last_name', '')
        sakh = request.data.get('sakh', '')
        email = request.data.get('email', '')
        mobile = request.data.get('mobile')
        username = request.data.get('username')  # This will be the mobile number
        password = request.data.get('password')

        print(f"Parsed data: first_name='{first_name}', last_name='{last_name}', mobile='{mobile}', username='{username}', password='{'*' * len(password) if password else 'None'}'")

        # Check for missing required fields
        missing_fields = []
        if not first_name:
            missing_fields.append('first_name')
        if not last_name:
            missing_fields.append('last_name')
        if not email:
            missing_fields.append('email')
        if not mobile:
            missing_fields.append('mobile')
        if not password:
            missing_fields.append('password')

        if missing_fields:
            error_msg = f'Missing required fields: {", ".join(missing_fields)}'
            print(f"Validation error: {error_msg}")
            return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)

        # Clean mobile number and check variants for duplicate check
        clean_mobile = mobile.replace('+', '') if mobile else ''
        if clean_mobile.startswith('91') and len(clean_mobile) == 12:
            clean_mobile = clean_mobile[2:]
        
        mobile_variants = [mobile, clean_mobile]
        if mobile.startswith('+91'):
            mobile_variants.append(mobile[3:])
        
        # Check for duplicate mobile number in all variants
        for mobile_variant in mobile_variants:
            if User.objects.filter(username=mobile_variant).exists():
                error_msg = 'Mobile number already registered.'
                print(f"Validation error: {error_msg}")
                return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)
            
            if NewPersonalProfile.objects.filter(mobileNumber=mobile_variant).exists():
                error_msg = 'Mobile number already exists.'
                print(f"Validation error: {error_msg}")
                return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)

        try:
            # Create the User with mobile number as username
            user = User.objects.create_user(
                username=clean_mobile,  # Use clean mobile number as username
                password=password,
                first_name=first_name,
                last_name=last_name,
                email=email
            )

            # Create the NewPersonalProfile linked to the User
            profile = NewPersonalProfile.objects.create(
                user=user,
                surname=first_name,  # Changed from firstName
                name=middle_name,    # Changed from middleName
                fatherName=last_name, # Changed from lastName
                sakh=sakh,         # Added sakh field
                mobileNumber=clean_mobile,  # Use clean mobile number
                email=email,         # Use provided email
                age=18,  # Default age
                occupation="",  # Empty string for optional fields
                address="",
                city="",
                hometown="",
                caste="",
                subcaste=""
            )
            print(f"Successfully created user: {mobile} and profile")
            
            # Send email with signup details
            try:
                from django.core.mail import send_mail
                from django.conf import settings
                
                full_name = f"{first_name} {middle_name} {last_name} {sakh}".strip()
                
                subject = "Welcome to IntroBook - Your Account Details"
                message = f"""
Dear {full_name},

Welcome to IntroBook! Your account has been successfully created.

Your Account Details:
- User Number: #{profile.user_number}
- Full Name: {full_name}
- Mobile Number: {clean_mobile}
- Email: {email}
- Password: {password}

IMPORTANT: Please remember your mobile number and password for future logins.

Thank you for joining our community!

Best regards,
IntroBook Team
"""
                
                send_mail(
                    subject,
                    message,
                    settings.DEFAULT_FROM_EMAIL,
                    [email],
                    fail_silently=True,
                )
                print(f"Welcome email sent to {email}")
            except Exception as e:
                print(f"Failed to send email: {str(e)}")
            
            return Response({
                'message': 'User and profile created successfully. Welcome email sent!',
                'user_number': profile.get_user_id(),
                'full_name': full_name
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            error_msg = f'Error creating user: {str(e)}'
            print(f"Exception: {error_msg}")
            return Response({'error': error_msg}, status=status.HTTP_400_BAD_REQUEST)

class SendOTP(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        mobile = request.data.get('mobile') or request.data.get('mobile_number')
        request_type = request.data.get('type', 'login')  # 'login' or 'signup'
        print(f"SendOTP request received for mobile: {mobile}, type: {request_type}")
        
        if not mobile:
            return Response({'error': 'Mobile number required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Clean mobile number and check variants
        clean_mobile = mobile.replace('+', '') if mobile else ''
        if clean_mobile.startswith('91') and len(clean_mobile) == 12:
            clean_mobile = clean_mobile[2:]
        
        mobile_variants = [mobile, clean_mobile]
        if mobile.startswith('+91'):
            mobile_variants.append(mobile[3:])
        
        # Check if mobile number exists in system
        mobile_exists = False
        for mobile_variant in mobile_variants:
            if (User.objects.filter(username=mobile_variant).exists() or 
                NewPersonalProfile.objects.filter(mobileNumber=mobile_variant).exists() or
                FamilyMemberAuth.objects.filter(mobile_number=mobile_variant, is_active=True).exists()):
                mobile_exists = True
                break
        
        # For signup: only send OTP if mobile number is NOT in system
        # For login: only send OTP if mobile number IS in system
        if request_type == 'signup':
            if mobile_exists:
                return Response({'error': 'Mobile number already registered'}, status=status.HTTP_400_BAD_REQUEST)
        else:  # login
            if not mobile_exists:
                return Response({'error': 'Mobile number not found in system'}, status=status.HTTP_404_NOT_FOUND)
        
        # For development/testing, let's create a simple OTP without Twilio
        try:
            # Generate a simple 6-digit OTP
            otp_code = str(random.randint(100000, 999999))
            
            # Store OTP in memory (in production, use a proper database)
            OTP_STORE[mobile] = otp_code
            
            print(f"Generated OTP for {mobile}: {otp_code}")
            
            # For now, just return success without actually sending SMS
            # In production, you would integrate with Twilio or another SMS service
            message = f'OTP sent to {mobile} (for testing: {otp_code})'
            if request_type == 'signup':
                message = f'Signup OTP sent to {mobile} (for testing: {otp_code})'
            
            return Response({
                'status': 'pending',
                'message': message
            })
            
        except Exception as e:
            print(f"Error in SendOTP: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class VerifyOTP(APIView):
    permission_classes = [AllowAny]
    def post(self, request):
        mobile = request.data.get('mobile')
        code = request.data.get('otp') or request.data.get('code')
        print(f"VerifyOTP request received for mobile: {mobile}, code: {code}")
        
        if not mobile or not code:
            return Response({'error': 'Mobile and OTP required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Check if OTP exists and matches
            stored_otp = OTP_STORE.get(mobile)
            print(f"Stored OTP for {mobile}: {stored_otp}")
            
            if stored_otp and stored_otp == code:
                # Remove OTP from store after successful verification
                del OTP_STORE[mobile]
                print(f"OTP verified successfully for {mobile}")
                return Response({
                    'success': True,
                    'status': 'approved',
                    'message': 'OTP verified successfully'
                })
            else:
                print(f"OTP verification failed for {mobile}")
                return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            print(f"Error in VerifyOTP: {str(e)}")
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        mobile = data.get('mobile')
        password = data.get('password')
        login_type = data.get('login_type', 'user')
        print("Login attempt:", data)
        print("Authenticating with mobile number:", mobile, "password:", password, "type:", login_type)
        
        # Handle admin login - skip OTP for admin
        if login_type == 'admin':
            # Clean mobile number for admin check
            clean_admin_mobile = mobile.replace('+', '').replace('91', '') if mobile.startswith('+91') else mobile
            if clean_admin_mobile == '9876543210' and password == 'admin123':
                # Create or get admin user
                admin_user, created = User.objects.get_or_create(
                    username='admin',
                    defaults={
                        'first_name': 'Admin',
                        'last_name': 'User',
                        'email': 'admin@introbook.com',
                        'is_staff': True,
                        'is_superuser': True
                    }
                )
                if created or not admin_user.is_staff:
                    admin_user.set_password('admin123')
                    admin_user.is_staff = True
                    admin_user.is_superuser = True
                    admin_user.save()
                
                token, created = Token.objects.get_or_create(user=admin_user)
                return JsonResponse({
                    'success': True,
                    'token': token.key,
                    'message': 'Admin login successful',
                    'user_type': 'admin',
                    'login_type': 'admin'
                })
            else:
                return JsonResponse({'success': False, 'message': 'Invalid admin credentials'}, status=401)
        
        # Clean mobile number (remove + and country code if present)
        clean_mobile = mobile.replace('+', '') if mobile else ''
        # Remove Indian country code 91 if present
        if clean_mobile.startswith('91') and len(clean_mobile) == 12:
            clean_mobile = clean_mobile[2:]  # Remove '91' prefix
        
        # Also try with original mobile format for backward compatibility
        mobile_variants = [mobile, clean_mobile]
        if mobile.startswith('+91'):
            mobile_variants.append(mobile[3:])  # Remove '+91' directly
        
        # Remove duplicates and print for debugging
        mobile_variants = list(set(mobile_variants))
        print(f"Mobile variants to try: {mobile_variants}")
        
        # Check if mobile number exists in system before authentication
        mobile_exists = False
        for mobile_variant in mobile_variants:
            if (User.objects.filter(username=mobile_variant).exists() or 
                NewPersonalProfile.objects.filter(mobileNumber=mobile_variant).exists() or
                FamilyMemberAuth.objects.filter(mobile_number=mobile_variant, is_active=True).exists()):
                mobile_exists = True
                break
        
        if not mobile_exists:
            return JsonResponse({'success': False, 'message': 'Mobile number not found in system'}, status=404)
        
        # Try multiple authentication methods
        user = None
        
        # Method 1: Try family member authentication FIRST with all mobile variants (prioritize family members)
        for mobile_variant in mobile_variants:
            try:
                family_auth = FamilyMemberAuth.objects.get(mobile_number=mobile_variant, is_active=True)
                user = authenticate(username=family_auth.user.username, password=password)
                if user and user == family_auth.user:
                    print(f"✓ Family member login successful with variant '{mobile_variant}': {user.username}")
                    # Update last login
                    family_auth.last_login = timezone.now()
                    family_auth.save()
                    token, created = Token.objects.get_or_create(user=user)
                    return JsonResponse({
                        'success': True, 
                        'token': token.key, 
                        'message': 'Family member login successful',
                        'user_type': 'family_member',
                        'family_member_id': family_auth.family_member.id,
                        'family_member_name': f"{family_auth.family_member.surname} {family_auth.family_member.name}"
                    })
            except FamilyMemberAuth.DoesNotExist:
                continue
        
        # Method 2: Try with all mobile variants as username (main user)
        for mobile_variant in mobile_variants:
            user = authenticate(username=mobile_variant, password=password)
            if user:
                print(f"✓ Login successful with mobile variant '{mobile_variant}' as username: {user.username}")
                token, created = Token.objects.get_or_create(user=user)
                return JsonResponse({
                    'success': True, 
                    'token': token.key, 
                    'message': 'Login successful',
                    'user_type': 'main_user'
                })
        
        # Method 3: Try to find user by profile mobile number with all variants (main user)
        for mobile_variant in mobile_variants:
            try:
                profile = NewPersonalProfile.objects.get(mobileNumber=mobile_variant)
                user = authenticate(username=profile.user.username, password=password)
                if user and user == profile.user:
                    print(f"✓ Login successful via profile mobile variant '{mobile_variant}': {user.username}")
                    token, created = Token.objects.get_or_create(user=user)
                    return JsonResponse({
                        'success': True, 
                        'token': token.key, 
                        'message': 'Login successful',
                        'user_type': 'main_user'
                    })
            except NewPersonalProfile.DoesNotExist:
                continue
        
        # If all methods fail for user login
        print(f"✗ All authentication methods failed for mobile: {mobile}")
        return JsonResponse({'success': False, 'message': 'Invalid mobile number or password'}, status=401)
    
    return JsonResponse({'error': 'POST request required'}, status=400)

@api_view(['GET'])
def families_list(request):
    # Dummy data for now
    families = [
        {
            "id": 1,
            "family_name": "Patel Family",
            "owner_mobile": "9876543210",
            "members": ["Dharmik", "Amit", "Priya"]
        },
        {
            "id": 2,
            "family_name": "Shah Family",
            "owner_mobile": "9123456789",
            "members": ["Rina", "Kiran"]
        }
    ]
    return Response({"families": families})

class UserProfileView(generics.RetrieveUpdateAPIView):
    serializer_class = UserProfileSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_object(self):
        return self.request.user

class FamilyViewSet(viewsets.ModelViewSet):
    queryset = Family.objects.all().prefetch_related('members')
    serializer_class = FamilySerializer
    permission_classes = [AllowAny]

class NewProfileListView(APIView):
    """View to list new profiles in the community"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get all profiles excluding the current user's profile
            current_user_profile = None
            try:
                # Check if user is a family member
                family_auth = FamilyMemberAuth.objects.get(user=request.user, is_active=True)
                current_user_profile = family_auth.family_member.profile
            except FamilyMemberAuth.DoesNotExist:
                # Main user
                current_user_profile = NewPersonalProfile.objects.get(user=request.user)
            
            # Get all profiles except current user's profile, ordered by creation date (newest first)
            profiles = NewPersonalProfile.objects.exclude(
                id=current_user_profile.id
            ).order_by('-id')[:20]  # Limit to 20 newest profiles
            
            profiles_data = []
            for profile in profiles:
                try:
                    serializer = NewPersonalProfileSerializer(profile)
                    profile_data = serializer.data
                    profiles_data.append(profile_data)
                except Exception as e:
                    print(f"Error serializing profile {profile.id}: {e}")
                    continue
            
            return Response({
                'success': True,
                'profiles': profiles_data,
                'count': len(profiles_data)
            })
            
        except NewPersonalProfile.DoesNotExist:
            return Response({
                'error': 'User profile not found'
            }, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            print(f"Error in NewProfileListView: {e}")
            return Response({
                'error': 'Failed to fetch profiles'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class UserPermissionsView(APIView):
    """View to handle user permissions and access control"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        """Get current user's permissions and access level"""
        try:
            # Check if user is a family member or main user
            try:
                family_auth = FamilyMemberAuth.objects.get(user=request.user, is_active=True)
                # User is a family member
                family_member = family_auth.family_member
                main_profile = family_member.profile
                
                return Response({
                    'success': True,
                    'user_type': 'family_member',
                    'permissions': {
                        'can_edit_profile': False,
                        'can_view_profile': True,
                        'can_send_messages': True,
                        'can_view_connections': True,
                        'can_create_events': False,
                        'can_manage_family_members': False
                    },
                    'family_member_info': {
                        'id': family_member.id,
                        'name': f"{family_member.surname} {family_member.name}",
                        'relation': family_member.relation,
                        'mobile': family_auth.mobile_number
                    },
                    'main_profile_id': main_profile.id
                })
                
            except FamilyMemberAuth.DoesNotExist:
                # User is main user
                try:
                    main_profile = NewPersonalProfile.objects.get(user=request.user)
                    
                    return Response({
                        'success': True,
                        'user_type': 'main_user',
                        'permissions': {
                            'can_edit_profile': True,
                            'can_view_profile': True,
                            'can_send_messages': True,
                            'can_view_connections': True,
                            'can_create_events': True,
                            'can_manage_family_members': True
                        },
                        'profile_id': main_profile.id
                    })
                    
                except NewPersonalProfile.DoesNotExist:
                    return Response({
                        'success': False,
                        'message': 'Profile not found'
                    }, status=404)
                    
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to fetch permissions: {str(e)}'
            }, status=500)

@api_view(['POST'])
@permission_classes([AllowAny])
def register(request):
    """
    API endpoint for user registration
    This is a function-based view that wraps the SignupView functionality
    """
    signup_view = SignupView()
    signup_view.request = request
    return signup_view.post(request)

class UserNumbersView(APIView):
    """View to get user and member numbers information"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get current user's profile and number
            try:
                # Check if user is a family member
                family_auth = FamilyMemberAuth.objects.get(user=request.user, is_active=True)
                family_member = family_auth.family_member
                main_profile = family_member.profile
                
                return Response({
                    'success': True,
                    'user_type': 'family_member',
                    'member_number': family_member.get_member_id(),
                    'member_name': f"{family_member.surname} {family_member.name}",
                    'main_user_number': main_profile.get_user_id(),
                    'main_user_name': f"{main_profile.surname} {main_profile.name}"
                })
                
            except FamilyMemberAuth.DoesNotExist:
                # Main user
                profile = NewPersonalProfile.objects.get(user=request.user)
                
                # Get family members count and their numbers
                family_members = profile.family_members.all()
                family_members_info = []
                for member in family_members:
                    family_members_info.append({
                        'member_number': member.get_member_id(),
                        'name': f"{member.surname} {member.name}",
                        'relation': member.relation
                    })
                
                return Response({
                    'success': True,
                    'user_type': 'main_user',
                    'user_number': profile.get_user_id(),
                    'user_name': f"{profile.surname} {profile.name}",
                    'family_members': family_members_info,
                    'total_family_members': len(family_members_info)
                })
                
        except NewPersonalProfile.DoesNotExist:
            return Response({
                'success': False,
                'message': 'Profile not found'
            }, status=404)
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to fetch user numbers: {str(e)}'
            }, status=500)

class SearchFamiliesView(APIView):
    """View to search for families by name or surname"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            # Get search query
            search_query = request.query_params.get('q', '').strip()
            
            if not search_query:
                return Response({
                    'success': False,
                    'message': 'Search query is required'
                }, status=400)
            
            # Get existing connections to exclude them from search results
            from .models import FamilyConnection
            existing_connections = FamilyConnection.objects.filter(
                initiator=current_profile
            ).values_list('receiver_id', flat=True)
            
            received_connections = FamilyConnection.objects.filter(
                receiver=current_profile
            ).values_list('initiator_id', flat=True)
            
            # Combine both lists to exclude all connected profiles
            excluded_ids = list(existing_connections) + list(received_connections) + [current_profile.id]
            
            # Search for families by surname or name (case-insensitive)
            search_results = NewPersonalProfile.objects.filter(
                Q(surname__icontains=search_query) |
                Q(name__icontains=search_query) |
                Q(fatherName__icontains=search_query)
            ).exclude(id__in=excluded_ids)[:20]  # Limit to 20 results
            
            # Format search results
            results_data = []
            for profile in search_results:
                family_members_count = profile.family_members.count()
                
                results_data.append({
                    'id': profile.id,
                    'surname': profile.surname,
                    'name': profile.name,
                    'fatherName': profile.fatherName,
                    'fullName': f"{profile.surname} {profile.name}",
                    'city': profile.city,
                    'hometown': profile.hometown,
                    'occupation': profile.occupation,
                    'membersCount': family_members_count + 1,  # +1 for main user
                    'avatar': profile.avatar.url if profile.avatar else None,
                    'caste': profile.caste,
                    'subcaste': profile.subcaste,
                    'age': profile.age
                })
            
            return Response({
                'success': True,
                'results': results_data,
                'count': len(results_data),
                'search_query': search_query
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Search failed: {str(e)}'
            }, status=500)

class FamilyEventDetailView(APIView):
    """View to handle individual event operations"""
    permission_classes = [IsAuthenticated]
    
    def put(self, request, event_id):
        """Update an existing event"""
        try:
            from .models import FamilyEvent
            from .serializers import FamilyEventSerializer
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            # Get event and verify ownership
            try:
                event = FamilyEvent.objects.get(id=event_id, organizer=current_profile)
            except FamilyEvent.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Event not found or you are not the organizer'
                }, status=404)
            
            # Update event
            data = request.data.copy()
            data['organizer'] = current_profile.id
            
            # Handle datetime to prevent timezone conversion
            if 'event_date' in data:
                from datetime import datetime
                event_date_str = data['event_date']
                if 'T' in event_date_str and len(event_date_str) == 16:  # Format: YYYY-MM-DDTHH:mm
                    event_date_str += ':00'  # Add seconds
                data['event_date'] = event_date_str
            
            print(f"Event update data received: {data}")
            print(f"Event date received: {data.get('event_date')}")
            
            serializer = FamilyEventSerializer(event, data=data, partial=True)
            if serializer.is_valid():
                updated_event = serializer.save()
                print(f"Event updated successfully with date: {updated_event.event_date}")
                
                # Auto-invite connected families if is_public=True (for updates too)
                if updated_event.is_public:
                    from .models import FamilyConnection, EventInvitation
                    
                    # Get all connected families
                    connected_families = FamilyConnection.objects.filter(
                        (Q(initiator=current_profile) | Q(receiver=current_profile)),
                        status='accepted'
                    )
                    
                    invitations_sent = 0
                    for connection in connected_families:
                        # Get the other family (not current user)
                        invitee = connection.receiver if connection.initiator == current_profile else connection.initiator
                        
                        # Create invitation if not already exists
                        invitation, created = EventInvitation.objects.get_or_create(
                            event=updated_event,
                            invitee=invitee,
                            defaults={'message': 'You have been automatically invited to this event.'}
                        )
                        if created:
                            invitations_sent += 1
                    
                    print(f"Auto-invited {invitations_sent} new connected families to updated event {updated_event.title}")
                    message = f'Event updated successfully! Sent {invitations_sent} new invitations to connected families.'
                else:
                    message = 'Event updated successfully'
                
                return Response({
                    'success': True,
                    'message': message,
                    'event_id': updated_event.id
                })
            else:
                print(f"Event update failed with errors: {serializer.errors}")
                return Response({
                    'success': False,
                    'errors': serializer.errors
                }, status=400)
                
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to update event: {str(e)}'
            }, status=500)
    
    def delete(self, request, event_id):
        try:
            from .models import FamilyEvent
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            # Get event and verify ownership
            try:
                event = FamilyEvent.objects.get(id=event_id, organizer=current_profile)
            except FamilyEvent.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Event not found or you are not the organizer'
                }, status=404)
            
            # Delete the event
            event.delete()
            
            return Response({
                'success': True,
                'message': 'Event deleted successfully'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to delete event: {str(e)}'
            }, status=500)

class ForgotPasswordView(APIView):
    """View to handle forgot password with OTP"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        mobile = request.data.get('mobile')
        
        if not mobile:
            return Response({'error': 'Mobile number required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Clean mobile number
            clean_mobile = mobile.replace('+', '') if mobile else ''
            if clean_mobile.startswith('91') and len(clean_mobile) == 12:
                clean_mobile = clean_mobile[2:]
            
            mobile_variants = [mobile, clean_mobile]
            if mobile.startswith('+91'):
                mobile_variants.append(mobile[3:])
            
            # Check if mobile number exists in system
            user_found = False
            for mobile_variant in mobile_variants:
                if User.objects.filter(username=mobile_variant).exists() or NewPersonalProfile.objects.filter(mobileNumber=mobile_variant).exists():
                    user_found = True
                    break
            
            if not user_found:
                return Response({'error': 'Mobile number not registered'}, status=status.HTTP_404_NOT_FOUND)
            
            # Generate OTP and store with original mobile format
            otp_code = str(random.randint(100000, 999999))
            OTP_STORE[mobile] = otp_code
            
            # Also store with clean mobile format for compatibility
            for variant in mobile_variants:
                OTP_STORE[variant] = otp_code
            
            print(f"\n=== FORGOT PASSWORD OTP ===")
            print(f"Mobile: {mobile}")
            print(f"OTP: {otp_code}")
            print(f"Variants stored: {mobile_variants}")
            print(f"==========================\n")
            
            return Response({
                'success': True,
                'message': f'Password reset OTP sent to {mobile} (for testing: {otp_code})'
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class MobileLoginOtpView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        mobile = request.data.get('mobile')
        if not mobile:
            return Response({'error': 'Mobile number required'}, status=400)
        
        # Clean mobile number and check variants
        clean_mobile = mobile.replace('+', '').replace(' ', '').replace('-', '')
        if clean_mobile.startswith('91') and len(clean_mobile) == 12:
            clean_mobile = clean_mobile[2:]
        
        # Check if mobile exists in uploaded data and belongs to main user (not family member)
        mobile_variants = [mobile, clean_mobile]
        if mobile.startswith('+91'):
            mobile_variants.append(mobile[3:])
        
        main_user_exists = False
        for variant in mobile_variants:
            if NewPersonalProfile.objects.filter(mobileNumber=variant).exists():
                main_user_exists = True
                break
        
        if not main_user_exists:
            return Response({'error': 'Mobile number not found in system'}, status=404)
        
        # Check if this mobile belongs to a family member (prevent family member login)
        family_member_exists = False
        for variant in mobile_variants:
            if NewFamilyMember.objects.filter(mobileNumber=variant).exists():
                family_member_exists = True
                break
        
        if family_member_exists:
            return Response({'error': 'Family members cannot login through mobile login. Please contact the main user.'}, status=403)
        
        # Check if main user already has a proper password set (not temp123)
        for variant in mobile_variants:
            try:
                profile = NewPersonalProfile.objects.get(mobileNumber=variant)
                user = profile.user
                # If user has changed from default temp123 password, they should use regular login
                if user.check_password('temp123'):
                    # Still has temp password, can use mobile login
                    continue
                else:
                    # Has set custom password, must use regular login
                    return Response({'error': 'You have already set a password. Please use the regular login page.'}, status=403)
            except NewPersonalProfile.DoesNotExist:
                continue
        
        # Generate OTP and store for all variants
        otp_code = str(random.randint(100000, 999999))
        for variant in mobile_variants:
            OTP_STORE[variant] = otp_code
        
        print(f"\n=== MOBILE LOGIN OTP ===")
        print(f"Mobile: {mobile}")
        print(f"OTP: {otp_code}")
        print(f"======================\n")
        
        return Response({
            'success': True,
            'message': f'OTP sent to {mobile} (for testing: {otp_code})'
        })

class VerifyMobileOtpView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        mobile = request.data.get('mobile')
        otp = request.data.get('otp')
        
        if not mobile or not otp:
            return Response({'error': 'Mobile and OTP required'}, status=400)
        
        # Check OTP for mobile variants
        clean_mobile = mobile.replace('+', '').replace(' ', '').replace('-', '')
        if clean_mobile.startswith('91') and len(clean_mobile) == 12:
            clean_mobile = clean_mobile[2:]
        
        mobile_variants = [mobile, clean_mobile]
        if mobile.startswith('+91'):
            mobile_variants.append(mobile[3:])
        
        otp_valid = False
        for variant in mobile_variants:
            if OTP_STORE.get(variant) == otp:
                otp_valid = True
                break
        
        if not otp_valid:
            return Response({'error': 'Invalid OTP'}, status=400)
        
        return Response({'success': True, 'message': 'OTP verified'})

class SetMobilePasswordView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        mobile = request.data.get('mobile')
        password = request.data.get('password')
        
        if not mobile or not password:
            return Response({'error': 'Mobile and password required'}, status=400)
        
        try:
            # Find user by mobile variants
            clean_mobile = mobile.replace('+', '').replace(' ', '').replace('-', '')
            if clean_mobile.startswith('91') and len(clean_mobile) == 12:
                clean_mobile = clean_mobile[2:]
            
            mobile_variants = [mobile, clean_mobile]
            if mobile.startswith('+91'):
                mobile_variants.append(mobile[3:])
            
            profile = None
            for variant in mobile_variants:
                try:
                    profile = NewPersonalProfile.objects.get(mobileNumber=variant)
                    break
                except NewPersonalProfile.DoesNotExist:
                    continue
            
            if not profile:
                return Response({'error': 'User not found'}, status=404)
            
            user = profile.user
            
            # Set password
            user.set_password(password)
            user.save()
            
            # Remove OTP for all variants
            for variant in mobile_variants:
                if variant in OTP_STORE:
                    del OTP_STORE[variant]
            
            # Generate token
            from rest_framework.authtoken.models import Token
            token, created = Token.objects.get_or_create(user=user)
            
            return Response({
                'success': True,
                'token': token.key,
                'message': 'Password set successfully'
            })
            
        except NewPersonalProfile.DoesNotExist:
            return Response({'error': 'User not found'}, status=404)
        except Exception as e:
            return Response({'error': str(e)}, status=500)

class ResetPasswordView(APIView):
    """View to reset password after OTP verification"""
    permission_classes = [AllowAny]
    
    def post(self, request):
        mobile = request.data.get('mobile')
        otp = request.data.get('otp')
        new_password = request.data.get('new_password')
        
        if not all([mobile, otp, new_password]):
            return Response({'error': 'Mobile, OTP and new password required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # Verify OTP - check all mobile variants
            stored_otp = None
            for variant in [mobile, mobile.replace('+', ''), mobile.replace('+91', '')]:
                if OTP_STORE.get(variant) == otp:
                    stored_otp = otp
                    break
            
            if not stored_otp:
                return Response({'error': 'Invalid OTP'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Clean mobile number
            clean_mobile = mobile.replace('+', '') if mobile else ''
            if clean_mobile.startswith('91') and len(clean_mobile) == 12:
                clean_mobile = clean_mobile[2:]
            
            mobile_variants = [mobile, clean_mobile]
            if mobile.startswith('+91'):
                mobile_variants.append(mobile[3:])
            
            # Find and update user password
            user_updated = False
            for mobile_variant in mobile_variants:
                try:
                    user = User.objects.get(username=mobile_variant)
                    user.set_password(new_password)
                    user.save()
                    user_updated = True
                    break
                except User.DoesNotExist:
                    try:
                        profile = NewPersonalProfile.objects.get(mobileNumber=mobile_variant)
                        profile.user.set_password(new_password)
                        profile.user.save()
                        user_updated = True
                        break
                    except NewPersonalProfile.DoesNotExist:
                        continue
            
            if not user_updated:
                return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
            
            # Remove OTP from store for all variants
            for variant in [mobile, mobile.replace('+', ''), mobile.replace('+91', '')]:
                if variant in OTP_STORE:
                    del OTP_STORE[variant]
            
            return Response({
                'success': True,
                'message': 'Password reset successfully'
            })
            
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def parse_gujarati_name(full_name):
    """Parse Gujarati name to extract surname and sakh"""
    if not full_name or pd.isna(full_name):
        return '', ''
    
    name = str(full_name).strip()
    
    # Remove prefixes like સ્વ., ગં.સ્વ
    prefixes = ['સ્વ.', 'ગં.સ્વ', 'સ્વ', 'ગં.સ્વ.']
    for prefix in prefixes:
        if name.startswith(prefix):
            name = name[len(prefix):].strip()
            break
    
    # Split name into parts
    parts = name.split()
    if len(parts) == 0:
        return '', ''
    elif len(parts) == 1:
        return parts[0], parts[0]  # surname and sakh same
    else:
        # Last word is sakh, first word is surname
        surname = parts[0]
        sakh = parts[-1]
        return surname, sakh

def parse_address(address):
    """Parse address to extract area and city"""
    if not address or pd.isna(address):
        return '', '', address
    
    addr = str(address).strip()
    
    # Split by comma and get parts
    parts = [part.strip() for part in addr.split(',')]
    
    if len(parts) < 2:
        return '', '', addr
    
    # Last part is city, second to last is area
    city = parts[-1]
    area = parts[-2] if len(parts) > 1 else ''
    
    # Remove city and area from address for remaining address
    remaining_parts = parts[:-2] if len(parts) > 2 else []
    remaining_address = ', '.join(remaining_parts)
    
    return area, city, remaining_address

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
            processed_mains = set()
            
            print(f"\n=== EXCEL UPLOAD STARTED ===")
            print(f"Excel loaded: {len(df)} rows, {len(df.columns)} columns")
            print(f"First row data: {df.iloc[0].tolist() if len(df) > 0 else 'No data'}")
            print(f"Current database has {NewPersonalProfile.objects.count()} existing users")
            
            # Get unique main members from column 0
            main_members = df.iloc[:, 0].dropna().unique()
            print(f"Found {len(main_members)} main members in Excel: {list(main_members)[:5]}")
            
            # Debug: Show all data for first few rows
            print("\nDetailed Excel data:")
            for i in range(min(10, len(df))):
                print(f"Row {i}:")
                for j in range(len(df.columns)):
                    val = df.iloc[i, j]
                    print(f"  Col{j}: '{val}' (type: {type(val).__name__})")
                print()
            
            for main_name in main_members:
                try:
                    main_name = str(main_name).strip()
                    if not main_name or main_name in processed_mains:
                        continue
                    
                    # Find all rows for this main person
                    family_rows = df[df.iloc[:, 0] == main_name]
                    
                    # Find પોતે (self) row first
                    pote_row = None
                    for _, row in family_rows.iterrows():
                        relation = str(row.iloc[2]).strip() if len(row) > 2 and not pd.isna(row.iloc[2]) else ''
                        if 'પોતે' in relation:
                            pote_row = row
                            break
                    
                    if pote_row is None:
                        continue
                    
                    # Check if પોતે has mobile number (check multiple columns)
                    main_mobile = ''
                    for col_idx in [7, 8, 9, 10]:  # Check multiple columns for mobile
                        if len(pote_row) > col_idx and not pd.isna(pote_row.iloc[col_idx]):
                            mobile_val = str(pote_row.iloc[col_idx]).strip()
                            if mobile_val and mobile_val.replace(' ', '').replace('-', '').replace('+', '').isdigit():
                                main_mobile = mobile_val.replace(' ', '').replace('-', '').replace('+', '')
                                if len(main_mobile) >= 10:
                                    break
                    print(f"Found mobile for પોતે: '{main_mobile}'")
                    
                    # If પોતે has no mobile, find first family member with mobile
                    if not main_mobile or len(main_mobile) < 10:
                        print(f"પોતે {main_name} has no mobile, looking for family member with mobile...")
                        
                        main_user_row = None
                        selected_mobile = None
                        selected_name = None
                        
                        # Debug: Print all family members with ALL columns
                        print(f"\nFamily members for {main_name}:")
                        for idx, row in family_rows.iterrows():
                            member_name = str(row.iloc[1]).strip() if len(row) > 1 and not pd.isna(row.iloc[1]) else ''
                            relation = str(row.iloc[2]).strip() if len(row) > 2 and not pd.isna(row.iloc[2]) else ''
                            print(f"  Member: {member_name} ({relation})")
                            # Show all columns for this member
                            for col_idx in range(len(row)):
                                val = row.iloc[col_idx]
                                print(f"    Col{col_idx}: '{val}'")
                            print()
                        
                        # Priority relations for main user selection
                        priority_relations = ['પુત્ર', 'પત્ની', 'પુત્રવધુ', 'દીકરી', 'ભાઈ', 'બહેન']
                        
                        # First try priority relations
                        for priority_rel in priority_relations:
                            for _, row in family_rows.iterrows():
                                relation = str(row.iloc[2]).strip() if len(row) > 2 and not pd.isna(row.iloc[2]) else ''
                                if priority_rel in relation and 'પોતે' not in relation:
                                    # Check multiple columns for mobile
                                    member_mobile = ''
                                    for col_idx in [7, 8, 9, 10]:
                                        if len(row) > col_idx and not pd.isna(row.iloc[col_idx]):
                                            mobile_val = str(row.iloc[col_idx]).strip()
                                            if mobile_val and mobile_val.replace(' ', '').replace('-', '').replace('+', '').isdigit():
                                                member_mobile = mobile_val.replace(' ', '').replace('-', '').replace('+', '')
                                                if len(member_mobile) >= 10:
                                                    break
                                    
                                    if member_mobile and len(member_mobile) >= 10:
                                        main_user_row = row
                                        selected_mobile = member_mobile
                                        selected_name = str(row.iloc[1]).strip() if len(row) > 1 and not pd.isna(row.iloc[1]) else ''
                                        print(f"Found priority member: {selected_name} ({relation}) with mobile: {selected_mobile}")
                                        break
                            if main_user_row is not None:
                                break
                        
                        # If no priority relation found, take any family member with mobile
                        if main_user_row is None:
                            for _, row in family_rows.iterrows():
                                relation = str(row.iloc[2]).strip() if len(row) > 2 and not pd.isna(row.iloc[2]) else ''
                                if 'પોતે' not in relation:
                                    # Check multiple columns for mobile
                                    member_mobile = ''
                                    for col_idx in [7, 8, 9, 10]:
                                        if len(row) > col_idx and not pd.isna(row.iloc[col_idx]):
                                            mobile_val = str(row.iloc[col_idx]).strip()
                                            if mobile_val and mobile_val.replace(' ', '').replace('-', '').replace('+', '').isdigit():
                                                member_mobile = mobile_val.replace(' ', '').replace('-', '').replace('+', '')
                                                if len(member_mobile) >= 10:
                                                    break
                                    
                                    if member_mobile and len(member_mobile) >= 10:
                                        main_user_row = row
                                        selected_mobile = member_mobile
                                        selected_name = str(row.iloc[1]).strip() if len(row) > 1 and not pd.isna(row.iloc[1]) else ''
                                        print(f"Found any member: {selected_name} ({relation}) with mobile: {selected_mobile}")
                                        break
                        
                        if main_user_row is not None:
                            # Use the selected family member as main user
                            main_name = selected_name
                            main_mobile = selected_mobile
                            print(f"SUCCESS: Making {main_name} the main user with mobile: {main_mobile}")
                        else:
                            print(f"ERROR: No family member with mobile found for {main_name}")
                            print(f"Checked {len(family_rows)} family members")
                            continue
                    else:
                        print(f"Processing main user: {main_name}, mobile: {main_mobile}")
                    
                    if not main_mobile or len(main_mobile) < 10:
                        print(f"Invalid mobile for {main_name}: '{main_mobile}'")
                        continue
                    
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
                        processed_mains.add(main_name)
                        records_skipped += 1
                        print(f"✓ SKIPPED: {main_name} (mobile: {existing_variant}) - preserving existing data")
                        continue
                    
                    # Create main user
                    user = User.objects.create_user(
                        username=main_mobile,
                        password='temp123',
                        first_name=main_name,
                        email=f"{main_mobile}@temp.com"
                    )
                    
                    # Parse main name to get surname and sakh
                    surname, name_sakh = parse_gujarati_name(main_name)
                    
                    # Parse address to get area and city
                    full_address = str(pote_row.iloc[10]).strip() if len(pote_row) > 10 and not pd.isna(pote_row.iloc[10]) else ''
                    area, city, remaining_address = parse_address(full_address)
                    
                    # Use પોતે row data for profile, but main user's mobile
                    profile_data = {
                        'user': user,
                        'surname': surname,  # Parsed surname from name
                        'name': main_name,   # Keep full name
                        'fatherName': surname,
                        'sakh': name_sakh,   # Use sakh from parsed name
                        'mobileNumber': main_mobile,  # Use the mobile from main user (could be family member)
                        'email': f"{main_mobile}@temp.com",
                        'age': 30,
                        'occupation': str(pote_row.iloc[9]).strip() if len(pote_row) > 9 and not pd.isna(pote_row.iloc[9]) else '',  # Column 9: વ્યવસાય
                        'address': remaining_address,  # Remaining address after removing area and city
                        'area': area,  # Parsed area
                        'city': city   # Parsed city
                    }
                    
                    profile = NewPersonalProfile.objects.create(**profile_data)
                    
                    # Add family members (excluding the one who became main user if applicable)
                    for _, row in family_rows.iterrows():
                        member_name = str(row.iloc[1]).strip() if not pd.isna(row.iloc[1]) else ''  # Column 1: કુટુંબના સભ્યનું નામ
                        relation = str(row.iloc[2]).strip() if len(row) > 2 and not pd.isna(row.iloc[2]) else ''
                        member_mobile = str(row.iloc[7]).strip() if len(row) > 7 and not pd.isna(row.iloc[7]) else ''
                        member_mobile = member_mobile.replace(' ', '').replace('-', '').replace('+', '') if member_mobile else ''
                        
                        # Skip if this member became the main user
                        if member_mobile == main_mobile and 'પોતે' not in relation:
                            continue
                        
                        # Skip પોતે or empty names
                        if 'પોતે' in relation or not member_name:
                            continue
                        
                        # Parse birthdate and calculate age
                        birthdate_str = str(row.iloc[3]).strip() if len(row) > 3 and not pd.isna(row.iloc[3]) else ''
                        member_age = 25  # default
                        birthdate = None
                        if birthdate_str:
                            try:
                                from datetime import datetime
                                birthdate = pd.to_datetime(birthdate_str).date()
                                member_age = datetime.now().year - birthdate.year
                            except:
                                pass
                        
                        # Parse marital status
                        marital_gujarati = str(row.iloc[5]).strip() if len(row) > 5 and not pd.isna(row.iloc[5]) else ''
                        marital_status = ''
                        if 'પરણીત' in marital_gujarati:
                            marital_status = 'married'
                        elif 'અપરણીત' in marital_gujarati:
                            marital_status = 'single'
                        
                        # Parse member name to get surname and sakh
                        member_surname, member_sakh = parse_gujarati_name(member_name)
                        
                        # Parse member address (check multiple columns)
                        member_full_address = ''
                        for addr_col in [10, 9, 8]:  # Check address in multiple columns
                            if len(row) > addr_col and not pd.isna(row.iloc[addr_col]):
                                addr_val = str(row.iloc[addr_col]).strip()
                                if addr_val and addr_val != 'nan' and ',' in addr_val:  # Looks like address
                                    member_full_address = addr_val
                                    break
                        member_area, member_city, member_remaining_address = parse_address(member_full_address)
                        
                        # Create family member with only required fields
                        NewFamilyMember.objects.create(
                            profile=profile,
                            surname=member_surname,  # Parsed surname from member name
                            name=member_name,        # Keep full name
                            fatherName=surname,      # Use main user's surname as father
                            relation=relation if relation else 'other',
                            memberAge=member_age,
                            dateOfBirth=birthdate,
                            bloodGroup=str(row.iloc[4]).strip() if len(row) > 4 and not pd.isna(row.iloc[4]) else '',
                            maritalStatus=marital_status,
                            sakh=member_sakh,        # Use sakh from parsed member name
                            mobileNumber=member_mobile,
                            education=str(row.iloc[8]).strip() if len(row) > 8 and not pd.isna(row.iloc[8]) else '',
                            occupation=str(row.iloc[9]).strip() if len(row) > 9 and not pd.isna(row.iloc[9]) else '',
                            address=member_remaining_address,  # Remaining address
                            area=member_area,        # Parsed area
                            city=member_city         # Parsed city
                        )

                    
                    processed_mains.add(main_name)
                    records_created += 1
                    print(f"✓ CREATED: New user #{profile.user_number} - {main_name} (mobile: {main_mobile})")
                    
                except Exception as e:
                    print(f"✗ ERROR processing {main_name}: {str(e)}")
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
                'total_main_members_found': len(main_members),
                'processed_successfully': len(processed_mains),
                'total_database_records': NewPersonalProfile.objects.count(),
                'message': f'Excel upload completed successfully! Created {records_created} new users, preserved {records_skipped} existing users. Total users in database: {NewPersonalProfile.objects.count()}'
            })
            
        except Exception as e:
            return Response({'success': False, 'error': str(e)}, status=500)

class DashboardStatsView(APIView):
    """View to get dashboard statistics"""
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        try:
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
                # Count family members for current user only
                user_family_members = current_profile.family_members.count()
                # Total active members = main user + their family members
                total_active_members = 1 + user_family_members
                print(f"DEBUG: User {current_profile.surname} has {user_family_members} family members, total: {total_active_members}")
            except NewPersonalProfile.DoesNotExist:
                total_active_members = 0
                print("DEBUG: No profile found for user")
            
            # Get unread messages count for current user
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
                unread_messages = PrivateMessage.objects.filter(
                    receiver=current_profile,
                    is_read=False
                ).count()
            except NewPersonalProfile.DoesNotExist:
                unread_messages = 0
            
            # Get upcoming events count (same logic as frontend)
            from django.utils import timezone
            upcoming_events_count = 0
            
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
                
                # Get events organized by user (future only)
                organized_events = FamilyEvent.objects.filter(
                    organizer=current_profile,
                    event_date__gt=timezone.now()
                )
                
                # Get events user is invited to (future only)
                invited_events = FamilyEvent.objects.filter(
                    invitations__invitee=current_profile,
                    event_date__gt=timezone.now()
                ).distinct()
                
                # Get public events from connected families (future only)
                from .models import FamilyConnection
                connected_families = FamilyConnection.objects.filter(
                    (Q(initiator=current_profile) | Q(receiver=current_profile)),
                    status='accepted'
                ).values_list('initiator_id', 'receiver_id')
                
                connected_ids = set()
                for initiator_id, receiver_id in connected_families:
                    connected_ids.add(initiator_id if initiator_id != current_profile.id else receiver_id)
                
                # Public events (is_public=True) are invitation-only, so no auto-visible events from connected families
                public_events = FamilyEvent.objects.none()  # Empty queryset to match events page logic
                
                # Get events visible to ALL users
                all_user_events = FamilyEvent.objects.filter(
                    visible_to_all=True,
                    event_date__gt=timezone.now()
                ).exclude(
                    id__in=invited_events.values_list('id', flat=True)
                )
                
                # Combine all public events
                all_public_events = public_events.union(all_user_events)
                public_events = list(all_public_events)
                
                # Combine future events and serialize them
                all_events = list(organized_events) + list(invited_events) + list(public_events)
                
                # Sort by date and limit to 4 most recent
                all_events.sort(key=lambda x: x.event_date)
                upcoming_events = all_events[:4]
                
                # Serialize events
                from .serializers import FamilyEventSerializer
                upcoming_events_data = FamilyEventSerializer(upcoming_events, many=True).data
                
            except NewPersonalProfile.DoesNotExist:
                upcoming_events_data = []
            
            return Response({
                'success': True,
                'active_members': total_active_members,
                'unread_messages': unread_messages,
                'upcoming_events': upcoming_events_data
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to fetch dashboard stats: {str(e)}'
            }, status=500)

class TransformRelationView(APIView):
    """View to transform family relations when a member becomes main member"""
    permission_classes = [IsAuthenticated]
    
    def post(self, request):
        try:
            from .relation_utils import transform_family_relations_when_member_becomes_main, check_if_main_member_has_no_main
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            member_id = request.data.get('member_id')
            
            if not member_id:
                return Response({
                    'success': False,
                    'message': 'Member ID is required'
                }, status=400)
            
            # Get the family member
            try:
                family_member = NewFamilyMember.objects.get(
                    id=member_id,
                    profile=current_profile
                )
            except NewFamilyMember.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Family member not found or does not belong to you'
                }, status=404)
            
            # Check if current main member has no main member (condition for transformation)
            if not check_if_main_member_has_no_main(current_profile):
                return Response({
                    'success': False,
                    'message': 'Relation transformation is only allowed when the main member has no parent relations'
                }, status=400)
            
            # Apply the transformation
            new_main_profile = transform_family_relations_when_member_becomes_main(family_member)
            
            return Response({
                'success': True,
                'message': f'Successfully transformed {family_member.surname} {family_member.name} to main member',
                'new_main_profile_id': new_main_profile.id,
                'old_main_profile_id': current_profile.id
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to transform relations: {str(e)}'
            }, status=500)
    
    def get(self, request):
        """Check if relation transformation is possible"""
        try:
            from .relation_utils import check_if_main_member_has_no_main
            
            # Get current user's profile
            try:
                current_profile = NewPersonalProfile.objects.get(user=request.user)
            except NewPersonalProfile.DoesNotExist:
                return Response({
                    'success': False,
                    'message': 'Profile not found'
                }, status=404)
            
            # Check if transformation is possible
            can_transform = check_if_main_member_has_no_main(current_profile)
            
            # Get eligible family members
            eligible_members = []
            if can_transform:
                family_members = current_profile.family_members.all()
                for member in family_members:
                    eligible_members.append({
                        'id': member.id,
                        'name': f"{member.surname} {member.name}",
                        'relation': member.relation,
                        'member_number': member.get_member_id()
                    })
            
            return Response({
                'success': True,
                'can_transform': can_transform,
                'eligible_members': eligible_members,
                'message': 'Transformation is possible' if can_transform else 'Transformation not allowed - main member has parent relations'
            })
            
        except Exception as e:
            return Response({
                'success': False,
                'message': f'Failed to check transformation eligibility: {str(e)}'
            }, status=500)


