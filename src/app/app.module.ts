import { NgModule }       from '@angular/core';
import { BrowserModule }  from '@angular/platform-browser';
import { FormsModule }    from '@angular/forms';
import { HttpClientModule }    from '@angular/common/http';

import { HttpClientInMemoryWebApiModule } from 'angular-in-memory-web-api';
import { InMemoryDataService }  from './in-memory-data.service';

import { AppRoutingModule }     from './app-routing.module';

import { AppComponent }         from './app.component';
import { DashboardComponent }   from './dashboard/dashboard.component';
import { StandardMapDetailComponent }  from './standard-map-detail/standard-map-detail.component';
import { StandardMapsComponent }      from './standard-maps/standard-maps.component';
import { StandardMapSearchComponent }  from './standard-map-search/standard-map-search.component';
import { MessagesComponent }    from './messages/messages.component';
import { D3TestComponent }      from './d3-test/d3-test.component';
 
//import { D3Service } from 'd3-ng2-service';

@NgModule({
  imports: [
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    HttpClientModule,

    // The HttpClientInMemoryWebApiModule module intercepts HTTP requests
    // and returns simulated server responses.
    // Remove it when a real server is ready to receive requests.
    HttpClientInMemoryWebApiModule.forRoot(
      InMemoryDataService, { dataEncapsulation: false }
    )
  ],
  declarations: [
    AppComponent,
    DashboardComponent,
    StandardMapsComponent,
    StandardMapDetailComponent,
    MessagesComponent,
    StandardMapSearchComponent,
    D3TestComponent
  ],
  //providers: [D3Service],
  bootstrap: [ AppComponent ]
})
export class AppModule { }
