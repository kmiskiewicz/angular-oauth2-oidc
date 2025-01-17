import { Injectable, Optional } from '@angular/core';
import { OAuthService } from '../oauth-service';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable, of, merge } from 'rxjs';
import { catchError, filter, map, take, mergeMap, timeout } from 'rxjs/operators';
import { OAuthResourceServerErrorHandler } from './resource-server-error-handler';
import { OAuthModuleConfig } from '../oauth-module.config';

const WAIT_FOR_TOKEN_RECEIVED = 1000;

@Injectable()
export class DefaultOAuthInterceptor implements HttpInterceptor {
  constructor(
    private oAuthService: OAuthService,
    private errorHandler: OAuthResourceServerErrorHandler,
    @Optional() private moduleConfig: OAuthModuleConfig
  ) { }

  private checkUrl(url: string): boolean {
    const found = this.moduleConfig.resourceServer.allowedUrls.find(u => url.startsWith(u));
    return !!found;
  }

    public intercept(
        req: HttpRequest<any>,
        next: HttpHandler
    ): Observable<HttpEvent<any>> {
        const url = req.url;
        if (!url) {
          next.handle(req);
        }
        const lcUrl = url.toLowerCase();

    if (!this.moduleConfig) {
      return next.handle(req);
    }
    if (!this.moduleConfig.resourceServer) {
      return next.handle(req);
    }
        if (this.moduleConfig.resourceServer.allowedUrls && !this.checkUrl(lcUrl)) {
      return next.handle(req);
    }

    const sendAccessToken = this.moduleConfig.resourceServer.sendAccessToken;

    if (!sendAccessToken) {
      return next
        .handle(req)
        .pipe(catchError(err => this.errorHandler.handleError(err)));
    }

    return merge(
      of(this.oAuthService.getAccessToken()).pipe(
        filter(token => token ? true : false),
      ),
      this.oAuthService.events.pipe(
        filter(e => e.type === 'token_received'),
        timeout(WAIT_FOR_TOKEN_RECEIVED),
        map(_ => this.oAuthService.getAccessToken()),
      ),
    ).pipe(
      take(1),
      mergeMap(token => {
        if (token) {
          const header = 'Bearer ' + token;
          const headers = req.headers.set('Authorization', header);
          req = req.clone({ headers });
        }

        return next
          .handle(req)
          .pipe(catchError(err => this.errorHandler.handleError(err)));
      }),
    );
  }
}
