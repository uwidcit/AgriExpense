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
import { EditCyclePage } from '../pages/edit-cycle/edit-cycle';
import { EditPurchasePage } from '../pages/edit-purchase/edit-purchase';
import { TabsPage } from '../pages/tabs/tabs';
import { PurchaseListingPage } from '../pages/purchase-listing/purchase-listing'
import { NewPurchasePage } from '../pages/new-purchase/new-purchase';
import { LabourerListingPage } from '../pages/labourer-listing/labourer-listing';
import { NewLabourerPage } from '../pages/new-labourer/new-labourer';
import { SelectCyclePage } from '../pages/select-cycle/select-cycle';
import { NewTaskPage } from '../pages/new-task/new-task';
import { ReportsPage } from '../pages/reports/reports';
import { PopoverPage } from '../pages/home/PopoverPage';
import { PlantMaterialManager } from '../core/PlantMaterialManager';
import { ChemicalsManager } from '../core/ChemicalsManager';
import { FertilizerManager } from '../core/FertilizerManager';
import { SoilAmendmentsManager } from '../core/SoilAmendmentsManager';
import { MaterialManager } from '../core/MaterialManager';
import { LabourManager } from '../core/LabourManager';
import { TaskManager } from '../core/TaskManager';
import { DataManagerFactory } from '../core/DataManagerFactory';
import { MeasurableDataManagerFactory } from '../core/MeasurableDataManagerFactory';
import { StatusBar } from '@ionic-native/status-bar';
import { SplashScreen } from '@ionic-native/splash-screen';
import { IonicStorageModule } from '@ionic/storage';
import { File } from '@ionic-native/file';
import { FileOpener } from '@ionic-native/file-opener';
import { ReportCreator } from '../core/ReportCreator';
import { CycleDataPage } from '../pages/cycle-data/cycle-data';

@NgModule({
  declarations: [
    MyApp,
    HomePage,
    ListPage,
    NewCyclePage,
    TabsPage,
    PurchaseListingPage,
    NewPurchasePage,
    EditCyclePage,
    EditPurchasePage,
    LabourerListingPage,
    NewLabourerPage,
    SelectCyclePage,
    NewTaskPage,
    ReportsPage,
    PopoverPage,
    CycleDataPage
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
    NewPurchasePage,
    EditCyclePage,
    EditPurchasePage,
    LabourerListingPage,
    NewLabourerPage,
    SelectCyclePage,
    NewTaskPage,
    ReportsPage,
    PopoverPage,
    CycleDataPage
  ],
  providers: [
    StatusBar,
    SplashScreen,
    CycleHandler,
    PurchaseHandler,
    PlantMaterialManager,
    ChemicalsManager,
    FertilizerManager,
    SoilAmendmentsManager,
    MaterialManager,
    LabourManager,
    TaskManager,
    DataManagerFactory,
    MeasurableDataManagerFactory,
    UUID,
    File,
    FileOpener,
    ReportCreator,
    {provide: ErrorHandler, useClass: IonicErrorHandler}
  ]
})
export class AppModule {}
