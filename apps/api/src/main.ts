import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');

  app.enableCors({
    origin:
      process.env.NODE_ENV === 'development'
        ? true
        : ['https://production-domain.com'],
    credentials: true,
  });

  await app.listen(process.env.API_PORT ?? 3000);
}
void bootstrap();
