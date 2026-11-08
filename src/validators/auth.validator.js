import { collect, requiredString } from "./common.js";

export function validateLogin(input) {
  return collect((fields) => {
    const username = requiredString(fields, input, "username", 50);
    // Mat khau giu nguyen tung ky tu (khong cat khoang trang nhu cac truong khac).
    const password = input?.password;
    if (typeof password !== "string" || password.length === 0) {
      fields.password = "Truong bat buoc, khong duoc de trong";
    } else if (password.length > 200) {
      fields.password = "Toi da 200 ky tu";
    }
    return { username, password };
  });
}
