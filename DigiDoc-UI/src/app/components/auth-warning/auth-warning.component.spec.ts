import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AuthWarningComponent } from './auth-warning.component';

describe('AuthWarningComponent', () => {
  let component: AuthWarningComponent;
  let fixture: ComponentFixture<AuthWarningComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AuthWarningComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AuthWarningComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
