import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {NavigationExtras, Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {Observable, throwError as observableThrowError} from 'rxjs';
import {catchError} from 'rxjs/operators';
import {ToastService} from '../shared/toast/ToastService';
import {AuthentificationStore} from './auth/authentification.store';


@Injectable()
export class LogoutInterceptor implements HttpInterceptor {

    constructor(
        private _toast: ToastService,
        private _authStore: AuthentificationStore,
        private _router: Router,
        private _translate: TranslateService) {
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        return next.handle(req).pipe(
            catchError(e => {
                if (e instanceof HttpErrorResponse) {
                    if (e.status === 0) {
                        this._toast.error('API Unreachable', '');
                    } else if (e.status === 401) {
                        this._authStore.removeUser();
                        let navigationExtras: NavigationExtras = {
                            queryParams: {}
                        };

                        if (this._router.routerState.snapshot.url
                            && this._router.routerState.snapshot.url.indexOf('account/login') === -1) {
                          navigationExtras.queryParams = {redirect: this._router.routerState.snapshot.url};
                        }

                        if (navigationExtras.queryParams.redirect) {
                            this._router.navigate(['/account/login'], navigationExtras);
                            this._authStore.removeUser();
                        }
                    } else {
                        // error formatted from CDS API
                        if (e.error && e.error.message) {
                            this._toast.error(e.statusText, e.error.message);
                        } else {
                            try {
                                this._toast.error(e.statusText, JSON.parse(e.message));
                            } catch (e) {
                                this._toast.error(e.statusText, this._translate.instant('common_error'));
                            }
                        }
                    }
                    return observableThrowError(e);
                }
        }));
    }
}
