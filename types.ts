
export interface ExtractedData {
  fullName: string;
  dob: string;
  idNumber: string;
  issuePlace: string;
  passportNumber: string;
  passportExpiry: string;
}

export enum ProcessState {
  IDLE = 'IDLE',
  PROCESSING = 'PROCESSING',
  SUCCESS = 'SUCCESS',
  ERROR = 'ERROR',
}
