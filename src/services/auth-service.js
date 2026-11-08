import { AppError } from "../errors/AppError.js";
import { DUMMY_HASH, verifyPassword } from "../security/password.js";
import { signToken, verifyToken } from "../security/token.js";

// Mot ca lam viec; het han thi dang nhap lai.
export const TOKEN_TTL_SECONDS = 8 * 60 * 60;

function unauthorized(message = "Can dang nhap de thuc hien thao tac nay") {
  return new AppError("UNAUTHORIZED", message);
}

// Chi tra ra thong tin cong khai cua nhan vien, khong bao gio kem password_hash.
function publicStaff(staff) {
  return { staff_id: staff.staff_id, username: staff.username, full_name: staff.full_name };
}

export class AuthService {
  constructor({ staffRepository, secret, clock = () => new Date() }) {
    this.staff = staffRepository;
    this.secret = secret;
    this.clock = clock;
  }

  // Sai ten dang nhap hay sai mat khau deu tra cung mot loi, khong tiet lo tai khoan nao ton tai.
  async login({ username, password }) {
    const staff = await this.staff.findByUsername(username);
    const passwordOk = verifyPassword(password, staff?.password_hash ?? DUMMY_HASH);
    if (!staff || !passwordOk || !staff.is_active) {
      throw new AppError("INVALID_CREDENTIALS", "Sai ten dang nhap hoac mat khau");
    }
    const token = signToken({ sub: staff.staff_id }, this.secret, TOKEN_TTL_SECONDS, this.clock());
    return { token, expires_in: TOKEN_TTL_SECONDS, staff: publicStaff(staff) };
  }

  // Tra ve nhan vien dang dang nhap; token thieu/sai/het han, hoac tai khoan bi khoa -> UNAUTHORIZED.
  async authenticate(token) {
    if (!token) throw unauthorized();
    const claims = verifyToken(token, this.secret, this.clock());
    if (!claims) throw unauthorized("Phien dang nhap khong hop le hoac da het han");
    const staff = await this.staff.findById(claims.sub);
    if (!staff || !staff.is_active) throw unauthorized("Phien dang nhap khong hop le hoac da het han");
    return publicStaff(staff);
  }
}
