/**
 * Created by Rodolfo Galli on 09/06/2016.
 */
import { Component, ViewContainerRef, Input, Output, EventEmitter, AfterViewInit, forwardRef, ViewEncapsulation } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import * as moment from 'moment';
import { CalendarDateItem } from './calendar-date-item';

const noop = () => {
    //console.log('noop');
};
const DatePickerValueAccessor = {
    provide: NG_VALUE_ACCESSOR,
    useExisting: forwardRef(() => DataPickerComponent),
    multi: true,
};

@Component({
    moduleId: module.id,
    encapsulation: ViewEncapsulation.None,
    selector: 'datepicker',
    templateUrl: 'datepicker.component.html',
    providers: [DatePickerValueAccessor],
    styleUrls: ['./datapicker.component.css']
})
export class DataPickerComponent implements ControlValueAccessor, AfterViewInit {

    @Input('modelFormat')
    modelFormat: string;
    @Input('viewFormat')
    viewFormat: string;
    @Input('initDate')
    initDate: string;
    @Input('firstWeekDaySunday')
    firstWeekDaySunday: boolean;
    @Input('isStatic')
    isStatic: boolean;
    @Input()
    maxDate: string;
    @Input()
    minDate: string;
    @Input('required')
    required: boolean;
    @Input()
    @Input()
    label: string;
    name: string;
    @Input()
    id: string;


    @Output()
    ngModelChange: EventEmitter<any> = new EventEmitter<any>();

    public selectedDate: any;
    public isOpened: boolean;
    public dateValue: string;
    public viewValue: string;
    public days: Array<CalendarDateItem>;
    public dayNames: Array<string>;
    public cd: any;
    public viewContainer: ViewContainerRef;

    private el: any;
    private date: any;
    private cannonical: number;
    //Placeholders for the callbacks
    private _onTouchedCallback: () => void = noop;
    private _onChangeCallback: (_: any) => void = noop;

    constructor(viewContainer: ViewContainerRef) {
        moment.locale('pt-BR');
        this.viewContainer = viewContainer;
        this.el = viewContainer.element.nativeElement;
        this.init();
    }

    public atribuirDataModel() {
        if (!this.verificaData()) {
            return;
        }
        this.viewValue = this.viewValue.replace(/[a-zA-Z]/g, '');
        let dataFormatada: string;
        let value = this.viewValue;
        let _viewValue = this.viewValue;
        let _alerta = false;
        if (value.length === 2) {
            _viewValue = value + '/';
        }

        if (value.length === 4 && +value.substring(3, 4) > 1) {
            _viewValue = value.substring(0, 3) + '0' + value.substring(3, 4) + '/';
        } else if (value.length === 5) {
            _viewValue = value + '/';
        } else if (value.length === 8) {
            dataFormatada = value.substring(6, 8) + '-' + value.substring(3, 5) + '-' + value.substring(0, 2);
            if (!moment(dataFormatada, 'YY-MM-DD').isValid()) {
                _alerta = true;
            }
        } else if (value.length === 10) {
            dataFormatada = value.substring(6, 10) + '-' + value.substring(3, 5) + '-' + value.substring(0, 2);
            if (!moment(dataFormatada, 'YYYY-MM-DD').isValid()) {
                _alerta = true;
            }
        }


        if (_viewValue.length > 10) {
            _viewValue = _viewValue.substring(0, 9) + _viewValue.substring(10, 11);
        }
        if (_viewValue.length >= 2 && _viewValue.substring(2, 3) !== '/') {
            _viewValue = _viewValue.substring(0, 2) + '/' + _viewValue.substring(2, 10);
        }
        if (_viewValue.length >= 5 && _viewValue.substring(5, 6) !== '/') {
            _viewValue = _viewValue.substring(0, 5) + '/' + _viewValue.substring(5, 10);
        }


        _viewValue = _viewValue.replace('//', '/');


        this.viewValue = _viewValue;
        if (moment(this.viewValue, 'DD/MM/YYYY', true).isValid()) {
            let selectedDate = moment(this.viewValue, 'DD/MM/YYYY');
            this.setValue(selectedDate);
            this.date = selectedDate;
            this.ngModelChange.emit(selectedDate);
        }
    }

    ngAfterViewInit() {
        this.initValue();
    }

    public openDatepicker(): void {
        this.isOpened = true;
    }

    public closeDatepicker(): void {
        this.isOpened = false;
    }

    public prevYear(): void {
        this.date.subtract(1, 'Y');
        this.generateCalendar(this.date);
    }

    public prevMonth(): void {
        this.date.subtract(1, 'M');
        this.generateCalendar(this.date);
    }

    public nextYear(): void {
        this.date.add(1, 'Y');
        this.generateCalendar(this.date);
    }

    public nextMonth(): void {
        this.date.add(1, 'M');
        this.generateCalendar(this.date);
    }

    public selectDate(e: MouseEvent, date: CalendarDateItem): void {
        e.preventDefault();
        //if (this.isSelected(date)) return;

        let selectedDate = moment(date.day + '.' + date.month + '.' + date.year, 'DD/MM/YYYY');
        this.setValue(selectedDate);
        this.closeDatepicker();
        this.date = selectedDate;
        this.ngModelChange.emit(selectedDate);
        this._onChangeCallback(selectedDate);
        this.atribuirDataModel();
    }

    isInvalidDate(date: moment.Moment) {
        if (date === null || date === undefined || date.day === null || date.day === undefined) return true;
        if ((this.maxDate === null || this.maxDate === undefined) && (this.minDate === null || this.minDate === undefined)) {
            return false;
        }
        let selectedDate = moment(date.day + '.' + date.month + '.' + date.year, 'DD/MM/YYYY');
        let maxDate = moment(this.maxDate, 'DD/MM/YYYY');
        let minDate = moment(this.minDate, 'DD/MM/YYYY');
        return (selectedDate.toDate() > maxDate.toDate() || selectedDate.toDate() < minDate.toDate());
    }

    isSelected(date: CalendarDateItem) {
        let selectedDate = moment(date.day + '.' + date.month + '.' + date.year, 'DD/MM/YYYY');
        return selectedDate.toDate().getTime() === this.cannonical;
    }

    writeValue(value: string): void {
        if (!value) return;
        this.setValue(value);
    }

    registerOnChange(fn: (_: any) => {}): void {
        this._onChangeCallback = fn;
    }

    registerOnTouched(fn: (_: any) => {}): void {
        this._onTouchedCallback();
    }

    cleanFieldModel() {
        this.viewValue = null;
        this.ngModelChange.emit(null);
        this._onChangeCallback(null);
        this.isOpened = false;
    }

    setNowDate() {
        let hoje = new Date;
        let selectedDate = moment(hoje.getDate() + '.' + this.fillZero(hoje.getMonth() + 1) + '.' + hoje.getFullYear(), 'DD/MM/YYYY');
        this.date = selectedDate;
        this.setValue(selectedDate);
        this.generateCalendar(this.date);
        this.closeDatepicker();
    }

    private generateCalendar(date: moment.Moment): void {
        let lastDayOfMonth = date.endOf('month').date();
        let month = date.month();
        let year = date.year();
        let n = 0;
        let firstWeekDay: number = null;

        this.dateValue = date.format('MMMM YYYY');
        this.days = [];
        if (this.firstWeekDaySunday === true) {
            firstWeekDay = date.date(2).day();
        } else {
            firstWeekDay = date.date(1).day();
            let dataAtual = moment();
            if (date.month() === dataAtual.month()) {
                date.date(dataAtual.date());
            }
        }

        if (firstWeekDay !== 1) {
            n -= (firstWeekDay + 6) % 7;
        }
        for (let i = n; i <= lastDayOfMonth; i += 1) {
            if (i > 0) {
                this.days.push({ day: i, month: month + 1, year: year, enabled: true });
            } else {
                this.days.push({ day: null, month: null, year: null, enabled: false });
            }
        }
    }

    private verificaData() {
        if (this.viewValue === null || this.viewValue === undefined || this.viewValue === '' || this.viewValue === 'Invalid date') {
            this.cleanFieldModel();
            return false;
        }
        return true;
    }

    private fillZero(val: number) {
        return val < 10 ? 0 + val.toString() : val.toString();
    }

    private generateDayNames(): void {
        this.dayNames = [];

        let date = this.firstWeekDaySunday === true ? moment('2016-06-07') : moment('2016-05-01');
        for (let i = 0; i < 7; i += 1) {
            this.dayNames.push(date.format('ddd'));
            date.add('1', 'd');
        }
    }

    private initMouseEvents(): void {
        let body = document.getElementsByTagName('body')[0];

        body.addEventListener('click', (e) => {
            if (!this.isOpened || !e.target) return;
            if (this.el !== e.target && !this.el.contains(e.target)) {
                this.closeDatepicker();
            }
        }, false);
    }

    private setValue(value: any): void {
        let val = moment(value, this.modelFormat || 'YYYY-MM-DD');
        this.viewValue = val.format(this.viewFormat || 'DD MMMM YYYY');
        if (this.verificaData()) {
            this._onChangeCallback(val.format(this.modelFormat || 'YYYY-MM-DD'));
            this.cannonical = val.toDate().getTime();
        }
    }

    private initValue(): void {
        setTimeout(() => {
            if (!this.initDate) {
                this.selectedDate = moment(new Date(this.viewValue));
                this.setValue(moment(this.initDate, this.modelFormat || 'YYYY-MM-DD'));
            }
        });
    }

    private init(): void {
        this.isOpened = false;
        this.date = moment();
        this.firstWeekDaySunday = false;
        this.generateDayNames();
        this.generateCalendar(this.date);
        this.initMouseEvents();
    }
}
