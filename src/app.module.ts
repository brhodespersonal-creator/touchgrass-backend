/* eslint-disable prettier/prettier */
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { HabitsModule } from './habits/habits.module';
import { AchievementsModule } from './achievements/achievements.module';
import { ActivityModule } from './activity/activity.module';
import { QuestsModule } from './quests/quests.module';

@Module({
    imports: [
        // Load .env file globally so all modules can use ConfigService
        ConfigModule.forRoot({ isGlobal: true }),

        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                type: 'postgres',
                host:     config.get<string>('DB_HOST', 'localhost'),
                port:     config.get<number>('DB_PORT', 5432),
                username: config.get<string>('DB_USERNAME', 'postgres'),
                password: config.get<string>('DB_PASSWORD'),
                database: config.get<string>('DB_NAME', 'touchgrass'),
                autoLoadEntities: true,
                // Set DISABLE_SYNC=true in your production .env to prevent
                // TypeORM from auto-modifying your live database schema.
                synchronize: config.get<string>('DISABLE_SYNC') !== 'true',
            }),
        }),

        UsersModule,
        AuthModule,
        HabitsModule,
        AchievementsModule,
        ActivityModule,
        QuestsModule,
    ],
})
export class AppModule {}
