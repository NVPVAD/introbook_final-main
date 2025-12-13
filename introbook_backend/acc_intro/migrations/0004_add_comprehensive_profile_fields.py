# Generated migration for comprehensive profile fields

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('acc_intro', '0003_familyevent_familyupdate_privatemessage_sharedphoto_and_more'),
    ]

    operations = [
        # Add new fields to NewPersonalProfile
        migrations.AddField(
            model_name='newpersonalprofile',
            name='motherName',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='gender',
            field=models.CharField(blank=True, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], max_length=10),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='dateOfBirth',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='maritalStatus',
            field=models.CharField(blank=True, choices=[('single', 'Single'), ('married', 'Married'), ('divorced', 'Divorced'), ('widowed', 'Widowed')], max_length=20),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='emergencyContact',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='state',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='country',
            field=models.CharField(default='India', max_length=100),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='pincode',
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='companyName',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='workAddress',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='incomeRange',
            field=models.CharField(blank=True, choices=[('below_1l', 'Below 1 Lakh'), ('1l_3l', '1-3 Lakhs'), ('3l_5l', '3-5 Lakhs'), ('5l_10l', '5-10 Lakhs'), ('10l_20l', '10-20 Lakhs'), ('above_20l', 'Above 20 Lakhs'), ('prefer_not_to_say', 'Prefer not to say')], max_length=20),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='education',
            field=models.CharField(blank=True, choices=[('primary', 'Primary School'), ('secondary', 'Secondary School'), ('higher_secondary', 'Higher Secondary'), ('diploma', 'Diploma'), ('bachelor', "Bachelor's Degree"), ('master', "Master's Degree"), ('phd', 'PhD'), ('other', 'Other')], max_length=30),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='instituteName',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='specialization',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='religion',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='height',
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='weight',
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='bloodGroup',
            field=models.CharField(blank=True, choices=[('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'), ('AB+', 'AB+'), ('AB-', 'AB-'), ('O+', 'O+'), ('O-', 'O-')], max_length=5),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='medicalConditions',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='hobbies',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='languagesKnown',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='skills',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='facebookProfile',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='instagramProfile',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='linkedinProfile',
            field=models.URLField(blank=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='aboutMe',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='familyTraditions',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='newpersonalprofile',
            name='achievements',
            field=models.TextField(blank=True),
        ),
        
        # Add new fields to NewFamilyMember
        migrations.AddField(
            model_name='newfamilymember',
            name='motherName',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='gender',
            field=models.CharField(blank=True, choices=[('male', 'Male'), ('female', 'Female'), ('other', 'Other')], max_length=10),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='dateOfBirth',
            field=models.DateField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='maritalStatus',
            field=models.CharField(blank=True, choices=[('single', 'Single'), ('married', 'Married'), ('divorced', 'Divorced'), ('widowed', 'Widowed')], max_length=20),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='emergencyContact',
            field=models.CharField(blank=True, max_length=20),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='state',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='country',
            field=models.CharField(default='India', max_length=100),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='pincode',
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='companyName',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='workAddress',
            field=models.CharField(blank=True, max_length=255),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='education',
            field=models.CharField(blank=True, choices=[('primary', 'Primary School'), ('secondary', 'Secondary School'), ('higher_secondary', 'Higher Secondary'), ('diploma', 'Diploma'), ('bachelor', "Bachelor's Degree"), ('master', "Master's Degree"), ('phd', 'PhD'), ('other', 'Other')], max_length=30),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='instituteName',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='specialization',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='religion',
            field=models.CharField(blank=True, max_length=50),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='height',
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='weight',
            field=models.CharField(blank=True, max_length=10),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='bloodGroup',
            field=models.CharField(blank=True, choices=[('A+', 'A+'), ('A-', 'A-'), ('B+', 'B+'), ('B-', 'B-'), ('AB+', 'AB+'), ('AB-', 'AB-'), ('O+', 'O+'), ('O-', 'O-')], max_length=5),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='medicalConditions',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='hobbies',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='languagesKnown',
            field=models.CharField(blank=True, max_length=200),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='skills',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='aboutMember',
            field=models.TextField(blank=True),
        ),
        migrations.AddField(
            model_name='newfamilymember',
            name='achievements',
            field=models.TextField(blank=True),
        ),
        
        # Update relation field to use choices
        migrations.AlterField(
            model_name='newfamilymember',
            name='relation',
            field=models.CharField(choices=[('spouse', 'Spouse'), ('son', 'Son'), ('daughter', 'Daughter'), ('father', 'Father'), ('mother', 'Mother'), ('brother', 'Brother'), ('sister', 'Sister'), ('grandfather', 'Grandfather'), ('grandmother', 'Grandmother'), ('uncle', 'Uncle'), ('aunt', 'Aunt'), ('cousin', 'Cousin'), ('nephew', 'Nephew'), ('niece', 'Niece'), ('son_in_law', 'Son-in-law'), ('daughter_in_law', 'Daughter-in-law'), ('father_in_law', 'Father-in-law'), ('mother_in_law', 'Mother-in-law'), ('other', 'Other')], max_length=20),
        ),
    ]