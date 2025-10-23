import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {DocDataSource} from '../datasources';
import {Doctor} from '../models/doctor.model';

export class DoctorRepository extends DefaultCrudRepository<
  Doctor,
  typeof Doctor.prototype.id
> {
  constructor(
    @inject('datasources.doc') dataSource: DocDataSource,
  ) {
    super(Doctor, dataSource);
  }
}
