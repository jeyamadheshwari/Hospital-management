import {repository} from '@loopback/repository';
import {post, get, put, del, requestBody, param, HttpErrors} from '@loopback/rest';
import {PatientRepository} from '../repositories';
import {inject} from '@loopback/core';
import {RestBindings} from '@loopback/rest';

export class PatientController {
  constructor(
    @repository(PatientRepository) public repo: PatientRepository,
  ) {}

  // Create patient profile (ONLY if role = patient)
  @post('/patients')
  async create(
    @requestBody() body: any,
    @inject(RestBindings.Http.REQUEST) req: any,
  ) {
    const user = req.user;

    if (user.role !== 'patient') {
      throw new HttpErrors.Forbidden('Only patients can create their profile');
    }

    return this.repo.create({...body, userId: user.id});
  }

  // Get logged-in patient profile
  @get('/patients/me')
  async getMe(@inject(RestBindings.Http.REQUEST) req: any) {
    const user = req.user;

    const profile = await this.repo.findOne({where: {userId: user.id}});
    if (!profile) throw new HttpErrors.NotFound('Patient profile not found');

    return profile;
  }

  // Update logged-in patient profile
  @put('/patients/me')
  async update(
    @requestBody() body: any,
    @inject(RestBindings.Http.REQUEST) req: any,
  ) {
    const user = req.user;
    await this.repo.updateAll(body, {userId: user.id});
    return {message: 'Patient profile updated'};
  }

  // Delete logged-in patient profile
  @del('/patients/me')
  async delete(@inject(RestBindings.Http.REQUEST) req: any) {
    const user = req.user;
    await this.repo.deleteAll({userId: user.id});
    return {message: 'Patient profile deleted'};
  }
}
