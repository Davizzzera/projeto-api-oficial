import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/database.service';
import { Prisma } from '@repo/database';

@Injectable()
export class UserRepository {
  constructor(private readonly db: DatabaseService) { }

  async findById(id: string) {
    return this.db.getClient().user.findFirst({
      where: {
        id,
        deletedAt: null,
      },
    });
  }

  async findByEmail(email: string) {
    return this.db.getClient().user.findFirst({
      where: {
        emailNormalized: email.toLowerCase().trim(),
        deletedAt: null,
      },
    });
  }

  // Não tem getById() isolado pois precisamos usar findById
  // O usuário está vinculado à organização via membership, 
  // então na camada de serviço verificaremos a organização (ou via tenant context no futuro)
}
