# Relation transformation logic based on relation.xlsx
# When a family member becomes the main member (પોતે), all other relationships need to be updated

RELATION_MATRIX = {
    'self': {
        'self': 'Self',
        'wife': 'Wife / પત્ની',
        'son': 'Son / પુત્ર',
        'daughter_in_law': 'D-in-law / પુત્રવધૂ',
        'daughter': 'Daughter / પુત્રી',
        'grandson': 'Grandson / પૌત્ર',
        'granddaughter': 'Granddaughter / પૌત્રી'
    },
    'wife': {
        'self': 'Husband / પતિ',
        'wife': 'Self',
        'son': 'Son / પુત્ર',
        'daughter_in_law': 'D-in-law / પુત્રવધૂ',
        'daughter': 'Daughter / પુત્રી',
        'grandson': 'Grandson / પૌત્ર',
        'granddaughter': 'Granddaughter / પૌત્રી'
    },
    'son': {
        'self': 'Father / પિતા',
        'wife': 'Mother / માતા',
        'son': 'Self / Brother (ભાઈ)',
        'daughter_in_law': 'Wife / Bhabhi (ભાભી)',
        'daughter': 'Sister / બહેન',
        'grandson': 'Son / Nephew (ભત્રીજો)',
        'granddaughter': 'Daughter / Niece (ભત્રીજી)'
    },
    'daughter_in_law': {
        'self': 'Father-in-law / સસરા',
        'wife': 'Mother-in-law / સાસુ',
        'son': 'Husband / Brother-in-law (દિયર)',
        'daughter_in_law': 'Self / Sister-in-law (નણંદ)',
        'daughter': 'Sister-in-law / નણંદ',
        'grandson': 'Son / Nephew (ભત્રીજો)',
        'granddaughter': 'Daughter / Niece (ભત્રીજી)'
    },
    'daughter': {
        'self': 'Father / પિતા',
        'wife': 'Mother / માતા',
        'son': 'Brother / ભાઈ',
        'daughter_in_law': 'Sister-in-law / ભાભી',
        'daughter': 'Self',
        'grandson': 'Nephew / ભત્રીજો',
        'granddaughter': 'Niece / ભત્રીજી'
    },
    'grandson': {
        'self': 'Grandfather / દાદા',
        'wife': 'Grandmother / દાદી',
        'son': 'Father / Uncle (કાકા)',
        'daughter_in_law': 'Mother / Aunt (માસી/કાકી)',
        'daughter': 'Aunt / Aunt (ફઈ)',
        'grandson': 'Self / Cousin (ચચેરો ભાઈ)',
        'granddaughter': 'Sister / Cousin (ચચેરી બહેન)'
    },
    'granddaughter': {
        'self': 'Grandfather / દાદા',
        'wife': 'Grandmother / દાદી',
        'son': 'Father / Uncle (કાકા)',
        'daughter_in_law': 'Mother / Aunt (માસી/કાકી)',
        'daughter': 'Aunt / Aunt (ફઈ)',
        'grandson': 'Brother / Cousin (ચચેરો ભાઈ)',
        'granddaughter': 'Self / Cousin (ચચેરી બહેન)'
    }
}

# Mapping Django model relation choices to our matrix keys
DJANGO_TO_MATRIX_MAPPING = {
    'spouse': 'wife',
    'son': 'son',
    'daughter': 'daughter',
    'daughter_in_law': 'daughter_in_law',
    'grandson': 'grandson',
    'granddaughter': 'granddaughter',
    'brother': 'son',  # Brothers are treated as sons in matrix
    'sister': 'daughter',  # Sisters are treated as daughters in matrix
}

def transform_family_relations_when_member_becomes_main(new_main_member):
    """
    Transform all family member relations when a family member becomes the main member.
    This implements the logic from relation.xlsx for when પોતે has no main member.
    
    Args:
        new_main_member: NewFamilyMember instance that becomes the new main member
    """
    from .models import NewFamilyMember, NewPersonalProfile
    
    # Get the current main profile (પોતે)
    current_main_profile = new_main_member.profile
    
    # Get the new main member's current relation
    new_main_relation = new_main_member.relation
    
    # Map Django relation to matrix key
    matrix_key = DJANGO_TO_MATRIX_MAPPING.get(new_main_relation)
    
    if not matrix_key or matrix_key not in RELATION_MATRIX:
        raise ValueError(f"Unsupported relation type: {new_main_relation}")
    
    # Get the transformation matrix for this relation
    transformation_matrix = RELATION_MATRIX[matrix_key]
    
    # Create new main profile for the family member
    new_main_profile = NewPersonalProfile.objects.create(
        user=new_main_member.profile.user,  # Keep same user for now
        surname=new_main_member.surname,
        name=new_main_member.name,
        fatherName=new_main_member.fatherName,
        motherName=new_main_member.motherName,
        sakh=new_main_member.sakh,
        gender=new_main_member.gender,
        dateOfBirth=new_main_member.dateOfBirth,
        age=new_main_member.memberAge,
        maritalStatus=new_main_member.maritalStatus,
        email=new_main_member.email,
        mobileNumber=new_main_member.mobileNumber,
        address=new_main_member.address,
        area=new_main_member.area,
        city=new_main_member.city,
        hometown=new_main_member.hometown,
        country=new_main_member.country,
        occupation=new_main_member.occupation,
        companyName=new_main_member.companyName,
        workAddress=new_main_member.workAddress,
        education=new_main_member.education,
        instituteName=new_main_member.instituteName,
        caste=new_main_member.caste,
        subcaste=new_main_member.subcaste,
        religion=new_main_member.religion,
        height=new_main_member.height,
        weight=new_main_member.weight,
        bloodGroup=new_main_member.bloodGroup,
        hobbies=new_main_member.hobbies,
        languagesKnown=new_main_member.languagesKnown,
        skills=new_main_member.skills,
        emergencyContact=new_main_member.emergencyContact,
        state=new_main_member.state,
        pincode=new_main_member.pincode,
        specialization=new_main_member.specialization,
        medicalConditions=new_main_member.medicalConditions,
        aboutMe=new_main_member.aboutMember,
        achievements=new_main_member.achievements,
    )
    
    # Transform the old main profile to a family member
    old_main_relation = transformation_matrix.get('self', 'other')
    NewFamilyMember.objects.create(
        profile=new_main_profile,
        surname=current_main_profile.surname,
        name=current_main_profile.name,
        fatherName=current_main_profile.fatherName,
        motherName=current_main_profile.motherName,
        sakh=current_main_profile.sakh,
        gender=current_main_profile.gender,
        dateOfBirth=current_main_profile.dateOfBirth,
        memberAge=current_main_profile.age,
        maritalStatus=current_main_profile.maritalStatus,
        relation=old_main_relation,
        email=current_main_profile.email,
        mobileNumber=current_main_profile.mobileNumber,
        address=current_main_profile.address,
        area=current_main_profile.area,
        city=current_main_profile.city,
        hometown=current_main_profile.hometown,
        country=current_main_profile.country,
        occupation=current_main_profile.occupation,
        companyName=current_main_profile.companyName,
        workAddress=current_main_profile.workAddress,
        education=current_main_profile.education,
        instituteName=current_main_profile.instituteName,
        caste=current_main_profile.caste,
        subcaste=current_main_profile.subcaste,
        religion=current_main_profile.religion,
        height=current_main_profile.height,
        weight=current_main_profile.weight,
        bloodGroup=current_main_profile.bloodGroup,
        hobbies=current_main_profile.hobbies,
        languagesKnown=current_main_profile.languagesKnown,
        skills=current_main_profile.skills,
        emergencyContact=current_main_profile.emergencyContact,
        state=current_main_profile.state,
        pincode=current_main_profile.pincode,
        specialization=current_main_profile.specialization,
        medicalConditions=current_main_profile.medicalConditions,
        aboutMember=current_main_profile.aboutMe,
        achievements=current_main_profile.achievements,
    )
    
    # Transform all other family members' relations
    other_family_members = NewFamilyMember.objects.filter(
        profile=current_main_profile
    ).exclude(id=new_main_member.id)
    
    for member in other_family_members:
        # Special handling for siblings of same type
        if member.relation == new_main_member.relation:
            if member.relation == 'son':
                new_relation = 'brother'
            elif member.relation == 'daughter':
                new_relation = 'sister'
            else:
                # Map member's current relation to matrix key
                member_matrix_key = DJANGO_TO_MATRIX_MAPPING.get(member.relation, member.relation)
                new_relation = transformation_matrix.get(member_matrix_key, member.relation)
        else:
            # Map member's current relation to matrix key
            member_matrix_key = DJANGO_TO_MATRIX_MAPPING.get(member.relation, member.relation)
            # Get new relation from transformation matrix
            new_relation = transformation_matrix.get(member_matrix_key, member.relation)
        
        # Create new family member under new main profile
        NewFamilyMember.objects.create(
            profile=new_main_profile,
            surname=member.surname,
            name=member.name,
            fatherName=member.fatherName,
            motherName=member.motherName,
            sakh=member.sakh,
            gender=member.gender,
            dateOfBirth=member.dateOfBirth,
            memberAge=member.memberAge,
            maritalStatus=member.maritalStatus,
            relation=new_relation,
            email=member.email,
            mobileNumber=member.mobileNumber,
            address=member.address,
            area=member.area,
            city=member.city,
            hometown=member.hometown,
            country=member.country,
            occupation=member.occupation,
            companyName=member.companyName,
            workAddress=member.workAddress,
            education=member.education,
            instituteName=member.instituteName,
            caste=member.caste,
            subcaste=member.subcaste,
            religion=member.religion,
            height=member.height,
            weight=member.weight,
            bloodGroup=member.bloodGroup,
            hobbies=member.hobbies,
            languagesKnown=member.languagesKnown,
            skills=member.skills,
            emergencyContact=member.emergencyContact,
            state=member.state,
            pincode=member.pincode,
            specialization=member.specialization,
            medicalConditions=member.medicalConditions,
            aboutMember=member.aboutMember,
            achievements=member.achievements,
        )er.companyName,
            workAddress=member.workAddress,
            education=member.education,
            instituteName=member.instituteName,
            caste=member.caste,
            subcaste=member.subcaste,
            religion=member.religion,
            height=member.height,
            weight=member.weight,
            bloodGroup=member.bloodGroup,
            hobbies=member.hobbies,
            languagesKnown=member.languagesKnown,
            skills=member.skills,
            emergencyContact=member.emergencyContact,
            state=member.state,
            pincode=member.pincode,
            specialization=member.specialization,
            medicalConditions=member.medicalConditions,
            aboutMember=member.aboutMember,
            achievements=member.achievements,
        )
    
    
    return new_main_profile

def check_if_main_member_has_no_main(profile):
    """
    Check if a main member (પોતે) has no main member above them.
    This would trigger the relation transformation logic.
    
    Args:
        profile: NewPersonalProfile instance
        
    Returns:
        bool: True if this main member has no main member above them
    """
    # Logic to determine if this પોતે has no main member
    # This could be based on various criteria like:
    # - No parent relations in the family
    # - Specific flag in the model
    # - Business logic rules
    
    family_members = profile.family_members.all()
    
    # Check if there are any parent-type relations
    parent_relations = ['father', 'mother', 'father_in_law', 'mother_in_law']
    has_parents = family_members.filter(relation__in=parent_relations).exists()
    
    return not has_parents