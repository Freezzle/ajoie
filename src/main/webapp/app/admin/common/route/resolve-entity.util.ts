import {HttpResponse} from '@angular/common/http';
import {ActivatedRouteSnapshot, Router} from '@angular/router';
import {EMPTY, Observable, of} from 'rxjs';
import {mergeMap} from 'rxjs/operators';

/**
 * Résolution générique d'une entité avec redirection 404 quand l'API répond sans corps.
 */
export function resolveEntityById<T>(
    route: ActivatedRouteSnapshot,
    idParam: string,
    find: (id: string) => Observable<HttpResponse<T>>,
    router: Router
): Observable<T | null> {
    const id = route.params[idParam];
    if (!id) {
        return of(null);
    }

    return find(id).pipe(
        mergeMap((response: HttpResponse<T>) => {
            if (response.body) {
                return of(response.body);
            }
            router.navigate(['404']);
            return EMPTY;
        })
    );
}
