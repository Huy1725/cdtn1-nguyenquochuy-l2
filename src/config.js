// Doc cau hinh tu bien moi truong MOT lan khi khoi dong. Thieu bien bat buoc thi dung ngay,
// chi in TEN bien (khong bao gio in gia tri) de nguoi trien khai biet can bo sung gi trong .env.
const REQUIRED = ["DB_HOST", "DB_NAME", "DB_USER", "DB_PASSWORD", "JWT_SECRET"];
const MIN_JWT_SECRET_LENGTH = 32;

export function loadConfig(env = process.env) {
  const missing = REQUIRED.filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`Thieu bien moi truong: ${missing.join(", ")} - xem .env.example`);
  }
  if (env.JWT_SECRET.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET phai co it nhat ${MIN_JWT_SECRET_LENGTH} ky tu - xem .env.example`);
  }
  return {
    port: Number(env.PORT ?? 3000),
    db: {
      host: env.DB_HOST,
      port: Number(env.DB_PORT ?? 3306),
      name: env.DB_NAME,
      user: env.DB_USER
    },
    jwtSecret: env.JWT_SECRET,
    corsOrigin: env.CORS_ORIGIN ?? "http://localhost:5173"
  };
}
