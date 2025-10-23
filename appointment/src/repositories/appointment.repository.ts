import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {ApdbDataSource} from '../datasources';
import {Appointment, AppointmentRelations} from '../models/appointment.model';

export class AppointmentRepository extends DefaultCrudRepository<
  Appointment,
  typeof Appointment.prototype.id,
  AppointmentRelations
> {
  constructor(
    @inject('datasources.apdb') dataSource: ApdbDataSource,
  ) {
    super(Appointment, dataSource);
  }
}
