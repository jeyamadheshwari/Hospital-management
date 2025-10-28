import {repository} from '@loopback/repository';
import {post, get, del, requestBody, param, HttpErrors} from '@loopback/rest';
import {DoctorRepository} from '../repositories/doctor.repository';
import {AppointmentRepository} from '../repositories/appointment.repository';
import {UserRepository} from '../repositories/user.repository';
import {inject} from '@loopback/core';
import {RestBindings} from '@loopback/rest';
import {EmailService} from '../services/email.service';

export class AppointmentController {
  constructor(
    @repository(AppointmentRepository)
    public appointmentRepo: AppointmentRepository,

    @repository(DoctorRepository)
    public doctorRepo: DoctorRepository,

    @repository(UserRepository)
    public userRepo: UserRepository,
  ) {}

  // sstatus update
  async updateStatusIfNeeded() {
    const appointments = await this.appointmentRepo.find();
    const today = new Date().toISOString().split('T')[0];

    for (const a of appointments) {
      if (a.status !== 'cancelled' && a.appointmentDate < today) {
        a.status = 'completed';
        await this.appointmentRepo.updateById(a.id!, a);
      }
    }
  }

  // Book an appointment (only patients)
  @post('/appointments')
  async create(
    @requestBody() body: any,
    @inject(RestBindings.Http.REQUEST) req: any,
  ) {
    await this.updateStatusIfNeeded();
    const user = req.user;
    if (!user || user.role !== 'patient') {
      throw new HttpErrors.Forbidden('Only patients can book appointments');
    }

    const {doctorId, appointmentDate, startTime, endTime} = body;
    const date = new Date(appointmentDate);
    const weekday = date.toLocaleDateString('en-US', {weekday: 'short'});

    const doctor = await this.doctorRepo.findById(doctorId);
    if (!doctor) throw new HttpErrors.NotFound('Doctor not found');

    const available = doctor.availability?.some(
      (slot: any) =>
        slot.day === weekday &&
        startTime >= slot.startTime &&
        endTime <= slot.endTime,
    );
    if (!available) {
      throw new HttpErrors.BadRequest(
        `Doctor not available on ${weekday} at this time`,
      );
    }

    const existing = await this.appointmentRepo.findOne({
      where: {
        doctorId,
        appointmentDate,
        and: [{startTime: {lt: endTime}}, {endTime: {gt: startTime}}],
      },
    });
    if (existing) {
      throw new HttpErrors.BadRequest('This time slot is already booked');
    }

    const appointment = await this.appointmentRepo.create({
      doctorId,
      patientId: user.id,
      appointmentDate,
      startTime,
      endTime,
      status: 'scheduled',
    });

    // Send Email Notifications
    const patient = await this.userRepo.findById(user.id);
    const emailService = new EmailService();

    await emailService.sendMail(
      doctor.email,
      'New Appointment Booked',
      `An appointment has been booked by patient ${patient.email} on ${appointmentDate} from ${startTime} to ${endTime}.`,
    );

    await emailService.sendMail(
      patient.email,
      'Appointment Confirmed',
      `Your appointment with Dr. ${doctor.name} is confirmed for ${appointmentDate} from ${startTime} to ${endTime}.`,
    );

    return appointment;
  }

  // ✅ New Endpoint: Get all doctor availability (AV2 format)
  @get('/appointments/doctor-availability')
  async getAllDoctorAvailability() {
    await this.updateStatusIfNeeded();

    const doctors = await this.doctorRepo.find();
    const result = [];

    for (const doc of doctors) {
      const booked = await this.appointmentRepo.find({
        where: {doctorId: doc.id, status: {neq: 'cancelled'}},
      });

      const bookedSlots = booked.map(b => ({
        date: b.appointmentDate,
        startTime: b.startTime,
        endTime: b.endTime,
      }));

      result.push({
        doctorId: doc.id,
        doctorName: doc.name,
        specialization: doc.specialization,
        availability: doc.availability || [],
        booked: bookedSlots,
      });
    }

    return result;
  }

  // Get my appointments (patients)
  @get('/appointments/me')
  async getMyAppointments(@inject(RestBindings.Http.REQUEST) req: any) {
    await this.updateStatusIfNeeded();
    const user = req.user;
    if (!user || user.role !== 'patient') {
      throw new HttpErrors.Forbidden('Only patients can view their appointments');
    }
    return this.appointmentRepo.find({where: {patientId: user.id}});
  }

  // Cancel appointment (emails both doctor & patient)
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

    const doctor = await this.doctorRepo.findById(appointment.doctorId);
    const patient = await this.userRepo.findById(user.id);
    const emailService = new EmailService();

    await emailService.sendMail(
      doctor.email,
      'Appointment Cancelled',
      `The patient ${patient.email} has cancelled the appointment scheduled on ${appointment.appointmentDate} from ${appointment.startTime} to ${appointment.endTime}.`,
    );

    await emailService.sendMail(
      patient.email,
      'Appointment Cancellation Successful',
      `Your appointment with Dr. ${doctor.name} on ${appointment.appointmentDate} from ${appointment.startTime} to ${appointment.endTime} has been cancelled successfully.`,
    );

    appointment.status = 'cancelled';
    await this.appointmentRepo.updateById(id, appointment);

    return {message: 'Appointment cancelled and notifications sent'};
  }

  // Doctor schedule (includes booked slots)
  @get('/appointments/doctor/{doctorId}/schedule')
  async getDoctorSchedule(@param.path.number('doctorId') doctorId: number) {
    await this.updateStatusIfNeeded();
    const doctor = await this.doctorRepo.findById(doctorId);
    if (!doctor) throw new HttpErrors.NotFound('Doctor not found');

    const booked = await this.appointmentRepo.find({
      where: {doctorId, status: {neq: 'cancelled'}},
    });

    return {
      doctor: {
        id: doctor.id,
        name: doctor.name,
        specialization: doctor.specialization,
      },
      availability: doctor.availability,
      booked: booked.map(a => ({
        date: a.appointmentDate,
        startTime: a.startTime,
        endTime: a.endTime,
      })),
    };
  }
}
