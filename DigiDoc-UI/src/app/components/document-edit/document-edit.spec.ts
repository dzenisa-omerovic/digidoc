import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentEditComponent } from './document-edit';

describe('DocumentEditComponent', () => {
  let component: DocumentEditComponent;
  let fixture: ComponentFixture<DocumentEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentEditComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentEditComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
