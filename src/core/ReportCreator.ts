import {Injectable} from '@angular/core';
import {Platform} from 'ionic-angular';
import 'rxjs/add/operator/map';
import 'rxjs/Rx';
import {DataManager} from './DataManager';
import {Entry, File} from '@ionic-native/file';
import {FileOpener} from '@ionic-native/file-opener';
import {ToastController} from 'ionic-angular/components/toast/toast-controller';
import * as XLSX from 'xlsx';
import {CycleManager} from './CyclesModule/CycleManager';
import {DataManagerFactory} from './DataManagerFactory';
import {MaterialUseManager} from './MaterialUseManager';

@Injectable()
export class ReportCreator {

  ws: XLSX.WorkSheet;
  wb: XLSX.WorkBook;
  wbout: string;
  readonly directory: string = "AgriExpense";

  constructor(private platform: Platform, private file: File, private fileOpener: FileOpener, private dataManagerFactory: DataManagerFactory, private toastCtrl: ToastController, private cycleManager: CycleManager, private materialUseManager: MaterialUseManager) {
    this.wb = XLSX.utils.book_new();
  }

  public createNewWorkBook() {
    this.wb = XLSX.utils.book_new();
  }

  public addWorkSheet(data: Array<Array<string>>, sheetName: string) {
    let ws: XLSX.WorkSheet = XLSX.utils.aoa_to_sheet(data);
    XLSX.utils.book_append_sheet(this.wb, ws, sheetName);
  }

  public saveSpreadsheet() {
    let wbout: string = XLSX.write(this.wb, {bookType: 'xlsx', type: 'array'});
    let date = new Date();
    let blob = new Blob([wbout]);

    let filename = date.toString();

    if (this.platform.is('core') || this.platform.is('mobileweb')) {
      console.log('Saving file in browser...');
      this.saveInBrowser(blob, filename);
    }
    else {
      console.log('Saving file on device...');
      this.saveOnDevice(blob, filename);
    }
  }

  public getCycleSpreadsheetData(cycleManager: DataManager): Promise<Array<Array<string>>> {
    let list = Array<Array<string>>();
    return cycleManager.getAll().then((cycleData) => {
      let titleList = ['ID Number', 'Cycle Name', 'Crop Planted', 'Land Quantity', 'Units of land', 'Date Planted', 'Open'];
      this.colorHeading(titleList.length);
      list.push(titleList);
      for (let cycle of cycleData) {
        let currentCycle = Array<string>();
        let date: Date = new Date(cycle['datePlanted']);
        currentCycle.push(cycle['id']);
        currentCycle.push(cycle['name']);
        currentCycle.push(cycle['crop']);
        currentCycle.push(cycle['landQuantity']);
        currentCycle.push(cycle['landUnit']);
        currentCycle.push(date.toString());
        currentCycle.push(cycle['active']);
        list.push(currentCycle);
      }
      return list;
    });
  }

  public generateADBOutflowReport(cycleManager: CycleManager): Promise<Array<Array<string>>> {
    const records = Array<Array<string>>();
    // let purchaseManager = this.dataManagerFactory.getManager(DataManagerFactory.PURCHASE);
    // let purchaseDataMap = new Map<string, Object>();

    let cycleDataMap = new Map<string, Array<Object>>();
    // Current retrieves all of the cycles available in the database - //TODO - Need to provide interface for user to specify timeframe
    return this.cycleManager.getAll().then((cycleListing) => {
      let headings = ['No.', 'Crop', 'Input Description', 'Quantity per Ha. (1)', 'Area Exploited In (Ha.s) (2)', 'Price (in Soles)/Unit (3)', 'Total Expenses (In Soles) (1x2x3=4)', 'Beginning Month', 'Beginning Year'];
      let subHeadings = ['No.', 'Crop', 'Input Description', 'QtyPerArea', 'Area', 'UnitCPrice', 'Outflows', 'Beginning Month', 'Beginning Year'];
      let count = 1;

      const materialUsedPromises = [];

      records.push(headings);
      records.push(subHeadings);

      // For each cycle, retrieve the materials used
      cycleListing.forEach((cycle) => {
        // The request to retrieve the data is handle as promises. The promises are pushed to an array to be processed collectively
        materialUsedPromises.push(this.materialUseManager.getByCycleId(cycle['id']).then((materialUseList) => {
          cycleDataMap.set(cycle['id'], materialUseList);
        }));
      });

      // When all of the promises (to retrieve materials) are successfully processed
      return Promise.all(materialUsedPromises).then(() => {
        let CycleRecordPromises = [];

        cycleListing.forEach((cycle) => {
          let materialUseListing = cycleDataMap.get(cycle['id']);
          materialUseListing.forEach((materialUse) => {
            console.log("Processing: " + JSON.stringify(materialUse));

            let noString = count + "";
            count += 1;

            let areaOfLand = cycle['landQuantity'];
            const landUnit = cycle['landUnit'];

            // Acre to Hectare
            if (landUnit.localeCompare('Acre') === 0) {
              areaOfLand *= 0.404686;
            }
            // Square Meter to Hectare
            else if (landUnit.localeCompare('Bed (sq metre)') === 0){
              areaOfLand *= 0.00001;
            }
            else if (landUnit.localeCompare('Square Metres') === 0){
              areaOfLand *= 0.00001;
            }
            // 107640 sqft = 1 Ha
            else if (landUnit.localeCompare('Square Feet')  === 0){
              areaOfLand /= 107640;
            }
            // 1 Ha = 260 sq miles
            else if (landUnit.localeCompare('Square Miles')  === 0){
              areaOfLand *= 260;
            }

            const quantityPerArea = Number.parseFloat(materialUse['quantityUsed']) / areaOfLand; // (1)
            areaOfLand = Number.parseFloat(areaOfLand).toFixed(2); // (2)
            const costPerMaterial = Number.parseFloat(materialUse['costPerMaterial']); // (3)
            const monthlyExpense = quantityPerArea * areaOfLand * costPerMaterial; // 1 * 2 * 3 //TODO Should be monthly but we calculating total at the moment

            const areaOfLandString = areaOfLand + "";
            let quantityPerAreaString = quantityPerArea.toFixed(2) + "";

            // Request the meta data for this material record. When the data is retrieved, build the row and add to list of records
            CycleRecordPromises.push(this.materialUseManager.get(materialUse['materialId']).then((material) => {
              //
              const row = [
                noString, // No.
                cycle['crop'], // Crop
                material['name'], // Input description
                quantityPerAreaString, // Quantity per Ha (1).
                areaOfLandString, // Area Exploited in (Ha.s) (2)
                costPerMaterial, // Price in Soles/Unit (3)
                monthlyExpense // Monthly Expense (in soles)
              ];

              records.push(row);
            }));

          });
        });
        return Promise.all(CycleRecordPromises).then(() => {
          return records;
        });
      })

    })
  }

  public getPurchases(materialList: Array<Object>): Promise<Array<Object>> {
    let purchaseManager = this.dataManagerFactory.getManager(DataManagerFactory.PURCHASE);
    let purchaseListing = [];
    let promises = [];

    for (let materialUse of materialList) {
      promises.push(purchaseManager.get(materialUse['purchaseId']).then((purchase) => {
        purchaseListing.push(purchase);
      }));
    }

    return Promise.all(promises).then(() => {
      return purchaseListing;
    }).catch((error) => {
      return error;
    })
  }

  public colorHeading(numberCols: number) {
    // let range = {
    //   s: {
    //     c: 0,
    //     r: 0
    //   },
    //   e: {
    //     c: 0,
    //     r: numberCols
    //   }
    // };

    for (let col = 0; col < numberCols; col++) {
      let cell_address = {c: col, r: 0};
      let cell_ref = XLSX.utils.encode_cell(cell_address);
      console.log(cell_ref);
    }
  }

  public deleteReport(path: string, filename: string): Promise<boolean> {
    const filePath = this.file.externalRootDirectory + path.substr(1);
    //console.log('Deleting file: ' + filename + ' from path: ' + path);
    return this.file.removeFile(filePath, filename).then((result) => {
      return result.success === true;
    }).catch((error) => {
      console.log('ERROR: ' + JSON.stringify(error));
      return error;
    });
  }

  public deleteFile(entry: Entry): Promise<boolean> {
    let filepath = "";
    if (this.platform.is('ios')) {
      filepath = this.file.dataDirectory + '' + this.directory + '/';
    }
    else if (this.platform.is('android')) {
      filepath = this.file.externalRootDirectory + '' + this.directory + '/';
    }
    return this.file.removeFile(filepath, entry.name).then((result) => {
      return true;
    }).catch((error) => {
      return false;
    });

  }

  public openReport(fileEntry: Entry): void {
    let filepath: string = "";
    if (this.platform.is('ios')) {
      filepath = this.file.dataDirectory + fileEntry.fullPath.substr(1);
    }
    else if (this.platform.is('android')) {
      filepath = this.file.externalRootDirectory + fileEntry.fullPath.substr(1);
    }
    let toast = this.toastCtrl.create({
      message: '',
      duration: 5000,
      position: 'middle'
    });

    this.fileOpener.open(filepath, 'application/vnd.ms-excel').then(() => {
      console.log('Successfully opened file');
    }).catch((error) => {
      console.log('File open error: ' + JSON.stringify(error));
      let errorString = JSON.stringify(error);
      toast.setMessage('Error: ' + errorString);
      toast.present();
    });
  }

  public createExcelSpreadSheet(data: Array<Array<any>>): Promise<boolean> {
    this.ws = XLSX.utils.aoa_to_sheet(data);

    this.wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(this.wb, this.ws, 'Sheet1');

    this.wbout = XLSX.write(this.wb, {bookType: 'xlsx', type: 'array'});

    console.log('Creating excel...');

    let blob: Blob = new Blob([this.wbout]);

    let filename = new Date().toDateString();

    let expression = / /gi;

    filename = filename.replace(expression, '-');

    filename += '.xlsx';
    console.log(filename);

    if (this.platform.is('core') || this.platform.is('mobileweb')) {
      console.log('Saving file in browser...');
      return this.saveInBrowser(blob, filename);
    }
    else {
      if (this.platform){
        console.log('Saving file on device...');
        return this.saveOnDevice(blob, filename).then((result) => {
          return result;
        }).catch((error) => {
          return false;
        });
      }else{
        return this.saveInBrowser(blob, filename);
      }

    }
  }

  public saveOnDevice(blob: Blob, filename: string): Promise<boolean> {
    let toast = this.toastCtrl.create({
      message: 'File created',
      duration: 3000,
      position: 'top'
    });

    let errorToast = this.toastCtrl.create({
      message: 'Error creating file',
      duration: 3000,
      position: 'top'
    });

    if (this.platform.is('android')) {
      return this.createDirectoryAndroid(this.directory).then((url) => {
        return this.file.writeFile(url, filename, blob, {replace: true}).then(() => {
          toast.present();
          return true;
        }).catch((error) => {
          let errorString = JSON.stringify(error);
          errorToast.setMessage("er: " + errorString);
          errorToast.present();
          return false;
        });
      })
    }
    else if (this.platform.is('ios')) {
      return this.createDirectoryIOS(this.directory).then((url) => {
        return this.file.writeFile(url, filename, blob, {replace: true}).then(() => {
          toast.present();
          return true;
        });
      }).catch((error) => {
        let errorString = JSON.stringify(error);
        errorToast.setMessage("ios5: " + errorString);
        errorToast.present();
        return false;
      });
    }
    else{
      return this.createDirectory(this.directory).then((url) => {
        return this.file.writeFile(url, filename, blob, {replace: true}).then(() => {
          toast.present();
          return true;
        });
      }).catch((error) => {
        let errorString = JSON.stringify(error);
        errorToast.setMessage("ios5: " + errorString);
        errorToast.present();
        return false;
      });
    }
  }

  public retrieveFiles(folderName: string): Promise<Array<Entry>> {
    if (this.platform.is('ios')) {
      return this.file.listDir(this.file.dataDirectory, folderName).then((entries) => {
        return entries;
      }).catch((error) => {
        console.log(error);
        return error;
      });
    }
    else if (this.platform.is('android')) {
      return this.file.listDir(this.file.externalRootDirectory, folderName).then((entries) => {
        return entries;
      }).catch((error) => {
        console.log(error);
        return error;
      });
    }else{ // To handle the other types of supported OS that may occur
      return this.file.listDir(this.file.dataDirectory, folderName).then((entries) => {
        return entries;
      }).catch((error) => {
        console.log(error);
        return error;
      });
    }
  }

  public createDirectoryIOS(directoryName: string): Promise<string> {
    return this.file.checkDir(this.file.dataDirectory, directoryName).then((result) => {
      if (result === true) {
        console.log(directoryName + ' folder already created');
        return this.file.dataDirectory + '' + directoryName + '/';
      } else {
        return this.file.createDir(this.file.dataDirectory, directoryName, true).then((entry) => {
          console.log('Created folder ' + directoryName);
          return entry.toURL();
        }).catch((error) => {
          return '';
        });
      }
    }).catch((error) => {
      return this.file.createDir(this.file.dataDirectory, directoryName, true).then((entry) => {
        console.log('Created folder ' + directoryName);
        return entry.toURL();
      });
    });
  }

  //The createDirectory function accepts a directory name. If a directory already exists with this name, the function will return a url to that directory. Otherwise the function will create a directory with the given name and return a url of the newly created directory.
  public createDirectoryAndroid(directoryName: string): Promise<string> {
    return this.file.checkDir(this.file.externalRootDirectory, directoryName).then((result) => {
      if (result === true) {
        console.log(directoryName + ' folder already created');
        return this.file.externalRootDirectory + '' + directoryName + '/';
      } else {
        return this.file.createDir(this.file.externalRootDirectory, directoryName, true).then((entry) => {
          console.log('Created folder ' + directoryName);
          return entry.toURL();
        }).catch((error) => {
          return '';
        });
      }
    }).catch((error) => {
      return this.file.createDir(this.file.externalRootDirectory, directoryName, true).then((entry) => {
        console.log('Created folder ' + directoryName);
        return entry.toURL();
      }).catch((error) => {
        return '';
      });
    });
  }

  public createDirectory(directoryName: string): Promise<string>{
    return this.file.checkDir(this.file.dataDirectory, directoryName).then((result) => {
      if (result === true) {
        console.log(directoryName + ' folder already created');
        return this.file.dataDirectory + '' + directoryName + '/';
      } else {
        return this.file.createDir(this.file.dataDirectory, directoryName, true).then((entry) => {
          console.log('Created folder ' + directoryName);
          return entry.toURL();
        }).catch((error) => {
          return '';
        });
      }
    }).catch((error) => {
      return this.file.createDir(this.file.dataDirectory, directoryName, true).then((entry) => {
        console.log('Created folder ' + directoryName);
        return entry.toURL();
      });
    });
  }

  // noinspection JSMethodCanBeStatic
  private saveInBrowser(blob: Blob, filename: string): Promise<boolean> {
    return new Promise<boolean>(function(resolve, reject) {
      console.log('Save in browser function');
      console.log(blob);
      try{
        let a = document.createElement("a");
        document.body.appendChild(a);
        let url = window.URL.createObjectURL(blob);
        a.href = url;
        a.download = filename;
        a.click();
        window.URL.revokeObjectURL(url);
        resolve(true);
      }catch (e) {
        console.error(e);
        reject(false);
      }
    });
  }

  // noinspection JSMethodCanBeStatic
  convertToCsv(manager: DataManager): Promise<string> {
    return manager.getAll().then((data) => {
      let csvString = '';
      let heading = '';
      for (let index in data[0]) {
        heading += index + ',';
      }
      heading = heading.slice(0, -1);
      csvString += heading + '\r\n';
      for (let item of data) {
        let line = '';
        for (let index in item) {
          if (line != '') line += ',';
          line += item[index];
        }

        csvString += line + '\r\n';
      }
      return csvString;
    })
  }
}
