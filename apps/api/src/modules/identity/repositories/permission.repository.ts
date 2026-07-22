import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../../../infrastructure/database/database.service';

@Injectable()
export class PermissionRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll() {
    return this.db.getClient().permission.findMany({
      orderBy: {
        createdAt: 'asc'
      }
    });
  }
}
