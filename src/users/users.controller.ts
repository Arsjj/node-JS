import "reflect-metadata";
import { sign } from "jsonwebtoken";
import { AuthGuard } from "../common/auth.guard";
import { ILogger } from "../logger/logger.interface";
import { HTTPError } from "../errors/http-error.class";
import { BaseController } from "../common/base.controller";
import { UserLoginDto } from "./dto/user-login.dto";
import { IUsersController } from "./users.controller.interface";
import { IUserService } from "./users.service.interface";
import { UserRegisterDto } from "./dto/user-register.dto";
import { ValidateMiddleware } from "../common/validate.middleware";
import { IConfigService } from "../config/config.service.interface";
import { NextFunction, Request, Response } from "express";
import { inject, injectable } from "inversify";
import { TYPES } from "../types";

@injectable()
export class UserController extends BaseController implements IUsersController {
  constructor(
    @inject(TYPES.ILogger) private loggerService: ILogger,
    @inject(TYPES.UserService) private userService: IUserService,
    @inject(TYPES.ConfigService) private configService: IConfigService
  ) {
    super(loggerService);

    this.bindRoutes([
      {
        path: "/login",
        method: "post",
        func: this.login,
        middlewares: [new ValidateMiddleware(UserLoginDto)],
      },
      {
        path: "/register",
        method: "post",
        func: this.register,
        middlewares: [new ValidateMiddleware(UserRegisterDto)],
      },
      {
        path: "/info",
        method: "get",
        func: this.info,
        middlewares: [new AuthGuard()],
      },
    ]);
  }

  async login(
    req: Request<{}, {}, UserLoginDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const result = await this.userService.validateUser(req.body);
    if (!result) {
      return next(new HTTPError(401, "Authorization error"));
    }
    const jwt = await this.signJWT(
      req.body.email,
      this.configService.get("SECRET")
    );
    this.ok(res, { jwt });
  }

  async register(
    { body }: Request<{}, {}, UserRegisterDto>,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const result = await this.userService.createUser(body);
    if (!result) {
      return next(new HTTPError(422, "already registered user"));
    }
    console.log(body);
    this.ok(res, { email: result.email, id: result.id });
    // next(new HTTPError(401, "Registration error"));
  }

  async info(
    { user }: Request<{}, {}, UserRegisterDto>,
    res: Response,
    next: NextFunction
  ) {
    console.log(user);
    const userInfo = await this.userService.getUserInfo(user as string);
    this.ok(res, { email: userInfo?.email, id: userInfo?.id });
  }

  private signJWT(email: string, secret: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      sign(
        {
          email,
          iat: Math.floor(Date.now() / 1000),
        },
        secret,
        {
          algorithm: "HS256",
        },
        (err, token) => {
          if (err) {
            reject(err);
          }
          resolve(token as string);
        }
      );
    });
  }
}
