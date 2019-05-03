import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';

import { Observable, of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';

import { StandardMap } from './standard-map';
import { MessageService } from './message.service';

const httpOptions = {
  headers: new HttpHeaders({ 'Content-Type': 'application/json' })
};

@Injectable({ providedIn: 'root' })
export class StandardMapService {

  private standardMapsUrl = 'api/standard-map';  // URL to web api

  constructor(
    private http: HttpClient,
    private messageService: MessageService) { }

  /** GET standard-map from the server */
  getStandardMaps (): Observable<StandardMap[]> {
    return this.http.get<StandardMap[]>(this.standardMapsUrl)
      .pipe(
        tap(_ => this.log('fetched standard-map')),
        catchError(this.handleError<StandardMap[]>('getStandardMaps', []))
      );
  }

  /** GET standard-map by id. Return `undefined` when id not found */
  getStandardMapNo404<Data>(id: number): Observable<StandardMap> {
    const url = `${this.standardMapsUrl}/?id=${id}`;
    return this.http.get<StandardMap[]>(url)
      .pipe(
        map(standardMap => standardMap[0]), // returns a {0|1} element array
        tap(h => {
          const outcome = h ? `fetched` : `did not find`;
          this.log(`${outcome} standard-map id=${id}`);
        }),
        catchError(this.handleError<StandardMap>(`getStandardMap id=${id}`))
      );
  }

  /** GET standard-map by id. Will 404 if id not found */
  getStandardMap(id: number): Observable<StandardMap> {
    const url = `${this.standardMapsUrl}/${id}`;
    return this.http.get<StandardMap>(url).pipe(
      tap(_ => this.log(`fetched standard-map id=${id}`)),
      catchError(this.handleError<StandardMap>(`getStandardMap id=${id}`))
    );
  }

  /* GET standard-map whose name contains search term */
  searchStandardMaps(term: string): Observable<StandardMap[]> {
    if (!term.trim()) {
      // if not search term, return empty standard-map array.
      return of([]);
    }
    return this.http.get<StandardMap[]>(`${this.standardMapsUrl}/?name=${term}`).pipe(
      tap(_ => this.log(`found standard-map matching "${term}"`)),
      catchError(this.handleError<StandardMap[]>('searchStandardMaps', []))
    );
  }

  //////// Save methods //////////

  /** POST: add a new standard-map to the server */
  addStandardMap (standardMap: StandardMap): Observable<StandardMap> {
    return this.http.post<StandardMap>(this.standardMapsUrl, standardMap, httpOptions).pipe(
      tap((newStandardMap: StandardMap) => this.log(`added standard-map w/ id=${newStandardMap.id}`)),
      catchError(this.handleError<StandardMap>('addStandardMap'))
    );
  }

  /** DELETE: delete the standard-map from the server */
  deleteStandardMap (standardMap: StandardMap | number): Observable<StandardMap> {
    const id = typeof standardMap === 'number' ? standardMap : standardMap.id;
    const url = `${this.standardMapsUrl}/${id}`;

    return this.http.delete<StandardMap>(url, httpOptions).pipe(
      tap(_ => this.log(`deleted standardMap id=${id}`)),
      catchError(this.handleError<StandardMap>('deleteStandardMap'))
    );
  }

  /** PUT: update the standard-map on the server */
  updateStandardMap (standardMap: StandardMap): Observable<any> {
    return this.http.put(this.standardMapsUrl, standardMap, httpOptions).pipe(
      tap(_ => this.log(`updated standard-map id=${standardMap.id}`)),
      catchError(this.handleError<any>('updateStandardMap'))
    );
  }

  /**
   * Handle Http operation that failed.
   * Let the app continue.
   * @param operation - name of the operation that failed
   * @param result - optional value to return as the observable result
   */
  private handleError<T> (operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {

      // TODO: send the error to remote logging infrastructure
      console.error(error); // log to console instead

      // TODO: better job of transforming error for user consumption
      this.log(`${operation} failed: ${error.message}`);

      // Let the app keep running by returning an empty result.
      return of(result as T);
    };
  }

  /** Log a StandardMapService message with the MessageService */
  private log(message: string) {
    this.messageService.add(`StandardMapService: ${message}`);
  }
}
