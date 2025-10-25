import {inject} from '@loopback/core';
import {DefaultCrudRepository} from '@loopback/repository';
import {ApdbDataSource} from '../datasources';
import {User, UserRelations} from '../models/user.model';

export class UserRepository extends DefaultCrudRepository<
  User,
  typeof User.prototype.id,
  UserRelations
> {
  constructor(
    @inject('datasources.apdb') dataSource: ApdbDataSource,
  ) {
    super(User, dataSource);
  }
}
