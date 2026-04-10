import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ApplicationConfigService} from 'app/core/config/application-config.service';
import {ISubtaskInstance, ITaskComment, ITaskInstance, TaskStatus} from '../model/task-instance.interface';

@Injectable({providedIn: 'root'})
export class TaskInstanceService {
    protected http = inject(HttpClient);
    protected applicationConfigService = inject(ApplicationConfigService);
    protected salonUrl = this.applicationConfigService.getEndpointFor('api/admin/salons');
    protected instanceUrl = this.applicationConfigService.getEndpointFor('api/admin/task-instances');
    protected subtaskUrl = this.applicationConfigService.getEndpointFor('api/admin/subtask-instances');
    protected commentUrl = this.applicationConfigService.getEndpointFor('api/admin/task-comments');

    findAllBySalon(salonId: string): Observable<ITaskInstance[]> {
        return this.http.get<ITaskInstance[]>(`${this.salonUrl}/${salonId}/tasks`);
    }

    create(salonId: string, task: Partial<ITaskInstance>): Observable<ITaskInstance> {
        return this.http.post<ITaskInstance>(`${this.salonUrl}/${salonId}/tasks`, task);
    }

    find(id: string): Observable<ITaskInstance> {
        return this.http.get<ITaskInstance>(`${this.instanceUrl}/${id}`);
    }

    updateStatus(id: string, status: TaskStatus): Observable<ITaskInstance> {
        return this.http.patch<ITaskInstance>(`${this.instanceUrl}/${id}/status`, {status});
    }

    patch(id: string, data: Partial<ITaskInstance>): Observable<ITaskInstance> {
        return this.http.patch<ITaskInstance>(`${this.instanceUrl}/${id}`, data);
    }

    delete(id: string): Observable<void> {
        return this.http.delete<void>(`${this.instanceUrl}/${id}`);
    }

    addSubtask(taskInstanceId: string, subtask: Partial<ISubtaskInstance>): Observable<ISubtaskInstance> {
        return this.http.post<ISubtaskInstance>(`${this.instanceUrl}/${taskInstanceId}/subtasks`, subtask);
    }

    updateSubtaskStatus(subtaskId: string, status: TaskStatus): Observable<ISubtaskInstance> {
        return this.http.patch<ISubtaskInstance>(`${this.subtaskUrl}/${subtaskId}/status`, {status});
    }

    patchSubtask(subtaskId: string, data: Partial<ISubtaskInstance>): Observable<ISubtaskInstance> {
        console.log('Patching subtask', subtaskId, data);
        return this.http.patch<ISubtaskInstance>(`${this.subtaskUrl}/${subtaskId}`, data);
    }

    deleteSubtask(subtaskId: string): Observable<void> {
        return this.http.delete<void>(`${this.subtaskUrl}/${subtaskId}`);
    }

    addComment(taskInstanceId: string, comment: Partial<ITaskComment>): Observable<ITaskComment> {
        return this.http.post<ITaskComment>(`${this.instanceUrl}/${taskInstanceId}/comments`, comment);
    }

    deleteComment(commentId: string): Observable<void> {
        return this.http.delete<void>(`${this.commentUrl}/${commentId}`);
    }
}
