import {Entity, model, property} from '@loopback/repository';

@model()
export class Doctor extends Entity {
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
  userId: number; // link JWT user

  @property({
    type: 'string',
    required: true,
  })
  name: string;

  @property({
    type: 'string',
    required: true,
  })
  specialization: string;

  @property({
    type: 'number',
  })
  experience?: number;

  @property({
    type: 'array',
    itemType: 'object',
    required: false,
  })
  availability?: {
    day: string;
    startTime: string;
    endTime: string;
  }[];

  @property({
    type: 'string',
    required: true,
  })
  email: string;

  @property({
    type: 'string',
    required: true,
  })
  password: string;

  constructor(data?: Partial<Doctor>) {
    super(data);
  }
}
