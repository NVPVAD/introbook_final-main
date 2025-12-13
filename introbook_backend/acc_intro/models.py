from django.db import models
from django.contrib.auth.models import User

# Create your models here.

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    first_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    mobile_number = models.CharField(max_length=15, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.first_name} {self.middle_name} {self.last_name} ({self.mobile_number})"

    def get_full_name(self):
        return " ".join(
            part for part in [self.first_name, self.middle_name, self.last_name] if part
        )

class OTP(models.Model):
    mobile = models.CharField(max_length=15)
    code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.mobile} - {self.code}"

class Family(models.Model):
    primary_name = models.CharField(max_length=100)
    city = models.CharField(max_length=100)
    address = models.TextField()

    def __str__(self):
        return self.primary_name

class FamilyMember(models.Model):
    family = models.ForeignKey(Family, related_name='members', on_delete=models.CASCADE)
    first_name = models.CharField(max_length=50, null=True, blank=True)
    middle_name = models.CharField(max_length=50, null=True, blank=True)
    last_name = models.CharField(max_length=50, null=True, blank=True)
    occupation = models.CharField(max_length=100, null=True, blank=True)
    address = models.TextField(null=True, blank=True)
    email = models.EmailField(null=True, blank=True)
    city = models.CharField(max_length=100, null=True, blank=True)
    relation = models.CharField(max_length=50, null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)

    def __str__(self):
        return f"{self.first_name} {self.middle_name} {self.last_name} ({self.relation})"

class NewPersonalProfile(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    MARITAL_STATUS_CHOICES = [
        ('single', 'Single'),
        ('unmarried', 'Unmarried'),
        ('married', 'Married'),
        ('divorced', 'Divorced'),
        ('widowed', 'Widowed'),
    ]
    
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'), ('O+', 'O+'), ('O-', 'O-'),
    ]
    
    EDUCATION_CHOICES = [
        ('primary', 'Primary School'),
        ('secondary', 'Secondary School'),
        ('higher_secondary', 'Higher Secondary'),
        ('diploma', 'Diploma'),
        ('bachelor', 'Bachelor\'s Degree'),
        ('master', 'Master\'s Degree'),
        ('phd', 'PhD'),
        ('other', 'Other'),
    ]
    
    INCOME_RANGE_CHOICES = [
        ('below_1l', 'Below 1 Lakh'),
        ('1l_3l', '1-3 Lakhs'),
        ('3l_5l', '3-5 Lakhs'),
        ('5l_10l', '5-10 Lakhs'),
        ('10l_20l', '10-20 Lakhs'),
        ('above_20l', 'Above 20 Lakhs'),
        ('prefer_not_to_say', 'Prefer not to say'),
    ]

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='new_profile')
    user_number = models.PositiveIntegerField(unique=True, null=True, blank=True)
    password_change_required = models.BooleanField(
        default=False,
        help_text="Require user to change their password on next login"
    )
    
    # Basic Information
    surname = models.CharField(max_length=100)
    name = models.CharField(max_length=100, blank=True)
    fatherName = models.CharField(max_length=100)
    motherName = models.CharField(max_length=100, blank=True)
    sakh = models.CharField(max_length=100, blank=True)  # Added sakh field
    
    # Personal Details
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    dateOfBirth = models.DateField(null=True, blank=True)
    age = models.PositiveIntegerField(null=True, blank=True)
    maritalStatus = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True)
    
    # Contact Information
    email = models.EmailField()
    mobileNumber = models.CharField(max_length=20, blank=True)
    
    # Location Details
    address = models.CharField(max_length=255, blank=True)
    area = models.CharField(max_length=100, blank=True)  # વિસ્તાર
    city = models.CharField(max_length=100, blank=True)
    hometown = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='India')
    
    # Professional Information
    occupation = models.CharField(max_length=100, blank=True)
    companyName = models.CharField(max_length=200, blank=True)
    workAddress = models.CharField(max_length=255, blank=True)
    incomeRange = models.CharField(max_length=20, choices=INCOME_RANGE_CHOICES, blank=True)
    
    # Educational Background
    education = models.CharField(max_length=30, choices=EDUCATION_CHOICES, blank=True)
    instituteName = models.CharField(max_length=200, blank=True)
    
    # Cultural Information
    caste = models.CharField(max_length=100, blank=True)
    subcaste = models.CharField(max_length=100, blank=True)
    religion = models.CharField(max_length=50, blank=True)
    
    # Physical & Health Information
    height = models.CharField(max_length=10, blank=True)
    weight = models.CharField(max_length=10, blank=True)
    bloodGroup = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, blank=True)
    
    # Personal Interests
    hobbies = models.TextField(blank=True)
    languagesKnown = models.CharField(max_length=200, blank=True)
    skills = models.CharField(max_length=200, blank=True)
    
    # Additional fields
    emergencyContact = models.CharField(max_length=20, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    specialization = models.CharField(max_length=200, blank=True)
    medicalConditions = models.TextField(blank=True)
    facebookProfile = models.URLField(blank=True)
    instagramProfile = models.URLField(blank=True)
    linkedinProfile = models.URLField(blank=True)
    aboutMe = models.TextField(blank=True)
    achievements = models.TextField(blank=True)
    
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.user_number:
            # Get the highest user number and add 1
            last_user = NewPersonalProfile.objects.order_by('-user_number').first()
            self.user_number = (last_user.user_number + 1) if last_user and last_user.user_number else 1
        super().save(*args, **kwargs)
    
    def get_user_id(self):
        """Return formatted user ID like A1, A2, A3"""
        return f"A{self.user_number}" if self.user_number else "A0"
    
    def __str__(self):
        return f"User #{self.user_number} - {self.surname} {self.name}"

class NewFamilyMember(models.Model):
    GENDER_CHOICES = [
        ('male', 'Male'),
        ('female', 'Female'),
        ('other', 'Other'),
    ]
    
    MARITAL_STATUS_CHOICES = [
        ('single', 'Single'),
        ('unmarried', 'Unmarried'),
        ('married', 'Married'),
        ('divorced', 'Divorced'),
        ('widowed', 'Widowed'),
    ]
    
    BLOOD_GROUP_CHOICES = [
        ('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'),
        ('AB+', 'AB+'), ('AB-', 'AB-'), ('O+', 'O+'), ('O-', 'O-'),
    ]
    
    EDUCATION_CHOICES = [
        ('primary', 'Primary School'),
        ('secondary', 'Secondary School'),
        ('higher_secondary', 'Higher Secondary'),
        ('diploma', 'Diploma'),
        ('bachelor', 'Bachelor\'s Degree'),
        ('master', 'Master\'s Degree'),
        ('phd', 'PhD'),
        ('other', 'Other'),
    ]
    
    RELATION_CHOICES = [
        ('spouse', 'Spouse'),
        ('son', 'Son'),
        ('daughter', 'Daughter'),
        ('father', 'Father'),
        ('mother', 'Mother'),
        ('brother', 'Brother'),
        ('sister', 'Sister'),
        ('grandfather', 'Grandfather'),
        ('grandmother', 'Grandmother'),
        ('uncle', 'Uncle'),
        ('aunt', 'Aunt'),
        ('cousin', 'Cousin'),
        ('nephew', 'Nephew'),
        ('niece', 'Niece'),
        ('son_in_law', 'Son-in-law'),
        ('daughter_in_law', 'Daughter-in-law'),
        ('father_in_law', 'Father-in-law'),
        ('mother_in_law', 'Mother-in-law'),
        ('grandson', 'Grandson'),
        ('granddaughter', 'Granddaughter'),
        ('other', 'Other'),
    ]

    profile = models.ForeignKey(NewPersonalProfile, related_name='family_members', on_delete=models.CASCADE)
    member_number = models.PositiveIntegerField(unique=True, null=True, blank=True)
    
    # Basic Information
    surname = models.CharField(max_length=100)
    name = models.CharField(max_length=100, blank=True)
    fatherName = models.CharField(max_length=100)
    motherName = models.CharField(max_length=100, blank=True)
    sakh = models.CharField(max_length=100, blank=True)  # Added sakh field
    
    # Personal Details
    gender = models.CharField(max_length=10, choices=GENDER_CHOICES, blank=True)
    dateOfBirth = models.DateField(null=True, blank=True)
    memberAge = models.PositiveIntegerField(null=True, blank=True)
    maritalStatus = models.CharField(max_length=20, choices=MARITAL_STATUS_CHOICES, blank=True)
    relation = models.CharField(max_length=20, choices=RELATION_CHOICES)
    
    # Contact Information
    email = models.EmailField(blank=True)
    mobileNumber = models.CharField(max_length=20, blank=True)
    
    # Location Details
    address = models.CharField(max_length=255, blank=True)
    area = models.CharField(max_length=100, blank=True)  # વિસ્તાર
    city = models.CharField(max_length=100, blank=True)
    hometown = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default='India')
    
    # Professional Information
    occupation = models.CharField(max_length=100, blank=True)
    companyName = models.CharField(max_length=200, blank=True)
    workAddress = models.CharField(max_length=255, blank=True)
    
    # Educational Background
    education = models.CharField(max_length=30, choices=EDUCATION_CHOICES, blank=True)
    instituteName = models.CharField(max_length=200, blank=True)
    
    # Cultural Information
    caste = models.CharField(max_length=100, blank=True)
    subcaste = models.CharField(max_length=100, blank=True)
    religion = models.CharField(max_length=50, blank=True)
    
    # Physical & Health Information
    height = models.CharField(max_length=10, blank=True)
    weight = models.CharField(max_length=10, blank=True)
    bloodGroup = models.CharField(max_length=5, choices=BLOOD_GROUP_CHOICES, blank=True)
    
    # Personal Interests
    hobbies = models.TextField(blank=True)
    languagesKnown = models.CharField(max_length=200, blank=True)
    skills = models.CharField(max_length=200, blank=True)
    
    # Additional fields
    emergencyContact = models.CharField(max_length=20, blank=True)
    state = models.CharField(max_length=100, blank=True)
    pincode = models.CharField(max_length=10, blank=True)
    specialization = models.CharField(max_length=200, blank=True)
    medicalConditions = models.TextField(blank=True)
    aboutMember = models.TextField(blank=True)
    achievements = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        if not self.member_number:
            # Get the highest member number and add 1
            last_member = NewFamilyMember.objects.order_by('-member_number').first()
            self.member_number = (last_member.member_number + 1) if last_member and last_member.member_number else 1
        super().save(*args, **kwargs)
    
    def get_member_id(self):
        """Return formatted member ID like 001, 002, 003"""
        return f"{self.member_number:03d}" if self.member_number else "000"
    
    def __str__(self):
        return f"Member #{self.member_number} - {self.surname} {self.name} ({self.relation})"

class FamilyMemberAuth(models.Model):
    """Model to manage family member login access"""
    family_member = models.ForeignKey(NewFamilyMember, on_delete=models.CASCADE, related_name='auth_records')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='family_auth')
    mobile_number = models.CharField(max_length=20, unique=True)
    password = models.CharField(max_length=255)  # Hashed password
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_login = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['family_member', 'mobile_number']

    def __str__(self):
        return f"{self.family_member.surname} {self.family_member.name} ({self.mobile_number})"

class FeaturedFamily(models.Model):
    """Model to mark certain families as featured in the community"""
    profile = models.OneToOneField(NewPersonalProfile, on_delete=models.CASCADE, related_name='featured_family')
    featured_since = models.DateTimeField(auto_now_add=True)
    reason = models.TextField(help_text="Why this family is featured")
    priority_level = models.IntegerField(default=1, help_text="Higher number = higher priority")
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-priority_level', '-featured_since']

    def __str__(self):
        return f"Featured: {self.profile.surname} {self.profile.name} (Priority: {self.priority_level})"

class FamilyConnection(models.Model):
    """Model to manage connections between families"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('blocked', 'Blocked'),
    ]
    
    initiator = models.ForeignKey(NewPersonalProfile, on_delete=models.CASCADE, related_name='connections_sent')
    receiver = models.ForeignKey(NewPersonalProfile, on_delete=models.CASCADE, related_name='connections_received')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True, help_text="Optional message when requesting connection")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    connected_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ['initiator', 'receiver']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.initiator.surname} -> {self.receiver.surname} ({self.status})"

    @property
    def is_mutual_connection(self):
        """Check if there's a mutual connection (both families connected to each other)"""
        return FamilyConnection.objects.filter(
            initiator=self.receiver,
            receiver=self.initiator,
            status='accepted'
        ).exists()

class CommunityActivity(models.Model):
    """Model to track community activities and updates"""
    ACTIVITY_TYPES = [
        ('profile_update', 'Profile Update'),
        ('family_member_added', 'Family Member Added'),
        ('connection_made', 'Connection Made'),
        ('featured_family_update', 'Featured Family Update'),
        ('community_event', 'Community Event'),
    ]
    
    profile = models.ForeignKey(NewPersonalProfile, on_delete=models.CASCADE, related_name='activities')
    activity_type = models.CharField(max_length=50, choices=ACTIVITY_TYPES)
    title = models.CharField(max_length=200)
    description = models.TextField()
    is_public = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = "Community Activities"

    def __str__(self):
        return f"{self.profile.surname} - {self.title}"

class PrivateMessage(models.Model):
    """Model for private messages between connected families"""
    sender = models.ForeignKey(NewPersonalProfile, on_delete=models.CASCADE, related_name='sent_messages')
    receiver = models.ForeignKey(NewPersonalProfile, on_delete=models.CASCADE, related_name='received_messages')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.sender.surname} -> {self.receiver.surname}: {self.message[:50]}..."

class FamilyEvent(models.Model):
    """Model for events created by families"""
    EVENT_TYPES = [
        ('festival', 'Festival'),
        ('birthday', 'Birthday'),
        ('wedding', 'Wedding'),
        ('gathering', 'Family Gathering'),
        ('picnic', 'Picnic'),
        ('religious', 'Religious Event'),
        ('cultural', 'Cultural Event'),
        ('other', 'Other'),
    ]
    
    organizer = models.ForeignKey(NewPersonalProfile, on_delete=models.CASCADE, related_name='organized_events')
    title = models.CharField(max_length=200)
    description = models.TextField()
    event_type = models.CharField(max_length=20, choices=EVENT_TYPES, default='gathering')
    event_date = models.DateTimeField()
    location = models.CharField(max_length=255)
    max_attendees = models.PositiveIntegerField(null=True, blank=True)
    is_public = models.BooleanField(default=False)  # If true, all connected families can see
    visible_to_all = models.BooleanField(default=False)  # If true, ALL users in system can see
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['event_date']

    def __str__(self):
        return f"{self.title} - {self.event_date.strftime('%Y-%m-%d')}"

class EventInvitation(models.Model):
    """Model for event invitations"""
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('accepted', 'Accepted'),
        ('declined', 'Declined'),
        ('maybe', 'Maybe'),
    ]
    
    event = models.ForeignKey(FamilyEvent, on_delete=models.CASCADE, related_name='invitations')
    invitee = models.ForeignKey(NewPersonalProfile, on_delete=models.CASCADE, related_name='event_invitations')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['event', 'invitee']
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.event.title} -> {self.invitee.surname} ({self.status})"



class FamilyUpdate(models.Model):
    """Model for family news and updates"""
    UPDATE_TYPES = [
        ('news', 'Family News'),
        ('milestone', 'Milestone'),
        ('achievement', 'Achievement'),
        ('announcement', 'Announcement'),
        ('celebration', 'Celebration'),
    ]
    
    family = models.ForeignKey(NewPersonalProfile, on_delete=models.CASCADE, related_name='family_updates')
    title = models.CharField(max_length=200)
    content = models.TextField()
    update_type = models.CharField(max_length=20, choices=UPDATE_TYPES, default='news')
    image = models.ImageField(upload_to='family_updates/', null=True, blank=True)
    is_public = models.BooleanField(default=True)  # Visible to all connected families
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.family.surname} - {self.title}"