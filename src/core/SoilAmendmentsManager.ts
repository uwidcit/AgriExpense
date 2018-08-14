import { Storage } from '@ionic/storage';
import { Injectable } from '@angular/core';
import 'rxjs/add/operator/map';
import { UUID } from 'angular2-uuid';
import { MeasurableDataManager } from './MeasurableDataManager';

@Injectable()
export class SoilAmendmentsManager extends MeasurableDataManager{
    protected unitList: Array<string>;
    protected dataList: Array<Object>;
    public DATA_ID: string;

    constructor( storage: Storage, soilAmendmentUUID: UUID){
        super(storage, soilAmendmentUUID);

        this.unitList = ['Bag', 'Truck'];
        this.DATA_ID = "Soil Ammendment";
        this.dataList = [
            {
                "name": "Calphos"
            },
            {
                "name": "Chicken Manure"
            },
            {
                "name": "Compost"
            },
            {
                "name": "Cow Manure"
            },
            {
                "name": "Gypsum"
            },
            {
                "name": "Horse Manure"
            },
            {
                "name": "Limestone"
            },
            {
                "name": "Molasses"
            },
            {
                "name": "Sharp sand"
            },
            {
                "name": "Sulphur"
            }
        ]
    }
}