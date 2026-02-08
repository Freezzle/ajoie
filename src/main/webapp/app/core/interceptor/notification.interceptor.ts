import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';

import {AlertService} from 'app/core/util/alert.service';

@Injectable()
export class NotificationInterceptor implements HttpInterceptor {
    private alertService = inject(AlertService);

    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(request).pipe(
            tap((event: HttpEvent<any>) => {
                if (event instanceof HttpResponse) {
                    let alert: string | null = null;
                    let alertKey: string | null = null;
                    let alertParams: string | null = null;

                    for (const headerKey of event.headers.keys()) {
                        if (headerKey.toLowerCase().endsWith('-alert-key')) {
                            alertKey = event.headers.get(headerKey);
                        } else if (headerKey.toLowerCase().endsWith('-alert')) {
                            alert = event.headers.get(headerKey);
                        } else if (headerKey.toLowerCase().endsWith('-params')) {
                            alertParams = decodeURIComponent(event.headers.get(headerKey)!.replace(/\+/g, ' '));
                        }
                    }

                    if (alertKey) {
                        this.alertService.addAlert({
                                                       type: 'success',
                                                       translationKey: alertKey,
                                                       message: alert ?? undefined,
                                                       translationParams: {param: alertParams}
                                                   });
                    }
                }
            })
        );
    }
}
