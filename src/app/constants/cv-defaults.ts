import { CVData } from '../models/cv.model';

export const EMPTY_CV_DATA: CVData = {
    theme: 'euro-classic',
    personalInfo: {
        firstName: '',
        lastName: '',
        title: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        postalCode: '',
        country: '',
        website: '',
        linkedin: '',
        aboutMe: ''
    },
    workExperience: [],
    education: [],
    skills: {
        motherTongue: '',
        otherLanguages: [],
        digitalSkills: [],
        softSkills: []
    },
    customSections: [],
    sectionOrder: ['aboutMe', 'workExperience', 'education', 'skills'],
    sectionTitles: {
        aboutMe: 'About Me',
        workExperience: 'Work Experience',
        education: 'Education and Training',
        skills: 'Personal Skills'
    }
};

export const SAMPLE_CV_DATA: CVData = {
    theme: 'euro-classic',
    personalInfo: {
        firstName: 'John',
        lastName: 'Doe',
        title: 'Software Developer',
        email: 'john.doe@example.com',
        phone: '+1 234 567 890',
        address: '123 Main St',
        city: 'New York',
        postalCode: '10001',
        country: 'USA',
        website: 'johndoe.dev',
        linkedin: 'linkedin.com/in/johndoe',
        aboutMe: 'Experienced software developer with a passion for building scalable web applications. Proficient in React, TypeScript, and Cloud technologies.'
    },
    workExperience: [
        {
            id: '1',
            title: 'Senior Frontend Engineer',
            employer: 'Tech Solutions Inc.',
            city: 'San Francisco',
            country: 'USA',
            startDate: '2020-03-01',
            endDate: '',
            current: true,
            description: '<ul><li>Led the migration of legacy code to React 18.</li><li>Mentored junior developers and conducted code reviews.</li><li>Improved site performance scores by 40%.</li></ul>'
        }
    ],
    education: [
        {
            id: '1',
            degree: 'BSc Computer Science',
            school: 'University of Technology',
            city: 'Boston',
            country: 'USA',
            startDate: '2015-09-01',
            endDate: '2019-06-30',
            current: false,
            description: 'Graduated with Honors. Specialization in Artificial Intelligence.'
        }
    ],
    skills: {
        motherTongue: 'English',
        otherLanguages: [
            { id: '1', language: 'Spanish', listening: 'B2', reading: 'B2', spokenInteraction: 'B1', spokenProduction: 'B1', writing: 'A2' }
        ],
        digitalSkills: [
            { id: '1', name: 'Frontend', skills: ['React', 'TypeScript', 'Tailwind CSS', 'Next.js'] },
            { id: '2', name: 'Backend', skills: ['Node.js', 'PostgreSQL', 'Docker', 'AWS'] }
        ],
        softSkills: ['Leadership', 'Communication', 'Problem Solving']
    },
    customSections: [],
    sectionOrder: ['aboutMe', 'workExperience', 'education', 'skills'],
    sectionTitles: {
        aboutMe: 'About Me',
        workExperience: 'Work Experience',
        education: 'Education and Training',
        skills: 'Personal Skills'
    }
};
