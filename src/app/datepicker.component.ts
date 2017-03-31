import { Component, Input, Output, EventEmitter, forwardRef, ElementRef, Inject, OnInit } from '@angular/core';
import { NG_VALUE_ACCESSOR, ControlValueAccessor } from '@angular/forms';
import * as moment from 'moment';
import {CalendarDateItem, DatePickerOptionsItem, CalendarDate} from './calendar-itens.model';

export const Moment: any = (<any>moment).default || moment;

const DatePickerValueAccessor = {
  provide: NG_VALUE_ACCESSOR,
  useExisting: forwardRef(() => DatePickerComponent),
  multi: true,
};

@Component({
  selector: 'datepicker',
  templateUrl: './datepicker.component.html',
  styleUrls: ['./datepicker.component.scss'],
  providers: [DatePickerValueAccessor]
})
export class DatePickerComponent implements ControlValueAccessor, OnInit {

  @Input() options: DatePickerOptionsItem;
  @Input() inputEvents: EventEmitter<{type: string, data: string | CalendarDateItem}>;
  @Output() outputEvents: EventEmitter<{type: string, data: string | CalendarDateItem}>;

  date: CalendarDateItem;

  minDate: moment.Moment | any;
  maxDate: moment.Moment | any;
  opened: boolean;
  currentDate: moment.Moment;
  days: CalendarDate[];
  years: number[];
  yearPicker: boolean;

  private onTouchedCallback: () => void = () => {
  };
  private onChangeCallback: (_: any) => void = () => {
  };

  constructor(@Inject(ElementRef) public el: ElementRef) {
    this.opened = false;
    this.currentDate = Moment();
    this.options = this.options || {};
    this.days = [];
    this.years = [];
    this.date = new CalendarDateItem({
      day: null,
      month: null,
      year: null,
      formatted: null,
      momentObj: null
    });

    this.generateYears();
    this.outputEvents = new EventEmitter<{type: string, data: string | CalendarDateItem}>();

    if (!this.inputEvents) {
      return;
    }
    this.inputEvents.subscribe((event: {type: string, data: string | CalendarDateItem}) => {
      if (event.type === 'setDate') {
        this.value = event.data as CalendarDateItem;
      } else if (event.type === 'default') {
        if (event.data === 'open') {
          this.open();
        } else if (event.data === 'close') {
          this.close();
        }
      }
    });
  }

  generateYears() {
    let date: moment.Moment = this.options.minDate || Moment().year(Moment().year() - 40);
    let toDate: moment.Moment = this.options.maxDate || Moment().year(Moment().year() + 40);
    let years = toDate.year() - date.year();

    for (let i = 0; i < years; i++) {
      this.years.push(date.year());
      date.add(1, 'year');
    }
  }

  get value(): CalendarDateItem {
    return this.date;
  }

  set value(date: CalendarDateItem) {
    if (!date) {
      return;
    }
    this.date = date;
    this.onChangeCallback(date);
  }

  ngOnInit() {
    this.options = new DatePickerOptions(this.options);

    if (this.options.initialDate instanceof Date) {
      this.currentDate = Moment(this.options.initialDate);
      this.selectDate(null, this.currentDate);
    }

    if (this.options.minDate instanceof Date) {
      this.minDate = Moment(this.options.minDate);
    } else {
      this.minDate = null;
    }

    if (this.options.maxDate instanceof Date) {
      this.maxDate = Moment(this.options.maxDate);
    } else {
      this.maxDate = null;
    }

    this.generateCalendar();
    this.outputEvents.emit({type: 'default', data: 'init'});

    if (typeof window !== 'undefined') {
      let body = document.querySelector('body');
      body.addEventListener('click', e => {
        if (!this.opened || !e.target) {
          return;
        }
        if (this.el.nativeElement !== e.target && !this.el.nativeElement.contains((<any>e.target))) {
          this.close();
        }
      }, false);
    }

    if (this.inputEvents) {
      this.inputEvents.subscribe((e: any) => {
        if (e.type === 'action') {
          if (e.data === 'toggle') {
            this.toggle();
          }
          if (e.data === 'close') {
            this.close();
          }
          if (e.data === 'open') {
            this.open();
          }
        }

        if (e.type === 'setDate') {
          if (!(e.data instanceof Date)) {
            throw new Error(`Input data must be an instance of Date!`);
          }
          let date: moment.Moment = Moment(e.data);
          if (!date) {
            throw new Error(`Invalid date: ${e.data}`);
          }
          this.value = {
            day: date.format('DD'),
            month: date.format('MM'),
            year: date.format('YYYY'),
            formatted: date.format(this.options.format),
            momentObj: date
          };
        }
      });
    }
  }

  generateCalendar() {
    let date: moment.Moment = Moment(this.currentDate);
    let month = date.month();
    let year = date.year();
    let n = 1;
    let firstWeekDay = (this.options.firstWeekdaySunday) ? date.date(2).day() : date.date(1).day();

    if (firstWeekDay !== 1) {
      n -= (firstWeekDay + 6) % 7;
    }

    this.days = [];
    let selectedDate: moment.Moment = this.date.momentObj;
    for (let i = n; i <= date.endOf('month').date(); i += 1) {
      let currentDate: moment.Moment = Moment(`${i}.${month + 1}.${year}`, 'DD.MM.YYYY');
      let today: boolean = (Moment().isSame(currentDate, 'day') && Moment().isSame(currentDate, 'month'));
      let selected: boolean = (selectedDate && selectedDate.isSame(currentDate, 'day'));
      let betweenMinMax = true;

      if (this.minDate !== null) {
        if (this.maxDate !== null) {
          betweenMinMax = currentDate.isBetween(this.minDate, this.maxDate, 'day', '[]');
        } else {
          betweenMinMax = currentDate.isBefore(this.minDate, 'day');
        }
      } else {
        if (this.maxDate !== null) {
          betweenMinMax = currentDate.isAfter(this.maxDate, 'day');
        }
      }

      let day: CalendarDate = {
        day: i > 0 ? i : null,
        month: i > 0 ? month : null,
        year: i > 0 ? year : null,
        enabled: i > 0 ? betweenMinMax : false,
        today: i > 0 && today,
        selected: i > 0 && selected,
        momentObj: currentDate
      };

      this.days.push(day);
    }
  }

  selectDate(e: MouseEvent, date: moment.Moment) {
    if (e) { e.preventDefault(); }

    setTimeout(() => {
      this.value = {
        day: date.format('DD'),
        month: date.format('MM'),
        year: date.format('YYYY'),
        formatted: date.format(this.options.format),
        momentObj: date
      };
      this.generateCalendar();

      this.outputEvents.emit({ type: 'dateChanged', data: this.value });
    });

    if (this.options.autoApply === true && this.opened === true) {
      this.opened = false;
    }
  }

  selectYear(e: MouseEvent, year: number) {
    e.preventDefault();

    setTimeout(() => {
      let date: moment.Moment = this.currentDate.year(year);
      this.value = {
        day: date.format('DD'),
        month: date.format('MM'),
        year: date.format('YYYY'),
        formatted: date.format(this.options.format),
        momentObj: date
      };
      this.yearPicker = false;
      this.generateCalendar();
    });
  }

  writeValue(date: CalendarDateItem) {
    if (!date) {
      return;
    }
    this.date = date;
  }

  registerOnChange(fn: any) {
    this.onChangeCallback = fn;
  }

  registerOnTouched(fn: any) {
    this.onTouchedCallback = fn;
  }

  prevMonth() {
    this.currentDate = this.currentDate.subtract(1, 'month');
    this.generateCalendar();
  }

  nextMonth() {
    this.currentDate = this.currentDate.add(1, 'month');
    this.generateCalendar();
  }

  today() {
    this.currentDate = Moment();
    this.selectDate(null, this.currentDate);
  }

  toggle() {
    this.opened = !this.opened;
    if (this.opened) {
      this.onOpen();
    }

    this.outputEvents.emit({type: 'default', data: 'opened'});
  }

  open() {
    this.opened = true;
    this.onOpen();
  }

  close() {
    this.opened = false;
    this.outputEvents.emit({type: 'default', data: 'closed'});
  }

  onOpen() {
    this.yearPicker = false;
  }

  openYearPicker() {
    setTimeout(() => this.yearPicker = true);
  }
}

export class DatePickerOptions {
  autoApply?: boolean;
  style?: 'normal' | 'big' | 'bold';
  locale?: string;
  minDate?: Date;
  maxDate?: Date;
  initialDate?: Date;
  firstWeekdaySunday?: boolean;
  format?: string;

  constructor(obj?: DatePickerOptionsItem) {
    this.autoApply = !!(obj && obj.autoApply === true);
    this.locale = obj && obj.locale ? obj.locale : 'pt-BR';
    this.minDate = obj && obj.minDate ? obj.minDate : null;
    this.maxDate = obj && obj.maxDate ? obj.maxDate : null;
    this.initialDate = obj && obj.initialDate ? obj.initialDate : null;
    this.firstWeekdaySunday = !!(obj && obj.firstWeekdaySunday === true);
    this.format = obj && obj.format ? obj.format : 'YYYY-MM-DD';
  }
}
