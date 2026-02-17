import {inject, Injectable} from '@angular/core';
import {ConfirmationService, MessageService} from 'primeng/api';
import {TranslateService} from '@ngx-translate/core';
import {Observable, Subject} from 'rxjs';

@Injectable({providedIn: 'root'})
export class ConfirmDialogService {
    private readonly confirmationService = inject(ConfirmationService);
    private readonly translateService = inject(TranslateService);
    private readonly messageService = inject(MessageService);

    public delete(target: HTMLElement, translateKey: string, interpolateParams?: object): Observable<boolean> {
        const subject = new Subject<boolean>();

        this.confirmationService.confirm({
                                             target,
                                             message: this.translateService.instant(translateKey, interpolateParams) as string,
                                             header: 'Attention',
                                             icon: 'pi pi-exclamation-triangle',
                                             rejectLabel: this.translateService.instant('common.cancel'),
                                             acceptLabel: this.translateService.instant('common.delete'),
                                             rejectButtonProps: {
                                                 severity: 'secondary',
                                                 outlined: true
                                             },
                                             acceptButtonProps: {
                                                 severity: 'danger'
                                             },
                                             accept: () => {
                                                 subject.next(true);
                                                 subject.complete();
                                                 this.messageService.add({
                                                                             severity: 'info',
                                                                             summary: undefined,
                                                                             detail: this.translateService.instant('common.deleted')
                                                                         });
                                             },
                                             reject() {
                                                 subject.next(false);
                                                 subject.complete();
                                             }
                                         });

        return subject.asObservable();
    }

    public confirmAction(target: HTMLElement, messageKey: string, interpolateParams?: object): Observable<boolean> {
        const subject = new Subject<boolean>();

        this.confirmationService.confirm({
                                             target,
                                             message: this.translateService.instant(messageKey, interpolateParams) as string,
                                             header: this.translateService.instant('common.confirmation') as string,
                                             icon: 'pi pi-question-circle',
                                             rejectLabel: this.translateService.instant('common.cancel'),
                                             acceptLabel: this.translateService.instant('common.confirm'),
                                             rejectButtonProps: {
                                                 severity: 'secondary',
                                                 outlined: true
                                             },
                                             acceptButtonProps: {
                                                 severity: 'primary'
                                             },
                                             accept: () => {
                                                 subject.next(true);
                                                 subject.complete();
                                             },
                                             reject() {
                                                 subject.next(false);
                                                 subject.complete();
                                             }
                                         });

        return subject.asObservable();
    }
}