import React, { useEffect, useState } from "react";
import axios from "../axiosConfig";
import Layout from "../components/Layout";
import LanguageToggle from "../components/LanguageToggle";
import { useTranslation } from "../hooks/useTranslation";
import "./family-details.css";

// Helper function to get spouse display text based on main person's gender
const getSpouseText = (t, mainPersonGender) => {
  if (mainPersonGender === 'male') return t ? (t('wife') || 'Wife') : 'Wife';
  if (mainPersonGender === 'female') return t ? (t('husband') || 'Husband') : 'Husband';
  return t ? (t('spouse') || 'Spouse') : 'Spouse';
};

// Helper function to highlight search terms in text
const highlightText = (text, searchTerm) => {
  if (!text || !searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.toString().split(regex);
  
  return parts.map((part, index) => 
    regex.test(part) ? (
      <span key={index} className="highlight-text">{part}</span>
    ) : part
  );
};

function getInitials(family) {
  const fn = family.surname || family.firstName || family.first_name || "";
  const ln = family.fatherName || family.lastName || family.last_name || "";
  return (fn[0] || "") + (ln[0] || "");
}

const FamilyDetails = () => {
  const { t } = useTranslation();
  const [families, setFamilies] = useState([]);
  const [filteredFamilies, setFilteredFamilies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedFamily, setSelectedFamily] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [surnameFilter, setSurnameFilter] = useState('');
  const [hometownFilter, setHometownFilter] = useState('');
  const [occupationFilter, setOccupationFilter] = useState('');
  const [cityFilter, setCityFilter] = useState('');
  const [maritalStatusFilter, setMaritalStatusFilter] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [availableFilters, setAvailableFilters] = useState({
    surnames: [],
    hometowns: [],
    occupations: [],
    cities: [],
    maritalStatuses: [],
    genders: []
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const fetchFamilies = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get("/all-families/", {
          headers: { Authorization: `Token ${token}` },
        });
        setFamilies(response.data);
        setFilteredFamilies(response.data);
        
        // Normalize city names to handle duplicates
        const normalizeCityName = (city) => {
          if (!city) return '';
          return city.trim().replace(/\.$/, '').toLowerCase();
        };
        
        // Create city mapping for display
        const cityMap = new Map();
        response.data.forEach(f => {
          if (f.city) {
            const normalized = normalizeCityName(f.city);
            if (!cityMap.has(normalized)) {
              cityMap.set(normalized, f.city.trim().replace(/\.$/, ''));
            }
          }
        });
        
        // Extract unique values for filters (including family member data)
        const surnames = new Set();
        const hometowns = new Set();
        const occupations = new Set();
        const cities = new Set();
        const maritalStatuses = new Set();
        const genders = new Set();
        
        response.data.forEach(f => {
          // Add main profile data
          if (f.surname) surnames.add(f.surname);
          if (f.sakh) hometowns.add(f.sakh);
          if (f.occupation) occupations.add(f.occupation);
          if (f.city) {
            const normalized = normalizeCityName(f.city);
            if (!cityMap.has(normalized)) {
              cityMap.set(normalized, f.city.trim().replace(/\.$/, ''));
            }
          }
          if (f.maritalStatus) maritalStatuses.add(f.maritalStatus);
          if (f.gender) genders.add(f.gender);
          
          // Add family member data
          if (f.family_members && Array.isArray(f.family_members)) {
            f.family_members.forEach(member => {
              if (member.surname) surnames.add(member.surname);
              if (member.sakh) hometowns.add(member.sakh);
              if (member.occupation) occupations.add(member.occupation);
              if (member.city) {
                const normalized = normalizeCityName(member.city);
                if (!cityMap.has(normalized)) {
                  cityMap.set(normalized, member.city.trim().replace(/\.$/, ''));
                }
              }
              if (member.maritalStatus) maritalStatuses.add(member.maritalStatus);
              if (member.gender) genders.add(member.gender);
            });
          }
        });
        
        // Convert sets to sorted arrays
        const surnamesList = [...surnames].sort();
        const hometownsList = [...hometowns].sort();
        const occupationsList = [...occupations].sort();
        const citiesList = [...cityMap.values()].sort();
        const maritalStatusesList = [...maritalStatuses].sort();
        const gendersList = [...genders].sort();
        
        // Debug: Log what marital statuses are found
        console.log('Found marital statuses in database:', maritalStatuses);
        console.log('All marital status values (including empty):', response.data.map(f => f.maritalStatus));
        
        setAvailableFilters({
          surnames: surnamesList,
          hometowns: hometownsList,
          occupations: occupationsList,
          cities: citiesList,
          maritalStatuses: maritalStatusesList,
          genders: gendersList
        });
      } catch (err) {
        setError("Failed to fetch families.");
      } finally {
        setLoading(false);
      }
    };
    fetchFamilies();
  }, []);

  useEffect(() => {
    let filtered = families;
    
    // Apply search filter (search in both main profile and family members)
    if (searchTerm) {
      filtered = filtered.filter(family => {
        const searchLower = searchTerm.toLowerCase();
        
        // Search in main profile
        const fullName = `${family.surname || family.firstName || family.first_name || ''} ${family.name || family.middleName || family.middle_name || ''} ${family.fatherName || family.lastName || family.last_name || ''}`;
        const city = family.city || '';
        const occupation = family.occupation || '';
        const sakh = family.sakh || '';
        
        const mainProfileMatch = fullName.toLowerCase().includes(searchLower) ||
                                city.toLowerCase().includes(searchLower) ||
                                occupation.toLowerCase().includes(searchLower) ||
                                sakh.toLowerCase().includes(searchLower);
        
        if (mainProfileMatch) return true;
        
        // Search in family members
        if (family.family_members && Array.isArray(family.family_members)) {
          return family.family_members.some(member => {
            const memberFullName = `${member.surname || member.firstName || member.first_name || ''} ${member.name || member.middleName || member.middle_name || ''} ${member.fatherName || member.lastName || member.last_name || ''}`;
            const memberCity = member.city || '';
            const memberOccupation = member.occupation || '';
            const memberSakh = member.sakh || '';
            const memberRelation = member.relation || '';
            
            return memberFullName.toLowerCase().includes(searchLower) ||
                   memberCity.toLowerCase().includes(searchLower) ||
                   memberOccupation.toLowerCase().includes(searchLower) ||
                   memberSakh.toLowerCase().includes(searchLower) ||
                   memberRelation.toLowerCase().includes(searchLower);
          });
        }
        
        return false;
      });
    }
    
    // Apply dropdown filters (check both main profile and family member data)
    if (surnameFilter) {
      filtered = filtered.filter(family => {
        // Check main profile
        if (family.surname === surnameFilter) return true;
        // Check family members
        return family.family_members && family.family_members.some(member => member.surname === surnameFilter);
      });
    }
    if (hometownFilter) {
      filtered = filtered.filter(family => {
        // Check main profile
        if (family.sakh === hometownFilter) return true;
        // Check family members
        return family.family_members && family.family_members.some(member => member.sakh === hometownFilter);
      });
    }
    if (occupationFilter) {
      filtered = filtered.filter(family => {
        // Check main profile
        if (family.occupation === occupationFilter) return true;
        // Check family members
        return family.family_members && family.family_members.some(member => member.occupation === occupationFilter);
      });
    }
    if (cityFilter) {
      filtered = filtered.filter(family => {
        // Check main profile
        if (family.city) {
          const normalizedFamilyCity = family.city.trim().replace(/\.$/, '');
          if (normalizedFamilyCity === cityFilter) return true;
        }
        // Check family members
        return family.family_members && family.family_members.some(member => {
          if (member.city) {
            const normalizedMemberCity = member.city.trim().replace(/\.$/, '');
            return normalizedMemberCity === cityFilter;
          }
          return false;
        });
      });
    }
    if (maritalStatusFilter) {
      filtered = filtered.filter(family => {
        // Check main profile
        if (family.maritalStatus === maritalStatusFilter) return true;
        // Check family members
        return family.family_members && family.family_members.some(member => member.maritalStatus === maritalStatusFilter);
      });
    }
    if (genderFilter) {
      filtered = filtered.filter(family => {
        // Check main profile
        if (family.gender === genderFilter) return true;
        // Check family members
        return family.family_members && family.family_members.some(member => member.gender === genderFilter);
      });
    }
    
    setFilteredFamilies(filtered);
  }, [searchTerm, surnameFilter, hometownFilter, occupationFilter, cityFilter, maritalStatusFilter, genderFilter, families]);

  const handleFamilyClick = (family) => {
    setSelectedFamily(family);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedFamily(null);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
    setSurnameFilter('');
    setHometownFilter('');
    setOccupationFilter('');
    setCityFilter('');
    setMaritalStatusFilter('');
    setGenderFilter('');
    setShowFilters(false);
  };

  if (loading) return (
    <Layout title="Family Details">
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p className="loading-text">{t('loadingFamilies') || 'Loading families...'}</p>
      </div>
    </Layout>
  );
  
  if (error) return (
    <Layout title="Family Details">
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <p className="error-text">{error}</p>
      </div>
    </Layout>
  );

  return (
    <Layout title="👨‍👩‍👧‍👦 All Families">
      <LanguageToggle />
      <div className="family-details-container">
        <div className="family-header">
          <h1 className="family-title">{t('allFamilies') || 'All Families'}</h1>
          <div className="family-count-badge">{filteredFamilies.length} {t('of') || 'of'} {families.length} {t('families') || 'families'}</div>
        </div>
        
        <div className="search-filter-container">
          <div className="search-bar">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={t('searchFamilies') || 'Search families...'}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            <button 
              className="filter-btn"
              onClick={() => setShowFilters(!showFilters)}
            >
              📊 {t('filter') || 'Filter'} {(surnameFilter || hometownFilter || occupationFilter || cityFilter || maritalStatusFilter || genderFilter) && <span className="filter-count">({[surnameFilter, hometownFilter, occupationFilter, cityFilter, maritalStatusFilter, genderFilter].filter(Boolean).length})</span>}
            </button>
          </div>
          
          {showFilters && (
            <div className="filter-dropdown">
              <div className="filter-options-grid">
                <div className="filter-group">
                  <label className="filter-label">👤 {t('surname') || 'Surname'}</label>
                  <div className="filter-input-wrapper">
                    <select value={surnameFilter} onChange={(e) => setSurnameFilter(e.target.value)} className="modern-filter-select">
                      <option value="">{t('allSurnames') || 'All available surnames...'}</option>
                      {availableFilters.surnames.map(surname => <option key={surname} value={surname}>{surname}</option>)}
                    </select>
                    {surnameFilter && (
                      <button className="filter-clear-btn" onClick={() => setSurnameFilter('')} title="Clear surname filter">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="filter-group">
                  <label className="filter-label">🏠 {t('sakh') || 'Sakh'}</label>
                  <div className="filter-input-wrapper">
                    <select value={hometownFilter} onChange={(e) => setHometownFilter(e.target.value)} className="modern-filter-select">
                      <option value="">{t('allSakh') || 'All sakh communities...'}</option>
                      {availableFilters.hometowns.map(hometown => <option key={hometown} value={hometown}>{hometown}</option>)}
                    </select>
                    {hometownFilter && (
                      <button className="filter-clear-btn" onClick={() => setHometownFilter('')} title="Clear sakh filter">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="filter-group">
                  <label className="filter-label">💼 {t('occupation') || 'Occupation'}</label>
                  <div className="filter-input-wrapper">
                    <select value={occupationFilter} onChange={(e) => setOccupationFilter(e.target.value)} className="modern-filter-select">
                      <option value="">{t('allOccupations') || 'All professions...'}</option>
                      {availableFilters.occupations.map(occupation => <option key={occupation} value={occupation}>{occupation}</option>)}
                    </select>
                    {occupationFilter && (
                      <button className="filter-clear-btn" onClick={() => setOccupationFilter('')} title="Clear occupation filter">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="filter-group">
                  <label className="filter-label">🏙️ {t('city') || 'City'}</label>
                  <div className="filter-input-wrapper">
                    <select value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} className="modern-filter-select">
                      <option value="">{t('allCities') || 'All locations...'}</option>
                      {availableFilters.cities.map(city => <option key={city} value={city}>{city}</option>)}
                    </select>
                    {cityFilter && (
                      <button className="filter-clear-btn" onClick={() => setCityFilter('')} title="Clear city filter">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="filter-group">
                  <label className="filter-label">💍 {t('maritalStatus') || 'Marital Status'}</label>
                  <div className="filter-input-wrapper">
                    <select value={maritalStatusFilter} onChange={(e) => setMaritalStatusFilter(e.target.value)} className="modern-filter-select">
                      <option value="">{t('allMaritalStatus') || 'All marital statuses...'}</option>
                      {availableFilters.maritalStatuses.map(status => <option key={status} value={status}>{status === 'married' ? (t('married') || 'Married') : status === 'single' ? (t('single') || 'Single') : status === 'unmarried' ? (t('single') || 'Unmarried') : status === 'widowed' ? (t('widowed') || 'Widowed') : status === 'divorced' ? (t('divorced') || 'Divorced') : status}</option>)}
                    </select>
                    {maritalStatusFilter && (
                      <button className="filter-clear-btn" onClick={() => setMaritalStatusFilter('')} title="Clear marital status filter">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="filter-group">
                  <label className="filter-label">👥 {t('gender') || 'Gender'}</label>
                  <div className="filter-input-wrapper">
                    <select value={genderFilter} onChange={(e) => setGenderFilter(e.target.value)} className="modern-filter-select">
                      <option value="">{t('allGenders') || 'All genders...'}</option>
                      {availableFilters.genders.map(gender => <option key={gender} value={gender}>{gender === 'male' ? (t('male') || 'Male') : gender === 'female' ? (t('female') || 'Female') : gender === 'other' ? (t('other') || 'Other') : gender}</option>)}
                    </select>
                    {genderFilter && (
                      <button className="filter-clear-btn" onClick={() => setGenderFilter('')} title="Clear gender filter">
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>
              
              {(surnameFilter || hometownFilter || occupationFilter || cityFilter || maritalStatusFilter || genderFilter) && (
                <button className="clear-filters" onClick={clearAllFilters}>
                  ✕ {t('clearAllFilters') || 'Clear All Filters'}
                </button>
              )}
            </div>
          )}
          
          {(searchTerm || surnameFilter || hometownFilter || occupationFilter || cityFilter || maritalStatusFilter || genderFilter) && (
            <div className="active-tags">
              {searchTerm && <span className="tag search">🔍 {searchTerm}</span>}
              {surnameFilter && <span className="tag">👤 {surnameFilter}</span>}
              {hometownFilter && <span className="tag">🏠 {hometownFilter}</span>}
              {occupationFilter && <span className="tag">💼 {occupationFilter}</span>}
              {cityFilter && <span className="tag">🏙️ {cityFilter}</span>}
              {maritalStatusFilter && <span className="tag">💍 {maritalStatusFilter === 'married' ? (t('married') || 'Married') : maritalStatusFilter === 'single' ? (t('single') || 'Single') : maritalStatusFilter === 'unmarried' ? (t('single') || 'Unmarried') : maritalStatusFilter === 'widowed' ? (t('widowed') || 'Widowed') : maritalStatusFilter === 'divorced' ? (t('divorced') || 'Divorced') : maritalStatusFilter}</span>}
              {genderFilter && <span className="tag">👥 {genderFilter === 'male' ? (t('male') || 'Male') : genderFilter === 'female' ? (t('female') || 'Female') : genderFilter}</span>}
            </div>
          )}
        </div>

        {filteredFamilies.length === 0 && families.length > 0 ? (
          <div className="no-results-message">
            <div className="no-results-icon">🔍</div>
            <h3>{t('noResultsFound') || 'No Results Found'}</h3>
            <p>{t('noFamiliesMatch') || 'No families match your search or filter criteria. Try different options.'}</p>
            <button 
              className="clear-search-btn"
              onClick={clearAllFilters}
            >
              {t('clearAllFilters') || 'Clear All Filters'}
            </button>
          </div>
        ) : families.length === 0 ? (
          <div className="no-families-message">
            <div className="no-families-icon">👨‍👩‍👧‍👦</div>
            <h3>{t('noFamiliesFound') || 'No Families Found'}</h3>
            <p>{t('noFamiliesRegistered') || 'There are no families registered in the system yet.'}</p>
          </div>
        ) : (
          <div className="families-grid">
            {filteredFamilies.map((family, idx) => (
              <div
                key={family.id || idx}
                className="family-card animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={() => handleFamilyClick(family)}
              >
                <div className="card-header">
                  <div className="avatar-circle">
                    {family.avatar ? (
                      <img src={family.avatar} alt="Avatar" className="avatar-image" />
                    ) : (
                      <span className="avatar-icon">👤</span>
                    )}
                  </div>
                  <div className="header-content">
                    <h3 className="person-name">
                      {highlightText(`${family.surname || family.firstName || family.first_name || ''} ${family.name || family.middleName || family.middle_name || ''} ${family.fatherName || family.lastName || family.last_name || ''}`.trim(), searchTerm)}
                    </h3>
                    <div className="user-id-badge">User {family.user_id || family.get_user_id?.() || `A${family.user_number}` || 'A0'}</div>
                    <p className="location">
                      📍 {highlightText(family.city || t('locationNotSpecified') || "Location not specified", searchTerm)}
                    </p>
                  </div>
                </div>

                <div className="card-content">
                  <div className="info-row">
                    <div className="info-item">
                      <span className="icon blue">💼</span>
                      <span className="text">{highlightText(family.occupation || t('notSpecified') || 'Not specified', searchTerm)}</span>
                    </div>
                    <div className="info-item">
                      <span className="icon pink">👤</span>
                      <span className="text">{family.age || 'N/A'} {t('years') || 'years'}</span>
                    </div>
                  </div>
                  
                  <div className="info-row">
                    <div className="info-item">
                      <span className="icon green">📱</span>
                      <span className="text">{family.mobile_number || family.phone || family.mobileNumber || t('notProvided') || 'Not provided'}</span>
                    </div>
                    <div className="info-item">
                      <span className="icon orange">📧</span>
                      <span className="text">{family.email || t('notProvided') || 'Not provided'}</span>
                    </div>
                  </div>

                  <div className="family-section">
                    <div className="section-header">
                      <span className="section-title">
                        <span className="heart-icon">❤️</span> {t('familyMembers') || 'Family Members'}
                      </span>
                      <span className="member-count">
                        {family.family_members ? family.family_members.length : 0}
                      </span>
                    </div>
                    
                    <div className="members-container">
                      {family.family_members && family.family_members.length > 0 ? (
                        <>
                          {family.family_members.slice(0, 2).map((member, mIdx) => (
                            <div key={mIdx} className="member-row">
                              <div className="member-initials">
                                <span className="member-icon">👥</span>
                              </div>
                              <div className="member-info">
                                <span className="member-name">
                                  {highlightText(`${member.name || member.firstName || member.first_name || ''} ${member.surname || member.lastName || member.last_name || ''}`.trim(), searchTerm)}
                                </span>
                                <div className="member-id-small">{member.member_id || member.get_member_id?.() || (member.member_number ? String(member.member_number).padStart(3, '0') : '000')}</div>
                                <span className="member-relation">
                                  {member.relation === 'spouse' ? getSpouseText(t, family.gender) : member.relation === 'son' ? (t('son') || 'Son') : member.relation === 'daughter' ? (t('daughter') || 'Daughter') : member.relation === 'father' ? (t('father') || 'Father') : member.relation === 'mother' ? (t('mother') || 'Mother') : member.relation === 'brother' ? (t('brother') || 'Brother') : member.relation === 'sister' ? (t('sister') || 'Sister') : member.relation === 'grandfather' ? (t('grandfather') || 'Grandfather') : member.relation === 'grandmother' ? (t('grandmother') || 'Grandmother') : member.relation === 'grandson' ? (t('grandson') || 'Grandson') : member.relation === 'granddaughter' ? (t('granddaughter') || 'Granddaughter') : member.relation === 'uncle' ? (t('uncle') || 'Uncle') : member.relation === 'aunt' ? (t('aunt') || 'Aunt') : member.relation === 'cousin' ? (t('cousin') || 'Cousin') : member.relation === 'nephew' ? (t('nephew') || 'Nephew') : member.relation === 'niece' ? (t('niece') || 'Niece') : member.relation === 'son_in_law' ? (t('sonInLaw') || 'Son-in-law') : member.relation === 'daughter_in_law' ? (t('daughterInLaw') || 'Daughter-in-law') : member.relation === 'father_in_law' ? (t('fatherInLaw') || 'Father-in-law') : member.relation === 'mother_in_law' ? (t('motherInLaw') || 'Mother-in-law') : member.relation || (t('member') || 'Member')}
                                </span>
                              </div>
                            </div>
                          ))}
                          {family.family_members.length > 2 && (
                            <div className="more-text">
                              +{family.family_members.length - 2} {t('moreMembers') || 'more members'}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="no-members-text">
                          {t('noMembersListed') || 'No members listed'}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="view-details">
                    {t('viewDetails') || 'View Details'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Compact Modal */}
      {showModal && selectedFamily && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="compact-modal" onClick={(e) => e.stopPropagation()}>
            <div className="compact-header">
              <button className="close-btn" onClick={closeModal}>✕</button>
              <div className="profile-section">
                <div className="profile-avatar">
                  {selectedFamily.avatar ? (
                    <img src={selectedFamily.avatar} alt="Profile Avatar" className="profile-avatar-image" />
                  ) : (
                    <span className="profile-avatar-icon">👤</span>
                  )}
                </div>
                <div className="profile-info">
                  <h2 className="profile-name">
                    {highlightText(`${selectedFamily.surname || selectedFamily.firstName || selectedFamily.first_name || ''} ${selectedFamily.name || selectedFamily.middleName || selectedFamily.middle_name || ''} ${selectedFamily.fatherName || selectedFamily.lastName || selectedFamily.last_name || ''}`.trim(), searchTerm)}
                  </h2>
                  <div className="profile-details-inline">
                    <div className="main-user-id-modal">User {selectedFamily.user_id || selectedFamily.get_user_id?.() || `A${selectedFamily.user_number}` || 'A0'}</div>
                    <span className="detail-item">📍 {highlightText(selectedFamily.city || "N/A", searchTerm)}</span>
                    <span className="detail-item">💼 {highlightText(selectedFamily.occupation || "N/A", searchTerm)}</span>
                    <span className="detail-item">👤 {selectedFamily.age ? `${selectedFamily.age} ${t('years') || 'years'}` : "N/A"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="compact-body">
              <div className="modal-two-parts">
                {/* Main Person Details */}
                <div className="main-person-section">
                  <div className="section-header-main">
                    <h2 className="main-title">👤 {t('mainPersonDetails') || 'Main Person Details'}</h2>
                  </div>
                  
                  <div className="details-grid expanded-grid">
                    <div className="detail-card">
                      <h4 className="card-title">📞 {t('contact') || 'Contact'}</h4>
                      <div className="detail-items">
                        <div className="detail-item-row"><span>{t('mobile') || 'Mobile'}:</span><span>{highlightText(selectedFamily.mobile_number || selectedFamily.phone || selectedFamily.mobileNumber || 'N/A', searchTerm)}</span></div>
                        <div className="detail-item-row"><span>{t('email') || 'Email'}:</span><span>{highlightText(selectedFamily.email || 'N/A', searchTerm)}</span></div>
                        <div className="detail-item-row"><span>{t('emergencyContact') || 'Emergency Contact'}:</span><span>{selectedFamily.emergencyContact || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('address') || 'Address'}:</span><span>{highlightText(selectedFamily.address || 'N/A', searchTerm)}</span></div>
                        <div className="detail-item-row"><span>{t('area') || 'Area'}:</span><span>{highlightText(selectedFamily.area || 'N/A', searchTerm)}</span></div>
                        <div className="detail-item-row"><span>{t('state') || 'State'}:</span><span>{selectedFamily.state || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('pincode') || 'Pincode'}:</span><span>{selectedFamily.pincode || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('country') || 'Country'}:</span><span>{selectedFamily.country || 'N/A'}</span></div>
                      </div>
                    </div>
                    
                    <div className="detail-card">
                      <h4 className="card-title">👨‍👩‍👧‍👦 Personal</h4>
                      <div className="detail-items">
                        <div className="detail-item-row">
                          <span>
                            {selectedFamily.gender === 'female' && selectedFamily.maritalStatus === 'married' 
                              ? `${t('husband')}:` 
                              : `${t('father')}:`}
                          </span>
                          <span>{selectedFamily.fatherName || 'N/A'}</span>
                        </div>
                        <div className="detail-item-row"><span>{t('mother') || 'Mother'}:</span><span>{selectedFamily.motherName || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('sakh') || 'Sakh'}:</span><span>{highlightText(selectedFamily.sakh || 'N/A', searchTerm)}</span></div>
                        <div className="detail-item-row"><span>{t('gender') || 'Gender'}:</span><span>{selectedFamily.gender === 'male' ? (t('male') || 'Male') : selectedFamily.gender === 'female' ? (t('female') || 'Female') : selectedFamily.gender === 'other' ? (t('other') || 'Other') : selectedFamily.gender || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('dateOfBirth') || 'DOB'}:</span><span>{selectedFamily.dateOfBirth || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('maritalStatus') || 'Marital Status'}:</span><span>{selectedFamily.maritalStatus === 'married' ? (t('married') || 'Married') : selectedFamily.maritalStatus === 'single' ? (t('single') || 'Single') : selectedFamily.maritalStatus === 'widowed' ? (t('widowed') || 'Widowed') : selectedFamily.maritalStatus === 'divorced' ? (t('divorced') || 'Divorced') : selectedFamily.maritalStatus || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('bloodGroup') || 'Blood Group'}:</span><span>{selectedFamily.bloodGroup || 'N/A'}</span></div>
                      </div>
                    </div>
                    
                    <div className="detail-card">
                      <h4 className="card-title">🎓 Education & Work</h4>
                      <div className="detail-items">
                        <div className="detail-item-row"><span>{t('education') || 'Education'}:</span><span>{highlightText(selectedFamily.education || 'N/A', searchTerm)}</span></div>
                        <div className="detail-item-row"><span>{t('institute') || 'Institute'}:</span><span>{highlightText(selectedFamily.instituteName || 'N/A', searchTerm)}</span></div>
                        <div className="detail-item-row"><span>{t('specialization') || 'Specialization'}:</span><span>{selectedFamily.specialization || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('company') || 'Company'}:</span><span>{highlightText(selectedFamily.companyName || 'N/A', searchTerm)}</span></div>
                        <div className="detail-item-row"><span>{t('workAddress') || 'Work Address'}:</span><span>{selectedFamily.workAddress || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('income') || 'Income'}:</span><span>{selectedFamily.incomeRange || 'N/A'}</span></div>
                      </div>
                    </div>
                    
                    <div className="detail-card">
                      <h4 className="card-title">🕉️ Cultural & Physical</h4>
                      <div className="detail-items">
                        <div className="detail-item-row"><span>{t('religion') || 'Religion'}:</span><span>{selectedFamily.religion || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('caste') || 'Caste'}:</span><span>{selectedFamily.caste || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('subcaste') || 'Subcaste'}:</span><span>{selectedFamily.subcaste || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('height') || 'Height'}:</span><span>{selectedFamily.height || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('weight') || 'Weight'}:</span><span>{selectedFamily.weight || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('hometown') || 'Hometown'}:</span><span>{selectedFamily.hometown || 'N/A'}</span></div>
                      </div>
                    </div>
                    
                    <div className="detail-card">
                      <h4 className="card-title">🎨 Interests & Skills</h4>
                      <div className="detail-items">
                        <div className="detail-item-row"><span>{t('hobbies') || 'Hobbies'}:</span><span>{selectedFamily.hobbies || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('languages') || 'Languages'}:</span><span>{selectedFamily.languagesKnown || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('skills') || 'Skills'}:</span><span>{selectedFamily.skills || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('achievements') || 'Achievements'}:</span><span>{selectedFamily.achievements || 'N/A'}</span></div>
                      </div>
                    </div>
                    
                    <div className="detail-card">
                      <h4 className="card-title">🏥 Health & Medical</h4>
                      <div className="detail-items">
                        <div className="detail-item-row"><span>{t('medicalConditions') || 'Medical Conditions'}:</span><span>{selectedFamily.medicalConditions || 'N/A'}</span></div>
                      </div>
                    </div>
                    
                    <div className="detail-card">
                      <h4 className="card-title">📱 Social Media</h4>
                      <div className="detail-items">
                        <div className="detail-item-row"><span>{t('facebook') || 'Facebook'}:</span><span>{selectedFamily.facebookProfile ? <a href={selectedFamily.facebookProfile} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration: 'underline'}}>View Profile</a> : 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('instagram') || 'Instagram'}:</span><span>{selectedFamily.instagramProfile ? <a href={selectedFamily.instagramProfile} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration: 'underline'}}>View Profile</a> : 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('linkedin') || 'LinkedIn'}:</span><span>{selectedFamily.linkedinProfile ? <a href={selectedFamily.linkedinProfile} target="_blank" rel="noopener noreferrer" style={{color: '#3b82f6', textDecoration: 'underline'}}>View Profile</a> : 'N/A'}</span></div>
                      </div>
                    </div>
                    
                    <div className="detail-card full-width">
                      <h4 className="card-title">📝 About</h4>
                      <div className="detail-items">
                        <div className="detail-item-row full-text"><span>{t('aboutMe') || 'About Me'}:</span><span style={{whiteSpace: 'pre-wrap', textAlign: 'left', marginLeft: 0, marginTop: '8px'}}>{selectedFamily.aboutMe || 'N/A'}</span></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Family Members Section */}
                <div className="family-members-section">
                  <div className="section-header-main">
                    <h2 className="main-title">👨‍👩‍👧‍👦 Family Members ({selectedFamily.family_members ? selectedFamily.family_members.length : 0})</h2>
                  </div>
                  
                  {selectedFamily.family_members && selectedFamily.family_members.length > 0 ? (
                    <div className="all-members-container">
                      {selectedFamily.family_members.map((member, mIdx) => (
                        <React.Fragment key={mIdx}>
                          <div className="member-card-detailed">
                          <div className="member-header">
                            <div className="member-avatar-large">
                              <span className="member-avatar-icon">👥</span>
                            </div>
                            <div className="member-basic-info">
                              <h4 className="member-name-large">
                                {highlightText(`${member.name || member.firstName || member.first_name || ''} ${member.surname || member.lastName || member.last_name || ''}`.trim(), searchTerm)}
                              </h4>
                              <div className="member-id-large">{t('member') || 'Member'} {member.member_id || member.get_member_id?.() || (member.member_number ? String(member.member_number).padStart(3, '0') : '000')}</div>
                              <span className="member-relation-large">{member.relation === 'spouse' ? getSpouseText(t, selectedFamily.gender) : member.relation === 'son' ? (t('son') || 'Son') : member.relation === 'daughter' ? (t('daughter') || 'Daughter') : member.relation === 'father' ? (t('father') || 'Father') : member.relation === 'mother' ? (t('mother') || 'Mother') : member.relation === 'brother' ? (t('brother') || 'Brother') : member.relation === 'sister' ? (t('sister') || 'Sister') : member.relation === 'grandfather' ? (t('grandfather') || 'Grandfather') : member.relation === 'grandmother' ? (t('grandmother') || 'Grandmother') : member.relation === 'grandson' ? (t('grandson') || 'Grandson') : member.relation === 'granddaughter' ? (t('granddaughter') || 'Granddaughter') : member.relation === 'uncle' ? (t('uncle') || 'Uncle') : member.relation === 'aunt' ? (t('aunt') || 'Aunt') : member.relation === 'cousin' ? (t('cousin') || 'Cousin') : member.relation === 'nephew' ? (t('nephew') || 'Nephew') : member.relation === 'niece' ? (t('niece') || 'Niece') : member.relation === 'son_in_law' ? (t('sonInLaw') || 'Son-in-law') : member.relation === 'daughter_in_law' ? (t('daughterInLaw') || 'Daughter-in-law') : member.relation === 'father_in_law' ? (t('fatherInLaw') || 'Father-in-law') : member.relation === 'mother_in_law' ? (t('motherInLaw') || 'Mother-in-law') : member.relation || (t('familyMember') || 'Family Member')}</span>
                            </div>
                          </div>
                          
                          <div className="member-details-grid expanded-member-grid">
                            <div className="detail-card">
                      <h4 className="card-title">👨‍👩‍👧‍👦 Personal</h4>
                      <div className="detail-items">
                        <div className="detail-item-row">
                          <span>
                            {member.gender === 'female' && member.maritalStatus === 'married'
                              ? `${t('husband')}:`
                              : `${t('father')}:`}
                          </span>
                          <span>{member.fatherName || 'N/A'}</span>
                        </div>
                        <div className="detail-item-row"><span>{t('mother') || 'Mother'}:</span><span>{member.motherName || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('sakh') || 'Sakh'}:</span><span>{highlightText(member.sakh || 'N/A', searchTerm)}</span></div>
                        <div className="detail-item-row"><span>{t('gender') || 'Gender'}:</span><span>{member.gender === 'male' ? (t('male') || 'Male') : member.gender === 'female' ? (t('female') || 'Female') : member.gender === 'other' ? (t('other') || 'Other') : member.gender || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('dob') || 'DOB'}:</span><span>{member.dateOfBirth || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('age') || 'Age'}:</span><span>{member.age || member.memberAge || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('maritalStatus') || 'Marital Status'}:</span><span>{member.maritalStatus === 'married' ? (t('married') || 'Married') : member.maritalStatus === 'single' ? (t('single') || 'Single') : member.maritalStatus === 'widowed' ? (t('widowed') || 'Widowed') : member.maritalStatus === 'divorced' ? (t('divorced') || 'Divorced') : member.maritalStatus || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('bloodGroup') || 'Blood Group'}:</span><span>{member.bloodGroup || 'N/A'}</span></div>
                      </div>
                    </div>
                            
                            <div className="detail-card">
                      <h4 className="card-title">📞 Contact</h4>
                      <div className="detail-items">
                        <div className="detail-item-row"><span>{t('mobile') || 'Mobile'}:</span><span>{highlightText(member.mobile_number || member.phone || member.mobileNumber || 'N/A', searchTerm)}</span></div>
                        <div className="detail-item-row"><span>{t('email') || 'Email'}:</span><span>{highlightText(member.email || 'N/A', searchTerm)}</span></div>
                        <div className="detail-item-row"><span>{t('emergencyContact') || 'Emergency Contact'}:</span><span>{member.emergencyContact || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('address') || 'Address'}:</span><span>{member.address || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('area') || 'Area'}:</span><span>{member.area || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('city') || 'City'}:</span><span>{highlightText(member.city || 'N/A', searchTerm)}</span></div>
                        <div className="detail-item-row"><span>{t('state') || 'State'}:</span><span>{member.state || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('pincode') || 'Pincode'}:</span><span>{member.pincode || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('country') || 'Country'}:</span><span>{member.country || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('hometown') || 'Hometown'}:</span><span>{member.hometown || 'N/A'}</span></div>
                      </div>
                    </div>
                            
                             <div className="detail-card">
                      <h4 className="card-title">🎓 Education & Work</h4>
                      <div className="detail-items">
                        <div className="detail-item-row"><span>{t('occupation') || 'Occupation'}:</span><span>{highlightText(member.occupation || 'N/A', searchTerm)}</span></div>
                        <div className="detail-item-row"><span>{t('education') || 'Education'}:</span><span>{member.education || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('institute') || 'Institute'}:</span><span>{member.instituteName || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('specialization') || 'Specialization'}:</span><span>{member.specialization || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('company') || 'Company'}:</span><span>{member.companyName || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('workAddress') || 'Work Address'}:</span><span>{member.workAddress || 'N/A'}</span></div>
                      </div>
                    </div>
                            
                            <div className="detail-card">
                      <h4 className="card-title">🕉️ Cultural & Physical</h4>
                      <div className="detail-items">
                        <div className="detail-item-row"><span>{t('religion') || 'Religion'}:</span><span>{member.religion || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('caste') || 'Caste'}:</span><span>{member.caste || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('subcaste') || 'Subcaste'}:</span><span>{member.subcaste || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('height') || 'Height'}:</span><span>{member.height || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('weight') || 'Weight'}:</span><span>{member.weight || 'N/A'}</span></div>
                      </div>
                    </div>
                    
                    <div className="detail-card">
                      <h4 className="card-title">🎨 Interests & Skills</h4>
                      <div className="detail-items">
                        <div className="detail-item-row"><span>{t('hobbies') || 'Hobbies'}:</span><span>{member.hobbies || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('languages') || 'Languages'}:</span><span>{member.languagesKnown || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('skills') || 'Skills'}:</span><span>{member.skills || 'N/A'}</span></div>
                        <div className="detail-item-row"><span>{t('achievements') || 'Achievements'}:</span><span>{member.achievements || 'N/A'}</span></div>
                      </div>
                    </div>
                    
                    <div className="detail-card">
                      <h4 className="card-title">🏥 Health & Medical</h4>
                      <div className="detail-items">
                        <div className="detail-item-row"><span>{t('medicalConditions') || 'Medical Conditions'}:</span><span>{member.medicalConditions || 'N/A'}</span></div>
                      </div>
                    </div>
                    
                    <div className="detail-card full-width">
                      <h4 className="card-title">📝 About</h4>
                      <div className="detail-items">
                        <div className="detail-item-row full-text"><span>{t('aboutMember') || 'About Member'}:</span><span style={{whiteSpace: 'pre-wrap', textAlign: 'left', marginLeft: 0, marginTop: '8px'}}>{member.aboutMember || 'N/A'}</span></div>
                      </div>
                    </div>
                          </div>
                        </div>
                        {mIdx < selectedFamily.family_members.length - 1 && (
                          <div className="member-separator"></div>
                        )}
                      </React.Fragment>
                      ))}
                    </div>
                  ) : (
                    <div className="no-members-message">{t('noFamilyMembersFound') || 'No family members found'}</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default FamilyDetails;