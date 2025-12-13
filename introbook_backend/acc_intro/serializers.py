# introbook_backend/acc_intro/serializers.py
from django.contrib.auth import get_user_model
from rest_framework import serializers
from .models import UserProfile, Family, FamilyMember, NewPersonalProfile, NewFamilyMember, FeaturedFamily, FamilyConnection, CommunityActivity, PrivateMessage, FamilyEvent, EventInvitation, FamilyUpdate

User = get_user_model()

class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserProfile
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'phone']  # Add 'phone' if your User model has it

class FamilyMemberSerializer(serializers.ModelSerializer):
    class Meta:
        model = FamilyMember
        fields = [
            'id', 'first_name', 'middle_name', 'last_name', 'occupation', 'address', 'email', 'city', 'relation', 'age'
        ]

class FamilySerializer(serializers.ModelSerializer):
    members = FamilyMemberSerializer(many=True, read_only=True)

    class Meta:
        model = Family
        fields = ['id', 'primary_name', 'city', 'address', 'members']

class NewFamilyMemberSerializer(serializers.ModelSerializer):
    member_id = serializers.SerializerMethodField()
    
    class Meta:
        model = NewFamilyMember
        fields = '__all__'
        read_only_fields = ['profile', 'member_number']
    
    def get_member_id(self, obj):
        return obj.get_member_id()

class NewPersonalProfileSerializer(serializers.ModelSerializer):
    family_members = NewFamilyMemberSerializer(many=True, read_only=True)
    user = serializers.PrimaryKeyRelatedField(read_only=True)
    avatar = serializers.ImageField(required=False, allow_null=True)
    user_id = serializers.SerializerMethodField()

    class Meta:
        model = NewPersonalProfile
        fields = '__all__'
        read_only_fields = ['user_number']
    
    def get_user_id(self, obj):
        return obj.get_user_id()
    
    def to_representation(self, instance):
        data = super().to_representation(instance)
        request = self.context.get('request')
        if instance.avatar and request:
            data['avatar'] = request.build_absolute_uri(instance.avatar.url)
        elif instance.avatar:
            data['avatar'] = instance.avatar.url
        return data

class FeaturedFamilySerializer(serializers.ModelSerializer):
    profile = NewPersonalProfileSerializer(read_only=True)
    
    class Meta:
        model = FeaturedFamily
        fields = '__all__'

class FamilyConnectionSerializer(serializers.ModelSerializer):
    initiator = NewPersonalProfileSerializer(read_only=True)
    receiver = NewPersonalProfileSerializer(read_only=True)
    
    class Meta:
        model = FamilyConnection
        fields = '__all__'

class CommunityActivitySerializer(serializers.ModelSerializer):
    profile = NewPersonalProfileSerializer(read_only=True)
    
    class Meta:
        model = CommunityActivity
        fields = '__all__'

class PrivateMessageSerializer(serializers.ModelSerializer):
    sender = NewPersonalProfileSerializer(read_only=True)
    receiver = NewPersonalProfileSerializer(read_only=True)
    
    class Meta:
        model = PrivateMessage
        fields = '__all__'

class EventInvitationSerializer(serializers.ModelSerializer):
    invitee = NewPersonalProfileSerializer(read_only=True)
    
    class Meta:
        model = EventInvitation
        fields = '__all__'

class FamilyEventSerializer(serializers.ModelSerializer):
    organizer = NewPersonalProfileSerializer(read_only=True)
    invitations = EventInvitationSerializer(many=True, read_only=True)
    attendees_count = serializers.SerializerMethodField()
    
    class Meta:
        model = FamilyEvent
        fields = '__all__'
    
    def get_attendees_count(self, obj):
        return obj.invitations.filter(status='accepted').count()



class FamilyUpdateSerializer(serializers.ModelSerializer):
    family = NewPersonalProfileSerializer(read_only=True)
    
    class Meta:
        model = FamilyUpdate
        fields = '__all__'
