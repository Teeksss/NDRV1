import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';

// Services
import { EntityService } from './entity.service';

// Entities
import { NetworkEntity, NetworkEntitySchema } from './entities/network-entity.entity';
import { EntityGroup, EntityGroupSchema } from './entities/entity-group.entity';
import { EntityRelationship, EntityRelationshipSchema } from './entities/entity-relationship.entity';

@Module({
  imports: [
    ConfigModule,
    MongooseModule.forFeature([
      { name: NetworkEntity.name, schema: NetworkEntitySchema },
      { name: EntityGroup.name, schema: EntityGroupSchema },
      { name: EntityRelationship.name, schema: EntityRelationshipSchema }
    ])
  ],
  providers: [
    EntityService
  ],
  exports: [
    EntityService
  ]
})
export class EntityModule {}