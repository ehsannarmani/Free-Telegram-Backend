import { Subject } from 'rxjs';

export interface AuthSession {
  phoneNumber: string;
  phoneCode: Subject<string>;
  password: Subject<string>;
}
