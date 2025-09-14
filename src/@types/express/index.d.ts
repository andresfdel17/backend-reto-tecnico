import { ILoginUser } from '../controllers';

declare global {
    namespace Express {
        interface Request {
            actualUser?: ILoginUser;
        }
    }
}
