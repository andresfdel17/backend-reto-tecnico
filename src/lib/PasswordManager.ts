import bcrypt from 'bcryptjs';

export class PasswordManager {
    /**
     * @remarks
     * Hashea una contrasena
     * @param password Contrasena a hashear
     * @returns La contrasena codificada
     */
    static async hashPassword(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(12);
        const pass = await bcrypt.hash(password, salt);
        return pass;
    }
    /**
     * @remarks
     * Valida si una contraseña es corecta
     * @param password contraseña a validar
     * @param hash Hash guardado previamente
     * @returns Verdadero o false
     */
    static async comparePassword(password: string, hash: string): Promise<boolean> {
        return bcrypt.compare(password, hash);
    }
}
