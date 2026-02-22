
export type CVTheme =
    | 'euro-classic'
    | 'modern-minimal'
    | 'executive-dark'
    | 'corporate-gray'
    | 'creative-teal'
    | 'compact-stack'
    | 'serif-elegant'
    | 'bold-header'
    | 'ats-clean-blue'
    | 'ats-centered-indigo';

export interface CVData {
    personalInfo: PersonalInfo;
    workExperience: WorkExperience[];
    education: Education[];
    skills: Skills;
    customSections: CustomSection[];
    sectionOrder: string[];
    sectionTitles?: { [key: string]: string };
    sectionColumns?: { [key: string]: 'left' | 'right' };
    theme: CVTheme;
}

export interface PersonalInfo {
    firstName: string;
    lastName: string;
    title: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    postalCode: string;
    country: string;
    website: string;
    linkedin: string;
    aboutMe: string;
}

export interface WorkExperience {
    id: string;
    title: string;
    employer: string;
    city: string;
    country: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
}

export interface Education {
    id: string;
    degree: string;
    school: string;
    city: string;
    country: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
}

export interface Skills {
    motherTongue: string;
    otherLanguages: LanguageSkill[];
    digitalSkills: DigitalSkillCategory[];
    softSkills: string[];
}

export interface DigitalSkillCategory {
    id: string;
    name: string; // e.g. "Frontend", "Backend" or empty for general
    skills: string[];
}

export interface LanguageSkill {
    id: string;
    language: string;
    listening: string;
    reading: string;
    spokenInteraction: string;
    spokenProduction: string;
    writing: string;
}

export interface CustomSection {
    id: string;
    title: string;
    items: CustomSectionItem[];
    type: 'custom';
}

export interface CustomSectionItem {
    id: string;
    title: string;
    subtitle: string;
    city: string;
    country: string;
    startDate: string;
    endDate: string;
    current: boolean;
    description: string;
}

export const LANGUAGE_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
