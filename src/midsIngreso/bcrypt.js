import bcrypt from "bcrypt"

export function createHash(frase) {
    return bcrypt.hashSync(frase, bcrypt.genSaltSync(10))
}

export const isValidPassword = (user, password) =>
  bcrypt.compareSync(password, user.password);

