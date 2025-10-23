import {repository} from '@loopback/repository';
import {post, requestBody} from '@loopback/rest';
import {UserRepository} from '../repositories';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';

export class AuthController {
  constructor(
    @repository(UserRepository)
    public userRepo: UserRepository,
  ) {}

  @post('/register')
  async register(
    @requestBody() body: {email: string; password: string; role: string},
  ) {
    if (!['doctor', 'patient'].includes(body.role)) {
      return {message: 'Role must be either doctor or patient'};
    }

    const hashed = await bcrypt.hash(body.password, 10);
    await this.userRepo.create({
      email: body.email,
      password: hashed,
      role: body.role,
    });
    return {message: 'User registered successfully'};
  }

  @post('/login')
  async login(@requestBody() body: {email: string; password: string}) {
    const user = await this.userRepo.findOne({where: {email: body.email}});
    if (!user) return {message: 'User not found'};

    const match = await bcrypt.compare(body.password, user.password);
    if (!match) return {message: 'Incorrect password'};

    const token = jwt.sign(
      {id: user.id, email: user.email, role: user.role},
      'MY_SECRET',
      {expiresIn: '1h'},
    );

    return {token, role: user.role};
  }
}
