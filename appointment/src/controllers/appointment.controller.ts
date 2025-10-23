import {repository} from '@loopback/repository';
import {post, get, del, requestBody, param, HttpErrors} from '@loopback/rest';
import {DoctorRepository} from '../repositories/doctor.repository';
import{AppointmentRepository} from '../repositories/appointment.repository';    
import {inject} from '@loopback/core';
import {RestBindings} from '@loopback/rest';

export class AppointmentController {
  constructor(
    @repository(AppointmentRepository)
    public appointmentRepo: AppointmentRepository,

    @repository(DoctorRepository)
    public doctorRepo: DoctorRepository, //  Inject Doctor repo
  ) {}

  //  Book an appointment (only patients)
  @post('/appointments')
  async create(
    @requestBody() body: any,
    @inject(RestBindings.Http.REQUEST) req: any,
  ) {
    const user = req.user;
    if (!user || user.role !== 'patient') {
      throw new HttpErrors.Forbidden('Only patients can book appointments');
    }

    const {doctorId, appointmentDate, startTime, endTime} = body;
    const date = new Date(appointmentDate);
    const weekday = date.toLocaleDateString('en-US', {weekday: 'short'}); // Mon, Tue, etc.

    // Fetch doctor directly from repository
    const doctor = await this.doctorRepo.findById(doctorId);
    if (!doctor) throw new HttpErrors.NotFound('Doctor not found');

    // Check doctor availability
    const available = doctor.availability?.some(
      (slot: any) =>
        slot.day === weekday &&
        startTime >= slot.startTime &&
        endTime <= slot.endTime,
    );
    if (!available) {
      throw new HttpErrors.BadRequest(`Doctor not available on ${weekday} at that time`);
    }

    // Prevent overlapping appointments
    const existing = await this.appointmentRepo.findOne({
      where: {
        doctorId,
        appointmentDate,
        and: [
          {startTime: {lt: endTime}},
          {endTime: {gt: startTime}},
        ],
      },
    });
    if (existing) {
      throw new HttpErrors.BadRequest('This time slot is already booked');
    }

    // Save appointment
    return this.appointmentRepo.create({
      doctorId,
      patientId: user.id,
      appointmentDate,
      startTime,
      endTime,
      status: 'scheduled',
    });
  }

  // Get my appointments (patients)
  @get('/appointments/me')
  async getMyAppointments(@inject(RestBindings.Http.REQUEST) req: any) {
    const user = req.user;
    if (!user || user.role !== 'patient') {
      throw new HttpErrors.Forbidden('Only patients can view their appointments');
    }
    return this.appointmentRepo.find({where: {patientId: user.id}});
  }

  // Cancel an appointment (patients)
  @del('/appointments/{id}')
  async cancelAppointment(
    @param.path.number('id') id: number,
    @inject(RestBindings.Http.REQUEST) req: any,
  ) {
    const user = req.user;
    const appointment = await this.appointmentRepo.findById(id);
    if (!appointment) throw new HttpErrors.NotFound('Appointment not found');
    if (appointment.patientId !== user.id) {
      throw new HttpErrors.Forbidden('Not authorized to cancel this appointment');
    }

    await this.appointmentRepo.deleteById(id);
    return {message: 'Appointment cancelled'};
  }

  // Get doctor schedule with already booked slots
  @get('/appointments/doctor/{doctorId}/schedule')
  async getDoctorSchedule(@param.path.number('doctorId') doctorId: number) {
    const doctor = await this.doctorRepo.findById(doctorId);
    if (!doctor) throw new HttpErrors.NotFound('Doctor not found');

    const booked = await this.appointmentRepo.find({where: {doctorId}});

    return {
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
      },
      availability: doctor.availability,
      alreadyBooked: booked.map(a => ({
        date: a.appointmentDate,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    };
  }
}
