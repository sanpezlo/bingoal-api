import { genSalt, hash } from 'bcrypt';

import { UsersRepository } from '@root/users/users.repository';
import { User } from '@root/users/schemas/user.schema';
import { Role } from '@root/users/interfaces/user.interface';

export const _users: User[] = [
  {
    email: 'example1@mail.com',
    name: 'example1',
    password: 'password1',
    roles: [Role.Admin],
  },
  { email: 'example2@mail.com', name: 'example2', password: 'password2' },
];

export async function createUser(usersRepository: UsersRepository, user: User) {
  const salt = await genSalt(10);

  return usersRepository.toJSON(
    await usersRepository.create({
      ...user,
      password: await hash(user.password, salt),
    }),
  );
}
