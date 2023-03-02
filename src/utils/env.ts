import * as dotenv from 'dotenv';

function env(key: string): string {
  return dotenv.config().parsed[key];
}

export default env;
