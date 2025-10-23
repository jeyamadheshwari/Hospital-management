import {Entity, model, property} from '@loopback/repository';

@model()
export class Appointment extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  doctorId: number;

  @property({
    type: 'number',
    required: true,
  })
  patientId: number;

  @property({
    type: 'string',
    required: true,
  })
  appointmentDate: string; // YYYY-MM-DD

  @property({
    type: 'string',
    required: true,
  })
  startTime: string; // "10:00"

  @property({
    type: 'string',
    required: true,
  })
  endTime: string; // "11:00"

  @property({
    type: 'string',
    default: 'scheduled',
  })
  status?: string; // scheduled / completed / cancelled

  constructor(data?: Partial<Appointment>) {
    super(data);
  }
}

export interface AppointmentRelations {}
export type AppointmentWithRelations = Appointment & AppointmentRelations;
