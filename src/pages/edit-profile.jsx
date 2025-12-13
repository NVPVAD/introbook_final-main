import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import axios from "../axiosConfig";
import Layout from "../components/Layout";
import FamilyMemberLoginManager from "../components/FamilyMemberLoginManager";
import LanguageToggle from "../components/LanguageToggle";
import { useTranslation } from "../hooks/useTranslation";
import "./EditProfile.css";

// Shared country codes configuration - only essential ones
const COUNTRY_OPTIONS = [
  { code: "+91", label: "India", digits: 10 },
  { code: "+1", label: "USA/Canada", digits: 10 },
  { code: "+44", label: "UK", digits: 10 },
  { code: "+61", label: "Australia", digits: 9 },
  { code: "+49", label: "Germany", digits: 11 },
  { code: "+33", label: "France", digits: 9 },
  { code: "+39", label: "Italy", digits: 10 },
  { code: "+34", label: "Spain", digits: 9 },
  { code: "+81", label: "Japan", digits: 10 },
  { code: "+86", label: "China", digits: 11 }
];

const BLOOD_GROUP_OPTIONS = [
  { value: "A+", label: "A+" }, { value: "A-", label: "A-" },
  { value: "B+", label: "B+" }, { value: "B-", label: "B-" },
  { value: "AB+", label: "AB+" }, { value: "AB-", label: "AB-" },
  { value: "O+", label: "O+" }, { value: "O-", label: "O-" }
];

const getGenderOptions = (t) => [
  { value: "male", label: t ? (t('male') || "Male") : "Male" },
  { value: "female", label: t ? (t('female') || "Female") : "Female" },
  { value: "other", label: t ? (t('other') || "Other") : "Other" }
];

const getMaritalStatusOptions = (t) => [
  { value: "single", label: t ? (t('single') || "Single") : "Single" },
  { value: "unmarried", label: t ? (t('unmarried') || "Unmarried") : "Unmarried" },
  { value: "married", label: t ? (t('married') || "Married") : "Married" },
  { value: "divorced", label: t ? (t('divorced') || "Divorced") : "Divorced" },
  { value: "widowed", label: t ? (t('widowed') || "Widowed") : "Widowed" }
];

const getEducationOptions = (t) => [
  { value: "primary", label: t ? (t('primarySchool') || "Primary School") : "Primary School" },
  { value: "secondary", label: t ? (t('secondarySchool') || "Secondary School") : "Secondary School" },
  { value: "higher_secondary", label: t ? (t('higherSecondary') || "Higher Secondary") : "Higher Secondary" },
  { value: "diploma", label: t ? (t('diploma') || "Diploma") : "Diploma" },
  { value: "bachelor", label: t ? (t('bachelor') || "Bachelor's Degree") : "Bachelor's Degree" },
  { value: "master", label: t ? (t('master') || "Master's Degree") : "Master's Degree" },
  { value: "phd", label: t ? (t('phd') || "PhD") : "PhD" },
  { value: "other", label: t ? (t('other') || "Other") : "Other" }
];

const getIncomeRangeOptions = (t) => [
  { value: "below_1l", label: t ? (t('below1Lakh') || "Below 1 Lakh") : "Below 1 Lakh" },
  { value: "1l_3l", label: t ? (t('1to3Lakhs') || "1-3 Lakhs") : "1-3 Lakhs" },
  { value: "3l_5l", label: t ? (t('3to5Lakhs') || "3-5 Lakhs") : "3-5 Lakhs" },
  { value: "5l_10l", label: t ? (t('5to10Lakhs') || "5-10 Lakhs") : "5-10 Lakhs" },
  { value: "10l_20l", label: t ? (t('10to20Lakhs') || "10-20 Lakhs") : "10-20 Lakhs" },
  { value: "above_20l", label: t ? (t('above20Lakhs') || "Above 20 Lakhs") : "Above 20 Lakhs" },
  { value: "prefer_not_to_say", label: t ? (t('preferNotToSay') || "Prefer not to say") : "Prefer not to say" }
];

// Helper function to get spouse display text based on gender
const getSpouseText = (t, gender) => {
  if (gender === 'male') return 'પત્ની/Wife';
  if (gender === 'female') return 'પતિ/Husband';
  return t ? (t('spouse') || 'Spouse') : 'Spouse';
};

const getRelationOptions = (t) => [
  { value: "પત્ની", label: "પત્ની/Wife" },
  { value: "પતિ", label: "પતિ/Husband" },
  { value: "પુત્ર", label: "પુત્ર/Son" },
  { value: "પુત્રી", label: "પુત્રી/Daughter" },
  { value: "son", label: t ? (t('son') || "Son") : "Son" },
  { value: "daughter", label: t ? (t('daughter') || "Daughter") : "Daughter" },
  { value: "father", label: t ? (t('father') || "Father") : "Father" },
  { value: "mother", label: t ? (t('mother') || "Mother") : "Mother" },
  { value: "brother", label: t ? (t('brother') || "Brother") : "Brother" },
  { value: "sister", label: t ? (t('sister') || "Sister") : "Sister" },
  { value: "grand_father", label: t ? (t('grandfather') || "Grandfather") : "Grand Father" },
  { value: "grand_mother", label: t ? (t('grandmother') || "Grandmother") : "Grand Mother" },
  { value: "grand_son", label: t ? (t('grandson') || "Grandson") : "Grand Son" },
  { value: "પૌત્ર", label: "પૌત્ર/Grand_son" },
  { value: "grand_daughter", label: t ? (t('granddaughter') || "Granddaughter") : "Grand Daughter" },
  { value: "પૌત્રી", label: "પૌત્રી/Grand_daughter" },
  { value: "દાદા", label: "દાદા/Grand_father" },
  { value: "દાદી", label: "દાદી/Grand_mother" },
  { value: "uncle", label: t ? (t('uncle') || "Uncle") : "Uncle" },
  { value: "aunt", label: t ? (t('aunt') || "Aunt") : "Aunt" },
  { value: "cousin", label: t ? (t('cousin') || "Cousin") : "Cousin" },
  { value: "nephew", label: t ? (t('nephew') || "Nephew") : "Nephew" },
  { value: "niece", label: t ? (t('niece') || "Niece") : "Niece" },
  { value: "son_in_law", label: t ? (t('sonInLaw') || "Son-in-law") : "Son-in-law" },
  { value: "daughter_in_law", label: t ? (t('daughterInLaw') || "Daughter-in-law") : "Daughter-in-law" },
  { value: "father_in_law", label: t ? (t('fatherInLaw') || "Father-in-law") : "Father-in-law" },
  { value: "mother_in_law", label: t ? (t('motherInLaw') || "Mother-in-law") : "Mother-in-law" },
  { value: "other", label: t ? (t('other') || "Other") : "Other" }
];

const EditProfile = () => {
  const { t } = useTranslation();
  // State for personal details
  const [personal, setPersonal] = useState({
    surname: "",
    name: "",
    fatherName: "",
    motherName: "",
    sakhi: "",
    gender: "",
    dateOfBirth: "",
    age: "",
    maritalStatus: "",
    email: "",
    mobileNumber: "",
    emergencyContact: "",
    address: "",
    area: "",
    city: "",
    hometown: "",
    state: "",
    country: "India",
    pincode: "",
    occupation: "",
    companyName: "",
    workAddress: "",
    incomeRange: "",
    education: "",
    instituteName: "",
    specialization: "",
    caste: "",
    subcaste: "",
    religion: "",
    height: "",
    weight: "",
    bloodGroup: "",
    medicalConditions: "",
    hobbies: "",
    languagesKnown: "",
    skills: "",
    facebookProfile: "",
    instagramProfile: "",
    linkedinProfile: "",
    aboutMe: "",
    achievements: "",
  });

  // State for family members (start with 1)
  const [family, setFamily] = useState([
    {
      surname: "", name: "", fatherName: "", motherName: "", sakh: "", gender: "", dateOfBirth: "",
      memberAge: "", maritalStatus: "", relation: "", email: "", mobileNumber: "", emergencyContact: "",
      address: "", area: "", city: "", hometown: "", state: "", country: "India", pincode: "", occupation: "",
      companyName: "", workAddress: "", education: "", instituteName: "", specialization: "", caste: "",
      subcaste: "", religion: "", height: "", weight: "", bloodGroup: "", medicalConditions: "",
      hobbies: "", languagesKnown: "", skills: "", aboutMember: "", achievements: "",
    },
  ]);

  // State for signup data section
  const [signupData, setSignupData] = useState({
    surname: "",
    name: "",
    fatherName: "",
    mobileNumber: "",
    email: "",
    sakh: ""
  });
  const [isSignupSectionExpanded, setIsSignupSectionExpanded] = useState(true);
  const [isPersonalSectionExpanded, setIsPersonalSectionExpanded] = useState(false);
  const [isFamilySectionExpanded, setIsFamilySectionExpanded] = useState(false);
  const [showOtpSection, setShowOtpSection] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [originalMobile, setOriginalMobile] = useState("");

  // Add country code state for personal and family
  const [personalCountryCode, setPersonalCountryCode] = useState("+91");
  const [familyCountryCodes, setFamilyCountryCodes] = useState(["+91"]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [avatar, setAvatar] = useState(null);
  const [avatarFile, setAvatarFile] = useState(null);
  const fileInputRef = useRef(null);
  
  // Tab management
  const [activeTab, setActiveTab] = useState('profile');
  const [userType, setUserType] = useState('main_user');
  const [canEdit, setCanEdit] = useState(true);
  const [userPermissions, setUserPermissions] = useState(null);

  // Function to check user permissions
  const checkUserPermissions = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get("user-permissions/", {
        headers: { Authorization: `Token ${token}` },
      });
      
      setUserPermissions(response.data);
      setUserType(response.data.user_type);
      // Fix: Use the correct property path for edit permissions
      setCanEdit(response.data.permissions?.can_edit_profile ?? true);
      
      // Store user info in localStorage for other components
      localStorage.setItem('userInfo', JSON.stringify(response.data));
      
      return response.data;
    } catch (error) {
      console.error("Error checking permissions:", error);
      // Default to main user if check fails
      setUserType('main_user');
      setCanEdit(true);
      return { user_type: 'main_user', permissions: { can_edit_profile: true } };
    }
  };

  // Fetch profile data on mount
  useEffect(() => {
    const fetchProfile = async () => {
      // First check user permissions
      const permissions = await checkUserPermissions();
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("profile/edit/", {
          headers: { Authorization: `Token ${token}` },
        });
        if (response.data) {
          // Helper to split country code and number
          const splitMobile = (fullNumber) => {
            if (!fullNumber) return { code: "+91", number: "" };
            // Try to match known country codes
            const codes = COUNTRY_OPTIONS.map((opt) => opt.code).sort((a, b) => b.length - a.length);
            for (let code of codes) {
              if (fullNumber.startsWith(code)) {
                return { code, number: fullNumber.slice(code.length) };
              }
            }
            return { code: "+91", number: fullNumber };
          };

          // Personal mobile split
          const personalMobile = splitMobile(response.data.mobileNumber);

          setPersonal({
            surname: response.data.surname || response.data.signup_surname || "",
            name: response.data.name || response.data.signup_name || "",
            fatherName: response.data.fatherName || response.data.signup_fatherName || "",
            motherName: response.data.motherName || "",
            sakh: response.data.sakh || response.data.signup_sakh || "",
            gender: response.data.gender || "",
            dateOfBirth: response.data.dateOfBirth || "",
            age: response.data.age || "",
            maritalStatus: response.data.maritalStatus || "",
            email: response.data.email || response.data.signup_email || "",
            mobileNumber: personalMobile.number || response.data.signup_mobileNumber || "",
            emergencyContact: response.data.emergencyContact || "",
            address: response.data.address || "",
            area: response.data.area || "",
            city: response.data.city || "",
            hometown: response.data.hometown || "",
            state: response.data.state || "",
            country: response.data.country || "India",
            pincode: response.data.pincode || "",
            occupation: response.data.occupation || "",
            companyName: response.data.companyName || "",
            workAddress: response.data.workAddress || "",
            incomeRange: response.data.incomeRange || "",
            education: response.data.education || "",
            instituteName: response.data.instituteName || "",
            specialization: response.data.specialization || "",
            caste: response.data.caste || "",
            subcaste: response.data.subcaste || "",
            religion: response.data.religion || "",
            height: response.data.height || "",
            weight: response.data.weight || "",
            bloodGroup: response.data.bloodGroup || "",
            medicalConditions: response.data.medicalConditions || "",
            hobbies: response.data.hobbies || "",
            languagesKnown: response.data.languagesKnown || "",
            skills: response.data.skills || "",
            facebookProfile: response.data.facebookProfile || "",
            instagramProfile: response.data.instagramProfile || "",
            linkedinProfile: response.data.linkedinProfile || "",
            aboutMe: response.data.aboutMe || "",
            achievements: response.data.achievements || "",
          });
          setPersonalCountryCode(personalMobile.code);

          // Set signup data from backend response (this is the original signup data)
          setSignupData({
            surname: response.data.surname || "",
            name: response.data.name || "",
            fatherName: response.data.fatherName || "",
            mobileNumber: personalMobile.number || "",
            email: response.data.email || "",
            sakh: response.data.sakh || ""
          });
          
          // Auto-expand signup section to show the data
          setIsSignupSectionExpanded(true);
          setOriginalMobile(personalMobile.number);
          
          // Auto-expand signup section
          setIsSignupSectionExpanded(true);

          // Set avatar if exists
          if (response.data.avatar) {
            const avatarUrl = response.data.avatar.startsWith('http') 
              ? response.data.avatar 
              : `http://localhost:8000${response.data.avatar}`;
            setAvatar(avatarUrl);
          }

          // Family members split
          const familyMembers = response.data.family_members && response.data.family_members.length > 0
            ? response.data.family_members.map((member) => {
                const famMobile = splitMobile(member.mobileNumber);
                return {
                  surname: member.surname || "",
                  name: member.name || "",
                  fatherName: member.fatherName || "",
                  motherName: member.motherName || "",
                  sakh: member.sakh|| "",
                  gender: member.gender || "",
                  dateOfBirth: member.dateOfBirth || "",
                  memberAge: member.memberAge || "",
                  maritalStatus: member.maritalStatus || "",
                  relation: member.relation || "",
                  email: member.email || "",
                  mobileNumber: famMobile.number,
                  emergencyContact: member.emergencyContact || "",
                  address: member.address || "",
                  area: member.area || "",
                  city: member.city || "",
                  hometown: member.hometown || "",
                  state: member.state || "",
                  country: member.country || "India",
                  pincode: member.pincode || "",
                  occupation: member.occupation || "",
                  companyName: member.companyName || "",
                  workAddress: member.workAddress || "",
                  education: member.education || "",
                  instituteName: member.instituteName || "",
                  specialization: member.specialization || "",
                  caste: member.caste || "",
                  subcaste: member.subcaste || "",
                  religion: member.religion || "",
                  height: member.height || "",
                  weight: member.weight || "",
                  bloodGroup: member.bloodGroup || "",
                  medicalConditions: member.medicalConditions || "",
                  hobbies: member.hobbies || "",
                  languagesKnown: member.languagesKnown || "",
                  skills: member.skills || "",
                  aboutMember: member.aboutMember || "",
                  achievements: member.achievements || "",
                };
              })
            : [];
          console.log('Family members from backend:', familyMembers);
          
          // Use actual family members or default to 1 empty member
          const finalFamilyMembers = familyMembers.length > 0 ? familyMembers : [{
            surname: "", name: "", fatherName: "", motherName: "", sakh: "", gender: "", dateOfBirth: "",
            memberAge: "", maritalStatus: "", relation: "", email: "", mobileNumber: "",
            emergencyContact: "", address: "", area: "", city: "", hometown: "", state: "", country: "India",
            pincode: "", occupation: "", companyName: "", workAddress: "", education: "",
            instituteName: "", specialization: "", caste: "", subcaste: "", religion: "",
            height: "", weight: "", bloodGroup: "", medicalConditions: "", hobbies: "",
            languagesKnown: "", skills: "", aboutMember: "", achievements: "",
          }];
          
          setFamily(finalFamilyMembers);
          
          // Auto-expand family section if there are actual members
          if (familyMembers.length > 0) {
            setIsFamilySectionExpanded(true);
          }
          // Set country codes for family members
          setFamilyCountryCodes(
            familyMembers.length > 0
              ? familyMembers.map((member) => splitMobile(member.mobileNumber || "").code)
              : ["+91"]
          );
        }
      } catch (error) {
        // If 404, do nothing (means no profile yet)
      }
    };
    fetchProfile();
  }, []);

  // Update familyCountryCodes when family members change
  useEffect(() => {
    if (family.length !== familyCountryCodes.length) {
      setFamilyCountryCodes(family.map((_, idx) => familyCountryCodes[idx] || "+91"));
    }
  }, [family.length, familyCountryCodes.length]);

  // Memoized handlers for better performance
  const handlePersonalChange = useCallback((e) => {
    setPersonal(prev => ({ ...prev, [e.target.name]: e.target.value }));
  }, []);

  const handleSignupDataChange = useCallback((e) => {
    const { name, value } = e.target;
    setSignupData(prev => ({ ...prev, [name]: value }));
    
    if (["surname", "name", "fatherName", "email", "sakh"].includes(name)) {
      setPersonal(prev => ({ ...prev, [name]: value }));
    }
    
    if (name === "mobileNumber" && value !== originalMobile) {
      setShowOtpSection(true);
      setOtpSent(false);
      setOtpVerified(false);
      setOtpCode("");
      setMessage("");
      setError("");
    }
  }, [originalMobile]);

  const handleSendOtp = useCallback(async () => {
    try {
      const response = await axios.post("send-otp/", { 
        mobile_number: personalCountryCode + signupData.mobileNumber 
      });
      if (response.data.status === 'pending') {
        setOtpSent(true);
        setError("");
        setMessage("OTP sent! Check backend console for code.");
      }
    } catch (error) {
      setError("Failed to send OTP. Please try again.");
    }
  }, [personalCountryCode, signupData.mobileNumber]);

  const handleVerifyOtp = useCallback(async () => {
    try {
      const response = await axios.post("verify-otp/", {
        mobile: personalCountryCode + signupData.mobileNumber,
        otp: otpCode,
      });
      if (response.data.status === 'approved') {
        setOtpVerified(true);
        setError("");
        setMessage("✅ OTP verified successfully!");
        setPersonal(prev => ({ ...prev, mobileNumber: signupData.mobileNumber }));
        setOriginalMobile(signupData.mobileNumber);
        setTimeout(() => {
          setShowOtpSection(false);
          setOtpSent(false);
          setOtpCode("");
        }, 2000);
      }
    } catch (error) {
      setError("Invalid OTP. Please try again.");
    }
  }, [personalCountryCode, signupData.mobileNumber, otpCode]);

  const handleFamilyChange = useCallback((index, e) => {
    console.log(`Family change - Index: ${index}, Field: ${e.target.name}, Value: ${e.target.value}`);
    setFamily(prev => {
      const newFamily = [...prev];
      newFamily[index] = { ...newFamily[index], [e.target.name]: e.target.value };
      console.log(`Updated family member ${index}:`, newFamily[index]);
      return newFamily;
    });
  }, []);

  const handlePersonalCountryCodeChange = useCallback((e) => {
    setPersonalCountryCode(e.target.value);
  }, []);

  const handleFamilyCountryCodeChange = useCallback((idx, e) => {
    setFamilyCountryCodes(prev => {
      const newCodes = [...prev];
      newCodes[idx] = e.target.value;
      return newCodes;
    });
  }, []);

  // Memoized empty member template
  const emptyMember = useMemo(() => ({
    surname: "", name: "", fatherName: "", motherName: "", sakh: "", gender: "", dateOfBirth: "",
    memberAge: "", maritalStatus: "", relation: "", email: "", mobileNumber: "", emergencyContact: "",
    address: "", area: "", city: "", hometown: "", state: "", country: "India", pincode: "", occupation: "",
    companyName: "", workAddress: "", education: "", instituteName: "", specialization: "", caste: "",
    subcaste: "", religion: "", height: "", weight: "", bloodGroup: "", medicalConditions: "",
    hobbies: "", languagesKnown: "", skills: "", aboutMember: "", achievements: "",
  }), []);

  const addFamilyMember = useCallback(() => {
    setFamily(prev => [...prev, emptyMember]);
    setFamilyCountryCodes(prev => [...prev, "+91"]);
  }, [emptyMember]);

  const removeFamilyMember = useCallback((index) => {
    setFamily(prev => prev.filter((_, idx) => idx !== index));
    setFamilyCountryCodes(prev => prev.filter((_, idx) => idx !== index));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    console.log("=== FORM SUBMISSION DEBUG ===");
    console.log("Form submission started at:", new Date().toISOString());
    console.log("Personal data:", personal);
    console.log("Family data:", family);
    console.log("Personal country code:", personalCountryCode);
    console.log("Family country codes:", familyCountryCodes);
    console.log("Show OTP section:", showOtpSection);
    console.log("OTP verified:", otpVerified);
    console.log("===============================");
    
    // Basic validation for required fields
    if (!personal.surname || !personal.fatherName) {
      setError("Please fill in required fields: Surname and Father Name");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        setError("Authentication token not found. Please login again.");
        return;
      }
      
      // Validate mobile number if changed
      if (showOtpSection && !otpVerified) {
        setError("Please verify your mobile number with OTP first.");
        return;
      }
      
      // Check if at least one family member has required fields filled
      if (family.length > 0 && family.some(member => member.surname || member.name)) {
        // If someone started filling a family member, make sure required fields are completed
        const incompleteMembers = family.filter(member => 
          (member.surname || member.name) && (!member.surname || !member.relation)
        );
        
        if (incompleteMembers.length > 0) {
          setError(`Please complete all required fields for family members (Surname and Relation are required).`);
          return;
        }
      }

      const getDigits = (code) => {
        const country = COUNTRY_OPTIONS.find(opt => opt.code === code);
        return country ? country.digits : 10;
      };

      // Validate personal mobile if provided
      if (personal.mobileNumber) {
        const personalDigits = getDigits(personalCountryCode);
        if (personal.mobileNumber.length !== personalDigits) {
          setError(`Personal mobile number should be ${personalDigits} digits for ${personalCountryCode}`);
          return;
        }
      }

      // Validate family mobile numbers
      for (let i = 0; i < family.length; i++) {
        if (family[i].mobileNumber) {
          const familyDigits = getDigits(familyCountryCodes[i]);
          if (family[i].mobileNumber.length !== familyDigits) {
            setError(`Family member ${i + 1} mobile number should be ${familyDigits} digits for ${familyCountryCodes[i]}`);
            return;
          }
        }
      }

      const formData = new FormData();
      
      // Personal details - Basic Information (ensure all fields are strings)
      formData.append("surname", personal.surname || "");
      formData.append("name", personal.name || "");
      formData.append("fatherName", personal.fatherName || "");
      formData.append("motherName", personal.motherName || "");
      formData.append("sakh", personal.sakh || "");
      
      // Personal Details
      formData.append("gender", personal.gender || "");
      if (personal.dateOfBirth) {
        formData.append("dateOfBirth", personal.dateOfBirth);
      }
      formData.append("age", personal.age || "18");
      formData.append("maritalStatus", personal.maritalStatus || "");
      
      // Contact Information
      formData.append("email", personal.email || "");
      const fullMobileNumber = personal.mobileNumber ? personalCountryCode + personal.mobileNumber : "";
      formData.append("mobileNumber", fullMobileNumber);
      formData.append("emergencyContact", personal.emergencyContact || "");
      
      // Location Details
      formData.append("address", personal.address || "");
      formData.append("area", personal.area || "");
      formData.append("city", personal.city || "");
      formData.append("hometown", personal.hometown || "");
      formData.append("state", personal.state || "");
      formData.append("country", personal.country || "India");
      formData.append("pincode", personal.pincode || "");
      
      // Professional Information
      formData.append("occupation", personal.occupation || "");
      formData.append("companyName", personal.companyName || "");
      formData.append("workAddress", personal.workAddress || "");
      formData.append("incomeRange", personal.incomeRange || "");
      
      // Educational Background
      formData.append("education", personal.education || "");
      formData.append("instituteName", personal.instituteName || "");
      formData.append("specialization", personal.specialization || "");
      
      // Cultural Information
      formData.append("caste", personal.caste || "");
      formData.append("subcaste", personal.subcaste || "");
      formData.append("religion", personal.religion || "");
      
      // Physical & Health Information
      formData.append("height", personal.height || "");
      formData.append("weight", personal.weight || "");
      formData.append("bloodGroup", personal.bloodGroup || "");
      formData.append("medicalConditions", personal.medicalConditions || "");
      
      // Personal Interests
      formData.append("hobbies", personal.hobbies || "");
      formData.append("languagesKnown", personal.languagesKnown || "");
      formData.append("skills", personal.skills || "");
      
      // Social Media
      formData.append("facebookProfile", personal.facebookProfile || "");
      formData.append("instagramProfile", personal.instagramProfile || "");
      formData.append("linkedinProfile", personal.linkedinProfile || "");
      
      // Additional Information
      formData.append("aboutMe", personal.aboutMe || "");
      formData.append("achievements", personal.achievements || "");

      // Avatar
      if (avatarFile) {
        formData.append("avatar", avatarFile);
      }

      // Family members - filter out empty entries and validate
      const familyData = family.map((member, idx) => {
        // Skip completely empty family member entries
        if (!member.surname && !member.name && !member.relation && !member.memberAge) {
          return null;
        }
        
        // If any field is filled, validate required fields
        if (member.surname || member.name || member.relation) {
          if (!member.surname) {
            throw new Error(`Family member ${idx + 1} is missing surname`);
          }
          if (!member.relation) {
            throw new Error(`Family member ${idx + 1} is missing relation`);
          }
        }
        
        const memberData = {
          surname: member.surname || "",
          name: member.name || "",
          fatherName: member.fatherName || "",
          motherName: member.motherName || "",
          sakh: member.sakh || "",
          gender: member.gender || "",
          memberAge: member.memberAge || 18,
          maritalStatus: member.maritalStatus || "",
          relation: member.relation || "",
          email: member.email || "",
          mobileNumber: member.mobileNumber ? familyCountryCodes[idx] + member.mobileNumber : "",
          emergencyContact: member.emergencyContact || "",
          address: member.address || "",
          area: member.area || "",
          city: member.city || "",
          hometown: member.hometown || "",
          state: member.state || "",
          country: member.country || "India",
          pincode: member.pincode || "",
          occupation: member.occupation || "",
          companyName: member.companyName || "",
          workAddress: member.workAddress || "",
          education: member.education || "",
          instituteName: member.instituteName || "",
          specialization: member.specialization || "",
          caste: member.caste || "",
          subcaste: member.subcaste || "",
          religion: member.religion || "",
          height: member.height || "",
          weight: member.weight || "",
          bloodGroup: member.bloodGroup || "",
          medicalConditions: member.medicalConditions || "",
          hobbies: member.hobbies || "",
          languagesKnown: member.languagesKnown || "",
          skills: member.skills || "",
          aboutMember: member.aboutMember || "",
          achievements: member.achievements || ""
        };
        
        if (member.dateOfBirth) {
          memberData.dateOfBirth = member.dateOfBirth;
        }
        
        return memberData;
      }).filter(Boolean); // Remove null entries
      
      formData.append("family_members", JSON.stringify(familyData));
      
      console.log("=== FINAL SUBMISSION DATA ===");
      console.log("Full mobile number:", fullMobileNumber);
      console.log("Family members data:", familyData);
      console.log("Form data entries:");
      for (let [key, value] of formData.entries()) {
        console.log(`  ${key}:`, value);
      }
      console.log("===============================");

      const response = await axios.post("profile/edit/", formData, {
        headers: {
          Authorization: `Token ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("=== RESPONSE RECEIVED ===");
      console.log("Status:", response.status);
      console.log("Data:", response.data);
      console.log("=========================");

      if (response.data.success) {
        setMessage(response.data.message || "Profile updated successfully!");
        setShowOtpSection(false);
        setOtpSent(false);
        setOtpVerified(false);
        setOtpCode("");
        setOriginalMobile(signupData.mobileNumber);
        
        // Scroll to top to show success message
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Auto-hide success message after 5 seconds
        setTimeout(() => {
          setMessage("");
        }, 5000);
      } else {
        setError(response.data.message || "Failed to update profile");
      }
    } catch (error) {
      console.error("=== FORM SUBMISSION ERROR ===");
      console.error("Error object:", error);
      console.error("Response status:", error.response?.status);
      console.error("Response data:", error.response?.data);
      console.error("Error message:", error.message);
      console.error("==============================");
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "Failed to update profile";
      setError(errorMessage);
      // Scroll to error message
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current.click();
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError("Please select a valid image file.");
      return;
    }
    
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size should be less than 5MB.");
      return;
    }
    
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setAvatar(ev.target.result);
    };
    reader.readAsDataURL(file);
    setError("");
  };

  return (
    <Layout title={userType === 'family_member' ? t('familyDetails') : t('editProfile')}>
      <LanguageToggle />
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto'
      }}>
        {!canEdit ? (
          <div className="family-member-notice" style={{
            background: 'linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%)',
            border: '2px solid #ffc107',
            borderRadius: '12px',
            padding: '20px',
            margin: '20px 0',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>🔒</div>
            <h3 style={{ color: '#856404', margin: '0 0 10px 0' }}>{t('familyMember')} - {t('viewOnlyAccess')}</h3>
            <p style={{ color: '#856404', margin: '0', fontSize: '1.1rem' }}>
              {t('viewFamilyInfoOnly')}
              <br />
              {t('onlyMainUserCanEdit')}
            </p>
            {userPermissions?.family_member_info && (
              <div style={{
                marginTop: '15px',
                padding: '10px',
                background: 'rgba(255,255,255,0.7)',
                borderRadius: '8px',
                color: '#856404'
              }}>
                <strong>{t('loggedInAs')}:</strong> {userPermissions.family_member_info.name} ({userPermissions.family_member_info.relation}) - ID: {userPermissions.family_member_info.member_id || (userPermissions.family_member_info.member_number ? String(userPermissions.family_member_info.member_number).padStart(3, '0') : '000')}
              </div>
            )}
          </div>
        ) : null}
        
        {/* Show read-only view for family members */}
        {!canEdit ? (
          <div className="read-only-family-view">
            {/* Profile Header for Family Members */}
            <div className="profile-header" style={{
              textAlign: 'center',
              marginBottom: '40px',
              padding: '20px 0'
            }}>
              <div
                className="profile-avatar-placeholder"
                style={{ margin: '0 auto 20px auto', cursor: 'default' }}
              >
                {avatar ? (
                  <img
                    src={avatar}
                    alt="Profile"
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '50%',
                      objectFit: 'cover'
                    }}
                  />
                ) : (
                  personal.surname ? personal.surname[0].toUpperCase() : "U"
                )}
              </div>
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#2d3a4b',
                margin: '0',
                letterSpacing: '1px'
              }}>{t('familyDetails')}</h1>
              <p style={{ color: '#666', fontSize: '1.1rem' }}>{t('viewOnlyAccess')}</p>
            </div>

            {/* Read-only Personal Details */}
            <div className="section-card">
              <h2 className="section-title">{t('mainUserDetails')}</h2>
              <hr className="section-divider" />
              <div className="form-row-3">
                <div className="form-group">
                  <label>{t('surname')}:</label>
                  <input type="text" value={personal.surname} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>{t('name')}:</label>
                  <input type="text" value={personal.name} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>{t('father')} {t('name')}:</label>
                  <input type="text" value={personal.fatherName} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label>{t('sakh')}:</label>
                  <input type="text" value={personal.sakh} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>{t('email')}:</label>
                  <input type="email" value={personal.email} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>{t('mobile')} {t('number')}:</label>
                  <input type="text" value={`${personalCountryCode}${personal.mobileNumber}`} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>{t('age')}:</label>
                  <input type="number" value={personal.age} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>{t('occupation')}:</label>
                  <input type="text" value={personal.occupation} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
              </div>
              <div className="form-row-1">
                <div className="form-group">
                  <label>{t('address')}:</label>
                  <textarea value={personal.address} readOnly rows={3} style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
              </div>
              <div className="form-row-3">
                <div className="form-group">
                  <label>{t('area') || 'Area (વિસ્તાર)'}:</label>
                  <input type="text" value={personal.area} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>{t('city')}:</label>
                  <input type="text" value={personal.city} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>{t('hometown')}:</label>
                  <input type="text" value={personal.hometown} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
              </div>
              <div className="form-row-2">
                <div className="form-group">
                  <label>{t('caste')}:</label>
                  <input type="text" value={personal.caste} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
                <div className="form-group">
                  <label>{t('subcaste')}:</label>
                  <input type="text" value={personal.subcaste} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                </div>
              </div>
            </div>

            {/* Read-only Family Details */}
            <div className="section-card">
              <h2 className="section-title">{t('familyMembers')}</h2>
              <hr className="section-divider" />
              {family.map((member, idx) => (
                <div key={idx} className="family-card modern-family-card" style={{ backgroundColor: '#f8f9fa' }}>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>{t('surname')}:</label>
                      <input type="text" value={member.surname} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label>{t('name')}:</label>
                      <input type="text" value={member.name} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label>{t('father')} {t('name')}:</label>
                      <input type="text" value={member.fatherName} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>{t('sakh')}:</label>
                      <input type="text" value={member.sakh} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('email')}:</label>
                      <input type="email" value={member.email} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label>{t('mobile')} {t('number')}:</label>
                      <input type="text" value={`${familyCountryCodes[idx] || '+91'}${member.mobileNumber}`} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('age')}:</label>
                      <input type="number" value={member.memberAge} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label>{t('relationship')}:</label>
                      <input type="text" value={member.relation} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>{t('occupation')}:</label>
                      <input type="text" value={member.occupation} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label>{t('area') || 'Area (વિસ્તાર)'}:</label>
                      <input type="text" value={member.area} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label>{t('city')}:</label>
                      <input type="text" value={member.city} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                  <div className="form-row-1">
                    <div className="form-group">
                      <label>{t('address')}:</label>
                      <textarea value={member.address} readOnly rows={2} style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>{t('hometown')}:</label>
                      <input type="text" value={member.hometown} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label>{t('state')}:</label>
                      <input type="text" value={member.state || ''} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label>{t('gender')}:</label>
                      <input type="text" value={member.gender || ''} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>{t('caste')}:</label>
                      <input type="text" value={member.caste} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label>{t('subcaste')}:</label>
                      <input type="text" value={member.subcaste} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label>{t('religion')}:</label>
                      <input type="text" value={member.religion || ''} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('education')} (અભ્યાસ):</label>
                      <input type="text" value={member.education || ''} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                    <div className="form-group">
                      <label>{t('bloodGroup')}:</label>
                      <input type="text" value={member.bloodGroup || ''} readOnly style={{ backgroundColor: '#f8f9fa', cursor: 'not-allowed' }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="profile-header" style={{
              textAlign: 'center',
              marginBottom: '40px',
              padding: '20px 0'
            }}>
              <div 
                className="profile-avatar-placeholder"
                onClick={handleAvatarClick}
                style={{ cursor: 'pointer', margin: '0 auto 20px auto' }}
              >
                {avatar ? (
                  <img 
                    src={avatar} 
                    alt="Profile" 
                    style={{ 
                      width: '100%', 
                      height: '100%', 
                      borderRadius: '50%', 
                      objectFit: 'cover' 
                    }} 
                  />
                ) : (
                  personal.surname ? personal.surname[0].toUpperCase() : "U"
                )}
              </div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleAvatarChange}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <h1 style={{
                fontSize: '2.5rem',
                fontWeight: '700',
                color: '#2d3a4b',
                margin: '0',
                letterSpacing: '1px'
              }}>{t('editProfile')}</h1>
            </div>
            
            {/* Tab Navigation */}
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              marginBottom: '30px',
              borderBottom: '2px solid #e0e0e0'
            }}>
              <button
                type="button"
                onClick={() => setActiveTab('profile')}
                style={{
                  padding: '15px 30px',
                  margin: '0 10px',
                  border: 'none',
                  background: activeTab === 'profile' ? '#1976d2' : '#f5f5f5',
                  color: activeTab === 'profile' ? 'white' : '#666',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  borderBottom: activeTab === 'profile' ? '3px solid #1976d2' : 'none'
                }}
              >
                📝 {t('editProfile')}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('family-login')}
                style={{
                  padding: '15px 30px',
                  margin: '0 10px',
                  border: 'none',
                  background: activeTab === 'family-login' ? '#1976d2' : '#f5f5f5',
                  color: activeTab === 'family-login' ? 'white' : '#666',
                  borderRadius: '8px 8px 0 0',
                  cursor: 'pointer',
                  fontSize: '1.1rem',
                  fontWeight: '500',
                  transition: 'all 0.3s ease',
                  borderBottom: activeTab === 'family-login' ? '3px solid #1976d2' : 'none'
                }}
              >
                👥 {t('familyLoginAccess') || 'Family Login Access'}
              </button>
            </div>
            
            {/* Tab Content */}
            {activeTab === 'profile' ? (
              <form className="edit-profile-form" onSubmit={handleSubmit} style={{ maxWidth: '100%' }}>
                {/* Signup Data Section */}
                <div className="section-card" style={{
                  border: '2px solid #e0e7ff',
                  background: 'rgba(255, 255, 255, 0.9)',
                  marginBottom: '30px'
                }}>
                  <div 
                    className="section-header-clickable"
                    onClick={() => setIsSignupSectionExpanded(!isSignupSectionExpanded)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem', color: '#1976d2' }}>🔐</span>
                      <h2 className="section-title" style={{ margin: 0 }}>{t('signupInformation') || 'Signup Information'}</h2>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: '#28a745',
                        backgroundColor: '#d4edda',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        marginLeft: '10px'
                      }}>✓ Auto-populated</span>
                      <span style={{ 
                        fontSize: '0.8rem', 
                        color: '#666',
                        backgroundColor: '#f0f4ff',
                        padding: '2px 8px',
                        borderRadius: '12px',
                        marginLeft: '5px'
                      }}>{isSignupSectionExpanded ? 'Click to collapse' : 'Click to expand'}</span>
                    </div>
                    <span style={{ 
                      fontSize: '1.5rem', 
                      transition: 'transform 0.3s ease',
                      transform: isSignupSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: '#1976d2'
                    }}>▼</span>
                  </div>
                  
                  {isSignupSectionExpanded && (
                    <>
                      <hr className="section-divider" />
                      <div style={{ padding: '20px 0' }}>
                        <div className="form-row-3">
                          <div className="form-group">
                            <label>{t('surname')}: <span style={{ color: 'red' }}>*</span></label>
                            <input
                              type="text"
                              name="surname"
                              value={signupData.surname}
                              onChange={handleSignupDataChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>{t('name')}: <span style={{ color: 'red' }}>*</span></label>
                            <input
                              type="text"
                              name="name"
                              value={signupData.name}
                              onChange={handleSignupDataChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>{t('father')} {t('name')}: <span style={{ color: 'red' }}>*</span></label>
                            <input
                              type="text"
                              name="fatherName"
                              value={signupData.fatherName}
                              onChange={handleSignupDataChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="form-row-2">
                          <div className="form-group">
                            <label>{t('email')}: <span style={{ color: 'red' }}>*</span></label>
                            <input
                              type="email"
                              name="email"
                              value={signupData.email}
                              onChange={handleSignupDataChange}
                              required
                            />
                          </div>
                          <div className="form-group">
                            <label>{t('sakh')}:</label>
                            <input
                              type="text"
                              name="sakh"
                              value={signupData.sakh}
                              onChange={handleSignupDataChange}
                            />
                          </div>
                        </div>
                        <div className="form-row-1">
                          <div className="form-group">
                            <label>{t('mobile')} {t('number')}: <span style={{ color: 'red' }}>*</span></label>
                            <div className="mobile-input-group">
                              <select
                                value={personalCountryCode}
                                onChange={handlePersonalCountryCodeChange}
                              >
                                {COUNTRY_OPTIONS.map((opt) => (
                                  <option key={opt.code} value={opt.code}>
                                    {opt.label} ({opt.code})
                                  </option>
                                ))}
                              </select>
                              <input
                                type="text"
                                name="mobileNumber"
                                value={signupData.mobileNumber}
                                onChange={handleSignupDataChange}
                                required
                                pattern="[0-9]*"
                                title="Please enter numbers only"
                              />
                            </div>
                          </div>
                        </div>
                        {showOtpSection && (
                          <div style={{
                            marginTop: '15px',
                            padding: '15px',
                            backgroundColor: '#fff3cd',
                            border: '2px solid #ffc107',
                            borderRadius: '8px'
                          }}>
                          <h4 style={{ margin: '0 0 10px 0', color: '#856404' }}>
                            📱 Mobile Verification
                          </h4>
                          <p style={{ margin: '0 0 15px 0', color: '#856404', fontSize: '14px' }}>
                            Verify your mobile number with OTP
                          </p>
                          
                          <div style={{ marginBottom: '10px' }}>
                            <button
                              type="button"
                              onClick={handleSendOtp}
                              style={{
                                padding: '10px 20px',
                                backgroundColor: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                marginRight: '10px'
                              }}
                              disabled={!signupData.mobileNumber || signupData.mobileNumber.length < 6}
                            >
                              📤 Send OTP
                            </button>
                            <span style={{ fontSize: '12px', color: '#666' }}>
                              {otpSent ? "OTP sent! Check backend console for code." : "(Click to send verification code)"}
                            </span>
                          </div>
                          
                          <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                            <input
                              type="text"
                              placeholder="Enter 6-digit OTP"
                              value={otpCode}
                              onChange={(e) => setOtpCode(e.target.value)}
                              style={{
                                padding: '10px',
                                border: '2px solid #ddd',
                                borderRadius: '6px',
                                fontSize: '16px',
                                width: '200px'
                              }}
                            />
                            <button
                              type="button"
                              onClick={handleVerifyOtp}
                              disabled={!otpSent || !otpCode || otpCode.length < 4}
                              style={{
                                padding: '10px 20px',
                                backgroundColor: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer'
                              }}
                            >
                              ✅ Verify OTP
                            </button>
                          </div>
                          
                          {otpVerified && (
                            <p style={{ 
                              color: '#28a745', 
                              margin: '10px 0 0 0',
                              fontWeight: 'bold'
                            }}>
                              ✅ Mobile number verified successfully!
                            </p>
                          )}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Personal Details Section */}
                <div className="section-card">
                  <div 
                    className="section-header-clickable"
                    onClick={() => setIsPersonalSectionExpanded(!isPersonalSectionExpanded)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem', color: '#1976d2' }}>👤</span>
                      <h2 className="section-title" style={{ margin: 0 }}>{t('personalDetails')}</h2>
                    </div>
                    <span style={{ 
                      fontSize: '1.5rem', 
                      transition: 'transform 0.3s ease',
                      transform: isPersonalSectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: '#1976d2'
                    }}>▼</span>
                  </div>
                  
                  {isPersonalSectionExpanded && (
                    <>
                  <hr className="section-divider" />
                  
                  {/* Basic Information */}
                  <h3 style={{ color: '#1976d2', marginBottom: '15px' }}>📋 {t('basicInformation') || 'Basic Information'}</h3>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>{t('surname')}:</label>
                      <input type="text" name="surname" value={personal.surname} onChange={handlePersonalChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('name')}:</label>
                      <input type="text" name="name" value={personal.name} onChange={handlePersonalChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('gender')}:</label>
                      <select name="gender" value={personal.gender} onChange={handlePersonalChange}>
                        <option value="">{t('selectGender') || 'Select Gender'}</option>
                        {getGenderOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('status')}:</label>
                      <select name="maritalStatus" value={personal.maritalStatus} onChange={handlePersonalChange}>
                        <option value="">{t('selectStatus') || 'Select Status'}</option>
                        {getMaritalStatusOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                    <div className="form-group">
                      <label>
                        {personal.gender === 'female' && personal.maritalStatus === 'married' 
                          ? `${t('husband')} ${t('name')}` 
                          : `${t('father')} ${t('name')}`}:
                      </label>
                      <input 
                        type="text" 
                        name="fatherName" 
                        value={personal.fatherName} 
                        onChange={handlePersonalChange}
                        placeholder={
                          personal.gender === 'female' && personal.maritalStatus === 'married'
                            ? t('husbandNamePlaceholder') || "Enter husband's name"
                            : t('fatherNamePlaceholder') || "Enter father's name"
                        }
                      />
                    </div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>{t('mother')} {t('name')}:</label>
                      <input type="text" name="motherName" value={personal.motherName} onChange={handlePersonalChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('sakh')}:</label>
                      <input type="text" name="sakh" value={personal.sakh} onChange={handlePersonalChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('dateOfBirth')}:</label>
                      <input type="date" name="dateOfBirth" value={personal.dateOfBirth} onChange={handlePersonalChange} />
                    </div>
                  </div>
                  <div className="form-row-1">
                    <div className="form-group">
                      <label>{t('age')}:</label>
                      <input type="number" name="age" value={personal.age} onChange={handlePersonalChange} />
                    </div>
                  </div>
                  
                  {/* Contact Information */}
                  <h3 style={{ color: '#1976d2', marginBottom: '15px', marginTop: '25px' }}>📞 {t('contact')} {t('information') || 'Information'}</h3>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('email')}:</label>
                      <input type="email" name="email" value={personal.email} onChange={handlePersonalChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('emergency')} {t('contact')}:</label>
                      <input type="text" name="emergencyContact" value={personal.emergencyContact} onChange={handlePersonalChange} />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>{t('mobile')} {t('number')}:</label>
                    <div className="mobile-input-group">
                      <select value={personalCountryCode} onChange={handlePersonalCountryCodeChange}>
                        {COUNTRY_OPTIONS.map((opt) => (
                          <option key={opt.code} value={opt.code}>{opt.label} ({opt.code})</option>
                        ))}
                      </select>
                      <input
                        type="text" name="mobileNumber" value={personal.mobileNumber} onChange={handlePersonalChange}
                        style={{
                          backgroundColor: otpVerified ? '#d4edda' : 'rgba(247, 250, 253, 0.85)',
                          border: otpVerified ? '2px solid #28a745' : '1.5px solid #d1d5db'
                        }}
                      />
                    </div>
                    {otpVerified && (
                      <small style={{ color: '#28a745', fontWeight: 'bold', marginTop: '5px', display: 'block' }}>
                        ✅ Mobile number verified and updated
                      </small>
                    )}
                  </div>
                  
                  {/* Location Details */}
                  <h3 style={{ color: '#1976d2', marginBottom: '15px', marginTop: '25px' }}>🏠 {t('locationDetails') || 'Location Details'}</h3>
                  <div className="form-row-1">
                    <div className="form-group">
                      <label>{t('address')}:</label>
                      <textarea name="address" value={personal.address} onChange={handlePersonalChange} rows={2} className="long-text-textarea" placeholder={t('enterFullAddress') || 'Enter your full address'} />
                    </div>
                  </div>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>{t('area') || 'Area (વિસ્તાર)'}:</label>
                      <input type="text" name="area" value={personal.area} onChange={handlePersonalChange} placeholder="e.g., મણીનગર" />
                    </div>
                    <div className="form-group">
                      <label>{t('city')}:</label>
                      <input type="text" name="city" value={personal.city} onChange={handlePersonalChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('state')}:</label>
                      <input type="text" name="state" value={personal.state} onChange={handlePersonalChange} />
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('pincode')}:</label>
                      <input type="text" name="pincode" value={personal.pincode} onChange={handlePersonalChange} />
                    </div>
                    <div className="form-group">
                      {/* Empty for spacing */}
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('hometown')}:</label>
                      <input type="text" name="hometown" value={personal.hometown} onChange={handlePersonalChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('country')}:</label>
                      <input type="text" name="country" value={personal.country} onChange={handlePersonalChange} />
                    </div>
                  </div>
                  
                  {/* Professional Information */}
                  <h3 style={{ color: '#1976d2', marginBottom: '15px', marginTop: '25px' }}>💼 {t('professional')} {t('information')}</h3>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('occupation')}:</label>
                      <input type="text" name="occupation" value={personal.occupation} onChange={handlePersonalChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('company')} {t('name')}:</label>
                      <input type="text" name="companyName" value={personal.companyName} onChange={handlePersonalChange} />
                    </div>
                  </div>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('workAddress')}:</label>
                      <input type="text" name="workAddress" value={personal.workAddress} onChange={handlePersonalChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('income')} {t('range') || 'Range'}:</label>
                      <select name="incomeRange" value={personal.incomeRange} onChange={handlePersonalChange}>
                        <option value="">{t('selectRange') || 'Select Range'}</option>
                        {getIncomeRangeOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>
                  
                  {/* Educational Background */}
                  <h3 style={{ color: '#1976d2', marginBottom: '15px', marginTop: '25px' }}>🎓 {t('education')} Background</h3>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>{t('education')} (અભ્યાસ):</label>
                      <input type="text" name="education" value={personal.education} onChange={handlePersonalChange} placeholder="Enter education details" />
                    </div>
                    <div className="form-group">
                      <label>{t('institute')} {t('name')}:</label>
                      <input type="text" name="instituteName" value={personal.instituteName} onChange={handlePersonalChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('specialization')}:</label>
                      <input type="text" name="specialization" value={personal.specialization} onChange={handlePersonalChange} />
                    </div>
                  </div>
                  
                  {/* Cultural Information */}
                  <h3 style={{ color: '#1976d2', marginBottom: '15px', marginTop: '25px' }}>🕉️ {t('cultural')} {t('information')}</h3>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>{t('religion')}:</label>
                      <input type="text" name="religion" value={personal.religion} onChange={handlePersonalChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('caste')}:</label>
                      <input type="text" name="caste" value={personal.caste} onChange={handlePersonalChange} />
                    </div>
                    <div className="form-group">
                      <label>{t('subcaste')}:</label>
                      <input type="text" name="subcaste" value={personal.subcaste} onChange={handlePersonalChange} />
                    </div>
                  </div>
                  
                  {/* Physical & Health Information */}
                  <h3 style={{ color: '#1976d2', marginBottom: '15px', marginTop: '25px' }}>🏥 {t('health')} {t('information')}</h3>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>{t('height')}:</label>
                      <input type="text" name="height" value={personal.height} onChange={handlePersonalChange} placeholder="e.g., 5'8 inches" />
                    </div>
                    <div className="form-group">
                      <label>{t('weight')}:</label>
                      <input type="text" name="weight" value={personal.weight} onChange={handlePersonalChange} placeholder="e.g., 70kg" />
                    </div>
                    <div className="form-group">
                      <label>{t('blood')} Group:</label>
                      <select name="bloodGroup" value={personal.bloodGroup} onChange={handlePersonalChange}>
                        <option value="">{t('selectBloodGroup') || 'Select Blood Group'}</option>
                        {BLOOD_GROUP_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="form-row-1">
                    <div className="form-group">
                      <label>{t('medicalNotes')}:</label>
                      <textarea name="medicalConditions" value={personal.medicalConditions} onChange={handlePersonalChange} rows={2} placeholder={t('medicalPlaceholder') || 'Any medical conditions or allergies'} className="long-text-textarea" />
                    </div>
                  </div>
                  
                  {/* Personal Interests */}
                  <h3 style={{ color: '#1976d2', marginBottom: '15px', marginTop: '25px' }}>🎨 {t('personalInterests') || 'Personal Interests'}</h3>
                  <div className="form-row-2">
                    <div className="form-group">
                      <label>{t('languages')}:</label>
                      <input type="text" name="languagesKnown" value={personal.languagesKnown} onChange={handlePersonalChange} placeholder="e.g., English, Hindi, Gujarati" />
                    </div>
                    <div className="form-group">
                      <label>{t('skills')}:</label>
                      <input type="text" name="skills" value={personal.skills} onChange={handlePersonalChange} placeholder="Professional or personal skills" />
                    </div>
                  </div>
                  <div className="form-row-1">
                    <div className="form-group">
                      <label>{t('hobbies')}:</label>
                      <textarea name="hobbies" value={personal.hobbies} onChange={handlePersonalChange} rows={2} placeholder="Your hobbies and interests" className="long-text-textarea" />
                    </div>
                  </div>
                  
                  {/* Social Media */}
                  <h3 style={{ color: '#1976d2', marginBottom: '15px', marginTop: '25px' }}>📱 {t('socialMedia') || 'Social Media'}</h3>
                  <div className="form-row-3">
                    <div className="form-group">
                      <label>{t('facebook')} Profile:</label>
                      <input type="url" name="facebookProfile" value={personal.facebookProfile} onChange={handlePersonalChange} placeholder="https://facebook.com/username" />
                    </div>
                    <div className="form-group">
                      <label>{t('instagram')} Profile:</label>
                      <input type="url" name="instagramProfile" value={personal.instagramProfile} onChange={handlePersonalChange} placeholder="https://instagram.com/username" />
                    </div>
                    <div className="form-group">
                      <label>{t('linkedin')} Profile:</label>
                      <input type="url" name="linkedinProfile" value={personal.linkedinProfile} onChange={handlePersonalChange} placeholder="https://linkedin.com/in/username" />
                    </div>
                  </div>
                  
                  {/* Additional Information */}
                  <h3 style={{ color: '#1976d2', marginBottom: '15px', marginTop: '25px' }}>📝 {t('additionalInformation') || 'Additional Information'}</h3>
                  <div className="form-row-1">
                    <div className="form-group">
                      <label>{t('aboutMe')}:</label>
                      <textarea name="aboutMe" value={personal.aboutMe} onChange={handlePersonalChange} rows={3} placeholder={t('aboutMePlaceholder') || 'Tell us about yourself'} className="long-text-textarea" />
                    </div>
                  </div>

                  <div className="form-row-1">
                    <div className="form-group">
                      <label>{t('achievements')}:</label>
                      <textarea name="achievements" value={personal.achievements} onChange={handlePersonalChange} rows={2} placeholder={t('achievementsPlaceholder') || 'Your achievements and accomplishments'} className="long-text-textarea" />
                    </div>
                  </div>
                    </>
                  )}
                </div>

                {/* Family Details Section */}
                <div className="section-card">
                  <div 
                    className="section-header-clickable"
                    onClick={() => setIsFamilySectionExpanded(!isFamilySectionExpanded)}
                    style={{
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '10px 0'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '1.2rem', color: '#1976d2' }}>👨‍👩‍👧‍👦</span>
                      <h2 className="section-title" style={{ margin: 0 }}>{t('familyDetails')}</h2>
                    </div>
                    <span style={{ 
                      fontSize: '1.5rem', 
                      transition: 'transform 0.3s ease',
                      transform: isFamilySectionExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      color: '#1976d2'
                    }}>▼</span>
                  </div>
                  
                  {isFamilySectionExpanded && (
                    <div>
                  <hr className="section-divider" />
                  {family.map((member, idx) => (
                    <div key={idx} className="family-card modern-family-card">
                      <div className="form-row-3">
                        <div className="form-group">
                            <label>{t('surname')}: <span style={{ color: 'red' }}>*</span></label>
                            <input
                              type="text"
                              name="surname"
                              value={member.surname}
                              onChange={(e) => handleFamilyChange(idx, e)}
                              required
                            />
                        </div>
                        <div className="form-group">
                          <label>{t('name')}:</label>
                          <input
                            type="text"
                            name="name"
                            value={member.name}
                            onChange={(e) => handleFamilyChange(idx, e)}
                          />
                        </div>
                        <div className="form-group">
                          <label>{t('gender')}:</label>
                          <select 
                            name="gender" 
                            value={member.gender || ''} 
                            onChange={(e) => {
                              console.log(`Setting gender for member ${idx}:`, e.target.value);
                              handleFamilyChange(idx, e);
                            }}
                          >
                            <option value="">{t('selectGender') || 'Select Gender'}</option>
                            {getGenderOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      </div>
                      <div className="form-row-3">
                        <div className="form-group">
                          <label>{t('status')}:</label>
                          <select name="maritalStatus" value={member.maritalStatus} onChange={(e) => handleFamilyChange(idx, e)}>
                            <option value="">{t('selectStatus') || 'Select Status'}</option>
                            {getMaritalStatusOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                        <div className="form-group">
                            <label>
                              {member.gender === 'female' && member.maritalStatus === 'married'
                                ? `${t('husband')} ${t('name')}`
                                : `${t('father')} ${t('name')}`}: <span style={{ color: 'red' }}>*</span>
                            </label>
                            <input
                              type="text"
                              name="fatherName"
                              value={member.fatherName}
                              onChange={(e) => handleFamilyChange(idx, e)}
                              required
                              placeholder={
                                member.gender === 'female' && member.maritalStatus === 'married'
                                  ? t('husbandNamePlaceholder') || "Enter husband's name"
                                  : t('fatherNamePlaceholder') || "Enter father's name"
                              }
                            />
                        </div>
                        <div className="form-group">
                          <label>{t('sakh')}:</label>
                          <input
                            type="text"
                            name="sakh"
                            value={member.sakh}
                            onChange={(e) => handleFamilyChange(idx, e)}
                          />
                        </div>
                      </div>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label>{t('caste')}:</label>
                          <input
                            type="text"
                            name="caste"
                            value={member.caste}
                            onChange={(e) => handleFamilyChange(idx, e)}
                          />
                        </div>
                        <div className="form-group">
                          <label>{t('subcaste')}:</label>
                          <input
                            type="text"
                            name="subcaste"
                            value={member.subcaste}
                            onChange={(e) => handleFamilyChange(idx, e)}
                          />
                        </div>
                      </div>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label>{t('email')}:</label>
                          <input
                            type="email"
                            name="email"
                            value={member.email}
                            onChange={(e) => handleFamilyChange(idx, e)}
                          />
                        </div>
                        <div className="form-group">
                          <label>{t('mobile')} {t('number')}:</label>
                          <div className="mobile-input-group">
                            <select
                              value={familyCountryCodes[idx]}
                              onChange={(e) => handleFamilyCountryCodeChange(idx, e)}
                            >
                              {COUNTRY_OPTIONS.map((opt) => (
                                <option key={opt.code} value={opt.code}>
                                  {opt.label} ({opt.code})
                                </option>
                              ))}
                            </select>
                            <input
                              type="text"
                              name="mobileNumber"
                              value={member.mobileNumber}
                              onChange={(e) => handleFamilyChange(idx, e)}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="form-row-2">
                        <div className="form-group">
                            <label>{t('age')}:</label>
                            <input
                              type="number"
                              name="memberAge"
                              value={member.memberAge}
                              onChange={(e) => handleFamilyChange(idx, e)}
                              min="1"
                              max="120"
                              placeholder="Enter age"
                            />
                        </div>
                        <div className="form-group">
                          <label>{t('occupation')}:</label>
                          <input
                            type="text"
                            name="occupation"
                            value={member.occupation}
                            onChange={(e) => handleFamilyChange(idx, e)}
                          />
                        </div>
                      </div>
                      <div className="form-row-1">
                        <div className="form-group">
                          <label>{t('address')}:</label>
                          <textarea
                            name="address"
                            value={member.address}
                            onChange={(e) => handleFamilyChange(idx, e)}
                            rows={2}
                            className="address-textarea"
                          />
                        </div>
                      </div>
                      <div className="form-row-3">
                        <div className="form-group">
                          <label>{t('area') || 'Area (વિસ્તાર)'}:</label>
                          <input type="text" name="area" value={member.area} onChange={(e) => handleFamilyChange(idx, e)} placeholder="e.g., મણીનગર" />
                        </div>
                        <div className="form-group">
                          <label>{t('city')}:</label>
                          <input type="text" name="city" value={member.city} onChange={(e) => handleFamilyChange(idx, e)} />
                        </div>
                        <div className="form-group">
                          <label>{t('hometown')}:</label>
                          <input type="text" name="hometown" value={member.hometown} onChange={(e) => handleFamilyChange(idx, e)} />
                        </div>
                      </div>
                      <div className="form-row-1">
                        <div className="form-group">
                            <label>{t('relationship')}: <span style={{ color: 'red' }}>*</span></label>
                            <select name="relation" value={member.relation} onChange={(e) => handleFamilyChange(idx, e)} required>
                              <option value="">{t('selectRelation') || 'Select Relation'}</option>
                              {getRelationOptions(t).map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                            </select>
                        </div>
                      </div>
                      
                      {/* Additional Family Member Fields */}
                      <div className="form-row-2">
                        <div className="form-group">
                          <label>{t('mother')} {t('name')}:</label>
                          <input type="text" name="motherName" value={member.motherName} onChange={(e) => handleFamilyChange(idx, e)} />
                        </div>
                        <div className="form-group">
                          <label>{t('dob')}:</label>
                          <input type="date" name="dateOfBirth" value={member.dateOfBirth} onChange={(e) => handleFamilyChange(idx, e)} />
                        </div>
                      </div>
                      <div className="form-row-2">
                        <div className="form-group">
                          <label>{t('education')} (અભ્યાસ):</label>
                          <input type="text" name="education" value={member.education} onChange={(e) => handleFamilyChange(idx, e)} placeholder="Enter education details" />
                        </div>
                        <div className="form-group">
                          <label>{t('blood')} Group:</label>
                          <select name="bloodGroup" value={member.bloodGroup} onChange={(e) => handleFamilyChange(idx, e)}>
                            <option value="">{t('selectBloodGroup') || 'Select Blood Group'}</option>
                            {BLOOD_GROUP_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                          </select>
                        </div>
                      </div>
                      {family.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeFamilyMember(idx)}
                          style={{
                            background: '#dc3545',
                            color: 'white',
                            border: 'none',
                            padding: '8px 16px',
                            borderRadius: '6px',
                            cursor: 'pointer',
                            marginTop: '10px'
                          }}
                        >
                          Remove Member
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    onClick={addFamilyMember}
                    style={{
                      background: '#28a745',
                      color: 'white',
                      border: 'none',
                      padding: '10px 20px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      marginTop: '15px'
                    }}
                  >
                    + Add Family Member
                  </button>
                    </div>
                  )}
                </div>

              <div className="form-actions">
                <button 
                  type="submit" 
                  className="modern-save-btn" 
                  disabled={showOtpSection && !otpVerified}
                  style={{
                    backgroundColor: (showOtpSection && !otpVerified) ? '#6c757d' : '#28a745',
                    color: 'white',
                    padding: '12px 30px',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: (showOtpSection && !otpVerified) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                >
                  💾 {t('save')} {t('changes') || 'Changes'}
                </button>
                {showOtpSection && !otpVerified && (
                  <p style={{ color: '#dc3545', fontSize: '0.9rem', marginTop: '10px' }}>
                    ⚠️ {t('verifyMobileFirst') || 'Please verify your new mobile number before saving changes'}
                  </p>
                )}
              </div>
            </form>
          ) : (
            <div className="family-login-tab">
              <FamilyMemberLoginManager />
            </div>
          )}

          {message && (
            <div className="edit-profile-message" style={{
              backgroundColor: '#d4edda',
              color: '#155724',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #c3e6cb',
              marginBottom: '20px',
              fontSize: '16px'
            }}>
              ✅ {message}
            </div>
          )}
          {error && (
            <div className="edit-profile-error" style={{
              backgroundColor: '#f8d7da',
              color: '#721c24',
              padding: '12px',
              borderRadius: '6px',
              border: '1px solid #f5c6cb',
              marginBottom: '20px',
              fontSize: '16px'
            }}>
              ❌ {error}
            </div>
          )}
        </div>
        )}
      </div>
    </Layout>
  );
};

export default EditProfile;
