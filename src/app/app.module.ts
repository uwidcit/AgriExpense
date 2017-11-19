import { BrowserModule } from '@angular/platform-browser';
import { ErrorHandler, NgModule } from '@angular/core';
import { IonicApp, IonicErrorHandler, IonicModule } from 'ionic-angular';

import { MyApp } from './app.component';
import { HomePage } from '../pages/home/home';
import { HttpModule } from '@angular/http';
import { UUID } from 'angular2-uuid';
import { ListPage } from '../pages/list/list';
import { CycleHandler } from '../core/CycleHandler';
import { PurchaseHandler } from '../core/PurchaseHandler';
import { NewCyclePage } from '../pages/new-cycle/new-cycle';
import { TabsPage } from '../pages/tabs/tabs';
import { PurchaseListingPage } from '../pages/purchase-listing/purchase-listing'
import { NewPurchasePage } from '../pages/new-purchase/new-purchase';
import { PlantMaterialManager } from '../core/PlantMaterialManager';
import { ChemicalsManager } from '../core/ChemicalsManager';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { IonicStorageModule } from '@ionic/storage';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    ListPage,
    NewCyclePage,
    TabsPage,
    PurchaseListingPage,
    NewPurchasePage
  ],
  imports: [
    BrowserModule,
    HttpModule,
    IonicModule.forRoot(MyApp),
    IonicStorageModule.forRoot({
      name: '__mydb',
      driverOrder: ['indexeddb', 'sqlite', 'websql']
    })
  ],
  bootstrap: [IonicApp],
  entryComponents: [
    MyApp,
    HomePage,
    ListPage,
    NewCyclePage,
    TabsPage,
    PurchaseListingPage,
    NewPurchasePage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    CycleHandler,
    PurchaseHandler,
    PlantMaterialManager,
    ChemicalsManager,
    UUID,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
