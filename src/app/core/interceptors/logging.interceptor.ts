import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { tap, catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export const loggingInterceptor: HttpInterceptorFn = (req, next) => {
  const start = Date.now();
  console.log(`%c[→ REQUEST] ${req.url}`, 'color:#378ADD;font-weight:bold');

  return next(req).pipe(
    tap(event => {
      if (event instanceof HttpResponse) {
        console.log(
          `%c[✓ RESPONSE] ${event.status} — ${Date.now() - start}ms`,
          'color:#1D9E75;font-weight:bold'
        );
      }
    }),
    catchError(err => {
      console.error(`[✗ ERROR] ${err.status} — ${err.message}`);
      return throwError(() => err);
    })
  );
};