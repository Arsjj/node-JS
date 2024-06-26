import { App } from "./app";
import { ILogger } from "./logger/logger.interface";
import { LoggerService } from "./logger/logger.service";
import { ExeptionFilter } from "./errors/exeption.filter";
import { UserController } from "./users/users.controller";
import { Container, ContainerModule, interfaces } from "inversify";
import { IExeptionFilter } from "./errors/exeption.filter.interface";
import { TYPES } from "./types";
import { IUserService } from "./users/users.service.interface";
import { IUsersController } from "./users/users.controller.interface";
import { UserService } from "./users/users.service";
import { IConfigService } from "./config/config.service.interface";
import { ConfigService } from "./config/config.service";
import { PrismaService } from "./database/prisma.service";
import { UsersRepository } from "./users/users.repository";
import { IUsersRepository } from "./users/users.repository.interface";

export const appBindings = new ContainerModule((bind: interfaces.Bind) => {
  bind<ILogger>(TYPES.ILogger).to(LoggerService).inSingletonScope();
  bind<IExeptionFilter>(TYPES.ExeptionFilter).to(ExeptionFilter);
  bind<IUsersController>(TYPES.UserController).to(UserController);
  bind<IUserService>(TYPES.UserService).to(UserService);
  bind<PrismaService>(TYPES.PrismaService).to(PrismaService).inSingletonScope();
  bind<IUsersRepository>(TYPES.UsersRepository)
    .to(UsersRepository)
    .inSingletonScope();
  bind<IConfigService>(TYPES.ConfigService)
    .to(ConfigService)
    .inSingletonScope();
  bind<App>(TYPES.Application).to(App);
});

function bootStrap() {
  const appContainer = new Container();
  appContainer.load(appBindings);
  const app = appContainer.get<App>(TYPES.Application);
  app.init();
  return { app, appContainer };
}

export const { app, appContainer } = bootStrap();
