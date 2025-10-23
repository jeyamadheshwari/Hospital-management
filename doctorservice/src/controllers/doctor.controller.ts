import {repository} from '@loopback/repository';
import {post, get, put, del, requestBody, HttpErrors, param} from '@loopback/rest';
import {DoctorRepository} from '../repositories';
import {inject} from '@loopback/core';
import {RestBindings} from '@loopback/rest';
import {Doctor} from '../models/doctor.model';

export class DoctorController {
  doctorRepo: any;
  constructor(
    @repository(DoctorRepository) public repo: DoctorRepository,
  ) {}

  // Create doctor profile (only role = doctor)
  @post('/doctor/profile')
  async create(
    @requestBody() body: any,
    @inject(RestBindings.Http.REQUEST) req: any,
  ) {
    const user = req.user;
    if (user.role !== 'doctor') {
      throw new HttpErrors.Forbidden('Only doctors can create their profile');
    }

    return this.repo.create({...body, userId: user.id});
  }

  // Get logged-in doctor profile
  @get('/doctor/me')
  async getMe(@inject(RestBindings.Http.REQUEST) req: any) {
    const user = req.user;
    const profile = await this.repo.findOne({where: {userId: user.id}});
    if (!profile) throw new HttpErrors.NotFound('Doctor profile not found');
    return profile;
  }
   @get('/doctor/{id}')
async findById(@param.path.number('id') id: number): Promise<Doctor> {
  return this.repo.findById(id); // use 'repo', not 'doctorRepo'
}


  // Update doctor profile
  @put('/doctor/me')
  async update(
    @requestBody() body: any,
    @inject(RestBindings.Http.REQUEST) req: any,
  ) {
    const user = req.user;
    await this.repo.updateAll(body, {userId: user.id});
    return {message: 'Doctor profile updated'};
  }

  // Delete doctor profile
  @del('/doctor/me')
  async delete(@inject(RestBindings.Http.REQUEST) req: any) {
    const user = req.user;
    await this.repo.deleteAll({userId: user.id});
    return {message: 'Doctor profile deleted'};
  }
}
