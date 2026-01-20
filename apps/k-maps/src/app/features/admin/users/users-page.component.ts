import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { UsersService, UserPayload, UserRow } from '../../../shared/services/users.service';
import { UserMonitoringService, UserActivityRow, UserStateRow } from '../../../shared/services/user-monitoring.service';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-admin-users-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-page.component.html',
  styleUrls: ['./users-page.component.scss']
})
export class UsersPageComponent implements OnInit {
  users: UserRow[] = [];
  loading = false;
  error = '';
  creating = false;
  createError = '';
  formData: UserPayload = {
    email: '',
    password: '',
    role: 'user',
  };
  states: UserStateRow[] = [];
  logs: UserActivityRow[] = [];
  monitoringLoading = false;
  monitoringError = '';

  constructor(
    private readonly usersService: UsersService,
    private readonly monitoring: UserMonitoringService
  ) {}

  ngOnInit() {
    this.refresh();
  }

  async refresh() {
    this.loading = true;
    this.error = '';
    try {
      const response = await firstValueFrom(this.usersService.list());
      if (response?.ok) {
        this.users = response.users || [];
        await this.refreshMonitoring();
      } else {
        this.error = 'Failed to load users';
      }
    } catch (err: any) {
      this.error = err?.message ?? 'Failed to load users';
    } finally {
      this.loading = false;
    }
  }

  async refreshMonitoring() {
    this.monitoringLoading = true;
    this.monitoringError = '';
    try {
      const [stateRes, logRes] = await Promise.all([
        firstValueFrom(this.monitoring.listStates()),
        firstValueFrom(this.monitoring.listActivity()),
      ]);
      if (stateRes.ok) {
        this.states = stateRes.states ?? [];
      }
      if (logRes.ok) {
        this.logs = logRes.logs ?? [];
      }
    } catch (err: any) {
      this.monitoringError = err?.message ?? 'Failed to load monitoring data';
    } finally {
      this.monitoringLoading = false;
    }
  }

  async refreshMonitoringOnly() {
    await this.refreshMonitoring();
  }

  async create() {
    if (this.creating) return;
    this.creating = true;
    this.createError = '';
    try {
      const result = await firstValueFrom(this.usersService.create(this.formData));
      if (result?.ok) {
        this.formData = { email: '', password: '', role: 'user' };
        await this.refresh();
      } else {
        this.createError = 'Could not create user';
      }
    } catch (err: any) {
      this.createError = err?.message ?? 'Creation failed';
    } finally {
      this.creating = false;
    }
  }
}
