import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'gender',
  standalone: true
})
export class GenderPipe implements PipeTransform {
  transform(value: boolean): string {
    return value ? 'Žena' : 'Muškarac';
  }
}
