import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileService, ProfileDTO } from '../../services/profile.service';
import { IconsModule } from '../../icons.module';
import { Router } from '@angular/router';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, IconsModule],
  templateUrl: './user-profile.html',
})
export class UserProfileComponent implements OnInit {
  private profileService = inject(ProfileService);
  private router = inject(Router);

  profile: ProfileDTO | null = null;
  isLoading = true;

  isEditingName = false;
  isEditingTitle = false;
  isEditingMotto = false;
  isEditingSummary = false;
  tempFirstName = '';
  tempLastName = '';
  tempTitle = '';
  tempMotto = '';
  tempSummary = '';

  async ngOnInit() {
    await this.loadProfile();
  }

  async loadProfile() {
    this.isLoading = true;
    this.profile = await this.profileService.getProfileDashboard();
    this.isLoading = false;
  }

  startEditName() {
    if (!this.profile) return;
    this.tempFirstName = this.profile.firstName || '';
    this.tempLastName = this.profile.lastName || '';
    this.isEditingName = true;
  }

  async saveName(first: string, last: string) {
    this.isEditingName = false;
    if (this.profile) {
      this.profile.firstName = first;
      this.profile.lastName = last;
      await this.profileService.updateProfileDetails({ firstName: first, lastName: last });
    }
  }

  startEditTitle() {
    if (!this.profile) return;
    this.tempTitle = this.profile.title || '';
    this.isEditingTitle = true;
  }

  async saveTitle(value: string) {
    this.isEditingTitle = false;
    if (this.profile) {
      this.profile.title = value;
      await this.profileService.updateProfileDetails({ title: value });
    }
  }

  startEditMotto() {
    if (!this.profile) return;
    this.tempMotto = this.profile.motto || '';
    this.isEditingMotto = true;
  }

  async saveMotto(value: string) {
    this.isEditingMotto = false;
    if (this.profile) {
      this.profile.motto = value;
      await this.profileService.updateProfileDetails({ motto: value });
    }
  }

  startEditSummary() {
    if (!this.profile) return;
    this.tempSummary = this.profile.summary || '';
    this.isEditingSummary = true;
  }

  async saveSummary(value: string) {
    this.isEditingSummary = false;
    if (this.profile) {
      this.profile.summary = value;
      await this.profileService.updateProfileDetails({ summary: value });
    }
  }

  async uploadPhoto() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result as string;
          if (this.profile) {
            this.profile.photoUrl = base64;
            await this.profileService.updateProfileDetails({ photoUrl: base64 });
          }
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  }

  async addDrivingLicence() {
    const licence = prompt('Enter driving licence category (e.g. B, A1):');
    if (licence && this.profile) {
      this.profile.drivingLicence = licence;
      await this.profileService.updateProfileDetails({ drivingLicence: licence });
    }
  }

  async addHobby() {
    const hobby = prompt('Enter a hobby:');
    if (hobby && this.profile) {
      const hobbies = this.profile.hobbies || [];
      hobbies.push(hobby);
      this.profile.hobbies = hobbies;
      await this.profileService.updateProfileDetails({ hobbies });
    }
  }

  async addInterest() {
    const interest = prompt('Enter an interest:');
    if (interest && this.profile) {
      const interests = this.profile.interests || [];
      interests.push(interest);
      this.profile.interests = interests;
      await this.profileService.updateProfileDetails({ interests });
    }
  }

  async addSkill() {
    const skill = prompt('Enter a skill to add to your profile:');
    if (skill) {
      alert('Skill added! (This would sync with your CV)');
    }
  }

  viewLibrary() {
    this.goHome();
  }

  viewJobTrends() {
    alert('Job Trends feature coming soon!');
  }

  seeFavourites() {
    alert('Favourites feature coming soon!');
  }

  addJob() {
    alert('Job suggestions are being tailored for you...');
  }

  addCourse() {
    alert('Course suggestions are being tailored for you...');
  }

  createNewCv() {
    this.router.navigate(['/']);
  }

  createNewCoverLetter() {
    this.router.navigate(['/']);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  goHome() {
    this.router.navigate(['/']);
  }
}
