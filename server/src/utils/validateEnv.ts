import {cleanEnv, str, num} from 'envalid';

export function validateEnv() {
    cleanEnv(process.env, {
        PORT: num(),
        MONGO_URL: str(),
    });
}